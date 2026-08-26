import { StyleSheet, View } from 'react-native';
import { Card, Surface, Text } from 'react-native-paper';
import type { FacilityCollection } from '@/game/facilities';
import type { Market } from '@/game/market';
import { RESOURCE_TYPES, calculatePopulationLocalPurchaseCost, getPopulationDemand, getResource } from '@/game';
import { formatNumber } from '@/utils';
import { SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { TooltipResourceIcon } from '@/ui/dashboard/components/IconTooltip';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

export function PopulationView({ facilities, market }: { facilities: FacilityCollection; market: Market }) {
  const demand = getPopulationDemand(facilities);
  const projectedCost = calculatePopulationLocalPurchaseCost(demand, (resourceType) => market.getLocalPrice(resourceType));
  const configuredResources = RESOURCE_TYPES.filter(
    (resourceType) => demand.baseConsumptionPerPerson[resourceType] > 0,
  );

  return <>
    <SectionHeading
      eyebrow="POPULATION"
      title="Population demand"
      subtitle="A read-only demand projection from the workers assigned to your facilities."
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
        <Text style={styles.cardKicker}>BASE CONSUMPTION</Text>
        <Text variant="titleMedium">Per game-minute</Text>
        <Text style={styles.cardDescription}>Base consumption per population unit and the resulting total for one game-minute. Future consumption will be prorated across foreground game ticks. The estimate below uses current local prices only; it does not consume resources or change market supply.</Text>
        {configuredResources.length === 0 ? <Surface elevation={0} style={localStyles.emptyState}>
          <Text style={styles.cardDescription}>No base resource demand is configured yet. The zero-valued constants are ready for the first approved consumer basket and balance pass.</Text>
        </Surface> : <View style={localStyles.demandTable}>
          <View style={localStyles.tableHeader}>
            <Text style={[localStyles.tableHeaderText, localStyles.resourceHeader]}>Resource</Text>
            <Text style={localStyles.tableHeaderText}>Per pop</Text>
            <Text style={localStyles.tableHeaderText}>Total</Text>
            <Text style={localStyles.tableHeaderText}>Cost</Text>
          </View>
          {configuredResources.map((resourceType) => <Surface key={resourceType} elevation={0} style={localStyles.demandRow}>
            <Text style={localStyles.resourceName}><TooltipResourceIcon resourceType={resourceType} /> {getResource(resourceType).name}</Text>
            <Text style={localStyles.demandValue}>{formatNumber(demand.baseConsumptionPerPerson[resourceType], { smartDecimals: true })}</Text>
            <Text style={localStyles.demandValue}>{formatNumber(demand.totalConsumption[resourceType], { smartDecimals: true })}</Text>
            <Text style={localStyles.demandValue}>{formatNumber(projectedCost.byResource[resourceType], { currency: true })}</Text>
          </Surface>)}
        </View>}
        {configuredResources.length > 0 && <Surface elevation={0} style={localStyles.totalCost}>
          <Text style={styles.cardDescription}>Projected local cost</Text>
          <Text style={localStyles.totalCostValue}>{formatNumber(projectedCost.total, { currency: true })}</Text>
        </Surface>}
      </Card.Content>
    </Card>
  </>;
}

const localStyles = StyleSheet.create({
  demandRow: { alignItems: 'center', backgroundColor: '#F5F8F6', borderRadius: 10, flexDirection: 'row', gap: 8, minHeight: 48, paddingHorizontal: 12 },
  demandTable: { gap: 6 },
  demandValue: { color: '#31443B', flex: 1, fontWeight: '700', textAlign: 'right' },
  emptyState: { backgroundColor: '#F5F8F6', borderRadius: 10, padding: 12 },
  populationSummary: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  resourceHeader: { flex: 2, textAlign: 'left' },
  resourceName: { color: '#31443B', flex: 2, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  tableHeaderText: { color: '#61716B', flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'right', textTransform: 'uppercase' },
  totalCost: { alignItems: 'center', backgroundColor: '#EAF4EE', borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  totalCostValue: { color: '#16734A', fontWeight: '800' },
});
