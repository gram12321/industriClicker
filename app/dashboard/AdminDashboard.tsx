import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { styles } from '../index.styles';

/** Placeholder for development-only game administration tools. */
export function AdminDashboard() {
  return (
    <>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionEyebrow}>DEVELOPMENT</Text>
        <Text variant="headlineSmall">Admin Dashboard</Text>
        <Text style={styles.sectionSubtitle}>
          Development tools are available only from a local browser connection.
        </Text>
      </View>
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardKicker}>PLACEHOLDER</Text>
          <Text variant="titleLarge">Admin tools are coming soon.</Text>
          <Text style={styles.cardDescription}>
            This dashboard currently has no actions.
          </Text>
        </Card.Content>
      </Card>
    </>
  );
}
