import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { styles } from '@/ui/dashboard/shared';

export function LeaderboardScreen() {
  return <><View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>LEADERBOARD</Text><Text variant="headlineSmall">This device</Text><Text style={styles.sectionSubtitle}>A local company ranking placeholder.</Text></View><Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text variant="titleLarge">Online rankings are not enabled</Text><Text style={styles.cardDescription}>Global rankings need a server to calculate and validate scores. Your local company data never leaves this device in this version.</Text></Card.Content></Card></>;
}
