import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Avatar,
  Divider, IconButton, Menu, Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import type { Finance } from '@/game/finance/finance';
import type { FacilityType } from '@/game/facilities/facilityTypes';
import { DashboardContent, type DashboardTab } from '@/ui/dashboard/DashboardView';
import { DashboardDialogs } from '@/ui/dashboard/components/DashboardDialogs';
import { PrestigeDialog } from '@/ui/dashboard/components/PrestigeDialog';
import { AdminDashboard } from '@/ui/dashboard/views/AdminDashboard';
import { ProfileDashboard } from '@/ui/dashboard/views/ProfileDashboard';
import { IndustriPediaDashboard } from '@/ui/dashboard/views/IndustriPediaDashboard';
import { isDevAdminSurfaceAvailable } from '@/ui/dashboard/helpers/devAdminGate';
import { formatCurrency, formatNumber } from '@/utils';
import { useGameStore } from '@/stores/gameStore';
import { resetGameSave } from '@/game/core/persistence/gameSaveRepository';
import { calculateCompanyPrestigeSummary } from '@/game/prestige/prestigeCalculator';
import { styles } from '@/ui/dashboard/dashboard.styles';

type DashboardView = DashboardTab | 'admin' | 'profile' | 'pedia';

const tabs: Array<{ key: DashboardTab; label: string; symbol: string }> = [
  { key: 'company', label: 'Company', symbol: '⌂' },
  { key: 'inventory', label: 'Inventory', symbol: '▣' },
  { key: 'production', label: 'Production', symbol: '⚙' },
  { key: 'finance', label: 'Finance', symbol: '\u20AC' },
];

const salesTab: { key: DashboardTab; label: string; symbol: string } = {
  key: 'sales',
  label: 'Sales',
  symbol: '$',
};

export default function HomeScreen() {
  const [activeView, setActiveView] = useState<DashboardView>('company');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isConstructionYardOpen, setIsConstructionYardOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [pendingConstruction, setPendingConstruction] = useState<FacilityType | null>(null);
  const [pendingDestruction, setPendingDestruction] = useState<FacilityType | null>(null);
  const inventory = useGameStore((state) => state.inventory);
  const facilities = useGameStore((state) => state.facilities);
  const finance = useGameStore((state) => state.finance);
  const salesContracts = useGameStore((state) => state.salesContracts);
  const prestige = useGameStore((state) => state.prestige);
  const lastProcessedAtMs = useGameStore((state) => state.lastProcessedAtMs);
  const customerPipelineProgress = useGameStore((state) => state.customerPipelineProgress);
  const buildFacility = useGameStore((state) => state.buildFacility);
  const destroyFacility = useGameStore((state) => state.destroyFacility);
  const setFacilityRecipe = useGameStore((state) => state.setFacilityRecipe);
  const setFacilityWorkers = useGameStore((state) => state.setFacilityWorkers);
  const upgradeFacility = useGameStore((state) => state.upgradeFacility);
  const fastForwardOneMinute = useGameStore((state) => state.fastForwardOneMinute);
  const createSalesContractRequest = useGameStore((state) => state.createSalesContractRequest);
  const setInventoryAmount = useGameStore((state) => state.setInventoryAmount);
  const fulfillSalesContract = useGameStore((state) => state.fulfillSalesContract);
  const rejectSalesContract = useGameStore((state) => state.rejectSalesContract);
  const resetGame = useGameStore((state) => state.resetGame);
  const isAdminDashboardAvailable = isDevAdminSurfaceAvailable();
  const prestigeSummary = calculateCompanyPrestigeSummary(prestige.getEvents(), lastProcessedAtMs);

  const resetCompany = async () => {
    await resetGameSave();
    resetGame();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.topBar}>
            <View style={styles.balanceInline}>
              <Text accessibilityLabel="Balance icon" style={styles.coinIcon}>🪙</Text>
              <Text style={styles.balanceInlineValue}>{formatCurrency(finance.getBalance())}</Text>
              <Pressable accessibilityLabel="Open company prestige" accessibilityRole="button" onPress={() => setIsPrestigeOpen(true)} style={styles.prestigeInline}>
                <Text style={styles.prestigeIcon}>🏆</Text>
                <Text style={styles.prestigeInlineValue}>{formatNumber(prestigeSummary.totalPrestige, { smartDecimals: true })}</Text>
              </Pressable>
            </View>
            <View style={styles.headerActions}>
              <IconButton
                accessibilityLabel="Fast-forward one minute"
                icon="fast-forward"
                iconColor={colors.onDark}
                onPress={fastForwardOneMinute}
              />
              <IconButton
                accessibilityLabel="Open company prestige"
                icon="trophy-outline"
                iconColor={colors.onDark}
                onPress={() => setIsPrestigeOpen(true)}
              />
              <Menu
                anchor={
                  <Pressable
                    accessibilityLabel="Open profile menu"
                    accessibilityRole="button"
                    onPress={() => setIsProfileMenuOpen(true)}
                    style={styles.profileButton}
                  >
                    <Avatar.Text label="IC" size={38} style={styles.avatar} />
                  </Pressable>
                }
                onDismiss={() => setIsProfileMenuOpen(false)}
                visible={isProfileMenuOpen}
              >
                <Menu.Item
                  leadingIcon="account-outline"
                  onPress={() => { setIsProfileMenuOpen(false); setActiveView('profile'); }}
                  title="Profile"
                />
                <Menu.Item leadingIcon="cog-outline" onPress={() => setIsProfileMenuOpen(false)} title="Settings" />
                <Menu.Item
                  leadingIcon="book-open-variant"
                  onPress={() => { setIsProfileMenuOpen(false); setActiveView('pedia'); }}
                  title="IndustriPedia"
                />
                <Menu.Item leadingIcon="trophy-outline" onPress={() => setIsProfileMenuOpen(false)} title="Achievements" />
                {isAdminDashboardAvailable && (
                  <Menu.Item
                    leadingIcon="shield-crown-outline"
                    onPress={() => { setIsProfileMenuOpen(false); setActiveView('admin'); }}
                    title="Admin Dashboard"
                  />
                )}
                <Divider />
                <Menu.Item leadingIcon="logout" onPress={() => setIsProfileMenuOpen(false)} title="Log out" />
              </Menu>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {activeView === 'admin' && isAdminDashboardAvailable ? <AdminDashboard onCreateContractRequest={createSalesContractRequest} onResetCompany={resetCompany} onSetInventoryAmount={setInventoryAmount} /> : activeView === 'profile' ? <ProfileDashboard onResetCompany={resetCompany} /> : activeView === 'pedia' ? <IndustriPediaDashboard /> : (
            <DashboardContent
              activeTab={activeView === 'admin' ? 'company' : activeView}
              openConstructionYard={() => setIsConstructionYardOpen(true)}
              requestFacilityDestruction={setPendingDestruction}
              facilities={facilities}
              finance={finance}
              fulfillSalesContract={fulfillSalesContract}
              inventory={inventory}
              salesContracts={salesContracts}
              rejectSalesContract={rejectSalesContract}
              customerPipelineProgress={customerPipelineProgress}
              setFacilityRecipe={setFacilityRecipe}
              setFacilityWorkers={setFacilityWorkers}
              upgradeFacility={upgradeFacility}
            />
          )}
        </ScrollView>

        <View style={styles.bottomNavigation}>
          {[...tabs.slice(0, 3), salesTab, ...tabs.slice(3)].map((tab) => (
            <BottomNavigationItem
              active={activeView === tab.key}
              key={tab.key}
              label={tab.label}
              onPress={() => setActiveView(tab.key)}
              symbol={tab.symbol}
            />
          ))}
        </View>
      </View>
      <DashboardDialogs
        facilities={facilities}
        finance={finance}
        pendingConstruction={pendingConstruction}
        pendingDestruction={pendingDestruction}
        isConstructionYardOpen={isConstructionYardOpen}
        onCloseConstructionYard={() => setIsConstructionYardOpen(false)}
        onSelectFacility={(facilityType) => { setIsConstructionYardOpen(false); setPendingConstruction(facilityType); }}
        onConfirmConstruction={() => { if (pendingConstruction && buildFacility(pendingConstruction)) setPendingConstruction(null); }}
        onConfirmDestruction={() => { if (pendingDestruction && destroyFacility(pendingDestruction)) setPendingDestruction(null); }}
        onDismissConstruction={() => setPendingConstruction(null)}
        onDismissDestruction={() => setPendingDestruction(null)}
      />
      <PrestigeDialog currentGameTimeMs={lastProcessedAtMs} isOpen={isPrestigeOpen} onClose={() => setIsPrestigeOpen(false)} summary={prestigeSummary} />
    </SafeAreaView>
  );
}
function BottomNavigationItem({
  active,
  label,
  onPress,
  symbol,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  symbol: string;
}) {
  const activeStyle: StyleProp<ViewStyle> = active ? styles.activeNavigationItem : undefined;

  return (
    <Pressable
      accessibilityLabel={`${label} tab`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.navigationItem, activeStyle]}
    >
      <Text style={[styles.navigationSymbol, active && styles.activeNavigationText]}>{symbol}</Text>
      <Text style={[styles.navigationLabel, active && styles.activeNavigationText]}>{label}</Text>
    </Pressable>
  );
}

