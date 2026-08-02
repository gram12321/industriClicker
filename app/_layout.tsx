import { useEffect, useState, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { useCompanySessionStore, useGameStore } from '@/game';
import { saveCompanySnapshot } from '@/game/company/companyDatabase';
import { paperTheme } from '@/theme';

const ACTIVE_SAVE_BATCH_MS = 5_000;

function LocalSessionBootstrap({ children }: { children: ReactNode }) {
  const status = useCompanySessionStore((state) => state.status);
  const initialize = useCompanySessionStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (status === 'loading') {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator accessibilityLabel="Loading local player data" color={paperTheme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

/** Batches only the snapshot belonging to the currently active company. */
function CompanyGamePersistence({ children }: { children: ReactNode }) {
  const activeCompanyId = useCompanySessionStore((state) => state.activeCompany?.id ?? null);

  useEffect(() => {
    if (!activeCompanyId) return undefined;
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    const saveNow = (shouldProcessForegroundTime = AppState.currentState !== 'background' && AppState.currentState !== 'inactive') => {
      if (useCompanySessionStore.getState().activeCompany?.id !== activeCompanyId) return Promise.resolve();
      if (shouldProcessForegroundTime) useGameStore.getState().advanceRealtime(Date.now());
      return saveCompanySnapshot(activeCompanyId, useGameStore.getState().createSnapshot()).catch(() => undefined);
    };
    const scheduleSave = () => {
      if (saveTimeout) return;
      saveTimeout = setTimeout(() => {
        saveTimeout = null;
        void saveNow();
      }, ACTIVE_SAVE_BATCH_MS);
    };
    const unsubscribe = useGameStore.subscribe((state, previousState) => {
      if (
        state.finance !== previousState.finance
        || state.inventory !== previousState.inventory
        || state.market !== previousState.market
        || state.facilities !== previousState.facilities
        || state.salesContracts !== previousState.salesContracts
        || state.achievements !== previousState.achievements
        || state.productionStatistics !== previousState.productionStatistics
        || state.prestige !== previousState.prestige
        || state.companyStartedAtGameTimeMs !== previousState.companyStartedAtGameTimeMs
        || state.lastProcessedAtMs !== previousState.lastProcessedAtMs
        || state.unprocessedWorkMs !== previousState.unprocessedWorkMs
        || state.customerPipelineProgress !== previousState.customerPipelineProgress
      ) scheduleSave();
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
      if (saveTimeout) clearTimeout(saveTimeout);
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [activeCompanyId]);

  return <>{children}</>;
}

function ForegroundRealtimeClock() {
  const activeCompanyId = useCompanySessionStore((state) => state.activeCompany?.id ?? null);
  const advanceRealtime = useGameStore((state) => state.advanceRealtime);
  const resetRealtimeClock = useGameStore((state) => state.resetRealtimeClock);

  useEffect(() => {
    if (!activeCompanyId) return undefined;
    let isForeground = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    resetRealtimeClock(Date.now());
    const interval = setInterval(() => {
      if (isForeground) advanceRealtime(Date.now());
    }, 1_000);
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') resetRealtimeClock(Date.now());
      isForeground = nextAppState === 'active';
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [activeCompanyId, advanceRealtime, resetRealtimeClock]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <LocalSessionBootstrap>
          <CompanyGamePersistence>
            <ForegroundRealtimeClock />
            <Stack screenOptions={{ headerShown: false }} />
          </CompanyGamePersistence>
        </LocalSessionBootstrap>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
