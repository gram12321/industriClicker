import { useState } from 'react';
import { Button, Card, Dialog, Portal, Text } from 'react-native-paper';
import { colors } from '@/theme';
import { styles } from '@/ui/dashboard/dashboard.styles';

export function ResetCompanyCard({ onResetCompany }: { onResetCompany: () => Promise<void> }) {
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const resetCompany = async () => {
    setIsResetting(true);
    setResetError(null);

    try {
      await onResetCompany();
      setIsResetConfirmationOpen(false);
    } catch {
      setResetError('The local company save could not be reset.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardKicker}>COMPANY DATA</Text>
          <Text variant="titleLarge">Reset company</Text>
          <Text style={styles.cardDescription}>
            Delete the local save and restore the starting company state.
          </Text>
          {resetError && <Text style={styles.productionError}>{resetError}</Text>}
        </Card.Content>
        <Card.Actions>
          <Button icon="delete-outline" onPress={() => setIsResetConfirmationOpen(true)}>
            Reset company
          </Button>
        </Card.Actions>
      </Card>
      <Portal>
        <Dialog
          dismissable={!isResetting}
          onDismiss={() => setIsResetConfirmationOpen(false)}
          visible={isResetConfirmationOpen}
        >
          <Dialog.Title>Reset company?</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogDescription}>
              This permanently deletes this device&apos;s local company save and restores the starting state.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button disabled={isResetting} onPress={() => setIsResetConfirmationOpen(false)}>Cancel</Button>
            <Button
              buttonColor={colors.error}
              disabled={isResetting}
              loading={isResetting}
              mode="contained"
              onPress={resetCompany}
              textColor={colors.onDark}
            >
              Reset company
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

