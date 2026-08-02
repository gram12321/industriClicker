import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, IconButton, List, ProgressBar, Text } from 'react-native-paper';
import { colors } from '@/theme';
import type { Finance } from '@/game/finance/finance';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import { getFacilityDefinition } from '@/game/facilities/facilityConstants';
import type { FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityUpgradeCost, type FacilityUpgradeKind } from '@/game/facilities/facilityUpgrades';
import type { Inventory } from '@/game/inventory/inventory';
import type { Recipe } from '@/game/recipes/recipeTypes';
import { getResource, getResourceIcon } from '@/game/resources/resourceConstants';
import { clamp, formatCurrency, formatDuration, formatNumber, formatPercent } from '@/utils';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { DetailRow, SectionHeading, WorkMetric } from '../components/GameViewComponents';
import { formatRecipeInputs, formatRecipeName } from '../helpers/recipeFormatters';
import { APP_ICONS } from '@/icons';

export function ProductionView({
  facilities, finance, inventory, openConstructionYard, requestFacilityDestruction, setFacilityRecipe, setFacilityWorkers, upgradeFacility,
}: {
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  openConstructionYard: () => void;
  requestFacilityDestruction: (facilityType: FacilityType) => void;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: Recipe['name'] | null) => boolean;
  setFacilityWorkers: (facilityType: FacilityType, workerCount: number) => boolean;
  upgradeFacility: (facilityType: FacilityType, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  const [collapsedFacilities, setCollapsedFacilities] = useState<Partial<Record<FacilityType, boolean>>>({});
  const builtFacilities = facilities.getAll();

  return (
    <>
      <SectionHeading eyebrow="OPERATIONS" title="Facilities" subtitle="Manage your constructed facilities and build new ones." />
      <Button icon={APP_ICONS.add} mode="contained" onPress={openConstructionYard}>Build facility</Button>
      {builtFacilities.map((facility) => {
        const facilityType = facility.facilityType;
        const definition = getFacilityDefinition(facilityType);
        const activeRecipeName = facility.getActiveRecipeName();
        const activeRecipe = definition.recipes.find((recipe) => recipe.name === activeRecipeName);
        const productionStatus = facility.getProductionStatus(inventory);
        const missingInputs = facility.getMissingInputs(inventory);
        const assignedWorkers = facility.getAssignedWorkers();
        const requiredWorkers = facility.getRequiredWorkers();
        const speedUpgradeLevel = facility.getSpeedUpgradeLevel();
        const outputUpgradeLevel = facility.getOutputUpgradeLevel();
        const speedUpgradeCost = getFacilityUpgradeCost(definition.constructionCost, speedUpgradeLevel);
        const outputUpgradeCost = getFacilityUpgradeCost(definition.constructionCost, outputUpgradeLevel);
        const isExpanded = collapsedFacilities[facilityType] !== true;

        return (
          <Card key={facilityType} mode="contained" style={styles.featureCard}>
            <Card.Content>
              <List.Item
                description={activeRecipe ? <View><Text style={styles.cardDescription}>{formatRecipeName(activeRecipe)}</Text><WorkMetric value={`${formatNumber(facility.getRecipeProgress(activeRecipe.name), { smartDecimals: true })}/${formatNumber(activeRecipe.workAmount, { smartDecimals: true })}`} /></View> : 'No active recipe'}
                left={(props) => <List.Icon {...props} icon={definition.icon} />}
                right={(props) => <IconButton {...props} accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${definition.name}`} icon={isExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setCollapsedFacilities((current) => ({ ...current, [facilityType]: isExpanded }))} />}
                title={definition.name}
                titleStyle={styles.facilityTitle}
              />
              {!isExpanded && activeRecipe && <FacilityProductionStatus compact efficiency={facility.getEfficiency()} progress={facility.getRecipeProgress(activeRecipe.name)} missingInputs={missingInputs} recipe={activeRecipe} speedMultiplier={facility.getSpeedMultiplier()} status={productionStatus} />}
              {isExpanded && <>
                <Text style={styles.constructionYardRecipeLabel}>Production recipe</Text>
                <View style={styles.facilityRecipeControls}>
                  {definition.recipes.map((recipe) => {
                    const isSelected = activeRecipeName === recipe.name && facility.isActive();
                    return <Button compact key={recipe.name} mode={isSelected ? 'contained' : 'outlined'} onPress={() => setFacilityRecipe(facilityType, isSelected ? null : recipe.name)}>{isSelected ? `Stop ${formatRecipeName(recipe)}` : `Run ${formatRecipeName(recipe)}`}</Button>;
                  })}
                </View>
                {activeRecipe && <FacilityResourceSummary outputMultiplier={facility.getOutputMultiplier()} recipe={activeRecipe} />}
                <FacilityProductionStatus efficiency={facility.getEfficiency()} progress={activeRecipe ? facility.getRecipeProgress(activeRecipe.name) : 0} missingInputs={missingInputs} recipe={activeRecipe ?? null} speedMultiplier={facility.getSpeedMultiplier()} status={productionStatus} />
                <Text style={styles.constructionYardRecipeLabel}>Staffing</Text>
                <View style={styles.facilityStaffingControls}>
                  <IconButton accessibilityLabel={`Remove worker from ${definition.name}`} disabled={assignedWorkers === 0} icon={APP_ICONS.minus} onPress={() => setFacilityWorkers(facilityType, assignedWorkers - 1)} />
                  <View style={styles.facilityStaffingSummary}>
                    <Text style={styles.facilityStaffingValue}>{formatNumber(assignedWorkers)} / {formatNumber(requiredWorkers)} workers</Text>
                    <Text style={styles.facilityStaffingDetail}>Efficiency {formatPercent(facility.getEfficiency(), { decimals: 0 })}</Text>
                  </View>
                  <IconButton accessibilityLabel={`Add worker to ${definition.name}`} icon={APP_ICONS.add} onPress={() => setFacilityWorkers(facilityType, assignedWorkers + 1)} />
                </View>
                <Button compact mode="text" onPress={() => setFacilityWorkers(facilityType, requiredWorkers)}>Set required staffing</Button>
                <Text style={styles.constructionYardRecipeLabel}>Upgrades</Text>
                <Text style={styles.facilityUpgradeSummary}>Speed ×{formatNumber(facility.getSpeedMultiplier(), { decimals: 2, forceDecimals: true, adaptiveNearOne: false })} · Output ×{formatNumber(facility.getOutputMultiplier(), { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}</Text>
                <View style={styles.facilityUpgradeControls}>
                  <Button compact disabled={!finance.canAfford(speedUpgradeCost)} mode="outlined" onPress={() => upgradeFacility(facilityType, 'speed')}>{`Speed L${formatNumber(speedUpgradeLevel + 1)} · ${formatCurrency(speedUpgradeCost)}`}</Button>
                  <Button compact disabled={!finance.canAfford(outputUpgradeCost)} mode="outlined" onPress={() => upgradeFacility(facilityType, 'output')}>{`Output L${formatNumber(outputUpgradeLevel + 1)} · ${formatCurrency(outputUpgradeCost)}`}</Button>
                </View>
                <View style={styles.facilityActions}><IconButton accessibilityLabel={`Destroy ${definition.name}`} icon={APP_ICONS.destroy} iconColor={colors.error} onPress={() => requestFacilityDestruction(facilityType)} size={22} /></View>
              </>}
            </Card.Content>
          </Card>
        );
      })}
      {builtFacilities.length === 0 && <DetailRow label="Constructed facilities" value="None yet" />}
    </>
  );
}

function FacilityResourceSummary({ outputMultiplier, recipe }: { outputMultiplier: number; recipe: Recipe }) {
  return (
    <View style={styles.facilityResourceSummary}>
      <View style={styles.facilityResourceGroup}>
        <Text style={styles.facilityResourceLabel}>Input</Text>
        <View style={styles.facilityResourceItems}>
          {recipe.inputs.length === 0 ? (
            <Text style={styles.facilityResourceEmpty}>—</Text>
          ) : recipe.inputs.map((input) => (
            <Text key={input.resourceType} accessibilityLabel={`${getResource(input.resourceType).name} ${formatNumber(input.amount, { smartDecimals: true })}`} style={styles.facilityResourceValue}>
              {getResourceIcon(input.resourceType)} {formatNumber(input.amount, { smartDecimals: true })}
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.facilityResourceArrow}>→</Text>
      <View style={styles.facilityResourceGroup}>
        <Text style={styles.facilityResourceLabel}>Output</Text>
        <Text accessibilityLabel={`${getResource(recipe.output.resourceType).name} ${formatNumber(recipe.output.amount * outputMultiplier, { smartDecimals: true })}`} style={styles.facilityResourceValue}>
          {getResourceIcon(recipe.output.resourceType)} {formatNumber(recipe.output.amount * outputMultiplier, { smartDecimals: true })}
        </Text>
      </View>
    </View>
  );
}

function FacilityProductionStatus({ compact = false, efficiency, progress, missingInputs, recipe, speedMultiplier, status }: { compact?: boolean; efficiency: number; progress: number; missingInputs: Recipe['inputs']; recipe: Recipe | null; speedMultiplier: number; status: 'not-started' | 'missing-inputs' | 'producing' }) {
  if (!recipe) return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  const progressPercent = clamp((progress / recipe.workAmount) * 100, 0, 100);
  if (compact) {
    return <View style={styles.productionProgress}>
      <Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text>
      <ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} />
    </View>;
  }
  if (status === 'not-started') return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  if (status === 'missing-inputs') return <Text style={styles.productionError}>Production is paused: missing {formatRecipeInputs({ ...recipe, inputs: missingInputs })}.</Text>;
  const workPerMinute = efficiency * speedMultiplier;
  const minutesRemaining = workPerMinute > 0 ? Math.max(0, recipe.workAmount - progress) / workPerMinute : 0;
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
