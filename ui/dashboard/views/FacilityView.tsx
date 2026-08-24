import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, IconButton, List, ProgressBar, Text, TouchableRipple } from 'react-native-paper';
import { colors } from '@/theme';
import { calculateFacilityAssetBreakdown, FINANCE_REPORT_PERIODS, type Finance, type FinanceReportPeriod } from '@/game/finance';
import {
  calculateFacilityDecayCostPerMinute,
  calculateFacilityProductionMaintenanceCost,
  calculateFacilityEffectiveWork,
  calculateFacilityNetGainPerMinute,
  calculateFacilityResourcePayment,
  calculateFacilityStaffWagePerMinute,
  calculateProjectedFacilityUpgradeNetGainPerMinute,
  calculateProjectedFacilityQualityUpgradeNetGainPerMinute,
  calculateRecipeValuePerMinute,
  calculateRecipeInputQ,
  calculateRecipeInputSourceCost,
  FACILITY_GROUPS,
  FACILITY_STAFF_QUALITY_TREND_MEMORY_MINUTES,
  FacilityType,
  getConditionDecayMultiplier,
  getFacilityDefinition,
  getFacilityProductionCycleInputs,
  getFacilityProductionStatus,
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
import { getRecipe, type Recipe, type RecipeOutput } from '@/game/recipes';
import { getFacilityAutoRepairLimit, getRecipeResearchProjectId, getRecipeResearchWorkSpeedMultiplier, getResourceResearchMaxQ, type ResearchLedger, type ResearchProjectId } from '@/game/research';
import { calculateInputMaxQ, calculateOutputQuality, calculateProductionMaxQ, calculateUpgradeMaxQ, type OutputQualityBreakdown } from '@/game/quality';
import { BASE_WORK_PER_MINUTE } from '@/game/core/time';
import type { TutorialProductionPresentation } from '@/game/tutorial';
import { getResource, ResourceType } from '@/game/resources';
import { clamp, formatCurrency, formatDuration, formatNumber, formatPercent, getColorClass } from '@/utils';
import { DetailRow, SectionHeading, WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { TooltipAppIcon, TooltipMaterialIcon, TooltipResourceIcon, TooltipTextIcon } from '@/ui/dashboard/components/IconTooltip';
import { FacilityRepairDialog, FacilityStaffTrainingDialog, FacilityStaffWageDialog } from '@/ui/dashboard/components/dialog/FacilityDialogs';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { formatStaffQualityWagePressure } from '@/ui/dashboard/helpers/staffingFormatters';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import type { ResearchAvailability } from '@/game/core/stores';

type FacilityDetailTab = 'efficiency' | 'recipe' | 'upgrades' | 'finance';

export function ProductionView({
  buyMarketResource, collapsedFacilities, currentGameTimeMs, facilities, finance, getResearchAvailability, inventory, market, onBuildFacilityLayout, onFirstFacilityFocusLayout, onFirstFacilityRecipeSelected, openConstructionYard, repairFacility, requestFacilityDestruction, research, resourceFlow, setCollapsedFacilities, setFacilityAutoRepair, setFacilityProductionActive, setFacilityProductionCycle, setFacilityStaffing, trainFacilityStaff, setMarketAutomation, startResearch, tutorial, upgradeFacility,
}: {
  facilities: FacilityCollection;
  collapsedFacilities: Record<string, boolean>;
  buyMarketResource: (resourceType: Recipe['inputs'][number]['resourceType'], amount: number) => boolean;
  currentGameTimeMs: number;
  finance: Finance;
  onFirstFacilityRecipeSelected?: (recipeName: Recipe['name']) => void;
  getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  inventory: Inventory;
  market: Market;
  research: ResearchLedger;
  resourceFlow: ResourceFlowLedger;
  onBuildFacilityLayout?: (layout: { height: number; width: number; x: number; y: number }) => void;
  onFirstFacilityFocusLayout?: (layout: { height: number; width: number; x: number; y: number }) => void;
  openConstructionYard: () => void;
  requestFacilityDestruction: (facilityId: string) => void;
  setFacilityProductionActive: (facilityId: string, active: boolean) => boolean;
  setFacilityProductionCycle: (facilityId: string, recipeNames: readonly Recipe['name'][]) => boolean;
  setFacilityAutoRepair: (facilityId: string, enabled: boolean, threshold: number, target: number) => boolean;
  setFacilityStaffing: (facilityId: string, workerCount: number, wagePerWorkerPerMinute: number) => boolean;
  trainFacilityStaff?: (facilityId: string, workerCount: number) => boolean;
  repairFacility: (facilityId: string, targetCondition?: number) => boolean;
  setCollapsedFacilities: Dispatch<SetStateAction<Record<string, boolean>>>;
  setMarketAutomation: (resourceType: Recipe['inputs'][number]['resourceType'], updates: Partial<MarketAutomation>) => boolean;
  startResearch: (projectId: ResearchProjectId) => boolean;
  tutorial: TutorialProductionPresentation;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  const { firstFacilityFocus, firstFacilityRecipeName, firstFacilityStep, isBuildFacilityTutorial, isFirstFacilityTutorial, isProductionTutorial } = tutorial;
  const [collapsedProductionCycles, setCollapsedProductionCycles] = useState<Record<string, boolean>>({});
  const [facilityDetailTabs, setFacilityDetailTabs] = useState<Record<string, FacilityDetailTab>>({});
  const [facilityFinancePeriods, setFacilityFinancePeriods] = useState<Record<string, FinanceReportPeriod>>({});
  const [repairFacilityId, setRepairFacilityId] = useState<string | null>(null);
  const [staffWageFacilityId, setStaffWageFacilityId] = useState<string | null>(null);
  const [staffTrainingFacilityId, setStaffTrainingFacilityId] = useState<string | null>(null);
  const completedResearchProjectIds = research.getCompletedProjectIds();
  const producedByResource = resourceFlow.getLifetimeFacilityOutputByResource();
  const buildFacilityButtonRef = useRef<View>(null);
  const firstFacilityFocusRef = useRef<View>(null);
  const builtFacilities = facilities.getAll();
  const orderedFacilities = FACILITY_GROUPS.flatMap((group) => group.facilities.flatMap((facilityType) => builtFacilities
    .filter((facility) => facility.getView().facilityType === facilityType)
    .map((facility) => ({ facility, group }))));
  const measureFirstFacilityFocus = () => firstFacilityFocusRef.current?.measureInWindow((x, y, width, height) => onFirstFacilityFocusLayout?.({ height, width, x, y }));

  useEffect(() => {
    if (firstFacilityFocus !== 'recipe') return;
    const frame = requestAnimationFrame(measureFirstFacilityFocus);
    return () => cancelAnimationFrame(frame);
  }, [firstFacilityFocus, firstFacilityRecipeName]);

  return <>
    <View style={isProductionTutorial ? styles.tutorialProductionOverview : undefined}><SectionHeading eyebrow="OPERATIONS" title="Facilities" subtitle="Manage your constructed facilities and build new ones." />
    <View ref={buildFacilityButtonRef} onLayout={() => buildFacilityButtonRef.current?.measureInWindow((x, y, width, height) => onBuildFacilityLayout?.({ height, width, x, y }))}><Button icon={APP_ICONS.add} mode="contained" style={isBuildFacilityTutorial ? styles.tutorialBuildFacilityButton : undefined} onPress={openConstructionYard}>Build facility</Button></View></View>
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
      const { assignedWorkers, conditionDecayMultiplier, conditionDecayUpgradeLevel, facilityEfficiency, facilityCondition, outputMultiplier, outputUpgradeLevel, overstaffingConditionDecayMultiplier, sizeHectares, sizeMultiplier, staffQuality, staffQualityTrend, staffQualityWagePressurePerMinute, staffQualityWageTrend, staffWageTargetPerWorkerPerMinute, pendingRepair, pendingStaffingChange, staffTraining, upgradeMaxQ, qualityUpgradeLevel, requiredWorkers, speedUpgradeLevel, speedUpgradeWorkSpeedMultiplier } = facilityView;
      const totalConditionDecayMultiplier = conditionDecayMultiplier * overstaffingConditionDecayMultiplier;
      const pendingStaffingSeconds = pendingStaffingChange ? Math.max(0, pendingStaffingChange.completesAtGameTimeMs - currentGameTimeMs) / 1_000 : 0;
      const staffTrainingSeconds = staffTraining ? Math.max(0, staffTraining.completesAtGameTimeMs - currentGameTimeMs) / 1_000 : 0;
      const pendingRepairSeconds = pendingRepair ? Math.max(0, pendingRepair.completesAtGameTimeMs - currentGameTimeMs) / 1_000 : 0;
      const decayCostPerMinute = calculateFacilityDecayCostPerMinute(definition.landCost * sizeMultiplier, definition.constructionMaterialsCost * sizeMultiplier, definition.industrialMachinesCost * sizeMultiplier, facilityCondition, totalConditionDecayMultiplier, effectiveWorkPerMinute, activeRecipe ?? null, market.getLocalPrice(ResourceType.ConstructionMaterials), market.getLocalPrice(ResourceType.IndustrialMachines), sizeMultiplier);
      const speedUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, speedUpgradeLevel, sizeMultiplier);
      const outputUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, outputUpgradeLevel, sizeMultiplier);
      const conditionDecayUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, conditionDecayUpgradeLevel, sizeMultiplier);
      const qualityUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, Math.max(0, qualityUpgradeLevel - 1), sizeMultiplier);
      const speedUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, speedUpgradeLevel, sizeMultiplier);
      const outputUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, outputUpgradeLevel, sizeMultiplier);
      const conditionDecayUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, conditionDecayUpgradeLevel, sizeMultiplier);
      const qualityUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, Math.max(0, qualityUpgradeLevel - 1), sizeMultiplier);
      const speedUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, speedUpgradeLevel, sizeMultiplier);
      const outputUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, outputUpgradeLevel, sizeMultiplier);
      const conditionDecayUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, conditionDecayUpgradeLevel, sizeMultiplier);
      const qualityUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, Math.max(0, qualityUpgradeLevel - 1), sizeMultiplier);
      const speedUpgradePayment = calculateFacilityResourcePayment(finance, inventory, market, speedUpgradeCost, speedUpgradeConstructionMaterialsCost, speedUpgradeIndustrialMachinesCost);
      const outputUpgradePayment = calculateFacilityResourcePayment(finance, inventory, market, outputUpgradeCost, outputUpgradeConstructionMaterialsCost, outputUpgradeIndustrialMachinesCost);
      const conditionDecayUpgradePayment = calculateFacilityResourcePayment(finance, inventory, market, conditionDecayUpgradeCost, conditionDecayUpgradeConstructionMaterialsCost, conditionDecayUpgradeIndustrialMachinesCost);
      const qualityUpgradePayment = calculateFacilityResourcePayment(finance, inventory, market, qualityUpgradeCost, qualityUpgradeConstructionMaterialsCost, qualityUpgradeIndustrialMachinesCost);
      const speedNextEffect = `Next: ${formatPercent(getSpeedUpgradeWorkSpeedMultiplier(speedUpgradeLevel + 1) / speedUpgradeWorkSpeedMultiplier - 1, { decimals: 1 })} speed`;
      const outputNextEffect = `Next: ${formatPercent(getOutputUpgradeMultiplier(outputUpgradeLevel + 1) / outputMultiplier - 1, { decimals: 1 })} output`;
      const conditionNextEffect = `Next: ${formatPercent(1 - getConditionDecayMultiplier(conditionDecayUpgradeLevel + 1) / conditionDecayMultiplier, { decimals: 1 })} less decay`;
      const qualityNextEffect = `Next: Q${formatNumber(calculateUpgradeMaxQ(qualityUpgradeLevel + 1), { decimals: 2, forceDecimals: true })} output limit`;
      const qualityInputQ = activeRecipe ? facilityView.recipeInputQ ?? calculateRecipeInputQ(activeRecipe, inventory, sizeMultiplier) : null;
      const getOutputQuality = (recipe: Recipe, weightedInputQ: number | null, output: RecipeOutput): number => calculateOutputQuality({
        researchMaxQ: getResourceResearchMaxQ(output.resourceType, completedResearchProjectIds),
        weightedInputQ,
        upgradeMaxQ,
        productionMaxQ: calculateProductionMaxQ(producedByResource[output.resourceType]),
        staffMaxQ: facilityView.staffQuality,
        outputBonusQ: output.outputBonusQ,
      }).outputQ;
      const getActiveOutputQuality = activeRecipe ? (resourceType: ResourceType) => {
        const output = activeRecipe.outputs.find((candidate) => candidate.resourceType === resourceType);
        return output ? getOutputQuality(activeRecipe, qualityInputQ, output) : 1;
      } : undefined;
      const qualityUpgradeActualGain = activeRecipe ? Math.max(0, ...activeRecipe.outputs.map((output) => calculateOutputQuality({ researchMaxQ: getResourceResearchMaxQ(output.resourceType, completedResearchProjectIds), weightedInputQ: qualityInputQ, upgradeMaxQ: calculateUpgradeMaxQ(qualityUpgradeLevel + 1), productionMaxQ: calculateProductionMaxQ(producedByResource[output.resourceType]), staffMaxQ: facilityView.staffQuality, outputBonusQ: output.outputBonusQ }).outputQ - calculateOutputQuality({ researchMaxQ: getResourceResearchMaxQ(output.resourceType, completedResearchProjectIds), weightedInputQ: qualityInputQ, upgradeMaxQ, productionMaxQ: calculateProductionMaxQ(producedByResource[output.resourceType]), staffMaxQ: facilityView.staffQuality, outputBonusQ: output.outputBonusQ }).outputQ)) : 0;
      const qualityUpgradeNetGain = activeRecipe ? calculateProjectedFacilityQualityUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), (resourceType) => getResourceResearchMaxQ(resourceType, completedResearchProjectIds), qualityInputQ, (resourceType) => calculateProductionMaxQ(producedByResource[resourceType]), facilityView.staffQuality) : undefined;
      const projectedSpeedNetGain = activeRecipe && getActiveOutputQuality ? calculateProjectedFacilityUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), 'speed', (resourceType) => inventory.getQuality(resourceType), getActiveOutputQuality) : undefined;
      const projectedOutputNetGain = activeRecipe && getActiveOutputQuality ? calculateProjectedFacilityUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), 'output', (resourceType) => inventory.getQuality(resourceType), getActiveOutputQuality) : undefined;
      const projectedConditionNetGain = activeRecipe && getActiveOutputQuality ? calculateProjectedFacilityUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), 'condition', (resourceType) => inventory.getQuality(resourceType), getActiveOutputQuality) : undefined;
      const assetBreakdown = calculateFacilityAssetBreakdown(facility, market, finance);
      const financePeriod = facilityFinancePeriods[facilityId] ?? 'all-time';
      const facilityPerformance = finance.getFacilityPerformance(facilityId, financePeriod, currentGameTimeMs);
      const isExpanded = collapsedFacilities[facilityId] !== true;
      const activeDetailTab = isFirstFacilityTutorial && index === 0 ? (firstFacilityStep === 'upgrades' || firstFacilityStep === 'inventory-transition' ? 'upgrades' : firstFacilityStep === 'footprint' || firstFacilityStep === 'research' || firstFacilityStep === 'recipe-card' || firstFacilityStep === 'recipe-automation' || firstFacilityStep === 'recipe-economics' ? 'recipe' : 'efficiency') : (facilityDetailTabs[facilityId] ?? 'recipe');
      const productionCycleInputs = getFacilityProductionCycleInputs(facilityView);
      const allInputsAutoBuyEnabled = productionCycleInputs.length > 0 && productionCycleInputs.every((input) => market.getAutomation(input.resourceType).autoBuyEnabled);
      const hasMissingCycleInputs = productionCycleInputs.some((input) => input.amount > inventory.getAmount(input.resourceType));
      const productionCycleEntries = facilityView.productionCycle.map((recipeName, cycleIndex) => ({ recipeName, cycleIndex }));
      const orderedProductionCycleEntries = [...productionCycleEntries.slice(facilityView.productionCycleIndex), ...productionCycleEntries.slice(0, facilityView.productionCycleIndex)];
      const isProductionCycleExpanded = collapsedProductionCycles[facilityId] !== true;
      const isFirstFacility = isFirstFacilityTutorial && index === 0;
      const focusTarget = isFirstFacility ? firstFacilityFocus : null;
      const isRecipeFocus = isFirstFacility && focusTarget === 'recipe';

      const showGroup = index === 0 || orderedFacilities[index - 1].group.id !== group.id;
      return <View key={facilityId}>{showGroup && <Text style={styles.cardKicker}>{group.label}</Text>}<Card mode="contained" style={[styles.featureCard, isFirstFacility && !focusTarget && styles.tutorialFirstFacilityCard]}><Card.Content>
        <View ref={isFirstFacility && focusTarget === 'header' ? firstFacilityFocusRef : undefined} onLayout={isFirstFacility && focusTarget === 'header' ? measureFirstFacilityFocus : undefined} style={isFirstFacility && focusTarget === 'header' ? styles.tutorialFirstFacilityHeader : undefined}>
        <List.Item
          description={<View style={styles.facilityHeader}>
            <View style={styles.facilityHeaderRow}><Text style={styles.cardDescription}>{activeRecipe ? formatRecipeName(activeRecipe) : 'No active recipe'}</Text>{activeRecipe && <WorkMetric value={formatRecipeProgress(facilityView.recipeProgress[activeRecipe.name] ?? 0, activeRecipe.requiredWork * sizeMultiplier, effectiveWorkPerMinute)} />}</View>
            <View style={styles.facilityMetrics}>
              <FacilityMetric icon={APP_ICONS.staffing} label="Staffing" value={`${formatNumber(assignedWorkers)}/${formatNumber(requiredWorkers)}`} />
              {facilityView.facilityType === FacilityType.Farm && <FacilityMetric icon={APP_ICONS.facilityFarm} label="Farm size" value={`${formatNumber(sizeHectares)} ha`} />}
              <FacilityMetric color={getColorClass(Math.min(1, facilityEfficiency))} icon={APP_ICONS.efficiency} label="Efficiency" value={formatPercent(facilityEfficiency, { decimals: 0 })} />
              <FacilityMetric icon={APP_ICONS.speed} label="Speed upgrade" value={`L${formatNumber(speedUpgradeLevel)}`} />
              <FacilityMetric icon={APP_ICONS.output} label="Output upgrade" value={`L${formatNumber(outputUpgradeLevel)}`} />
              <FacilityMetric icon={APP_ICONS.quality} label="Quality upgrade" value={`L${formatNumber(qualityUpgradeLevel)}`} />
              <FacilityMetric icon={APP_ICONS.durability} label="Durability upgrade" value={`L${formatNumber(conditionDecayUpgradeLevel)}`} />
              {(productionStatus === 'missing-inputs' || productionStatus === 'paused') && <View accessibilityLabel={productionStatus === 'missing-inputs' ? 'Production paused: missing inputs' : 'Production manually paused'} style={styles.facilityPauseMetric}><TooltipMaterialIcon color={colors.error} label={productionStatus === 'missing-inputs' ? 'Production paused: missing inputs' : 'Production manually paused'} name={APP_ICONS.pause} size={14} /></View>}
            </View>
          </View>}
          left={() => <TooltipMaterialIcon color={colors.muted} label={definition.name} name={definition.icon} size={24} />}
          right={() => <View style={styles.facilityTopActions}>{activeRecipe && <IconButton accessibilityLabel={`${facilityView.isActive ? 'Pause' : 'Resume'} ${facilityName}`} icon={facilityView.isActive ? APP_ICONS.pause : APP_ICONS.resume} onPress={() => setFacilityProductionActive(facilityId, !facilityView.isActive)} size={20} />}<IconButton accessibilityLabel={`Sell ${facilityName}`} icon={APP_ICONS.destroy} iconColor={colors.error} onPress={() => requestFacilityDestruction(facilityId)} size={20} /><IconButton accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${facilityName}`} icon={isExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setCollapsedFacilities((current) => ({ ...current, [facilityId]: isExpanded }))} size={20} /></View>}
          title={facilityName}
          titleStyle={styles.facilityTitle}
        />
        </View>
        {!isExpanded && activeRecipe && <FacilityProductionStatus compact decayCostPerMinute={decayCostPerMinute} effectiveWorkPerMinute={effectiveWorkPerMinute} getInputQuality={(resourceType) => inventory.getQuality(resourceType)} getOutputQuality={getActiveOutputQuality} market={market} outputMultiplier={outputMultiplier} progress={facilityView.recipeProgress[activeRecipe.name] ?? 0} recipe={activeRecipe} sizeMultiplier={sizeMultiplier} staffWagePerMinute={calculateFacilityStaffWagePerMinute(assignedWorkers, facilityView.staffWagePerWorkerPerMinute)} status={productionStatus} />}
        {isExpanded && <>
          <View style={styles.facilityProductionSection}>
            {activeRecipe && <View style={styles.facilityProductionTop}><FacilityResourceSummary inputQ={qualityInputQ} inputSourceCost={facilityView.recipeInputSourceCost} maintenanceCost={calculateFacilityProductionMaintenanceCost(facilityView, activeRecipe, market)} sizeMultiplier={sizeMultiplier} staffMaxQ={facilityView.staffQuality} getQualityBreakdown={(output, weightedInputQ, facilityMaxQ) => calculateOutputQuality({ researchMaxQ: getResourceResearchMaxQ(output.resourceType, completedResearchProjectIds), weightedInputQ, upgradeMaxQ: facilityMaxQ, productionMaxQ: calculateProductionMaxQ(producedByResource[output.resourceType]), staffMaxQ: facilityView.staffQuality, outputBonusQ: output.outputBonusQ })} inventory={inventory} outputMultiplier={outputMultiplier} recipe={activeRecipe} upgradeMaxQ={upgradeMaxQ} /><View style={styles.facilityRecipeActions}>
              <IconButton accessibilityLabel={allInputsAutoBuyEnabled ? 'Disable autobuy for production cycle inputs' : 'Allow autobuy for production cycle inputs'} containerColor={allInputsAutoBuyEnabled ? colors.marketAutomationActive : colors.marketAutomation} disabled={productionCycleInputs.length === 0} icon={APP_ICONS.marketAutoBuy} iconColor={colors.onDark} onPress={() => productionCycleInputs.forEach((input) => setMarketAutomation(input.resourceType, { autoBuyEnabled: !allInputsAutoBuyEnabled }))} size={16} style={styles.facilityRecipeActionButton} />
              <IconButton accessibilityLabel="Buy missing inputs for one production cycle" containerColor={colors.marketBuy} disabled={!hasMissingCycleInputs} icon={APP_ICONS.marketBuy} iconColor={colors.onDark} onPress={() => productionCycleInputs.forEach((input) => { const missingAmount = Math.max(0, input.amount - inventory.getAmount(input.resourceType)); if (missingAmount > 0) buyMarketResource(input.resourceType, missingAmount); })} size={16} style={styles.facilityRecipeActionButton} />
            </View></View>}
            <FacilityProductionStatus decayCostPerMinute={decayCostPerMinute} effectiveWorkPerMinute={effectiveWorkPerMinute} getInputQuality={(resourceType) => inventory.getQuality(resourceType)} getOutputQuality={getActiveOutputQuality} market={market} outputMultiplier={outputMultiplier} progress={activeRecipe ? facilityView.recipeProgress[activeRecipe.name] ?? 0 : 0} recipe={activeRecipe ?? null} sizeMultiplier={sizeMultiplier} staffWagePerMinute={calculateFacilityStaffWagePerMinute(assignedWorkers, facilityView.staffWagePerWorkerPerMinute)} status={productionStatus} />
          </View>
          <View style={styles.facilityTabList}>
            <View ref={isFirstFacility && focusTarget === 'efficiency' ? firstFacilityFocusRef : undefined} onLayout={isFirstFacility && focusTarget === 'efficiency' ? measureFirstFacilityFocus : undefined} style={[styles.facilityTabContainer, isFirstFacility && focusTarget === 'efficiency' && styles.tutorialFirstFacilityHeader]}><TouchableRipple accessibilityLabel={`Show facility efficiency and staff for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'efficiency' }))} style={[styles.facilityTab, activeDetailTab === 'efficiency' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'efficiency' && styles.facilityTabLabelActive]}>Facility efficiency and staff</Text></TouchableRipple></View>
            <TouchableRipple accessibilityLabel={`Show recipes for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'recipe' }))} style={[styles.facilityTab, activeDetailTab === 'recipe' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'recipe' && styles.facilityTabLabelActive]}>Recipe</Text></TouchableRipple>
            <TouchableRipple accessibilityLabel={`Show upgrades for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'upgrades' }))} style={[styles.facilityTab, activeDetailTab === 'upgrades' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'upgrades' && styles.facilityTabLabelActive]}>Upgrades</Text></TouchableRipple>
            <TouchableRipple accessibilityLabel={`Show finance for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'finance' }))} style={[styles.facilityTab, activeDetailTab === 'finance' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'finance' && styles.facilityTabLabelActive]}>Finance</Text></TouchableRipple>
          </View>
          {activeDetailTab === 'recipe' && <View ref={isRecipeFocus && !firstFacilityRecipeName ? firstFacilityFocusRef : undefined} onLayout={isRecipeFocus && !firstFacilityRecipeName ? measureFirstFacilityFocus : undefined} style={styles.facilityRecipeSelector}>
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
            {definition.recipes.map((recipe) => { const researchProjectId = getRecipeResearchProjectId(recipe.name); const researchAvailability = getResearchAvailability(researchProjectId); const recipeEffectiveWorkPerMinute = calculateFacilityEffectiveWork(facilityView, BASE_WORK_PER_MINUTE, getRecipeResearchWorkSpeedMultiplier(recipe.name, completedResearchProjectIds)); const isSelectedRecipeFocus = isRecipeFocus && firstFacilityRecipeName === recipe.name; return <View key={recipe.name} ref={isSelectedRecipeFocus ? firstFacilityFocusRef : undefined} onLayout={isSelectedRecipeFocus ? measureFirstFacilityFocus : undefined}><RecipeOption canResearch={researchAvailability.startable} decayCostPerMinute={calculateFacilityDecayCostPerMinute(definition.landCost * sizeMultiplier, definition.constructionMaterialsCost * sizeMultiplier, definition.industrialMachinesCost * sizeMultiplier, facilityCondition, totalConditionDecayMultiplier, recipeEffectiveWorkPerMinute, recipe, market.getLocalPrice(ResourceType.ConstructionMaterials), market.getLocalPrice(ResourceType.IndustrialMachines), sizeMultiplier)} effectiveWorkPerMinute={recipeEffectiveWorkPerMinute} freeTutorialResearch={researchAvailability.usesFreeGrant} getOutputQuality={(resourceType) => { const output = recipe.outputs.find((candidate) => candidate.resourceType === resourceType); return output ? getOutputQuality(recipe, calculateRecipeInputQ(recipe, inventory, sizeMultiplier), output) : 1; }} locked={!research.hasCompleted(researchProjectId)} market={market} outputMultiplier={outputMultiplier} recipe={recipe} selected={activeRecipeName === recipe.name} sizeMultiplier={sizeMultiplier} staffWagePerMinute={calculateFacilityStaffWagePerMinute(assignedWorkers, facilityView.staffWagePerWorkerPerMinute)} inventory={inventory} onPress={() => setFacilityProductionCycle(facilityId, [...facilityView.productionCycle, recipe.name])} onResearch={() => { if (startResearch(researchProjectId) && isFirstFacility && firstFacilityStep === 'footprint') onFirstFacilityRecipeSelected?.(recipe.name); }} /></View>; })}
          </View>}
          {activeDetailTab === 'efficiency' && <View style={[styles.facilityEfficiencySection, isFirstFacility && firstFacilityStep === 'efficiency' && styles.tutorialFirstFacilityHeader]}>
            <View style={styles.facilityEfficiencyHeader}><Text style={styles.constructionYardRecipeLabel}>Facility efficiency</Text><Text style={[styles.facilityStaffingDetail, { color: getColorClass(Math.min(1, facilityEfficiency)) }]}>{formatPercent(facilityEfficiency, { decimals: 0 })}</Text></View>
            <View style={styles.facilityEfficiencyControls}>
              <View style={styles.facilityEfficiencyCard}>
              <View style={styles.facilityUpgradeHeader}><TooltipMaterialIcon color={colors.primary} label="Staffing" name={APP_ICONS.staffing} size={15} /><Text style={styles.facilityUpgradeLabel}>Staffing</Text></View>
              <View style={styles.facilityUpgradeAction}><Text style={styles.facilityStaffingDetail}>Staff {formatNumber(assignedWorkers)} / {formatNumber(requiredWorkers)}</Text><View style={{ flexDirection: 'row' }}><IconButton accessibilityLabel={`Open staffing controls for ${facilityName}`} icon={APP_ICONS.staffing} mode="contained" onPress={() => setStaffWageFacilityId(facilityId)} size={16} /><IconButton accessibilityLabel={`${facilityView.staffTraining ? 'Add staff to' : 'Open'} training for ${facilityName}`} icon={APP_ICONS.training} mode="contained" onPress={() => setStaffTrainingFacilityId(facilityId)} size={16} /></View></View>
                <View accessibilityLabel={`Staff Quality Q${formatNumber(staffQuality, { decimals: 2, forceDecimals: true })}; net direction over approximately ${FACILITY_STAFF_QUALITY_TREND_MEMORY_MINUTES} foreground minute${FACILITY_STAFF_QUALITY_TREND_MEMORY_MINUTES === 1 ? '' : 's'}: ${staffQualityTrend}`} style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>{`Staff Q (${FACILITY_STAFF_QUALITY_TREND_MEMORY_MINUTES}m)`}</Text><Text style={[styles.facilityEfficiencyValue, { color: getColorClass(Math.min(1, staffQuality / 100)) }]}>Q{formatNumber(staffQuality, { decimals: 2, forceDecimals: true })} {formatStaffQualityTrendArrow(staffQualityTrend)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><View style={styles.facilityConditionLabel}><Text style={styles.facilityEfficiencyLabel}>Wage effect</Text><TooltipMaterialIcon color={colors.muted} label={`Wage €${staffWageTargetPerWorkerPerMinute.toFixed(2)} is neutral for Q${staffQuality.toFixed(1)} in this economy phase. Current wage creates ${formatStaffQualityWagePressure(staffQualityWagePressurePerMinute)} wage-only pressure; training and experience are separate.`} name={APP_ICONS.help} size={12} /></View><Text style={styles.facilityEfficiencyValue}>{formatStaffQualityTrendArrow(staffQualityWageTrend)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Staff efficiency</Text><Text style={[styles.facilityEfficiencyValue, { color: getColorClass(Math.min(1, facilityView.staffingEfficiency)) }]}>{formatPercent(facilityView.staffingEfficiency, { decimals: 0 })}</Text></View>
                {pendingStaffingChange && <Text style={styles.facilityRepairCost}>Pending staffing: {formatNumber(assignedWorkers)} → {formatNumber(pendingStaffingChange.targetWorkers)} · {formatDuration(pendingStaffingSeconds / 60)}</Text>}
                {staffTraining && <Text style={styles.facilityRepairCost}>Staff training: {formatNumber(staffTraining.workers)} · {formatDuration(staffTrainingSeconds / 60)} remaining</Text>}
              </View>
              <View style={styles.facilityEfficiencyCard}>
              <View style={styles.facilityUpgradeHeader}><TooltipMaterialIcon color={colors.primary} label="Repair" name={APP_ICONS.repair} size={15} /><Text style={styles.facilityUpgradeLabel}>Repair</Text></View>
                <Text style={styles.facilityRepairCost}>Choose a target condition and preview its cost, value, and net gain.</Text>
                {pendingRepair && <Text style={styles.facilityRepairCost}>Repair in progress → {formatNumber(pendingRepair.targetCondition * 100, { decimals: 0 })}% · {formatDuration(pendingRepairSeconds / 60)} remaining</Text>}
                <View style={styles.facilityUpgradeAction}><Text style={styles.facilityStaffingDetail}>{facilityCondition >= 1 ? 'Configure auto-repair' : 'Set repair target'}</Text><IconButton accessibilityLabel={`Choose a repair target for ${facilityName}`} icon={APP_ICONS.repair} mode="contained" onPress={() => setRepairFacilityId(facilityId)} size={16} /></View>
              </View>
            </View>
            <View style={styles.facilityConditionSummary}>
              <View style={styles.facilityEfficiencyRow}><View style={styles.facilityConditionLabel}><TooltipMaterialIcon color={colors.muted} label="Facility condition" name={APP_ICONS.repair} size={14} /><Text style={styles.facilityEfficiencyLabel}>Facility condition</Text></View><Text style={[styles.facilityEfficiencyValue, { color: getColorClass(facilityCondition) }]}>{formatPercent(facilityCondition, { decimals: 0 })}</Text></View>
              <ProgressBar accessible accessibilityLabel={`Facility condition ${formatPercent(facilityCondition, { decimals: 0 })}`} color={getColorClass(facilityCondition)} progress={facilityCondition} style={styles.facilityConditionProgress} />
            </View>
          </View>}
          {activeDetailTab === 'upgrades' && <View style={styles.facilityUpgradesSection}>
          <View style={styles.facilityUpgradeHeader}><TooltipMaterialIcon color={colors.primary} label="Upgrades" name={APP_ICONS.upgrade} size={16} /><Text style={styles.constructionYardRecipeLabel}>Upgrades</Text></View>
            <View style={styles.facilityUpgradeSummary}>
              <FacilityMetric icon={APP_ICONS.speed} label={`x${formatNumber(speedUpgradeWorkSpeedMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}`} />
              <FacilityMetric icon={APP_ICONS.output} label={`x${formatNumber(outputMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}`} />
              <FacilityMetric icon={APP_ICONS.durability} label={`x${formatNumber(conditionDecayMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}`} />
              <FacilityMetric icon={APP_ICONS.quality} label={`Q${formatNumber(upgradeMaxQ, { decimals: 2, forceDecimals: true })}`} />
            </View>
            <View style={styles.facilityUpgradeControls}>
              <FacilityUpgradeControl canAfford={speedUpgradePayment.canAfford} cashCost={speedUpgradePayment.cashCost} constructionMaterialsCost={speedUpgradeConstructionMaterialsCost} euroCost={speedUpgradeCost} industrialMachinesCost={speedUpgradeIndustrialMachinesCost} icon={APP_ICONS.speed} label="Speed" level={speedUpgradeLevel} nextEffect={speedNextEffect} nextNetGain={projectedSpeedNetGain} onPress={() => upgradeFacility(facilityId, 'speed')} />
              <FacilityUpgradeControl canAfford={outputUpgradePayment.canAfford} cashCost={outputUpgradePayment.cashCost} constructionMaterialsCost={outputUpgradeConstructionMaterialsCost} euroCost={outputUpgradeCost} industrialMachinesCost={outputUpgradeIndustrialMachinesCost} icon={APP_ICONS.output} label="Output" level={outputUpgradeLevel} nextEffect={outputNextEffect} nextNetGain={projectedOutputNetGain} onPress={() => upgradeFacility(facilityId, 'output')} />
              <FacilityUpgradeControl canAfford={conditionDecayUpgradePayment.canAfford} cashCost={conditionDecayUpgradePayment.cashCost} constructionMaterialsCost={conditionDecayUpgradeConstructionMaterialsCost} euroCost={conditionDecayUpgradeCost} industrialMachinesCost={conditionDecayUpgradeIndustrialMachinesCost} icon={APP_ICONS.durability} label="Durability" level={conditionDecayUpgradeLevel} nextEffect={conditionNextEffect} nextNetGain={projectedConditionNetGain} onPress={() => upgradeFacility(facilityId, 'condition')} />
              <FacilityUpgradeControl canAfford={qualityUpgradePayment.canAfford} cashCost={qualityUpgradePayment.cashCost} constructionMaterialsCost={qualityUpgradeConstructionMaterialsCost} euroCost={qualityUpgradeCost} industrialMachinesCost={qualityUpgradeIndustrialMachinesCost} icon={APP_ICONS.quality} label="Quality" level={qualityUpgradeLevel} nextEffect={`${qualityNextEffect} · actual +Q${formatNumber(qualityUpgradeActualGain, { decimals: 2, forceDecimals: true })}`} nextNetGain={qualityUpgradeNetGain} onPress={() => upgradeFacility(facilityId, 'quality')} />
            </View>
          </View>}
          {activeDetailTab === 'finance' && <View style={styles.facilityUpgradesSection}>
            <View style={styles.facilityUpgradeHeader}><TooltipMaterialIcon color={colors.primary} label="Finance" name={APP_ICONS.currency} size={16} /><Text style={styles.constructionYardRecipeLabel}>Finance</Text></View>
            <View style={styles.facilityFinancePeriodPicker}>{FINANCE_REPORT_PERIODS.map((option) => <Button compact key={option.id} mode={option.id === financePeriod ? 'contained' : 'outlined'} onPress={() => setFacilityFinancePeriods((current) => ({ ...current, [facilityId]: option.id }))}>{option.label}</Button>)}</View>
            <View style={styles.facilityFinanceSection}>
              <Text style={styles.facilityFinanceSectionTitle}>Operating</Text>
              <View style={styles.facilityFinanceRows}>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Output value</Text><Text style={styles.facilityEfficiencyValue}>{formatCurrency(facilityPerformance.outputValue)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Input cost + production wear</Text><Text style={styles.facilityEfficiencyValue}>-{formatCurrency(facilityPerformance.sourceCost)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Maintenance expense</Text><Text style={styles.facilityEfficiencyValue}>-{formatCurrency(facilityPerformance.maintenanceExpense)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Staff wages</Text><Text style={styles.facilityEfficiencyValue}>-{formatCurrency(facilityPerformance.staffWageExpense)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Staffing & training</Text><Text style={styles.facilityEfficiencyValue}>-{formatCurrency(facilityPerformance.staffingExpense)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityUpgradeLabel}>Operating profit</Text><Text style={[styles.facilityUpgradeLevel, { color: facilityPerformance.operatingProfit < 0 ? colors.error : colors.primary }]}>{formatCurrency(facilityPerformance.operatingProfit)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Lifetime maintenance</Text><Text style={styles.facilityEfficiencyValue}>{formatCurrency(assetBreakdown.maintenanceExpense)}</Text></View>
              </View>
            </View>
            <View style={styles.facilityFinanceSection}>
              <Text style={styles.facilityFinanceSectionTitle}>Capital</Text>
              <View style={styles.facilityFinanceRows}>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Capital investment</Text><Text style={styles.facilityEfficiencyValue}>-{formatCurrency(facilityPerformance.capitalInvestment)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityUpgradeLabel}>Investment-adjusted result</Text><Text style={[styles.facilityUpgradeLevel, { color: facilityPerformance.investmentAdjustedResult < 0 ? colors.error : colors.primary }]}>{formatCurrency(facilityPerformance.investmentAdjustedResult)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Construction investment</Text><Text style={styles.facilityEfficiencyValue}>{formatCurrency(assetBreakdown.constructionInvestment)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Upgrade investment</Text><Text style={styles.facilityEfficiencyValue}>{formatCurrency(assetBreakdown.upgradeInvestment)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityUpgradeLabel}>Total capital invested</Text><Text style={styles.facilityUpgradeLevel}>{formatCurrency(assetBreakdown.capitalInvestment)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Wear & tear ({formatPercent(facilityCondition, { decimals: 0 })} condition)</Text><Text style={[styles.facilityEfficiencyValue, { color: colors.error }]}>-{formatCurrency(assetBreakdown.wearAndTear)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityUpgradeLabel}>Book value</Text><Text style={[styles.facilityUpgradeLevel, { color: colors.primary }]}>{formatCurrency(assetBreakdown.bookValue)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Current replacement value</Text><Text style={styles.facilityEfficiencyValue}>{formatCurrency(assetBreakdown.currentReplacementValue)}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Market revaluation</Text><Text style={[styles.facilityEfficiencyValue, { color: assetBreakdown.marketRevaluation < 0 ? colors.error : colors.primary }]}>{assetBreakdown.marketRevaluation < 0 ? '-' : '+'}{formatCurrency(Math.abs(assetBreakdown.marketRevaluation))}</Text></View>
                <View style={styles.facilityEfficiencyRow}><Text style={styles.facilityUpgradeLabel}>Current market value</Text><Text style={[styles.facilityUpgradeLevel, { color: colors.primary }]}>{formatCurrency(assetBreakdown.currentMarketValue)}</Text></View>
              </View>
            </View>
            <Text style={styles.facilityRepairCost}>Operating profit is output value less input cost, production wear, staff wages, and staffing/training costs in the selected period. Production wear is included here; actual repairs remain separate.</Text>
          </View>}
        </>}
      </Card.Content></Card>{repairFacilityId === facilityId && <FacilityRepairDialog activeRecipe={activeRecipe ?? null} autoRepairLimit={getFacilityAutoRepairLimit(completedResearchProjectIds)} currentGameTimeMs={currentGameTimeMs} facility={facility} finance={finance} getInputQuality={(resourceType) => inventory.getQuality(resourceType)} getOutputQuality={getActiveOutputQuality} inventory={inventory} market={market} onDismiss={() => setRepairFacilityId(null)} onRepair={(targetCondition) => { const started = repairFacility(facilityId, targetCondition); if (started) setRepairFacilityId(null); return started; }} onSetAutoRepair={(enabled, threshold, target) => setFacilityAutoRepair(facilityId, enabled, threshold, target)} recipeResearchWorkSpeedMultiplier={activeRecipe ? getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds) : 1} visible />}{staffWageFacilityId === facilityId && <FacilityStaffWageDialog activeRecipe={activeRecipe ?? null} currentGameTimeMs={currentGameTimeMs} facility={facility} getInputQuality={(resourceType) => inventory.getQuality(resourceType)} getOutputQuality={getActiveOutputQuality} market={market} onDismiss={() => setStaffWageFacilityId(null)} onSetStaffing={(workerCount, wage) => setFacilityStaffing(facilityId, workerCount, wage)} recipeResearchWorkSpeedMultiplier={activeRecipe ? getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds) : 1} visible />}{staffTrainingFacilityId === facilityId && <FacilityStaffTrainingDialog currentGameTimeMs={currentGameTimeMs} facility={facility} onDismiss={() => setStaffTrainingFacilityId(null)} onTrainStaff={(workerCount) => trainFacilityStaff?.(facilityId, workerCount) ?? false} visible />}</View>;
    })}
    {builtFacilities.length === 0 && <DetailRow label="Constructed facilities" value="None yet" />}
  </>;
}

function FacilityMetric({ color = colors.primary, icon, label, value }: { color?: string; icon: string; label: string; value?: string }) {
  return <View style={styles.facilityMetric}><TooltipMaterialIcon color={colors.muted} label={label.trim() || 'Facility metric'} name={icon} size={13} /><Text style={[styles.facilityMetricText, value !== undefined && { color }]}>{value ?? label}</Text></View>;
}

function formatStaffQualityTrendArrow(trend: 'rising' | 'falling' | 'steady'): string {
  return trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→';
}

function FacilityUpgradeControl({ canAfford, cashCost, constructionMaterialsCost, euroCost, industrialMachinesCost, icon, label, level, nextEffect, nextNetGain, onPress }: { canAfford: boolean; cashCost: number; constructionMaterialsCost: number; euroCost: number; industrialMachinesCost: number; icon: string; label: string; level: number; nextEffect: string; nextNetGain?: number; onPress: () => void }) {
  return <View style={styles.facilityUpgradeCard}><View style={styles.facilityUpgradeHeader}><TooltipMaterialIcon color={colors.primary} label={label} name={icon} size={15} /><Text style={styles.facilityUpgradeLabel}>{label}</Text></View><Text style={styles.facilityUpgradeLevel}>L{formatNumber(level)} → L{formatNumber(level + 1)}</Text><Text style={styles.facilityUpgradeEffect}>{nextEffect}</Text>{nextNetGain !== undefined && <Text style={styles.facilityUpgradeEffect}>Net gain after upgrade: {formatCurrency(nextNetGain)}/min</Text>}<View style={styles.facilityUpgradeAction}><Text style={styles.facilityUpgradeCost}>{`Cost: ${formatCurrency(cashCost)}\n${formatCurrency(euroCost)} · `}<TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} />{` Construction Materials: ${formatNumber(constructionMaterialsCost, { smartDecimals: true })} · `}<TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} />{` Industrial Machines: ${formatNumber(industrialMachinesCost, { smartDecimals: true })}`}</Text><IconButton accessibilityLabel={`Upgrade ${label} to level ${level + 1} for ${formatCurrency(cashCost)} plus Construction Materials and Industrial Machines`} disabled={!canAfford} icon={APP_ICONS.add} mode="contained" onPress={onPress} size={16} /></View></View>;
}

function RecipeOption({ canResearch, decayCostPerMinute, effectiveWorkPerMinute, freeTutorialResearch, getOutputQuality, inventory, locked, market, onPress, onResearch, outputMultiplier, recipe, selected, sizeMultiplier, staffWagePerMinute }: { canResearch: boolean; decayCostPerMinute: number; effectiveWorkPerMinute: number; freeTutorialResearch: boolean; getOutputQuality: (resourceType: ResourceType) => number; inventory: Inventory; locked: boolean; market: Market; onPress: () => void; onResearch: () => void; outputMultiplier: number; recipe: Recipe; selected: boolean; sizeMultiplier: number; staffWagePerMinute: number }) {
  const inputSummary = recipe.inputs.length === 0 ? 'No inputs' : recipe.inputs.map((input, index) => <Text key={input.resourceType}>{index > 0 ? '  ' : ''}<TooltipResourceIcon resourceType={input.resourceType} /> {formatNumber(input.amount * sizeMultiplier, { smartDecimals: true })}/{formatNumber(inventory.getAmount(input.resourceType), { smartDecimals: true })}</Text>);
  const hasMissingInputs = recipe.inputs.some((input) => !inventory.has(input.resourceType, input.amount * sizeMultiplier));
  const qualityBoosts = recipe.outputs.map((output) => output.outputBonusQ ?? 0).filter((bonus) => bonus > 0);
  const qualityBoostLabel = qualityBoosts.length === 0
    ? 'None'
    : qualityBoosts.map((bonus) => `+Q${formatNumber(bonus, { decimals: 2, forceDecimals: true })} (${formatPercent(bonus, { decimals: 0 })})`).join(', ');
  const valuePerMinute = calculateRecipeValuePerMinute(recipe, market, outputMultiplier, effectiveWorkPerMinute, (resourceType) => inventory.getQuality(resourceType), getOutputQuality, sizeMultiplier);
  const netGainPerMinute = valuePerMinute - decayCostPerMinute - Math.max(0, staffWagePerMinute);
  return <View style={[styles.facilityRecipeOption, selected && styles.facilityRecipeOptionActive, hasMissingInputs && styles.facilityRecipeOptionUnavailable, locked && styles.facilityRecipeOptionUnavailable]}><TouchableRipple accessibilityLabel={`Run ${formatRecipeName(recipe)}. Quality boost: ${qualityBoostLabel}`} disabled={locked} onPress={onPress}><View><View style={styles.facilityRecipeOptionStats}><TooltipTextIcon label={formatRecipeName(recipe)}>{RECIPE_ICONS[recipe.name]}</TooltipTextIcon><Text style={styles.facilityRecipeOptionName}>{formatRecipeName(recipe)}</Text></View><Text style={[styles.facilityRecipeOptionDetails, (hasMissingInputs || locked) && styles.facilityRecipeOptionMissing]}>{locked ? 'Research required' : <>Inputs: {inputSummary}</>}</Text><Text style={styles.facilityRecipeOptionDetails}>Quality boost: {qualityBoostLabel}</Text><View style={styles.facilityRecipeOptionStats}><Text style={styles.facilityRecipeOptionDetails}>Required work: {formatNumber(recipe.requiredWork * sizeMultiplier, { smartDecimals: true })}</Text><Text style={styles.facilityRecipeOptionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.facilityRecipeOptionDetails}>Net gain/min: {formatCurrency(netGainPerMinute)}</Text><Text style={styles.facilityRecipeOptionDetails}>Decay cost/min: {formatConditionCost(decayCostPerMinute, market)}</Text></View></View></TouchableRipple>{locked && <Button accessibilityLabel={freeTutorialResearch ? `Research ${formatRecipeName(recipe)} for free with the tutorial grant` : `Research ${formatRecipeName(recipe)}`} compact disabled={!canResearch} icon={APP_ICONS.research} onPress={onResearch}>{freeTutorialResearch ? 'Research recipe for free' : 'Research recipe'}</Button>}</View>;
}

function FacilityResourceSummary({ getQualityBreakdown, inputQ, inputSourceCost, inventory, maintenanceCost, outputMultiplier, recipe, sizeMultiplier, staffMaxQ, upgradeMaxQ }: { getQualityBreakdown: (output: RecipeOutput, weightedInputQ: number | null, upgradeMaxQ: number) => OutputQualityBreakdown; inputQ: number | null; inputSourceCost: number | null; inventory: Inventory; maintenanceCost: number; outputMultiplier: number; recipe: Recipe; sizeMultiplier: number; staffMaxQ: number; upgradeMaxQ: number }) {
  const weightedInputQ = inputQ ?? calculateRecipeInputQ(recipe, inventory, sizeMultiplier);
  const directMaterialSourceCost = inputSourceCost ?? calculateRecipeInputSourceCost(recipe, inventory, sizeMultiplier);
  const outputAmount = recipe.outputs.reduce((total, output) => total + output.amount * sizeMultiplier * outputMultiplier, 0);
  const outputSourceCostPerUnit = outputAmount > 0 ? (directMaterialSourceCost + maintenanceCost) / outputAmount : 0;
  const inputMaxQ = weightedInputQ === null ? null : calculateInputMaxQ(weightedInputQ);
  const inputQualityDetails = recipe.inputs.map((input) => ({ resourceType: input.resourceType, quality: inventory.getQuality(input.resourceType) }));
  const outputQualityDetails = recipe.outputs.map((output) => ({ output, breakdown: getQualityBreakdown(output, weightedInputQ, upgradeMaxQ) }));
  const qualityNumber = (value: number) => formatNumber(value, { decimals: 2, forceDecimals: true });
  const inputQualitySummary = inputQualityDetails.map(({ resourceType, quality }) => `${getResource(resourceType).icon}Q${qualityNumber(quality)}`).join(', ');
  const outputQualitySummary = inputMaxQ === null ? '' : outputQualityDetails.map(({ output }) => `${getResource(output.resourceType).icon}Q${qualityNumber(inputMaxQ)}`).join(', ');
  const researchQualitySummary = outputQualityDetails.map(({ breakdown }) => `Q${qualityNumber(breakdown.researchMaxQ)}`).join(', ');
  const productionQualitySummary = outputQualityDetails.map(({ breakdown }) => `Q${qualityNumber(breakdown.productionMaxQ)}`).join(', ');
  const outputBonusSummary = outputQualityDetails.filter(({ breakdown }) => breakdown.outputBonusQ > 0).map(({ breakdown }) => `+Q${qualityNumber(breakdown.outputBonusQ)} recipe`).join(', ');

  return <View style={styles.facilityResourceSummary}>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Input</Text><View style={styles.facilityResourceItems}>{recipe.inputs.length === 0 ? <Text style={styles.facilityResourceEmpty}>—</Text> : recipe.inputs.map((input) => <Text key={input.resourceType} accessibilityLabel={`${getResource(input.resourceType).name} ${formatNumber(input.amount * sizeMultiplier, { smartDecimals: true })}`} style={styles.facilityResourceValue}><TooltipResourceIcon resourceType={input.resourceType} /> {formatNumber(input.amount * sizeMultiplier, { smartDecimals: true })}</Text>)}</View></View>
    <Text style={styles.facilityResourceArrow}>→</Text>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Output</Text><View style={styles.facilityResourceItems}>{outputQualityDetails.map(({ output, breakdown }) => <Text key={output.resourceType} accessibilityLabel={`${getResource(output.resourceType).name} ${formatNumber(output.amount * sizeMultiplier * outputMultiplier, { smartDecimals: true })} at quality ${qualityNumber(breakdown.outputQ)}${breakdown.outputBonusQ > 0 ? ` including recipe bonus Q${qualityNumber(breakdown.outputBonusQ)}` : ''} with source cost ${formatCurrency(outputSourceCostPerUnit)} per unit`} style={[styles.facilityResourceValue, styles.facilityResourceOutput]}><TooltipResourceIcon resourceType={output.resourceType} /> {formatNumber(output.amount * sizeMultiplier * outputMultiplier, { smartDecimals: true })} · Q{qualityNumber(breakdown.outputQ)}{breakdown.outputBonusQ > 0 ? ` (+Q${qualityNumber(breakdown.outputBonusQ)})` : ''} · {formatCurrency(outputSourceCostPerUnit)}/unit</Text>)}</View></View>
    <View accessibilityLabel={`Quality limits: ${inputQualitySummary || 'no inputs'} to ${outputQualitySummary || 'no outputs'}; research ${researchQualitySummary || 'none'}; upgrade Q${qualityNumber(upgradeMaxQ)}; production ${productionQualitySummary || 'none'}; staff Q${qualityNumber(staffMaxQ)}${outputBonusSummary ? `; ${outputBonusSummary}` : ''}`} style={styles.facilityResourceQuality}>
      <Text style={styles.facilityResourceQualityLabel}>Quality Limits:</Text>
      {inputMaxQ !== null && <MaterialCommunityIcons color={colors.muted} name={APP_ICONS.inputQuality} size={12} />}
      <Text style={styles.facilityResourceQualityText}>{inputQualityDetails.length === 0 ? 'No inputs' : inputQualitySummary}</Text>
      {inputMaxQ !== null && <><Text style={styles.facilityResourceQualityText}>→</Text><Text style={styles.facilityResourceQualityText}>{outputQualitySummary}</Text><Text style={styles.facilityResourceQualityText}>-</Text></>}
      <MaterialCommunityIcons color={colors.muted} name={APP_ICONS.research} size={12} />
      <Text style={styles.facilityResourceQualityText}>{researchQualitySummary || '—'}</Text>
      <Text style={styles.facilityResourceQualityText}>-</Text>
      <MaterialCommunityIcons color={colors.muted} name={APP_ICONS.upgrade} size={12} />
      <Text style={styles.facilityResourceQualityText}>{`Q${qualityNumber(upgradeMaxQ)}`}</Text>
      <Text style={styles.facilityResourceQualityText}>-</Text>
      <MaterialCommunityIcons color={colors.muted} name={APP_ICONS.output} size={12} />
      <Text style={styles.facilityResourceQualityText}>{productionQualitySummary || '—'}</Text>
      <Text style={styles.facilityResourceQualityText}>-</Text>
      <TooltipMaterialIcon color={colors.muted} label="Staff quality limit" name={APP_ICONS.staffing} size={12} />
      <Text style={styles.facilityResourceQualityText}>{`Q${qualityNumber(staffMaxQ)}`}</Text>
      {outputBonusSummary.length > 0 && <><Text style={styles.facilityResourceQualityText}>+</Text><Text style={styles.facilityResourceQualityText}>{outputBonusSummary}</Text></>}
    </View>
  </View>;
}

function FacilityProductionStatus({ compact = false, decayCostPerMinute, effectiveWorkPerMinute, getInputQuality, getOutputQuality, market, outputMultiplier, progress, recipe, sizeMultiplier = 1, staffWagePerMinute, status }: { compact?: boolean; decayCostPerMinute: number; effectiveWorkPerMinute: number; getInputQuality: (resourceType: ResourceType) => number; getOutputQuality?: (resourceType: ResourceType) => number; market: Market; outputMultiplier: number; progress: number; recipe: Recipe | null; sizeMultiplier?: number; staffWagePerMinute: number; status: 'not-started' | 'paused' | 'missing-inputs' | 'producing' }) {
  if (!recipe) return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  const requiredWork = recipe.requiredWork * sizeMultiplier;
  const progressPercent = clamp((progress / requiredWork) * 100, 0, 100);
  const valuePerMinute = calculateRecipeValuePerMinute(recipe, market, outputMultiplier, effectiveWorkPerMinute, getInputQuality, getOutputQuality, sizeMultiplier);
  const netGainPerMinute = calculateFacilityNetGainPerMinute(valuePerMinute, decayCostPerMinute, staffWagePerMinute);
  const workPerMinute = effectiveWorkPerMinute;
  const minutesRemaining = workPerMinute > 0 ? Math.max(0, requiredWork - progress) / workPerMinute : 0;
  const productionRateLabel = formatProductionRate(recipe, outputMultiplier, effectiveWorkPerMinute, minutesRemaining, sizeMultiplier);
  if (compact) return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><View style={styles.productionProgressValues}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionTimeLeft}>Net gain/min: {formatCurrency(netGainPerMinute)}</Text><Text style={styles.productionTimeLeft}>Decay cost/min: {formatCurrency(decayCostPerMinute)}</Text></View><View style={styles.productionProgressMeta}><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text></View></View><Text style={styles.productionTimeLeft}>{productionRateLabel}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /></View>;
  if (status !== 'producing') return <View style={styles.productionProgress}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionTimeLeft}>Net gain/min: {formatCurrency(netGainPerMinute)}</Text><Text style={styles.productionTimeLeft}>Decay cost/min: {formatCurrency(decayCostPerMinute)}</Text><Text style={styles.productionTimeLeft}>{productionRateLabel}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text></View>;
  return <View style={styles.productionProgress}><View style={styles.productionProgressHeader}><View style={styles.productionProgressValues}><Text style={styles.productionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.productionTimeLeft}>Net gain/min: {formatCurrency(netGainPerMinute)}</Text><Text style={styles.productionTimeLeft}>Decay cost/min: {formatCurrency(decayCostPerMinute)}</Text></View><View style={styles.productionProgressMeta}><Text style={styles.productionPercent}>{formatPercent(progressPercent, { decimals: 0, input: 'percent' })}</Text></View></View><Text style={styles.productionTimeLeft}>{productionRateLabel}</Text><Text style={styles.productionTimeLeft}>Time left: {formatDuration(minutesRemaining)}</Text><ProgressBar color={colors.primary} progress={progressPercent / 100} style={styles.productionProgressBar} /></View>;
}

function formatRecipeProgress(progress: number, requiredWork: number, effectiveWorkPerMinute: number): string {
  if (effectiveWorkPerMinute <= 0) return '0 min';

  return `${formatDuration(progress / effectiveWorkPerMinute)}/${formatDuration(requiredWork / effectiveWorkPerMinute)}`;
}

function formatProductionRate(recipe: Recipe, outputMultiplier: number, effectiveWorkPerMinute: number, minutesRemaining: number, sizeMultiplier = 1): string {
  if (recipe.requiredWork <= 0) return 'Production/min: 0';

  const outputsPerMinute = recipe.outputs.map((output) => ({
    resourceType: output.resourceType,
    amount: output.amount * sizeMultiplier * outputMultiplier * effectiveWorkPerMinute / (recipe.requiredWork * sizeMultiplier),
  }));
  const useSeconds = minutesRemaining < 1;
  const unit = useSeconds ? 'sec' : 'min';
  return `Production/${unit}: ${outputsPerMinute.map(({ resourceType, amount }) => `${getResource(resourceType).name} ${formatNumber(useSeconds ? amount / 60 : amount, { smartDecimals: true })}`).join(' + ')}`;
}

function formatConditionCost(materialAmount: number, market: Market): ReactNode {
  const currencyCost = materialAmount * market.getLocalPrice(ResourceType.ConstructionMaterials);
  return <><TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} /> {`${formatNumber(materialAmount, { smartDecimals: true })}/${formatCurrency(currencyCost)}`}</>;
}
