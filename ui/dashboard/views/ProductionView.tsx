import { useState } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, IconButton, List, ProgressBar, Text, TouchableRipple } from 'react-native-paper';
import { colors } from '@/theme';
import type { Finance } from '@/game/finance';
import type { FacilityCollection, FacilityUpgradeKind } from '@/game/facilities';
import { getFacilityDefinition, getFacilityUpgradeCost } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market, MarketAutomation } from '@/game/market';
import type { Recipe } from '@/game/recipes';
import { getResource, getResourceIcon } from '@/game/resources';
import { clamp, formatCurrency, formatDuration, formatNumber, formatPercent } from '@/utils';
import { DetailRow, SectionHeading, WorkMetric, formatRecipeName, styles } from '@/ui/dashboard/shared';
import { APP_ICONS } from '@/icons';

export function ProductionView({
  buyMarketResource, facilities, finance, inventory, market, openConstructionYard, requestFacilityDestruction, setFacilityProductionActive, setFacilityRecipe, setFacilityWorkers, setMarketAutomation, upgradeFacility,
}: {
  facilities: FacilityCollection;
  buyMarketResource: (resourceType: Recipe['inputs'][number]['resourceType'], amount: number) => boolean;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  openConstructionYard: () => void;
  requestFacilityDestruction: (facilityId: string) => void;
  setFacilityProductionActive: (facilityId: string, active: boolean) => boolean;
  setFacilityRecipe: (facilityId: string, recipeName: Recipe['name'] | null) => boolean;
  setFacilityWorkers: (facilityId: string, workerCount: number) => boolean;
  setMarketAutomation: (resourceType: Recipe['inputs'][number]['resourceType'], updates: Partial<MarketAutomation>) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  const [collapsedFacilities, setCollapsedFacilities] = useState<Record<string, boolean>>({});
  const [expandedRecipeSelectors, setExpandedRecipeSelectors] = useState<Record<string, boolean>>({});
  const builtFacilities = facilities.getAll();

  return <>
    <SectionHeading eyebrow="OPERATIONS" title="Facilities" subtitle="Manage your constructed facilities and build new ones." />
    <Button icon={APP_ICONS.add} mode="contained" onPress={openConstructionYard}>Build facility</Button>
    {builtFacilities.map((facility) => {
      const facilityType = facility.facilityType;
      const facilityId = facility.id;
      const facilityName = facility.getDisplayName();
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
      const isExpanded = collapsedFacilities[facilityId] !== true;
      const isRecipeSelectorExpanded = expandedRecipeSelectors[facilityId] === true;
      const allInputsAutoBuyEnabled = Boolean(activeRecipe && activeRecipe.inputs.length > 0 && activeRecipe.inputs.every((input) => market.getAutomation(input.resourceType).autoBuyEnabled));
      const hasMissingInputs = Boolean(activeRecipe && activeRecipe.inputs.some((input) => input.amount > inventory.getAmount(input.resourceType)));

      return <Card key={facilityId} mode="contained" style={styles.featureCard}><Card.Content>
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
          right={() => <View style={styles.facilityTopActions}>{activeRecipe && <IconButton accessibilityLabel={`${facility.isActive() ? 'Pause' : 'Resume'} ${facilityName}`} icon={facility.isActive() ? APP_ICONS.pause : APP_ICONS.resume} onPress={() => setFacilityProductionActive(facilityId, !facility.isActive())} size={20} />}<IconButton accessibilityLabel={`Destroy ${facilityName}`} icon={APP_ICONS.destroy} iconColor={colors.error} onPress={() => requestFacilityDestruction(facilityId)} size={20} /><IconButton accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${facilityName}`} icon={isExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setCollapsedFacilities((current) => ({ ...current, [facilityId]: isExpanded }))} size={20} /></View>}
          title={facilityName}
          titleStyle={styles.facilityTitle}
        />
        {!isExpanded && activeRecipe && <FacilityProductionStatus compact efficiency={facility.getEfficiency()} market={market} outputMultiplier={facility.getOutputMultiplier()} progress={facility.getRecipeProgress(activeRecipe.name)} recipe={activeRecipe} speedMultiplier={facility.getSpeedMultiplier()} status={productionStatus} />}
        {isExpanded && <>
          <View style={styles.facilityProductionSection}>
            {activeRecipe && <View style={styles.facilityProductionTop}><FacilityResourceSummary outputMultiplier={facility.getOutputMultiplier()} recipe={activeRecipe} /><View style={styles.facilityRecipeActions}>
              <IconButton accessibilityLabel={allInputsAutoBuyEnabled ? 'Disable autobuy for recipe inputs' : 'Allow autobuy for recipe inputs'} containerColor={allInputsAutoBuyEnabled ? colors.marketAutomationActive : colors.marketAutomation} disabled={activeRecipe.inputs.length === 0} icon={APP_ICONS.marketAutoBuy} iconColor={colors.onDark} onPress={() => activeRecipe.inputs.forEach((input) => setMarketAutomation(input.resourceType, { autoBuyEnabled: !allInputsAutoBuyEnabled }))} size={16} style={styles.facilityRecipeActionButton} />
              <IconButton accessibilityLabel="Buy missing inputs for one production cycle" containerColor={colors.marketBuy} disabled={!hasMissingInputs} icon={APP_ICONS.marketBuy} iconColor={colors.onDark} onPress={() => activeRecipe.inputs.forEach((input) => { const missingAmount = Math.max(0, input.amount - inventory.getAmount(input.resourceType)); if (missingAmount > 0) buyMarketResource(input.resourceType, missingAmount); })} size={16} style={styles.facilityRecipeActionButton} />
            </View></View>}
            <FacilityProductionStatus efficiency={facility.getEfficiency()} market={market} outputMultiplier={facility.getOutputMultiplier()} progress={activeRecipe ? facility.getRecipeProgress(activeRecipe.name) : 0} recipe={activeRecipe ?? null} speedMultiplier={facility.getSpeedMultiplier()} status={productionStatus} />
          </View>
          <View style={styles.facilityRecipeSelector}>
            <View style={styles.facilityRecipeSelectorHeader}><Text style={styles.facilityRecipeSelectorTitle}>Production recipe</Text><IconButton accessibilityLabel={`${isRecipeSelectorExpanded ? 'Hide' : 'Show'} recipes for ${facilityName}`} icon={isRecipeSelectorExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setExpandedRecipeSelectors((current) => ({ ...current, [facilityId]: !isRecipeSelectorExpanded }))} size={20} /></View>
            {isRecipeSelectorExpanded ? definition.recipes.map((recipe) => <RecipeOption efficiency={facility.getEfficiency()} key={recipe.name} market={market} outputMultiplier={facility.getOutputMultiplier()} recipe={recipe} selected={activeRecipeName === recipe.name} speedMultiplier={facility.getSpeedMultiplier()} inventory={inventory} onPress={() => setFacilityRecipe(facilityId, recipe.name)} />) : <Text style={styles.facilityRecipeSelectorCurrent}>{activeRecipe ? `Current: ${formatRecipeName(activeRecipe)}` : 'No recipe selected'}</Text>}
          </View>
          <View style={styles.facilityStaffingSection}>
            <Text style={styles.constructionYardRecipeLabel}>Staffing</Text>
            <View style={styles.facilityStaffingControls}>
              <IconButton accessibilityLabel={`Remove worker from ${facilityName}`} disabled={assignedWorkers === 0} icon={APP_ICONS.minus} onPress={() => setFacilityWorkers(facilityId, assignedWorkers - 1)} />
              <View style={styles.facilityStaffingSummary}><Text style={styles.facilityStaffingValue}>{formatNumber(assignedWorkers)} / {formatNumber(requiredWorkers)} workers</Text><Text style={styles.facilityStaffingDetail}>Efficiency {formatPercent(facility.getEfficiency(), { decimals: 0 })}</Text></View>
              <IconButton accessibilityLabel={`Add worker to ${facilityName}`} icon={APP_ICONS.add} onPress={() => setFacilityWorkers(facilityId, assignedWorkers + 1)} />
            </View>
          </View>
          <Text style={styles.constructionYardRecipeLabel}>Upgrades</Text>
          <Text style={styles.facilityUpgradeSummary}>Speed x{formatNumber(facility.getSpeedMultiplier(), { decimals: 2, forceDecimals: true, adaptiveNearOne: false })} · Output x{formatNumber(facility.getOutputMultiplier(), { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}</Text>
          <View style={styles.facilityUpgradeControls}>
            <FacilityUpgradeControl canAfford={finance.canAfford(speedUpgradeCost)} cost={speedUpgradeCost} icon={APP_ICONS.speed} label="Speed" level={speedUpgradeLevel} onPress={() => upgradeFacility(facilityId, 'speed')} />
            <FacilityUpgradeControl canAfford={finance.canAfford(outputUpgradeCost)} cost={outputUpgradeCost} icon={APP_ICONS.output} label="Output" level={outputUpgradeLevel} onPress={() => upgradeFacility(facilityId, 'output')} />
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
  const workPerMinute = efficiency * speedMultiplier;
  const minutesRemaining = workPerMinute > 0 ? Math.max(0, recipe.workAmount - progress) / workPerMinute : 0;
  if (compact) return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><View style={styles.productionProgressMeta}><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text></View></View><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /></View>;
  if (status !== 'producing') return <View style={styles.productionProgress}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text></View>;
  return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><View style={styles.productionProgressMeta}><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text></View></View><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /></View>;
}

function getRecipeValuePerMinute(recipe: Recipe, market: Market, outputMultiplier: number, workPerMinute: number): number {
  if (recipe.workAmount <= 0) return 0;
  const cyclesPerMinute = workPerMinute / recipe.workAmount;
  const outputValue = recipe.output.amount * outputMultiplier * market.getLocalPrice(recipe.output.resourceType);
  const inputValue = recipe.inputs.reduce((total, input) => total + input.amount * market.getLocalPrice(input.resourceType), 0);
  return (outputValue - inputValue) * cyclesPerMinute;
}
