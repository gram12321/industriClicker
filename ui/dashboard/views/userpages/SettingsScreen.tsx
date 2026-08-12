import { View } from 'react-native';
import { Button, Card, List, Text } from 'react-native-paper';

import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS } from '@/icons';

export function SettingsScreen({ onLogout }: { onLogout: () => Promise<void> }) {
  return (
    <>
      <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>SETTINGS</Text><Text variant="headlineSmall">Local game controls</Text><Text style={styles.sectionSubtitle}>Manage this local session and replay the company orientation.</Text></View>
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content><Text style={styles.cardKicker}>LOCAL SESSION</Text><Text variant="titleLarge">Log out</Text><Text style={styles.cardDescription}>Return to the local player and company selector. Your companies remain saved on this device.</Text></Card.Content>
        <Card.Actions><Button icon={APP_ICONS.logout} onPress={() => { void onLogout(); }}>Log out</Button></Card.Actions>
      </Card>
    </>
  );
}
