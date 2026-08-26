import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  IconButton,
  Menu,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import type { Finance } from '@/game/finance';
import {
  INVENTORY_FLOW_PERIODS,
  type Inventory,
  type ResourceFlowLedger,
} from '@/game/inventory';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import { getRecipe } from '@/game/recipes';
import { getSalesResourceProfile } from '@/game/sales';
import {
  MARKET_AUTOTRADE_DEFAULT_INTERVAL_MS,
  MARKET_AUTOTRADE_INTERVAL_OPTIONS,
  type Market,
  type MarketAutomation,
  type MarketTradeMultiplier,
} from '@/game/market';
import { RESOURCE_GROUPS, RESOURCE_TYPES, getResource } from '@/game/resources';
import { APP_ICONS } from '@/icons';
import { formatCurrency, formatNumber, getColorClass } from '@/utils';
import { colors } from '@/theme';
import { SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { TooltipMaterialIcon, TooltipResourceIcon } from '@/ui/dashboard/components/IconTooltip';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

const multiplierSteps = [1, 10, 100, 1000] as const;

const sliderMinimum = 1;
const sliderMaximum = 1000;

function sliderPosition(value: number) {
  return Math.log10(value / sliderMinimum) / Math.log10(sliderMaximum / sliderMinimum);
}

function sliderValue(position: number) {
  const clamped = Math.max(0, Math.min(1, position));
  return Math.max(sliderMinimum, Math.min(sliderMaximum, Math.round(sliderMinimum * (sliderMaximum / sliderMinimum) ** clamped)));
}

export function InventoryView({
  buyMarketResource,
  currentGameTimeMs,
  facilities,
  finance,
  inventory,
  market,
  onlyInStock,
  resourceFlow,
  showActiveRecipeInputs,
  sellMarketResource,
  setMarketAutomation,
  setOnlyInStock,
  setShowActiveRecipeInputs,
}: {
  buyMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  currentGameTimeMs: number;
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  onlyInStock: boolean;
  resourceFlow: ResourceFlowLedger;
  showActiveRecipeInputs: boolean;
  sellMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  setMarketAutomation: (resourceType: (typeof RESOURCE_TYPES)[number], updates: Partial<MarketAutomation>) => boolean;
  setOnlyInStock: (value: boolean) => void;
  setShowActiveRecipeInputs: (value: boolean) => void;
}) {
  const [multiplier, setMultiplier] = useState<MarketTradeMultiplier>(1);
  const [selectedResource, setSelectedResource] = useState<(typeof RESOURCE_TYPES)[number] | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [settingsResource, setSettingsResource] = useState<(typeof RESOURCE_TYPES)[number] | null>(null);
  const [flowPeriodId, setFlowPeriodId] = useState<(typeof INVENTORY_FLOW_PERIODS)[number]['id']>('1-minute');
  const [intervalMenuOpen, setIntervalMenuOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({
    minKeep: '',
    maxSell: '',
    maxBuyPrice: '',
    minSellPrice: '',
    buyAt: '',
    buyTo: '',
    tradeIntervalMs: MARKET_AUTOTRADE_DEFAULT_INTERVAL_MS,
  });
  const sliderWidthRef = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (event) => {
        if (sliderWidthRef.current > 0) {
          setMultiplier(sliderValue(event.nativeEvent.locationX / sliderWidthRef.current));
        }
      },
      onPanResponderMove: (event) => {
        if (sliderWidthRef.current > 0) {
          setMultiplier(sliderValue(event.nativeEvent.locationX / sliderWidthRef.current));
        }
      },
    }),
  ).current;
  const sliderAmount = multiplier === 'all' ? sliderMaximum : multiplier;
  const sliderProgress = sliderPosition(sliderAmount);
  const flowPeriod =
    INVENTORY_FLOW_PERIODS.find((period) => period.id === flowPeriodId) ??
    INVENTORY_FLOW_PERIODS[1];
  const openSettings = (resourceType: (typeof RESOURCE_TYPES)[number]) => {
    const automation = market.getAutomation(resourceType);
    setSettingsDraft({
      minKeep: String(automation.autoSellMinKeep || getSalesResourceProfile(resourceType).standardOrderLot),
      maxSell: String(automation.autoSellMaxPerMinute),
      maxBuyPrice: String(automation.autoBuyMaxUnitPrice),
      minSellPrice: String(automation.autoSellMinUnitPrice),
      buyAt: automation.autoBuyAtInventory === 'any' ? 'Any' : String(automation.autoBuyAtInventory),
      buyTo: String(automation.autoBuyToInventory),
      tradeIntervalMs: automation.autoTradeIntervalMs,
    });
    setSettingsResource(resourceType);
  };
  const saveSettings = () => {
    if (!settingsResource) return;
    const values = Object.fromEntries(
      Object.entries(settingsDraft).map(([key, value]) => [key, Number(value)]),
    );
    const buyAt = settingsDraft.buyAt.trim().toLowerCase() === 'any' ? 'any' : Number(settingsDraft.buyAt);
    if (Object.entries(values).some(([key, value]) => key !== 'buyAt' && (!Number.isFinite(value) || value < 0))
      || (buyAt !== 'any' && (!Number.isFinite(buyAt) || buyAt < 0))) return;
    setMarketAutomation(settingsResource, {
      autoSellMinKeep: values.minKeep,
      autoTradeIntervalMs: settingsDraft.tradeIntervalMs,
      autoSellMaxPerMinute: values.maxSell,
      autoBuyMaxUnitPrice: values.maxBuyPrice,
      autoBuyAtInventory: buyAt,
      autoBuyToInventory: values.buyTo,
      autoSellMinUnitPrice: values.minSellPrice,
    });
    setSettingsResource(null);
  };

  return (
    <>
      <SectionHeading
        eyebrow="INVENTORY"
        title="Inventory"
        subtitle="Review your resources, then open a resource to buy, sell, and automate its market flow."
      />
      {selectedResource && (
        <View accessibilityLabel="Inventory flow period" style={localStyles.flowPeriodPicker}>
          {INVENTORY_FLOW_PERIODS.map((period) => (
            <Button
              compact
              key={period.id}
              mode={period.id === flowPeriod.id ? 'contained' : 'outlined'}
              onPress={() => setFlowPeriodId(period.id)}
            >
              {period.label}
            </Button>
          ))}
        </View>
      )}
    <View accessibilityLabel={`Trade amount ${multiplier === 'all' ? 'all' : multiplier}`} style={styles.marketSlider}>
      <View
        onLayout={(event) => {
          sliderWidthRef.current = event.nativeEvent.layout.width;
        }}
        style={styles.marketSliderTouchArea}
        {...panResponder.panHandlers}
      >
        <View pointerEvents="none" style={styles.marketSliderTrack} />
        <View pointerEvents="none" style={[styles.marketSliderFill, { width: `${sliderProgress * 100}%` }]} />
        <View pointerEvents="none" style={[styles.marketSliderThumb, { left: `${sliderProgress * 100}%` }]} />
      </View>
      <View style={styles.marketSliderLabels}>
        {multiplierSteps.map((step) => (
          <Pressable
            accessibilityLabel={`Set trade amount to ${step}`}
            accessibilityRole="button"
            key={step}
            onPress={() => setMultiplier(step)}
            style={styles.marketSliderStep}
          >
            <View
              style={[
                styles.marketSliderMarker,
                multiplier === step && styles.marketSliderMarkerActive,
              ]}
            />
            <Text
              style={[
                styles.marketSliderLabel,
                multiplier === step && styles.marketSliderLabelActive,
              ]}
            >
              {step}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityLabel="Set trade amount to all"
          accessibilityRole="button"
          onPress={() => setMultiplier('all')}
          style={styles.marketSliderStep}
        >
          <Text
            style={[
              styles.marketSliderLabel,
              multiplier === 'all' && styles.marketSliderLabelActive,
            ]}
          >
            All
          </Text>
        </Pressable>
      </View>
    </View>
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: onlyInStock }}
      onPress={() => setOnlyInStock(!onlyInStock)}
      style={localStyles.filterRow}
    >
      <Checkbox status={onlyInStock ? 'checked' : 'unchecked'} />
      <Text>Only show resources with inventory</Text>
    </Pressable>
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: showActiveRecipeInputs }}
      onPress={() => setShowActiveRecipeInputs(!showActiveRecipeInputs)}
      style={localStyles.filterRow}
    >
      <Checkbox status={showActiveRecipeInputs ? 'checked' : 'unchecked'} />
      <Text>Always show active recipe inputs</Text>
    </Pressable>
    {RESOURCE_GROUPS.map((group) => {
      const activeRecipeInputs = new Set(facilities.getAll().flatMap((facility) => {
        const view = facility.getView();
        return view.isActive && view.activeRecipeName ? getRecipe(view.activeRecipeName).inputs.map((input) => input.resourceType) : [];
      }));
      const visibleResources = group.resources.filter(
        (resourceType) =>
          !onlyInStock ||
          inventory.getAmount(resourceType) > 0 ||
          (showActiveRecipeInputs && activeRecipeInputs.has(resourceType)),
      );
      if (visibleResources.length === 0) return null;
      const isCollapsed = collapsedGroups[group.id] === true;
      return (
        <View key={group.id} style={styles.cardContent}>
          <Pressable
            accessibilityLabel={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.label} resource group`}
            accessibilityRole="button"
            accessibilityState={{ expanded: !isCollapsed }}
            onPress={() =>
              setCollapsedGroups((current) => ({
                ...current,
                [group.id]: !isCollapsed,
              }))
            }
            style={localStyles.groupHeader}
          >
            <Text style={styles.cardKicker}>{group.label}</Text>
            <MaterialCommunityIcons
              color={colors.muted}
              name={isCollapsed ? APP_ICONS.expand : APP_ICONS.collapse}
              size={18}
            />
          </Pressable>
          {!isCollapsed && visibleResources.map((resourceType) => {
      const resource = getResource(resourceType);
      const entry = inventory.getEntry(resourceType);
      const isSelected = selectedResource === resourceType;
      return (
        <View key={resourceType}>
          <Pressable
            accessibilityLabel={`${resource.name}: ${formatNumber(entry.quantity, {
              smartDecimals: true,
            })} units, quality ${formatNumber(entry.quality, { smartDecimals: true })}`}
            accessibilityRole="button"
            onPress={() => setSelectedResource(isSelected ? null : resourceType)}
            style={styles.detailRow}
          >
          <Text variant="bodyLarge">{resource.icon} {resource.name}</Text>
            <View style={styles.inventoryQualityValue}>
              <Text style={styles.detailValue}>
                {`${formatNumber(entry.quantity, { smartDecimals: true })} units`}
              </Text>
              <MaterialCommunityIcons
                color={colors.muted}
                name={APP_ICONS.quality}
                size={16}
              />
              <Text
                style={[styles.detailValue, { color: getColorClass(entry.quality) }]}
              >
                {formatNumber(entry.quality, { smartDecimals: true })}
              </Text>
              <Text style={styles.detailValue}>
                {formatCurrency(entry.sourceCostPerUnit)}/unit
              </Text>
            </View>
          </Pressable>
          {isSelected && (
            <MarketCard
              buyMarketResource={buyMarketResource}
              currentGameTimeMs={currentGameTimeMs}
              finance={finance}
              flowPeriod={flowPeriod}
              inventory={inventory}
              market={market}
              multiplier={multiplier}
              openSettings={openSettings}
              resourceFlow={resourceFlow}
              resourceType={resourceType}
              sellMarketResource={sellMarketResource}
              setMarketAutomation={setMarketAutomation}
            />
          )}
        </View>
      );
          })}
        </View>
      );
    })}
    <Portal>
      <Dialog
        dismissable
        onDismiss={() => {
          setIntervalMenuOpen(false);
          setSettingsResource(null);
        }}
        visible={settingsResource !== null}
      >
        <Dialog.Title>{settingsResource ? `${getResource(settingsResource).name} automation` : 'Automation settings'}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            dense
            keyboardType="decimal-pad"
            label="Minimum inventory to keep"
            mode="outlined"
            onChangeText={(value) =>
              setSettingsDraft((draft) => ({ ...draft, minKeep: value }))
            }
            style={styles.marketAutomationInput}
            value={settingsDraft.minKeep}
          />
          <Button
            compact
            onPress={() => {
              if (settingsResource) {
                setSettingsDraft((draft) => ({
                  ...draft,
                  minKeep: String(getSalesResourceProfile(settingsResource).standardOrderLot),
                }));
              }
            }}
          >
            Use standard order lot
          </Button>
          <TextInput
            dense
            keyboardType="decimal-pad"
            label="Maximum autosell per minute"
            mode="outlined"
            onChangeText={(value) =>
              setSettingsDraft((draft) => ({ ...draft, maxSell: value }))
            }
            style={styles.marketAutomationInput}
            value={settingsDraft.maxSell}
          />
          <View style={localStyles.marketAutomationRow}>
            <TextInput
              dense
              keyboardType="decimal-pad"
              label="Autobuy buy at"
              mode="outlined"
              onChangeText={(value) =>
                setSettingsDraft((draft) => ({ ...draft, buyAt: value }))
              }
              style={[styles.marketAutomationInput, localStyles.marketAutomationInput]}
              value={settingsDraft.buyAt}
            />
            <TextInput
              dense
              keyboardType="decimal-pad"
              label="Autobuy buy to"
              mode="outlined"
              onChangeText={(value) =>
                setSettingsDraft((draft) => ({ ...draft, buyTo: value }))
              }
              style={[styles.marketAutomationInput, localStyles.marketAutomationInput]}
              value={settingsDraft.buyTo}
            />
          </View>
          <Button
            compact
            mode={settingsDraft.buyAt.trim().toLowerCase() === 'any' ? 'contained' : 'outlined'}
            onPress={() => setSettingsDraft((draft) => ({ ...draft, buyAt: 'Any' }))}
          >
            Buy at Any inventory level
          </Button>
          <Text variant="labelLarge">Autotrade interval</Text>
          <Menu
            anchor={
              <Button
                compact
                icon="chevron-down"
                mode="outlined"
                onPress={() => setIntervalMenuOpen(true)}
              >
                {MARKET_AUTOTRADE_INTERVAL_OPTIONS.find(
                  (option) => option.milliseconds === settingsDraft.tradeIntervalMs,
                )?.label ?? 'Select interval'}
              </Button>
            }
            onDismiss={() => setIntervalMenuOpen(false)}
            visible={intervalMenuOpen}
          >
            {MARKET_AUTOTRADE_INTERVAL_OPTIONS.map((option) => (
              <Menu.Item
                key={option.milliseconds}
                onPress={() => {
                  setSettingsDraft((draft) => ({
                    ...draft,
                    tradeIntervalMs: option.milliseconds,
                  }));
                  setIntervalMenuOpen(false);
                }}
                title={option.label}
              />
            ))}
          </Menu>
          <View style={localStyles.marketAutomationRow}>
            <TextInput
              dense
              keyboardType="decimal-pad"
              label="Maximum autobuy price"
              mode="outlined"
              onChangeText={(value) =>
                setSettingsDraft((draft) => ({ ...draft, maxBuyPrice: value }))
              }
              style={[styles.marketAutomationInput, localStyles.marketAutomationInput]}
              value={settingsDraft.maxBuyPrice}
            />
            <TextInput
              dense
              keyboardType="decimal-pad"
              label="Minimum autosell price"
              mode="outlined"
              onChangeText={(value) =>
                setSettingsDraft((draft) => ({ ...draft, minSellPrice: value }))
              }
              style={[styles.marketAutomationInput, localStyles.marketAutomationInput]}
              value={settingsDraft.minSellPrice}
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setSettingsResource(null)}>Cancel</Button>
          <Button onPress={saveSettings}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
    </>
  );
}

const localStyles = StyleSheet.create({
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  flowPeriodPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resourceFlow: {
    backgroundColor: colors.paleGreen,
    borderRadius: 10,
    gap: 6,
    padding: 10,
  },
  resourceFlowHeader: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resourceFlowNet: {
    borderTopColor: colors.muted,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
    paddingTop: 6,
  },
  resourceFlowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resourceFlowValue: { fontWeight: '800' },
  marketInfo: {
    backgroundColor: colors.paleGreen,
    borderRadius: 10,
    gap: 8,
    padding: 10,
  },
  tradeQuote: { flex: 1, gap: 2, minWidth: 0 },
  tradeQuoteAmount: { color: colors.charcoal, fontSize: 12, fontWeight: '700' },
  tradeQuotePrice: { color: colors.marketGreen, fontSize: 13, fontWeight: '800' },
  tradeQuotes: {
    backgroundColor: colors.paleGreen,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  marketRows: { gap: 6 },
  marketRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  marketAutomationRow: { flexDirection: 'row', gap: 8 },
  marketAutomationInput: { flex: 1, minWidth: 0 },
});

function MarketCard({
  buyMarketResource,
  currentGameTimeMs,
  finance,
  flowPeriod,
  inventory,
  market,
  multiplier,
  openSettings,
  resourceFlow,
  resourceType,
  sellMarketResource,
  setMarketAutomation,
}: {
  buyMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  currentGameTimeMs: number;
  finance: Finance;
  flowPeriod: (typeof INVENTORY_FLOW_PERIODS)[number];
  inventory: Inventory;
  market: Market;
  multiplier: MarketTradeMultiplier;
  openSettings: (resourceType: (typeof RESOURCE_TYPES)[number]) => void;
  resourceFlow: ResourceFlowLedger;
  resourceType: (typeof RESOURCE_TYPES)[number];
  sellMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  setMarketAutomation: (resourceType: (typeof RESOURCE_TYPES)[number], updates: Partial<MarketAutomation>) => boolean;
}) {
  const local = market.getLocalEntry(resourceType);
  const regional = market.getRegionalEntry(resourceType);
  const global = market.getGlobalEntry(resourceType);
  const automation = market.getAutomation(resourceType);
  const localPrice = market.getLocalPrice(resourceType);
  const regionalPrice = market.getRegionalPrice(resourceType);
  const globalPrice = market.getGlobalPrice(resourceType);
  const buyAmount =
    multiplier === 'all'
      ? market.getMaximumLocalPurchaseAmountAtCash(resourceType, finance.getBalance())
      : multiplier;
  const sellAmount = multiplier === 'all' ? inventory.getAmount(resourceType) : multiplier;
  const inventoryQuality = inventory.getQuality(resourceType);
  const buyQuote = market.getLocalBuyQuote(resourceType, buyAmount);
  const sellQuoteAmount = Math.min(sellAmount, inventory.getAmount(resourceType));
  const sellQuote = market.getLocalSellQuote(resourceType, sellQuoteAmount, inventoryQuality);
  const localRegionalDiffusion = market.getLocalRegionalDiffusionInfo(resourceType);
  const regionalGlobalDiffusion = market.getRegionalGlobalDiffusionInfo(resourceType);
  const localSupplyTrend =
    localRegionalDiffusion.direction === 'to-local'
      ? 'up'
      : localRegionalDiffusion.direction === 'to-regional'
        ? 'down'
        : 'none';
  const globalSupplyTrend =
    regionalGlobalDiffusion.direction === 'to-global'
      ? 'up'
      : regionalGlobalDiffusion.direction === 'to-regional'
        ? 'down'
        : 'none';
  const localPriceTrend =
    localSupplyTrend === 'up'
      ? 'down'
      : localSupplyTrend === 'down'
        ? 'up'
        : 'none';
  const globalPriceTrend =
    globalSupplyTrend === 'up'
      ? 'down'
      : globalSupplyTrend === 'down'
        ? 'up'
        : 'none';
  const resourceName = getResource(resourceType).name;
  return (
    <Card mode="contained" style={styles.marketCard}>
      <Card.Content style={styles.marketCardContent}>
        <View style={styles.marketResourceHeader}>
          <Text variant="titleMedium" style={styles.marketResourceName}>
            <TooltipResourceIcon resourceType={resourceType} /> {resourceName}
          </Text>
          <Text style={styles.marketInventory}>
            {formatNumber(inventory.getAmount(resourceType), { smartDecimals: true })}
          </Text>
        </View>
        <View style={localStyles.marketInfo}>
          <ResourceFlowCard
            currentGameTimeMs={currentGameTimeMs}
            flowPeriod={flowPeriod}
            resourceFlow={resourceFlow}
            resourceType={resourceType}
          />
        <View style={styles.marketMetrics}>
          <View style={localStyles.marketRows}>
            <View style={localStyles.marketRow}>
              <MarketMetric
                color={colors.marketGold}
                icon={APP_ICONS.marketLocalPrice}
                trend={localPriceTrend}
                label="Local price"
                value={formatCurrency(localPrice)}
              />
              <MarketMetric
                color={colors.charcoal}
                icon={APP_ICONS.localMarket}
                trend={localSupplyTrend}
                label="Local supply"
                value={formatNumber(local.supply, { smartDecimals: true })}
              />
              <MarketMetric
                color={colors.charcoal}
                icon={APP_ICONS.quality}
                label="Local quality"
                value={`Q${formatNumber(local.quality, { decimals: 2, forceDecimals: true })}`}
              />
            </View>
            <View style={localStyles.marketRow}>
              <MarketMetric
                color={colors.muted}
                icon={APP_ICONS.marketRegionalPrice}
                label="Regional price"
                value={formatCurrency(regionalPrice)}
              />
              <MarketMetric
                color={colors.muted}
                icon={APP_ICONS.regionalMarket}
                label="Regional supply"
                value={formatNumber(regional.supply, { smartDecimals: true })}
              />
              <MarketMetric
                color={colors.muted}
                icon={APP_ICONS.quality}
                label="Regional quality"
                value={`Q${formatNumber(regional.quality, { decimals: 2, forceDecimals: true })}`}
              />
            </View>
            <View style={localStyles.marketRow}>
              <MarketMetric
                color={colors.muted}
                icon={APP_ICONS.marketGlobalPrice}
                trend={globalPriceTrend}
                label="Global price"
                value={formatCurrency(globalPrice)}
              />
              <MarketMetric
                color={colors.muted}
                icon={APP_ICONS.globalMarket}
                trend={globalSupplyTrend}
                label="Global supply"
                value={formatNumber(global.supply, { smartDecimals: true })}
              />
              <MarketMetric
                color={colors.muted}
                icon={APP_ICONS.quality}
                label="Global quality"
                value={`Q${formatNumber(global.quality, { decimals: 2, forceDecimals: true })}`}
              />
            </View>
          </View>
          <View style={styles.marketMetricFlowColumn}>
            <MarketMetric
              color={colors.marketGreen}
              label="Local ↔ Regional"
              value={
                localRegionalDiffusion.direction === 'none'
                  ? '—'
                  : `${formatNumber(localRegionalDiffusion.amount, { smartDecimals: true })}/m`
              }
            />
            <MarketMetric
              color={colors.marketGreen}
              label="Regional ↔ Global"
              value={
                regionalGlobalDiffusion.direction === 'none'
                  ? '—'
                  : `${formatNumber(regionalGlobalDiffusion.amount, { smartDecimals: true })}/m`
              }
            />
          </View>
        </View>
        </View>
        <View style={localStyles.tradeQuotes}>
          <TradeQuote
            label="Buy from local"
            quality={buyQuote.quality}
            resourceName={resourceName}
            total={buyQuote.success ? buyQuote.unitPrice * buyQuote.amount : null}
            unitPrice={buyQuote.unitPrice}
            amount={buyQuote.amount}
          />
          <TradeQuote
            label="Sell from inventory"
            quality={inventoryQuality}
            resourceName={resourceName}
            total={sellQuote.success ? sellQuote.unitPrice * sellQuote.amount : null}
            unitPrice={sellQuote.unitPrice}
            amount={sellQuote.amount}
          />
        </View>
        <View style={styles.marketActions}>
          <IconButton
            accessibilityLabel={`Buy ${formatNumber(buyQuote.amount)} ${resourceName}`}
            containerColor={colors.marketBuy}
            disabled={!buyQuote.success}
            icon={APP_ICONS.marketBuy}
            iconColor={colors.onDark}
            onPress={() => buyMarketResource(resourceType, buyQuote.amount)}
            size={19}
            style={styles.marketActionButton}
          />
          <IconButton
            accessibilityLabel={`Sell ${formatNumber(sellQuote.amount)} ${resourceName}`}
            containerColor={colors.marketSell}
            disabled={!sellQuote.success}
            icon={APP_ICONS.marketSell}
            iconColor={colors.onDark}
            onPress={() => sellMarketResource(resourceType, sellQuote.amount)}
            size={19}
            style={styles.marketActionButton}
          />
          <IconButton
            accessibilityLabel={`${automation.autoBuyEnabled ? 'Disable' : 'Enable'} autobuy for ${resourceName}`}
            containerColor={
              automation.autoBuyEnabled
                ? colors.marketAutomationActive
                : colors.marketAutomation
            }
            icon={APP_ICONS.marketAutoBuy}
            iconColor={colors.onDark}
            onPress={() =>
              setMarketAutomation(resourceType, {
                autoBuyEnabled: !automation.autoBuyEnabled,
              })
            }
            size={19}
            style={styles.marketActionButton}
          />
          <IconButton
            accessibilityLabel={`${automation.autoSellEnabled ? 'Disable' : 'Enable'} autosell for ${resourceName}`}
            containerColor={
              automation.autoSellEnabled
                ? colors.marketAutomationActive
                : colors.marketAutomation
            }
            icon={APP_ICONS.marketAutoSell}
            iconColor={colors.onDark}
            onPress={() =>
              setMarketAutomation(resourceType, {
                autoSellEnabled: !automation.autoSellEnabled,
              })
            }
            size={19}
            style={styles.marketActionButton}
          />
          <IconButton
            accessibilityLabel={`Automation settings for ${resourceName}`}
            containerColor={colors.marketAutomation}
            icon={APP_ICONS.settings}
            iconColor={colors.onDark}
            onPress={() => openSettings(resourceType)}
            size={19}
            style={styles.marketActionButton}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

function ResourceFlowCard({
  currentGameTimeMs,
  flowPeriod,
  resourceFlow,
  resourceType,
}: {
  currentGameTimeMs: number;
  flowPeriod: (typeof INVENTORY_FLOW_PERIODS)[number];
  resourceFlow: ResourceFlowLedger;
  resourceType: (typeof RESOURCE_TYPES)[number];
}) {
  const summary = resourceFlow.getSummary(resourceType, currentGameTimeMs, flowPeriod.milliseconds);
  const rows = [
    { label: 'Facility output', value: summary.facilityOutput },
    { label: 'Production inputs', value: summary.facilityInput },
    {
      label: 'Market (net)',
      value: summary.market,
      suffix:
        summary.market === 0 && summary.marketVolume > 0
          ? ` · ${formatNumber(summary.marketVolume, { smartDecimals: true })} traded`
          : '',
    },
    { label: 'Customer orders', value: summary.customerOrders },
    { label: 'Facility spending', value: summary.facilitySpending },
    { label: 'Rewards', value: summary.rewards },
  ].filter((row) => row.value !== 0 || row.suffix);

  return <View style={localStyles.resourceFlow}>
    <Text style={localStyles.resourceFlowHeader}>{`Inventory flow · ${flowPeriod.label}`}</Text>
    {rows.length === 0 && <Text style={styles.marketMetricLabel}>No inventory changes in this period.</Text>}
    {rows.map((row) => (
      <ResourceFlowRow
        key={row.label}
        label={row.label}
        suffix={row.suffix}
        value={row.value}
      />
    ))}
    <View style={localStyles.resourceFlowNet}>
      <ResourceFlowRow label="Net change" strong value={summary.netChange} />
    </View>
  </View>;
}

function ResourceFlowRow({
  label,
  strong = false,
  suffix = '',
  value,
}: {
  label: string;
  strong?: boolean;
  suffix?: string;
  value: number;
}) {
  const color = value > 0 ? colors.marketGreen : value < 0 ? colors.error : colors.muted;
  const formattedValue = `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(value), { smartDecimals: true })}${suffix}`;
  return (
    <View
      accessibilityLabel={`${label}: ${formattedValue}`}
      style={localStyles.resourceFlowRow}
    >
      <Text style={strong ? localStyles.resourceFlowValue : undefined}>{label}</Text>
      <Text style={[localStyles.resourceFlowValue, { color }]}>
        {formattedValue}
      </Text>
    </View>
  );
}

function TradeQuote({
  amount,
  label,
  quality,
  resourceName,
  total,
  unitPrice,
}: {
  amount: number;
  label: string;
  quality: number;
  resourceName: string;
  total: number | null;
  unitPrice: number;
}) {
  const isAvailable = total !== null;
  return (
    <View accessibilityLabel={`${label}: ${isAvailable ? `${formatNumber(amount)} ${resourceName} at ${formatCurrency(unitPrice)} per unit` : 'quote unavailable'}`} style={localStyles.tradeQuote}>
      <Text style={styles.marketMetricLabel}>{label}</Text>
      {isAvailable ? <>
        <Text numberOfLines={1} style={localStyles.tradeQuoteAmount}>{`${formatNumber(amount, { smartDecimals: true })} Q${formatNumber(quality, { decimals: 2, forceDecimals: true })} ${resourceName}`}</Text>
        <Text style={localStyles.tradeQuotePrice}>{`${formatCurrency(total)} · ${formatCurrency(unitPrice)}/unit`}</Text>
      </> : <Text style={styles.marketMetricValue}>Quote unavailable</Text>}
    </View>
  );
}

function MarketMetric({
  color,
  icon,
  label,
  trend = 'none',
  value,
}: {
  color: string;
  icon?: string;
  label: string;
  trend?: 'up' | 'down' | 'none';
  value: string;
}) {
  const trendIcon =
    trend === 'up'
      ? APP_ICONS.marketTrendUp
      : trend === 'down'
        ? APP_ICONS.marketTrendDown
        : undefined;

  return (
    <View
      accessibilityLabel={`${label}: ${value}`}
      style={styles.marketMetric}
    >
      <Text style={styles.marketMetricLabel}>{label}</Text>
      <View style={styles.marketMetricValueRow}>
        {icon && (
          <TooltipMaterialIcon
            color={color}
            label={label}
            name={icon}
            size={14}
          />
        )}
        <Text style={[styles.marketMetricValue, { color }]}>{value}</Text>
        {trendIcon && (
          <TooltipMaterialIcon
            color={colors.marketGreen}
            label={`${label} trend`}
            name={trendIcon}
            size={13}
          />
        )}
      </View>
    </View>
  );
}
