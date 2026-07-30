import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { styles } from '@/app/index.styles';
import { ResetCompanyCard } from '../components/ResetCompanyCard';

export function AdminDashboard({ onResetCompany }: { onResetCompany: () => Promise<void> }) {
  return <><View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>DEVELOPMENT</Text><Text variant="headlineSmall">Admin Dashboard</Text><Text style={styles.sectionSubtitle}>Development tools are available only from a local browser connection.</Text></View><ResetCompanyCard onResetCompany={onResetCompany} /></>;
}
