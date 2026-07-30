import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { styles } from '@/ui/dashboard/dashboard.styles';
import type { ResourceType } from '@/game/resources/resourceTypes';
import { ContractRequestCard } from '../components/ContractRequestCard';
import { ResetCompanyCard } from '../components/ResetCompanyCard';

export function AdminDashboard({ onCreateContractRequest, onResetCompany }: {
  onCreateContractRequest: (resourceType: ResourceType, quantity: number) => boolean;
  onResetCompany: () => Promise<void>;
}) {
  return <><View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>DEVELOPMENT</Text><Text variant="headlineSmall">Admin Dashboard</Text><Text style={styles.sectionSubtitle}>Development tools are available only from a local browser connection.</Text></View><ContractRequestCard onCreateContractRequest={onCreateContractRequest} /><ResetCompanyCard onResetCompany={onResetCompany} /></>;
}
