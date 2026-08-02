import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { Avatar, Divider, IconButton, Menu, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_ICONS } from '@/icons';
import { calculateCompanyPrestigeSummary, useCompanySessionStore, useGameStore } from '@/game';
import { colors } from '@/theme';
import { AdminDashboard, AchievementsView, GameViewContent, GameDialogs, IndustriPediaView, isDevAdminSurfaceAvailable, LeaderboardScreen, PrestigeDialog, ProfileScreen, SettingsScreen, styles, TutorialGuideDialog, LoginView, type GameViewId } from '@/ui';
import { formatCurrency, formatElapsedTime, formatNumber } from '@/utils';

type ActiveScreen = GameViewId | 'achievements' | 'admin' | 'profile' | 'pedia' | 'settings' | 'leaderboard';

const tabs: Array<{ key: GameViewId; label: string; symbol: string }> = [
  { key: 'company', label: 'Company', symbol: '⌂' },
  { key: 'inventory', label: 'Inventory', symbol: '▣' },
  { key: 'production', label: 'Production', symbol: '⚙' },
  { key: 'market', label: 'Market', symbol: 'M' },
  { key: 'finance', label: 'Finance', symbol: '€' },
];

const salesTab: { key: GameViewId; label: string; symbol: string } = { key: 'sales', label: 'Sales', symbol: '$' };

export default function HomeScreen() {
  const activeCompany = useCompanySessionStore((state) => state.activeCompany);
  return activeCompany ? <GameShell companyName={activeCompany.displayName} /> : <LoginView />;
}

function GameShell({ companyName }: { companyName: string }) {
  const [activeView, setActiveView] = useState<ActiveScreen>('company');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isConstructionYardOpen, setIsConstructionYardOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [pendingConstruction, setPendingConstruction] = useState<import('@/game').FacilityType | null>(null);
  const [pendingDestruction, setPendingDestruction] = useState<import('@/game').FacilityType | null>(null);
  const inventory = useGameStore((state) => state.inventory);
  const market = useGameStore((state) => state.market);
  const facilities = useGameStore((state) => state.facilities);
  const finance = useGameStore((state) => state.finance);
  const salesContracts = useGameStore((state) => state.salesContracts);
  const achievements = useGameStore((state) => state.achievements);
  const productionStatistics = useGameStore((state) => state.productionStatistics);
  const prestige = useGameStore((state) => state.prestige);
  const companyStartedAtGameTimeMs = useGameStore((state) => state.companyStartedAtGameTimeMs);
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
  const buyMarketResource = useGameStore((state) => state.buyMarketResource);
  const sellMarketResource = useGameStore((state) => state.sellMarketResource);
  const setMarketAutomation = useGameStore((state) => state.setMarketAutomation);
  const fulfillSalesContract = useGameStore((state) => state.fulfillSalesContract);
  const rejectSalesContract = useGameStore((state) => state.rejectSalesContract);
  const playerName = useCompanySessionStore((state) => state.selectedProfile?.displayName ?? 'Local player');
  const tutorial = useCompanySessionStore((state) => state.tutorial);
  const deleteActiveCompany = useCompanySessionStore((state) => state.deleteActiveCompany);
  const clearAllLocalData = useCompanySessionStore((state) => state.clearAllLocalData);
  const logout = useCompanySessionStore((state) => state.logout);
  const completeWelcomeTutorial = useCompanySessionStore((state) => state.completeWelcomeTutorial);
  const reopenWelcomeTutorial = useCompanySessionStore((state) => state.reopenWelcomeTutorial);
  const isAdminDashboardAvailable = isDevAdminSurfaceAvailable();
  const prestigeSummary = calculateCompanyPrestigeSummary(prestige.getEvents(), lastProcessedAtMs);
  const elapsedForegroundTimeMs = Math.max(0, lastProcessedAtMs - companyStartedAtGameTimeMs);

  useEffect(() => {
    setIsTutorialOpen(!tutorial.completedWelcome);
  }, [tutorial.completedWelcome]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}><View style={styles.topBar}>
          <View style={styles.balanceInline}>
            <MaterialCommunityIcons accessibilityLabel="Balance icon" color={colors.onDark} name={APP_ICONS.currency} size={21} />
            <Text style={styles.balanceInlineValue}>{formatCurrency(finance.getBalance())}</Text>
            <Pressable accessibilityLabel="Open company prestige" accessibilityRole="button" onPress={() => setIsPrestigeOpen(true)} style={styles.prestigeInline}><MaterialCommunityIcons color={colors.onDark} name={APP_ICONS.achievements} size={17} /><Text style={styles.prestigeInlineValue}>{formatNumber(prestigeSummary.totalPrestige, { smartDecimals: true })}</Text></Pressable>
          </View>
          <View style={styles.headerActions}>
            <IconButton accessibilityLabel="Fast-forward one minute" icon={APP_ICONS.fastForward} iconColor={colors.onDark} onPress={fastForwardOneMinute} />
            <View accessibilityLabel={`Elapsed foreground time ${formatElapsedTime(elapsedForegroundTimeMs)}`} style={styles.headerElapsedTime}><MaterialCommunityIcons color={colors.onDark} name={APP_ICONS.elapsedTime} size={17} /><Text style={styles.headerElapsedTimeValue}>{formatElapsedTime(elapsedForegroundTimeMs)}</Text></View>
            <Menu anchor={<Pressable accessibilityLabel="Open profile menu" accessibilityRole="button" onPress={() => setIsProfileMenuOpen(true)} style={styles.profileButton}><Avatar.Text label={companyName.slice(0, 2).toUpperCase()} size={38} style={styles.avatar} /></Pressable>} onDismiss={() => setIsProfileMenuOpen(false)} visible={isProfileMenuOpen}>
              <Menu.Item leadingIcon={APP_ICONS.account} onPress={() => { setIsProfileMenuOpen(false); setActiveView('profile'); }} title="Profile" />
              <Menu.Item leadingIcon={APP_ICONS.settings} onPress={() => { setIsProfileMenuOpen(false); setActiveView('settings'); }} title="Settings" />
              <Menu.Item leadingIcon="format-list-numbered" onPress={() => { setIsProfileMenuOpen(false); setActiveView('leaderboard'); }} title="Leaderboard" />
              <Menu.Item leadingIcon={APP_ICONS.help} onPress={() => { setIsProfileMenuOpen(false); setActiveView('pedia'); }} title="IndustriPedia" />
              <Menu.Item leadingIcon={APP_ICONS.achievements} onPress={() => { setIsProfileMenuOpen(false); setActiveView('achievements'); }} title="Achievements" />
              {isAdminDashboardAvailable && <Menu.Item leadingIcon={APP_ICONS.shield} onPress={() => { setIsProfileMenuOpen(false); setActiveView('admin'); }} title="Admin Dashboard" />}
              <Divider />
              <Menu.Item leadingIcon={APP_ICONS.logout} onPress={() => { setIsProfileMenuOpen(false); void logout(); }} title="Log out" />
            </Menu>
          </View>
        </View></View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeView === 'admin' && isAdminDashboardAvailable ? <AdminDashboard onClearAllLocalData={clearAllLocalData} onCreateContractRequest={createSalesContractRequest} onDeleteCompany={deleteActiveCompany} onSetInventoryAmount={setInventoryAmount} />
            : activeView === 'achievements' ? <AchievementsView achievements={achievements} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={lastProcessedAtMs} facilities={facilities} finance={finance} prestige={prestige} productionStatistics={productionStatistics} salesContracts={salesContracts} />
              : activeView === 'profile' ? <ProfileScreen companyName={companyName} onDeleteCompany={deleteActiveCompany} onManageCompanies={logout} playerName={playerName} />
                : activeView === 'settings' ? <SettingsScreen onLogout={logout} onReplayTutorial={reopenWelcomeTutorial} />
                  : activeView === 'leaderboard' ? <LeaderboardScreen />
                    : activeView === 'pedia' ? <IndustriPediaView />
                      : <GameViewContent activeTab={activeView === 'admin' ? 'company' : activeView} buyMarketResource={buyMarketResource} companyName={companyName} customerPipelineProgress={customerPipelineProgress} facilities={facilities} finance={finance} fulfillSalesContract={fulfillSalesContract} inventory={inventory} market={market} openConstructionYard={() => setIsConstructionYardOpen(true)} rejectSalesContract={rejectSalesContract} requestFacilityDestruction={setPendingDestruction} salesContracts={salesContracts} sellMarketResource={sellMarketResource} setFacilityRecipe={setFacilityRecipe} setFacilityWorkers={setFacilityWorkers} setMarketAutomation={setMarketAutomation} upgradeFacility={upgradeFacility} />}
        </ScrollView>
        <View style={styles.bottomNavigation}>{[...tabs.slice(0, 3), salesTab, ...tabs.slice(3)].map((tab) => <BottomNavigationItem active={activeView === tab.key} key={tab.key} label={tab.label} onPress={() => setActiveView(tab.key)} symbol={tab.symbol} />)}</View>
      </View>
      <GameDialogs facilities={facilities} finance={finance} isConstructionYardOpen={isConstructionYardOpen} onCloseConstructionYard={() => setIsConstructionYardOpen(false)} onConfirmConstruction={() => { if (pendingConstruction && buildFacility(pendingConstruction)) setPendingConstruction(null); }} onConfirmDestruction={() => { if (pendingDestruction && destroyFacility(pendingDestruction)) setPendingDestruction(null); }} onDismissConstruction={() => setPendingConstruction(null)} onDismissDestruction={() => setPendingDestruction(null)} onSelectFacility={(facilityType) => { setIsConstructionYardOpen(false); setPendingConstruction(facilityType); }} pendingConstruction={pendingConstruction} pendingDestruction={pendingDestruction} />
      <PrestigeDialog currentGameTimeMs={lastProcessedAtMs} isOpen={isPrestigeOpen} onClose={() => setIsPrestigeOpen(false)} summary={prestigeSummary} />
      <TutorialGuideDialog onComplete={() => { void completeWelcomeTutorial(); }} visible={isTutorialOpen} />
    </SafeAreaView>
  );
}

function BottomNavigationItem({ active, label, onPress, symbol }: { active: boolean; label: string; onPress: () => void; symbol: string }) {
  const activeStyle: StyleProp<ViewStyle> = active ? styles.activeNavigationItem : undefined;
  return <Pressable accessibilityLabel={`${label} tab`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.navigationItem, activeStyle]}><Text style={[styles.navigationSymbol, active && styles.activeNavigationText]}>{symbol}</Text><Text style={[styles.navigationLabel, active && styles.activeNavigationText]}>{label}</Text></Pressable>;
}
