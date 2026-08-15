import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Dialog, Portal, Text, TextInput } from 'react-native-paper';

import { APP_ICONS } from '@/icons';
import type { ResourceType } from '@/game/resources';
import { colors } from '@/theme';
import { SalesOrderRequestCard } from '@/ui/dashboard/components/cards/SalesOrderRequestCard';
import { DeleteCompanyCard } from '@/ui/dashboard/components/cards/DeleteCompanyCard';
import { InventoryControlCard } from '@/ui/dashboard/components/cards/InventoryControlCard';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

export function AdminDashboard({ isTutorialEnabled, onAddFunds, onClearAllLocalData, onCreateSalesOrderRequest, onDeleteCompany, onDisableTutorial, onEnableTutorial, onSetBalance, onSetInventoryAmount }: {
  isTutorialEnabled: boolean;
  onAddFunds: (amount: number) => boolean;
  onClearAllLocalData: () => Promise<boolean>;
  onCreateSalesOrderRequest: (resourceType: ResourceType, quantity: number) => boolean;
  onDeleteCompany: () => Promise<boolean>;
  onDisableTutorial: () => Promise<void>;
  onEnableTutorial: () => Promise<void>;
  onSetBalance: (amount: number) => boolean;
  onSetInventoryAmount: (resourceType: ResourceType, amount: number) => boolean;
}) {
  return <><View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>DEVELOPMENT</Text><Text variant="headlineSmall">Admin Dashboard</Text><Text style={styles.sectionSubtitle}>Development tools are available only from a local browser connection.</Text></View><TutorialControlCard isTutorialEnabled={isTutorialEnabled} onDisableTutorial={onDisableTutorial} onEnableTutorial={onEnableTutorial} /><MoneyControlCard onAddFunds={onAddFunds} onSetBalance={onSetBalance} /><SalesOrderRequestCard onCreateSalesOrderRequest={onCreateSalesOrderRequest} /><InventoryControlCard onSetInventoryAmount={onSetInventoryAmount} /><DeleteCompanyCard onDeleteCompany={onDeleteCompany} /><ClearLocalDataCard onClearAllLocalData={onClearAllLocalData} /></>;
}

function MoneyControlCard({ onAddFunds, onSetBalance }: { onAddFunds: (amount: number) => boolean; onSetBalance: (amount: number) => boolean }) {
  const [amountText, setAmountText] = useState('1000');
  const [message, setMessage] = useState<string | null>(null);
  const amount = Number(amountText);
  const isValidAmount = amountText.trim().length > 0 && Number.isFinite(amount) && amount >= 0;
  const updateBalance = (action: 'add' | 'set') => {
    if (!isValidAmount) return;
    const wasUpdated = action === 'add' ? onAddFunds(amount) : onSetBalance(amount);
    setMessage(wasUpdated ? (action === 'add' ? `Added €${amount.toLocaleString()}.` : `Set balance to €${amount.toLocaleString()}.`) : 'Balance could not be updated.');
  };
  return <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>FINANCE</Text><Text variant="titleLarge">Adjust company money</Text><Text style={styles.cardDescription}>Changes are recorded as normal finance transactions.</Text><TextInput accessibilityLabel="Company money amount" dense keyboardType="decimal-pad" label="Euro amount" mode="outlined" onChangeText={(value) => setAmountText(value.replace(/[^0-9.]/g, ''))} style={styles.adminSalesOrderAmountInput} value={amountText} /><View style={styles.adminMoneyActions}><Button disabled={!isValidAmount || amount === 0} mode="contained" onPress={() => updateBalance('add')}>Add money</Button><Button disabled={!isValidAmount} mode="outlined" onPress={() => updateBalance('set')}>Set balance</Button></View>{message && <Text style={styles.adminSuccessMessage}>{message}</Text>}</Card.Content></Card>;
}

function TutorialControlCard({ isTutorialEnabled, onDisableTutorial, onEnableTutorial }: { isTutorialEnabled: boolean; onDisableTutorial: () => Promise<void>; onEnableTutorial: () => Promise<void> }) {
  return <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>ONBOARDING</Text><Text variant="titleLarge">Welcome tutorial</Text><Text style={styles.cardDescription}>{isTutorialEnabled ? 'Enabled. Only the Company tab is available until this development control turns the tutorial off.' : 'Disabled. New companies also start with the tutorial disabled during development.'}</Text></Card.Content><Card.Actions><Button mode="contained" onPress={() => { void (isTutorialEnabled ? onDisableTutorial() : onEnableTutorial()); }}>{isTutorialEnabled ? 'Turn tutorial off' : 'Turn tutorial on'}</Button></Card.Actions></Card>;
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
