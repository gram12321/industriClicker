import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { Avatar, Divider, IconButton, Menu, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_ICONS } from '@/icons';
import { calculateCompanyPrestigeSummary, getMaximumOpenSalesContracts, type FacilityType, useCompanySessionStore, useGameStore } from '@/game';
import { colors } from '@/theme';
import { ActiveProcessesOverlay, AdminDashboard, AchievementsView, CollectionDialog, ConstructionTutorialDialog, FirstFacilityTutorialDialog, GameViewContent, FacilityConstructionDialog, BuildFacilityTutorialDialog, IndustriPediaView, isDevAdminSurfaceAvailable, LeaderboardScreen, PrestigeDialog, ProfileScreen, ResearchView, SettingsScreen, styles, ProductionTutorialDialog, TutorialGuideDialog, LoginView, type GameViewId } from '@/ui';
import { formatCurrency, formatElapsedTime, formatNumber } from '@/utils';

type ActiveScreen = GameViewId | 'achievements' | 'admin' | 'profile' | 'pedia' | 'settings' | 'leaderboard';

const tabs: Array<{ key: GameViewId; label: string; symbol: string; icon?: string }> = [
  { key: 'company', label: 'Company', symbol: '⌂' },
  { key: 'inventory', label: 'Inventory', symbol: '▣' },
  { key: 'production', label: 'Facility', symbol: '⚙' },
  { key: 'finance', label: 'Finance', symbol: '€' },
];

const salesTab: { key: GameViewId; label: string; symbol: string; icon?: string } = { key: 'sales', label: 'Sales', symbol: '$' };
const researchTab: { key: GameViewId; label: string; symbol: string; icon?: string } = { key: 'research', label: 'Research', symbol: '', icon: APP_ICONS.research };
const SIMULUCIUS_TUTORIAL_BUTTON = require('../assets/simulucius/frontremovebg.png');

export default function HomeScreen() {
  const activeCompany = useCompanySessionStore((state) => state.activeCompany);
  return activeCompany ? <GameShell companyName={activeCompany.displayName} /> : <LoginView />;
}

function GameShell({ companyName }: { companyName: string }) {
  const [activeView, setActiveView] = useState<ActiveScreen>('company');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [showActiveRecipeInputs, setShowActiveRecipeInputs] = useState(false);
  const [isConstructionYardOpen, setIsConstructionYardOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isProductionTutorialOpen, setIsProductionTutorialOpen] = useState(false);
  const [hasProductionTutorialStarted, setHasProductionTutorialStarted] = useState(false);
  const [isBuildFacilityTutorialOpen, setIsBuildFacilityTutorialOpen] = useState(false);
  const [firstBuiltFacilityType, setFirstBuiltFacilityType] = useState<FacilityType | null>(null);
  const [isFirstFacilityTutorialOpen, setIsFirstFacilityTutorialOpen] = useState(false);
  const [isConstructionTutorialOpen, setIsConstructionTutorialOpen] = useState(false);
  const [buildFacilityButtonLayout, setBuildFacilityButtonLayout] = useState<{ height: number; width: number; x: number; y: number } | null>(null);
  const [pendingConstruction, setPendingConstruction] = useState<import('@/game').FacilityType | null>(null);
  const [pendingDestruction, setPendingDestruction] = useState<string | null>(null);
  const inventory = useGameStore((state) => state.inventory);
  const market = useGameStore((state) => state.market);
  const facilities = useGameStore((state) => state.facilities);
  const finance = useGameStore((state) => state.finance);
  const salesContracts = useGameStore((state) => state.salesContracts);
  const achievements = useGameStore((state) => state.achievements);
  const productionStatistics = useGameStore((state) => state.productionStatistics);
  const prestige = useGameStore((state) => state.prestige);
  const research = useGameStore((state) => state.research);
  const companyStartedAtGameTimeMs = useGameStore((state) => state.companyStartedAtGameTimeMs);
  const lastProcessedAtMs = useGameStore((state) => state.lastProcessedAtMs);
  const customerPipelineProgress = useGameStore((state) => state.customerPipelineProgress);
  const buildFacility = useGameStore((state) => state.buildFacility);
  const buyMissingConstructionMaterials = useGameStore((state) => state.buyMissingConstructionMaterials);
  const sellFacility = useGameStore((state) => state.sellFacility);
  const acknowledgeCollectionNotice = useGameStore((state) => state.acknowledgeCollectionNotice);
  const acceptDebtRestructure = useGameStore((state) => state.acceptDebtRestructure);
  const setFacilityRecipe = useGameStore((state) => state.setFacilityRecipe);
  const setFacilityProductionActive = useGameStore((state) => state.setFacilityProductionActive);
  const setFacilityWorkers = useGameStore((state) => state.setFacilityWorkers);
  const repairFacility = useGameStore((state) => state.repairFacility);
  const upgradeFacility = useGameStore((state) => state.upgradeFacility);
  const fastForwardOneMinute = useGameStore((state) => state.fastForwardOneMinute);
  const advanceGameTime = useGameStore((state) => state.advanceGameTime);
  const advanceRealtime = useGameStore((state) => state.advanceRealtime);
  const createSalesContractRequest = useGameStore((state) => state.createSalesContractRequest);
  const setInventoryAmount = useGameStore((state) => state.setInventoryAmount);
  const addAdminFunds = useGameStore((state) => state.addAdminFunds);
  const setAdminBalance = useGameStore((state) => state.setAdminBalance);
  const buyMarketResource = useGameStore((state) => state.buyMarketResource);
  const sellMarketResource = useGameStore((state) => state.sellMarketResource);
  const setMarketAutomation = useGameStore((state) => state.setMarketAutomation);
  const fulfillSalesContract = useGameStore((state) => state.fulfillSalesContract);
  const rejectSalesContract = useGameStore((state) => state.rejectSalesContract);
  const getResearchAvailability = useGameStore((state) => state.getResearchAvailability);
  const startResearch = useGameStore((state) => state.startResearch);
  const cancelResearch = useGameStore((state) => state.cancelResearch);
  const acceptLoanOffer = useGameStore((state) => state.acceptLoanOffer);
  const removeLoanOffer = useGameStore((state) => state.removeLoanOffer);
  const removeUnavailableLoanOffers = useGameStore((state) => state.removeUnavailableLoanOffers);
  const makeExtraLoanPayment = useGameStore((state) => state.makeExtraLoanPayment);
  const repayLoanInFull = useGameStore((state) => state.repayLoanInFull);
  const startLoanSearch = useGameStore((state) => state.startLoanSearch);
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
  const maximumOpenContracts = getMaximumOpenSalesContracts(research.getCompletedProjectIds());
  const completeActivityInstantly = (_processId: string, remainingMs: number) => {
    advanceRealtime(Date.now());
    advanceGameTime(remainingMs);
  };

  useEffect(() => {
    setIsTutorialOpen(!tutorial.completedWelcome);
    if (!tutorial.completedWelcome) {
      setActiveView('company');
      setTutorialStep(1);
      setIsProductionTutorialOpen(false);
      setHasProductionTutorialStarted(false);
      setIsBuildFacilityTutorialOpen(false);
      setFirstBuiltFacilityType(null);
      setIsFirstFacilityTutorialOpen(false);
      setIsConstructionTutorialOpen(false);
    } else {
      setIsProductionTutorialOpen(false);
      setIsBuildFacilityTutorialOpen(false);
      setFirstBuiltFacilityType(null);
      setIsFirstFacilityTutorialOpen(false);
      setIsConstructionTutorialOpen(false);
    }
  }, [tutorial.completedWelcome]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}><View style={styles.topBar}>
          <View style={styles.balanceInline}>
            <View accessibilityLabel={isTutorialOpen && tutorialStep === 2 ? 'Tutorial highlighted company balance' : undefined} style={styles.balanceAmount}>
              <MaterialCommunityIcons accessibilityLabel="Balance icon" color={colors.onDark} name={APP_ICONS.currency} size={21} />
              <Text style={styles.balanceInlineValue}>{formatCurrency(finance.getBalance())}</Text>
            </View>
            {tutorial.completedWelcome && <Pressable accessibilityLabel="Open company prestige" accessibilityRole="button" onPress={() => setIsPrestigeOpen(true)} style={styles.prestigeInline}><MaterialCommunityIcons color={colors.onDark} name={APP_ICONS.achievements} size={17} /><Text style={styles.prestigeInlineValue}>{formatNumber(prestigeSummary.totalPrestige, { smartDecimals: true })}</Text></Pressable>}
          </View>
          <View style={styles.headerActions}>
            {tutorial.completedWelcome && <IconButton accessibilityLabel="Fast-forward one minute" icon={APP_ICONS.fastForward} iconColor={colors.onDark} onPress={fastForwardOneMinute} />}
            <View accessibilityLabel={isTutorialOpen && tutorialStep === 3 ? 'Tutorial highlighted company time' : `Time ${formatElapsedTime(elapsedForegroundTimeMs)}`} style={styles.headerElapsedTime}><MaterialCommunityIcons color={colors.onDark} name={APP_ICONS.elapsedTime} size={17} /><Text style={styles.headerElapsedTimeValue}>{formatElapsedTime(elapsedForegroundTimeMs)}</Text></View>
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
          {activeView === 'admin' && isAdminDashboardAvailable ? <AdminDashboard isTutorialEnabled={!tutorial.completedWelcome} onAddFunds={addAdminFunds} onClearAllLocalData={clearAllLocalData} onCreateContractRequest={createSalesContractRequest} onDeleteCompany={deleteActiveCompany} onDisableTutorial={completeWelcomeTutorial} onEnableTutorial={reopenWelcomeTutorial} onSetBalance={setAdminBalance} onSetInventoryAmount={setInventoryAmount} />
            : activeView === 'achievements' ? <AchievementsView achievements={achievements} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={lastProcessedAtMs} facilities={facilities} finance={finance} prestige={prestige} productionStatistics={productionStatistics} salesContracts={salesContracts} />
                : activeView === 'profile' ? <ProfileScreen companyName={companyName} onDeleteCompany={deleteActiveCompany} onManageCompanies={logout} onReplayTutorial={reopenWelcomeTutorial} playerName={playerName} />
                : activeView === 'research' ? <ResearchView facilities={facilities} finance={finance} getAvailability={getResearchAvailability} onCancel={cancelResearch} onStart={startResearch} research={research} />
                : activeView === 'settings' ? <SettingsScreen onLogout={logout} />
                  : activeView === 'leaderboard' ? <LeaderboardScreen />
                    : activeView === 'pedia' ? <IndustriPediaView market={market} />
                    : <GameViewContent achievements={achievements} activeTab={activeView === 'admin' ? 'company' : activeView} buyMarketResource={buyMarketResource} companyName={companyName} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={lastProcessedAtMs} customerPipelineProgress={customerPipelineProgress} facilities={facilities} finance={finance} fulfillSalesContract={fulfillSalesContract} getResearchAvailability={getResearchAvailability} inventory={inventory} isBuildFacilityTutorial={isBuildFacilityTutorialOpen} market={market} maximumOpenContracts={maximumOpenContracts} onAcceptLoanOffer={acceptLoanOffer} onBuildFacilityLayout={setBuildFacilityButtonLayout} onExtraLoanPayment={makeExtraLoanPayment} onRemoveLoanOffer={removeLoanOffer} onRemoveUnavailableLoanOffers={removeUnavailableLoanOffers} onRepayLoanInFull={repayLoanInFull} onStartLoanSearch={startLoanSearch} onlyInStock={onlyInStock} openConstructionYard={() => { if (isBuildFacilityTutorialOpen) setIsBuildFacilityTutorialOpen(false); setIsConstructionYardOpen(true); if (isBuildFacilityTutorialOpen) setIsConstructionTutorialOpen(true); }} rejectSalesContract={rejectSalesContract} repairFacility={repairFacility} requestFacilityDestruction={setPendingDestruction} research={research} salesContracts={salesContracts} sellMarketResource={sellMarketResource} setFacilityProductionActive={setFacilityProductionActive} setFacilityRecipe={setFacilityRecipe} setFacilityWorkers={setFacilityWorkers} setMarketAutomation={setMarketAutomation} setOnlyInStock={setOnlyInStock} setShowActiveRecipeInputs={setShowActiveRecipeInputs} showActiveRecipeInputs={showActiveRecipeInputs} startResearch={startResearch} upgradeFacility={upgradeFacility} />}
        </ScrollView>
        {tutorial.completedWelcome && <ActiveProcessesOverlay customerPipelineProgress={customerPipelineProgress} facilities={facilities} finance={finance} inventory={inventory} maximumOpenContracts={maximumOpenContracts} onCompleteProcess={completeActivityInstantly} research={research} salesContracts={salesContracts} showInstantCompletion={isAdminDashboardAvailable} />}
        <View style={styles.bottomNavigation}>{(tutorial.completedWelcome ? [...tabs.slice(0, 3), salesTab, researchTab, ...tabs.slice(3)] : tutorialStep === 5 ? [tabs[0], tabs[2]] : [tabs[0]]).map((tab) => <BottomNavigationItem active={activeView === tab.key} highlight={tutorialStep === 5 && activeView !== 'production' && tab.key === 'production'} icon={tab.icon} key={tab.key} label={tab.label} onPress={() => { setActiveView(tab.key); if (tutorial.completedWelcome) return; if (tab.key === 'company') { setIsProductionTutorialOpen(false); setIsBuildFacilityTutorialOpen(false); setIsTutorialOpen(true); } if (tab.key === 'production') { setIsTutorialOpen(false); hasProductionTutorialStarted ? setIsBuildFacilityTutorialOpen(true) : setIsProductionTutorialOpen(true); } }} symbol={tab.symbol} />)}</View>
      </View>
      <FacilityConstructionDialog facilities={facilities} finance={finance} inventory={inventory} isConstructionYardOpen={isConstructionYardOpen} market={market} onBuyMissingConstructionMaterials={() => { if (pendingConstruction) buyMissingConstructionMaterials(pendingConstruction); }} onCloseConstructionYard={() => setIsConstructionYardOpen(false)} onConfirmConstruction={() => { if (pendingConstruction && buildFacility(pendingConstruction)) { if (facilities.getAll().length === 0 && !tutorial.completedWelcome) { setFirstBuiltFacilityType(pendingConstruction); setIsFirstFacilityTutorialOpen(true); } setPendingConstruction(null); } }} onConfirmDestruction={() => { if (pendingDestruction && sellFacility(pendingDestruction)) setPendingDestruction(null); }} onDismissConstruction={() => setPendingConstruction(null)} onDismissDestruction={() => setPendingDestruction(null)} onSelectFacility={(facilityType) => { setIsConstructionYardOpen(false); setPendingConstruction(facilityType); }} pendingConstruction={pendingConstruction} pendingDestruction={pendingDestruction} />
      <PrestigeDialog currentGameTimeMs={lastProcessedAtMs} facilityConditions={facilities.getAll().map((facility) => facility.getView().facilityCondition)} isOpen={isPrestigeOpen} onClose={() => setIsPrestigeOpen(false)} summary={prestigeSummary} />
      <CollectionDialog finance={finance} onAcceptRestructure={acceptDebtRestructure} onAcknowledge={acknowledgeCollectionNotice} />
      {!tutorial.completedWelcome && ((activeView === 'company' && !isTutorialOpen) || (activeView === 'production' && !isProductionTutorialOpen && !isBuildFacilityTutorialOpen && !isFirstFacilityTutorialOpen)) && <View style={styles.tutorialReopenControl}><Pressable accessibilityLabel="Reopen tutorial" accessibilityRole="button" onPress={() => { if (activeView === 'company') setIsTutorialOpen(true); if (activeView === 'production') firstBuiltFacilityType ? setIsFirstFacilityTutorialOpen(true) : hasProductionTutorialStarted ? setIsBuildFacilityTutorialOpen(true) : setIsProductionTutorialOpen(true); }} style={styles.tutorialReopenButton}><Image accessibilityLabel="Simulucius" resizeMode="contain" source={SIMULUCIUS_TUTORIAL_BUTTON} style={styles.tutorialReopenCharacter} /></Pressable><IconButton accessibilityLabel="Exit tutorial" icon="close" onPress={() => { void completeWelcomeTutorial(); }} size={16} style={styles.tutorialReopenCloseButton} /></View>}
      <TutorialGuideDialog balance={formatCurrency(finance.getBalance())} elapsedTime={formatElapsedTime(elapsedForegroundTimeMs)} onBack={() => setTutorialStep((currentStep) => Math.max(1, currentStep - 1) as 1 | 2 | 3 | 4 | 5)} onDismiss={() => setIsTutorialOpen(false)} onExit={() => { void completeWelcomeTutorial(); }} onNext={() => { if (tutorialStep === 5) { setActiveView('production'); setIsTutorialOpen(false); setIsProductionTutorialOpen(true); } else setTutorialStep((currentStep) => (currentStep + 1) as 1 | 2 | 3 | 4 | 5); }} step={tutorialStep} visible={isTutorialOpen && activeView === 'company'} />
      <ProductionTutorialDialog onBack={() => { setActiveView('company'); setIsProductionTutorialOpen(false); setIsTutorialOpen(true); }} onClose={() => { setHasProductionTutorialStarted(true); setIsProductionTutorialOpen(false); setIsBuildFacilityTutorialOpen(true); }} onDismiss={() => setIsProductionTutorialOpen(false)} onExit={() => { void completeWelcomeTutorial(); }} visible={isProductionTutorialOpen && activeView === 'production'} />
      <BuildFacilityTutorialDialog highlightLayout={buildFacilityButtonLayout} onBack={() => { setHasProductionTutorialStarted(false); setIsBuildFacilityTutorialOpen(false); setIsProductionTutorialOpen(true); }} onDismiss={() => setIsBuildFacilityTutorialOpen(false)} onExit={() => { void completeWelcomeTutorial(); }} onNext={() => { setIsBuildFacilityTutorialOpen(false); setIsConstructionYardOpen(true); setIsConstructionTutorialOpen(true); }} visible={isBuildFacilityTutorialOpen && activeView === 'production' && !isTutorialOpen && !isProductionTutorialOpen && !isFirstFacilityTutorialOpen && !isConstructionTutorialOpen} />
      <ConstructionTutorialDialog onBack={() => { setIsConstructionTutorialOpen(false); setIsConstructionYardOpen(false); setIsBuildFacilityTutorialOpen(true); }} onDismiss={() => setIsConstructionTutorialOpen(false)} onExit={() => { void completeWelcomeTutorial(); }} onNext={() => setIsConstructionTutorialOpen(false)} visible={isConstructionTutorialOpen && activeView === 'production'} />
      <FirstFacilityTutorialDialog facilityType={firstBuiltFacilityType} onBack={() => { setIsFirstFacilityTutorialOpen(false); setIsBuildFacilityTutorialOpen(true); }} onDismiss={() => setIsFirstFacilityTutorialOpen(false)} onExit={() => { void completeWelcomeTutorial(); }} onNext={() => { void completeWelcomeTutorial(); }} visible={isFirstFacilityTutorialOpen && activeView === 'production'} />
    </SafeAreaView>
  );
}

function BottomNavigationItem({ active, highlight, icon, label, onPress, symbol }: { active: boolean; highlight?: boolean; icon?: string; label: string; onPress: () => void; symbol: string }) {
  const activeStyle: StyleProp<ViewStyle> = active ? styles.activeNavigationItem : undefined;
  return <Pressable accessibilityLabel={`${label} tab`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.navigationItem, activeStyle, highlight && styles.tutorialProductionNavigation]}>{icon ? <MaterialCommunityIcons color={active ? colors.primary : colors.muted} name={icon as never} size={18} /> : <Text style={[styles.navigationSymbol, active && styles.activeNavigationText]}>{symbol}</Text>}<Text style={[styles.navigationLabel, active && styles.activeNavigationText]}>{label}</Text></Pressable>;
}
