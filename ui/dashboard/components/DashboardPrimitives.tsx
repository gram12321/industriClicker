import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Text } from 'react-native-paper';
import type { FinanceTransaction } from '@/game/finance';
import { formatCurrency, formatDate } from '@/utils';
import { styles } from '@/ui/dashboard/helpers';
import { APP_ICONS } from '@/icons';
import { RESOURCE_TYPES, getResource, getResourceIcon } from '@/game/resources';

export function SectionHeading({ eyebrow, subtitle, title }: { eyebrow: string; subtitle: string; title: string }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text variant="headlineSmall">{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text></View>;
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return <Surface elevation={0} style={styles.detailRow}><Text variant="bodyLarge">{label}</Text><Text style={styles.detailValue}>{value}</Text></Surface>;
}

export function TransactionRow({ transaction }: { transaction: FinanceTransaction }) {
  const isCost = transaction.amount < 0;
  const resourceIcon = getTransactionResourceIcon(transaction.description);
  return <Surface elevation={0} style={styles.detailRow}><View style={[styles.transactionIcon, isCost ? styles.transactionIconCost : styles.transactionIconIncome]}><MaterialCommunityIcons color={isCost ? styles.transactionCost.color : styles.transactionIncome.color} name={getTransactionIcon(transaction.description) as never} size={20} /></View><View style={styles.transactionDetails}><Text variant="bodyLarge">{`${resourceIcon ? `${resourceIcon} ` : ''}${transaction.description}`}</Text><Text style={styles.detailValue}>{formatDate(new Date(transaction.occurredAt), true)}</Text></View><Text style={isCost ? styles.transactionCost : styles.transactionIncome}>{formatCurrency(transaction.amount)}</Text></Surface>;
}

function getTransactionResourceIcon(description: string): string | null {
  const normalizedDescription = description.toLowerCase();
  const resourceType = RESOURCE_TYPES.find((candidate) => normalizedDescription.includes(getResource(candidate).name.toLowerCase()));
  return resourceType ? getResourceIcon(resourceType) : null;
}

function getTransactionIcon(description: string): string {
  if (description.includes('local market')) return APP_ICONS.localMarket;
  if (description.startsWith('Contract fulfilled')) return APP_ICONS.globalMarket;
  if (description.startsWith('Constructed')) return APP_ICONS.building;
  return APP_ICONS.currency;
}

export function WorkMetric({ value }: { value: string }) {
  return <View accessibilityLabel={`Work ${value}`} style={styles.workMetric}><MaterialCommunityIcons color={styles.workMetricIcon.color} name={APP_ICONS.work} size={16} /><Text style={styles.cardDescription}>{value}</Text></View>;
}
