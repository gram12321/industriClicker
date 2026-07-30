import { View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import type { FinanceTransaction } from '@/game/finance/finance';
import { formatCurrency, formatDate } from '@/utils';
import { styles } from '@/app/index.styles';

export function SectionHeading({ eyebrow, subtitle, title }: { eyebrow: string; subtitle: string; title: string }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text variant="headlineSmall">{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text></View>;
}

export function PlaceholderRow({ label, value }: { label: string; value: string }) {
  return <Surface elevation={0} style={styles.placeholderRow}><Text variant="bodyLarge">{label}</Text><Text style={styles.placeholderValue}>{value}</Text></Surface>;
}

export function TransactionRow({ transaction }: { transaction: FinanceTransaction }) {
  return <Surface elevation={0} style={styles.placeholderRow}><View style={styles.transactionDetails}><Text variant="bodyLarge">{transaction.description}</Text><Text style={styles.placeholderValue}>{formatDate(new Date(transaction.occurredAt), true)}</Text></View><Text style={transaction.amount < 0 ? styles.transactionCost : styles.transactionIncome}>{formatCurrency(transaction.amount)}</Text></Surface>;
}
