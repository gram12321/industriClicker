import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, IconButton, ProgressBar, Text } from 'react-native-paper';
import { colors } from '@/theme';
import type { Inventory } from '@/game/inventory/inventory';
import { calculateSalesContractEstimatedWaitMinutes, calculateSalesContractOfferChance, type SalesContracts } from '@/game/sales/salesContracts';
import { getResourceIcon } from '@/game/resources/resourceIcons';
import { getResource } from '@/game/resources/resourcesRegistry';
import { formatCurrency, formatDate, formatNumber } from '@/utils';
import { styles } from '@/ui/dashboard/dashboard.styles';
import { APP_ICONS } from '@/icons';
import { PlaceholderRow, SectionHeading } from '../components/DashboardViewComponents';

export function SalesDashboard({ customerPipelineProgress, fulfillSalesContract, inventory, rejectSalesContract, salesContracts }: { customerPipelineProgress: number; fulfillSalesContract: (id: string) => boolean; inventory: Inventory; rejectSalesContract: (id: string) => boolean; salesContracts: SalesContracts }) {
  const [salesList, setSalesList] = useState<'open' | 'closed'>('open');
  const [closedFilter, setClosedFilter] = useState<'completed' | 'rejected'>('completed');
  const openContracts = salesContracts.getOfferedContracts();
  const closedContracts = salesContracts.getCompletedContracts();
  const count = openContracts.length;
  const offerChance = calculateSalesContractOfferChance(count);
  const contracts = salesList === 'open' ? openContracts : closedContracts.filter((contract) => closedFilter === 'completed' ? contract.status === 'fulfilled' : contract.status === 'rejected');
  return <>
    <SectionHeading eyebrow="SALES" title="Customer contracts" subtitle="Unfulfilled contracts reduce the chance of a new customer request." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>CUSTOMER PIPELINE</Text><Text variant="titleMedium">{`${formatNumber(offerChance * 100, { smartDecimals: true })}% chance per minute`}</Text><Text style={styles.cardDescription}>{`Estimated next customer: ${formatNumber(calculateSalesContractEstimatedWaitMinutes(count), { smartDecimals: true })} minutes · ${formatNumber(count)} unfulfilled`}</Text><ProgressBar accessibilityLabel="Estimated progress toward the next customer" color={colors.primary} progress={customerPipelineProgress} style={styles.customerPipelineProgressBar} /><Text style={styles.salesAvailability}>{`${formatNumber(customerPipelineProgress * 100, { decimals: 0 })}% toward the estimated next customer`}</Text></Card.Content></Card>
    <View style={styles.salesFilters}><Button mode={salesList === 'open' ? 'contained' : 'outlined'} onPress={() => setSalesList('open')} style={styles.salesFilterButton}>{`Open (${count})`}</Button><Button mode={salesList === 'closed' ? 'contained' : 'outlined'} onPress={() => setSalesList('closed')} style={styles.salesFilterButton}>{`Closed (${closedContracts.length})`}</Button></View>
    {salesList === 'closed' && <View style={styles.salesFilters}><Button mode={closedFilter === 'completed' ? 'contained' : 'outlined'} onPress={() => setClosedFilter('completed')} style={styles.salesFilterButton}>{`Completed (${closedContracts.filter((c) => c.status === 'fulfilled').length})`}</Button><Button mode={closedFilter === 'rejected' ? 'contained' : 'outlined'} onPress={() => setClosedFilter('rejected')} style={styles.salesFilterButton}>{`Rejected (${closedContracts.filter((c) => c.status === 'rejected').length})`}</Button></View>}
    {contracts.length === 0 ? <PlaceholderRow label={salesList === 'open' ? 'Open contracts' : `${closedFilter[0].toUpperCase()}${closedFilter.slice(1)} contracts`} value={salesList === 'open' ? 'No requests yet' : `No ${closedFilter} contracts yet`} /> : contracts.map((contract) => { const resource = getResource(contract.resourceType); const available = inventory.getAmount(contract.resourceType); const canFulfill = available >= contract.quantity; return <Card key={contract.id} mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>{salesList === 'open' && <IconButton accessibilityLabel={`Reject contract for ${contract.customerName}`} icon={APP_ICONS.close} iconColor={colors.error} onPress={() => rejectSalesContract(contract.id)} size={20} style={styles.salesRejectButton} />}<View style={styles.salesContractHeader}><View><Text variant="titleMedium">{contract.customerName}</Text><Text style={styles.cardDescription}>{`${getResourceIcon(contract.resourceType)} ${resource.name} · ${formatNumber(contract.quantity)}`}</Text></View><Text style={styles.salesReward}>{formatCurrency(contract.reward)}</Text></View>{salesList === 'open' ? <><Text style={styles.salesAvailability}>{canFulfill ? `In stock: ${formatNumber(available)}` : `Needs ${formatNumber(contract.quantity)} · In stock: ${formatNumber(available)}`}</Text><View style={styles.salesActions}><Button accessibilityLabel={`Fulfill contract for ${contract.customerName}`} disabled={!canFulfill} mode="contained" onPress={() => fulfillSalesContract(contract.id)}>Fulfill</Button></View></> : <Text style={styles.salesAvailability}>{`${contract.status === 'fulfilled' ? 'Completed' : 'Rejected'} ${formatDate(new Date(contract.fulfilledAt ?? contract.rejectedAt ?? contract.offeredAt), true)}`}</Text>}</Card.Content></Card>; })}
  </>;
}
