import { Fragment, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Dialog, Icon, Portal, Surface, Text } from 'react-native-paper';
import type { PrestigeEventType } from '@/game/prestige/prestige';
import { calculatePrestigeDecayDetails, type CompanyPrestigeSummary } from '@/game/prestige/prestigeCalculator';
import { colors } from '@/theme';
import { formatNumber, formatSigned } from '@/utils';

type Filter = 'all' | 'company_balance' | 'sales_contract';

const EVENT_LABELS: Record<PrestigeEventType, string> = {
  company_balance: 'Company balance',
  sales_contract: 'Customer contract',
  achievement: 'Achievement',
  finance_penalty: 'Finance penalty',
};

export function PrestigeDialog({ isOpen, onClose, summary, currentGameTimeMs }: { isOpen: boolean; onClose: () => void; summary: CompanyPrestigeSummary; currentGameTimeMs: number }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { height } = useWindowDimensions();
  const events = useMemo(() => summary.events.filter((event) => filter === 'all' || event.type === filter).slice().reverse(), [filter, summary.events]);
  const selectedEvent = summary.events.find((event) => event.id === selectedEventId);

  return <Portal><Dialog dismissable onDismiss={onClose} style={styles.dialog} visible={isOpen}>
    <Dialog.Title>Company prestige</Dialog.Title>
    <Dialog.Content><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator style={[styles.dialogScroll, { maxHeight: Math.max(200, height - 190) }]}>
      <Text style={styles.description}>A record of your company’s standing. Prestige has no gameplay effect yet.</Text>
      <Surface elevation={0} style={styles.totalCard}><Text style={styles.kicker}>CURRENT PRESTIGE</Text><Text style={styles.totalValue}>{formatNumber(summary.totalPrestige, { smartDecimals: true })}</Text><SummaryRow label="Company balance" value={summary.balancePrestige} /><SummaryRow label="Contract sales" value={summary.salesPrestige} /></Surface>
      <View style={styles.filters}><Button compact mode={filter === 'all' ? 'contained' : 'outlined'} onPress={() => setFilter('all')}>All</Button><Button compact mode={filter === 'company_balance' ? 'contained' : 'outlined'} onPress={() => setFilter('company_balance')}>Balance</Button><Button compact mode={filter === 'sales_contract' ? 'contained' : 'outlined'} onPress={() => setFilter('sales_contract')}>Sales</Button></View>
      <Text style={styles.historyHeading} variant="titleMedium">Prestige history</Text>
      <View style={styles.eventList}>
        {events.length === 0 ? <Text style={styles.emptyText}>No matching prestige events yet.</Text> : events.map((event) => {
          const isSelected = selectedEventId === event.id;
          return <Fragment key={event.id}><Pressable accessibilityLabel={`${isSelected ? 'Hide' : 'Show'} prestige details for ${EVENT_LABELS[event.type]}`} onPress={() => setSelectedEventId(isSelected ? null : event.id)}><Surface elevation={0} style={[styles.eventRow, isSelected && styles.selectedEventRow]}><View style={styles.eventText}><Text variant="bodyLarge">{EVENT_LABELS[event.type]}</Text><Text style={styles.eventDescription}>{event.description}</Text><Text style={styles.eventDecay}>{event.decayHalfLifeForegroundHours === null ? 'Permanent' : `Fading: halves every ${formatNumber(event.decayHalfLifeForegroundHours, { smartDecimals: true })} active hours`}</Text><Text style={styles.tapHint}>{isSelected ? 'Tap to hide details' : 'Tap to show details'}</Text></View><Text style={event.currentAmount < 0 ? styles.penaltyAmount : styles.eventAmount}>{formatSigned(event.currentAmount, { smartDecimals: true })}</Text><Icon source={isSelected ? 'chevron-up' : 'chevron-down'} size={22} color={colors.muted} /></Surface></Pressable>{isSelected && <PrestigeDetails currentGameTimeMs={currentGameTimeMs} event={event} />}</Fragment>;
        })}
      </View>
    </ScrollView></Dialog.Content>
    <Dialog.Actions><Button onPress={onClose}>Close</Button></Dialog.Actions>
  </Dialog></Portal>;
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{formatSigned(value, { smartDecimals: true })}</Text></View>;
}

function PrestigeDetails({ currentGameTimeMs, event }: { currentGameTimeMs: number; event: CompanyPrestigeSummary['events'][number] }) {
  const details = calculatePrestigeDecayDetails(event, currentGameTimeMs);

  return <Surface elevation={0} style={styles.detailsCard}>
    <Text style={styles.kicker}>PRESTIGE DETAILS</Text>
    <SummaryRow label="Original" value={details.originalAmount} />
    <SummaryRow label="Current" value={event.currentAmount} />
    {details.halfLifeForegroundHours === null ? <Text style={styles.eventDecay}>No decay. Permanent sources provide stable prestige.</Text> : <><Text style={styles.eventDecay}>{`Hourly decay: ${formatNumber(details.decayPerForegroundHourPercent ?? 0, { smartDecimals: true })}%`}</Text><Text style={styles.eventDecay}>{`Retained: ${formatNumber(Math.abs(details.currentAmount / details.originalAmount) * 100, { smartDecimals: true })}%`}</Text><Text style={styles.eventDecay}>{`Half-life: ${formatNumber(details.halfLifeForegroundHours, { smartDecimals: true })} active hours`}</Text><Text style={styles.eventDecay}>Projection</Text>{details.projections.map((projection) => <SummaryRow key={projection.foregroundHoursFromNow} label={`In ${projection.foregroundHoursFromNow} active hour${projection.foregroundHoursFromNow === 1 ? '' : 's'}`} value={projection.amount} />)}</>}
  </Surface>;
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 4 }, description: { color: colors.muted, lineHeight: 21 }, detailsCard: { backgroundColor: colors.paleGreen, borderRadius: 12, padding: 12 }, dialog: { maxHeight: '88%' }, dialogScroll: { flexGrow: 0 }, emptyText: { color: colors.muted, paddingVertical: 12, textAlign: 'center' }, eventAmount: { color: colors.primary, fontWeight: '700' }, eventDecay: { color: colors.muted, fontSize: 12, marginTop: 3 }, eventDescription: { color: colors.muted, fontSize: 12, marginTop: 2 }, eventList: { gap: 8, paddingBottom: 4 }, eventRow: { alignItems: 'center', backgroundColor: colors.softBackground, borderRadius: 12, flexDirection: 'row', gap: 12, padding: 12 }, eventText: { flex: 1 }, filters: { flexDirection: 'row', gap: 8 }, historyHeading: { color: colors.charcoal, marginTop: 4 }, kicker: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 }, penaltyAmount: { color: colors.error, fontWeight: '700' }, selectedEventRow: { backgroundColor: colors.paleGreen }, summaryLabel: { color: colors.muted, fontSize: 12 }, summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }, summaryValue: { color: colors.charcoal, fontWeight: '700' }, tapHint: { color: colors.primary, fontSize: 11, fontWeight: '600', marginTop: 5 }, totalCard: { backgroundColor: colors.softBackground, borderRadius: 12, padding: 16 }, totalValue: { color: colors.charcoal, fontSize: 32, fontWeight: '700', lineHeight: 40 },
});
