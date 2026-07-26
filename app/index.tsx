import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { useCounterStore } from '@/stores/counterStore';

export default function HomeScreen() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Industri Clicker</Text>
      <Text accessibilityLiveRegion="polite" variant="displayLarge">
        {count}
      </Text>
      <Button
        accessibilityLabel="Increase counter"
        contentStyle={styles.buttonContent}
        mode="contained"
        onPress={increment}
      >
        +1
      </Button>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 24,
    justifyContent: 'center',
    padding: 24,
  },
  buttonContent: {
    minHeight: 48,
    minWidth: 160,
  },
});
