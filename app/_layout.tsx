import { useEffect, useState, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';

import { loadGameSnapshot, saveGameSnapshot } from '@/game/core/persistence/gameSaveRepository';
import { useGameStore } from '@/stores/gameStore';
import { paperTheme } from '@/theme';

const INITIAL_SAVE_LOAD_TIMEOUT_MS = 10_000;

function loadInitialSnapshot() {
  return new Promise<Awaited<ReturnType<typeof loadGameSnapshot>>>((resolve) => {
    const timeout = setTimeout(() => resolve(null), INITIAL_SAVE_LOAD_TIMEOUT_MS);

    void loadGameSnapshot().then(
      (snapshot) => {
        clearTimeout(timeout);
        resolve(snapshot);
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
    );
  });
}

function GamePersistence({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    const saveNow = () => saveGameSnapshot(useGameStore.getState().createSnapshot()).catch(() => undefined);
    const scheduleSave = () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      saveTimeout = setTimeout(() => {
        saveTimeout = null;
        void saveNow();
      }, 1_000);
    };

    const initialize = async () => {
      try {
        const snapshot = await loadInitialSnapshot();
        if (snapshot) {
          useGameStore.getState().restoreSnapshot(snapshot);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    void initialize();

    const unsubscribe = useGameStore.subscribe(scheduleSave);
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') {
        if (saveTimeout) {
          clearTimeout(saveTimeout);
          saveTimeout = null;
        }
        void saveNow();
      }
    });

    return () => {
      isMounted = false;
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      // Fast Refresh and page reload unmount this provider without an AppState
      // transition. Persist the most recent state rather than cancelling it.
      void saveNow();
      unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator accessibilityLabel="Loading local save" />
      </View>
    );
  }

  return <>{children}</>;
}

function ForegroundRealtimeClock() {
  const advanceRealtime = useGameStore((state) => state.advanceRealtime);
  const resetRealtimeClock = useGameStore((state) => state.resetRealtimeClock);

  useEffect(() => {
    // AppState can be null during startup. Treat that brief unknown state as
    // foreground so the minute timer begins before the first active event.
    let isForeground = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    resetRealtimeClock(Date.now());

    const interval = setInterval(() => {
      if (isForeground) {
        advanceRealtime(Date.now());
      }
    }, 1_000);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (isForeground && nextAppState !== 'active') {
        advanceRealtime(Date.now());
      }

      if (nextAppState === 'active') {
        // Offline progress is planned, but background time intentionally does
        // not grant work in this first foreground-only implementation.
        resetRealtimeClock(Date.now());
      }

      isForeground = nextAppState === 'active';
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
        <GamePersistence>
          <ForegroundRealtimeClock />
          <Stack screenOptions={{ headerShown: false }} />
        </GamePersistence>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
