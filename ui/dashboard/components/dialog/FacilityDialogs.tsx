import { PanResponder, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Dialog, IconButton, List, Portal, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { colors } from '@/theme';
import { LOAN_COLLECTION, calculateFacilityAssetValue, type Finance } from '@/game/finance';
import { Facility, type FacilityCollection, type FacilityType } from '@/game/facilities';
import { calculateFacilityResourcePayment, calculateProjectedFacilityConditionEconomics, FACILITY_GROUPS, FACILITY_REPAIR_DURATION_PER_CONDITION_MS, FACILITY_REPAIR_EFFICIENCY_MULTIPLIER, FACILITY_STAFF_QUALITY_TREND_MEMORY_MINUTES, FACILITY_STAFF_TRAINING_QUALITY_PROGRESS_PER_WORKER, getFacilityConstructionCosts, getFacilityDefinition, getFacilityEfficiency, getFacilityMaxStaffWage, getFacilityRepairCost, getFacilitySizeDefinition, getFacilitySizeMultiplier, getFacilitySizeOptions, getFacilityStaffTargetWage, getStaffingChangeCost, getStaffingChangeDurationMs, getStaffTrainingCost, getStaffTrainingDurationMs, getStaffingEfficiency, getStaffQualityFromProgress, getStaffQualityWagePressurePerMinute,  } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import { ResourceType } from '@/game/resources';
import type { Recipe } from '@/game/recipes';
import { clamp, formatCurrency, formatDuration, formatNumber, formatPercent, getColorClass } from '@/utils';
import { WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { formatStaffQualityWagePressure } from '@/ui/dashboard/helpers/staffingFormatters';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import { TooltipMaterialIcon, TooltipResourceIcon, TooltipTextIcon } from '@/ui/dashboard/components/IconTooltip';
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

// Anchor the common €10 point at the physical midpoint of the slider.
const WAGE_SLIDER_EXPONENT = Math.log(0.1) / Math.log(0.5);

function wageStep(value: number): number {
  if (value < 2) return 0.01;
  if (value < 10) return 0.1;
  return 1;
}

function wageFromSliderPosition(position: number, max: number): number {
  const normalizedPosition = clamp(position, 0, 1);
  const rawValue = max * normalizedPosition ** WAGE_SLIDER_EXPONENT;
  const step = wageStep(rawValue);
  return Number((Math.round(rawValue / step) * step).toFixed(step < 1 ? (step === 0.01 ? 2 : 1) : 0));
}

function wageSliderPosition(value: number, max: number): number {
  return max > 0 ? Math.pow(clamp(value / max, 0, 1), 1 / WAGE_SLIDER_EXPONENT) : 0;
}

export function FacilityRepairDialog({
  activeRecipe, autoRepairLimit, currentGameTimeMs, facility, finance,
  getInputQuality, getOutputQuality, inventory, market, onDismiss, onRepair,
  onSetAutoRepair, recipeResearchWorkSpeedMultiplier, visible,
}: {
  activeRecipe: Recipe | null; autoRepairLimit: number; currentGameTimeMs: number;
  facility: Facility; finance: Finance;
  getInputQuality: (resourceType: ResourceType) => number;
  getOutputQuality?: (resourceType: ResourceType) => number;
  inventory: Inventory; market: Market; onDismiss: () => void;
  onRepair: (targetCondition: number) => boolean;
  onSetAutoRepair: (enabled: boolean, threshold: number, target: number) => boolean;
  recipeResearchWorkSpeedMultiplier: number; visible: boolean;
}) {
  const { height } = useWindowDimensions();
  const [targetCondition, setTargetCondition] = useState(1);
  const [autoRepairEnabled, setAutoRepairEnabled] = useState(false);
  const [autoRepairThreshold, setAutoRepairThreshold] = useState(0.7);
  const [autoRepairTarget, setAutoRepairTarget] = useState(1);
  const [autoRepairMessage, setAutoRepairMessage] = useState<string | null>(null);
  const [repairActionMessage, setRepairActionMessage] = useState<string | null>(null);
  const sliderWidthRef = useRef(0);
  const facilityView = facility.getView();
  const currentCondition = facilityView.facilityCondition;
  const currentConditionRef = useRef(currentCondition);
  currentConditionRef.current = currentCondition;
  const selectedTarget = Math.max(
    currentCondition,
    Math.min(1, targetCondition),
  );
  const sliderProgress =
    currentCondition >= 1
      ? 1
      : (selectedTarget - currentCondition) / (1 - currentCondition);
  const repairTargetSteps = [
    ...new Set(
      [currentCondition, 0.5, 0.75, 1].filter(
        (condition) => condition >= currentCondition,
      ),
    ),
  ];
  const definition = getFacilityDefinition(facilityView.facilityType);
  const repairEuroCost = getFacilityRepairCost(
    definition.landCost * facilityView.sizeMultiplier,
    currentCondition,
    selectedTarget,
  );
  const repairConstructionMaterialsCost = getFacilityRepairCost(
    definition.constructionMaterialsCost * facilityView.sizeMultiplier,
    currentCondition,
    selectedTarget,
  );
  const repairIndustrialMachinesCost = getFacilityRepairCost(
    definition.industrialMachinesCost * facilityView.sizeMultiplier,
    currentCondition,
    selectedTarget,
  );
  const repairPayment = calculateFacilityResourcePayment(
    finance,
    inventory,
    market,
    repairEuroCost,
    repairConstructionMaterialsCost,
    repairIndustrialMachinesCost,
  );
  const repairDurationMs = Math.max(
    0,
    Math.ceil(
      (selectedTarget - currentCondition) * FACILITY_REPAIR_DURATION_PER_CONDITION_MS,
    ),
  );
  const pendingRepairSeconds = facilityView.pendingRepair
    ? Math.max(
        0,
        facilityView.pendingRepair.completesAtGameTimeMs - currentGameTimeMs,
      ) / 1_000
    : 0;
  const temporaryFacilityEfficiency = facilityView.pendingRepair
    ? facilityView.facilityEfficiency
    : facilityView.facilityEfficiency * FACILITY_REPAIR_EFFICIENCY_MULTIPLIER;
  const projectedEconomics = activeRecipe
    ? calculateProjectedFacilityConditionEconomics(
        facility,
        selectedTarget,
        activeRecipe,
        market,
        recipeResearchWorkSpeedMultiplier,
        getInputQuality,
        getOutputQuality,
      )
    : null;
  const setSliderPosition = (position: number) =>
    setTargetCondition(
      repairTargetForSlider(currentConditionRef.current, position),
    );
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        if (sliderWidthRef.current > 0) {
          setSliderPosition(
            event.nativeEvent.locationX / sliderWidthRef.current,
          );
        }
      },
      onPanResponderMove: (event) => {
        if (sliderWidthRef.current > 0) {
          setSliderPosition(
            event.nativeEvent.locationX / sliderWidthRef.current,
          );
        }
      },
      onStartShouldSetPanResponder: () => true,
    }),
  ).current;

  useEffect(() => {
    if (!visible) return;
    const view = facility.getView();
    setTargetCondition(1);
    setAutoRepairEnabled(view.autoRepairEnabled);
    setAutoRepairThreshold(view.autoRepairThreshold);
    setAutoRepairTarget(view.autoRepairTarget);
    setAutoRepairMessage(null);
    setRepairActionMessage(null);
  }, [visible]);

  const submitRepair = () => {
    if (facilityView.pendingRepair) {
      setRepairActionMessage('A repair is already in progress.');
    } else if (selectedTarget <= currentCondition) {
      setRepairActionMessage('Choose a target above the current condition.');
    } else if (!repairPayment.canAfford) {
      setRepairActionMessage(finance.getBalance() < repairPayment.cashCost ? 'Not enough cash for this repair.' : 'Repair materials are unavailable at the current market quote.');
    } else if (onRepair(selectedTarget)) {
      setRepairActionMessage(null);
    } else {
      setRepairActionMessage('Repair could not be started. Check for another active facility activity.');
    }
  };

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible={visible}>
        <Dialog.Title>{`Repair ${facilityView.displayName}`}</Dialog.Title>

        <Dialog.Content
          style={[styles.facilityDialogContent, { maxHeight: height * 0.6 }]}
        >
          <ScrollView
            contentContainerStyle={styles.facilityDialogScrollContent}
            nestedScrollEnabled
          >
            <Text style={styles.facilityDialogDescription}>
              Choose a condition target. Costs and production projections update as you drag.
            </Text>

            <View style={styles.repairConditionTargets}>
              <View style={styles.facilityEfficiencyRow}>
                <Text style={styles.facilityEfficiencyLabel}>Current condition</Text>
                <Text style={styles.facilityEfficiencyValue}>
                  {formatNumber(currentCondition * 100, { decimals: 0 })}%
                </Text>
              </View>

              <View style={styles.facilityEfficiencyRow}>
                <Text style={styles.facilityEfficiencyLabel}>Repair target</Text>
                <Text style={styles.repairTargetValue}>
                  {formatNumber(selectedTarget * 100, { decimals: 0 })}%
                </Text>
              </View>
            </View>

            <View
              accessibilityLabel={`Repair target ${formatNumber(selectedTarget * 100, { decimals: 0 })} percent`}
              style={styles.facilityDialogRepairSlider}
            >
              <View
                onLayout={(event) => {
                  sliderWidthRef.current = event.nativeEvent.layout.width;
                }}
                style={styles.marketSliderTouchArea}
                {...panResponder.panHandlers}
              >
                <View pointerEvents="none" style={styles.marketSliderTrack} />
                <View
                  pointerEvents="none"
                  style={[styles.marketSliderFill, { width: `${sliderProgress * 100}%` }]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.marketSliderThumb, { left: `${sliderProgress * 100}%` }]}
                />
              </View>

              <View style={styles.marketSliderLabels}>
                {repairTargetSteps.map((condition) => (
                  <Pressable
                    accessibilityLabel={`Set repair target to ${formatNumber(condition * 100, { decimals: 0 })} percent`}
                    accessibilityRole="button"
                    key={condition}
                    onPress={() => setTargetCondition(condition)}
                    style={styles.marketSliderStep}
                  >
                    <View
                      style={[
                        styles.marketSliderMarker,
                        Math.abs(selectedTarget - condition) < 0.005 &&
                          styles.marketSliderMarkerActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.marketSliderLabel,
                        Math.abs(selectedTarget - condition) < 0.005 &&
                          styles.marketSliderLabelActive,
                      ]}
                    >
                      {formatNumber(condition * 100, { decimals: 0 })}%
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Card mode="contained" style={styles.facilityDialogCard}>
              <Card.Content style={styles.facilityDialogCardContent}>
                <View style={styles.dialogSummaryRow}>
                  <Text>Repair cost</Text>
                  <Text style={styles.repairTargetValue}>
                    {formatCurrency(repairPayment.cashCost)}
                  </Text>
                </View>

                <View style={styles.dialogSummaryRow}>
                  <Text>Repair duration</Text>
                  <Text style={styles.repairTargetValue}>
                    {formatDuration(repairDurationMs / 60_000)}
                  </Text>
                </View>

                <View style={styles.dialogSummaryRow}>
                  <Text>Temporary facility efficiency</Text>
                  <Text
                    style={[
                      styles.repairTargetValue,
                      { color: getColorClass(Math.min(1, temporaryFacilityEfficiency)) },
                    ]}
                  >
                    {formatPercent(temporaryFacilityEfficiency, { decimals: 0 })}
                  </Text>
                </View>

                <Text style={styles.facilityRepairCost}>
                  {`${formatCurrency(repairEuroCost)} repair + market purchases for missing inputs\n`}
                  <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} />
                  {` Construction Materials: ${formatNumber(repairConstructionMaterialsCost, { smartDecimals: true })} | `}
                  <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} />
                  {` Industrial Machines: ${formatNumber(repairIndustrialMachinesCost, { smartDecimals: true })}`}
                </Text>

                {facilityView.pendingRepair && (
                  <Text style={styles.facilityRepairCost}>
                    Repair in progress · {formatDuration(pendingRepairSeconds / 60)} remaining
                  </Text>
                )}
              </Card.Content>
            </Card>

            {projectedEconomics ? (
              <Card mode="contained" style={styles.facilityDialogCard}>
                <Card.Content style={styles.facilityDialogCardContent}>
                  <Text style={styles.facilityUpgradeLabel}>
                    {`Projected at ${formatNumber(selectedTarget * 100, { decimals: 0 })}% condition`}
                  </Text>

                  <View style={styles.dialogSummaryRow}>
                    <Text>Value/min</Text>
                    <Text style={styles.repairTargetValue}>
                      {formatCurrency(projectedEconomics.valuePerMinute)}
                    </Text>
                  </View>

                  <View style={styles.dialogSummaryRow}>
                    <Text>Maintenance/min</Text>
                    <Text style={styles.facilityRepairCost}>
                      {formatCurrency(projectedEconomics.decayCostPerMinute)}
                    </Text>
                  </View>

                  <View style={styles.dialogSummaryRow}>
                    <Text>Net gain/min</Text>
                    <Text style={styles.repairTargetValue}>
                      {formatCurrency(projectedEconomics.netGainPerMinute)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ) : (
              <Text style={styles.facilityDialogDescription}>
                Start a recipe to preview value and net gain per minute.
              </Text>
            )}

            <Card mode="contained" style={styles.facilityDialogCard}>
              <Card.Content style={styles.facilityDialogCardContent}>
                <View style={styles.dialogSummaryRow}>
                  <Text style={styles.facilityUpgradeLabel}>Auto-repair</Text>
                  <Text style={styles.facilityRepairCost}>
                    {autoRepairLimit > 0
                      ? `${autoRepairLimit} facility slot${autoRepairLimit === 1 ? '' : 's'} researched`
                      : 'Research Repair Technician to unlock'}
                  </Text>
                </View>

                {autoRepairLimit > 0 && (
                  <>
                    <Text style={styles.facilityRepairCost}>
                      Repair this facility when condition reaches:
                    </Text>

                    <SegmentedButtons
                      buttons={[
                        { value: '0.5', label: '50%' },
                        { value: '0.7', label: '70%' },
                        { value: '0.8', label: '80%' },
                        { value: '0.9', label: '90%' },
                      ]}
                      onValueChange={(value) => setAutoRepairThreshold(Number(value))}
                      value={String(autoRepairThreshold)}
                    />

                    <Text style={styles.facilityRepairCost}>Then repair it to:</Text>

                    <SegmentedButtons
                      buttons={[
                        { value: '0.75', label: '75%' },
                        { value: '0.9', label: '90%' },
                        { value: '1', label: '100%' },
                      ]}
                      onValueChange={(value) => setAutoRepairTarget(Number(value))}
                      value={String(autoRepairTarget)}
                    />

                    <Button
                      compact
                      mode={autoRepairEnabled ? 'contained' : 'outlined'}
                      onPress={() => setAutoRepairEnabled((enabled) => !enabled)}
                    >
                      {autoRepairEnabled ? 'Auto-repair enabled' : 'Enable auto-repair'}
                    </Button>

                    <Button
                      compact
                      disabled={autoRepairTarget <= autoRepairThreshold}
                      onPress={() =>
                        setAutoRepairMessage(
                          onSetAutoRepair(autoRepairEnabled, autoRepairThreshold, autoRepairTarget)
                            ? 'Auto-repair settings saved.'
                            : 'No available Repair Technician slot for this facility.'
                        )
                      }
                    >
                      Save auto-repair settings
                    </Button>

                    {autoRepairMessage && (
                      <Text style={styles.facilityRepairCost}>{autoRepairMessage}</Text>
                    )}
                  </>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </Dialog.Content>

        {repairActionMessage && (
          <Text style={styles.productionError}>{repairActionMessage}</Text>
        )}

        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            disabled={!!facilityView.pendingRepair || selectedTarget <= currentCondition}
            mode="contained"
            onPress={submitRepair}
          >
            {facilityView.pendingRepair
              ? 'Repair in progress'
              : `Repair to ${formatNumber(selectedTarget * 100, { decimals: 0 })}%`}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export function FacilityStaffWageDialog({
  activeRecipe,
  currentGameTimeMs,
  facility,
  getInputQuality,
  getOutputQuality,
  market,
  onDismiss,
  onSetStaffing,
  recipeResearchWorkSpeedMultiplier,
  isTutorial = false,
  visible,
}: {
  activeRecipe: Recipe | null;
  currentGameTimeMs: number;
  facility: Facility;
  getInputQuality: (resourceType: ResourceType) => number;
  getOutputQuality?: (resourceType: ResourceType) => number;
  market: Market;
  onDismiss: () => void;
  onSetStaffing: (workerCount: number, wagePerWorkerPerMinute: number) => boolean;
  recipeResearchWorkSpeedMultiplier: number;
  isTutorial?: boolean;
  visible: boolean;
}) {
  const facilityView = facility.getView();
  const { height } = useWindowDimensions();
  const [selectedWorkers, setSelectedWorkers] = useState(facilityView.assignedWorkers);
  const [selectedWage, setSelectedWage] = useState(facilityView.staffWagePerWorkerPerMinute);
  const [wageInput, setWageInput] = useState(String(facilityView.staffWagePerWorkerPerMinute));
  const [staffingActionMessage, setStaffingActionMessage] = useState<string | null>(null);
  const workerSliderMax = Math.max(facilityView.maximumWorkers, facilityView.assignedWorkers, 1);
  const wageSliderMax = getFacilityMaxStaffWage(facilityView.staffWageTargetPerWorkerPerMinute);
  const totalWagePerMinute = selectedWage * selectedWorkers;
  const projectedFacility = activeRecipe ? Facility.fromSnapshot(facility.toSnapshot()) : null;
  if (projectedFacility) {
    projectedFacility.setStaffWageBaseMultiplier(facility.getStaffWageBaseMultiplier());
    projectedFacility.setAssignedWorkers(selectedWorkers);
    projectedFacility.setStaffWagePerWorkerPerMinute(selectedWage);
  }
  const projectedEconomics = projectedFacility && activeRecipe
    ? calculateProjectedFacilityConditionEconomics(projectedFacility, facilityView.facilityCondition, activeRecipe, market, recipeResearchWorkSpeedMultiplier, getInputQuality, getOutputQuality)
    : null;

  useEffect(() => {
    if (!visible) return;
    const view = facility.getView();
    setSelectedWorkers(view.assignedWorkers);
    setSelectedWage(view.staffWagePerWorkerPerMinute);
    setWageInput(String(view.staffWagePerWorkerPerMinute));
    setStaffingActionMessage(null);
  }, [visible]);

  const saveStaffing = () => {
    if (!onSetStaffing(selectedWorkers, selectedWage)) {
      setStaffingActionMessage('Staffing change was denied. Check cash, the wage limit, and active facility activities.');
      return;
    }
    setStaffingActionMessage(null);
    onDismiss();
  };

  const updateWage = (value: number) => {
    const bounded = Math.max(0, Math.min(wageSliderMax, value));
    const step = wageStep(bounded);
    const normalized = Number(
      (Math.round(bounded / step) * step).toFixed(
        step < 1 ? (step === 0.01 ? 2 : 1) : 0,
      ),
    );
    setSelectedWage(normalized);
    setWageInput(String(normalized));
  };

  const handleWageInput = (value: string) => {
    setWageInput(value);
    const parsed = Number(value.replace(',', '.'));
    if (value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) {
      setSelectedWage(Math.min(wageSliderMax, parsed));
    }
  };

  const normalizeWageInput = () => {
    const parsed = Number(wageInput.replace(',', '.'));
    updateWage(Number.isFinite(parsed) && parsed >= 0 ? parsed : selectedWage);
  };

  const selectedStaffTargetWage = getFacilityStaffTargetWage(
    facilityView.staffQuality,
    facility.getStaffWageBaseMultiplier(),
  );
  const selectedStaffEfficiency = getStaffingEfficiency(
    selectedWorkers,
    facilityView.requiredWorkers,
    selectedWage,
    facilityView.staffQuality,
    selectedStaffTargetWage,
  );
  const selectedFacilityEfficiency = getFacilityEfficiency(
    selectedStaffEfficiency,
    facilityView.facilityCondition,
  );
  const staffingDelta = Math.abs(selectedWorkers - facilityView.assignedWorkers);
  const staffingIsHiring = selectedWorkers > facilityView.assignedWorkers;
  const staffingDurationMs = getStaffingChangeDurationMs(
    facilityView.assignedWorkers,
    selectedWorkers,
  );
  const staffingCost = getStaffingChangeCost(
    facilityView.assignedWorkers,
    selectedWorkers,
    selectedWage,
  );
  const pendingStaffingSeconds = facilityView.pendingStaffingChange
    ? Math.max(
        0,
        facilityView.pendingStaffingChange.completesAtGameTimeMs - currentGameTimeMs,
      ) / 1_000
    : 0;
  const staffQualityColor = getColorClass(Math.min(1, facilityView.staffQuality / 100));
  const selectedStaffQualityWagePressurePerMinute =
    selectedWorkers <= 0
      ? 0
      : getStaffQualityWagePressurePerMinute(
          facilityView.staffQualityProgress,
          selectedWage,
          selectedStaffTargetWage,
        );
  const efficiencyColor = getColorClass(Math.min(1, selectedStaffEfficiency));

  return (
    <Portal>
      <Dialog
        dismissable
        onDismiss={onDismiss}
        style={isTutorial ? styles.tutorialStaffingDialog : undefined}
        visible={visible}
      >
      <Dialog.Title>{`Staffing ${facilityView.displayName}`}</Dialog.Title>
        <Dialog.Content
          style={[styles.facilityDialogContent, { maxHeight: height * 0.6 }]}
        >
          <ScrollView
            contentContainerStyle={[
              styles.facilityDialogScrollContent,
              isTutorial && styles.tutorialStaffingDialogScrollContent,
            ]}
            nestedScrollEnabled
          >
            <Text style={styles.facilityDialogDescription}>
              Set the number of assigned workers and their wage. Staff wages are
              paid every foreground minute.
            </Text>
            <Card mode="contained" style={styles.facilityDialogCard}>
              <Card.Content style={styles.facilityDialogCardContent}>
                <View style={styles.dialogSummaryRow}>
                  <Text style={styles.facilityUpgradeLabel}>Staff</Text>
                  <Text style={styles.repairTargetValue}>
                    {formatNumber(selectedWorkers)} /{' '}
                    {formatNumber(facilityView.requiredWorkers)}
                  </Text>
                </View>
                <View style={styles.dialogSummaryRow}>
                  <Text style={styles.facilityStaffingDetail}>
                    {`Staff Quality (last ${FACILITY_STAFF_QUALITY_TREND_MEMORY_MINUTES}m)`}
                  </Text>
                  <Text style={[styles.facilityStaffingDetail, { color: staffQualityColor }]}>
                    Q{formatNumber(facilityView.staffQuality, { decimals: 2, forceDecimals: true })}{' '}
                    {facilityView.staffQualityTrend === 'rising'
                      ? '↑'
                      : facilityView.staffQualityTrend === 'falling'
                        ? '↓'
                        : '→'}
                  </Text>
                </View>
                <View style={styles.dialogSummaryRow}>
                  <View style={styles.facilityConditionLabel}>
                    <Text style={styles.facilityStaffingDetail}>Expected wage</Text>
                    <TooltipMaterialIcon
                      color={colors.muted}
                      label="Expected wage is the wage-only equilibrium for this facility's current Staff Quality and economy phase. It does not include training or production experience."
                      name={APP_ICONS.help}
                      size={13}
                    />
                  </View>
                  <Text style={styles.facilityStaffingDetail}>
                    {formatCurrency(selectedStaffTargetWage)}/worker/min
                  </Text>
                </View>
                <View style={styles.dialogSummaryRow}>
                  <View style={styles.facilityConditionLabel}>
                    <Text style={styles.facilityStaffingDetail}>Wage pressure</Text>
                    <TooltipMaterialIcon
                      color={colors.muted}
                      label="The farther the selected wage is from expected wage, the faster it pushes Staff Quality down toward Q1 or up toward Q100. Training and production experience are separate."
                      name={APP_ICONS.help}
                      size={13}
                    />
                  </View>
                  <Text style={styles.facilityStaffingDetail}>
                    {formatStaffQualityWagePressure(selectedStaffQualityWagePressurePerMinute)}
                  </Text>
                </View>
                {facilityView.pendingStaffingChange && (
                  <Text style={styles.facilityRepairCost}>
                    Staffing change pending: {formatNumber(facilityView.assignedWorkers)}
                    {' → '}{formatNumber(facilityView.pendingStaffingChange.targetWorkers)}
                    {' · '}{formatDuration(pendingStaffingSeconds / 60)}
                  </Text>
                )}
                <StaffingSlider
                  accessibilityLabel={`Staff assigned ${formatNumber(selectedWorkers)} of ${formatNumber(facilityView.requiredWorkers)}`}
                  max={workerSliderMax}
                  onChange={setSelectedWorkers}
                  step={1}
                  value={selectedWorkers}
                />
                <Text style={styles.facilityUpgradeLabel}>Wage</Text>
                <View style={styles.dialogSummaryRow}>
                  <Text style={styles.facilityUpgradeLabel}>Wage per worker/min</Text>
                  <Text style={styles.repairTargetValue}>{formatCurrency(selectedWage)}</Text>
                </View>
                <TextInput
                  dense
                  inputMode="decimal"
                  label="€/worker/min"
                  mode="outlined"
                  onBlur={normalizeWageInput}
                  onChangeText={handleWageInput}
                  style={styles.facilityDialogWageInput}
                  value={wageInput}
                />
                <StaffingSlider
                  accessibilityLabel={`Wage ${formatCurrency(selectedWage)} per worker per minute`}
                  max={wageSliderMax}
                  onChange={updateWage}
                  positionFromValue={(value, max) => wageSliderPosition(value, max)}
                  valueFromPosition={(position, max) => wageFromSliderPosition(position, max)}
                  step={0.01}
                  value={selectedWage}
                />
                <View style={styles.dialogSummaryRow}>
                  <Text>Total wage/min</Text>
                  <Text style={styles.repairTargetValue}>{formatCurrency(totalWagePerMinute)}</Text>
                </View>
              </Card.Content>
            </Card>
            <Card mode="contained" style={styles.facilityDialogCard}>
              <Card.Content style={styles.facilityDialogCardContent}>
                <Text style={styles.facilityUpgradeLabel}>Projected staffing</Text>
                <View style={styles.dialogSummaryRow}>
                  <Text>Staff efficiency</Text>
                  <Text style={[styles.repairTargetValue, { color: efficiencyColor }]}>
                    {formatPercent(selectedStaffEfficiency, { decimals: 0 })}
                  </Text>
                </View>
                <View style={styles.dialogSummaryRow}>
                  <Text>Facility efficiency</Text>
                  <Text style={[styles.repairTargetValue, { color: getColorClass(Math.min(1, selectedFacilityEfficiency)) }]}>
                    {formatPercent(selectedFacilityEfficiency, { decimals: 0 })}
                  </Text>
                </View>
                {staffingDelta > 0 && (
                  <>
                    <View style={styles.dialogSummaryRow}>
                      <Text>{staffingIsHiring ? 'Hiring cost' : 'Severance cost'}</Text>
                      <Text style={styles.repairTargetValue}>{formatCurrency(staffingCost)}</Text>
                    </View>
                    <View style={styles.dialogSummaryRow}>
                      <Text>{staffingIsHiring ? 'Hire time' : 'Fire time'}</Text>
                      <Text style={styles.repairTargetValue}>{formatDuration(staffingDurationMs / 60_000)}</Text>
                    </View>
                  </>
                )}
                {projectedEconomics && (
                  <>
                    <Text style={styles.facilityUpgradeLabel}>Projected facility economics</Text>
                    <View style={styles.dialogSummaryRow}>
                      <Text>Value/min</Text>
                      <Text style={styles.repairTargetValue}>{formatCurrency(projectedEconomics.valuePerMinute)}</Text>
                    </View>
                    <View style={styles.dialogSummaryRow}>
                      <Text>Net gain/min</Text>
                      <Text style={styles.repairTargetValue}>{formatCurrency(projectedEconomics.netGainPerMinute)}</Text>
                    </View>
                    <View style={styles.dialogSummaryRow}>
                      <Text>Decay cost/min</Text>
                      <Text style={styles.facilityRepairCost}>{formatCurrency(projectedEconomics.decayCostPerMinute)}</Text>
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </Dialog.Content>
        {staffingActionMessage && (
          <Text style={styles.productionError}>{staffingActionMessage}</Text>
        )}
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            disabled={facilityView.pendingStaffingChange !== null}
            mode="contained"
            onPress={saveStaffing}
          >
            Save staffing
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export function FacilityStaffTrainingDialog({ currentGameTimeMs, facility, onDismiss, onTrainStaff, visible }: { currentGameTimeMs: number; facility: Facility; onDismiss: () => void; onTrainStaff?: (workerCount: number) => boolean; visible: boolean }) {
  const facilityView = facility.getView();
  const { height } = useWindowDimensions();
  const activeTrainingWorkers = facilityView.staffTraining?.workers ?? 0;
  const [trainingWorkers, setTrainingWorkers] = useState(activeTrainingWorkers);
  const [trainingActionMessage, setTrainingActionMessage] = useState<string | null>(null);
  const additionalWorkers = Math.max(0, trainingWorkers - activeTrainingWorkers);
  const trainingSeconds = facilityView.staffTraining ? Math.max(0, facilityView.staffTraining.completesAtGameTimeMs - currentGameTimeMs) / 1_000 : 0;
  const trainingCost = getStaffTrainingCost(facilityView.staffQuality, additionalWorkers);
  const trainingDurationMs = getStaffTrainingDurationMs(additionalWorkers);
      const trainingEfficiency = getStaffingEfficiency(Math.max(0, facilityView.assignedWorkers - trainingWorkers), facilityView.requiredWorkers, facilityView.staffWagePerWorkerPerMinute, facilityView.staffQuality, facilityView.staffWageTargetPerWorkerPerMinute);
  const projectedTrainingQuality = getStaffQualityFromProgress(facilityView.staffQualityProgress + trainingWorkers * FACILITY_STAFF_TRAINING_QUALITY_PROGRESS_PER_WORKER);

  useEffect(() => {
    if (visible) {
      setTrainingWorkers(facility.getView().staffTraining?.workers ?? 0);
      setTrainingActionMessage(null);
    }
  }, [activeTrainingWorkers, visible]);

  const submitTraining = () => {
    if (!onTrainStaff) {
      setTrainingActionMessage('Training is unavailable.');
    } else if (onTrainStaff(additionalWorkers)) {
      setTrainingActionMessage(null);
      onDismiss();
    } else {
      setTrainingActionMessage('Training could not be started. Check cash and active facility activities.');
    }
  };

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible={visible}>
        <Dialog.Title>{`Train staff · ${facilityView.displayName}`}</Dialog.Title>

        <Dialog.Content style={[styles.facilityDialogContent, { maxHeight: height * 0.6 }]}>
          <ScrollView
            contentContainerStyle={styles.facilityDialogScrollContent}
            nestedScrollEnabled
          >
            <Text style={styles.facilityDialogDescription}>
              {facilityView.staffTraining
                ? 'Add more workers to the current training activity. Only the added workers are charged, and everyone returns when the current activity completes.'
                : 'Select workers to train. They temporarily leave production, then return with improved Staff Quality.'}
            </Text>

            <Card mode="contained" style={styles.facilityDialogCard}>
              <Card.Content style={styles.facilityDialogCardContent}>
                <View style={styles.dialogSummaryRow}>
                  <Text>Staff available</Text>
                  <Text style={styles.repairTargetValue}>
                    {formatNumber(facilityView.assignedWorkers - activeTrainingWorkers)}
                  </Text>
                </View>

                <View style={styles.dialogSummaryRow}>
                  <Text>Training staff</Text>
                  <Text style={styles.repairTargetValue}>{formatNumber(trainingWorkers)}</Text>
                </View>

                <StaffingSlider
                  accessibilityLabel={`Staff sent to training ${formatNumber(trainingWorkers)} of ${formatNumber(facilityView.assignedWorkers)}`}
                  max={facilityView.assignedWorkers}
                  min={activeTrainingWorkers}
                  onChange={setTrainingWorkers}
                  step={1}
                  value={trainingWorkers}
                />

                <View style={styles.dialogSummaryRow}>
                  <Text>Training cost</Text>
                  <Text style={styles.repairTargetValue}>{formatCurrency(trainingCost)}</Text>
                </View>

                <View style={styles.dialogSummaryRow}>
                  <Text>Training duration</Text>
                  <Text style={styles.repairTargetValue}>
                    {facilityView.staffTraining
                      ? formatDuration(trainingSeconds / 60)
                      : formatDuration(trainingDurationMs / 60_000)}
                  </Text>
                </View>

                <View style={styles.dialogSummaryRow}>
                  <Text>Temporary staff efficiency</Text>
                  <Text style={styles.repairTargetValue}>
                    {formatPercent(trainingEfficiency, { decimals: 0 })}
                  </Text>
                </View>

                <View style={styles.dialogSummaryRow}>
                  <Text>Expected StaffQ</Text>
                  <Text style={styles.repairTargetValue}>
                    Q{formatNumber(projectedTrainingQuality, { decimals: 2, forceDecimals: true })}
                  </Text>
                </View>

                {facilityView.staffTraining && (
                  <Text style={styles.facilityRepairCost}>
                    In progress · {formatDuration(trainingSeconds / 60)} remaining
                  </Text>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </Dialog.Content>

        {trainingActionMessage && (
          <Text style={styles.productionError}>{trainingActionMessage}</Text>
        )}

        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            disabled={
              !!facilityView.pendingStaffingChange ||
              additionalWorkers <= 0 ||
              !onTrainStaff
            }
            mode="contained"
            onPress={submitTraining}
          >
            {facilityView.staffTraining ? 'Add to training' : 'Start training'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function StaffingSlider({ accessibilityLabel, max, min = 0, onChange, positionFromValue, step, value, valueFromPosition }: { accessibilityLabel: string; max: number; min?: number; onChange: (value: number) => void; positionFromValue?: (value: number, max: number) => number; step: number; value: number; valueFromPosition?: (position: number, max: number) => number }) {
  const sliderWidthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const range = Math.max(0.0001, max - min);
  const progress = positionFromValue ? positionFromValue(value, max) : Math.max(0, Math.min(1, (value - min) / range));
  const setSliderPosition = (position: number) => {
    const rawValue = valueFromPosition ? valueFromPosition(position, max) : min + Math.max(0, Math.min(1, position)) * range;
    const decimalPlaces = Math.max(0, (String(step).split('.')[1] ?? '').length);
    const steppedValue = Math.round(rawValue / step) * step;
    onChangeRef.current(Number(steppedValue.toFixed(decimalPlaces)));
  };
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => { if (sliderWidthRef.current > 0) setSliderPosition(event.nativeEvent.locationX / sliderWidthRef.current); },
    onPanResponderMove: (event) => { if (sliderWidthRef.current > 0) setSliderPosition(event.nativeEvent.locationX / sliderWidthRef.current); },
    onStartShouldSetPanResponder: () => true,
  })).current;

  return <View accessibilityLabel={accessibilityLabel} style={styles.facilityDialogSlider}>
    <View onLayout={(event) => { sliderWidthRef.current = event.nativeEvent.layout.width; }} style={styles.marketSliderTouchArea} {...panResponder.panHandlers}>
      <View pointerEvents="none" style={styles.marketSliderTrack} />
      <View pointerEvents="none" style={[styles.marketSliderFill, { width: `${progress * 100}%` }]} />
      <View pointerEvents="none" style={[styles.marketSliderThumb, { left: `${progress * 100}%` }]} />
    </View>
    <View style={styles.marketSliderLabels}><Text style={styles.marketSliderLabel}>{formatNumber(min, { smartDecimals: true })}</Text><Text style={styles.marketSliderLabel}>{formatNumber(max, { smartDecimals: true })}</Text></View>
  </View>;
}

export function FacilityConstructionDialog(props: {
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  pendingConstruction: { facilityType: FacilityType; sizeHectares: number } | null;
  pendingDestruction: string | null;
  isConstructionYardOpen: boolean;
  isConstructionTutorial?: boolean;
  isConstructionConfirmationTutorial?: boolean;
  isFacilitySelectionEnabled?: boolean;
  onCloseConstructionYard: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  onSelectConstructionSize: (sizeHectares: number) => void;
  onConfirmConstruction: () => void;
  onBuyMissingConstructionInputs: () => void;
  onConfirmDestruction: () => void;
  onDismissConstruction: () => void;
  onDismissDestruction: () => void;
}) {
  return <>
    <ConfirmConstrution
      facilityType={props.pendingConstruction?.facilityType ?? null}
      sizeHectares={props.pendingConstruction?.sizeHectares ?? 1}
      finance={props.finance}
      inventory={props.inventory}
      isConstructionTutorial={props.isConstructionTutorial}
      isConstructionConfirmationTutorial={props.isConstructionConfirmationTutorial}
      market={props.market}
      onBuyMissingConstructionInputs={props.onBuyMissingConstructionInputs}
      onSelectConstructionSize={props.onSelectConstructionSize}
      onConfirm={props.onConfirmConstruction}
      onDismiss={props.onDismissConstruction}
    />
    <BuildFacilityDialog
      finance={props.finance}
      inventory={props.inventory}
      isConstructionTutorial={props.isConstructionTutorial}
      isFacilitySelectionEnabled={props.isFacilitySelectionEnabled}
      market={props.market}
      onDismiss={props.onCloseConstructionYard}
      onSelectFacility={props.onSelectFacility}
      visible={props.isConstructionYardOpen}
    />
    <DestructionDialog
      facilities={props.facilities}
      facilityId={props.pendingDestruction}
      finance={props.finance}
      market={props.market}
      onConfirm={props.onConfirmDestruction}
      onDismiss={props.onDismissDestruction}
    />
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
  isConstructionConfirmationTutorial?: boolean;
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
    const constructionCosts = getFacilityConstructionCosts(facilityType, definition, getFacilitySizeOptions(facilityType)[0]);
    const missingMaterials = Math.max(0, constructionCosts.constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials));
    const missingIndustrialMachines = Math.max(0, constructionCosts.industrialMachinesCost - inventory.getAmount(ResourceType.IndustrialMachines));
    const materialPurchaseCost = getMarketPurchaseCost(market, ResourceType.ConstructionMaterials, missingMaterials);
    const machinePurchaseCost = getMarketPurchaseCost(market, ResourceType.IndustrialMachines, missingIndustrialMachines);
    const canAffordConstruction = Number.isFinite(materialPurchaseCost)
      && Number.isFinite(machinePurchaseCost)
      && finance.canAfford(constructionCosts.landCost + materialPurchaseCost + machinePurchaseCost);
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
              const constructionCosts = getFacilityConstructionCosts(facilityType, definition, getFacilitySizeOptions(facilityType)[0]);
              const constructionMaterialsPrice = getDisplayedMarketUnitPrice(market, ResourceType.ConstructionMaterials, constructionCosts.constructionMaterialsCost);
              const industrialMachinesPrice = getDisplayedMarketUnitPrice(market, ResourceType.IndustrialMachines, constructionCosts.industrialMachinesCost);
              const totalConstructionCost = constructionCosts.landCost + constructionCosts.constructionMaterialsCost * constructionMaterialsPrice + constructionCosts.industrialMachinesCost * industrialMachinesPrice;
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
                      description={(
                        <View style={styles.facilityCostDetails}>
                          <View style={styles.currencyDescription}>
                            <Text>Land (euros):</Text>
                            <CurrencyValue value={constructionCosts.landCost} />
                          </View>
                          <View style={styles.currencyDescription}>
                            <Text>
                              <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} />
                              {' Construction Materials: '}
                              {formatNumber(constructionCosts.constructionMaterialsCost)} ·
                            </Text>
                            <CurrencyValue value={constructionMaterialsPrice} />
                          </View>
                          <View style={styles.currencyDescription}>
                            <Text>
                              <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} />
                              {' Industrial Machines: '}
                              {formatNumber(constructionCosts.industrialMachinesCost)} ·
                            </Text>
                            <CurrencyValue value={industrialMachinesPrice} />
                          </View>
                          <View style={styles.currencyDescription}>
                            <Text>Market replacement cost (Total cost):</Text>
                            <CurrencyValue value={totalConstructionCost} />
                          </View>
                        </View>
                      )}
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
  sizeHectares,
  finance,
  inventory,
  isConstructionTutorial,
  isConstructionConfirmationTutorial,
  market,
  onBuyMissingConstructionInputs,
  onSelectConstructionSize,
  onConfirm,
  onDismiss,
}: {
  facilityType: FacilityType | null;
  sizeHectares: number;
  finance: Finance;
  inventory: Inventory;
  isConstructionTutorial?: boolean;
  isConstructionConfirmationTutorial?: boolean;
  market: Market;
  onBuyMissingConstructionInputs: () => void;
  onSelectConstructionSize: (sizeHectares: number) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const [expandedRecipeName, setExpandedRecipeName] = useState<string | null>(null);
  const { height } = useWindowDimensions();
  if (facilityType === null) {
    return null;
  }

  const definition = getFacilityDefinition(facilityType);
  const sizeDefinition = getFacilitySizeDefinition(facilityType);
  const sizeOptions = getFacilitySizeOptions(facilityType);
  const constructionCosts = getFacilityConstructionCosts(facilityType, definition, sizeHectares);
  const sizeMultiplier = getFacilitySizeMultiplier(facilityType, sizeHectares);
  const contentMaxHeight = isConstructionTutorial
    ? Math.min(300, Math.max(180, height * 0.38))
    : Math.min(420, Math.max(220, height * 0.52));
  const canConstruct = finance.canAfford(constructionCosts.landCost)
    && inventory.has(ResourceType.ConstructionMaterials, constructionCosts.constructionMaterialsCost)
    && inventory.has(ResourceType.IndustrialMachines, constructionCosts.industrialMachinesCost);
  const balanceAfterConstruction = finance.getBalance() - constructionCosts.landCost;
  const materialsAfterConstruction = inventory.getAmount(ResourceType.ConstructionMaterials) - constructionCosts.constructionMaterialsCost;
  const industrialMachinesAfterConstruction = inventory.getAmount(ResourceType.IndustrialMachines) - constructionCosts.industrialMachinesCost;
  const missingMaterials = Math.max(0, -materialsAfterConstruction);
  const missingIndustrialMachines = Math.max(0, -industrialMachinesAfterConstruction);
  const missingInputsPurchaseCost = getMarketPurchaseCost(market, ResourceType.ConstructionMaterials, missingMaterials)
    + getMarketPurchaseCost(market, ResourceType.IndustrialMachines, missingIndustrialMachines);
  const displayedMissingInputsPurchaseCost = missingMaterials * getDisplayedMarketUnitPrice(market, ResourceType.ConstructionMaterials, missingMaterials)
    + missingIndustrialMachines * getDisplayedMarketUnitPrice(market, ResourceType.IndustrialMachines, missingIndustrialMachines);
  const canAutoBuyInputs = (missingMaterials > 0 || missingIndustrialMachines > 0)
    && Number.isFinite(missingInputsPurchaseCost)
    && finance.canAfford(constructionCosts.landCost + missingInputsPurchaseCost);

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} style={isConstructionTutorial ? styles.tutorialConstructionConfirmDialog : undefined} visible>
        <Dialog.Title>{`Construct ${definition.name}?`}</Dialog.Title>
        <Dialog.Content>
          <ScrollView contentContainerStyle={[styles.constructionConfirmContent, isConstructionTutorial && styles.tutorialConstructionConfirmContent]} style={{ maxHeight: contentMaxHeight }}>
            <Text style={styles.dialogDescription}>
              Purchase the land, supply the Construction Materials, and install the Industrial Machines before the facility is added to your company.
            </Text>
            {sizeOptions.length > 1 && !isConstructionTutorial && !isConstructionConfirmationTutorial && <>
              <Text variant="titleMedium" style={styles.dialogSectionHeading}>{sizeDefinition?.label ?? 'Size'}</Text>
              <SegmentedButtons
                buttons={sizeOptions.map((size) => ({ value: String(size), label: `${size}${sizeDefinition?.unit ? ` ${sizeDefinition.unit}` : ''}` }))}
                onValueChange={(value) => onSelectConstructionSize(Number(value))}
                value={String(sizeHectares)}
              />
            </>}
            <Card mode="contained" style={styles.dialogSummaryCard}>
              <Card.Content style={styles.dialogSummaryContent}>
                <View style={styles.dialogSummaryRow}>
                  <Text>Construction cost</Text>
                  <View style={styles.currencyDescription}>
                    <CurrencyValue value={constructionCosts.landCost} />
                    <Text style={styles.detailValue}>
                      {' · '}
                      <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} />
                      {' Construction Materials: '}
                      {formatNumber(constructionCosts.constructionMaterialsCost)}
                      {' · '}
                      <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} />
                      {' Industrial Machines: '}
                      {formatNumber(constructionCosts.industrialMachinesCost)}
                    </Text>
                  </View>
                </View>
                <View style={styles.dialogSummaryRow}>
                  <Text>Resources after purchase</Text>
                  <View style={styles.currencyDescription}>
                    <CurrencyValue value={balanceAfterConstruction} />
                    <Text style={styles.detailValue}>
                      {' · '}
                      <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} />
                      {' Construction Materials: '}
                      {formatNumber(materialsAfterConstruction)}
                      {' · '}
                      <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} />
                      {' Industrial Machines: '}
                      {formatNumber(industrialMachinesAfterConstruction)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
            <Text variant="titleMedium" style={styles.dialogSectionHeading}>
              Available recipes
            </Text>
            {definition.recipes.map((recipe) => {
              const isExpanded = expandedRecipeName === recipe.name;
              return (
                <View key={recipe.name}>
                  <List.Item
                    onPress={() => setExpandedRecipeName(isExpanded ? null : recipe.name)}
                    left={() => (
                      <TooltipTextIcon label={formatRecipeName(recipe)}>
                        {RECIPE_ICONS[recipe.name]}
                      </TooltipTextIcon>
                    )}
                    right={(props) => (
                      <List.Icon {...props} icon={isExpanded ? 'chevron-up' : 'chevron-down'} />
                    )}
                    title={formatRecipeName(recipe)}
                  />
                  {isExpanded && (
                    <View style={styles.dialogSummaryContent}>
                      <RecipeResourceSummary
                        inputMultiplier={sizeMultiplier}
                        outputMultiplier={sizeMultiplier}
                        recipe={recipe}
                      />
                      <WorkMetric value={String(recipe.requiredWork * sizeMultiplier)} />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions style={styles.constructionConfirmActions}>
          <Button compact mode="outlined" onPress={onDismiss}>
            Cancel
          </Button>
          {(missingMaterials > 0 || missingIndustrialMachines > 0) && (
            <Button
              compact
              disabled={!canAutoBuyInputs}
              mode="outlined"
              onPress={onBuyMissingConstructionInputs}
            >
              <Text>Buy missing inputs · </Text>
              <MaterialCommunityIcons
                name={APP_ICONS.coin}
                size={16}
                color={styles.detailValue.color}
              />
              <Text>
                {' '}
                {formatCurrency(displayedMissingInputsPurchaseCost).replace(/\s*€/u, '')}
              </Text>
            </Button>
          )}
          <Button compact disabled={!canConstruct} mode="contained" onPress={onConfirm}>
            Confirm build
          </Button>
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


