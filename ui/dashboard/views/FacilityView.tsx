import { useRef, useState } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, IconButton, List, ProgressBar, Text, TouchableRipple } from 'react-native-paper';
import { colors } from '@/theme';
import type { Finance } from '@/game/finance';
import type { FacilityCollection, FacilityUpgradeKind } from '@/game/facilities';
import { calculateFacilityEffectiveWork, FACILITY_GROUPS, getFacilityDefinition, getFacilityProductionStatus, getFacilityRepairCost, getFacilityUpgradeCost } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market, MarketAutomation } from '@/game/market';
import type { Recipe } from '@/game/recipes';
import { getRecipeResearchProjectId, getRecipeResearchWorkSpeedMultiplier, type ResearchLedger } from '@/game/research';
import { BASE_WORK_PER_MINUTE } from '@/game/core/time';
import { getResource, getResourceIcon, ResourceType } from '@/game/resources';
import { clamp, formatCurrency, formatDuration, formatNumber, formatPercent } from '@/utils';
import { DetailRow, SectionHeading, WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS } from '@/icons';

type FacilityDetailTab = 'efficiency' | 'recipe' | 'upgrades';

export function ProductionView({
  buyMarketResource, facilities, finance, inventory, isBuildFacilityTutorial, market, onBuildFacilityLayout, openConstructionYard, repairFacility, requestFacilityDestruction, research, setFacilityProductionActive, setFacilityRecipe, setFacilityWorkers, setMarketAutomation, upgradeFacility,
}: {
  facilities: FacilityCollection;
  buyMarketResource: (resourceType: Recipe['inputs'][number]['resourceType'], amount: number) => boolean;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  research: ResearchLedger;
  isBuildFacilityTutorial?: boolean;
  onBuildFacilityLayout?: (layout: { height: number; width: number; x: number; y: number }) => void;
  openConstructionYard: () => void;
  requestFacilityDestruction: (facilityId: string) => void;
  setFacilityProductionActive: (facilityId: string, active: boolean) => boolean;
  setFacilityRecipe: (facilityId: string, recipeName: Recipe['name'] | null) => boolean;
  setFacilityWorkers: (facilityId: string, workerCount: number) => boolean;
  repairFacility: (facilityId: string) => boolean;
  setMarketAutomation: (resourceType: Recipe['inputs'][number]['resourceType'], updates: Partial<MarketAutomation>) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  const [collapsedFacilities, setCollapsedFacilities] = useState<Record<string, boolean>>({});
  const [expandedRecipeSelectors, setExpandedRecipeSelectors] = useState<Record<string, boolean>>({});
  const [facilityDetailTabs, setFacilityDetailTabs] = useState<Record<string, FacilityDetailTab>>({});
  const completedResearchProjectIds = research.getCompletedProjectIds();
  const buildFacilityButtonRef = useRef<View>(null);
  const builtFacilities = facilities.getAll();
  const orderedFacilities = FACILITY_GROUPS.flatMap((group) => group.facilities.flatMap((facilityType) => builtFacilities
    .filter((facility) => facility.getView().facilityType === facilityType)
    .map((facility) => ({ facility, group }))));

  return <>
    <SectionHeading eyebrow="OPERATIONS" title="Facilities" subtitle="Manage your constructed facilities and build new ones." />
    <View ref={buildFacilityButtonRef} onLayout={() => buildFacilityButtonRef.current?.measureInWindow((x, y, width, height) => onBuildFacilityLayout?.({ height, width, x, y }))}><Button icon={APP_ICONS.add} mode="contained" style={isBuildFacilityTutorial ? styles.tutorialBuildFacilityButton : undefined} onPress={openConstructionYard}>Build facility</Button></View>
    {orderedFacilities.map(({ facility, group }, index) => {
      const facilityView = facility.getView();
      const facilityType = facilityView.facilityType;
      const facilityId = facilityView.id;
      const facilityName = facilityView.displayName;
      const definition = getFacilityDefinition(facilityType);
      const activeRecipeName = facilityView.activeRecipeName;
      const activeRecipe = definition.recipes.find((recipe) => recipe.name === activeRecipeName);
      const effectiveWorkPerMinute = activeRecipe
        ? calculateFacilityEffectiveWork(facilityView, BASE_WORK_PER_MINUTE, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds))
        : 0;
      const productionStatus = getFacilityProductionStatus(facilityView, inventory);
      const { assignedWorkers, facilityEfficiency, facilityCondition, outputMultiplier, outputUpgradeLevel, requiredWorkers, speedUpgradeLevel, speedUpgradeWorkSpeedMultiplier } = facilityView;
      const speedUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, speedUpgradeLevel);
      const outputUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, outputUpgradeLevel);
      const repairCost = getFacilityRepairCost(definition.constructionMaterialsCost, facilityCondition);
      const canRepair = repairCost > 0 && inventory.has(ResourceType.ConstructionMaterials, repairCost);
      const isExpanded = collapsedFacilities[facilityId] !== true;
      const activeDetailTab = facilityDetailTabs[facilityId] ?? 'recipe';
      const isRecipeSelectorExpanded = expandedRecipeSelectors[facilityId] === true;
      const allInputsAutoBuyEnabled = Boolean(activeRecipe && activeRecipe.inputs.length > 0 && activeRecipe.inputs.every((input) => market.getAutomation(input.resourceType).autoBuyEnabled));
      const hasMissingInputs = Boolean(activeRecipe && activeRecipe.inputs.some((input) => input.amount > inventory.getAmount(input.resourceType)));

      const showGroup = index === 0 || orderedFacilities[index - 1].group.id !== group.id;
      return <View key={facilityId}>{showGroup && <Text style={styles.cardKicker}>{group.label}</Text>}<Card mode="contained" style={styles.featureCard}><Card.Content>
        <List.Item
          description={<View style={styles.facilityHeader}>
            <View style={styles.facilityHeaderRow}><Text style={styles.cardDescription}>{activeRecipe ? formatRecipeName(activeRecipe) : 'No active recipe'}</Text>{activeRecipe && <WorkMetric value={formatRecipeProgress(facilityView.recipeProgress[activeRecipe.name] ?? 0, activeRecipe.requiredWork, effectiveWorkPerMinute)} />}</View>
            <View style={styles.facilityMetrics}>
              <FacilityMetric icon={APP_ICONS.staffing} label={`${formatNumber(assignedWorkers)}/${formatNumber(requiredWorkers)}`} />
              <FacilityMetric icon={APP_ICONS.efficiency} label={formatPercent(facilityEfficiency, { decimals: 0 })} />
              <FacilityMetric icon={APP_ICONS.speed} label={`L${formatNumber(speedUpgradeLevel)}`} />
              <FacilityMetric icon={APP_ICONS.output} label={`L${formatNumber(outputUpgradeLevel)}`} />
              {(productionStatus === 'missing-inputs' || productionStatus === 'paused') && <View accessibilityLabel={productionStatus === 'missing-inputs' ? 'Production paused: missing inputs' : 'Production manually paused'} style={styles.facilityPauseMetric}><MaterialCommunityIcons color={colors.error} name={APP_ICONS.pause} size={14} /></View>}
            </View>
          </View>}
          left={(props) => <List.Icon {...props} icon={definition.icon} />}
          right={() => <View style={styles.facilityTopActions}>{activeRecipe && <IconButton accessibilityLabel={`${facilityView.isActive ? 'Pause' : 'Resume'} ${facilityName}`} icon={facilityView.isActive ? APP_ICONS.pause : APP_ICONS.resume} onPress={() => setFacilityProductionActive(facilityId, !facilityView.isActive)} size={20} />}<IconButton accessibilityLabel={`Destroy ${facilityName}`} icon={APP_ICONS.destroy} iconColor={colors.error} onPress={() => requestFacilityDestruction(facilityId)} size={20} /><IconButton accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${facilityName}`} icon={isExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setCollapsedFacilities((current) => ({ ...current, [facilityId]: isExpanded }))} size={20} /></View>}
          title={facilityName}
          titleStyle={styles.facilityTitle}
        />
        {!isExpanded && activeRecipe && <FacilityProductionStatus compact effectiveWorkPerMinute={effectiveWorkPerMinute} market={market} outputMultiplier={outputMultiplier} progress={facilityView.recipeProgress[activeRecipe.name] ?? 0} recipe={activeRecipe} status={productionStatus} />}
        {isExpanded && <>
          <View style={styles.facilityProductionSection}>
            {activeRecipe && <View style={styles.facilityProductionTop}><FacilityResourceSummary outputMultiplier={outputMultiplier} recipe={activeRecipe} /><View style={styles.facilityRecipeActions}>
              <IconButton accessibilityLabel={allInputsAutoBuyEnabled ? 'Disable autobuy for recipe inputs' : 'Allow autobuy for recipe inputs'} containerColor={allInputsAutoBuyEnabled ? colors.marketAutomationActive : colors.marketAutomation} disabled={activeRecipe.inputs.length === 0} icon={APP_ICONS.marketAutoBuy} iconColor={colors.onDark} onPress={() => activeRecipe.inputs.forEach((input) => setMarketAutomation(input.resourceType, { autoBuyEnabled: !allInputsAutoBuyEnabled }))} size={16} style={styles.facilityRecipeActionButton} />
              <IconButton accessibilityLabel="Buy missing inputs for one production cycle" containerColor={colors.marketBuy} disabled={!hasMissingInputs} icon={APP_ICONS.marketBuy} iconColor={colors.onDark} onPress={() => activeRecipe.inputs.forEach((input) => { const missingAmount = Math.max(0, input.amount - inventory.getAmount(input.resourceType)); if (missingAmount > 0) buyMarketResource(input.resourceType, missingAmount); })} size={16} style={styles.facilityRecipeActionButton} />
            </View></View>}
            <FacilityProductionStatus effectiveWorkPerMinute={effectiveWorkPerMinute} market={market} outputMultiplier={outputMultiplier} progress={activeRecipe ? facilityView.recipeProgress[activeRecipe.name] ?? 0 : 0} recipe={activeRecipe ?? null} status={productionStatus} />
          </View>
          <View style={styles.facilityTabList}>
            <TouchableRipple accessibilityLabel={`Show Facility efficiency for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'efficiency' }))} style={[styles.facilityTab, activeDetailTab === 'efficiency' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'efficiency' && styles.facilityTabLabelActive]}>Facility efficiency</Text></TouchableRipple>
            <TouchableRipple accessibilityLabel={`Show recipes for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'recipe' }))} style={[styles.facilityTab, activeDetailTab === 'recipe' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'recipe' && styles.facilityTabLabelActive]}>Recipe</Text></TouchableRipple>
            <TouchableRipple accessibilityLabel={`Show upgrades for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'upgrades' }))} style={[styles.facilityTab, activeDetailTab === 'upgrades' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'upgrades' && styles.facilityTabLabelActive]}>Upgrades</Text></TouchableRipple>
          </View>
          {activeDetailTab === 'recipe' && <View style={styles.facilityRecipeSelector}>
            <View style={styles.facilityRecipeSelectorHeader}><Text style={styles.facilityRecipeSelectorTitle}>Production recipe</Text><IconButton accessibilityLabel={`${isRecipeSelectorExpanded ? 'Hide' : 'Show'} recipes for ${facilityName}`} icon={isRecipeSelectorExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setExpandedRecipeSelectors((current) => ({ ...current, [facilityId]: !isRecipeSelectorExpanded }))} size={20} /></View>
            {isRecipeSelectorExpanded ? definition.recipes.map((recipe) => <RecipeOption effectiveWorkPerMinute={calculateFacilityEffectiveWork(facilityView, BASE_WORK_PER_MINUTE, getRecipeResearchWorkSpeedMultiplier(recipe.name, completedResearchProjectIds))} key={recipe.name} locked={!research.hasCompleted(getRecipeResearchProjectId(recipe.name))} market={market} outputMultiplier={outputMultiplier} recipe={recipe} selected={activeRecipeName === recipe.name} inventory={inventory} onPress={() => setFacilityRecipe(facilityId, recipe.name)} />) : <Text style={styles.facilityRecipeSelectorCurrent}>{activeRecipe ? `Current: ${formatRecipeName(activeRecipe)}` : 'No recipe selected'}</Text>}
          </View>}
          {activeDetailTab === 'efficiency' && <View style={styles.facilityEfficiencySection}>
            <View style={styles.facilityEfficiencyHeader}><Text style={styles.constructionYardRecipeLabel}>Facility efficiency</Text><Text style={styles.facilityStaffingDetail}>{formatPercent(facilityEfficiency, { decimals: 0 })}</Text></View>
            <View style={styles.facilityEfficiencyControls}>
              <View style={styles.facilityEfficiencyCard}>
                <View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name={APP_ICONS.staffing as never} size={15} /><Text style={styles.facilityUpgradeLabel}>Staffing</Text></View>
                <View style={styles.facilityStaffingControls}>
                  <IconButton accessibilityLabel={`Remove worker from ${facilityName}`} disabled={assignedWorkers === 0} icon={APP_ICONS.minus} onPress={() => setFacilityWorkers(facilityId, assignedWorkers - 1)} size={18} />
                  <View style={styles.facilityStaffingSummary}><Text style={styles.facilityStaffingValue}>{formatNumber(assignedWorkers)} / {formatNumber(requiredWorkers)} workers</Text><Text style={styles.facilityStaffingDetail}>Staff efficiency {formatPercent(facilityView.staffingEfficiency, { decimals: 0 })}</Text></View>
                  <IconButton accessibilityLabel={`Add worker to ${facilityName}`} icon={APP_ICONS.add} onPress={() => setFacilityWorkers(facilityId, assignedWorkers + 1)} size={18} />
                </View>
              </View>
              <View style={styles.facilityEfficiencyCard}>
                <View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name="wrench-outline" size={15} /><Text style={styles.facilityUpgradeLabel}>Repair</Text></View>
                <Text style={styles.facilityRepairCost}>{formatNumber(repairCost, { smartDecimals: true })} {getResourceIcon(ResourceType.ConstructionMaterials)}</Text>
                <View style={styles.facilityUpgradeAction}><Text style={styles.facilityStaffingDetail}>Restore to 100%</Text><IconButton accessibilityLabel={`Repair ${facilityName} for ${formatNumber(repairCost, { smartDecimals: true })} Construction Materials`} disabled={!canRepair} icon="wrench" mode="contained" onPress={() => repairFacility(facilityId)} size={16} /></View>
              </View>
            </View>
            <View style={styles.facilityConditionSummary}>
              <View style={styles.facilityEfficiencyRow}><View style={styles.facilityConditionLabel}><MaterialCommunityIcons color={colors.primary} name="wrench-outline" size={14} /><Text style={styles.facilityEfficiencyLabel}>Facility condition</Text></View><Text style={styles.facilityEfficiencyValue}>{formatPercent(facilityCondition, { decimals: 0 })}</Text></View>
              <ProgressBar accessible accessibilityLabel={`Facility condition ${formatPercent(facilityCondition, { decimals: 0 })}`} color={colors.primary} progress={facilityCondition} style={styles.facilityConditionProgress} />
            </View>
          </View>}
          {activeDetailTab === 'upgrades' && <View style={styles.facilityUpgradesSection}>
            <Text style={styles.constructionYardRecipeLabel}>Upgrades</Text>
            <Text style={styles.facilityUpgradeSummary}>Work speed x{formatNumber(speedUpgradeWorkSpeedMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })} · Output x{formatNumber(outputMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}</Text>
            <View style={styles.facilityUpgradeControls}>
              <FacilityUpgradeControl canAfford={finance.canAfford(speedUpgradeCost)} cost={speedUpgradeCost} icon={APP_ICONS.speed} label="Speed" level={speedUpgradeLevel} onPress={() => upgradeFacility(facilityId, 'speed')} />
              <FacilityUpgradeControl canAfford={finance.canAfford(outputUpgradeCost)} cost={outputUpgradeCost} icon={APP_ICONS.output} label="Output" level={outputUpgradeLevel} onPress={() => upgradeFacility(facilityId, 'output')} />
            </View>
          </View>}
        </>}
      </Card.Content></Card></View>;
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

function RecipeOption({ effectiveWorkPerMinute, inventory, locked, market, onPress, outputMultiplier, recipe, selected }: { effectiveWorkPerMinute: number; inventory: Inventory; locked: boolean; market: Market; onPress: () => void; outputMultiplier: number; recipe: Recipe; selected: boolean }) {
  const inputSummary = recipe.inputs.length === 0 ? 'No inputs' : recipe.inputs.map((input) => `${getResourceIcon(input.resourceType)} ${formatNumber(input.amount, { smartDecimals: true })}/${formatNumber(inventory.getAmount(input.resourceType), { smartDecimals: true })}`).join('  ');
  const hasMissingInputs = recipe.inputs.some((input) => !inventory.has(input.resourceType, input.amount));
  const valuePerMinute = getRecipeValuePerMinute(recipe, market, outputMultiplier, effectiveWorkPerMinute);

  return <TouchableRipple accessibilityLabel={`Run ${formatRecipeName(recipe)}`} disabled={locked} onPress={onPress} style={[styles.facilityRecipeOption, selected && styles.facilityRecipeOptionActive, hasMissingInputs && styles.facilityRecipeOptionUnavailable, locked && styles.facilityRecipeOptionUnavailable]}><View><Text style={styles.facilityRecipeOptionName}>{formatRecipeName(recipe)}</Text><Text style={[styles.facilityRecipeOptionDetails, (hasMissingInputs || locked) && styles.facilityRecipeOptionMissing]}>{locked ? 'Research required' : `Inputs: ${inputSummary}`}</Text><View style={styles.facilityRecipeOptionStats}><Text style={styles.facilityRecipeOptionDetails}>Required work: {formatNumber(recipe.requiredWork, { smartDecimals: true })}</Text><Text style={styles.facilityRecipeOptionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text></View></View></TouchableRipple>;
}

function FacilityResourceSummary({ outputMultiplier, recipe }: { outputMultiplier: number; recipe: Recipe }) {
  return <View style={styles.facilityResourceSummary}>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Input</Text><View style={styles.facilityResourceItems}>{recipe.inputs.length === 0 ? <Text style={styles.facilityResourceEmpty}>—</Text> : recipe.inputs.map((input) => <Text key={input.resourceType} accessibilityLabel={`${getResource(input.resourceType).name} ${formatNumber(input.amount, { smartDecimals: true })}`} style={styles.facilityResourceValue}>{getResourceIcon(input.resourceType)} {formatNumber(input.amount, { smartDecimals: true })}</Text>)}</View></View>
    <Text style={styles.facilityResourceArrow}>→</Text>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Output</Text><Text accessibilityLabel={`${getResource(recipe.output.resourceType).name} ${formatNumber(recipe.output.amount * outputMultiplier, { smartDecimals: true })}`} style={[styles.facilityResourceValue, styles.facilityResourceOutput]}>{getResourceIcon(recipe.output.resourceType)} {formatNumber(recipe.output.amount * outputMultiplier, { smartDecimals: true })}</Text></View>
  </View>;
}

function FacilityProductionStatus({ compact = false, effectiveWorkPerMinute, market, outputMultiplier, progress, recipe, status }: { compact?: boolean; effectiveWorkPerMinute: number; market: Market; outputMultiplier: number; progress: number; recipe: Recipe | null; status: 'not-started' | 'paused' | 'missing-inputs' | 'producing' }) {
  if (!recipe) return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  const progressPercent = clamp((progress / recipe.requiredWork) * 100, 0, 100);
  const valuePerMinute = getRecipeValuePerMinute(recipe, market, outputMultiplier, effectiveWorkPerMinute);
  const workPerMinute = effectiveWorkPerMinute;
  const minutesRemaining = workPerMinute > 0 ? Math.max(0, recipe.requiredWork - progress) / workPerMinute : 0;
  const productionRateLabel = formatProductionRate(recipe, outputMultiplier, effectiveWorkPerMinute, minutesRemaining);
  if (compact) return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><View style={styles.productionProgressMeta}><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text><Text style={styles.productionTimeLeft}>{productionRateLabel}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text></View></View><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /></View>;
  if (status !== 'producing') return <View style={styles.productionProgress}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionTimeLeft}>{productionRateLabel}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text></View>;
  return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><View style={styles.productionProgressMeta}><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text><Text style={styles.productionTimeLeft}>{productionRateLabel}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text></View></View><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /></View>;
}

function formatRecipeProgress(progress: number, requiredWork: number, effectiveWorkPerMinute: number): string {
  if (effectiveWorkPerMinute <= 0) return '0 min';

  return `${formatDuration(progress / effectiveWorkPerMinute)}/${formatDuration(requiredWork / effectiveWorkPerMinute)}`;
}

function formatProductionRate(recipe: Recipe, outputMultiplier: number, effectiveWorkPerMinute: number, minutesRemaining: number): string {
  if (recipe.requiredWork <= 0) return 'Production/min: 0';

  const outputPerMinute = recipe.output.amount * outputMultiplier * effectiveWorkPerMinute / recipe.requiredWork;
  const useSeconds = minutesRemaining < 1;
  const outputRate = useSeconds ? outputPerMinute / 60 : outputPerMinute;
  const unit = useSeconds ? 'sec' : 'min';
  return `Production/${unit}: ${getResourceIcon(recipe.output.resourceType)} ${formatNumber(outputRate, { smartDecimals: true })}`;
}

function getRecipeValuePerMinute(recipe: Recipe, market: Market, outputMultiplier: number, workPerMinute: number): number {
  if (recipe.requiredWork <= 0) return 0;
  const cyclesPerMinute = workPerMinute / recipe.requiredWork;
  const outputValue = recipe.output.amount * outputMultiplier * market.getLocalPrice(recipe.output.resourceType);
  const inputValue = recipe.inputs.reduce((total, input) => total + input.amount * market.getLocalPrice(input.resourceType), 0);
  return (outputValue - inputValue) * cyclesPerMinute;
}
