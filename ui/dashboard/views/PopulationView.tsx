import { StyleSheet, View } from 'react-native';
import { Card, Surface, Text } from 'react-native-paper';
import type { FacilityCollection } from '@/game/facilities';
import type { PopulationLedger } from '@/game/population';
import type { Market } from '@/game/market';
import { calculatePopulationAffordability, calculatePopulationDemandBaskets, calculatePopulationExpenditureBreakdown, calculatePopulationIncomeProjection, calculatePopulationLocalPurchaseCost, getPopulationDemand, getResource } from '@/game';
import { colors } from '@/theme';
import { formatCurrency, formatNumber } from '@/utils';
import { SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { TooltipResourceIcon } from '@/ui/dashboard/components/IconTooltip';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { PopulationExpenditureBreakdownChart } from './population/PopulationExpenditureBreakdownChart';

export function PopulationView({ facilities, market, population }: { facilities: FacilityCollection; market: Market; population: PopulationLedger }) {
  const demand = getPopulationDemand(facilities);
  const projectedCost = calculatePopulationLocalPurchaseCost(demand, (resourceType) => market.getLocalPrice(resourceType));
  const incomeProjection = calculatePopulationIncomeProjection(facilities, projectedCost.total);
  const affordability = calculatePopulationAffordability(population.getHouseholdBalance(), projectedCost.total);
  const demandBaskets = calculatePopulationDemandBaskets(demand);
  const expenditureBreakdown = calculatePopulationExpenditureBreakdown(demand, projectedCost);
  const currentMinuteConsumption = population.getCurrentMinuteConsumption();

  return <>
    <SectionHeading
      eyebrow="POPULATION"
      title="Population demand"
      subtitle="Workers form the population; their paid wages fund Local Market purchases."
    />
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>WORKFORCE-BASED POPULATION</Text>
        <View style={localStyles.populationSummary}>
          <View>
            <Text variant="titleLarge">{formatNumber(demand.population)}</Text>
            <Text style={styles.cardDescription}>Total population</Text>
          </View>
          <Text style={styles.cardDescription}>Every assigned facility worker counts as one population unit. Workers in training remain part of the population.</Text>
        </View>
      </Card.Content>
    </Card>
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>EXPENDITURE BREAKDOWN</Text>
        <Text variant="titleMedium">Population spending by domain</Text>
        <Text style={styles.cardDescription}>Projected Local Market purchase cost for the whole population, grouped by the current resource domains. It reacts to current prices and supply.</Text>
        <PopulationExpenditureBreakdownChart entries={expenditureBreakdown} />
      </Card.Content>
    </Card>
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>BASE CONSUMPTION</Text>
        <Text variant="titleMedium">Target and actual purchases</Text>
        <Text style={styles.cardDescription}>The target is the configured whole-population basket per game-minute. Actual is the fulfilled Local Market amount bought so far in the current game minute.</Text>
        <View style={localStyles.demandTable}>
          {demandBaskets.map((basket) => <View key={basket.id} style={localStyles.demandBasket}>
            <Text style={styles.cardKicker}>{basket.label} · {formatNumber(basket.totalConsumption, { smartDecimals: true })} target / {formatNumber(basket.resourceTypes.reduce((total, resourceType) => total + currentMinuteConsumption[resourceType], 0), { smartDecimals: true })} actual</Text>
            {!basket.hasDirectConsumption ? <Surface elevation={0} style={localStyles.emptyState}>
              <Text style={styles.cardDescription}>No direct household consumption is configured for this industrial domain.</Text>
            </Surface> : <>
              <View style={localStyles.tableHeader}>
                <Text style={[localStyles.tableHeaderText, localStyles.resourceHeader]}>Resource</Text>
                <Text style={localStyles.tableHeaderText}>Per pop</Text>
                <Text style={localStyles.tableHeaderText}>Target</Text>
                <Text style={localStyles.tableHeaderText}>Actual</Text>
              </View>
              {basket.resourceTypes.filter((resourceType) => demand.baseConsumptionPerPerson[resourceType] > 0).map((resourceType) => <Surface key={resourceType} elevation={0} style={localStyles.demandRow}>
                <Text style={localStyles.resourceName}><TooltipResourceIcon resourceType={resourceType} /> {getResource(resourceType).name}</Text>
                <Text style={localStyles.demandValue}>{formatNumber(demand.baseConsumptionPerPerson[resourceType], { smartDecimals: true })}</Text>
                <Text style={localStyles.demandValue}>{formatNumber(demand.totalConsumption[resourceType], { smartDecimals: true })}</Text>
                <Text style={localStyles.demandValue}>{formatNumber(currentMinuteConsumption[resourceType], { smartDecimals: true })}</Text>
              </Surface>)}
            </>}
          </View>)}
        </View>
        <Surface elevation={0} style={localStyles.totalCost}>
          <Text style={styles.cardDescription}>Projected local cost</Text>
          <Text style={localStyles.totalCostValue}>{formatNumber(projectedCost.total, { currency: true })}</Text>
        </Surface>
      </Card.Content>
    </Card>
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>HOUSEHOLD INCOME PROJECTION</Text>
        <Text variant="titleMedium">Wages versus local purchases</Text>
        <Text style={styles.cardDescription}>Wages credit the aggregate household account. Purchases debit it and remove fulfilled goods from Local Market stock. The Local Market itself holds resources, not money.</Text>
        <View style={localStyles.incomeProjection}>
          <View style={localStyles.incomeRow}><Text style={localStyles.incomeLabel}>Household balance</Text><Text style={localStyles.incomeValue}>{formatCurrency(population.getHouseholdBalance())}</Text></View>
          <View style={localStyles.incomeRow}><Text style={localStyles.incomeLabel}>Total Wage Payout</Text><Text style={localStyles.incomeValue}>{formatCurrency(incomeProjection.totalWagePayoutPerMinute)}</Text></View>
          <View style={localStyles.incomeRow}><Text style={localStyles.incomeLabel}>Projected local purchases</Text><Text style={localStyles.incomeValue}>{formatCurrency(incomeProjection.projectedPurchaseCostPerMinute)}</Text></View>
          <View style={localStyles.incomeRow}><Text style={localStyles.incomeLabel}>Balance coverage</Text><Text style={[localStyles.incomeValue, { color: affordability.canAffordFullBasket ? colors.primary : colors.error }]}>{affordability.affordableMinutes === null ? 'No priced demand' : `${formatNumber(affordability.affordableMinutes, { smartDecimals: true })} min`}</Text></View>
          {!affordability.canAffordFullBasket && <View style={localStyles.incomeRow}><Text style={localStyles.incomeLabel}>Funding shortfall</Text><Text style={[localStyles.incomeValue, { color: colors.error }]}>{formatCurrency(affordability.unfundedPurchaseCost)}</Text></View>}
          <View style={[localStyles.incomeRow, localStyles.incomeTotal]}><Text style={localStyles.incomeLabel}>Projected surplus</Text><Text style={[localStyles.incomeValue, { color: incomeProjection.surplusPerMinute < 0 ? colors.error : colors.primary }]}>{formatCurrency(incomeProjection.surplusPerMinute)}</Text></View>
        </View>
      </Card.Content>
    </Card>
  </>;
}

const localStyles = StyleSheet.create({
  demandRow: { alignItems: 'center', backgroundColor: '#F5F8F6', borderRadius: 10, flexDirection: 'row', gap: 8, minHeight: 48, paddingHorizontal: 12 },
  demandBasket: { gap: 6 },
  demandTable: { gap: 6 },
  demandValue: { color: '#31443B', flex: 1, fontWeight: '700', textAlign: 'right' },
  emptyState: { backgroundColor: '#F5F8F6', borderRadius: 10, padding: 12 },
  incomeLabel: { color: '#31443B', flex: 1, fontWeight: '600' },
  incomeProjection: { backgroundColor: '#F5F8F6', borderRadius: 10, gap: 8, padding: 12 },
  incomeRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  incomeTotal: { borderTopColor: '#D8E4DD', borderTopWidth: 1, paddingTop: 8 },
  incomeValue: { color: '#16734A', fontWeight: '800' },
  populationSummary: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  resourceHeader: { flex: 2, textAlign: 'left' },
  resourceName: { color: '#31443B', flex: 2, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  tableHeaderText: { color: '#61716B', flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'right', textTransform: 'uppercase' },
  totalCost: { alignItems: 'center', backgroundColor: '#EAF4EE', borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  totalCostValue: { color: '#16734A', fontWeight: '800' },
});
