import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { styles } from '@/app/index.styles';
import { ResetCompanyCard } from '../components/ResetCompanyCard';

export function ProfileDashboard({ onResetCompany }: { onResetCompany: () => Promise<void> }) {
  return <><View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>PROFILE</Text><Text variant="headlineSmall">Company profile</Text><Text style={styles.sectionSubtitle}>Manage your local company data.</Text></View><ResetCompanyCard onResetCompany={onResetCompany} /></>;
}
