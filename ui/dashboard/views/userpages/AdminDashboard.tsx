import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import type { ResourceType } from '@/game/resources/resourceTypes';
import { ContractRequestCard } from '../../components/ContractRequestCard';
import { InventoryControlCard } from '../../components/InventoryControlCard';
import { ResetCompanyCard } from '../../components/ResetCompanyCard';

export function AdminDashboard({ onCreateContractRequest, onResetCompany, onSetInventoryAmount }: {
  onCreateContractRequest: (resourceType: ResourceType, quantity: number) => boolean;
  onResetCompany: () => Promise<void>;
  onSetInventoryAmount: (resourceType: ResourceType, amount: number) => boolean;
}) {
  return <><View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>DEVELOPMENT</Text><Text variant="headlineSmall">Admin Dashboard</Text><Text style={styles.sectionSubtitle}>Development tools are available only from a local browser connection.</Text></View><ContractRequestCard onCreateContractRequest={onCreateContractRequest} /><InventoryControlCard onSetInventoryAmount={onSetInventoryAmount} /><ResetCompanyCard onResetCompany={onResetCompany} /></>;
}
