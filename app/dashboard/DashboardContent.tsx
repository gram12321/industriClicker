import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, IconButton, List, ProgressBar, Surface, Text } from 'react-native-paper';
import { colors } from '@/theme';
import type { Finance, FinanceTransaction } from '@/game/finance/finance';
import type { Inventory } from '@/game/inventory/inventory';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import {
  calculateSalesContractEstimatedWaitMinutes,
  calculateSalesContractOfferChance,
  type SalesContracts,
} from '@/game/sales/salesContracts';
import { FACILITY_TYPES, type FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityDefinition } from '@/game/facilities/facilityRegistry';
import { getFacilityUpgradeCost, type FacilityUpgradeKind } from '@/game/facilities/facilityUpgrades';
import { getResourceIcon } from '@/game/resources/resourceIcons';
import { RESOURCE_TYPES } from '@/game/resources/resourceTypes';
import { getResource } from '@/game/resources/resourcesRegistry';
import type { Recipe } from '@/game/recipes/recipeTypes';
import { clamp, formatCurrency, formatDate, formatDuration, formatNumber, formatPercent } from '@/utils';
type DashboardTab = 'company' | 'inventory' | 'production' | 'sales' | 'finance';
import { styles } from '../index.styles';
import { formatRecipeInputs, formatRecipeName } from './recipeFormatters';
export function DashboardContent({
  activeTab,
  facilities,
  finance,
  fulfillSalesContract,
  inventory,
  openConstructionYard,
  requestFacilityDestruction,
  setFacilityRecipe,
  setFacilityWorkers,
  salesContracts,
  customerPipelineProgress,
  upgradeFacility,
}: {
  activeTab: DashboardTab;
  facilities: FacilityCollection;
  finance: Finance;
  fulfillSalesContract: (contractId: string) => boolean;
  inventory: Inventory;
  openConstructionYard: () => void;
  requestFacilityDestruction: (facilityType: FacilityType) => void;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: Recipe['name'] | null) => boolean;
  setFacilityWorkers: (facilityType: FacilityType, workerCount: number) => boolean;
  upgradeFacility: (facilityType: FacilityType, upgradeKind: FacilityUpgradeKind) => boolean;
  salesContracts: SalesContracts;
  customerPipelineProgress: number;
}) {
  const [collapsedFacilities, setCollapsedFacilities] = useState<Partial<Record<FacilityType, boolean>>>({});
  const [salesList, setSalesList] = useState<'offered' | 'completed'>('offered');

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
              value={`${formatNumber(entry.quantity, { smartDecimals: true })} · Quality ${formatNumber(entry.quality, { smartDecimals: true })}`}
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
        {FACILITY_TYPES.filter((facilityType) => facilities.has(facilityType)).map((facilityType) => {
          const definition = getFacilityDefinition(facilityType);
          const facility = facilities.get(facilityType);
          const activeRecipeName = facility?.getActiveRecipeName() ?? null;
          const activeRecipe = definition.recipes.find((recipe) => recipe.name === activeRecipeName);
          const productionStatus = facility?.getProductionStatus(inventory) ?? 'not-started';
          const missingInputs = facility?.getMissingInputs(inventory) ?? [];
          const assignedWorkers = facility?.getAssignedWorkers() ?? 0;
          const requiredWorkers = facility?.getRequiredWorkers() ?? 0;
          const speedUpgradeLevel = facility?.getSpeedUpgradeLevel() ?? 0;
          const outputUpgradeLevel = facility?.getOutputUpgradeLevel() ?? 0;
          const speedUpgradeCost = getFacilityUpgradeCost(definition.constructionCost, speedUpgradeLevel);
          const outputUpgradeCost = getFacilityUpgradeCost(definition.constructionCost, outputUpgradeLevel);
          const isExpanded = collapsedFacilities[facilityType] !== true;

          return (
            <Card key={facilityType} mode="contained" style={styles.featureCard}>
              <Card.Content>
                <List.Item
                  description={activeRecipe
                    ? `${formatRecipeName(activeRecipe)} · Work ${formatNumber(facility?.getRecipeProgress(activeRecipe.name) ?? 0, { smartDecimals: true })}/${formatNumber(activeRecipe.workAmount, { smartDecimals: true })}`
                    : 'No active recipe'}
                  left={(props) => <List.Icon {...props} icon={definition.icon} />}
                  right={(props) => (
                    <IconButton
                      {...props}
                      accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${definition.name}`}
                      icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                      onPress={() => setCollapsedFacilities((current) => ({
                        ...current,
                        [facilityType]: isExpanded,
                      }))}
                    />
                  )}
                  title={definition.name}
                  titleStyle={styles.facilityTitle}
                />
                {!isExpanded && activeRecipe && (
                  <FacilityProductionStatus
                    compact
                    efficiency={facility?.getEfficiency() ?? 0}
                    progress={facility?.getRecipeProgress(activeRecipe.name) ?? 0}
                    missingInputs={missingInputs}
                    recipe={activeRecipe}
                    speedMultiplier={facility?.getSpeedMultiplier() ?? 1}
                    status={productionStatus}
                  />
                )}
                {isExpanded && <>
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
                {activeRecipe && (
                  <FacilityResourceSummary
                    outputMultiplier={facility?.getOutputMultiplier() ?? 1}
                    recipe={activeRecipe}
                  />
                )}
                <FacilityProductionStatus
                  efficiency={facility?.getEfficiency() ?? 0}
                  progress={activeRecipe ? facility?.getRecipeProgress(activeRecipe.name) ?? 0 : 0}
                  missingInputs={missingInputs}
                  recipe={activeRecipe ?? null}
                  speedMultiplier={facility?.getSpeedMultiplier() ?? 1}
                  status={productionStatus}
                />
                <Text style={styles.constructionYardRecipeLabel}>Staffing</Text>
                <View style={styles.facilityStaffingControls}>
                  <IconButton
                    accessibilityLabel={`Remove worker from ${definition.name}`}
                    disabled={assignedWorkers === 0}
                    icon="minus"
                    onPress={() => setFacilityWorkers(facilityType, assignedWorkers - 1)}
                  />
                  <View style={styles.facilityStaffingSummary}>
                    <Text style={styles.facilityStaffingValue}>{formatNumber(assignedWorkers)} / {formatNumber(requiredWorkers)} workers</Text>
                    <Text style={styles.facilityStaffingDetail}>Efficiency {formatPercent(facility?.getEfficiency() ?? 0, { decimals: 0 })}</Text>
                  </View>
                  <IconButton
                    accessibilityLabel={`Add worker to ${definition.name}`}
                    icon="plus"
                    onPress={() => setFacilityWorkers(facilityType, assignedWorkers + 1)}
                  />
                </View>
                <Button compact mode="text" onPress={() => setFacilityWorkers(facilityType, requiredWorkers)}>
                  Set required staffing
                </Button>
                <Text style={styles.constructionYardRecipeLabel}>Upgrades</Text>
                <Text style={styles.facilityUpgradeSummary}>
                  Speed ×{formatNumber(facility?.getSpeedMultiplier() ?? 1, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })} · Output ×{formatNumber(facility?.getOutputMultiplier() ?? 1, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}
                </Text>
                <View style={styles.facilityUpgradeControls}>
                  <Button
                    compact
                    disabled={!finance.canAfford(speedUpgradeCost)}
                    mode="outlined"
                    onPress={() => upgradeFacility(facilityType, 'speed')}
                  >
                    {`Speed L${formatNumber(speedUpgradeLevel + 1)} · ${formatCurrency(speedUpgradeCost)}`}
                  </Button>
                  <Button
                    compact
                    disabled={!finance.canAfford(outputUpgradeCost)}
                    mode="outlined"
                    onPress={() => upgradeFacility(facilityType, 'output')}
                  >
                    {`Output L${formatNumber(outputUpgradeLevel + 1)} · ${formatCurrency(outputUpgradeCost)}`}
                  </Button>
                </View>
                  <View style={styles.facilityActions}>
                  <IconButton
                    accessibilityLabel={`Destroy ${definition.name}`}
                    icon="trash-can-outline"
                    iconColor={colors.error}
                    onPress={() => requestFacilityDestruction(facilityType)}
                    size={22}
                  />
                  </View>
                </>}
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

  if (activeTab === 'sales') {
    const unfulfilledContractCount = salesContracts.getOfferedContracts().length;
    const offerChance = calculateSalesContractOfferChance(unfulfilledContractCount);
    const estimatedWaitMinutes = calculateSalesContractEstimatedWaitMinutes(unfulfilledContractCount);
    const contracts = salesList === 'offered'
      ? salesContracts.getOfferedContracts()
      : salesContracts.getCompletedContracts();

    return (
      <>
        <SectionHeading
          eyebrow="SALES"
          title="Customer contracts"
          subtitle="Unfulfilled contracts reduce the chance of a new customer request."
        />
        <Card mode="contained" style={styles.featureCard}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.cardKicker}>CUSTOMER PIPELINE</Text>
            <Text variant="titleMedium">
              {`${formatNumber(offerChance * 100, { smartDecimals: true })}% chance per foreground minute`}
            </Text>
            <Text style={styles.cardDescription}>
              {`Estimated next customer: ${formatNumber(estimatedWaitMinutes, { smartDecimals: true })} minutes · ${formatNumber(unfulfilledContractCount)} unfulfilled`}
            </Text>
            <ProgressBar
              accessibilityLabel="Estimated progress toward the next customer"
              color={colors.primary}
              progress={customerPipelineProgress}
              style={styles.customerPipelineProgressBar}
            />
            <Text style={styles.salesAvailability}>
              {`${formatNumber(customerPipelineProgress * 100, { decimals: 0 })}% toward the estimated next customer`}
            </Text>
          </Card.Content>
        </Card>
        <View style={styles.salesFilters}>
          <Button
            mode={salesList === 'offered' ? 'contained' : 'outlined'}
            onPress={() => setSalesList('offered')}
            style={styles.salesFilterButton}
          >
            {`Unfulfilled (${unfulfilledContractCount})`}
          </Button>
          <Button
            mode={salesList === 'completed' ? 'contained' : 'outlined'}
            onPress={() => setSalesList('completed')}
            style={styles.salesFilterButton}
          >
            {`Completed (${salesContracts.getCompletedContracts().length})`}
          </Button>
        </View>
        {contracts.length === 0 ? (
          <PlaceholderRow
            label={salesList === 'offered' ? 'Customer contracts' : 'Completed contracts'}
            value={salesList === 'offered' ? 'No requests yet' : 'No completed contracts yet'}
          />
        ) : contracts.map((contract) => {
          const resource = getResource(contract.resourceType);
          const available = inventory.getAmount(contract.resourceType);
          const canFulfill = available >= contract.quantity;

          return (
            <Card key={contract.id} mode="contained" style={styles.featureCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.salesContractHeader}>
                  <View>
                    <Text variant="titleMedium">{contract.customerName}</Text>
                    <Text style={styles.cardDescription}>
                      {`${getResourceIcon(contract.resourceType)} ${resource.name} · ${formatNumber(contract.quantity)}`}
                    </Text>
                  </View>
                  <Text style={styles.salesReward}>{formatCurrency(contract.reward)}</Text>
                </View>
                {salesList === 'offered' ? (
                  <>
                    <Text style={styles.salesAvailability}>
                      {canFulfill
                        ? `In stock: ${formatNumber(available)}`
                        : `Needs ${formatNumber(contract.quantity)} · In stock: ${formatNumber(available)}`}
                    </Text>
                    <Button
                      accessibilityLabel={`Fulfill contract for ${contract.customerName}`}
                      disabled={!canFulfill}
                      mode="contained"
                      onPress={() => fulfillSalesContract(contract.id)}
                    >
                      Fulfill contract
                    </Button>
                  </>
                ) : (
                  <Text style={styles.salesAvailability}>
                    {`Completed ${formatDate(new Date(contract.fulfilledAt ?? contract.offeredAt), true)}`}
                  </Text>
                )}
              </Card.Content>
            </Card>
          );
        })}
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

function FacilityResourceSummary({
  outputMultiplier,
  recipe,
}: {
  outputMultiplier: number;
  recipe: Recipe;
}) {
  return (
    <View style={styles.facilityResourceSummary}>
      <View style={styles.facilityResourceGroup}>
        <Text style={styles.facilityResourceLabel}>Input</Text>
        <View style={styles.facilityResourceItems}>
          {recipe.inputs.length === 0 ? (
            <Text style={styles.facilityResourceEmpty}>—</Text>
          ) : recipe.inputs.map((input) => (
            <Text
              key={input.resourceType}
              accessibilityLabel={`${getResource(input.resourceType).name} ${formatNumber(input.amount, { smartDecimals: true })}`}
              style={styles.facilityResourceValue}
            >
              {getResourceIcon(input.resourceType)} {formatNumber(input.amount, { smartDecimals: true })}
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.facilityResourceArrow}>→</Text>
      <View style={styles.facilityResourceGroup}>
        <Text style={styles.facilityResourceLabel}>Output</Text>
        <Text
          accessibilityLabel={`${getResource(recipe.output.resourceType).name} ${formatNumber(recipe.output.amount * outputMultiplier, { smartDecimals: true })}`}
          style={styles.facilityResourceValue}
        >
          {getResourceIcon(recipe.output.resourceType)} {formatNumber(recipe.output.amount * outputMultiplier, { smartDecimals: true })}
        </Text>
      </View>
    </View>
  );
}

function FacilityProductionStatus({
  compact = false,
  efficiency,
  progress,
  missingInputs,
  recipe,
  speedMultiplier,
  status,
}: {
  compact?: boolean;
  efficiency: number;
  progress: number;
  missingInputs: Recipe['inputs'];
  recipe: Recipe | null;
  speedMultiplier: number;
  status: 'not-started' | 'missing-inputs' | 'producing';
}) {
  if (!recipe) {
    return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  }

  const progressPercent = clamp((progress / recipe.workAmount) * 100, 0, 100);

  if (compact) {
    return (
      <View style={styles.productionProgress}>
        <Text style={styles.productionPercent}>
          {formatPercent(progressPercent, { decimals: 0, input: 'percent' })}
        </Text>
        <ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} />
      </View>
    );
  }

  if (status === 'not-started') {
    return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  }

  if (status === 'missing-inputs') {
    return (
      <Text style={styles.productionError}>
        Production is paused: missing {formatRecipeInputs({ ...recipe, inputs: missingInputs })}.
      </Text>
    );
  }

  const workPerMinute = efficiency * speedMultiplier;
  const minutesRemaining = workPerMinute > 0
    ? Math.max(0, recipe.workAmount - progress) / workPerMinute
    : 0;

  return (
    <View style={styles.productionProgress}>
      <View style={styles.productionProgressHeader}>
        <Text style={styles.productionValuePlaceholder}>Value/tick: —</Text>
        <Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text>
      </View>
      <ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} />
      <Text style={styles.productionTimeLeft}>{formatDuration(minutesRemaining)} left</Text>
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
        <Text style={styles.placeholderValue}>{formatDate(new Date(transaction.occurredAt), true)}</Text>
      </View>
      <Text style={transaction.amount < 0 ? styles.transactionCost : styles.transactionIncome}>
        {formatCurrency(transaction.amount)}
      </Text>
    </Surface>
  );
}


