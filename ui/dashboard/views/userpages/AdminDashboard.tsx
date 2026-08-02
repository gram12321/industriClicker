import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Dialog, Portal, Text } from 'react-native-paper';

import { APP_ICONS } from '@/icons';
import type { ResourceType } from '@/game/resources/resourceTypes';
import { colors } from '@/theme';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { ContractRequestCard } from '../../components/ContractRequestCard';
import { DeleteCompanyCard } from '../../components/DeleteCompanyCard';
import { InventoryControlCard } from '../../components/InventoryControlCard';

export function AdminDashboard({ onClearAllLocalData, onCreateContractRequest, onDeleteCompany, onSetInventoryAmount }: {
  onClearAllLocalData: () => Promise<boolean>;
  onCreateContractRequest: (resourceType: ResourceType, quantity: number) => boolean;
  onDeleteCompany: () => Promise<boolean>;
  onSetInventoryAmount: (resourceType: ResourceType, amount: number) => boolean;
}) {
  return <><View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>DEVELOPMENT</Text><Text variant="headlineSmall">Admin Dashboard</Text><Text style={styles.sectionSubtitle}>Development tools are available only from a local browser connection.</Text></View><ContractRequestCard onCreateContractRequest={onCreateContractRequest} /><InventoryControlCard onSetInventoryAmount={onSetInventoryAmount} /><DeleteCompanyCard onDeleteCompany={onDeleteCompany} /><ClearLocalDataCard onClearAllLocalData={onClearAllLocalData} /></>;
}

function ClearLocalDataCard({ onClearAllLocalData }: { onClearAllLocalData: () => Promise<boolean> }) {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearLocalData = async () => {
    setIsClearing(true);
    setError(null);
    try {
      if (!await onClearAllLocalData()) throw new Error('Clear failed');
      setIsConfirmationOpen(false);
    } catch {
      setError('All local data could not be cleared.');
    } finally {
      setIsClearing(false);
    }
  };

  return <><Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>LOCAL DATABASE</Text><Text variant="titleLarge">Clear all local data</Text><Text style={styles.cardDescription}>Delete every local player, company, save, tutorial, and device session from this device.</Text>{error && <Text style={styles.productionError}>{error}</Text>}</Card.Content><Card.Actions><Button icon={APP_ICONS.delete} onPress={() => setIsConfirmationOpen(true)}>Clear database</Button></Card.Actions></Card><Portal><Dialog dismissable={!isClearing} onDismiss={() => setIsConfirmationOpen(false)} visible={isConfirmationOpen}><Dialog.Title>Clear all local data?</Dialog.Title><Dialog.Content><Text style={styles.dialogDescription}>This permanently deletes every local player profile and company. The app will return to the local login screen.</Text></Dialog.Content><Dialog.Actions><Button disabled={isClearing} onPress={() => setIsConfirmationOpen(false)}>Cancel</Button><Button buttonColor={colors.error} disabled={isClearing} loading={isClearing} mode="contained" onPress={clearLocalData} textColor={colors.onDark}>Clear database</Button></Dialog.Actions></Dialog></Portal></>;
}
