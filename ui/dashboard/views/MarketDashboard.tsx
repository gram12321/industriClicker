import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, SegmentedButtons, Switch, Text } from 'react-native-paper';
import type { Finance, Market, MarketAutomation, MarketTradeMultiplier } from '@/game';
import { RESOURCE_TYPES, getResource, getResourceIcon } from '@/game/resources/resourceConstants';
import { formatCurrency, formatNumber } from '@/utils';
import type { Inventory } from '@/game/inventory/inventory';
import { styles } from '@/ui/dashboard/dashboard.styles';
import { SectionHeading } from '../components/DashboardViewComponents';

export function MarketDashboard({ buyMarketResource, finance, inventory, market, sellMarketResource, setMarketAutomation }: {
  buyMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  sellMarketResource: (resourceType: (typeof RESOURCE_TYPES)[number], amount: number) => boolean;
  setMarketAutomation: (resourceType: (typeof RESOURCE_TYPES)[number], updates: Partial<MarketAutomation>) => boolean;
}) {
  const [multiplier, setMultiplier] = useState<MarketTradeMultiplier>(1);
  return <>
    <SectionHeading eyebrow="MARKET" title="Local exchange" subtitle="Trade with the local market. Global supply balances prices over time." />
    <SegmentedButtons value={String(multiplier)} onValueChange={(value) => setMultiplier(value === 'all' ? 'all' : Number(value) as 1 | 10 | 100)} buttons={[1, 10, 100].map((value) => ({ value: String(value), label: `×${value}` })).concat({ value: 'all', label: 'All' })} style={styles.marketMultiplier} />
    {RESOURCE_TYPES.map((resourceType) => {
      const local = market.getLocalEntry(resourceType); const global = market.getGlobalEntry(resourceType); const automation = market.getAutomation(resourceType);
      const localPrice = market.getLocalPrice(resourceType); const globalPrice = market.getGlobalPrice(resourceType);
      const buyAmount = multiplier === 'all' ? Math.floor(Math.min(local.supply, finance.getBalance() / localPrice)) : multiplier;
      const sellAmount = multiplier === 'all' ? inventory.getAmount(resourceType) : multiplier;
      const diffusion = market.getDiffusionInfo(resourceType);
      return <Card key={resourceType} mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
        <Text variant="titleMedium">{`${getResourceIcon(resourceType)} ${getResource(resourceType).name}`}</Text>
        <Text style={styles.cardDescription}>{`In stock ${formatNumber(inventory.getAmount(resourceType), { smartDecimals: true })} · Local ${formatCurrency(localPrice)} · Global ${formatCurrency(globalPrice)}`}</Text>
        <Text style={styles.salesAvailability}>{`Local ${formatNumber(local.supply, { smartDecimals: true })} Q${formatNumber(local.quality, { smartDecimals: true })} · Global ${formatNumber(global.supply, { smartDecimals: true })} Q${formatNumber(global.quality, { smartDecimals: true })} · ${diffusion.direction === 'none' ? 'Balanced' : `${diffusion.direction === 'to-local' ? 'Global → local' : 'Local → global'} ${formatNumber(diffusion.amount, { smartDecimals: true })}/min`}`}</Text>
        <View style={styles.salesActions}><Button disabled={buyAmount <= 0} mode="contained" onPress={() => buyMarketResource(resourceType, buyAmount)}>Buy {formatNumber(buyAmount)}</Button><Button disabled={sellAmount <= 0} mode="outlined" onPress={() => sellMarketResource(resourceType, sellAmount)}>Sell {formatNumber(sellAmount)}</Button></View>
        <View style={styles.marketAutomationRow}><Text style={styles.salesAvailability}>Autobuy</Text><Switch value={automation.autoBuyEnabled} onValueChange={(value) => { setMarketAutomation(resourceType, { autoBuyEnabled: value }); }} /><Text style={styles.salesAvailability}>Autosell</Text><Switch value={automation.autoSellEnabled} onValueChange={(value) => { setMarketAutomation(resourceType, { autoSellEnabled: value }); }} /></View>
      </Card.Content></Card>;
    })}
  </>;
}
