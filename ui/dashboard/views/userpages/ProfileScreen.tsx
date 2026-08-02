import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { DeleteCompanyCard } from '../../components/DeleteCompanyCard';

export function ProfileScreen({ companyName, playerName, onDeleteCompany, onManageCompanies }: { companyName: string; playerName: string; onDeleteCompany: () => Promise<boolean>; onManageCompanies: () => Promise<void> }) {
  return <><View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>PROFILE</Text><Text variant="headlineSmall">Local player profile</Text><Text style={styles.sectionSubtitle}>Manage the companies stored on this device.</Text></View><Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>LOCAL PLAYER</Text><Text variant="titleLarge">{playerName}</Text><Text style={styles.cardDescription}>Active company: {companyName}</Text></Card.Content><Card.Actions><Button onPress={() => { void onManageCompanies(); }}>Manage companies</Button></Card.Actions></Card><DeleteCompanyCard onDeleteCompany={onDeleteCompany} /></>;
}
