import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, Button, Dialog, Portal, Text } from 'react-native-paper';

import { colors } from '@/theme';
import { styles } from '@/ui/dashboard/helpers';

export function TutorialGuideDialog({ balance, step, visible, onClose, onNext }: { balance: string; step: 1 | 2; visible: boolean; onClose: () => void; onNext: () => void }) {
  const isBalanceStep = step === 2;

  return (
    <Portal>
      <Dialog dismissable={false} visible={visible}>
        <Dialog.Title>{isBalanceStep ? 'Your company balance' : 'Welcome to Industri Clicker'}</Dialog.Title>
        <Dialog.Content>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Avatar.Icon icon={isBalanceStep ? 'cash' : 'factory'} size={52} style={{ backgroundColor: colors.primary }} />
            <Text style={styles.sectionEyebrow}>{`STEP ${step} OF 2`}</Text>
            {isBalanceStep ? <Text style={styles.dialogDescription}>The highlighted amount at the top is your company balance. You spend it on construction and upgrades, and earn more by selling resources. Later it will become part of your company’s total assets. And thus also provide Prestige. I'll tell you more about that later</Text> : <><Text style={styles.dialogDescription}>I’ll help you get oriented. Your company runs while this app is in the foreground. Start by checking your Company tab.</Text><Text style={styles.dialogDescription}>The tutorial stays active while you work through the early game.</Text></>}
          </View>
        </Dialog.Content>
        <Dialog.Actions><Button mode="contained" onPress={isBalanceStep ? onClose : onNext}>{isBalanceStep ? 'Continue to Company' : 'Next'}</Button></Dialog.Actions>
      </Dialog>
      {isBalanceStep && visible && <View accessibilityElementsHidden pointerEvents="none" style={styles.tutorialBalanceSpotlight}><MaterialCommunityIcons color={colors.onDark} name="cash" size={21} /><Text style={styles.balanceInlineValue}>{balance}</Text></View>}
    </Portal>
  );
}
