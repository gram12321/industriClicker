import { ScrollView } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import type { Finance } from '@/game/finance';
import { formatCurrency } from '@/utils';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

/** Saved debt-collection notices are surfaced here, independent of the active view. */
export function CollectionDialog(props: { finance: Finance; onAcknowledge: (noticeId: string) => boolean; onAcceptRestructure: () => { success: boolean; reason?: string } }) {
  const notice = props.finance.getCollectionNotices()[0] ?? null;
  const restructure = props.finance.getPendingRestructureOffer();
  if (!notice && !restructure) return null;
  const mandatory = notice?.stage === 'liquidation' || notice?.stage === 'default';
  return <Portal><Dialog dismissable={!mandatory} onDismiss={() => { if (notice && !mandatory) props.onAcknowledge(notice.id); }} visible>
    <Dialog.Title>{notice?.title ?? 'Debt restructure available'}</Dialog.Title>
    <Dialog.ScrollArea><ScrollView>
      {notice && <Text style={styles.dialogDescription}>{notice.message}</Text>}
      {notice && <Text style={styles.dialogDescription}>Lender: {notice.lenderName} · Missed payments: {notice.missedPayments}</Text>}
      {restructure && <Text style={styles.dialogDescription}>Collections Recovery will replace the defaulted balance of {formatCurrency(restructure.principal)} with {restructure.durationPeriods} one-minute payments of {formatCurrency(restructure.paymentAmount)} at {(restructure.annualInterestRate * 100).toFixed(0)}% annual interest.</Text>}
    </ScrollView></Dialog.ScrollArea>
    <Dialog.Actions>
      {notice && <Button onPress={() => props.onAcknowledge(notice.id)}>{mandatory ? 'Continue' : 'Acknowledge'}</Button>}
      {restructure && <Button mode="contained" onPress={() => props.onAcceptRestructure()}>Accept restructure</Button>}
    </Dialog.Actions>
  </Dialog></Portal>;
}
