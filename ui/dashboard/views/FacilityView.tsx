import { useRef, useState } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, IconButton, List, ProgressBar, Text, TouchableRipple } from 'react-native-paper';
import { colors } from '@/theme';
import type { Finance } from '@/game/finance';
import {
  calculateFacilityDecayMaterialCostPerMinute,
  calculateFacilityEffectiveWork,
  calculateFacilityNetGainPerMinute,
  calculateFacilityResourcePayment,
  calculateProjectedFacilityUpgradeNetGainPerMinute,
  calculateProjectedFacilityQualityUpgradeNetGainPerMinute,
  calculateRecipeValuePerMinute,
  calculateProductionOutputQuality,
  calculateWeightedInputQuality,
  FACILITY_GROUPS,
  getConditionDecayMultiplier,
  getFacilityDefinition,
  getFacilityQualityLimit,
  getProductionQualityLimit,
  getFacilityProductionCycleInputs,
  getFacilityProductionStatus,
  getFacilityRepairCost,
  getFacilityUpgradeCost,
  getFacilityUpgradeResourceCost,
  getOutputUpgradeMultiplier,
  getSpeedUpgradeWorkSpeedMultiplier,
  type FacilityCollection,
  type FacilityUpgradeKind,
  type FacilityView,
} from '@/game/facilities';
import type { Inventory, ResourceFlowLedger } from '@/game/inventory';
import type { Market, MarketAutomation } from '@/game/market';
import { getRecipe, type Recipe } from '@/game/recipes';
import { getRecipeResearchProjectId, getRecipeResearchWorkSpeedMultiplier, getResourceProductionQuality, type ResearchLedger, type ResearchProjectId } from '@/game/research';
import { BASE_WORK_PER_MINUTE } from '@/game/core/time';
import { getResource, ResourceType } from '@/game/resources';
import { clamp, formatCurrency, formatDuration, formatNumber, formatPercent, getColorClass } from '@/utils';
import { DetailRow, SectionHeading, WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import type { ResearchAvailability } from '@/game/core/stores';

type FacilityDetailTab = 'efficiency' | 'recipe' | 'upgrades';

export function ProductionView({
  buyMarketResource, facilities, finance, getResearchAvailability, inventory, isBuildFacilityTutorial, market, onBuildFacilityLayout, openConstructionYard, repairFacility, requestFacilityDestruction, research, resourceFlow, setFacilityProductionActive, setFacilityProductionCycle, setFacilityWorkers, setMarketAutomation, startResearch, upgradeFacility,
}: {
  facilities: FacilityCollection;
  buyMarketResource: (resourceType: Recipe['inputs'][number]['resourceType'], amount: number) => boolean;
  finance: Finance;
  getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  inventory: Inventory;
  market: Market;
  research: ResearchLedger;
  resourceFlow: ResourceFlowLedger;
  isBuildFacilityTutorial?: boolean;
  onBuildFacilityLayout?: (layout: { height: number; width: number; x: number; y: number }) => void;
  openConstructionYard: () => void;
  requestFacilityDestruction: (facilityId: string) => void;
  setFacilityProductionActive: (facilityId: string, active: boolean) => boolean;
  setFacilityProductionCycle: (facilityId: string, recipeNames: readonly Recipe['name'][]) => boolean;
  setFacilityWorkers: (facilityId: string, workerCount: number) => boolean;
  repairFacility: (facilityId: string) => boolean;
  setMarketAutomation: (resourceType: Recipe['inputs'][number]['resourceType'], updates: Partial<MarketAutomation>) => boolean;
  startResearch: (projectId: ResearchProjectId) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  const [collapsedFacilities, setCollapsedFacilities] = useState<Record<string, boolean>>({});
  const [collapsedProductionCycles, setCollapsedProductionCycles] = useState<Record<string, boolean>>({});
  const [facilityDetailTabs, setFacilityDetailTabs] = useState<Record<string, FacilityDetailTab>>({});
  const completedResearchProjectIds = research.getCompletedProjectIds();
  const producedByResource = resourceFlow.getLifetimeFacilityOutputByResource();
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
      const { assignedWorkers, conditionDecayMultiplier, conditionDecayUpgradeLevel, facilityEfficiency, facilityCondition, outputMultiplier, outputUpgradeLevel, overstaffingConditionDecayMultiplier, qualityLimit, qualityUpgradeLevel, requiredWorkers, speedUpgradeLevel, speedUpgradeWorkSpeedMultiplier } = facilityView;
      const totalConditionDecayMultiplier = conditionDecayMultiplier * overstaffingConditionDecayMultiplier;
      const speedUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, speedUpgradeLevel);
      const outputUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, outputUpgradeLevel);
      const conditionDecayUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, conditionDecayUpgradeLevel);
      const qualityUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, Math.max(0, qualityUpgradeLevel - 1));
      const speedUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, speedUpgradeLevel);
      const outputUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, outputUpgradeLevel);
      const conditionDecayUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, conditionDecayUpgradeLevel);
      const qualityUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, Math.max(0, qualityUpgradeLevel - 1));
      const speedUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, speedUpgradeLevel);
      const outputUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, outputUpgradeLevel);
      const conditionDecayUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, conditionDecayUpgradeLevel);
      const qualityUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, Math.max(0, qualityUpgradeLevel - 1));
      const speedUpgradePayment = calculateFacilityResourcePayment(finance, inventory, market, speedUpgradeCost, speedUpgradeConstructionMaterialsCost, speedUpgradeIndustrialMachinesCost);
      const outputUpgradePayment = calculateFacilityResourcePayment(finance, inventory, market, outputUpgradeCost, outputUpgradeConstructionMaterialsCost, outputUpgradeIndustrialMachinesCost);
      const conditionDecayUpgradePayment = calculateFacilityResourcePayment(finance, inventory, market, conditionDecayUpgradeCost, conditionDecayUpgradeConstructionMaterialsCost, conditionDecayUpgradeIndustrialMachinesCost);
      const qualityUpgradePayment = calculateFacilityResourcePayment(finance, inventory, market, qualityUpgradeCost, qualityUpgradeConstructionMaterialsCost, qualityUpgradeIndustrialMachinesCost);
      const speedNextEffect = `Next: ${formatPercent(getSpeedUpgradeWorkSpeedMultiplier(speedUpgradeLevel + 1) / speedUpgradeWorkSpeedMultiplier - 1, { decimals: 1 })} speed`;
      const outputNextEffect = `Next: ${formatPercent(getOutputUpgradeMultiplier(outputUpgradeLevel + 1) / outputMultiplier - 1, { decimals: 1 })} output`;
      const conditionNextEffect = `Next: ${formatPercent(1 - getConditionDecayMultiplier(conditionDecayUpgradeLevel + 1) / conditionDecayMultiplier, { decimals: 1 })} less decay`;
      const qualityNextEffect = `Next: Q${formatNumber(getFacilityQualityLimit(qualityUpgradeLevel + 1), { decimals: 2, forceDecimals: true })} output limit`;
      const qualityInputQuality = activeRecipe ? facilityView.recipeInputQuality ?? calculateWeightedInputQuality(activeRecipe, inventory) : null;
      const qualityUpgradeActualGain = activeRecipe ? Math.max(0, ...activeRecipe.outputs.map((output) => calculateProductionOutputQuality(getResourceProductionQuality(output.resourceType, completedResearchProjectIds), qualityInputQuality, getFacilityQualityLimit(qualityUpgradeLevel + 1), getProductionQualityLimit(producedByResource[output.resourceType])) - calculateProductionOutputQuality(getResourceProductionQuality(output.resourceType, completedResearchProjectIds), qualityInputQuality, qualityLimit, getProductionQualityLimit(producedByResource[output.resourceType])))) : 0;
      const qualityUpgradeNetGain = activeRecipe ? calculateProjectedFacilityQualityUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), (resourceType) => getResourceProductionQuality(resourceType, completedResearchProjectIds), qualityInputQuality, (resourceType) => getProductionQualityLimit(producedByResource[resourceType])) : undefined;
      const projectedSpeedNetGain = activeRecipe ? calculateProjectedFacilityUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), 'speed') : undefined;
      const projectedOutputNetGain = activeRecipe ? calculateProjectedFacilityUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), 'output') : undefined;
      const projectedConditionNetGain = activeRecipe ? calculateProjectedFacilityUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), 'condition') : undefined;
      const repairEuroCost = getFacilityRepairCost(definition.landCost, facilityCondition);
      const repairConstructionMaterialsCost = getFacilityRepairCost(definition.constructionMaterialsCost, facilityCondition);
      const repairIndustrialMachinesCost = getFacilityRepairCost(definition.industrialMachinesCost, facilityCondition);
      const repairPayment = calculateFacilityResourcePayment(finance, inventory, market, repairEuroCost, repairConstructionMaterialsCost, repairIndustrialMachinesCost);
      const canRepair = repairPayment.canAfford && repairEuroCost + repairConstructionMaterialsCost + repairIndustrialMachinesCost > 0;
      const isExpanded = collapsedFacilities[facilityId] !== true;
      const activeDetailTab = facilityDetailTabs[facilityId] ?? 'recipe';
      const productionCycleInputs = getFacilityProductionCycleInputs(facilityView);
      const allInputsAutoBuyEnabled = productionCycleInputs.length > 0 && productionCycleInputs.every((input) => market.getAutomation(input.resourceType).autoBuyEnabled);
      const hasMissingCycleInputs = productionCycleInputs.some((input) => input.amount > inventory.getAmount(input.resourceType));
      const productionCycleEntries = facilityView.productionCycle.map((recipeName, cycleIndex) => ({ recipeName, cycleIndex }));
      const orderedProductionCycleEntries = [...productionCycleEntries.slice(facilityView.productionCycleIndex), ...productionCycleEntries.slice(0, facilityView.productionCycleIndex)];
      const isProductionCycleExpanded = collapsedProductionCycles[facilityId] !== true;

      const showGroup = index === 0 || orderedFacilities[index - 1].group.id !== group.id;
      return <View key={facilityId}>{showGroup && <Text style={styles.cardKicker}>{group.label}</Text>}<Card mode="contained" style={styles.featureCard}><Card.Content>
        <List.Item
          description={<View style={styles.facilityHeader}>
            <View style={styles.facilityHeaderRow}><Text style={styles.cardDescription}>{activeRecipe ? formatRecipeName(activeRecipe) : 'No active recipe'}</Text>{activeRecipe && <WorkMetric value={formatRecipeProgress(facilityView.recipeProgress[activeRecipe.name] ?? 0, activeRecipe.requiredWork, effectiveWorkPerMinute)} />}</View>
            <View style={styles.facilityMetrics}>
              <FacilityMetric icon={APP_ICONS.staffing} label={`${formatNumber(assignedWorkers)}/${formatNumber(requiredWorkers)}`} />
              <FacilityMetric color={getColorClass(Math.min(1, facilityEfficiency))} icon={APP_ICONS.efficiency} label="Efficiency " value={formatPercent(facilityEfficiency, { decimals: 0 })} />
              <FacilityMetric icon={APP_ICONS.speed} label={`L${formatNumber(speedUpgradeLevel)}`} />
              <FacilityMetric icon={APP_ICONS.output} label={`L${formatNumber(outputUpgradeLevel)}`} />
              <FacilityMetric icon={APP_ICONS.quality} label={`L${formatNumber(qualityUpgradeLevel)}`} />
              <FacilityMetric icon={APP_ICONS.durability} label={`L${formatNumber(conditionDecayUpgradeLevel)}`} />
              {(productionStatus === 'missing-inputs' || productionStatus === 'paused') && <View accessibilityLabel={productionStatus === 'missing-inputs' ? 'Production paused: missing inputs' : 'Production manually paused'} style={styles.facilityPauseMetric}><MaterialCommunityIcons color={colors.error} name={APP_ICONS.pause} size={14} /></View>}
            </View>
          </View>}
          left={(props) => <List.Icon {...props} icon={definition.icon} />}
          right={() => <View style={styles.facilityTopActions}>{activeRecipe && <IconButton accessibilityLabel={`${facilityView.isActive ? 'Pause' : 'Resume'} ${facilityName}`} icon={facilityView.isActive ? APP_ICONS.pause : APP_ICONS.resume} onPress={() => setFacilityProductionActive(facilityId, !facilityView.isActive)} size={20} />}<IconButton accessibilityLabel={`Sell ${facilityName}`} icon={APP_ICONS.destroy} iconColor={colors.error} onPress={() => requestFacilityDestruction(facilityId)} size={20} /><IconButton accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${facilityName}`} icon={isExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setCollapsedFacilities((current) => ({ ...current, [facilityId]: isExpanded }))} size={20} /></View>}
          title={facilityName}
          titleStyle={styles.facilityTitle}
        />
        {!isExpanded && activeRecipe && <FacilityProductionStatus compact decayCostPerMinute={calculateFacilityDecayMaterialCostPerMinute(definition.constructionMaterialsCost, facilityCondition, totalConditionDecayMultiplier, effectiveWorkPerMinute, activeRecipe)} effectiveWorkPerMinute={effectiveWorkPerMinute} market={market} outputMultiplier={outputMultiplier} progress={facilityView.recipeProgress[activeRecipe.name] ?? 0} recipe={activeRecipe} status={productionStatus} />}
        {isExpanded && <>
          <View style={styles.facilityProductionSection}>
            {activeRecipe && <View style={styles.facilityProductionTop}><FacilityResourceSummary facilityQualityLimit={qualityLimit} getProductionQualityLimit={(resourceType) => getProductionQualityLimit(producedByResource[resourceType])} getResearchQuality={(resourceType) => getResourceProductionQuality(resourceType, completedResearchProjectIds)} inputQuality={facilityView.recipeInputQuality ?? calculateWeightedInputQuality(activeRecipe, inventory)} getOutputQuality={(resourceType, weightedInputQuality, facilityLimit) => calculateProductionOutputQuality(getResourceProductionQuality(resourceType, completedResearchProjectIds), weightedInputQuality, facilityLimit, getProductionQualityLimit(producedByResource[resourceType]))} inventory={inventory} outputMultiplier={outputMultiplier} recipe={activeRecipe} /><View style={styles.facilityRecipeActions}>
              <IconButton accessibilityLabel={allInputsAutoBuyEnabled ? 'Disable autobuy for production cycle inputs' : 'Allow autobuy for production cycle inputs'} containerColor={allInputsAutoBuyEnabled ? colors.marketAutomationActive : colors.marketAutomation} disabled={productionCycleInputs.length === 0} icon={APP_ICONS.marketAutoBuy} iconColor={colors.onDark} onPress={() => productionCycleInputs.forEach((input) => setMarketAutomation(input.resourceType, { autoBuyEnabled: !allInputsAutoBuyEnabled }))} size={16} style={styles.facilityRecipeActionButton} />
              <IconButton accessibilityLabel="Buy missing inputs for one production cycle" containerColor={colors.marketBuy} disabled={!hasMissingCycleInputs} icon={APP_ICONS.marketBuy} iconColor={colors.onDark} onPress={() => productionCycleInputs.forEach((input) => { const missingAmount = Math.max(0, input.amount - inventory.getAmount(input.resourceType)); if (missingAmount > 0) buyMarketResource(input.resourceType, missingAmount); })} size={16} style={styles.facilityRecipeActionButton} />
            </View></View>}
            <FacilityProductionStatus decayCostPerMinute={calculateFacilityDecayMaterialCostPerMinute(definition.constructionMaterialsCost, facilityCondition, totalConditionDecayMultiplier, effectiveWorkPerMinute, activeRecipe ?? null)} effectiveWorkPerMinute={effectiveWorkPerMinute} market={market} outputMultiplier={outputMultiplier} progress={activeRecipe ? facilityView.recipeProgress[activeRecipe.name] ?? 0 : 0} recipe={activeRecipe ?? null} status={productionStatus} />
          </View>
          <View style={styles.facilityTabList}>
            <TouchableRipple accessibilityLabel={`Show Facility efficiency for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'efficiency' }))} style={[styles.facilityTab, activeDetailTab === 'efficiency' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'efficiency' && styles.facilityTabLabelActive]}>Facility efficiency</Text></TouchableRipple>
            <TouchableRipple accessibilityLabel={`Show recipes for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'recipe' }))} style={[styles.facilityTab, activeDetailTab === 'recipe' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'recipe' && styles.facilityTabLabelActive]}>Recipe</Text></TouchableRipple>
            <TouchableRipple accessibilityLabel={`Show upgrades for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'upgrades' }))} style={[styles.facilityTab, activeDetailTab === 'upgrades' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'upgrades' && styles.facilityTabLabelActive]}>Upgrades</Text></TouchableRipple>
          </View>
          {activeDetailTab === 'recipe' && <View style={styles.facilityRecipeSelector}>
            {facilityView.productionCycle.length > 1 && <><TouchableRipple accessibilityLabel={`${isProductionCycleExpanded ? 'Collapse' : 'Expand'} production cycle for ${facilityName}`} onPress={() => setCollapsedProductionCycles((current) => ({ ...current, [facilityId]: isProductionCycleExpanded }))}><View style={styles.facilityCycleHeader}><Text style={styles.facilityCycleTitle}>Production cycle</Text><MaterialCommunityIcons color={colors.muted} name={isProductionCycleExpanded ? 'chevron-up' : 'chevron-down'} size={20} /></View></TouchableRipple>{isProductionCycleExpanded && <View style={styles.facilityCycleEditor}>
              <Text style={styles.facilityCycleHint}>Recipes run in this order, then start again. Add researched recipes below; duplicates are allowed.</Text>
              {orderedProductionCycleEntries.map(({ recipeName, cycleIndex }, displayIndex) => <View key={`${recipeName}-${cycleIndex}`} style={styles.facilityCycleRow}>
                <Text style={styles.facilityCycleRecipe}>{`${displayIndex + 1}. ${formatRecipeName(getRecipe(recipeName))}`}</Text>
                <View style={styles.facilityCycleActions}>
                  <IconButton accessibilityLabel={`Move ${formatRecipeName(getRecipe(recipeName))} earlier in the production cycle`} disabled={displayIndex === 0} icon="chevron-up" onPress={() => { const cycle = [...facilityView.productionCycle]; const earlierCycleIndex = orderedProductionCycleEntries[displayIndex - 1]!.cycleIndex; [cycle[earlierCycleIndex], cycle[cycleIndex]] = [cycle[cycleIndex]!, cycle[earlierCycleIndex]!]; setFacilityProductionCycle(facilityId, cycle); }} size={16} />
                  <IconButton accessibilityLabel={`Move ${formatRecipeName(getRecipe(recipeName))} later in the production cycle`} disabled={displayIndex === orderedProductionCycleEntries.length - 1} icon="chevron-down" onPress={() => { const cycle = [...facilityView.productionCycle]; const laterCycleIndex = orderedProductionCycleEntries[displayIndex + 1]!.cycleIndex; [cycle[cycleIndex], cycle[laterCycleIndex]] = [cycle[laterCycleIndex]!, cycle[cycleIndex]!]; setFacilityProductionCycle(facilityId, cycle); }} size={16} />
                  <IconButton accessibilityLabel={`Remove ${formatRecipeName(getRecipe(recipeName))} from the production cycle`} icon={APP_ICONS.destroy} iconColor={colors.error} onPress={() => setFacilityProductionCycle(facilityId, facilityView.productionCycle.filter((_, index) => index !== cycleIndex))} size={16} />
                </View>
              </View>)}
              <Button compact onPress={() => setFacilityProductionCycle(facilityId, [])}>Clear cycle</Button>
            </View>}</>}
            <Text style={styles.facilityRecipeSelectorTitle}>Add researched recipe</Text>
            {definition.recipes.map((recipe) => { const researchProjectId = getRecipeResearchProjectId(recipe.name); const researchAvailability = getResearchAvailability(researchProjectId); const recipeEffectiveWorkPerMinute = calculateFacilityEffectiveWork(facilityView, BASE_WORK_PER_MINUTE, getRecipeResearchWorkSpeedMultiplier(recipe.name, completedResearchProjectIds)); return <RecipeOption canResearch={researchAvailability.startable} decayCostPerMinute={calculateFacilityDecayMaterialCostPerMinute(definition.constructionMaterialsCost, facilityCondition, totalConditionDecayMultiplier, recipeEffectiveWorkPerMinute, recipe)} effectiveWorkPerMinute={recipeEffectiveWorkPerMinute} freeTutorialResearch={researchAvailability.usesFreeGrant} key={recipe.name} locked={!research.hasCompleted(researchProjectId)} market={market} outputMultiplier={outputMultiplier} recipe={recipe} selected={activeRecipeName === recipe.name} inventory={inventory} onPress={() => setFacilityProductionCycle(facilityId, [...facilityView.productionCycle, recipe.name])} onResearch={() => startResearch(researchProjectId)} />; })}
          </View>}
          {activeDetailTab === 'efficiency' && <View style={styles.facilityEfficiencySection}>
            <View style={styles.facilityEfficiencyHeader}><Text style={styles.constructionYardRecipeLabel}>Facility efficiency</Text><Text style={[styles.facilityStaffingDetail, { color: getColorClass(Math.min(1, facilityEfficiency)) }]}>{formatPercent(facilityEfficiency, { decimals: 0 })}</Text></View>
            <View style={styles.facilityEfficiencyControls}>
              <View style={styles.facilityEfficiencyCard}>
                <View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name={APP_ICONS.staffing as never} size={15} /><Text style={styles.facilityUpgradeLabel}>Staffing</Text></View>
                <View style={styles.facilityStaffingControls}>
                  <IconButton accessibilityLabel={`Remove worker from ${facilityName}`} disabled={assignedWorkers === 0} icon={APP_ICONS.minus} onPress={() => setFacilityWorkers(facilityId, assignedWorkers - 1)} size={18} />
                  <View style={styles.facilityStaffingSummary}><Text style={styles.facilityStaffingValue}>{formatNumber(assignedWorkers)} / {formatNumber(requiredWorkers)} workers</Text><Text style={styles.facilityStaffingDetail}>Staff efficiency <Text style={{ color: getColorClass(Math.min(1, facilityView.staffingEfficiency)) }}>{formatPercent(facilityView.staffingEfficiency, { decimals: 0 })}</Text></Text>{overstaffingConditionDecayMultiplier > 1 && <Text style={styles.facilityStaffingDetail}>Overstaff wear x{formatNumber(overstaffingConditionDecayMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}</Text>}</View>
                  <IconButton accessibilityLabel={`Add worker to ${facilityName}`} icon={APP_ICONS.add} onPress={() => setFacilityWorkers(facilityId, assignedWorkers + 1)} size={18} />
                </View>
              </View>
              <View style={styles.facilityEfficiencyCard}>
                <View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name="wrench-outline" size={15} /><Text style={styles.facilityUpgradeLabel}>Repair</Text></View>
                <Text style={styles.facilityRepairCost}>{`Cost: ${formatCurrency(repairPayment.cashCost)}\n${formatCurrency(repairEuroCost)} · Materials: ${formatNumber(repairConstructionMaterialsCost, { smartDecimals: true })} · Machines: ${formatNumber(repairIndustrialMachinesCost, { smartDecimals: true })}`}</Text>
                <View style={styles.facilityUpgradeAction}><Text style={styles.facilityStaffingDetail}>Restore to 100%</Text><IconButton accessibilityLabel={`Repair ${facilityName} for ${formatCurrency(repairPayment.cashCost)}, ${formatNumber(repairConstructionMaterialsCost, { smartDecimals: true })} Construction Materials, and ${formatNumber(repairIndustrialMachinesCost, { smartDecimals: true })} Industrial Machines`} disabled={!canRepair} icon="wrench" mode="contained" onPress={() => repairFacility(facilityId)} size={16} /></View>
              </View>
            </View>
            <View style={styles.facilityConditionSummary}>
              <View style={styles.facilityEfficiencyRow}><View style={styles.facilityConditionLabel}><MaterialCommunityIcons color={colors.muted} name="wrench-outline" size={14} /><Text style={styles.facilityEfficiencyLabel}>Facility condition</Text></View><Text style={[styles.facilityEfficiencyValue, { color: getColorClass(facilityCondition) }]}>{formatPercent(facilityCondition, { decimals: 0 })}</Text></View>
              <ProgressBar accessible accessibilityLabel={`Facility condition ${formatPercent(facilityCondition, { decimals: 0 })}`} color={getColorClass(facilityCondition)} progress={facilityCondition} style={styles.facilityConditionProgress} />
            </View>
          </View>}
          {activeDetailTab === 'upgrades' && <View style={styles.facilityUpgradesSection}>
            <View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name={APP_ICONS.upgrade} size={16} /><Text style={styles.constructionYardRecipeLabel}>Upgrades</Text></View>
            <View style={styles.facilityUpgradeSummary}>
              <FacilityMetric icon={APP_ICONS.speed} label={`x${formatNumber(speedUpgradeWorkSpeedMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}`} />
              <FacilityMetric icon={APP_ICONS.output} label={`x${formatNumber(outputMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}`} />
              <FacilityMetric icon={APP_ICONS.durability} label={`x${formatNumber(conditionDecayMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}`} />
              <FacilityMetric icon={APP_ICONS.quality} label={`Q${formatNumber(qualityLimit, { decimals: 2, forceDecimals: true })}`} />
            </View>
            <View style={styles.facilityUpgradeControls}>
              <FacilityUpgradeControl canAfford={speedUpgradePayment.canAfford} cashCost={speedUpgradePayment.cashCost} constructionMaterialsCost={speedUpgradeConstructionMaterialsCost} euroCost={speedUpgradeCost} industrialMachinesCost={speedUpgradeIndustrialMachinesCost} icon={APP_ICONS.speed} label="Speed" level={speedUpgradeLevel} nextEffect={speedNextEffect} nextNetGain={projectedSpeedNetGain} onPress={() => upgradeFacility(facilityId, 'speed')} />
              <FacilityUpgradeControl canAfford={outputUpgradePayment.canAfford} cashCost={outputUpgradePayment.cashCost} constructionMaterialsCost={outputUpgradeConstructionMaterialsCost} euroCost={outputUpgradeCost} industrialMachinesCost={outputUpgradeIndustrialMachinesCost} icon={APP_ICONS.output} label="Output" level={outputUpgradeLevel} nextEffect={outputNextEffect} nextNetGain={projectedOutputNetGain} onPress={() => upgradeFacility(facilityId, 'output')} />
              <FacilityUpgradeControl canAfford={conditionDecayUpgradePayment.canAfford} cashCost={conditionDecayUpgradePayment.cashCost} constructionMaterialsCost={conditionDecayUpgradeConstructionMaterialsCost} euroCost={conditionDecayUpgradeCost} industrialMachinesCost={conditionDecayUpgradeIndustrialMachinesCost} icon={APP_ICONS.durability} label="Durability" level={conditionDecayUpgradeLevel} nextEffect={conditionNextEffect} nextNetGain={projectedConditionNetGain} onPress={() => upgradeFacility(facilityId, 'condition')} />
              <FacilityUpgradeControl canAfford={qualityUpgradePayment.canAfford} cashCost={qualityUpgradePayment.cashCost} constructionMaterialsCost={qualityUpgradeConstructionMaterialsCost} euroCost={qualityUpgradeCost} industrialMachinesCost={qualityUpgradeIndustrialMachinesCost} icon={APP_ICONS.quality} label="Quality" level={qualityUpgradeLevel} nextEffect={`${qualityNextEffect} · actual +Q${formatNumber(qualityUpgradeActualGain, { decimals: 2, forceDecimals: true })}`} nextNetGain={qualityUpgradeNetGain} onPress={() => upgradeFacility(facilityId, 'quality')} />
            </View>
          </View>}
        </>}
      </Card.Content></Card></View>;
    })}
    {builtFacilities.length === 0 && <DetailRow label="Constructed facilities" value="None yet" />}
  </>;
}

function FacilityMetric({ color = colors.primary, icon, label, value }: { color?: string; icon: string; label: string; value?: string }) {
  return <View style={styles.facilityMetric}><MaterialCommunityIcons color={colors.muted} name={icon as never} size={13} /><Text style={styles.facilityMetricText}>{label}{value && <Text style={{ color }}>{value}</Text>}</Text></View>;
}

function FacilityUpgradeControl({ canAfford, cashCost, constructionMaterialsCost, euroCost, industrialMachinesCost, icon, label, level, nextEffect, nextNetGain, onPress }: { canAfford: boolean; cashCost: number; constructionMaterialsCost: number; euroCost: number; industrialMachinesCost: number; icon: string; label: string; level: number; nextEffect: string; nextNetGain?: number; onPress: () => void }) {
  return <View style={styles.facilityUpgradeCard}><View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name={icon as never} size={15} /><Text style={styles.facilityUpgradeLabel}>{label}</Text></View><Text style={styles.facilityUpgradeLevel}>L{formatNumber(level)} → L{formatNumber(level + 1)}</Text><Text style={styles.facilityUpgradeEffect}>{nextEffect}</Text>{nextNetGain !== undefined && <Text style={styles.facilityUpgradeEffect}>Net gain after upgrade: {formatCurrency(nextNetGain)}/min</Text>}<View style={styles.facilityUpgradeAction}><Text style={styles.facilityUpgradeCost}>{`Cost: ${formatCurrency(cashCost)}\n${formatCurrency(euroCost)} · Materials: ${formatNumber(constructionMaterialsCost, { smartDecimals: true })} · Machines: ${formatNumber(industrialMachinesCost, { smartDecimals: true })}`}</Text><IconButton accessibilityLabel={`Upgrade ${label} to level ${level + 1} for ${formatCurrency(cashCost)} plus Construction Materials and Industrial Machines`} disabled={!canAfford} icon={APP_ICONS.add} mode="contained" onPress={onPress} size={16} /></View></View>;
}

function RecipeOption({ canResearch, decayCostPerMinute, effectiveWorkPerMinute, freeTutorialResearch, inventory, locked, market, onPress, onResearch, outputMultiplier, recipe, selected }: { canResearch: boolean; decayCostPerMinute: number; effectiveWorkPerMinute: number; freeTutorialResearch: boolean; inventory: Inventory; locked: boolean; market: Market; onPress: () => void; onResearch: () => void; outputMultiplier: number; recipe: Recipe; selected: boolean }) {
  const inputSummary = recipe.inputs.length === 0 ? 'No inputs' : recipe.inputs.map((input) => `${getResource(input.resourceType).name}: ${formatNumber(input.amount, { smartDecimals: true })}/${formatNumber(inventory.getAmount(input.resourceType), { smartDecimals: true })}`).join('  ');
  const hasMissingInputs = recipe.inputs.some((input) => !inventory.has(input.resourceType, input.amount));
  const valuePerMinute = calculateRecipeValuePerMinute(recipe, market, outputMultiplier, effectiveWorkPerMinute);
  const netGainPerMinute = calculateFacilityNetGainPerMinute(valuePerMinute, decayCostPerMinute, market);
  return <View style={[styles.facilityRecipeOption, selected && styles.facilityRecipeOptionActive, hasMissingInputs && styles.facilityRecipeOptionUnavailable, locked && styles.facilityRecipeOptionUnavailable]}><TouchableRipple accessibilityLabel={`Run ${formatRecipeName(recipe)}`} disabled={locked} onPress={onPress}><View><View style={styles.facilityRecipeOptionStats}><Text>{RECIPE_ICONS[recipe.name]}</Text><Text style={styles.facilityRecipeOptionName}>{formatRecipeName(recipe)}</Text></View><Text style={[styles.facilityRecipeOptionDetails, (hasMissingInputs || locked) && styles.facilityRecipeOptionMissing]}>{locked ? 'Research required' : `Inputs: ${inputSummary}`}</Text><View style={styles.facilityRecipeOptionStats}><Text style={styles.facilityRecipeOptionDetails}>Required work: {formatNumber(recipe.requiredWork, { smartDecimals: true })}</Text><Text style={styles.facilityRecipeOptionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.facilityRecipeOptionDetails}>Net gain/min: {formatCurrency(netGainPerMinute)}</Text><Text style={styles.facilityRecipeOptionDetails}>Decay cost/min: {formatConditionCost(decayCostPerMinute, market)}</Text></View></View></TouchableRipple>{locked && <Button accessibilityLabel={freeTutorialResearch ? `Research ${formatRecipeName(recipe)} for free with the tutorial grant` : `Research ${formatRecipeName(recipe)}`} compact disabled={!canResearch} icon={APP_ICONS.research} onPress={onResearch}>{freeTutorialResearch ? 'Research recipe for free' : 'Research recipe'}</Button>}</View>;
}

function FacilityResourceSummary({ facilityQualityLimit, getOutputQuality, getProductionQualityLimit, getResearchQuality, inputQuality, inventory, outputMultiplier, recipe }: { facilityQualityLimit: number; getOutputQuality: (resourceType: ResourceType, weightedInputQuality: number | null, facilityQualityLimit: number) => number; getProductionQualityLimit: (resourceType: ResourceType) => number; getResearchQuality: (resourceType: ResourceType) => number; inputQuality: number | null; inventory: Inventory; outputMultiplier: number; recipe: Recipe }) {
  const weightedInputQuality = inputQuality;
  const inputQualityLimit = weightedInputQuality === null ? null : weightedInputQuality + 1;
  const inputQualityDetails = recipe.inputs.map((input) => `${getResource(input.resourceType).icon} Q${formatNumber(inventory.getQuality(input.resourceType), { decimals: 2, forceDecimals: true })}`).join(', ');
  const inputQualitySummary = inputQualityLimit === null ? 'No inputs' : `${inputQualityDetails} → Q${formatNumber(inputQualityLimit!, { decimals: 2, forceDecimals: true })}`;
  const researchQualitySummary = recipe.outputs.map((output) => `max Q${formatNumber(getResearchQuality(output.resourceType), { decimals: 2, forceDecimals: true })}`).join(', ');
  const productionQualitySummary = recipe.outputs.map((output) => `max Q${formatNumber(getProductionQualityLimit(output.resourceType), { decimals: 2, forceDecimals: true })}`).join(', ');
  return <View style={styles.facilityResourceSummary}>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Input</Text><View style={styles.facilityResourceItems}>{recipe.inputs.length === 0 ? <Text style={styles.facilityResourceEmpty}>—</Text> : recipe.inputs.map((input) => <Text key={input.resourceType} accessibilityLabel={`${getResource(input.resourceType).name} ${formatNumber(input.amount, { smartDecimals: true })}`} style={styles.facilityResourceValue}>{getResource(input.resourceType).icon} {formatNumber(input.amount, { smartDecimals: true })}</Text>)}</View></View>
    <Text style={styles.facilityResourceArrow}>→</Text>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Output</Text><View style={styles.facilityResourceItems}>{recipe.outputs.map((output) => { const quality = getOutputQuality(output.resourceType, weightedInputQuality, facilityQualityLimit); return <Text key={output.resourceType} accessibilityLabel={`${getResource(output.resourceType).name} ${formatNumber(output.amount * outputMultiplier, { smartDecimals: true })} at quality ${formatNumber(quality, { decimals: 2, forceDecimals: true })}`} style={[styles.facilityResourceValue, styles.facilityResourceOutput]}>{getResource(output.resourceType).icon} {formatNumber(output.amount * outputMultiplier, { smartDecimals: true })} · Q{formatNumber(quality, { decimals: 2, forceDecimals: true })}</Text>; })}</View></View>
    <View accessibilityLabel={`Quality calculation: ${inputQualitySummary}; research ${researchQualitySummary}; facility max Q${formatNumber(facilityQualityLimit, { decimals: 2, forceDecimals: true })}; production ${productionQualitySummary}`} style={styles.facilityResourceQuality}><Text style={styles.facilityResourceQualityLabel}>Quality:</Text><Text style={styles.facilityResourceQualityText}>{inputQualitySummary} · </Text><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.research} size={12} /><Text style={styles.facilityResourceQualityText}>{researchQualitySummary} · </Text><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.upgrade} size={12} /><Text style={styles.facilityResourceQualityText}>{`max Q${formatNumber(facilityQualityLimit, { decimals: 2, forceDecimals: true })} · `}</Text><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.output} size={12} /><Text style={styles.facilityResourceQualityText}>{productionQualitySummary}</Text></View>
  </View>;
}

function FacilityProductionStatus({ compact = false, decayCostPerMinute, effectiveWorkPerMinute, market, outputMultiplier, progress, recipe, status }: { compact?: boolean; decayCostPerMinute: number; effectiveWorkPerMinute: number; market: Market; outputMultiplier: number; progress: number; recipe: Recipe | null; status: 'not-started' | 'paused' | 'missing-inputs' | 'producing' }) {
  if (!recipe) return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  const progressPercent = clamp((progress / recipe.requiredWork) * 100, 0, 100);
  const valuePerMinute = calculateRecipeValuePerMinute(recipe, market, outputMultiplier, effectiveWorkPerMinute);
  const netGainPerMinute = calculateFacilityNetGainPerMinute(valuePerMinute, decayCostPerMinute, market);
  const workPerMinute = effectiveWorkPerMinute;
  const minutesRemaining = workPerMinute > 0 ? Math.max(0, recipe.requiredWork - progress) / workPerMinute : 0;
  const productionRateLabel = formatProductionRate(recipe, outputMultiplier, effectiveWorkPerMinute, minutesRemaining);
  if (compact) return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><View style={styles.productionProgressValues}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionTimeLeft}>Net gain/min: {formatCurrency(netGainPerMinute)}</Text><Text style={styles.productionTimeLeft}>Decay cost/min: {formatConditionCost(decayCostPerMinute, market)}</Text></View><View style={styles.productionProgressMeta}><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text></View></View><Text style={styles.productionTimeLeft}>{productionRateLabel}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /></View>;
  if (status !== 'producing') return <View style={styles.productionProgress}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionTimeLeft}>Net gain/min: {formatCurrency(netGainPerMinute)}</Text><Text style={styles.productionTimeLeft}>Decay cost/min: {formatConditionCost(decayCostPerMinute, market)}</Text><Text style={styles.productionTimeLeft}>{productionRateLabel}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text></View>;
  return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><View style={styles.productionProgressValues}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionTimeLeft}>Net gain/min: {formatCurrency(netGainPerMinute)}</Text><Text style={styles.productionTimeLeft}>Decay cost/min: {formatConditionCost(decayCostPerMinute, market)}</Text></View><View style={styles.productionProgressMeta}><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text></View></View><Text style={styles.productionTimeLeft}>{productionRateLabel}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /></View>;
}

function formatRecipeProgress(progress: number, requiredWork: number, effectiveWorkPerMinute: number): string {
  if (effectiveWorkPerMinute <= 0) return '0 min';

  return `${formatDuration(progress / effectiveWorkPerMinute)}/${formatDuration(requiredWork / effectiveWorkPerMinute)}`;
}

function formatProductionRate(recipe: Recipe, outputMultiplier: number, effectiveWorkPerMinute: number, minutesRemaining: number): string {
  if (recipe.requiredWork <= 0) return 'Production/min: 0';

  const outputsPerMinute = recipe.outputs.map((output) => ({
    resourceType: output.resourceType,
    amount: output.amount * outputMultiplier * effectiveWorkPerMinute / recipe.requiredWork,
  }));
  const useSeconds = minutesRemaining < 1;
  const unit = useSeconds ? 'sec' : 'min';
  return `Production/${unit}: ${outputsPerMinute.map(({ resourceType, amount }) => `${getResource(resourceType).name} ${formatNumber(useSeconds ? amount / 60 : amount, { smartDecimals: true })}`).join(' + ')}`;
}

function formatConditionCost(materialAmount: number, market: Market): string {
  const currencyCost = materialAmount * market.getLocalPrice(ResourceType.ConstructionMaterials);
  return `${formatNumber(materialAmount, { smartDecimals: true })}/${formatCurrency(currencyCost)} Construction Materials`;
}
