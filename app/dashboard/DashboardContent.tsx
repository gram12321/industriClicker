import { View } from 'react-native';
import { Button, Card, IconButton, List, ProgressBar, Surface, Text } from 'react-native-paper';
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
 type DashboardTab = 'company' | 'inventory' | 'production' | 'finance';
import { styles } from '../index.styles';
import { formatCurrency, formatPercent, formatRecipeInputs, formatRecipeName, formatTimeRemaining } from './dashboardFormatters';
export function DashboardContent({
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

export function SectionHeading({
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

export function PlaceholderRow({ label, value }: { label: string; value: string }) {
  return (
    <Surface elevation={0} style={styles.placeholderRow}>
      <Text variant="bodyLarge">{label}</Text>
      <Text style={styles.placeholderValue}>{value}</Text>
    </Surface>
  );
}

export function TransactionRow({ transaction }: { transaction: FinanceTransaction }) {
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


