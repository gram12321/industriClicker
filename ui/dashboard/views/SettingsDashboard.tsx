import { View } from 'react-native';
import { Button, Card, List, Text } from 'react-native-paper';

import { styles } from '@/ui/dashboard/dashboard.styles';
import { APP_ICONS } from '@/icons';

export function SettingsDashboard({ onLogout, onReplayTutorial }: { onLogout: () => Promise<void>; onReplayTutorial: () => Promise<void> }) {
  return (
    <>
      <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>SETTINGS</Text><Text variant="headlineSmall">Local preferences</Text><Text style={styles.sectionSubtitle}>These preferences stay on this device and are attached to your local player profile.</Text></View>
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content><List.Item description="Industri light is active. Additional themes are planned." left={(props) => <List.Icon {...props} icon="palette-outline" />} title="Theme" /></Card.Content>
      </Card>
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content><List.Item description="Open the short company orientation again." left={(props) => <List.Icon {...props} icon={APP_ICONS.help} />} title="Tutorial" /></Card.Content>
        <Card.Actions><Button onPress={() => { void onReplayTutorial(); }}>Replay guide</Button></Card.Actions>
      </Card>
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content><Text style={styles.cardKicker}>LOCAL SESSION</Text><Text variant="titleLarge">Log out</Text><Text style={styles.cardDescription}>Return to the local player and company selector. Your companies remain saved on this device.</Text></Card.Content>
        <Card.Actions><Button icon={APP_ICONS.logout} onPress={() => { void onLogout(); }}>Log out</Button></Card.Actions>
      </Card>
    </>
  );
}
