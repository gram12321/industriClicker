import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, IconButton, List, ProgressBar, Text } from 'react-native-paper';
import { colors } from '@/theme';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import { ECONOMY_PHASE_SCORES } from '@/game/finance';
import { RESEARCH_PROJECTS, type ResearchChainId, type ResearchLedger, type ResearchProjectDefinition, type ResearchProjectId } from '@/game/research';
import type { ResearchAvailability, SalesOrderAcquisitionStatus } from '@/game/core/stores';
import { calculateSalesOrderEstimatedWaitMinutes, calculateSalesOrderMarketComparison, getSalesCustomerRelationshipLabel, SALES_CUSTOMER_DOMAIN_PROFILES, SALES_CUSTOMER_TYPE_PROFILES, SALES_ORDER_MAXIMUM_GLOBAL_PREMIUM, SALES_ORDER_MINIMUM_GLOBAL_PREMIUM, type SalesOrders } from '@/game/sales';
import { calculateSalesOrderPrestige } from '@/game/prestige';
import { getResourceIcon } from '@/game/resources';
import { formatCurrency, formatNumber, getColorClass, normalizeToUnitInterval } from '@/utils';
import { APP_ICONS, ECONOMY_PHASE_ICONS, SALES_CUSTOMER_DOMAIN_ICONS, SALES_CUSTOMER_TYPE_ICONS } from '@/icons';
import { DetailRow, SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

const SALES_RESEARCH_CHAINS: readonly ResearchChainId[] = ['sales-capacity', 'sales-order-value-limit', 'sales-targeting', 'bid-value', 'relationship-management', 'sales-intelligence', 'local-market-network', 'market-diffusion-network'];

export function SalesView({ companyPrestige, customerPipelineProgress, currentGameTimeMs, economyPhase, fulfillSalesOrder, getResearchAvailability, inventory, market, maximumOpenOrders, rejectSalesOrder, research, salesOrderAcquisition, salesOrders, startResearch }: { companyPrestige: number; customerPipelineProgress: number; currentGameTimeMs: number; economyPhase: 'crash' | 'recession' | 'stable' | 'expansion' | 'boom'; fulfillSalesOrder: (id: string) => boolean; getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability; inventory: Inventory; market: Market; maximumOpenOrders: number; rejectSalesOrder: (id: string) => boolean; research: ResearchLedger; salesOrderAcquisition: SalesOrderAcquisitionStatus; salesOrders: SalesOrders; startResearch: (projectId: ResearchProjectId) => boolean }) {
  const [salesList, setSalesList] = useState<'open' | 'closed'>('open');
  const [closedFilter, setClosedFilter] = useState<'fulfilled' | 'rejected' | 'expired'>('fulfilled');
  const [salesResearchExpanded, setSalesResearchExpanded] = useState(false);
  const openOrders = salesOrders.getOfferedOrders();
  const closedOrders = salesOrders.getCompletedOrders();
  const count = openOrders.length;
  const isAtCapacity = count >= maximumOpenOrders;
  const { hasEligibleInventory } = salesOrderAcquisition;
  const acquisition = salesOrderAcquisition;
  const hasPipelineOverflow = customerPipelineProgress > 1;
  const pipelineOverflowProgress = customerPipelineProgress % 1;
  const orders = salesList === 'open' ? openOrders : closedOrders.filter((order) => order.status === closedFilter);
  const salesResearch = SALES_RESEARCH_CHAINS.map((chainId) => RESEARCH_PROJECTS.filter((project) => project.chainId === chainId).sort((left, right) => left.tier - right.tier).find((project) => !research.hasCompleted(project.id)) ?? null).filter((project): project is ResearchProjectDefinition => project !== null);
  const economyColor = getColorClass(ECONOMY_PHASE_SCORES[economyPhase]);

  return <>
    <SectionHeading eyebrow="SALES" title="Customer orders" subtitle="Inventory-ready orders are shaped by customer type, relationships, prestige, and the economy." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>CUSTOMER ACQUISITION</Text>
      {isAtCapacity ? <Text variant="titleMedium">Capacity full · 0% / min</Text> : hasEligibleInventory ? <Text variant="titleMedium"><Text style={{ color: getColorClass(acquisition.chance) }}>{`${formatNumber(acquisition.chance * 100, { smartDecimals: true })}%`}</Text>{` / min · ~${formatNumber(calculateSalesOrderEstimatedWaitMinutes(acquisition.chance), { smartDecimals: true })} min`}</Text> : <Text variant="titleMedium">Inventory needed for offers</Text>}
      <View style={localStyles.factorRow}><Factor description="Prestige discovery" icon={APP_ICONS.prestige} value={acquisition.prestigeDiscoveryMultiplier} /><Factor description="Open-order capacity" icon={APP_ICONS.openOrders} value={acquisition.pendingMultiplier} /><Factor color={economyColor} description={`${economyPhase} economy`} icon={ECONOMY_PHASE_ICONS[economyPhase]} value={acquisition.economyMultiplier} /></View>
      <View accessibilityLabel={`Customer pipeline ${formatNumber(Math.min(customerPipelineProgress, 1) * 100, { decimals: 0 })}%`} style={styles.customerPipelineProgressTrack}><ProgressBar accessible={false} color={getColorClass(Math.min(customerPipelineProgress, 1))} progress={Math.min(customerPipelineProgress, 1)} style={styles.customerPipelineProgressBar} />{hasPipelineOverflow && <View pointerEvents="none" style={[styles.customerPipelineOverflow, { width: `${pipelineOverflowProgress * 100}%` }]} />}</View>
    </Card.Content></Card>
    <DetailRow label="Open orders" value={`${formatNumber(count)} / ${formatNumber(maximumOpenOrders)}`} />
    <Card mode="contained" style={styles.featureCard}><List.Accordion expanded={salesResearchExpanded} left={(props) => <List.Icon {...props} icon={APP_ICONS.research} />} onPress={() => setSalesResearchExpanded((current) => !current)} title="Quick sales research" titleStyle={localStyles.quickResearchTitle} description={`${formatNumber(salesResearch.length)} next projects`}>
      {salesResearch.map((project) => { const availability = getResearchAvailability(project.id); const icon = project.chainId === 'bid-value' ? APP_ICONS.bid : project.chainId === 'sales-order-value-limit' ? 'scale-balance' : project.chainId === 'local-market-network' ? APP_ICONS.localMarket : project.chainId === 'market-diffusion-network' ? 'transit-connection-variant' : APP_ICONS.salesOrders; return <List.Item key={project.id} title={project.name} description={availability.startable ? `${formatCurrency(availability.cost)} · ready to start` : availability.unmetReasons[0] ?? 'Requirements not met'} left={(props) => <List.Icon {...props} icon={icon} />} right={() => <Button compact disabled={!availability.startable} onPress={() => startResearch(project.id)}>Start</Button>} />; })}
    </List.Accordion></Card>
    <View style={styles.salesFilters}><Button mode={salesList === 'open' ? 'contained' : 'outlined'} onPress={() => setSalesList('open')} style={styles.salesFilterButton}>{`Open (${count})`}</Button><Button mode={salesList === 'closed' ? 'contained' : 'outlined'} onPress={() => setSalesList('closed')} style={styles.salesFilterButton}>{`History (${closedOrders.length})`}</Button></View>
    {salesList === 'closed' && <View style={styles.salesFilters}>{(['fulfilled', 'rejected', 'expired'] as const).map((filter) => <Button key={filter} mode={closedFilter === filter ? 'contained' : 'outlined'} onPress={() => setClosedFilter(filter)} style={styles.salesFilterButton}>{`${filter[0].toUpperCase()}${filter.slice(1)}`}</Button>)}</View>}
    {orders.length === 0 ? <DetailRow label={salesList === 'open' ? 'Open orders' : 'Order history'} value={salesList === 'open' ? 'No requests yet' : `No ${closedFilter} orders yet`} /> : orders.map((order) => <OrderCard canFulfill={order.lines.every((line) => inventory.getAmount(line.resourceType) >= line.quantity)} companyPrestige={companyPrestige} currentGameTimeMs={currentGameTimeMs} key={order.id} market={market} order={order} rejectSalesOrder={rejectSalesOrder} salesList={salesList} salesOrders={salesOrders} fulfillSalesOrder={fulfillSalesOrder} />)}
  </>;
}

function OrderCard({ canFulfill, companyPrestige, currentGameTimeMs, fulfillSalesOrder, market, order, rejectSalesOrder, salesList, salesOrders }: { canFulfill: boolean; companyPrestige: number; currentGameTimeMs: number; fulfillSalesOrder: (id: string) => boolean; market: Market; order: ReturnType<SalesOrders['getOfferedOrders']>[number]; rejectSalesOrder: (id: string) => boolean; salesList: 'open' | 'closed'; salesOrders: SalesOrders }) {
  const comparison = salesList === 'open' ? calculateSalesOrderMarketComparison(order, (resourceType) => market.getLocalPrice(resourceType)) : null;
  const expiresInMinutes = Math.max(0, order.expiresAtGameTimeMs - currentGameTimeMs) / 60_000;
  const relationship = salesOrders.getCustomerState(order.customerId, currentGameTimeMs, companyPrestige).relationship;
  const relationshipColor = getColorClass(relationship);
  const comparisonColor = comparison && comparison.gain >= 0 ? colors.marketGreen : colors.error;
  const prestigeReward = calculateSalesOrderPrestige(order.reward, order.premiumPercent);
  return <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
    <View style={styles.salesContractHeader}><View><Text variant="titleMedium">{order.customerName}</Text><View style={localStyles.iconRow}><MaterialCommunityIcons color={colors.muted} name={SALES_CUSTOMER_DOMAIN_ICONS[order.customerDomain] as never} size={14} /><Text style={styles.cardDescription}>{SALES_CUSTOMER_DOMAIN_PROFILES[order.customerDomain].label}</Text><MaterialCommunityIcons color={colors.muted} name={SALES_CUSTOMER_TYPE_ICONS[order.customerType] as never} size={14} /><Text style={styles.cardDescription}>{SALES_CUSTOMER_TYPE_PROFILES[order.customerType].label}</Text></View></View><Text style={styles.salesReward}>{formatCurrency(order.reward)}</Text></View>
    {order.lines.map((line, index) => { const bidColor = getColorClass(normalizeToUnitInterval(line.premiumPercent, SALES_ORDER_MINIMUM_GLOBAL_PREMIUM * 100, SALES_ORDER_MAXIMUM_GLOBAL_PREMIUM * 100)); return <View key={line.resourceType} style={localStyles.iconRow}><MaterialCommunityIcons color={colors.muted} name={getResourceIcon(line.resourceType) as never} size={15} /><Text style={styles.salesAvailability}>{formatNumber(line.quantity)}</Text><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.globalMarket} size={15} /><Text style={styles.salesAvailability}>{`${formatNumber(line.marketVolumeMultiplier * 100, { decimals: 0 })}% volume`}</Text><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.bid} size={15} /><Text style={styles.salesAvailability}><Text style={{ color: bidColor }}>{formatCurrency(line.bidUnitPrice)}</Text>{` / unit (`}<Text style={{ color: bidColor }}>{`${line.premiumPercent >= 0 ? '+' : ''}${formatNumber(line.premiumPercent, { smartDecimals: true })}%`}</Text>{')'}</Text>{comparison && index === 0 && <><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.localMarket} size={15} /><Text style={localStyles.localComparisonText}>{`${comparison.gain >= 0 ? '+' : ''}${formatCurrency(comparison.gain)} (${comparison.gainPercent >= 0 ? '+' : ''}${formatNumber(comparison.gainPercent, { smartDecimals: true })}%)`}</Text></>}</View>; })}
    {salesList === 'open' && <><View style={localStyles.iconRow}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.relationship} size={15} /><Text style={styles.salesComparison}><Text style={{ color: relationshipColor }}>{formatNumber(relationship * 100, { smartDecimals: true })}</Text>{` · ${getSalesCustomerRelationshipLabel(relationship)} · ${formatNumber(expiresInMinutes, { smartDecimals: true })} min`}</Text><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.prestige} size={15} /><Text style={styles.salesComparison}>{`+${formatNumber(prestigeReward, { smartDecimals: true })}`}</Text></View><IconButton accessibilityLabel={`Reject order for ${order.customerName}`} icon={APP_ICONS.close} iconColor={colors.error} onPress={() => rejectSalesOrder(order.id)} size={20} style={styles.salesRejectButton} />{!canFulfill && <Text style={styles.salesComparisonNegative}>Insufficient inventory</Text>}<View style={styles.salesActions}><Button accessibilityLabel={`Fulfill order for ${order.customerName}`} disabled={!canFulfill} mode="contained" onPress={() => fulfillSalesOrder(order.id)}>Fulfil order</Button></View></>}
    {salesList === 'closed' && <Text style={styles.salesAvailability}>{order.status === 'fulfilled' ? 'Fulfilled' : order.status === 'expired' ? 'Expired — relationship reduced' : 'Rejected'}</Text>}
  </Card.Content></Card>;
}

function Factor({ color = colors.muted, description, icon, value }: { color?: string; description: string; icon: string; value: number }) { return <View accessibilityLabel={`${description}: ${formatNumber(value * 100, { smartDecimals: true })}%`} style={localStyles.factor}><MaterialCommunityIcons color={colors.muted} name={icon as never} size={14} /><Text style={[styles.salesAvailability, { color }]}>{`${formatNumber(value * 100, { smartDecimals: true })}%`}</Text></View>; }

const localStyles = StyleSheet.create({
  factor: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  factorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  localComparisonText: { fontSize: 12, fontWeight: '700' },
  quickResearchTitle: { fontSize: 15, fontWeight: '700' },
});
