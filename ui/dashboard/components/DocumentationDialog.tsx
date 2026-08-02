import { ScrollView } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { styles } from '../dashboard.styles';

export type DocumentationKind = 'readme' | 'version-log' | null;

const CONTENT: Record<Exclude<DocumentationKind, null>, { title: string; body: string }> = {
  readme: {
    title: 'Industri Clicker',
    body: 'A local-first, mobile-first industrial clicker for Android. Progress is deterministic while the app is active and is saved deliberately on this device. Cloud accounts, sync, and online leaderboards are intentionally deferred.',
  },
  'version-log': {
    title: 'Version log',
    body: '0.1.0 — Foundation: facilities, market, sales contracts, achievements, prestige, and local company profiles. Future committed changes will be recorded in the project version log after their commit exists.',
  },
};

export function DocumentationDialog({ kind, onClose }: { kind: DocumentationKind; onClose: () => void }) {
  const content = kind ? CONTENT[kind] : null;
  return (
    <Portal>
      <Dialog onDismiss={onClose} visible={content !== null}>
        <Dialog.Title>{content?.title}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
            <Text style={styles.dialogDescription}>{content?.body}</Text>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions><Button onPress={onClose}>Close</Button></Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
