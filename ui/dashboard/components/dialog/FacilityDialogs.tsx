import { PanResponder, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Dialog, List, Portal, SegmentedButtons, Text } from 'react-native-paper';
import { colors } from '@/theme';
import { LOAN_COLLECTION, calculateFacilityAssetValue, type Finance } from '@/game/finance';
import type { Facility, FacilityCollection, FacilityType } from '@/game/facilities';
import { calculateFacilityResourcePayment, calculateProjectedFacilityConditionEconomics, FACILITY_GROUPS, getFacilityDefinition, getFacilityRepairCost } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import { ResourceType } from '@/game/resources';
import type { Recipe } from '@/game/recipes';
import { clamp, formatCurrency, formatNumber } from '@/utils';
import { WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import { TooltipResourceIcon, TooltipTextIcon } from '@/ui/dashboard/components/IconTooltip';
import { RecipeResourceSummary } from '@/ui/dashboard/components/RecipeResourceSummary';

function getMarketPurchaseCost(market: Market, resourceType: ResourceType, amount: number): number {
  if (amount <= 0) return 0;
  const quote = market.getLocalBuyQuote(resourceType, amount);
  return quote.success ? quote.unitPrice * quote.amount : Number.POSITIVE_INFINITY;
}

function getDisplayedMarketUnitPrice(market: Market, resourceType: ResourceType, amount: number): number {
  if (amount <= 0) return market.getLocalPrice(resourceType);
  const quote = market.getLocalBuyQuote(resourceType, amount);
  return quote.success ? quote.unitPrice : market.getLocalPrice(resourceType);
}

function CurrencyValue({ value }: { value: number }) {
  return <View style={styles.currencyValue}><MaterialCommunityIcons name={APP_ICONS.coin} size={16} color={styles.detailValue.color} /><Text style={styles.detailValue}>{formatCurrency(value).replace(/\s*€/u, '')}</Text></View>;
}

function repairTargetForSlider(currentCondition: number, sliderPosition: number): number {
  const position = Math.max(0, Math.min(1, sliderPosition));
  return Math.round((currentCondition + (1 - currentCondition) * position) * 100) / 100;
}

export function FacilityRepairDialog({
  activeRecipe,
  autoRepairLimit,
  facility,
  finance,
  getInputQuality,
  getOutputQuality,
  inventory,
  market,
  onDismiss,
  onRepair,
  onSetAutoRepair,
  recipeResearchWorkSpeedMultiplier,
  visible,
}: {
  activeRecipe: Recipe | null;
  autoRepairLimit: number;
  facility: Facility;
  finance: Finance;
  getInputQuality: (resourceType: ResourceType) => number;
  getOutputQuality?: (resourceType: ResourceType) => number;
  inventory: Inventory;
  market: Market;
  onDismiss: () => void;
  onRepair: (targetCondition: number) => void;
  onSetAutoRepair: (enabled: boolean, threshold: number, target: number) => boolean;
  recipeResearchWorkSpeedMultiplier: number;
  visible: boolean;
}) {
  const [targetCondition, setTargetCondition] = useState(1);
  const [autoRepairEnabled, setAutoRepairEnabled] = useState(false);
  const [autoRepairThreshold, setAutoRepairThreshold] = useState(0.7);
  const [autoRepairTarget, setAutoRepairTarget] = useState(1);
  const [autoRepairMessage, setAutoRepairMessage] = useState<string | null>(null);
  const sliderWidthRef = useRef(0);
  const facilityView = facility.getView();
  const currentCondition = facilityView.facilityCondition;
  const currentConditionRef = useRef(currentCondition);
  currentConditionRef.current = currentCondition;
  const selectedTarget = Math.max(currentCondition, Math.min(1, targetCondition));
  const sliderProgress = currentCondition >= 1 ? 1 : (selectedTarget - currentCondition) / (1 - currentCondition);
  const repairTargetSteps = [...new Set([currentCondition, 0.5, 0.75, 1].filter((condition) => condition >= currentCondition))];
  const definition = getFacilityDefinition(facilityView.facilityType);
  const repairEuroCost = getFacilityRepairCost(definition.landCost, currentCondition, selectedTarget);
  const repairConstructionMaterialsCost = getFacilityRepairCost(definition.constructionMaterialsCost, currentCondition, selectedTarget);
  const repairIndustrialMachinesCost = getFacilityRepairCost(definition.industrialMachinesCost, currentCondition, selectedTarget);
  const repairPayment = calculateFacilityResourcePayment(finance, inventory, market, repairEuroCost, repairConstructionMaterialsCost, repairIndustrialMachinesCost);
  const canRepair = selectedTarget > currentCondition && repairPayment.canAfford;
  const projectedEconomics = activeRecipe
    ? calculateProjectedFacilityConditionEconomics(facility, selectedTarget, activeRecipe, market, recipeResearchWorkSpeedMultiplier, getInputQuality, getOutputQuality)
    : null;
  const setSliderPosition = (position: number) => setTargetCondition(repairTargetForSlider(currentConditionRef.current, position));
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      if (sliderWidthRef.current > 0) setSliderPosition(event.nativeEvent.locationX / sliderWidthRef.current);
    },
    onPanResponderMove: (event) => {
      if (sliderWidthRef.current > 0) setSliderPosition(event.nativeEvent.locationX / sliderWidthRef.current);
    },
    onStartShouldSetPanResponder: () => true,
  })).current;

  useEffect(() => {
    if (!visible) return;
    const view = facility.getView();
    setTargetCondition(1);
    setAutoRepairEnabled(view.autoRepairEnabled);
    setAutoRepairThreshold(view.autoRepairThreshold);
    setAutoRepairTarget(view.autoRepairTarget);
    setAutoRepairMessage(null);
  }, [facility, visible]);

  return <Portal><Dialog dismissable onDismiss={onDismiss} visible={visible}>
    <Dialog.Title>{`Repair ${facilityView.displayName}`}</Dialog.Title>
    <Dialog.Content style={styles.dialogSummaryContent}>
      <Text style={styles.dialogDescription}>Choose a condition target. Costs and production projections update as you drag.</Text>
      <View style={styles.repairConditionTargets}><View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Current condition</Text><Text style={styles.facilityEfficiencyValue}>{formatNumber(currentCondition * 100, { decimals: 0 })}%</Text></View><View style={styles.facilityEfficiencyRow}><Text style={styles.facilityEfficiencyLabel}>Repair target</Text><Text style={styles.repairTargetValue}>{formatNumber(selectedTarget * 100, { decimals: 0 })}%</Text></View></View>
      <View accessibilityLabel={`Repair target ${formatNumber(selectedTarget * 100, { decimals: 0 })} percent`} style={styles.repairSlider}>
        <View onLayout={(event) => { sliderWidthRef.current = event.nativeEvent.layout.width; }} style={styles.marketSliderTouchArea} {...panResponder.panHandlers}>
          <View pointerEvents="none" style={styles.marketSliderTrack} />
          <View pointerEvents="none" style={[styles.marketSliderFill, { width: `${sliderProgress * 100}%` }]} />
          <View pointerEvents="none" style={[styles.marketSliderThumb, { left: `${sliderProgress * 100}%` }]} />
        </View>
        <View style={styles.marketSliderLabels}>{repairTargetSteps.map((condition) => <Pressable accessibilityLabel={`Set repair target to ${formatNumber(condition * 100, { decimals: 0 })} percent`} accessibilityRole="button" key={condition} onPress={() => setTargetCondition(condition)} style={styles.marketSliderStep}><View style={[styles.marketSliderMarker, Math.abs(selectedTarget - condition) < 0.005 && styles.marketSliderMarkerActive]} /><Text style={[styles.marketSliderLabel, Math.abs(selectedTarget - condition) < 0.005 && styles.marketSliderLabelActive]}>{formatNumber(condition * 100, { decimals: 0 })}%</Text></Pressable>)}</View>
      </View>
      <Card mode="contained" style={styles.dialogSummaryCard}><Card.Content style={styles.dialogSummaryContent}>
        <View style={styles.dialogSummaryRow}><Text>Repair cost</Text><Text style={styles.repairTargetValue}>{formatCurrency(repairPayment.cashCost)}</Text></View>
        <Text style={styles.facilityRepairCost}>{`${formatCurrency(repairEuroCost)} repair + market purchases for missing inputs\n`}<TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} />{` Construction Materials: ${formatNumber(repairConstructionMaterialsCost, { smartDecimals: true })} | `}<TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} />{` Industrial Machines: ${formatNumber(repairIndustrialMachinesCost, { smartDecimals: true })}`}</Text>
      </Card.Content></Card>
      {projectedEconomics ? <Card mode="contained" style={styles.dialogSummaryCard}><Card.Content style={styles.dialogSummaryContent}>
        <Text style={styles.facilityUpgradeLabel}>{`Projected at ${formatNumber(selectedTarget * 100, { decimals: 0 })}% condition`}</Text>
        <View style={styles.dialogSummaryRow}><Text>Value/min</Text><Text style={styles.repairTargetValue}>{formatCurrency(projectedEconomics.valuePerMinute)}</Text></View>
        <View style={styles.dialogSummaryRow}><Text>Maintenance/min</Text><Text style={styles.facilityRepairCost}>{formatCurrency(projectedEconomics.decayMaterialCostPerMinute * market.getLocalPrice(ResourceType.ConstructionMaterials))}</Text></View>
        <View style={styles.dialogSummaryRow}><Text>Net gain/min</Text><Text style={styles.repairTargetValue}>{formatCurrency(projectedEconomics.netGainPerMinute)}</Text></View>
      </Card.Content></Card> : <Text style={styles.dialogDescription}>Start a recipe to preview value and net gain per minute.</Text>}
      <Card mode="contained" style={styles.dialogSummaryCard}><Card.Content style={styles.dialogSummaryContent}>
        <View style={styles.dialogSummaryRow}><Text style={styles.facilityUpgradeLabel}>Auto-repair</Text><Text style={styles.facilityRepairCost}>{autoRepairLimit > 0 ? `${autoRepairLimit} facility slot${autoRepairLimit === 1 ? '' : 's'} researched` : 'Research Repair Technician to unlock'}</Text></View>
        {autoRepairLimit > 0 && <>
          <Text style={styles.facilityRepairCost}>Repair this facility when condition reaches:</Text>
          <SegmentedButtons buttons={[{ value: '0.5', label: '50%' }, { value: '0.7', label: '70%' }, { value: '0.8', label: '80%' }, { value: '0.9', label: '90%' }]} onValueChange={(value) => setAutoRepairThreshold(Number(value))} value={String(autoRepairThreshold)} />
          <Text style={styles.facilityRepairCost}>Then repair it to:</Text>
          <SegmentedButtons buttons={[{ value: '0.75', label: '75%' }, { value: '0.9', label: '90%' }, { value: '1', label: '100%' }]} onValueChange={(value) => setAutoRepairTarget(Number(value))} value={String(autoRepairTarget)} />
          <Button compact mode={autoRepairEnabled ? 'contained' : 'outlined'} onPress={() => setAutoRepairEnabled((enabled) => !enabled)}>{autoRepairEnabled ? 'Auto-repair enabled' : 'Enable auto-repair'}</Button>
          <Button compact disabled={autoRepairTarget <= autoRepairThreshold} onPress={() => setAutoRepairMessage(onSetAutoRepair(autoRepairEnabled, autoRepairThreshold, autoRepairTarget) ? 'Auto-repair settings saved.' : 'No available Repair Technician slot for this facility.')}>Save auto-repair settings</Button>
          {autoRepairMessage && <Text style={styles.facilityRepairCost}>{autoRepairMessage}</Text>}
        </>}
      </Card.Content></Card>
    </Dialog.Content>
    <Dialog.Actions><Button onPress={onDismiss}>Cancel</Button><Button disabled={!canRepair} mode="contained" onPress={() => onRepair(selectedTarget)}>{`Repair to ${formatNumber(selectedTarget * 100, { decimals: 0 })}%`}</Button></Dialog.Actions>
  </Dialog></Portal>;
}

export function FacilityConstructionDialog(props: {
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  pendingConstruction: FacilityType | null;
  pendingDestruction: string | null;
  isConstructionYardOpen: boolean;
  isConstructionTutorial?: boolean;
  isFacilitySelectionEnabled?: boolean;
  onCloseConstructionYard: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  onConfirmConstruction: () => void;
  onBuyMissingConstructionInputs: () => void;
  onConfirmDestruction: () => void;
  onDismissConstruction: () => void;
  onDismissDestruction: () => void;
}) {
  return <>
    <ConfirmConstrution facilityType={props.pendingConstruction} finance={props.finance} inventory={props.inventory} isConstructionTutorial={props.isConstructionTutorial} market={props.market} onBuyMissingConstructionInputs={props.onBuyMissingConstructionInputs} onConfirm={props.onConfirmConstruction} onDismiss={props.onDismissConstruction} />
    <BuildFacilityDialog finance={props.finance} inventory={props.inventory} isConstructionTutorial={props.isConstructionTutorial} isFacilitySelectionEnabled={props.isFacilitySelectionEnabled} market={props.market} onDismiss={props.onCloseConstructionYard} onSelectFacility={props.onSelectFacility} visible={props.isConstructionYardOpen} />
    <DestructionDialog facilities={props.facilities} facilityId={props.pendingDestruction} finance={props.finance} market={props.market} onConfirm={props.onConfirmDestruction} onDismiss={props.onDismissDestruction} />
  </>;
}
function BuildFacilityDialog({
  finance,
  inventory,
  isConstructionTutorial,
  isFacilitySelectionEnabled,
  market,
  onDismiss,
  onSelectFacility,
  visible,
}: {
  finance: Finance;
  inventory: Inventory;
  isConstructionTutorial?: boolean;
  isFacilitySelectionEnabled?: boolean;
  market: Market;
  onDismiss: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  visible: boolean;
}) {
  const { height } = useWindowDimensions();
  const facilityListMaxHeight = clamp(height - 280, 160, 480);
  const tutorialFacilityListMaxHeight = clamp(height * 0.24, 140, 220);
  const canSelectFacility = !isConstructionTutorial || isFacilitySelectionEnabled === true;
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const facilities = FACILITY_GROUPS.flatMap((group) => group.facilities.map((facilityType) => {
    const definition = getFacilityDefinition(facilityType);
    const missingMaterials = Math.max(0, definition.constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials));
    const missingIndustrialMachines = Math.max(0, definition.industrialMachinesCost - inventory.getAmount(ResourceType.IndustrialMachines));
    const materialPurchaseCost = getMarketPurchaseCost(market, ResourceType.ConstructionMaterials, missingMaterials);
    const machinePurchaseCost = getMarketPurchaseCost(market, ResourceType.IndustrialMachines, missingIndustrialMachines);
    const canAffordConstruction = Number.isFinite(materialPurchaseCost)
      && Number.isFinite(machinePurchaseCost)
      && finance.canAfford(definition.landCost + materialPurchaseCost + machinePurchaseCost);
    return { canAffordConstruction, definition, facilityType, groupLabel: group.label };
  }));
  const filteredFacilities = facilities.filter(({ canAffordConstruction }) => facilityFilter === 'all'
    || (facilityFilter === 'available' ? canAffordConstruction : !canAffordConstruction));

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} style={[styles.constructionYardDialog, isConstructionTutorial && styles.tutorialConstructionYardDialog]} visible={visible}>
        <Dialog.Title>Build facility</Dialog.Title>
        <Dialog.Content style={styles.constructionYardDialogContent}>
          <SegmentedButtons
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'available', label: 'Available' },
              { value: 'unavailable', label: 'Unavailable' },
            ]}
            onValueChange={(value) => setFacilityFilter(value as 'all' | 'available' | 'unavailable')}
            value={facilityFilter}
          />
          <ScrollView
            contentContainerStyle={styles.constructionYardList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={[styles.constructionYardListViewport, { maxHeight: isConstructionTutorial ? tutorialFacilityListMaxHeight : facilityListMaxHeight }]}
          >
            {filteredFacilities.map(({ canAffordConstruction, definition, facilityType, groupLabel }, index) => {
              const constructionMaterialsPrice = getDisplayedMarketUnitPrice(market, ResourceType.ConstructionMaterials, definition.constructionMaterialsCost);
              const industrialMachinesPrice = getDisplayedMarketUnitPrice(market, ResourceType.IndustrialMachines, definition.industrialMachinesCost);
              const totalConstructionCost = definition.landCost + definition.constructionMaterialsCost * constructionMaterialsPrice + definition.industrialMachinesCost * industrialMachinesPrice;
              const showGroup = index === 0 || filteredFacilities[index - 1].groupLabel !== groupLabel;
              return (
                <View key={facilityType}>
                {showGroup && <Text style={styles.cardKicker}>{groupLabel}</Text>}
                <Card
                  accessibilityLabel={`${definition.name}${canAffordConstruction ? '' : ' unavailable'}`}
                  accessibilityState={{ disabled: !canAffordConstruction || !canSelectFacility }}
                  mode="contained"
                  onPress={canAffordConstruction && canSelectFacility ? () => onSelectFacility(facilityType) : undefined}
                  style={[styles.constructionYardCard, (!canAffordConstruction || !canSelectFacility) && styles.constructionYardCardDisabled]}
                >
                  <Card.Content>
                    <List.Item
                      description={<View style={styles.facilityCostDetails}><View style={styles.currencyDescription}><Text>Land (euros):</Text><CurrencyValue value={definition.landCost} /></View><View style={styles.currencyDescription}><Text><TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} /> Construction Materials: {formatNumber(definition.constructionMaterialsCost)} ·</Text><CurrencyValue value={constructionMaterialsPrice} /></View><View style={styles.currencyDescription}><Text><TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} /> Industrial Machines: {formatNumber(definition.industrialMachinesCost)} ·</Text><CurrencyValue value={industrialMachinesPrice} /></View><View style={styles.currencyDescription}><Text>Market replacement cost (Total cost):</Text><CurrencyValue value={totalConstructionCost} /></View></View>}
                      left={(props) => <List.Icon {...props} icon={definition.icon} />}
                      title={definition.name}
                      titleStyle={styles.facilityTitle}
                    />
                  </Card.Content>
                </Card>
                </View>
              );
            })}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function ConfirmConstrution({
  facilityType,
  finance,
  inventory,
  isConstructionTutorial,
  market,
  onBuyMissingConstructionInputs,
  onConfirm,
  onDismiss,
}: {
  facilityType: FacilityType | null;
  finance: Finance;
  inventory: Inventory;
  isConstructionTutorial?: boolean;
  market: Market;
  onBuyMissingConstructionInputs: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const [expandedRecipeName, setExpandedRecipeName] = useState<string | null>(null);
  const { height } = useWindowDimensions();
  if (facilityType === null) {
    return null;
  }

  const definition = getFacilityDefinition(facilityType);
  const contentMaxHeight = isConstructionTutorial
    ? Math.min(300, Math.max(180, height * 0.38))
    : Math.min(420, Math.max(220, height * 0.52));
  const canConstruct = finance.canAfford(definition.landCost)
    && inventory.has(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost)
    && inventory.has(ResourceType.IndustrialMachines, definition.industrialMachinesCost);
  const balanceAfterConstruction = finance.getBalance() - definition.landCost;
  const materialsAfterConstruction = inventory.getAmount(ResourceType.ConstructionMaterials) - definition.constructionMaterialsCost;
  const industrialMachinesAfterConstruction = inventory.getAmount(ResourceType.IndustrialMachines) - definition.industrialMachinesCost;
  const missingMaterials = Math.max(0, -materialsAfterConstruction);
  const missingIndustrialMachines = Math.max(0, -industrialMachinesAfterConstruction);
  const missingInputsPurchaseCost = getMarketPurchaseCost(market, ResourceType.ConstructionMaterials, missingMaterials)
    + getMarketPurchaseCost(market, ResourceType.IndustrialMachines, missingIndustrialMachines);
  const displayedMissingInputsPurchaseCost = missingMaterials * getDisplayedMarketUnitPrice(market, ResourceType.ConstructionMaterials, missingMaterials)
    + missingIndustrialMachines * getDisplayedMarketUnitPrice(market, ResourceType.IndustrialMachines, missingIndustrialMachines);
  const canAutoBuyInputs = (missingMaterials > 0 || missingIndustrialMachines > 0)
    && Number.isFinite(missingInputsPurchaseCost)
    && finance.canAfford(definition.landCost + missingInputsPurchaseCost);

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} style={isConstructionTutorial ? styles.tutorialConstructionConfirmDialog : undefined} visible>
        <Dialog.Title>{`Construct ${definition.name}?`}</Dialog.Title>
        <Dialog.Content>
          <ScrollView contentContainerStyle={[styles.constructionConfirmContent, isConstructionTutorial && styles.tutorialConstructionConfirmContent]} style={{ maxHeight: contentMaxHeight }}>
            <Text style={styles.dialogDescription}>
              Purchase the land, supply the Construction Materials, and install the Industrial Machines before the facility is added to your company.
            </Text>
            <Card mode="contained" style={styles.dialogSummaryCard}>
              <Card.Content style={styles.dialogSummaryContent}>
                <View style={styles.dialogSummaryRow}><Text>Construction cost</Text><View style={styles.currencyDescription}><CurrencyValue value={definition.landCost} /><Text style={styles.detailValue}> · <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} /> Construction Materials: {formatNumber(definition.constructionMaterialsCost)} · <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} /> Industrial Machines: {formatNumber(definition.industrialMachinesCost)}</Text></View></View>
                <View style={styles.dialogSummaryRow}><Text>Resources after purchase</Text><View style={styles.currencyDescription}><CurrencyValue value={balanceAfterConstruction} /><Text style={styles.detailValue}> · <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} /> Construction Materials: {formatNumber(materialsAfterConstruction)} · <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} /> Industrial Machines: {formatNumber(industrialMachinesAfterConstruction)}</Text></View></View>
              </Card.Content>
            </Card>
            <Text variant="titleMedium" style={styles.dialogSectionHeading}>Available recipes</Text>
            {definition.recipes.map((recipe) => {
              const isExpanded = expandedRecipeName === recipe.name;
              return <View key={recipe.name}><List.Item
                onPress={() => setExpandedRecipeName(isExpanded ? null : recipe.name)}
                left={() => <TooltipTextIcon label={formatRecipeName(recipe)}>{RECIPE_ICONS[recipe.name]}</TooltipTextIcon>}
                right={(props) => <List.Icon {...props} icon={isExpanded ? 'chevron-up' : 'chevron-down'} />}
                title={formatRecipeName(recipe)}
              />{isExpanded && <View style={styles.dialogSummaryContent}><RecipeResourceSummary recipe={recipe} /><WorkMetric value={String(recipe.requiredWork)} /></View>}</View>;
            })}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions style={styles.constructionConfirmActions}>
          <Button compact mode="outlined" onPress={onDismiss}>Cancel</Button>
          {(missingMaterials > 0 || missingIndustrialMachines > 0) && <Button compact disabled={!canAutoBuyInputs} mode="outlined" onPress={onBuyMissingConstructionInputs}><Text>Buy missing inputs · </Text><MaterialCommunityIcons name={APP_ICONS.coin} size={16} color={styles.detailValue.color} /><Text> {formatCurrency(displayedMissingInputsPurchaseCost).replace(/\s*€/u, '')}</Text></Button>}
          <Button compact disabled={!canConstruct} mode="contained" onPress={onConfirm}>Confirm build</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function DestructionDialog({
  facilities,
  facilityId,
  finance,
  market,
  onConfirm,
  onDismiss,
}: {
  facilities: FacilityCollection;
  facilityId: string | null;
  finance: Finance;
  market: Market;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const facility = facilityId ? facilities.get(facilityId) : null;
  if (!facility) {
    return null;
  }
  const bookValue = calculateFacilityAssetValue(facility, market, finance);
  const proceeds = bookValue * LOAN_COLLECTION.voluntaryFacilitySaleRate;

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible>
        <Dialog.Title>{`Sell ${facility.getView().displayName}?`}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogDescription}>
            This permanently removes the facility and pays €{formatNumber(proceeds, { smartDecimals: true })}, which is 70% of its current book value (€{formatNumber(bookValue, { smartDecimals: true })}).
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button buttonColor={colors.error} mode="contained" onPress={onConfirm} textColor={colors.onDark}>
            Confirm sale
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}


