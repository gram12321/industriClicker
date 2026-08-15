import { useRef, useState } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, IconButton, List, ProgressBar, Text, TouchableRipple } from 'react-native-paper';
import { colors } from '@/theme';
import type { Finance } from '@/game/finance';
import { Facility, type FacilityCollection, type FacilityUpgradeKind, type FacilityView } from '@/game/facilities';
import { calculateFacilityEffectiveWork, FACILITY_GROUPS, FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE, FACILITY_REPAIR_MATERIAL_COST_RATE, getConditionDecayMultiplier, getFacilityDefinition, getFacilityProductionStatus, getFacilityRepairCost, getFacilityUpgradeCost, getFacilityUpgradeResourceCost, getOutputUpgradeMultiplier, getRecipeProductionConditionLoss, getSpeedUpgradeWorkSpeedMultiplier } from '@/game/facilities';
import { calculateAsymmetricalScaler01 } from '@/game/core/math';
import type { Inventory } from '@/game/inventory';
import type { Market, MarketAutomation } from '@/game/market';
import type { Recipe } from '@/game/recipes';
import { getRecipeResearchProjectId, getRecipeResearchWorkSpeedMultiplier, type ResearchLedger, type ResearchProjectId } from '@/game/research';
import { BASE_WORK_PER_MINUTE } from '@/game/core/time';
import { getResource, getResourceIcon, ResourceType } from '@/game/resources';
import { clamp, formatCurrency, formatDuration, formatNumber, formatPercent } from '@/utils';
import { DetailRow, SectionHeading, WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import type { ResearchAvailability } from '@/game/core/stores';

type FacilityDetailTab = 'efficiency' | 'recipe' | 'upgrades';

export function ProductionView({
  buyMarketResource, facilities, finance, getResearchAvailability, inventory, isBuildFacilityTutorial, market, onBuildFacilityLayout, openConstructionYard, repairFacility, requestFacilityDestruction, research, setFacilityProductionActive, setFacilityRecipe, setFacilityWorkers, setMarketAutomation, startResearch, upgradeFacility,
}: {
  facilities: FacilityCollection;
  buyMarketResource: (resourceType: Recipe['inputs'][number]['resourceType'], amount: number) => boolean;
  finance: Finance;
  getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
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
  startResearch: (projectId: ResearchProjectId) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  const [collapsedFacilities, setCollapsedFacilities] = useState<Record<string, boolean>>({});
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
      const { assignedWorkers, conditionDecayMultiplier, conditionDecayUpgradeLevel, facilityEfficiency, facilityCondition, outputMultiplier, outputUpgradeLevel, overstaffingConditionDecayMultiplier, requiredWorkers, speedUpgradeLevel, speedUpgradeWorkSpeedMultiplier } = facilityView;
      const totalConditionDecayMultiplier = conditionDecayMultiplier * overstaffingConditionDecayMultiplier;
      const speedUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, speedUpgradeLevel);
      const outputUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, outputUpgradeLevel);
      const conditionDecayUpgradeCost = getFacilityUpgradeCost(definition.upgradeCost, conditionDecayUpgradeLevel);
      const speedUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, speedUpgradeLevel);
      const outputUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, outputUpgradeLevel);
      const conditionDecayUpgradeConstructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, conditionDecayUpgradeLevel);
      const speedUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, speedUpgradeLevel);
      const outputUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, outputUpgradeLevel);
      const conditionDecayUpgradeIndustrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, conditionDecayUpgradeLevel);
      const speedUpgradePayment = getResourcePurchasePayment(finance, inventory, market, speedUpgradeCost, speedUpgradeConstructionMaterialsCost, speedUpgradeIndustrialMachinesCost);
      const outputUpgradePayment = getResourcePurchasePayment(finance, inventory, market, outputUpgradeCost, outputUpgradeConstructionMaterialsCost, outputUpgradeIndustrialMachinesCost);
      const conditionDecayUpgradePayment = getResourcePurchasePayment(finance, inventory, market, conditionDecayUpgradeCost, conditionDecayUpgradeConstructionMaterialsCost, conditionDecayUpgradeIndustrialMachinesCost);
      const speedNextEffect = `Next: ${formatPercent(getSpeedUpgradeWorkSpeedMultiplier(speedUpgradeLevel + 1) / speedUpgradeWorkSpeedMultiplier - 1, { decimals: 1 })} speed`;
      const outputNextEffect = `Next: ${formatPercent(getOutputUpgradeMultiplier(outputUpgradeLevel + 1) / outputMultiplier - 1, { decimals: 1 })} output`;
      const conditionNextEffect = `Next: ${formatPercent(1 - getConditionDecayMultiplier(conditionDecayUpgradeLevel + 1) / conditionDecayMultiplier, { decimals: 1 })} less decay`;
      const projectedSpeedNetGain = activeRecipe ? getProjectedUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), 'speed') : undefined;
      const projectedOutputNetGain = activeRecipe ? getProjectedUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), 'output') : undefined;
      const projectedConditionNetGain = activeRecipe ? getProjectedUpgradeNetGainPerMinute(facility, activeRecipe, market, getRecipeResearchWorkSpeedMultiplier(activeRecipe.name, completedResearchProjectIds), 'condition') : undefined;
      const repairEuroCost = getFacilityRepairCost(definition.landCost, facilityCondition);
      const repairConstructionMaterialsCost = getFacilityRepairCost(definition.constructionMaterialsCost, facilityCondition);
      const repairIndustrialMachinesCost = getFacilityRepairCost(definition.industrialMachinesCost, facilityCondition);
      const repairPayment = getResourcePurchasePayment(finance, inventory, market, repairEuroCost, repairConstructionMaterialsCost, repairIndustrialMachinesCost);
      const canRepair = repairPayment.canAfford && repairEuroCost + repairConstructionMaterialsCost + repairIndustrialMachinesCost > 0;
      const isExpanded = collapsedFacilities[facilityId] !== true;
      const activeDetailTab = facilityDetailTabs[facilityId] ?? 'recipe';
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
          right={() => <View style={styles.facilityTopActions}>{activeRecipe && <IconButton accessibilityLabel={`${facilityView.isActive ? 'Pause' : 'Resume'} ${facilityName}`} icon={facilityView.isActive ? APP_ICONS.pause : APP_ICONS.resume} onPress={() => setFacilityProductionActive(facilityId, !facilityView.isActive)} size={20} />}<IconButton accessibilityLabel={`Sell ${facilityName}`} icon={APP_ICONS.destroy} iconColor={colors.error} onPress={() => requestFacilityDestruction(facilityId)} size={20} /><IconButton accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${facilityName}`} icon={isExpanded ? APP_ICONS.collapse : APP_ICONS.expand} onPress={() => setCollapsedFacilities((current) => ({ ...current, [facilityId]: isExpanded }))} size={20} /></View>}
          title={facilityName}
          titleStyle={styles.facilityTitle}
        />
        {!isExpanded && activeRecipe && <FacilityProductionStatus compact decayCostPerMinute={getFacilityDecayCostPerMinute(definition.constructionMaterialsCost, facilityCondition, totalConditionDecayMultiplier, effectiveWorkPerMinute, activeRecipe)} effectiveWorkPerMinute={effectiveWorkPerMinute} market={market} outputMultiplier={outputMultiplier} progress={facilityView.recipeProgress[activeRecipe.name] ?? 0} recipe={activeRecipe} status={productionStatus} />}
        {isExpanded && <>
          <View style={styles.facilityProductionSection}>
            {activeRecipe && <View style={styles.facilityProductionTop}><FacilityResourceSummary outputMultiplier={outputMultiplier} recipe={activeRecipe} /><View style={styles.facilityRecipeActions}>
              <IconButton accessibilityLabel={allInputsAutoBuyEnabled ? 'Disable autobuy for recipe inputs' : 'Allow autobuy for recipe inputs'} containerColor={allInputsAutoBuyEnabled ? colors.marketAutomationActive : colors.marketAutomation} disabled={activeRecipe.inputs.length === 0} icon={APP_ICONS.marketAutoBuy} iconColor={colors.onDark} onPress={() => activeRecipe.inputs.forEach((input) => setMarketAutomation(input.resourceType, { autoBuyEnabled: !allInputsAutoBuyEnabled }))} size={16} style={styles.facilityRecipeActionButton} />
              <IconButton accessibilityLabel="Buy missing inputs for one production cycle" containerColor={colors.marketBuy} disabled={!hasMissingInputs} icon={APP_ICONS.marketBuy} iconColor={colors.onDark} onPress={() => activeRecipe.inputs.forEach((input) => { const missingAmount = Math.max(0, input.amount - inventory.getAmount(input.resourceType)); if (missingAmount > 0) buyMarketResource(input.resourceType, missingAmount); })} size={16} style={styles.facilityRecipeActionButton} />
            </View></View>}
            <FacilityProductionStatus decayCostPerMinute={getFacilityDecayCostPerMinute(definition.constructionMaterialsCost, facilityCondition, totalConditionDecayMultiplier, effectiveWorkPerMinute, activeRecipe ?? null)} effectiveWorkPerMinute={effectiveWorkPerMinute} market={market} outputMultiplier={outputMultiplier} progress={activeRecipe ? facilityView.recipeProgress[activeRecipe.name] ?? 0 : 0} recipe={activeRecipe ?? null} status={productionStatus} />
          </View>
          <View style={styles.facilityTabList}>
            <TouchableRipple accessibilityLabel={`Show Facility efficiency for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'efficiency' }))} style={[styles.facilityTab, activeDetailTab === 'efficiency' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'efficiency' && styles.facilityTabLabelActive]}>Facility efficiency</Text></TouchableRipple>
            <TouchableRipple accessibilityLabel={`Show recipes for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'recipe' }))} style={[styles.facilityTab, activeDetailTab === 'recipe' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'recipe' && styles.facilityTabLabelActive]}>Recipe</Text></TouchableRipple>
            <TouchableRipple accessibilityLabel={`Show upgrades for ${facilityName}`} onPress={() => setFacilityDetailTabs((current) => ({ ...current, [facilityId]: 'upgrades' }))} style={[styles.facilityTab, activeDetailTab === 'upgrades' && styles.facilityTabActive]}><Text numberOfLines={1} style={[styles.facilityTabLabel, activeDetailTab === 'upgrades' && styles.facilityTabLabelActive]}>Upgrades</Text></TouchableRipple>
          </View>
          {activeDetailTab === 'recipe' && <View style={styles.facilityRecipeSelector}>
            <Text style={styles.facilityRecipeSelectorTitle}>Production recipe</Text>
            {definition.recipes.map((recipe) => { const researchProjectId = getRecipeResearchProjectId(recipe.name); const researchAvailability = getResearchAvailability(researchProjectId); const recipeEffectiveWorkPerMinute = calculateFacilityEffectiveWork(facilityView, BASE_WORK_PER_MINUTE, getRecipeResearchWorkSpeedMultiplier(recipe.name, completedResearchProjectIds)); return <RecipeOption canResearch={researchAvailability.startable} decayCostPerMinute={getFacilityDecayCostPerMinute(definition.constructionMaterialsCost, facilityCondition, totalConditionDecayMultiplier, recipeEffectiveWorkPerMinute, recipe)} effectiveWorkPerMinute={recipeEffectiveWorkPerMinute} freeTutorialResearch={researchAvailability.usesFreeGrant} key={recipe.name} locked={!research.hasCompleted(researchProjectId)} market={market} outputMultiplier={outputMultiplier} recipe={recipe} selected={activeRecipeName === recipe.name} inventory={inventory} onPress={() => setFacilityRecipe(facilityId, recipe.name)} onResearch={() => startResearch(researchProjectId)} />; })}
          </View>}
          {activeDetailTab === 'efficiency' && <View style={styles.facilityEfficiencySection}>
            <View style={styles.facilityEfficiencyHeader}><Text style={styles.constructionYardRecipeLabel}>Facility efficiency</Text><Text style={styles.facilityStaffingDetail}>{formatPercent(facilityEfficiency, { decimals: 0 })}</Text></View>
            <View style={styles.facilityEfficiencyControls}>
              <View style={styles.facilityEfficiencyCard}>
                <View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name={APP_ICONS.staffing as never} size={15} /><Text style={styles.facilityUpgradeLabel}>Staffing</Text></View>
                <View style={styles.facilityStaffingControls}>
                  <IconButton accessibilityLabel={`Remove worker from ${facilityName}`} disabled={assignedWorkers === 0} icon={APP_ICONS.minus} onPress={() => setFacilityWorkers(facilityId, assignedWorkers - 1)} size={18} />
                  <View style={styles.facilityStaffingSummary}><Text style={styles.facilityStaffingValue}>{formatNumber(assignedWorkers)} / {formatNumber(requiredWorkers)} workers</Text><Text style={styles.facilityStaffingDetail}>Staff efficiency {formatPercent(facilityView.staffingEfficiency, { decimals: 0 })}</Text>{overstaffingConditionDecayMultiplier > 1 && <Text style={styles.facilityStaffingDetail}>Overstaff wear x{formatNumber(overstaffingConditionDecayMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}</Text>}</View>
                  <IconButton accessibilityLabel={`Add worker to ${facilityName}`} icon={APP_ICONS.add} onPress={() => setFacilityWorkers(facilityId, assignedWorkers + 1)} size={18} />
                </View>
              </View>
              <View style={styles.facilityEfficiencyCard}>
                <View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name="wrench-outline" size={15} /><Text style={styles.facilityUpgradeLabel}>Repair</Text></View>
                <Text style={styles.facilityRepairCost}>{`Cost: ${formatCurrency(repairPayment.cashCost)}\n${formatCurrency(repairEuroCost)} · ${getResourceIcon(ResourceType.ConstructionMaterials)} ${formatNumber(repairConstructionMaterialsCost, { smartDecimals: true })} · ${getResourceIcon(ResourceType.IndustrialMachines)} ${formatNumber(repairIndustrialMachinesCost, { smartDecimals: true })}`}</Text>
                <View style={styles.facilityUpgradeAction}><Text style={styles.facilityStaffingDetail}>Restore to 100%</Text><IconButton accessibilityLabel={`Repair ${facilityName} for ${formatCurrency(repairPayment.cashCost)}, ${formatNumber(repairConstructionMaterialsCost, { smartDecimals: true })} Construction Materials, and ${formatNumber(repairIndustrialMachinesCost, { smartDecimals: true })} Industrial Machines`} disabled={!canRepair} icon="wrench" mode="contained" onPress={() => repairFacility(facilityId)} size={16} /></View>
              </View>
            </View>
            <View style={styles.facilityConditionSummary}>
              <View style={styles.facilityEfficiencyRow}><View style={styles.facilityConditionLabel}><MaterialCommunityIcons color={colors.primary} name="wrench-outline" size={14} /><Text style={styles.facilityEfficiencyLabel}>Facility condition</Text></View><Text style={styles.facilityEfficiencyValue}>{formatPercent(facilityCondition, { decimals: 0 })}</Text></View>
              <ProgressBar accessible accessibilityLabel={`Facility condition ${formatPercent(facilityCondition, { decimals: 0 })}`} color={colors.primary} progress={facilityCondition} style={styles.facilityConditionProgress} />
            </View>
          </View>}
          {activeDetailTab === 'upgrades' && <View style={styles.facilityUpgradesSection}>
            <View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name={APP_ICONS.upgrade} size={16} /><Text style={styles.constructionYardRecipeLabel}>Upgrades</Text></View>
            <View style={styles.facilityUpgradeSummary}>
              <FacilityMetric icon={APP_ICONS.speed} label={`x${formatNumber(speedUpgradeWorkSpeedMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}`} />
              <FacilityMetric icon={APP_ICONS.output} label={`x${formatNumber(outputMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}`} />
              <FacilityMetric icon={APP_ICONS.durability} label={`x${formatNumber(conditionDecayMultiplier, { decimals: 2, forceDecimals: true, adaptiveNearOne: false })}`} />
            </View>
            <View style={styles.facilityUpgradeControls}>
              <FacilityUpgradeControl canAfford={speedUpgradePayment.canAfford} cashCost={speedUpgradePayment.cashCost} constructionMaterialsCost={speedUpgradeConstructionMaterialsCost} euroCost={speedUpgradeCost} industrialMachinesCost={speedUpgradeIndustrialMachinesCost} icon={APP_ICONS.speed} label="Speed" level={speedUpgradeLevel} nextEffect={speedNextEffect} nextNetGain={projectedSpeedNetGain} onPress={() => upgradeFacility(facilityId, 'speed')} />
              <FacilityUpgradeControl canAfford={outputUpgradePayment.canAfford} cashCost={outputUpgradePayment.cashCost} constructionMaterialsCost={outputUpgradeConstructionMaterialsCost} euroCost={outputUpgradeCost} industrialMachinesCost={outputUpgradeIndustrialMachinesCost} icon={APP_ICONS.output} label="Output" level={outputUpgradeLevel} nextEffect={outputNextEffect} nextNetGain={projectedOutputNetGain} onPress={() => upgradeFacility(facilityId, 'output')} />
              <FacilityUpgradeControl canAfford={conditionDecayUpgradePayment.canAfford} cashCost={conditionDecayUpgradePayment.cashCost} constructionMaterialsCost={conditionDecayUpgradeConstructionMaterialsCost} euroCost={conditionDecayUpgradeCost} industrialMachinesCost={conditionDecayUpgradeIndustrialMachinesCost} icon={APP_ICONS.durability} label="Durability" level={conditionDecayUpgradeLevel} nextEffect={conditionNextEffect} nextNetGain={projectedConditionNetGain} onPress={() => upgradeFacility(facilityId, 'condition')} />
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

function FacilityUpgradeControl({ canAfford, cashCost, constructionMaterialsCost, euroCost, industrialMachinesCost, icon, label, level, nextEffect, nextNetGain, onPress }: { canAfford: boolean; cashCost: number; constructionMaterialsCost: number; euroCost: number; industrialMachinesCost: number; icon: string; label: string; level: number; nextEffect: string; nextNetGain?: number; onPress: () => void }) {
  return <View style={styles.facilityUpgradeCard}><View style={styles.facilityUpgradeHeader}><MaterialCommunityIcons color={colors.primary} name={icon as never} size={15} /><Text style={styles.facilityUpgradeLabel}>{label}</Text></View><Text style={styles.facilityUpgradeLevel}>L{formatNumber(level)} → L{formatNumber(level + 1)}</Text><Text style={styles.facilityUpgradeEffect}>{nextEffect}</Text>{nextNetGain !== undefined && <Text style={styles.facilityUpgradeEffect}>Net gain after upgrade: {formatCurrency(nextNetGain)}/min</Text>}<View style={styles.facilityUpgradeAction}><Text style={styles.facilityUpgradeCost}>{`Cost: ${formatCurrency(cashCost)}\n${formatCurrency(euroCost)} · ${getResourceIcon(ResourceType.ConstructionMaterials)} ${formatNumber(constructionMaterialsCost)} · ${getResourceIcon(ResourceType.IndustrialMachines)} ${formatNumber(industrialMachinesCost)}`}</Text><IconButton accessibilityLabel={`Upgrade ${label} to level ${level + 1} for ${formatCurrency(cashCost)}`} disabled={!canAfford} icon={APP_ICONS.add} mode="contained" onPress={onPress} size={16} /></View></View>;
}

function getResourcePurchasePayment(finance: Finance, inventory: Inventory, market: Market, cashBaseCost: number, constructionMaterialsCost: number, industrialMachinesCost: number) {
  const missingConstructionMaterials = Math.max(0, constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials));
  const missingIndustrialMachines = Math.max(0, industrialMachinesCost - inventory.getAmount(ResourceType.IndustrialMachines));
  const missingInputPurchaseCost = missingConstructionMaterials * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + missingIndustrialMachines * market.getLocalPrice(ResourceType.IndustrialMachines);
  const cashCost = cashBaseCost + missingInputPurchaseCost;
  return {
    canAfford: market.getLocalEntry(ResourceType.ConstructionMaterials).supply >= missingConstructionMaterials
      && market.getLocalEntry(ResourceType.IndustrialMachines).supply >= missingIndustrialMachines
      && finance.canAfford(cashCost),
    cashCost,
  };
}

function RecipeOption({ canResearch, decayCostPerMinute, effectiveWorkPerMinute, freeTutorialResearch, inventory, locked, market, onPress, onResearch, outputMultiplier, recipe, selected }: { canResearch: boolean; decayCostPerMinute: number; effectiveWorkPerMinute: number; freeTutorialResearch: boolean; inventory: Inventory; locked: boolean; market: Market; onPress: () => void; onResearch: () => void; outputMultiplier: number; recipe: Recipe; selected: boolean }) {
  const inputSummary = recipe.inputs.length === 0 ? 'No inputs' : recipe.inputs.map((input) => `${getResourceIcon(input.resourceType)} ${formatNumber(input.amount, { smartDecimals: true })}/${formatNumber(inventory.getAmount(input.resourceType), { smartDecimals: true })}`).join('  ');
  const hasMissingInputs = recipe.inputs.some((input) => !inventory.has(input.resourceType, input.amount));
  const valuePerMinute = getRecipeValuePerMinute(recipe, market, outputMultiplier, effectiveWorkPerMinute);
  const netGainPerMinute = getNetGainPerMinute(valuePerMinute, decayCostPerMinute, market);
  return <View style={[styles.facilityRecipeOption, selected && styles.facilityRecipeOptionActive, hasMissingInputs && styles.facilityRecipeOptionUnavailable, locked && styles.facilityRecipeOptionUnavailable]}><TouchableRipple accessibilityLabel={`Run ${formatRecipeName(recipe)}`} disabled={locked} onPress={onPress}><View><View style={styles.facilityRecipeOptionStats}><MaterialCommunityIcons color={colors.primary} name={RECIPE_ICONS[recipe.name] as never} size={16} /><Text style={styles.facilityRecipeOptionName}>{formatRecipeName(recipe)}</Text></View><Text style={[styles.facilityRecipeOptionDetails, (hasMissingInputs || locked) && styles.facilityRecipeOptionMissing]}>{locked ? 'Research required' : `Inputs: ${inputSummary}`}</Text><View style={styles.facilityRecipeOptionStats}><Text style={styles.facilityRecipeOptionDetails}>Required work: {formatNumber(recipe.requiredWork, { smartDecimals: true })}</Text><Text style={styles.facilityRecipeOptionValue}>Value/min: {formatCurrency(valuePerMinute)}</Text><Text style={styles.facilityRecipeOptionDetails}>Net gain/min: {formatCurrency(netGainPerMinute)}</Text><Text style={styles.facilityRecipeOptionDetails}>Decay cost/min: {formatConditionCost(decayCostPerMinute, market)}</Text></View></View></TouchableRipple>{locked && <Button accessibilityLabel={freeTutorialResearch ? `Research ${formatRecipeName(recipe)} for free with the tutorial grant` : `Research ${formatRecipeName(recipe)}`} compact disabled={!canResearch} icon={APP_ICONS.research} onPress={onResearch}>{freeTutorialResearch ? 'Research recipe for free' : 'Research recipe'}</Button>}</View>;
}

function FacilityResourceSummary({ outputMultiplier, recipe }: { outputMultiplier: number; recipe: Recipe }) {
  return <View style={styles.facilityResourceSummary}>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Input</Text><View style={styles.facilityResourceItems}>{recipe.inputs.length === 0 ? <Text style={styles.facilityResourceEmpty}>—</Text> : recipe.inputs.map((input) => <Text key={input.resourceType} accessibilityLabel={`${getResource(input.resourceType).name} ${formatNumber(input.amount, { smartDecimals: true })}`} style={styles.facilityResourceValue}>{getResourceIcon(input.resourceType)} {formatNumber(input.amount, { smartDecimals: true })}</Text>)}</View></View>
    <Text style={styles.facilityResourceArrow}>→</Text>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Output</Text><View style={styles.facilityResourceItems}>{recipe.outputs.map((output) => <Text key={output.resourceType} accessibilityLabel={`${getResource(output.resourceType).name} ${formatNumber(output.amount * outputMultiplier, { smartDecimals: true })}`} style={[styles.facilityResourceValue, styles.facilityResourceOutput]}>{getResourceIcon(output.resourceType)} {formatNumber(output.amount * outputMultiplier, { smartDecimals: true })}</Text>)}</View></View>
  </View>;
}

function FacilityProductionStatus({ compact = false, decayCostPerMinute, effectiveWorkPerMinute, market, outputMultiplier, progress, recipe, status }: { compact?: boolean; decayCostPerMinute: number; effectiveWorkPerMinute: number; market: Market; outputMultiplier: number; progress: number; recipe: Recipe | null; status: 'not-started' | 'paused' | 'missing-inputs' | 'producing' }) {
  if (!recipe) return <Text style={styles.productionError}>Production is not started. Choose a recipe to begin.</Text>;
  const progressPercent = clamp((progress / recipe.requiredWork) * 100, 0, 100);
  const valuePerMinute = getRecipeValuePerMinute(recipe, market, outputMultiplier, effectiveWorkPerMinute);
  const netGainPerMinute = getNetGainPerMinute(valuePerMinute, decayCostPerMinute, market);
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
  return `Production/${unit}: ${outputsPerMinute.map(({ resourceType, amount }) => `${getResourceIcon(resourceType)} ${formatNumber(useSeconds ? amount / 60 : amount, { smartDecimals: true })}`).join(' + ')}`;
}

function getRecipeValuePerMinute(recipe: Recipe, market: Market, outputMultiplier: number, workPerMinute: number): number {
  if (recipe.requiredWork <= 0) return 0;
  const cyclesPerMinute = workPerMinute / recipe.requiredWork;
  const outputValue = recipe.outputs
    .reduce((total, output) => total + output.amount * outputMultiplier * market.getLocalPrice(output.resourceType), 0);
  const inputValue = recipe.inputs.reduce((total, input) => total + input.amount * market.getLocalPrice(input.resourceType), 0);
  return (outputValue - inputValue) * cyclesPerMinute;
}

function getNetGainPerMinute(valuePerMinute: number, decayCostPerMinute: number, market: Market): number {
  return valuePerMinute - decayCostPerMinute * market.getLocalPrice(ResourceType.ConstructionMaterials);
}

function getProjectedUpgradeNetGainPerMinute(facility: Facility, recipe: Recipe, market: Market, recipeResearchWorkSpeedMultiplier: number, upgradeKind: FacilityUpgradeKind): number {
  const projectedFacility = Facility.fromSnapshot(facility.toSnapshot());
  if (upgradeKind === 'speed') projectedFacility.upgradeSpeed();
  if (upgradeKind === 'output') projectedFacility.upgradeOutput();
  if (upgradeKind === 'condition') projectedFacility.upgradeConditionDecay();

  const projectedView = projectedFacility.getView();
  const definition = getFacilityDefinition(projectedView.facilityType);
  const projectedEffectiveWork = calculateFacilityEffectiveWork(projectedView, BASE_WORK_PER_MINUTE, recipeResearchWorkSpeedMultiplier);
  const projectedValuePerMinute = getRecipeValuePerMinute(recipe, market, projectedView.outputMultiplier, projectedEffectiveWork);
  const projectedDecayCostPerMinute = getFacilityDecayCostPerMinute(
    definition.constructionMaterialsCost,
    projectedView.facilityCondition,
    projectedView.conditionDecayMultiplier * projectedView.overstaffingConditionDecayMultiplier,
    projectedEffectiveWork,
    recipe,
  );
  return getNetGainPerMinute(projectedValuePerMinute, projectedDecayCostPerMinute, market);
}

function getFacilityDecayCostPerMinute(constructionMaterialsCost: number, facilityCondition: number, conditionDecayMultiplier: number, effectiveWorkPerMinute: number, recipe: Recipe | null): number {
  const condition = clamp(facilityCondition, 0, 1);
  const productionConditionLossPerMinute = recipe && recipe.requiredWork > 0
    ? Math.max(0, effectiveWorkPerMinute) / recipe.requiredWork * getRecipeProductionConditionLoss(recipe)
    : 0;
  const conditionLossPerMinute = (FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE + productionConditionLossPerMinute) * calculateAsymmetricalScaler01(condition) * conditionDecayMultiplier;
  return Math.max(0, constructionMaterialsCost) * FACILITY_REPAIR_MATERIAL_COST_RATE * conditionLossPerMinute;
}

function formatConditionCost(materialAmount: number, market: Market): string {
  const currencyCost = materialAmount * market.getLocalPrice(ResourceType.ConstructionMaterials);
  return `${formatNumber(materialAmount, { smartDecimals: true })}/${formatCurrency(currencyCost)} ${getResourceIcon(ResourceType.ConstructionMaterials)}`;
}
