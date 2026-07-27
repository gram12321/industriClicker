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
import { useGameStore } from '@/stores/gameStore';
import { styles } from './index.styles';

type DashboardTab = 'company' | 'production' | 'finance';

const tabs: Array<{ key: DashboardTab; label: string; symbol: string }> = [
  { key: 'company', label: 'Company', symbol: '⌂' },
  { key: 'production', label: 'Production', symbol: '⚙' },
  { key: 'finance', label: 'Finance', symbol: '¤' },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('company');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [pendingConstruction, setPendingConstruction] = useState<FacilityType | null>(null);
  const [pendingDestruction, setPendingDestruction] = useState<FacilityType | null>(null);
  const inventory = useGameStore((state) => state.inventory);
  const facilities = useGameStore((state) => state.facilities);
  const finance = useGameStore((state) => state.finance);
  const buildFacility = useGameStore((state) => state.buildFacility);
  const destroyFacility = useGameStore((state) => state.destroyFacility);

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
            requestFacilityConstruction={setPendingConstruction}
            requestFacilityDestruction={setPendingDestruction}
            facilities={facilities}
            finance={finance}
            inventory={inventory}
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
  inventory,
  requestFacilityConstruction,
  requestFacilityDestruction,
}: {
  activeTab: DashboardTab;
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  requestFacilityConstruction: (facilityType: FacilityType) => void;
  requestFacilityDestruction: (facilityType: FacilityType) => void;
}) {
  if (activeTab === 'production') {
    return (
      <>
        <SectionHeading
          eyebrow="OPERATIONS"
          title="Facilities"
          subtitle="Construct a Farm or Bakery. Production rules will follow."
        />
        {FACILITY_TYPES.map((facilityType) => {
          const definition = getFacilityDefinition(facilityType);
          const facility = facilities.get(facilityType);

          return (
            <Card key={facilityType} mode="contained" style={styles.featureCard}>
              <Card.Content>
                <List.Item
                  description={facility ? 'Constructed' : `Construction cost: ${formatCurrency(definition.constructionCost)}`}
                  left={(props) => <List.Icon {...props} icon={definition.icon} />}
                  title={definition.name}
                  titleStyle={styles.facilityTitle}
                />
              </Card.Content>
              <Card.Actions>
                {facility ? (
                  <Button
                    mode="outlined"
                    onPress={() => requestFacilityDestruction(facilityType)}
                    textColor={colors.error}
                  >
                    Destroy facility
                  </Button>
                ) : (
                  <Button
                    disabled={!finance.canAfford(definition.constructionCost)}
                    mode="contained"
                    onPress={() => requestFacilityConstruction(facilityType)}
                  >
                    Review construction
                  </Button>
                )}
              </Card.Actions>
            </Card>
          );
        })}
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
      <Text style={styles.inventoryHeading} variant="titleMedium">Inventory</Text>
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
      <PlaceholderRow label="Production facilities" value="None yet" />
    </>
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
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button disabled={!canConstruct} mode="contained" onPress={onConfirm}>Confirm build</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
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
