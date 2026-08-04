import { useState } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, IconButton, List, ProgressBar, Text, TouchableRipple } from 'react-native-paper';
import { colors } from '@/theme';
import type { Finance } from '@/game/finance/finance';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import { getFacilityDefinition } from '@/game/facilities/facilityConstants';
import type { FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityUpgradeCost, type FacilityUpgradeKind } from '@/game/facilities/facilityUpgrades';
import type { Inventory } from '@/game/inventory/inventory';
import type { Market } from '@/game/market';
import type { Recipe } from '@/game/recipes/recipeTypes';
import { getResource, getResourceIcon } from '@/game/resources/resourceConstants';
import { clamp, formatCurrency, formatDuration, formatNumber, formatPercent } from '@/utils';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { DetailRow, SectionHeading, WorkMetric } from '../components/GameViewComponents';
import { formatRecipeName } from '../helpers/recipeFormatters';
import { APP_ICONS } from '@/icons';

export function ProductionView({
  facilities, finance, inventory, market, openConstructionYard, requestFacilityDestruction, setFacilityProductionActive, setFacilityRecipe, setFacilityWorkers, upgradeFacility,
}: {
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  openConstructionYard: () => void;
  requestFacilityDestruction: (facilityType: FacilityType) => void;
  setFacilityProductionActive: (facilityType: FacilityType, active: boolean) => boolean;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: Recipe['name'] | null) => boolean;
  setFacilityWorkers: (facilityType: FacilityType, workerCount: number) => boolean;
  upgradeFacility: (facilityType: FacilityType, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  const [collapsedFacilities, setCollapsedFacilities] = useState<Partial<Record<FacilityType, boolean>>>({});
  const [expandedRecipeSelectors, setExpandedRecipeSelectors] = useState<Partial<Record<FacilityType, boolean>>>({});
  const builtFacilities = facilities.getAll();

  return <>
    <SectionHeading eyebrow="OPERATIONS" title="Facilities" subtitle="Manage your constructed facilities and build new ones." />
    <Button icon={APP_ICONS.add} mode="contained" onPress={openConstructionYard}>Build facility</Button>
    {builtFacilities.map((facility) => {
      const facilityType = facility.facilityType;
      const definition = getFacilityDefinition(facilityType);
      const activeRecipeName = facility.getActiveRecipeName();
      const activeRecipe = definition.recipes.find((recipe) => recipe.name === activeRecipeName);
      const productionStatus = facility.getProductionStatus(inventory);
      const assignedWorkers = facility.getAssignedWorkers();
      const requiredWorkers = facility.getRequiredWorkers();
      const speedUpgradeLevel = facility.getSpeedUpgradeLevel();
      const outputUpgradeLevel = facility.getOutputUpgradeLevel();
      const speedUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, speedUpgradeLevel);
      const outputUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, outputUpgradeLevel);
      const isExpanded = collapsedFacilities[facilityType] !== true;
      const isRecipeSelectorExpanded = expandedRecipeSelectors[facilityType] === true;

      return <Card key={facilityType} mode="contained" style={styles.featureCard}><Card.Content>
        <List.Item
          description={<View style={styles.facilityHeader}>
            <View style={styles.facilityHeaderRow}><Text style={styles.cardDescription}>{activeRecipe ? formatRecipeName(activeRecipe) : 'No active recipe'}</Text>{activeRecipe && <WorkMetric value={`${formatNumber(facility.getRecipeProgress(activeRecipe.name), { smartDecimals: true })}/${formatNumber(activeRecipe.workAmount, { smartDecimals: true })}`} />}</View>
            <View style={styles.facilityMetrics}>
              <FacilityMetric icon={APP_ICONS.staffing} label={`${formatNumber(assignedWorkers)}/${formatNumber(requiredWorkers)}`} />
              <FacilityMetric icon={APP_ICONS.efficiency} label={formatPercent(facility.getEfficiency(), { decimals: 0 })} />
              <FacilityMetric icon={APP_ICONS.speed} label={`L${formatNumber(speedUpgradeLevel)}`} />
              <FacilityMetric icon={APP_ICONS.output} label={`L${formatNumber(outputUpgradeLevel)}`} />
              {(productionStatus === 'missing-inputs' || productionStatus === 'paused') && <View accessibilityLabel={productionStatus === 'missing-inputs' ? 'Production paused: missing inputs' : 'Production manually paused'} style={styles.facilityPauseMetric}><MaterialCommunityIcons color={colors.error} name={APP_ICONS.pause} size={14} /></View>}
            </View>
          </View>}
          left={(props) => <List.Icon {...props} icon={definition.icon} />}
          title={<View style={styles.facilityTitleRow}><Text style={styles.facilityTitle}>{definition.name}</Text><View style={styles.facilityTopActions}>{activeRecipe && <IconButton accessibilityLabel={`${facility.isActive() ? 'Pause' : 'Resume'} ${definition.name}`} icon={facility.isActive() ? APP_ICONS.pause : APP_ICONS.resume} onPress={() => setFacilityProductionActive(facilityType, !facility.isActive())} size={20} />}<IconButton accessibilityLabel={`Destroy ${definition.name}`} icon={APP_ICONS.destroy} iconColor={colors.error} onPress={() => requestFacilityDestruction(facilityType)} size={20} /><IconButton accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${definition.name}`} icon={isExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setCollapsedFacilities((current) => ({ ...current, [facilityType]: isExpanded }))} size={20} /></View></View>}
        />
        {!isExpanded && activeRecipe && <FacilityProductionStatus compact efficiency={facility.getEfficiency()} market={market} outputMultiplier={facility.getOutputMultiplier()} progress={facility.getRecipeProgress(activeRecipe.name)} recipe={activeRecipe} speedMultiplier={facility.getSpeedMultiplier()} status={productionStatus} />}
        {isExpanded && <>
          <View style={styles.facilityRecipeSelector}>
            <View style={styles.facilityRecipeSelectorHeader}><Text style={styles.facilityRecipeSelectorTitle}>Production recipe</Text><IconButton accessibilityLabel={`${isRecipeSelectorExpanded ? 'Hide' : 'Show'} recipes for ${definition.name}`} icon={isRecipeSelectorExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setExpandedRecipeSelectors((current) => ({ ...current, [facilityType]: !isRecipeSelectorExpanded }))} size={20} /></View>
            {isRecipeSelectorExpanded ? definition.recipes.map((recipe) => <RecipeOption efficiency={facility.getEfficiency()} key={recipe.name} market={market} outputMultiplier={facility.getOutputMultiplier()} recipe={recipe} selected={activeRecipeName === recipe.name} speedMultiplier={facility.getSpeedMultiplier()} inventory={inventory} onPress={() => setFacilityRecipe(facilityType, recipe.name)} />) : <Text style={styles.facilityRecipeSelectorCurrent}>{activeRecipe ? `Current: ${formatRecipeName(activeRecipe)}` : 'No recipe selected'}</Text>}
          </View>
          {activeRecipe && <FacilityResourceSummary outputMultiplier={facility.getOutputMultiplier()} recipe={activeRecipe} />}
          <FacilityProductionStatus efficiency={facility.getEfficiency()} market={market} outputMultiplier={facility.getOutputMultiplier()} progress={activeRecipe ? facility.getRecipeProgress(activeRecipe.name) : 0} recipe={activeRecipe ?? null} speedMultiplier={facility.getSpeedMultiplier()} status={productionStatus} />
          <Text style={styles.constructionYardRecipeLabel}>Staffing</Text>
          <View style={styles.facilityStaffingControls}>
            <IconButton accessibilityLabel={`Remove worker from ${definition.name}`} disabled={assignedWorkers === 0} icon={APP_ICONS.minus} onPress={() => setFacilityWorkers(facilityType, assignedWorkers - 1)} />
            <View style={styles.facilityStaffingSummary}><Text style={styles.facilityStaffingValue}>{formatNumber(assignedWorkers)} / {formatNumber(requiredWorkers)} workers</Text><Text style={styles.facilityStaffingDetail}>Efficiency {formatPercent(facility.getEfficiency(), { decimals: 0 })}</Text></View>
            <IconButton accessibilityLabel={`Add worker to ${definition.name}`} icon={APP_ICONS.add} onPress={() => setFacilityWorkers(facilityType, assignedWorkers + 1)} />
          </View>
          <Text style={styles.constructionYardRecipeLabel}>Upgrades</Text>
          <Text style={styles.facilityUpgradeSummary}>Speed x{formatNumber(facility.getSpeedMultiplier(), { decimals: 2, forceDecimals: true, adaptiveNearOne: false })} · Output x{formatNumber(facility.getOutputMultiplier(), { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}</Text>
          <View style={styles.facilityUpgradeControls}>
            <FacilityUpgradeControl canAfford={finance.canAfford(speedUpgradeCost)} cost={speedUpgradeCost} icon={APP_ICONS.speed} label="Speed" level={speedUpgradeLevel} onPress={() => upgradeFacility(facilityType, 'speed')} />
            <FacilityUpgradeControl canAfford={finance.canAfford(outputUpgradeCost)} cost={outputUpgradeCost} icon={APP_ICONS.output} label="Output" level={outputUpgradeLevel} onPress={() => upgradeFacility(facilityType, 'output')} />
          </View>
        </>}
      </Card.Content></Card>;
    })}
    {builtFacilities.length === 0 && <DetailRow label="Constructed facilities" value="None yet" />}
  </>;
}

function FacilityMetric({ icon, label }: { icon: string; label: string }) {
  return <View style={styles.facilityMetric}><MaterialCommunityIcons color={colors.primary} name={icon as never} size={13} /><Text style={styles.facilityMetricText}>{label}</Text></View>;
}

function FacilityUpgradeControl({ canAfford, cost, icon, label, level, onPress }: { canAfford: boolean; cost: number; icon: string; label: string; level: number; onPress: () => void }) {
  return <View style={styles.facilityUpgradeCard}><View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name={icon as never} size={15} /><Text style={styles.facilityUpgradeLabel}>{label}</Text></View><Text style={styles.facilityUpgradeLevel}>L{formatNumber(level)} → L{formatNumber(level + 1)}</Text><View style={styles.facilityUpgradeAction}><Text style={styles.facilityUpgradeCost}>{formatCurrency(cost)}</Text><IconButton accessibilityLabel={`Upgrade ${label} to level ${level + 1}`} disabled={!canAfford} icon={APP_ICONS.add} mode="contained" onPress={onPress} size={16} /></View></View>;
}

function RecipeOption({ efficiency, inventory, market, onPress, outputMultiplier, recipe, selected, speedMultiplier }: { efficiency: number; inventory: Inventory; market: Market; onPress: () => void; outputMultiplier: number; recipe: Recipe; selected: boolean; speedMultiplier: number }) {
  const inputSummary = recipe.inputs.length === 0 ? 'No inputs' : recipe.inputs.map((input) => `${getResourceIcon(input.resourceType)} ${formatNumber(input.amount, { smartDecimals: true })}/${formatNumber(inventory.getAmount(input.resourceType), { smartDecimals: true })}`).join('  ');
  const hasMissingInputs = recipe.inputs.some((input) => !inventory.has(input.resourceType, input.amount));
  const valuePerMinute = getRecipeValuePerMinute(recipe, market, outputMultiplier, efficiency * speedMultiplier);

  return <TouchableRipple accessibilityLabel={`Run ${formatRecipeName(recipe)}`} onPress={onPress} style={[styles.facilityRecipeOption, selected && styles.facilityRecipeOptionActive, hasMissingInputs && styles.facilityRecipeOptionUnavailable]}><View><Text style={styles.facilityRecipeOptionName}>{formatRecipeName(recipe)}</Text><Text style={[styles.facilityRecipeOptionDetails, hasMissingInputs && styles.facilityRecipeOptionMissing]}>Inputs: {inputSummary}</Text><View style={styles.facilityRecipeOptionStats}><Text style={styles.facilityRecipeOptionDetails}>Work: {formatNumber(recipe.workAmount, { smartDecimals: true })}</Text><Text style={styles.facilityRecipeOptionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text></View></View></TouchableRipple>;
}

function FacilityResourceSummary({ outputMultiplier, recipe }: { outputMultiplier: number; recipe: Recipe }) {
  return <View style={styles.facilityResourceSummary}>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Input</Text><View style={styles.facilityResourceItems}>{recipe.inputs.length === 0 ? <Text style={styles.facilityResourceEmpty}>—</Text> : recipe.inputs.map((input) => <Text key={input.resourceType} accessibilityLabel={`${getResource(input.resourceType).name} ${formatNumber(input.amount, { smartDecimals: true })}`} style={styles.facilityResourceValue}>{getResourceIcon(input.resourceType)} {formatNumber(input.amount, { smartDecimals: true })}</Text>)}</View></View>
    <Text style={styles.facilityResourceArrow}>→</Text>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Output</Text><Text accessibilityLabel={`${getResource(recipe.output.resourceType).name} ${formatNumber(recipe.output.amount * outputMultiplier, { smartDecimals: true })}`} style={[styles.facilityResourceValue, styles.facilityResourceOutput]}>{getResourceIcon(recipe.output.resourceType)} {formatNumber(recipe.output.amount * outputMultiplier, { smartDecimals: true })}</Text></View>
  </View>;
}

function FacilityProductionStatus({ compact = false, efficiency, market, outputMultiplier, progress, recipe, speedMultiplier, status }: { compact?: boolean; efficiency: number; market: Market; outputMultiplier: number; progress: number; recipe: Recipe | null; speedMultiplier: number; status: 'not-started' | 'paused' | 'missing-inputs' | 'producing' }) {
  if (!recipe) return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  const progressPercent = clamp((progress / recipe.workAmount) * 100, 0, 100);
  const valuePerMinute = getRecipeValuePerMinute(recipe, market, outputMultiplier, efficiency * speedMultiplier);
  if (compact) return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text></View><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /></View>;
  if (status !== 'producing') return <View style={styles.productionProgress}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text></View>;
  const workPerMinute = efficiency * speedMultiplier;
  const minutesRemaining = workPerMinute > 0 ? Math.max(0, recipe.workAmount - progress) / workPerMinute : 0;
  return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text></View><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /><Text style={styles.productionTimeLeft}>{formatDuration(minutesRemaining)} left</Text></View>;
}

function getRecipeValuePerMinute(recipe: Recipe, market: Market, outputMultiplier: number, workPerMinute: number): number {
  if (recipe.workAmount <= 0) return 0;
  const cyclesPerMinute = workPerMinute / recipe.workAmount;
  const outputValue = recipe.output.amount * outputMultiplier * market.getLocalPrice(recipe.output.resourceType);
  const inputValue = recipe.inputs.reduce((total, input) => total + input.amount * market.getLocalPrice(input.resourceType), 0);
  return (outputValue - inputValue) * cyclesPerMinute;
}
