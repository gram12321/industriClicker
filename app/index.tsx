import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  List,
  IconButton,
  Menu,
  Portal,
  ProgressBar,
  Surface,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import type { Finance, FinanceTransaction } from '@/game/finance/finance';
import type { Inventory } from '@/game/inventory/inventory';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import { FACILITY_TYPES, type FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityDefinition } from '@/game/facilities/facilityRegistry';
import { getResourceIcon } from '@/game/resources/resourceIcons';
import { RESOURCE_TYPES } from '@/game/resources/resourceTypes';
import { getResource } from '@/game/resources/resourcesRegistry';
import type { Recipe } from '@/game/recipes/recipeTypes';
import { useGameStore } from '@/stores/gameStore';
import { styles } from './index.styles';

type DashboardTab = 'company' | 'inventory' | 'production' | 'finance';

const tabs: Array<{ key: DashboardTab; label: string; symbol: string }> = [
  { key: 'company', label: 'Company', symbol: '⌂' },
  { key: 'inventory', label: 'Inventory', symbol: '▣' },
  { key: 'production', label: 'Production', symbol: '⚙' },
  { key: 'finance', label: 'Finance', symbol: '¤' },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('company');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isConstructionYardOpen, setIsConstructionYardOpen] = useState(false);
  const [pendingConstruction, setPendingConstruction] = useState<FacilityType | null>(null);
  const [pendingDestruction, setPendingDestruction] = useState<FacilityType | null>(null);
  const inventory = useGameStore((state) => state.inventory);
  const facilities = useGameStore((state) => state.facilities);
  const finance = useGameStore((state) => state.finance);
  const buildFacility = useGameStore((state) => state.buildFacility);
  const destroyFacility = useGameStore((state) => state.destroyFacility);
  const setFacilityRecipe = useGameStore((state) => state.setFacilityRecipe);
  const fastForwardOneMinute = useGameStore((state) => state.fastForwardOneMinute);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.topBar}>
            <View style={styles.balanceInline}>
              <Text accessibilityLabel="Balance icon" style={styles.coinIcon}>🪙</Text>
              <Text style={styles.balanceInlineValue}>{formatCurrency(finance.getBalance())}</Text>
            </View>
            <View style={styles.headerActions}>
              <IconButton
                accessibilityLabel="Notifications placeholder"
                icon="bell-outline"
                iconColor={colors.onDark}
                onPress={() => undefined}
              />
              <Menu
                anchor={
                  <Pressable
                    accessibilityLabel="Open profile menu"
                    accessibilityRole="button"
                    onPress={() => setIsProfileMenuOpen(true)}
                    style={styles.profileButton}
                  >
                    <Avatar.Text label="IC" size={38} style={styles.avatar} />
                  </Pressable>
                }
                onDismiss={() => setIsProfileMenuOpen(false)}
                visible={isProfileMenuOpen}
              >
                <Menu.Item leadingIcon="account-outline" onPress={() => setIsProfileMenuOpen(false)} title="Profile" />
                <Menu.Item leadingIcon="cog-outline" onPress={() => setIsProfileMenuOpen(false)} title="Settings" />
                <Menu.Item leadingIcon="trophy-outline" onPress={() => setIsProfileMenuOpen(false)} title="Achievements" />
                <Divider />
                <Menu.Item leadingIcon="logout" onPress={() => setIsProfileMenuOpen(false)} title="Log out" />
              </Menu>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <DashboardContent
            activeTab={activeTab}
            openConstructionYard={() => setIsConstructionYardOpen(true)}
            requestFacilityDestruction={setPendingDestruction}
            facilities={facilities}
            finance={finance}
            fastForwardOneMinute={fastForwardOneMinute}
            inventory={inventory}
            setFacilityRecipe={setFacilityRecipe}
          />
        </ScrollView>

        <Surface elevation={3} style={styles.bottomNavigation}>
          {tabs.map((tab) => (
            <BottomNavigationItem
              active={activeTab === tab.key}
              key={tab.key}
              label={tab.label}
              onPress={() => setActiveTab(tab.key)}
              symbol={tab.symbol}
            />
          ))}
        </Surface>
      </View>
      <ConstructionDialog
        facilities={facilities}
        facilityType={pendingConstruction}
        finance={finance}
        onConfirm={() => {
          if (pendingConstruction && buildFacility(pendingConstruction)) {
            setPendingConstruction(null);
          }
        }}
        onDismiss={() => setPendingConstruction(null)}
      />
      <ConstructionYardDialog
        facilities={facilities}
        finance={finance}
        onDismiss={() => setIsConstructionYardOpen(false)}
        onSelectFacility={(facilityType) => {
          setIsConstructionYardOpen(false);
          setPendingConstruction(facilityType);
        }}
        visible={isConstructionYardOpen}
      />
      <DestructionDialog
        facilityType={pendingDestruction}
        onConfirm={() => {
          if (pendingDestruction && destroyFacility(pendingDestruction)) {
            setPendingDestruction(null);
          }
        }}
        onDismiss={() => setPendingDestruction(null)}
      />
    </SafeAreaView>
  );
}

function DashboardContent({
  activeTab,
  facilities,
  finance,
  fastForwardOneMinute,
  inventory,
  openConstructionYard,
  requestFacilityDestruction,
  setFacilityRecipe,
}: {
  activeTab: DashboardTab;
  facilities: FacilityCollection;
  finance: Finance;
  fastForwardOneMinute: () => boolean;
  inventory: Inventory;
  openConstructionYard: () => void;
  requestFacilityDestruction: (facilityType: FacilityType) => void;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: Recipe['name'] | null) => boolean;
}) {
  if (activeTab === 'inventory') {
    return (
      <>
        <SectionHeading
          eyebrow="STOCK"
          title="Inventory"
          subtitle="Review the resources currently held by your company."
        />
        {RESOURCE_TYPES.map((resourceType) => {
          const resource = getResource(resourceType);
          const entry = inventory.getEntry(resourceType);

          return (
            <PlaceholderRow
              key={resourceType}
              label={`${getResourceIcon(resourceType)} ${resource.name}`}
              value={`${entry.quantity} · Quality ${entry.quality}`}
            />
          );
        })}
      </>
    );
  }

  if (activeTab === 'production') {
    return (
      <>
        <SectionHeading
          eyebrow="OPERATIONS"
          title="Facilities"
          subtitle="Manage your constructed facilities and build new ones."
        />
        <Button icon="plus" mode="contained" onPress={openConstructionYard}>
          Build facility
        </Button>
        <Button icon="fast-forward" mode="outlined" onPress={fastForwardOneMinute}>
          Fast-forward 1 minute
        </Button>
        {FACILITY_TYPES.filter((facilityType) => facilities.has(facilityType)).map((facilityType) => {
          const definition = getFacilityDefinition(facilityType);
          const facility = facilities.get(facilityType);
          const activeRecipeName = facility?.getActiveRecipeName() ?? null;
          const activeRecipe = definition.recipes.find((recipe) => recipe.name === activeRecipeName);
          const productionStatus = facility?.getProductionStatus(inventory) ?? 'not-started';
          const missingInputs = facility?.getMissingInputs(inventory) ?? [];

          return (
            <Card key={facilityType} mode="contained" style={styles.featureCard}>
              <Card.Content>
                <List.Item
                  description={activeRecipe
                    ? `${formatRecipeName(activeRecipe)} · Work ${facility?.getRecipeProgress(activeRecipe.name)}/${activeRecipe.workAmount}`
                    : 'No active recipe'}
                  left={(props) => <List.Icon {...props} icon={definition.icon} />}
                  title={definition.name}
                  titleStyle={styles.facilityTitle}
                />
                <Text style={styles.constructionYardRecipeLabel}>Production recipe</Text>
                <View style={styles.facilityRecipeControls}>
                  {definition.recipes.map((recipe) => {
                    const isSelected = activeRecipeName === recipe.name && facility?.isActive();

                    return (
                      <Button
                        compact
                        key={recipe.name}
                        mode={isSelected ? 'contained' : 'outlined'}
                        onPress={() => setFacilityRecipe(facilityType, isSelected ? null : recipe.name)}
                      >
                        {isSelected ? `Stop ${formatRecipeName(recipe)}` : `Run ${formatRecipeName(recipe)}`}
                      </Button>
                    );
                  })}
                </View>
                <FacilityProductionStatus
                  progress={activeRecipe ? facility?.getRecipeProgress(activeRecipe.name) ?? 0 : 0}
                  missingInputs={missingInputs}
                  recipe={activeRecipe ?? null}
                  status={productionStatus}
                />
                <View style={styles.facilityActions}>
                  <IconButton
                    accessibilityLabel={`Destroy ${definition.name}`}
                    icon="trash-can-outline"
                    iconColor={colors.error}
                    onPress={() => requestFacilityDestruction(facilityType)}
                    size={22}
                  />
                </View>
              </Card.Content>
            </Card>
          );
        })}
        {FACILITY_TYPES.every((facilityType) => !facilities.has(facilityType)) && (
          <PlaceholderRow label="Constructed facilities" value="None yet" />
        )}
      </>
    );
  }

  if (activeTab === 'finance') {
    return (
      <>
        <SectionHeading
          eyebrow="FINANCE"
          title="Financial overview"
          subtitle="Review your available funds and recent company transactions."
        />
        <Card mode="contained" style={styles.featureCard}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.cardKicker}>AVAILABLE FUNDS</Text>
            <Text style={styles.balanceValue}>{formatCurrency(finance.getBalance())}</Text>
            <Text style={styles.cardDescription}>Construction costs are recorded when a facility is built.</Text>
          </Card.Content>
        </Card>
        <Text style={styles.inventoryHeading} variant="titleMedium">Recent activity</Text>
        {finance.getTransactions().length === 0 ? (
          <PlaceholderRow label="Transactions" value="No transactions yet" />
        ) : (
          finance.getTransactions().slice(-3).reverse().map((transaction, index) => (
            <TransactionRow key={`${transaction.occurredAt}-${index}`} transaction={transaction} />
          ))
        )}
      </>
    );
  }

  return (
    <>
      <SectionHeading
        eyebrow="COMPANY"
        title="Company overview"
        subtitle="Your starting dashboard for the Industri Clicker prototype."
      />
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardKicker}>COMPANY PROFILE</Text>
          <Text variant="titleLarge">Starter Company</Text>
          <Text style={styles.cardDescription}>
            The company profile is a visual placeholder while the player identity system is planned.
          </Text>
        </Card.Content>
      </Card>
    </>
  );
}

function FacilityProductionStatus({
  progress,
  missingInputs,
  recipe,
  status,
}: {
  progress: number;
  missingInputs: Recipe['inputs'];
  recipe: Recipe | null;
  status: 'not-started' | 'missing-inputs' | 'producing';
}) {
  if (status === 'not-started' || !recipe) {
    return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  }

  if (status === 'missing-inputs') {
    return (
      <Text style={styles.productionError}>
        Production is paused: missing {formatRecipeInputs({ ...recipe, inputs: missingInputs })}.
      </Text>
    );
  }

  const progressPercent = Math.min(100, Math.max(0, (progress / recipe.workAmount) * 100));
  const minutesRemaining = Math.max(0, recipe.workAmount - progress);

  return (
    <View style={styles.productionProgress}>
      <View style={styles.productionProgressHeader}>
        <Text style={styles.productionValuePlaceholder}>Value/tick: —</Text>
        <Text style={styles.productionPercent}>{formatPercent(progressPercent)}</Text>
      </View>
      <ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} />
      <Text style={styles.productionTimeLeft}>{formatTimeRemaining(minutesRemaining)} left</Text>
    </View>
  );
}

function SectionHeading({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text variant="headlineSmall">{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function PlaceholderRow({ label, value }: { label: string; value: string }) {
  return (
    <Surface elevation={0} style={styles.placeholderRow}>
      <Text variant="bodyLarge">{label}</Text>
      <Text style={styles.placeholderValue}>{value}</Text>
    </Surface>
  );
}

function TransactionRow({ transaction }: { transaction: FinanceTransaction }) {
  return (
    <Surface elevation={0} style={styles.placeholderRow}>
      <View style={styles.transactionDetails}>
        <Text variant="bodyLarge">{transaction.description}</Text>
        <Text style={styles.placeholderValue}>{new Date(transaction.occurredAt).toLocaleString()}</Text>
      </View>
      <Text style={transaction.amount < 0 ? styles.transactionCost : styles.transactionIncome}>
        {formatCurrency(transaction.amount)}
      </Text>
    </Surface>
  );
}

function ConstructionYardDialog({
  facilities,
  finance,
  onDismiss,
  onSelectFacility,
  visible,
}: {
  facilities: FacilityCollection;
  finance: Finance;
  onDismiss: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  visible: boolean;
}) {
  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} style={styles.constructionYardDialog} visible={visible}>
        <Dialog.Title>Build facility</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogDescription}>
            Choose an available facility. Its recipes and final cost are shown before construction.
          </Text>
          <Text style={styles.constructionYardFunds}>
            Available funds: {formatCurrency(finance.getBalance())}
          </Text>
          <ScrollView contentContainerStyle={styles.constructionYardList} showsVerticalScrollIndicator>
            {FACILITY_TYPES.map((facilityType) => {
              const definition = getFacilityDefinition(facilityType);
              const isBuilt = facilities.has(facilityType);
              const canAfford = finance.canAfford(definition.constructionCost);

              return (
                <Card key={facilityType} mode="contained" style={styles.constructionYardCard}>
                  <Card.Content>
                    <List.Item
                      description={`Construction cost: ${formatCurrency(definition.constructionCost)}`}
                      left={(props) => <List.Icon {...props} icon={definition.icon} />}
                      title={definition.name}
                      titleStyle={styles.facilityTitle}
                    />
                    <Text style={styles.constructionYardRecipeLabel}>Available recipes</Text>
                    {definition.recipes.map((recipe) => (
                      <Text key={recipe.name} style={styles.constructionYardRecipe}>
                        {formatRecipeName(recipe)}: {formatRecipeInputs(recipe)} → {formatRecipeOutput(recipe)}
                      </Text>
                    ))}
                  </Card.Content>
                  <Card.Actions>
                    <Button
                      disabled={isBuilt || !canAfford}
                      mode="contained"
                      onPress={() => onSelectFacility(facilityType)}
                    >
                      {isBuilt ? 'Already built' : canAfford ? 'Review construction' : 'Insufficient funds'}
                    </Button>
                  </Card.Actions>
                </Card>
              );
            })}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function ConstructionDialog({
  facilities,
  facilityType,
  finance,
  onConfirm,
  onDismiss,
}: {
  facilities: FacilityCollection;
  facilityType: FacilityType | null;
  finance: Finance;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  if (facilityType === null) {
    return null;
  }

  const definition = getFacilityDefinition(facilityType);
  const canConstruct = !facilities.has(facilityType) && finance.canAfford(definition.constructionCost);
  const balanceAfterConstruction = finance.getBalance() - definition.constructionCost;

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible>
        <Dialog.Title>{`Construct ${definition.name}?`}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogDescription}>
            This confirms the construction cost before the facility is added to your company.
          </Text>
          <View style={styles.dialogSummary}>
            <PlaceholderRow label="Construction cost" value={formatCurrency(definition.constructionCost)} />
            <PlaceholderRow label="Balance after construction" value={formatCurrency(balanceAfterConstruction)} />
          </View>
          <Text variant="titleMedium" style={styles.dialogSectionHeading}>Available recipes</Text>
          {definition.recipes.map((recipe) => (
            <List.Item
              key={recipe.name}
              title={formatRecipeName(recipe)}
              description={`${formatRecipeInputs(recipe)} → ${formatRecipeOutput(recipe)} · Work ${recipe.workAmount}`}
              left={(props) => <List.Icon {...props} icon="play-circle-outline" />}
            />
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button disabled={!canConstruct} mode="contained" onPress={onConfirm}>Confirm build</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function formatRecipeInputs(recipe: Recipe): string {
  return formatRecipeInputList(recipe.inputs);
}

function formatRecipeInputList(inputs: Recipe['inputs']): string {
  if (inputs.length === 0) return 'No inputs';
  return inputs.map(({ resourceType, amount }) => `${getResource(resourceType).name} ×${amount}`).join(' + ');
}

function formatRecipeName(recipe: Recipe): string {
  switch (recipe.name) {
    case 'grow-grain': return 'Grow grain';
    case 'bake-bread': return 'Bake bread';
    case 'produce-water': return 'Produce water';
    case 'produce-electricity': return 'Produce electricity';
    default: return recipe.name;
  }
}

function formatRecipeOutput(recipe: Recipe): string {
  return `${getResource(recipe.output.resourceType).name} ×${recipe.output.amount}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

function formatTimeRemaining(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours} h` : `${hours} h ${remainingMinutes} min`;
}

function DestructionDialog({
  facilityType,
  onConfirm,
  onDismiss,
}: {
  facilityType: FacilityType | null;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  if (facilityType === null) {
    return null;
  }

  const definition = getFacilityDefinition(facilityType);

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible>
        <Dialog.Title>{`Destroy ${definition.name}?`}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogDescription}>
            This permanently removes the facility from your company. Construction funds are not refunded.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button buttonColor={colors.error} mode="contained" onPress={onConfirm} textColor={colors.onDark}>
            Confirm destruction
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });

  return `${sign}€ ${formattedAmount}`;
}

function BottomNavigationItem({
  active,
  label,
  onPress,
  symbol,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  symbol: string;
}) {
  const activeStyle: StyleProp<ViewStyle> = active ? styles.activeNavigationItem : undefined;

  return (
    <Pressable
      accessibilityLabel={`${label} tab`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.navigationItem, activeStyle]}
    >
      <Text style={[styles.navigationSymbol, active && styles.activeNavigationText]}>{symbol}</Text>
      <Text style={[styles.navigationLabel, active && styles.activeNavigationText]}>{label}</Text>
    </Pressable>
  );
}
