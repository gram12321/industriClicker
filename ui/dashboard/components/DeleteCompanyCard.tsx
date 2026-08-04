import { useState } from 'react';
import { Button, Card, Dialog, Portal, Text } from 'react-native-paper';
import { colors } from '@/theme';
import { styles } from '@/ui/dashboard/shared';
import { APP_ICONS } from '@/icons';

export function DeleteCompanyCard({ onDeleteCompany }: { onDeleteCompany: () => Promise<boolean> }) {
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteCompany = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (!await onDeleteCompany()) throw new Error('Delete failed');
      setIsDeleteConfirmationOpen(false);
    } catch {
      setDeleteError('The local company could not be deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardKicker}>COMPANY DATA</Text>
          <Text variant="titleLarge">Delete company</Text>
          <Text style={styles.cardDescription}>
            Permanently remove this company and return to the local company selector.
          </Text>
          {deleteError && <Text style={styles.productionError}>{deleteError}</Text>}
        </Card.Content>
        <Card.Actions>
      <Button icon={APP_ICONS.delete} onPress={() => setIsDeleteConfirmationOpen(true)}>
            Delete company
          </Button>
        </Card.Actions>
      </Card>
      <Portal>
        <Dialog
          dismissable={!isDeleting}
          onDismiss={() => setIsDeleteConfirmationOpen(false)}
          visible={isDeleteConfirmationOpen}
        >
          <Dialog.Title>Delete company?</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogDescription}>
              This permanently deletes this company, including its local progress and tutorial state. You will return to the company selector.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button disabled={isDeleting} onPress={() => setIsDeleteConfirmationOpen(false)}>Cancel</Button>
            <Button
              buttonColor={colors.error}
              disabled={isDeleting}
              loading={isDeleting}
              mode="contained"
              onPress={deleteCompany}
              textColor={colors.onDark}
            >
              Delete company
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

