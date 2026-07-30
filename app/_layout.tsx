import { useEffect, useState, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

if (__DEV__ && globalThis.window) {
  const ignoredWarning = 'props.pointerEvents is deprecated. Use style.pointerEvents';
  const originalWarn = console.warn;

  console.warn = (...args) => {
    if (args[0] === ignoredWarning) {
      return;
    }

    originalWarn(...args);
  };
}

import { loadGameSnapshot, saveGameSnapshot, useGameStore } from '@/game/core';
import { paperTheme } from '@/theme';

const INITIAL_SAVE_LOAD_TIMEOUT_MS = 10_000;
const ACTIVE_SAVE_BATCH_MS = 5_000;

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

    const saveNow = (shouldProcessForegroundTime = AppState.currentState !== 'background' && AppState.currentState !== 'inactive') => {
      // Process the final active interval before reading the snapshot. This
      // keeps a background transition from saving state that predates a just-
      // completed foreground work minute.
      if (shouldProcessForegroundTime) {
        useGameStore.getState().advanceRealtime(Date.now());
      }
      return saveGameSnapshot(useGameStore.getState().createSnapshot()).catch(() => undefined);
    };
    const scheduleSave = () => {
      if (saveTimeout) {
        return;
      }

      saveTimeout = setTimeout(() => {
        saveTimeout = null;
        void saveNow();
      }, ACTIVE_SAVE_BATCH_MS);
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

    const unsubscribe = useGameStore.subscribe((state, previousState) => {
      if (
        state.finance === previousState.finance
        && state.inventory === previousState.inventory
        && state.facilities === previousState.facilities
        && state.salesContracts === previousState.salesContracts
        && state.prestige === previousState.prestige
      ) {
        return;
      }

      scheduleSave();
    });
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') {
        if (saveTimeout) {
          clearTimeout(saveTimeout);
          saveTimeout = null;
        }
        void saveNow(true);
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
        <ActivityIndicator accessibilityLabel="Loading local save" color={paperTheme.colors.primary} />
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
