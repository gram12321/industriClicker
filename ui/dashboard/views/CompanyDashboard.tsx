import { Card, Text } from 'react-native-paper';
import { styles } from '@/app/index.styles';
import { SectionHeading } from '../components/DashboardViewComponents';

export function CompanyDashboard() {
  return (
    <>
      <SectionHeading eyebrow="COMPANY" title="Company overview" subtitle="Your starting dashboard for the Industri Clicker prototype." />
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardKicker}>COMPANY PROFILE</Text>
          <Text variant="titleLarge">Starter Company</Text>
          <Text style={styles.cardDescription}>
            The company profile is a visual placeholder while the player identity system is planned.
          </Text>
        </Card.Content>
      </Card>
    </>
  );
}

