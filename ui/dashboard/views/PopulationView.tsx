import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import type { FacilityCollection } from '@/game/facilities';
import type { Market } from '@/game/market';
import type { PopulationLedger } from '@/game/population';
import { calculatePopulationConsumption, calculatePopulationTotalWagePayoutPerMinute, getPopulationCount, getResource, RESOURCE_GROUPS, type ResourceGroup } from '@/game';
import { colors } from '@/theme';
import { formatCurrency, formatNumber } from '@/utils';
import { SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { TooltipResourceIcon } from '@/ui/dashboard/components/IconTooltip';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { PopulationExpenditureBreakdownChart } from './population/PopulationExpenditureBreakdownChart';

const GROUP_ICONS: Readonly<Record<ResourceGroup, 'food-apple-outline' | 'pickaxe' | 'wall' | 'factory' | 'lightning-bolt-outline'>> = {
  food: 'food-apple-outline',
  'raw-resources': 'pickaxe',
  construction: 'wall',
  manufacturing: 'factory',
  utilities: 'lightning-bolt-outline',
};

export function PopulationView({ facilities, market, population }: { facilities: FacilityCollection; market: Market; population: PopulationLedger }) {
  const [expandedGroups, setExpandedGroups] = useState<Partial<Record<ResourceGroup, boolean>>>({ food: true });
  const populationCount = getPopulationCount(facilities);
  const wagePerMinute = calculatePopulationTotalWagePayoutPerMinute(facilities);
  const householdBalance = population.getHouseholdBalance();
  const budgetPerMinute = householdBalance + wagePerMinute;
  const consumption = calculatePopulationConsumption(populationCount, market, budgetPerMinute);
  const expenditureBreakdown = RESOURCE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    projectedPurchaseCost: consumption.actualSpendingByGroup[group.id],
    expenditureShare: consumption.actualSpendingPerMinute > 0 ? consumption.actualSpendingByGroup[group.id] / consumption.actualSpendingPerMinute : 0,
  }));

  return <>
    <SectionHeading eyebrow="POPULATION" title="Population spending" subtitle="Workers create aggregate Local Market demand from their paid wages." />
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>WORKFORCE-BASED POPULATION</Text>
        <View style={localStyles.populationSummary}>
          <View><Text variant="titleLarge">{formatNumber(populationCount)}</Text><Text style={styles.cardDescription}>Total population</Text></View>
          <Text style={styles.cardDescription}>Every assigned facility worker counts as one population unit, including workers in training.</Text>
        </View>
      </Card.Content>
    </Card>
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>EXPENDITURE BREAKDOWN</Text>
        <Text variant="titleMedium">Population spending by domain</Text>
        <Text style={styles.cardDescription}>How the available household budget is currently spent after price and scarcity preferences.</Text>
        <PopulationExpenditureBreakdownChart entries={expenditureBreakdown} />
      </Card.Content>
    </Card>
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium">Total consumption by whole pop per minute</Text>
        <Text style={styles.cardDescription}>Base is the fixed basket. Adjusted includes price, baseline, and luxury preferences. Actual is the adjusted basket scaled to the spending budget.</Text>
        <View style={localStyles.tableHeader}>
          <Text style={[localStyles.tableHeaderText, localStyles.resourceHeader]}>Category / Resource</Text>
          <Text style={localStyles.tableHeaderText}>Base / Adjusted / Actual</Text>
        </View>
        <View style={localStyles.consumptionTable}>
          {RESOURCE_GROUPS.map((group) => {
            const resources = group.resources.filter((resourceType) => consumption.baseAmounts[resourceType] > 0 || consumption.adjustedAmounts[resourceType] > 0);
            if (resources.length === 0) return null;
            const baseTotal = resources.reduce((total, resourceType) => total + consumption.baseAmounts[resourceType], 0);
            const adjustedTotal = resources.reduce((total, resourceType) => total + consumption.adjustedAmounts[resourceType], 0);
            const actualTotal = resources.reduce((total, resourceType) => total + consumption.actualAmounts[resourceType], 0);
            const expanded = expandedGroups[group.id] ?? false;
            return <View key={group.id} style={localStyles.group}>
              <Pressable accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${group.label} consumption`} accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpandedGroups((current) => ({ ...current, [group.id]: !expanded }))} style={localStyles.groupHeader}>
                <View style={localStyles.groupName}><MaterialCommunityIcons color={colors.primary} name={GROUP_ICONS[group.id]} size={18} /><Text style={localStyles.groupNameText}>{group.label}</Text></View>
                <View style={localStyles.groupValue}><ConsumptionValues base={baseTotal} adjusted={adjustedTotal} actual={actualTotal} /><MaterialCommunityIcons color={colors.muted} name={expanded ? 'chevron-up' : 'chevron-down'} size={18} /></View>
              </Pressable>
              {expanded && <View style={localStyles.resourceList}>{resources.map((resourceType) => <View key={resourceType} style={localStyles.resourceRow}>
                <Text style={localStyles.resourceName}><TooltipResourceIcon resourceType={resourceType} /> {getResource(resourceType).name}</Text>
                <ConsumptionValues base={consumption.baseAmounts[resourceType]} adjusted={consumption.adjustedAmounts[resourceType]} actual={consumption.actualAmounts[resourceType]} compact />
              </View>)}</View>}
            </View>;
          })}
        </View>
      </Card.Content>
    </Card>
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>HOUSEHOLD CASH</Text>
        <Text style={styles.cardDescription}>Wages credit the household balance. Purchases debit it continuously; Local Market holds resources, not money.</Text>
        <View style={localStyles.cashPanel}>
          <View style={localStyles.cashRow}><Text style={localStyles.cashLabel}>Household balance</Text><Text style={localStyles.cashValue}>{formatCurrency(householdBalance)}</Text></View>
          <View style={localStyles.cashRow}><Text style={localStyles.cashLabel}>Wages</Text><Text style={localStyles.cashValue}>{formatCurrency(wagePerMinute)}/min</Text></View>
          <View style={[localStyles.cashRow, localStyles.cashTotal]}><Text style={localStyles.cashLabel}>Available to spend</Text><Text style={localStyles.cashValue}>{formatCurrency(budgetPerMinute)}/min</Text></View>
        </View>
      </Card.Content>
    </Card>
  </>;
}

function ConsumptionValues({ base, adjusted, actual, compact = false }: { base: number; adjusted: number; actual: number; compact?: boolean }) {
  const adjustmentColor = adjusted < base ? colors.error : adjusted > base ? colors.primary : colors.charcoal;
  return <View style={compact ? localStyles.compactValues : localStyles.groupValues}>
    <Text style={localStyles.baseValue}>{formatNumber(base, { smartDecimals: true })} /</Text>
    <Text style={[localStyles.adjustedValue, { color: adjustmentColor }]}>{formatNumber(adjusted, { smartDecimals: true })}</Text>
    <Text style={localStyles.actualValue}> / {formatNumber(actual, { smartDecimals: true })}</Text>
  </View>;
}

const localStyles = StyleSheet.create({
  adjustedValue: { fontSize: 12, fontWeight: '800' },
  actualValue: { color: colors.charcoal, fontSize: 12, fontWeight: '800' },
  baseValue: { color: colors.muted, fontSize: 12 },
  cashLabel: { color: '#31443B', flex: 1, fontWeight: '600' },
  cashPanel: { backgroundColor: '#F5F8F6', borderRadius: 10, gap: 8, padding: 12 },
  cashRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cashTotal: { borderTopColor: '#D8E4DD', borderTopWidth: 1, paddingTop: 8 },
  cashValue: { color: '#16734A', fontWeight: '800' },
  compactValues: { flexDirection: 'row', gap: 3, justifyContent: 'flex-end', minWidth: 78 },
  consumptionTable: { gap: 6 },
  group: { backgroundColor: '#F5F8F6', borderRadius: 10, overflow: 'hidden' },
  groupHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 44, paddingHorizontal: 12 },
  groupName: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 },
  groupNameText: { color: colors.charcoal, fontWeight: '800' },
  groupValue: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  groupValues: { flexDirection: 'row', gap: 3, justifyContent: 'flex-end', minWidth: 88 },
  populationSummary: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  resourceHeader: { flex: 1, textAlign: 'left' },
  resourceList: { borderTopColor: '#D8E4DD', borderTopWidth: 1, gap: 7, paddingHorizontal: 12, paddingVertical: 9 },
  resourceName: { color: '#31443B', flex: 1, fontSize: 12 },
  resourceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 12 },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 12 },
  tableHeaderText: { color: '#61716B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});
