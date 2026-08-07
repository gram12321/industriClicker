import { Image, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { colors } from '@/theme';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

const SIMULUCIUS_IMAGES = {
  balance: require('../../../../assets/simulucius/withlaptop.png'),
  welcome: require('../../../../assets/simulucius/frontremovebg.png'),
} as const;

export function TutorialGuideDialog({ balance, elapsedTime, step, visible, onNext }: { balance: string; elapsedTime: string; step: 1 | 2 | 3 | 4 | 5; visible: boolean; onNext: () => void }) {
  const isBalanceStep = step === 2;
  const isTimeStep = step === 3;
  const isCompanyStep = step === 4;
  const isProductionStep = step === 5;
  const title = isBalanceStep ? 'Your company balance' : isTimeStep ? 'Your company time' : isCompanyStep ? 'Your company overview' : isProductionStep ? 'Production' : 'Welcome to Industri Clicker';
  const description = isProductionStep ? 'Press the Production tab below. I’ll introduce that view in the next dialog.' : isCompanyStep ? 'This is your company overview. It will become your home base for understanding your company and its progress. I will show you more of this page later.' : isTimeStep ? 'The highlighted value shows your company time. It advances while you play, and helps you follow how long your company has been running and how much progress it has made.' : isBalanceStep ? "The highlighted amount at the top is your company balance. You spend it on construction and upgrades, and earn more by selling resources. Later it will become part of your company's total assets and provide Prestige. I'll tell you more about that later." : "I'll help you get oriented. Start by checking your Company tab. The tutorial stays active while you work through the early game.";
  const guideImage = isBalanceStep ? SIMULUCIUS_IMAGES.balance : SIMULUCIUS_IMAGES.welcome;

  const guideContent = <View><Image accessibilityLabel="Simulucius, your tutorial guide" resizeMode="contain" source={guideImage} style={styles.tutorialGuideCharacterBehind} /><Text style={styles.tutorialDialogTitle}>{title}</Text><View style={styles.tutorialDialogContent}><Text style={styles.sectionEyebrow}>{`STEP ${step} OF 5`}</Text><Text style={styles.dialogDescription}>{description}</Text></View></View>;

  return <Portal>
    {isProductionStep ? visible && <View pointerEvents="box-none" style={styles.tutorialProductionOverlay}><View pointerEvents="none" style={styles.tutorialProductionDimmerTop} /><View pointerEvents="none" style={styles.tutorialProductionDimmerNavigationTop} /><View pointerEvents="none" style={styles.tutorialProductionDimmerNavigationBottom} /><View pointerEvents="none" style={styles.tutorialProductionDimmerNavigationLeft} /><View pointerEvents="none" style={styles.tutorialProductionDimmerNavigationRight} /><View pointerEvents="auto" style={styles.tutorialProductionCard}>{guideContent}</View></View> : <Dialog dismissable={false} style={styles.tutorialDialog} visible={visible}>{guideContent}<Dialog.Actions><Button mode="contained" onPress={onNext}>Next</Button></Dialog.Actions></Dialog>}
    {isBalanceStep && visible && <View accessibilityElementsHidden pointerEvents="none" style={styles.tutorialBalanceSpotlight}><MaterialCommunityIcons color={colors.onDark} name="cash" size={21} /><Text style={styles.balanceInlineValue}>{balance}</Text></View>}
    {isTimeStep && visible && <View accessibilityElementsHidden pointerEvents="none" style={styles.tutorialTimeSpotlight}><MaterialCommunityIcons color={colors.onDark} name="timer-outline" size={17} /><Text style={styles.headerElapsedTimeValue}>{elapsedTime}</Text></View>}
  </Portal>;
}

export function ProductionTutorialDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return <Portal><Dialog dismissable={false} style={styles.tutorialDialog} visible={visible}><Image accessibilityLabel="Simulucius, your tutorial guide" resizeMode="contain" source={SIMULUCIUS_IMAGES.welcome} style={styles.tutorialGuideCharacterBehind} /><Dialog.Title>Production</Dialog.Title><Dialog.Content><Text style={styles.dialogDescription}>This is the Production view. We’ll explore how your facilities run here next.</Text></Dialog.Content><Dialog.Actions><Button mode="contained" onPress={onClose}>Continue</Button></Dialog.Actions></Dialog></Portal>;
}
