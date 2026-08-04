import { Card, Text } from 'react-native-paper';
import type { Finance } from '@/game/finance';
import { formatCurrency } from '@/utils';
import { DetailRow, SectionHeading, TransactionRow, styles } from '@/ui/dashboard/shared';

export function FinanceView({ finance }: { finance: Finance }) {
  const recentTransactions = finance.getTransactions().slice(-3).reverse();

  return (
    <>
      <SectionHeading eyebrow="FINANCE" title="Financial overview" subtitle="Review your available funds and recent company transactions." />
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardKicker}>AVAILABLE FUNDS</Text>
          <Text style={styles.balanceValue}>{formatCurrency(finance.getBalance())}</Text>
          <Text style={styles.cardDescription}>Land purchases are recorded when a facility is built. Construction Materials are consumed from inventory.</Text>
        </Card.Content>
      </Card>
      <Text style={styles.inventoryHeading} variant="titleMedium">Recent activity</Text>
      {recentTransactions.length === 0 ? (
        <DetailRow label="Transactions" value="No transactions yet" />
      ) : (
        recentTransactions.map((transaction, index) => (
          <TransactionRow key={`${transaction.occurredAt}-${index}`} transaction={transaction} />
        ))
      )}
    </>
  );
}

