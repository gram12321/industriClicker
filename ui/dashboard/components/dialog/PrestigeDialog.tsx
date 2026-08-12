import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Dialog, Icon, Portal, Surface, Text } from 'react-native-paper';
import type { PrestigeEventType } from '@/game/prestige';
import { calculatePrestigeDecayDetails, type CompanyPrestigeSummary } from '@/game/prestige';
import { colors } from '@/theme';
import { formatNumber, formatSigned } from '@/utils';

type Filter = 'all' | 'company_balance' | 'company_assets' | 'sales_contract' | 'achievement';
type PrestigeEventGroup = {
  id: string;
  label: string;
  events: CompanyPrestigeSummary['events'];
  total: number;
};

const EVENT_LABELS: Record<PrestigeEventType, string> = {
  company_balance: 'Company balance',
  company_assets: 'Company assets',
  facility_condition: 'Facility condition',
  sales_contract: 'Customer contract',
  achievement: 'Achievement',
  finance_penalty: 'Finance penalty',
};

export function PrestigeDialog({ facilityConditions = [], isOpen, onClose, summary, currentGameTimeMs }: { facilityConditions?: readonly number[]; isOpen: boolean; onClose: () => void; summary: CompanyPrestigeSummary; currentGameTimeMs: number }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(new Set());
  const [expandedEventDetails, setExpandedEventDetails] = useState<ReadonlySet<string>>(new Set());
  const { height } = useWindowDimensions();
  const eventGroups = useMemo(() => groupEvents(summary.events, filter), [filter, summary.events]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => toggleSetItem(current, groupId));
  };

  const toggleEventDetails = (eventId: string) => {
    setExpandedEventDetails((current) => toggleSetItem(current, eventId));
  };

  return <Portal><Dialog dismissable onDismiss={onClose} style={styles.dialog} visible={isOpen}>
    <Dialog.Title>Company prestige</Dialog.Title>
    <Dialog.Content><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator style={[styles.dialogScroll, { maxHeight: Math.max(200, height - 190) }]}>
      <Text style={styles.description}>A record of your company’s standing. Prestige has no gameplay effect yet.</Text>
      <Surface elevation={0} style={styles.totalCard}><Text style={styles.kicker}>CURRENT PRESTIGE</Text><Text style={styles.totalValue}>{formatNumber(summary.totalPrestige, { smartDecimals: true })}</Text><SummaryRow label="Company assets" value={summary.assetsPrestige} /><SummaryRow label="Cash reserves" value={summary.balancePrestige} /><SummaryRow label="Facility condition" value={summary.facilityConditionPrestige} /><SummaryRow label="Contract sales" value={summary.salesPrestige} /><SummaryRow label="Achievements" value={summary.achievementPrestige} /></Surface>
      <View style={styles.filters}><Button compact mode={filter === 'all' ? 'contained' : 'outlined'} onPress={() => setFilter('all')}>All</Button><Button compact mode={filter === 'company_assets' ? 'contained' : 'outlined'} onPress={() => setFilter('company_assets')}>Assets</Button><Button compact mode={filter === 'company_balance' ? 'contained' : 'outlined'} onPress={() => setFilter('company_balance')}>Cash</Button><Button compact mode={filter === 'sales_contract' ? 'contained' : 'outlined'} onPress={() => setFilter('sales_contract')}>Sales</Button><Button compact mode={filter === 'achievement' ? 'contained' : 'outlined'} onPress={() => setFilter('achievement')}>Achievements</Button></View>
      <Text style={styles.historyHeading} variant="titleMedium">Prestige history</Text>
      <View style={styles.eventList}>
        {eventGroups.length === 0 ? <Text style={styles.emptyText}>No matching prestige events yet.</Text> : eventGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          return <Surface elevation={0} key={group.id} style={styles.eventGroup}>
            <Pressable accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} ${group.label} events`} accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} onPress={() => toggleGroup(group.id)} style={styles.eventGroupHeader}>
              <View style={styles.eventText}><Text variant="bodyLarge">{group.label}</Text><Text style={styles.eventDescription}>{group.events.length} {group.events.length === 1 ? 'event' : 'events'} · {isExpanded ? 'Hide events' : 'Show events'}</Text></View>
              <Text style={group.total < 0 ? styles.penaltyAmount : styles.eventAmount}>{formatSigned(group.total, { smartDecimals: true })}</Text><Icon source={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.muted} />
            </Pressable>
            {isExpanded && <View style={styles.groupEvents}>{group.events.map((event) => {
              const isDetailsExpanded = expandedEventDetails.has(event.id);
              return <View key={event.id}><Pressable accessibilityLabel={`${isDetailsExpanded ? 'Hide' : 'Show'} prestige details for ${event.description}`} accessibilityRole="button" accessibilityState={{ expanded: isDetailsExpanded }} onPress={() => toggleEventDetails(event.id)}><Surface elevation={0} style={[styles.eventRow, isDetailsExpanded && styles.selectedEventRow]}><View style={styles.eventText}><Text style={styles.eventDescription}>{event.description}</Text><Text style={styles.eventDecay}>{formatEventDecay(event, currentGameTimeMs)}</Text><Text style={styles.tapHint}>{isDetailsExpanded ? 'Tap to hide details' : 'Tap to show details'}</Text></View><Text style={event.currentAmount < 0 ? styles.penaltyAmount : styles.eventAmount}>{formatSigned(event.currentAmount, { smartDecimals: true })}</Text><Icon source={isDetailsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} /></Surface></Pressable>{isDetailsExpanded && <PrestigeDetails currentGameTimeMs={currentGameTimeMs} event={event} facilityConditions={facilityConditions} />}</View>;
            })}</View>}
          </Surface>;
        })}
      </View>
    </ScrollView></Dialog.Content>
    <Dialog.Actions><Button onPress={onClose}>Close</Button></Dialog.Actions>
  </Dialog></Portal>;
}

function groupEvents(events: CompanyPrestigeSummary['events'], filter: Filter): PrestigeEventGroup[] {
  const groups = new Map<string, PrestigeEventGroup>();
  events.filter((event) => filter === 'all' || event.type === filter).slice().reverse().forEach((event) => {
    const id = event.decayHalfLifeForegroundHours === null ? 'permanent' : event.type;
    const group = groups.get(id);
    if (group) {
      group.events.push(event);
      group.total += event.currentAmount;
      return;
    }
    groups.set(id, { id, label: event.decayHalfLifeForegroundHours === null ? 'Permanent sources' : EVENT_LABELS[event.type], events: [event], total: event.currentAmount });
  });

  return Array.from(groups.values());
}

function toggleSetItem<T>(items: ReadonlySet<T>, item: T): ReadonlySet<T> {
  const next = new Set(items);
  if (next.has(item)) next.delete(item); else next.add(item);
  return next;
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{formatSigned(value, { smartDecimals: true })}</Text></View>;
}

function formatEventDecay(event: CompanyPrestigeSummary['events'][number], currentGameTimeMs: number): string {
  const details = calculatePrestigeDecayDetails(event, currentGameTimeMs);
  if (details.halfLifeForegroundHours === null) {
    return 'Permanent';
  }

  const retainedPercent = Math.min(100, Math.max(0, Math.abs(details.currentAmount / details.originalAmount) * 100));
  const decayedPercent = Math.max(0, 100 - retainedPercent);
  return `${formatNumber(details.decayPerForegroundHourPercent ?? 0, { smartDecimals: true })}% hourly (~${formatNumber(details.halfLifeForegroundHours, { smartDecimals: true })} hours to 50%) • ${formatNumber(decayedPercent, { smartDecimals: true })}% decayed`;
}

function PrestigeDetails({ currentGameTimeMs, event, facilityConditions }: { currentGameTimeMs: number; event: CompanyPrestigeSummary['events'][number]; facilityConditions: readonly number[] }) {
  const details = calculatePrestigeDecayDetails(event, currentGameTimeMs);

  return <Surface elevation={0} style={styles.detailsCard}>
    <Text style={styles.kicker}>PRESTIGE DETAILS</Text>
    <SummaryRow label="Original" value={details.originalAmount} />
    <SummaryRow label="Current" value={event.currentAmount} />
    {details.halfLifeForegroundHours === null ? <><Text style={styles.eventDecay}>No decay. Permanent sources provide stable prestige.</Text>{event.type === 'facility_condition' && <FacilityConditionFormula conditions={facilityConditions} />}</> : <><Text style={styles.eventDecay}>{`Hourly decay: ${formatNumber(details.decayPerForegroundHourPercent ?? 0, { smartDecimals: true })}%`}</Text><Text style={styles.eventDecay}>{`Retained: ${formatNumber(Math.abs(details.currentAmount / details.originalAmount) * 100, { smartDecimals: true })}%`}</Text><Text style={styles.eventDecay}>{`Half-life: ${formatNumber(details.halfLifeForegroundHours, { smartDecimals: true })} hours`}</Text><Text style={styles.eventDecay}>Projection</Text>{details.projections.map((projection) => <SummaryRow key={projection.foregroundHoursFromNow} label={`In ${projection.foregroundHoursFromNow} hour${projection.foregroundHoursFromNow === 1 ? '' : 's'}`} value={projection.amount} />)}</>}
  </Surface>;
}

function FacilityConditionFormula({ conditions }: { conditions: readonly number[] }) {
  if (conditions.length === 0) return <Text style={styles.eventDecay}>No facilities currently contribute to this source.</Text>;
  const average = conditions.reduce((sum, condition) => sum + Math.min(1, Math.max(0, condition)), 0) / conditions.length;
  const value = (average - 0.5) * conditions.length;
  return <Text style={styles.eventDecay}>{`${conditions.length} × (${formatNumber(average, { percent: true, decimals: 0 })} − ${formatNumber(0.5, { percent: true, decimals: 0 })}) = ${formatSigned(value, { smartDecimals: true })} prestige`}</Text>;
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 4 }, description: { color: colors.muted, lineHeight: 21 }, detailsCard: { backgroundColor: colors.paleGreen, borderRadius: 12, marginTop: 6, padding: 12 }, dialog: { maxHeight: '88%' }, dialogScroll: { flexGrow: 0 }, emptyText: { color: colors.muted, paddingVertical: 12, textAlign: 'center' }, eventAmount: { color: colors.primary, fontWeight: '700' }, eventDecay: { color: colors.muted, fontSize: 12, marginTop: 3 }, eventDescription: { color: colors.muted, fontSize: 12, marginTop: 2 }, eventGroup: { backgroundColor: colors.surface, borderRadius: 12, padding: 8 }, eventGroupHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 4 }, eventList: { gap: 8, paddingBottom: 4 }, eventRow: { alignItems: 'center', backgroundColor: colors.softBackground, borderRadius: 10, flexDirection: 'row', gap: 12, padding: 12 }, eventText: { flex: 1 }, filters: { flexDirection: 'row', gap: 8 }, groupEvents: { gap: 6, marginTop: 8 }, historyHeading: { color: colors.charcoal, marginTop: 4 }, kicker: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 }, penaltyAmount: { color: colors.error, fontWeight: '700' }, selectedEventRow: { backgroundColor: colors.paleGreen }, summaryLabel: { color: colors.muted, fontSize: 12 }, summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }, summaryValue: { color: colors.charcoal, fontWeight: '700' }, tapHint: { color: colors.primary, fontSize: 11, fontWeight: '600', marginTop: 5 }, totalCard: { backgroundColor: colors.softBackground, borderRadius: 12, padding: 16 }, totalValue: { color: colors.charcoal, fontSize: 32, fontWeight: '700', lineHeight: 40 },
});
