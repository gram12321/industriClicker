import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { paperTheme } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
