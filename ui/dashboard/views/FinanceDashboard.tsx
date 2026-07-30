import { Card, Text } from 'react-native-paper';
import type { Finance } from '@/game/finance/finance';
import { formatCurrency } from '@/utils';
import { styles } from '@/app/index.styles';
import { PlaceholderRow, SectionHeading, TransactionRow } from '../components/DashboardViewComponents';

export function FinanceDashboard({ finance }: { finance: Finance }) {
  return (
    <>
      <SectionHeading eyebrow="FINANCE" title="Financial overview" subtitle="Review your available funds and recent company transactions." />
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardKicker}>AVAILABLE FUNDS</Text>
          <Text style={styles.balanceValue}>{formatCurrency(finance.getBalance())}</Text>
          <Text style={styles.cardDescription}>Construction costs are recorded when a facility is built.</Text>
        </Card.Content>
      </Card>
      <Text style={styles.inventoryHeading} variant="titleMedium">Recent activity</Text>
      {finance.getTransactions().length === 0 ? (
        <PlaceholderRow label="Transactions" value="No transactions yet" />
      ) : (
        finance.getTransactions().slice(-3).reverse().map((transaction, index) => (
          <TransactionRow key={`${transaction.occurredAt}-${index}`} transaction={transaction} />
        ))
      )}
    </>
  );
}

