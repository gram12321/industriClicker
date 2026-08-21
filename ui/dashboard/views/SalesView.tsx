import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, List, ProgressBar, Text } from 'react-native-paper';
import { colors } from '@/theme';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import { getResource } from '@/game/resources';
import { ECONOMY_PHASE_SCORES } from '@/game/finance';
import { RESEARCH_PROJECTS, type ResearchChainId, type ResearchLedger, type ResearchProjectDefinition, type ResearchProjectId } from '@/game/research';
import type { ResearchAvailability, SalesOrderAcquisitionStatus } from '@/game/core/stores';
import { calculateSalesOrderEstimatedWaitMinutes, calculateSalesOrderMarketComparison, getSalesCustomerRelationshipLabel, SALES_CUSTOMER_DOMAIN_PROFILES, SALES_CUSTOMER_TYPE_PROFILES, SALES_ORDER_BID_BONUS_COLOR_MAX_PERCENT, SALES_ORDER_BID_BONUS_COLOR_MIN_PERCENT, SALES_ORDER_LOCAL_COMPARISON_COLOR_MAX_PERCENT, SALES_ORDER_LOCAL_COMPARISON_COLOR_MIN_PERCENT, SALES_ORDER_QUALITY_BONUS_COLOR_MAX_PERCENT, SALES_ORDER_QUALITY_BONUS_COLOR_MIN_PERCENT, type SalesOrders } from '@/game/sales';
import { calculateSalesOrderPrestige, PRESTIGE_SALES_ORDER_PRESENTATION_SCALE } from '@/game/prestige';
import { formatCurrency, formatNumber, getColorClass, normalizeToUnitInterval } from '@/utils';
import { APP_ICONS, ECONOMY_PHASE_ICONS, SALES_CUSTOMER_DOMAIN_ICONS, SALES_CUSTOMER_TYPE_ICONS } from '@/icons';
import { DetailRow, SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { TooltipIcon, TooltipMaterialIcon, TooltipResourceIcon } from '@/ui/dashboard/components/IconTooltip';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

const SALES_RESEARCH_CHAINS: readonly ResearchChainId[] = ['sales-capacity', 'sales-order-value-limit', 'sales-targeting', 'bid-value', 'relationship-management', 'sales-intelligence', 'local-market-network', 'market-diffusion-network'];

export function SalesView({ companyPrestige, customerPipelineProgress, currentGameTimeMs, economyPhase, fulfillSalesOrder, getResearchAvailability, inventory, market, maximumOpenOrders, onOpenCustomer, onOpenCustomerType, rejectSalesOrder, research, salesOrderAcquisition, salesOrders, startResearch }: { companyPrestige: number; customerPipelineProgress: number; currentGameTimeMs: number; economyPhase: 'crash' | 'recession' | 'stable' | 'expansion' | 'boom'; fulfillSalesOrder: (id: string) => boolean; getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability; inventory: Inventory; market: Market; maximumOpenOrders: number; onOpenCustomer: (customerId: string) => void; onOpenCustomerType: (customerType: ReturnType<SalesOrders['getOfferedOrders']>[number]['customerType']) => void; rejectSalesOrder: (id: string) => boolean; research: ResearchLedger; salesOrderAcquisition: SalesOrderAcquisitionStatus; salesOrders: SalesOrders; startResearch: (projectId: ResearchProjectId) => boolean }) {
  const [salesList, setSalesList] = useState<'open' | 'closed'>('open');
  const [closedFilter, setClosedFilter] = useState<'fulfilled' | 'rejected' | 'expired'>('fulfilled');
  const [salesResearchExpanded, setSalesResearchExpanded] = useState(false);
  const openOrders = salesOrders.getOfferedOrders();
  const closedOrders = salesOrders.getCompletedOrders();
  const count = openOrders.length;
  const isAtCapacity = count >= maximumOpenOrders;
  const { hasOfferableResources } = salesOrderAcquisition;
  const acquisition = salesOrderAcquisition;
  const hasPipelineOverflow = customerPipelineProgress > 1;
  const pipelineOverflowProgress = customerPipelineProgress % 1;
  const orders = salesList === 'open' ? openOrders : closedOrders.filter((order) => order.status === closedFilter);
  const salesResearch = SALES_RESEARCH_CHAINS.map((chainId) => RESEARCH_PROJECTS.filter((project) => project.chainId === chainId).sort((left, right) => left.tier - right.tier).find((project) => !research.hasCompleted(project.id)) ?? null).filter((project): project is ResearchProjectDefinition => project !== null);
  const economyColor = getColorClass(ECONOMY_PHASE_SCORES[economyPhase]);

  return <>
    <SectionHeading eyebrow="SALES" title="Customer orders" subtitle="Orders are shaped by customer demand, inventory coverage, production, relationships, prestige, and the economy." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>CUSTOMER ACQUISITION</Text>
      {isAtCapacity ? <Text variant="titleMedium">Capacity full · 0 orders / min</Text> : hasOfferableResources ? <TooltipIcon label="Customer acquisition rate = base × prestige × capacity × economy × inventory readiness."><Text variant="titleMedium"><Text style={{ color: getColorClass(Math.min(1, acquisition.rate)) }}>{formatNumber(acquisition.rate, { smartDecimals: true })}</Text>{` orders / min · ~${formatNumber(calculateSalesOrderEstimatedWaitMinutes(acquisition.rate), { smartDecimals: true })} min`}</Text></TooltipIcon> : <Text variant="titleMedium">No resources available for offers</Text>}
      <View style={localStyles.factorRow}><Factor detail={`Base (1%) + [Prestige ${formatNumber(companyPrestige, { smartDecimals: true })} ÷ (Prestige ${formatNumber(companyPrestige, { smartDecimals: true })} + Scale constant (120))] × Max discovery (999%) = ${formatNumber(acquisition.prestigeDiscoveryMultiplier * 100, { smartDecimals: true })}%`} description="Prestige discovery" icon={APP_ICONS.prestige} value={acquisition.prestigeDiscoveryMultiplier} /><Factor detail={`Open-order capacity: ${count} of ${maximumOpenOrders} slots are occupied. Each open order removes 13 percentage points: 100% − (${count} × 13%) = ${formatNumber(acquisition.pendingMultiplier * 100, { smartDecimals: true })}%.`} description="Open-order capacity" icon={APP_ICONS.openOrders} value={acquisition.pendingMultiplier} /><Factor color={economyColor} description={`${economyPhase} economy`} icon={ECONOMY_PHASE_ICONS[economyPhase]} value={acquisition.economyMultiplier} /><Factor detail={`Inventory readiness compares inventory market value ${formatCurrency(acquisition.inventoryValue)} with the maximum order value ${formatCurrency(acquisition.maximumOrderValue)}. Formula: 1% + √(inventory value ÷ maximum order value) = ${formatNumber(acquisition.inventoryReadinessMultiplier * 100, { smartDecimals: true })}%.`} description="Inventory readiness" icon={APP_ICONS.package} value={acquisition.inventoryReadinessMultiplier} /></View>
      <View accessibilityLabel={`Customer pipeline ${formatNumber(Math.min(customerPipelineProgress, 1) * 100, { decimals: 0 })}%`} style={styles.customerPipelineProgressTrack}><ProgressBar accessible={false} color={getColorClass(Math.min(customerPipelineProgress, 1))} progress={Math.min(customerPipelineProgress, 1)} style={styles.customerPipelineProgressBar} />{hasPipelineOverflow && <View pointerEvents="none" style={[styles.customerPipelineOverflow, { width: `${pipelineOverflowProgress * 100}%` }]} />}</View>
    </Card.Content></Card>
    <DetailRow label="Open orders" value={`${formatNumber(count)} / ${formatNumber(maximumOpenOrders)}`} />
    <Card mode="contained" style={styles.featureCard}><List.Accordion expanded={salesResearchExpanded} left={(props) => <List.Icon {...props} icon={APP_ICONS.research} />} onPress={() => setSalesResearchExpanded((current) => !current)} title="Quick sales research" titleStyle={localStyles.quickResearchTitle} description={`${formatNumber(salesResearch.length)} next projects`}>
      {salesResearch.map((project) => { const availability = getResearchAvailability(project.id); const icon = project.chainId === 'bid-value' ? APP_ICONS.bid : project.chainId === 'sales-order-value-limit' ? 'scale-balance' : project.chainId === 'local-market-network' ? APP_ICONS.localMarket : project.chainId === 'market-diffusion-network' ? 'transit-connection-variant' : APP_ICONS.salesOrders; return <List.Item key={project.id} title={project.name} description={availability.startable ? `${formatCurrency(availability.cost)} · ready to start` : availability.unmetReasons[0] ?? 'Requirements not met'} left={(props) => <List.Icon {...props} icon={icon} />} right={() => <Button compact disabled={!availability.startable} onPress={() => startResearch(project.id)}>Start</Button>} />; })}
    </List.Accordion></Card>
    <View style={styles.salesFilters}><Button mode={salesList === 'open' ? 'contained' : 'outlined'} onPress={() => setSalesList('open')} style={styles.salesFilterButton}>{`Open (${count})`}</Button><Button mode={salesList === 'closed' ? 'contained' : 'outlined'} onPress={() => setSalesList('closed')} style={styles.salesFilterButton}>{`History (${closedOrders.length})`}</Button></View>
    {salesList === 'closed' && <View style={styles.salesFilters}>{(['fulfilled', 'rejected', 'expired'] as const).map((filter) => <Button key={filter} mode={closedFilter === filter ? 'contained' : 'outlined'} onPress={() => setClosedFilter(filter)} style={styles.salesFilterButton}>{`${filter[0].toUpperCase()}${filter.slice(1)}`}</Button>)}</View>}
    {orders.length === 0 ? <DetailRow label={salesList === 'open' ? 'Open orders' : 'Order history'} value={salesList === 'open' ? 'No requests yet' : `No ${closedFilter} orders yet`} /> : orders.map((order) => <OrderCard canFulfill={order.lines.every((line) => inventory.getAmount(line.resourceType) >= line.quantity)} companyPrestige={companyPrestige} currentGameTimeMs={currentGameTimeMs} inventory={inventory} key={order.id} market={market} onOpenCustomer={onOpenCustomer} onOpenCustomerType={onOpenCustomerType} order={order} rejectSalesOrder={rejectSalesOrder} salesList={salesList} salesOrders={salesOrders} fulfillSalesOrder={fulfillSalesOrder} />)}
  </>;
}

function OrderCard({ canFulfill, companyPrestige, currentGameTimeMs, fulfillSalesOrder, inventory, market, onOpenCustomer, onOpenCustomerType, order, rejectSalesOrder, salesList, salesOrders }: { canFulfill: boolean; companyPrestige: number; currentGameTimeMs: number; fulfillSalesOrder: (id: string) => boolean; inventory: Inventory; market: Market; onOpenCustomer: (customerId: string) => void; onOpenCustomerType: (customerType: ReturnType<SalesOrders['getOfferedOrders']>[number]['customerType']) => void; order: ReturnType<SalesOrders['getOfferedOrders']>[number]; rejectSalesOrder: (id: string) => boolean; salesList: 'open' | 'closed'; salesOrders: SalesOrders }) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const comparison = salesList === 'open' ? calculateSalesOrderMarketComparison(order, (resourceType) => market.getLocalSalePrice(resourceType, inventory.getQuality(resourceType))) : null;
  const expiresInMinutes = Math.max(0, order.expiresAtGameTimeMs - currentGameTimeMs) / 60_000;
  const relationship = salesOrders.getCustomerState(order.customerId, currentGameTimeMs, companyPrestige).relationship;
  const relationshipColor = getColorClass(relationship);
  const comparisonColor = comparison ? getColorClass(normalizeToUnitInterval(comparison.gainPercent, SALES_ORDER_LOCAL_COMPARISON_COLOR_MIN_PERCENT, SALES_ORDER_LOCAL_COMPARISON_COLOR_MAX_PERCENT)) : colors.muted;
  const prestigeReward = calculateSalesOrderPrestige(order.reward, order.premiumPercent);
  const prestigeRewardColor = getColorClass(normalizeToUnitInterval(prestigeReward, 0, PRESTIGE_SALES_ORDER_PRESENTATION_SCALE));
  const bidValue = order.lines.reduce((sum, line) => sum + line.quantity * line.bidUnitPrice, 0);
  const bidBonus = bidValue - order.globalReferenceValue;
  const qualityBonus = order.reward - bidValue;
  const bidBonusColor = getColorClass(normalizeToUnitInterval(order.premiumPercent, SALES_ORDER_BID_BONUS_COLOR_MIN_PERCENT, SALES_ORDER_BID_BONUS_COLOR_MAX_PERCENT));
  const qualityBonusPercent = bidValue > 0 ? qualityBonus / bidValue * 100 : 0;
  const qualityBonusColor = getColorClass(normalizeToUnitInterval(qualityBonusPercent, SALES_ORDER_QUALITY_BONUS_COLOR_MIN_PERCENT, SALES_ORDER_QUALITY_BONUS_COLOR_MAX_PERCENT));
  return <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
    <View style={styles.salesContractHeader}><View><Pressable accessibilityLabel={`Open ${order.customerName} in the customer directory`} accessibilityRole="button" onPress={() => onOpenCustomer(order.customerId)}><Text variant="titleMedium" style={localStyles.referenceLink}>{order.customerName}</Text></Pressable><View style={localStyles.iconRow}><TooltipMaterialIcon color={colors.muted} label={SALES_CUSTOMER_DOMAIN_PROFILES[order.customerDomain].label} name={SALES_CUSTOMER_DOMAIN_ICONS[order.customerDomain]} size={14} /><Text style={styles.cardDescription}>{SALES_CUSTOMER_DOMAIN_PROFILES[order.customerDomain].label}</Text><TooltipMaterialIcon color={colors.muted} label={SALES_CUSTOMER_TYPE_PROFILES[order.customerType].label} name={SALES_CUSTOMER_TYPE_ICONS[order.customerType]} size={14} /><Pressable accessibilityLabel={`Open ${SALES_CUSTOMER_TYPE_PROFILES[order.customerType].label} parameters`} accessibilityRole="button" onPress={() => onOpenCustomerType(order.customerType)}><Text style={[styles.cardDescription, localStyles.referenceLink]}>{SALES_CUSTOMER_TYPE_PROFILES[order.customerType].label}</Text></Pressable></View>{salesList === 'open' && <View style={localStyles.relationshipMeta}><TooltipMaterialIcon color={colors.muted} label="Relationship" name={APP_ICONS.relationship} size={15} /><Text style={[styles.salesComparison, { color: relationshipColor }]}>{getSalesCustomerRelationshipLabel(relationship)}</Text><TooltipMaterialIcon color={colors.muted} label="Prestige" name={APP_ICONS.prestige} size={15} /><Text style={[styles.salesComparison, { color: prestigeRewardColor }]}>{`+${formatNumber(prestigeReward, { smartDecimals: true })}`}</Text></View>}</View><View><Text style={styles.salesReward}>{formatCurrency(order.reward)}</Text><Text style={localStyles.payoutLabel}>TOTAL PAYOUT</Text></View></View>
    <View style={localStyles.offerSection}>
      <Text style={localStyles.offerLabel}>RESOURCES REQUESTED</Text>
      <View style={localStyles.resourceList}>{order.lines.map((line) => <View key={line.resourceType} style={localStyles.resourcePill}><TooltipResourceIcon resourceType={line.resourceType} /><Text style={localStyles.resourcePillText}>{`${formatNumber(line.quantity)} ${getResource(line.resourceType).name}`}</Text></View>)}</View>
    </View>
    <View style={localStyles.offerSection}>
      <Text style={localStyles.offerLabel}>OFFER CALCULATION</Text>
      <View style={localStyles.calculationRow}><OfferMetric icon={APP_ICONS.globalMarket} label="Global reference" value={formatCurrency(order.globalReferenceValue)} /><OfferMetric color={bidBonusColor} icon={APP_ICONS.bid} label="Bid bonus" value={`${bidBonus >= 0 ? '+' : ''}${formatCurrency(bidBonus)} (${order.premiumPercent >= 0 ? '+' : ''}${formatNumber(order.premiumPercent, { smartDecimals: true })}%)`} /><OfferMetric color={qualityBonusColor} icon={APP_ICONS.quality} label="Quality bonus" value={`${qualityBonus >= 0 ? '+' : ''}${formatCurrency(qualityBonus)} (${qualityBonusPercent >= 0 ? '+' : ''}${formatNumber(qualityBonusPercent, { smartDecimals: true })}%)`} /></View>
    </View>
    {comparison && <View style={localStyles.marketComparison}><View style={localStyles.iconRow}><TooltipMaterialIcon color={colors.muted} label="Local market" name={APP_ICONS.localMarket} size={15} /><Text style={localStyles.marketComparisonLabel}>Compared with selling locally</Text></View><View style={localStyles.marketComparisonValues}><Text style={localStyles.marketComparisonBase}>{formatCurrency(comparison.normalSaleValue)}</Text><Text style={localStyles.marketComparisonArrow}>→</Text><Text style={localStyles.marketComparisonBase}>{formatCurrency(order.reward)}</Text><Text style={[localStyles.marketComparisonGain, { color: comparisonColor }]}>{`(${comparison.gainPercent >= 0 ? '+' : ''}${formatNumber(comparison.gainPercent, { smartDecimals: true })}%)`}</Text></View></View>}
    <Button compact icon={detailsExpanded ? 'chevron-up' : 'chevron-down'} mode="text" onPress={() => setDetailsExpanded((current) => !current)} style={localStyles.detailsButton}>{detailsExpanded ? 'Hide offer details' : 'View offer details'}</Button>
    {detailsExpanded && <View style={localStyles.detailsContent}>{order.lines.map((line) => { const bidColor = getColorClass(normalizeToUnitInterval(line.premiumPercent, SALES_ORDER_BID_BONUS_COLOR_MIN_PERCENT, SALES_ORDER_BID_BONUS_COLOR_MAX_PERCENT)); const qualityMultiplier = line.qualityMultiplier ?? 1; const qualityAdjustedUnitPrice = line.bidUnitPrice * qualityMultiplier; return <View key={line.resourceType} style={localStyles.lineDetail}><View style={localStyles.lineDetailHeader}><Text variant="bodyLarge"><TooltipResourceIcon resourceType={line.resourceType} /> {`${formatNumber(line.quantity)} ${getResource(line.resourceType).name}`}</Text><Text style={[localStyles.lineDetailReward, { color: bidColor }]}>{formatCurrency(line.reward)}</Text></View><Text style={styles.salesAvailability}>{`${formatCurrency(line.globalReferenceUnitPrice)} global + ${line.premiumPercent >= 0 ? '+' : ''}${formatNumber(line.premiumPercent, { smartDecimals: true })}% bid = ${formatCurrency(line.bidUnitPrice)} / unit`}</Text><Text style={styles.salesAvailability}>{`Locked quality Q${formatNumber(qualityMultiplier, { decimals: 2, smartDecimals: true, adaptiveNearInteger: true })} → ${formatCurrency(qualityAdjustedUnitPrice)} / unit · ${formatNumber(line.marketVolumeMultiplier * 100, { decimals: 0 })}% market volume`}</Text></View>; })}</View>}
    {salesList === 'open' && <><IconButton accessibilityLabel={`Reject order for ${order.customerName}`} icon={APP_ICONS.close} iconColor={colors.error} onPress={() => rejectSalesOrder(order.id)} size={20} style={styles.salesRejectButton} />{!canFulfill && <Text style={styles.salesComparisonNegative}>Insufficient inventory</Text>}<View style={styles.salesActions}><Text style={localStyles.expiry}>Expires in {formatNumber(expiresInMinutes, { smartDecimals: true })} min</Text><Button accessibilityLabel={`Fulfill order for ${order.customerName}`} disabled={!canFulfill} mode="contained" onPress={() => fulfillSalesOrder(order.id)}>Fulfil order</Button></View></>}
    {salesList === 'closed' && <Text style={styles.salesAvailability}>{order.status === 'fulfilled' ? 'Fulfilled' : order.status === 'expired' ? 'Expired — relationship reduced' : 'Rejected'}</Text>}
  </Card.Content></Card>;
}

function Factor({ color = colors.muted, description, detail, icon, value }: { color?: string; description: string; detail?: string; icon: string; value: number }) { return <View accessibilityLabel={`${description}: ${formatNumber(value * 100, { smartDecimals: true })}%`} style={localStyles.factor}><TooltipMaterialIcon color={colors.muted} label={description} name={icon} size={14} /><TooltipIcon label={detail ?? `${description}: ${formatNumber(value * 100, { smartDecimals: true })}%`}><Text style={[styles.salesAvailability, { color }]}>{`${formatNumber(value * 100, { smartDecimals: true })}%`}</Text></TooltipIcon></View>; }

function OfferMetric({ color = colors.charcoal, icon, label, value }: { color?: string; icon: string; label: string; value: string }) { return <View style={localStyles.offerMetric}><View style={localStyles.iconRow}><TooltipMaterialIcon color={colors.muted} label={label} name={icon} size={14} /><Text style={localStyles.offerMetricLabel}>{label}</Text></View><Text style={[localStyles.offerMetricValue, { color }]}>{value}</Text></View>; }

const localStyles = StyleSheet.create({
  calculationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  factor: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  factorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  detailsButton: { alignSelf: 'flex-start', marginLeft: -8 },
  detailsContent: { borderTopColor: '#D5DEDA', borderTopWidth: 1, gap: 8, paddingTop: 8 },
  expiry: { color: colors.muted, fontSize: 12 },
  lineDetail: { gap: 3 },
  lineDetailHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  lineDetailReward: { fontSize: 14, fontWeight: '700' },
  marketComparison: { borderLeftColor: '#D5DEDA', borderLeftWidth: 2, gap: 4, paddingLeft: 8 },
  marketComparisonBase: { color: colors.muted, fontSize: 12 },
  marketComparisonGain: { fontSize: 14, fontWeight: '700' },
  marketComparisonLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  marketComparisonArrow: { color: colors.muted, fontSize: 12 },
  marketComparisonValues: { alignItems: 'baseline', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  offerLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  offerMetric: { flexBasis: '30%', flexGrow: 1, gap: 3, minWidth: 88 },
  offerMetricLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  offerMetricValue: { fontSize: 12, fontWeight: '700' },
  offerSection: { gap: 5 },
  payoutLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.7, textAlign: 'right' },
  quickResearchTitle: { fontSize: 15, fontWeight: '700' },
  resourceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  resourcePill: { alignItems: 'center', backgroundColor: colors.softBackground, borderRadius: 10, flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 5 },
  resourcePillText: { color: colors.charcoal, fontSize: 12, fontWeight: '700' },
  referenceLink: { color: colors.primary, textDecorationLine: 'underline' },
  relationshipMeta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});
