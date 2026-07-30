import { Card, List, Text } from 'react-native-paper';
import { PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS } from '@/game/prestige/prestigeConstants';
import { formatNumber } from '@/utils';
import { styles } from '@/ui/dashboard/dashboard.styles';
import { SectionHeading } from '../components/DashboardViewComponents';

export function IndustriPediaDashboard() {
  return <>
    <SectionHeading eyebrow="INDUSTRIPEDIA" title="Prestige" subtitle="How company standing is recorded and fades over time." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>WHAT IT IS</Text><Text style={styles.cardDescription}>Prestige is an informational company-standing score. It does not affect production, pricing, or customer offers yet.</Text></Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Item description="A permanent, recalculated source based on current company cash." left={(props) => <List.Icon {...props} icon="bank-outline" />} title="Company balance" /><List.Item description={`Each fulfilled contract creates a fading event. Its half-life is ${formatNumber(PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS, { smartDecimals: true })} foreground hours.`} left={(props) => <List.Icon {...props} icon="handshake-outline" />} title="Contract sales" /></Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>DECAY</Text><Text style={styles.cardDescription}>Prestige decay uses active foreground game time. Background time does not decay prestige; Fast-forward does.</Text><Text style={styles.cardDescription}>For a fading event: current = original × 0.5^(foreground hours ÷ half-life). Select an event in the Prestige dialog to see its original value, current value, hourly decay, and projections.</Text></Card.Content></Card>
  </>;
}
