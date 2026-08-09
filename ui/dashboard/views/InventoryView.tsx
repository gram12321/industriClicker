import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Checkbox, Dialog, IconButton, Portal, Text, TextInput } from 'react-native-paper';
import type { Finance } from '@/game/finance';
import type { Inventory } from '@/game/inventory';
import type { Market, MarketAutomation, MarketTradeMultiplier } from '@/game/market';
import { RESOURCE_GROUPS, RESOURCE_TYPES, getResource, getResourceIcon } from '@/game/resources';
import { APP_ICONS } from '@/icons';
import { formatCurrency, formatNumber } from '@/utils';
import { colors } from '@/theme';
import { SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
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

export function InventoryView({ buyMarketResource, finance, inventory, market, sellMarketResource, setMarketAutomation }: {
  buyMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  sellMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  setMarketAutomation: (resourceType: (typeof RESOURCE_TYPES)[number], updates: Partial<MarketAutomation>) => boolean;
}) {
  const [multiplier, setMultiplier] = useState<MarketTradeMultiplier>(1);
  const [selectedResource, setSelectedResource] = useState<(typeof RESOURCE_TYPES)[number] | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [settingsResource, setSettingsResource] = useState<(typeof RESOURCE_TYPES)[number] | null>(null);
  const [settingsDraft, setSettingsDraft] = useState({ minKeep: '', maxSell: '', maxBuyPrice: '', minSellPrice: '' });
  const sliderWidthRef = useRef(0);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (event) => { if (sliderWidthRef.current > 0) setMultiplier(sliderValue(event.nativeEvent.locationX / sliderWidthRef.current)); },
    onPanResponderMove: (event) => { if (sliderWidthRef.current > 0) setMultiplier(sliderValue(event.nativeEvent.locationX / sliderWidthRef.current)); },
  })).current;
  const sliderAmount = multiplier === 'all' ? sliderMaximum : multiplier;
  const sliderProgress = sliderPosition(sliderAmount);
  const openSettings = (resourceType: (typeof RESOURCE_TYPES)[number]) => {
    const automation = market.getAutomation(resourceType);
    setSettingsDraft({ minKeep: String(automation.autoSellMinKeep), maxSell: String(automation.autoSellMaxPerMinute), maxBuyPrice: String(automation.autoBuyMaxUnitPrice), minSellPrice: String(automation.autoSellMinUnitPrice) });
    setSettingsResource(resourceType);
  };
  const saveSettings = () => {
    if (!settingsResource) return;
    const values = Object.fromEntries(Object.entries(settingsDraft).map(([key, value]) => [key, Number(value)]));
    if (Object.values(values).some((value) => !Number.isFinite(value) || value < 0)) return;
    setMarketAutomation(settingsResource, { autoSellMinKeep: values.minKeep, autoSellMaxPerMinute: values.maxSell, autoBuyMaxUnitPrice: values.maxBuyPrice, autoSellMinUnitPrice: values.minSellPrice });
    setSettingsResource(null);
  };

  return <>
    <SectionHeading eyebrow="INVENTORY" title="Inventory" subtitle="Review your resources, then open a resource to buy, sell, and automate its market flow." />
    <View accessibilityLabel={`Trade amount ${multiplier === 'all' ? 'all' : multiplier}`} style={styles.marketSlider}>
      <View onLayout={(event) => { sliderWidthRef.current = event.nativeEvent.layout.width; }} style={styles.marketSliderTouchArea} {...panResponder.panHandlers}>
        <View pointerEvents="none" style={styles.marketSliderTrack} />
        <View pointerEvents="none" style={[styles.marketSliderFill, { width: `${sliderProgress * 100}%` }]} />
        <View pointerEvents="none" style={[styles.marketSliderThumb, { left: `${sliderProgress * 100}%` }]} />
      </View>
      <View style={styles.marketSliderLabels}>
        {multiplierSteps.map((step) => <Pressable accessibilityLabel={`Set trade amount to ${step}`} accessibilityRole="button" key={step} onPress={() => setMultiplier(step)} style={styles.marketSliderStep}><View style={[styles.marketSliderMarker, multiplier === step && styles.marketSliderMarkerActive]} /><Text style={[styles.marketSliderLabel, multiplier === step && styles.marketSliderLabelActive]}>{step}</Text></Pressable>)}
        <Pressable accessibilityLabel="Set trade amount to all" accessibilityRole="button" onPress={() => setMultiplier('all')} style={styles.marketSliderStep}><Text style={[styles.marketSliderLabel, multiplier === 'all' && styles.marketSliderLabelActive]}>All</Text></Pressable>
      </View>
    </View>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: onlyInStock }} onPress={() => setOnlyInStock((current) => !current)} style={localStyles.filterRow}><Checkbox status={onlyInStock ? 'checked' : 'unchecked'} /><Text>Only show resources with inventory</Text></Pressable>
    {RESOURCE_GROUPS.map((group) => {
      const visibleResources = group.resources.filter((resourceType) => !onlyInStock || inventory.getAmount(resourceType) > 0);
      if (visibleResources.length === 0) return null;
      const isCollapsed = collapsedGroups[group.id] === true;
      return <View key={group.id} style={styles.cardContent}><Pressable accessibilityLabel={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.label} resource group`} accessibilityRole="button" accessibilityState={{ expanded: !isCollapsed }} onPress={() => setCollapsedGroups((current) => ({ ...current, [group.id]: !isCollapsed }))} style={localStyles.groupHeader}><Text style={styles.cardKicker}>{group.label}</Text><MaterialCommunityIcons color={colors.muted} name={isCollapsed ? APP_ICONS.expand : APP_ICONS.collapse} size={18} /></Pressable>{!isCollapsed && visibleResources.map((resourceType) => {
      const resource = getResource(resourceType);
      const entry = inventory.getEntry(resourceType);
      const isSelected = selectedResource === resourceType;
      return <View key={resourceType}>
        <Pressable accessibilityLabel={`${resource.name}: ${formatNumber(entry.quantity, { smartDecimals: true })} units, quality ${formatNumber(entry.quality, { smartDecimals: true })}`} accessibilityRole="button" onPress={() => setSelectedResource(isSelected ? null : resourceType)} style={styles.detailRow}>
          <Text variant="bodyLarge">{`${getResourceIcon(resourceType)} ${resource.name}`}</Text>
          <View style={styles.inventoryQualityValue}><Text style={styles.detailValue}>{`${formatNumber(entry.quantity, { smartDecimals: true })} units`}</Text><MaterialCommunityIcons color={styles.workMetricIcon.color} name={APP_ICONS.quality} size={16} /><Text style={styles.detailValue}>{formatNumber(entry.quality, { smartDecimals: true })}</Text></View>
        </Pressable>
        {isSelected && <MarketCard buyMarketResource={buyMarketResource} finance={finance} inventory={inventory} market={market} multiplier={multiplier} openSettings={openSettings} resourceType={resourceType} sellMarketResource={sellMarketResource} setMarketAutomation={setMarketAutomation} />}
      </View>;
      })}</View>;
    })}
    <Portal>
      <Dialog dismissable onDismiss={() => setSettingsResource(null)} visible={settingsResource !== null}>
        <Dialog.Title>{settingsResource ? `${getResource(settingsResource).name} automation` : 'Automation settings'}</Dialog.Title>
        <Dialog.Content>
          <TextInput dense keyboardType="decimal-pad" label="Minimum inventory to keep" mode="outlined" onChangeText={(value) => setSettingsDraft((draft) => ({ ...draft, minKeep: value }))} style={styles.marketAutomationInput} value={settingsDraft.minKeep} />
          <TextInput dense keyboardType="decimal-pad" label="Maximum autosell per minute" mode="outlined" onChangeText={(value) => setSettingsDraft((draft) => ({ ...draft, maxSell: value }))} style={styles.marketAutomationInput} value={settingsDraft.maxSell} />
          <TextInput dense keyboardType="decimal-pad" label="Maximum autobuy price" mode="outlined" onChangeText={(value) => setSettingsDraft((draft) => ({ ...draft, maxBuyPrice: value }))} style={styles.marketAutomationInput} value={settingsDraft.maxBuyPrice} />
          <TextInput dense keyboardType="decimal-pad" label="Minimum autosell price" mode="outlined" onChangeText={(value) => setSettingsDraft((draft) => ({ ...draft, minSellPrice: value }))} style={styles.marketAutomationInput} value={settingsDraft.minSellPrice} />
        </Dialog.Content>
        <Dialog.Actions><Button onPress={() => setSettingsResource(null)}>Cancel</Button><Button onPress={saveSettings}>Save</Button></Dialog.Actions>
      </Dialog>
    </Portal>
  </>;
}

const localStyles = StyleSheet.create({
  filterRow: { alignItems: 'center', flexDirection: 'row', marginHorizontal: -8 },
  groupHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});

function MarketCard({ buyMarketResource, finance, inventory, market, multiplier, openSettings, resourceType, sellMarketResource, setMarketAutomation }: {
  buyMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  multiplier: MarketTradeMultiplier;
  openSettings: (resourceType: (typeof RESOURCE_TYPES)[number]) => void;
  resourceType: (typeof RESOURCE_TYPES)[number];
  sellMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  setMarketAutomation: (resourceType: (typeof RESOURCE_TYPES)[number], updates: Partial<MarketAutomation>) => boolean;
}) {
  const local = market.getLocalEntry(resourceType);
  const global = market.getGlobalEntry(resourceType);
  const automation = market.getAutomation(resourceType);
  const localPrice = market.getLocalPrice(resourceType);
  const globalPrice = market.getGlobalPrice(resourceType);
  const buyAmount = multiplier === 'all' ? Math.floor(Math.min(local.supply, finance.getBalance() / localPrice)) : multiplier;
  const sellAmount = multiplier === 'all' ? inventory.getAmount(resourceType) : multiplier;
  const diffusion = market.getDiffusionInfo(resourceType);
  const flowIcon = diffusion.direction === 'to-local' ? APP_ICONS.marketFlowToLocal : diffusion.direction === 'to-global' ? APP_ICONS.marketFlowToGlobal : APP_ICONS.marketBalanced;
  const localSupplyTrend = diffusion.direction === 'to-local' ? 'up' : diffusion.direction === 'to-global' ? 'down' : 'none';
  const globalSupplyTrend = diffusion.direction === 'to-local' ? 'down' : diffusion.direction === 'to-global' ? 'up' : 'none';
  const localPriceTrend = localSupplyTrend === 'up' ? 'down' : localSupplyTrend === 'down' ? 'up' : 'none';
  const globalPriceTrend = globalSupplyTrend === 'up' ? 'down' : globalSupplyTrend === 'down' ? 'up' : 'none';
  const resourceName = getResource(resourceType).name;
  return <Card mode="contained" style={styles.marketCard}><Card.Content style={styles.marketCardContent}>
    <View style={styles.marketResourceHeader}><Text variant="titleMedium" style={styles.marketResourceName}>{`${getResourceIcon(resourceType)} ${resourceName}`}</Text><Text style={styles.marketInventory}>{formatNumber(inventory.getAmount(resourceType), { smartDecimals: true })}</Text></View>
    <View style={styles.marketMetrics}><View style={styles.marketMetricColumn}><MarketMetric color={colors.marketGold} icon={APP_ICONS.marketLocalPrice} trend={localPriceTrend} label="Local price" value={formatCurrency(localPrice)} /><MarketMetric color={colors.muted} icon={APP_ICONS.marketGlobalPrice} trend={globalPriceTrend} label="Global price" value={formatCurrency(globalPrice)} /></View><View style={styles.marketMetricColumn}><MarketMetric color={colors.charcoal} icon={APP_ICONS.localMarket} trend={localSupplyTrend} label="Local market" value={formatNumber(local.supply, { smartDecimals: true })} /><MarketMetric color={colors.muted} icon={APP_ICONS.globalMarket} trend={globalSupplyTrend} label="Global market" value={formatNumber(global.supply, { smartDecimals: true })} /></View><View style={styles.marketMetricFlowColumn}><MarketMetric color={colors.marketGreen} icon={flowIcon} label="Flow" value={diffusion.direction === 'none' ? '—' : `${formatNumber(diffusion.amount, { smartDecimals: true })}/m`} /></View></View>
    <View style={styles.marketActions}><IconButton accessibilityLabel={`Buy ${formatNumber(buyAmount)} ${resourceName}`} containerColor={colors.marketBuy} disabled={buyAmount <= 0} icon={APP_ICONS.marketBuy} iconColor={colors.onDark} onPress={() => buyMarketResource(resourceType, buyAmount)} size={19} style={styles.marketActionButton} /><IconButton accessibilityLabel={`Sell ${formatNumber(sellAmount)} ${resourceName}`} containerColor={colors.marketSell} disabled={sellAmount <= 0} icon={APP_ICONS.marketSell} iconColor={colors.onDark} onPress={() => sellMarketResource(resourceType, sellAmount)} size={19} style={styles.marketActionButton} /><IconButton accessibilityLabel={`${automation.autoBuyEnabled ? 'Disable' : 'Enable'} autobuy for ${resourceName}`} containerColor={automation.autoBuyEnabled ? colors.marketAutomationActive : colors.marketAutomation} icon={APP_ICONS.marketAutoBuy} iconColor={colors.onDark} onPress={() => setMarketAutomation(resourceType, { autoBuyEnabled: !automation.autoBuyEnabled })} size={19} style={styles.marketActionButton} /><IconButton accessibilityLabel={`${automation.autoSellEnabled ? 'Disable' : 'Enable'} autosell for ${resourceName}`} containerColor={automation.autoSellEnabled ? colors.marketAutomationActive : colors.marketAutomation} icon={APP_ICONS.marketAutoSell} iconColor={colors.onDark} onPress={() => setMarketAutomation(resourceType, { autoSellEnabled: !automation.autoSellEnabled })} size={19} style={styles.marketActionButton} /><IconButton accessibilityLabel={`Automation settings for ${resourceName}`} containerColor={colors.marketAutomation} icon={APP_ICONS.settings} iconColor={colors.onDark} onPress={() => openSettings(resourceType)} size={19} style={styles.marketActionButton} /></View>
  </Card.Content></Card>;
}

function MarketMetric({ color, icon, label, trend = 'none', value }: { color: string; icon?: string; label: string; trend?: 'up' | 'down' | 'none'; value: string }) {
  const trendIcon = trend === 'up' ? APP_ICONS.marketTrendUp : trend === 'down' ? APP_ICONS.marketTrendDown : undefined;
  return <View accessibilityLabel={`${label}: ${value}`} style={styles.marketMetric}><Text style={styles.marketMetricLabel}>{label}</Text><View style={styles.marketMetricValueRow}>{icon && <MaterialCommunityIcons color={color} name={icon as never} size={14} />}<Text style={[styles.marketMetricValue, { color }]}>{value}</Text>{trendIcon && <MaterialCommunityIcons color={colors.marketGreen} name={trendIcon as never} size={13} />}</View></View>;
}
