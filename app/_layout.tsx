import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { useGameStore } from '@/stores/gameStore';
import { paperTheme } from '@/theme';

function ForegroundRealtimeClock() {
  const advanceRealtime = useGameStore((state) => state.advanceRealtime);
  const resetRealtimeClock = useGameStore((state) => state.resetRealtimeClock);

  useEffect(() => {
    let currentAppState = AppState.currentState;
    resetRealtimeClock(Date.now());

    const interval = setInterval(() => {
      if (currentAppState === 'active') {
        advanceRealtime(Date.now());
      }
    }, 1_000);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (currentAppState === 'active' && nextAppState !== 'active') {
        advanceRealtime(Date.now());
      }

      if (nextAppState === 'active') {
        // Offline progress is planned, but background time intentionally does
        // not grant work in this first foreground-only implementation.
        resetRealtimeClock(Date.now());
      }

      currentAppState = nextAppState;
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [advanceRealtime, resetRealtimeClock]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <ForegroundRealtimeClock />
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
