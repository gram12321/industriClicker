import { View } from 'react-native';
import { Avatar, Button, Dialog, Portal, Text } from 'react-native-paper';

import { colors } from '@/theme';
import { styles } from '@/ui/dashboard/helpers';

export function TutorialGuideDialog({ visible, onComplete }: { visible: boolean; onComplete: () => void }) {
  return (
    <Portal>
      <Dialog dismissable={false} visible={visible}>
        <Dialog.Title>Welcome to Industri Clicker</Dialog.Title>
        <Dialog.Content>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Avatar.Icon icon="factory" size={52} style={{ backgroundColor: colors.primary }} />
            <Text style={styles.sectionEyebrow}>STEP 1 OF 2</Text>
            <Text style={styles.dialogDescription}>I’ll help you get oriented. Your company runs while this app is in the foreground. Start by checking your Company, Production, and Market tabs.</Text>
            <Text style={styles.dialogDescription}>You can reopen this guide from Settings whenever you need a quick reminder.</Text>
          </View>
        </Dialog.Content>
        <Dialog.Actions><Button mode="contained" onPress={onComplete}>Start building</Button></Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
