import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { Avatar, Divider, IconButton, Menu, Portal, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_ICONS, ECONOMY_PHASE_ICONS } from '@/icons';
import { calculateCompanyPrestigeSummary, getMaximumOpenSalesOrders, type FacilityType, useCompanySessionStore, useGameStore } from '@/game';
import { colors } from '@/theme';
import { ActiveProcessesOverlay, AdminDashboard, AchievementsView, CollectionDialog, ConstructionConfirmationTutorialDialog, ConstructionTutorialDialog, FacilityChoiceTutorialDialog, FirstFacilityTutorialDialog, GameViewContent, FacilityConstructionDialog, BuildFacilityTutorialDialog, IndustriPediaView, isDevAdminSurfaceAvailable, LeaderboardScreen, PrestigeDialog, ProfileScreen, ResearchView, SettingsScreen, styles, ProductionTutorialDialog, TutorialGuideDialog, LoginView, type GameViewId } from '@/ui';
import { formatCurrency, formatElapsedTime, formatNumber } from '@/utils';
import { TooltipMaterialIcon } from '@/ui/dashboard/components/IconTooltip';

type ActiveScreen = GameViewId | 'achievements' | 'admin' | 'profile' | 'pedia' | 'settings' | 'leaderboard';

type TutorialStage =
  | { kind: 'welcome'; step: 1 | 2 | 3 | 4 | 5 }
  | { kind: 'production' }
  | { kind: 'build-facility' }
  | { kind: 'construction' }
  | { kind: 'facility-choice' }
  | { kind: 'construction-confirmation' }
  | { kind: 'first-facility' }
  | null;

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
  const [pediaInitialSection, setPediaInitialSection] = useState<'resources' | 'economy'>('resources');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [showActiveRecipeInputs, setShowActiveRecipeInputs] = useState(false);
  const [isConstructionYardOpen, setIsConstructionYardOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [tutorialStage, setTutorialStage] = useState<TutorialStage>(null);
  const [lastTutorialStage, setLastTutorialStage] = useState<Exclude<TutorialStage, null>>({ kind: 'welcome', step: 1 });
  const [hasStartedProductionTutorial, setHasStartedProductionTutorial] = useState(false);
  const [firstBuiltFacilityType, setFirstBuiltFacilityType] = useState<FacilityType | null>(null);
  const [buildFacilityButtonLayout, setBuildFacilityButtonLayout] = useState<{ height: number; width: number; x: number; y: number } | null>(null);
  const [companyOverviewLayout, setCompanyOverviewLayout] = useState<{ height: number; width: number; x: number; y: number } | null>(null);
  const [pendingConstruction, setPendingConstruction] = useState<import('@/game').FacilityType | null>(null);
  const [pendingDestruction, setPendingDestruction] = useState<string | null>(null);
  const inventory = useGameStore((state) => state.inventory);
  const resourceFlow = useGameStore((state) => state.resourceFlow);
  const market = useGameStore((state) => state.market);
  const facilities = useGameStore((state) => state.facilities);
  const finance = useGameStore((state) => state.finance);
  const salesOrders = useGameStore((state) => state.salesOrders);
  const achievements = useGameStore((state) => state.achievements);
  const facilityMaintenance = useGameStore((state) => state.facilityMaintenance);
  const prestige = useGameStore((state) => state.prestige);
  const research = useGameStore((state) => state.research);
  const companyStartedAtGameTimeMs = useGameStore((state) => state.companyStartedAtGameTimeMs);
  const lastProcessedAtMs = useGameStore((state) => state.lastProcessedAtMs);
  const customerPipelineProgress = useGameStore((state) => state.customerPipelineProgress);
  const buildFacility = useGameStore((state) => state.buildFacility);
  const buyMissingConstructionInputs = useGameStore((state) => state.buyMissingConstructionInputs);
  const sellFacility = useGameStore((state) => state.sellFacility);
  const acknowledgeCollectionNotice = useGameStore((state) => state.acknowledgeCollectionNotice);
  const acceptDebtRestructure = useGameStore((state) => state.acceptDebtRestructure);
  const setFacilityProductionCycle = useGameStore((state) => state.setFacilityProductionCycle);
  const setFacilityProductionActive = useGameStore((state) => state.setFacilityProductionActive);
  const setFacilityWorkers = useGameStore((state) => state.setFacilityWorkers);
  const repairFacility = useGameStore((state) => state.repairFacility);
  const upgradeFacility = useGameStore((state) => state.upgradeFacility);
  const fastForwardOneMinute = useGameStore((state) => state.fastForwardOneMinute);
  const advanceGameTime = useGameStore((state) => state.advanceGameTime);
  const advanceRealtime = useGameStore((state) => state.advanceRealtime);
  const createSalesOrderRequest = useGameStore((state) => state.createSalesOrderRequest);
  const getSalesOrderAcquisitionStatus = useGameStore((state) => state.getSalesOrderAcquisitionStatus);
  const setInventoryAmount = useGameStore((state) => state.setInventoryAmount);
  const addAdminFunds = useGameStore((state) => state.addAdminFunds);
  const setAdminBalance = useGameStore((state) => state.setAdminBalance);
  const buyMarketResource = useGameStore((state) => state.buyMarketResource);
  const sellMarketResource = useGameStore((state) => state.sellMarketResource);
  const setMarketAutomation = useGameStore((state) => state.setMarketAutomation);
  const fulfillSalesOrder = useGameStore((state) => state.fulfillSalesOrder);
  const rejectSalesOrder = useGameStore((state) => state.rejectSalesOrder);
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
  const maximumOpenOrders = getMaximumOpenSalesOrders(research.getCompletedProjectIds());
  const salesOrderAcquisition = getSalesOrderAcquisitionStatus();
  const isTutorialOpen = tutorialStage?.kind === 'welcome';
  const tutorialStep = tutorialStage?.kind === 'welcome' ? tutorialStage.step : 1;
  const isProductionTutorialOpen = tutorialStage?.kind === 'production';
  const isBuildFacilityTutorialOpen = tutorialStage?.kind === 'build-facility';
  const isFirstFacilityTutorialOpen = tutorialStage?.kind === 'first-facility';
  const isConstructionTutorialOpen = tutorialStage?.kind === 'construction';
  const isFacilityChoiceTutorialOpen = tutorialStage?.kind === 'facility-choice';
  const isConstructionConfirmationTutorialOpen = tutorialStage?.kind === 'construction-confirmation';
  const dismissTutorial = () => {
    if (tutorialStage) setLastTutorialStage(tutorialStage);
    setTutorialStage(null);
  };
  const dismissTutorialOrGameDialog = (dismissGameDialog: () => void) => {
    if (tutorialStage) dismissTutorial();
    else dismissGameDialog();
  };
  const advancePastConstructionConfirmation = () => {
    const firstFacility = facilities.getAll()[0];
    if (firstFacility) {
      setPendingConstruction(null);
      setIsConstructionYardOpen(false);
      setFirstBuiltFacilityType(firstFacility.getView().facilityType);
      setTutorialStage({ kind: 'first-facility' });
    } else if (pendingConstruction) {
      dismissTutorial();
    } else {
      setTutorialStage({ kind: 'build-facility' });
    }
  };
  const advancePastFacilityChoice = () => {
    const firstFacility = facilities.getAll()[0];
    if (firstFacility) {
      setFirstBuiltFacilityType(firstFacility.getView().facilityType);
      setPendingConstruction(null);
      setIsConstructionYardOpen(false);
      setTutorialStage({ kind: 'first-facility' });
    } else if (pendingConstruction) {
      setTutorialStage({ kind: 'construction-confirmation' });
    } else {
      dismissTutorial();
    }
  };
  const reopenTutorial = () => {
    const firstFacility = facilities.getAll()[0];
    const recoveredStage = lastTutorialStage.kind === 'construction-confirmation' && firstFacility
      ? { kind: 'first-facility' as const }
      : lastTutorialStage.kind === 'construction-confirmation' && !pendingConstruction
        ? { kind: 'build-facility' as const }
      : lastTutorialStage.kind === 'first-facility' && !firstFacility
        ? { kind: 'build-facility' as const }
        : lastTutorialStage;
    if (firstFacility && recoveredStage.kind === 'first-facility') setFirstBuiltFacilityType(firstFacility.getView().facilityType);
    if (recoveredStage.kind === 'first-facility') {
      setPendingConstruction(null);
      setIsConstructionYardOpen(false);
    }
    setTutorialStage(recoveredStage);
    if (recoveredStage.kind === 'welcome') setActiveView('company');
    else {
      setActiveView('production');
      if (recoveredStage.kind === 'construction' || recoveredStage.kind === 'facility-choice') setIsConstructionYardOpen(true);
    }
  };
  const economyPhase = finance.getEconomyPhase();
  const economyPhaseColor = economyPhase === 'crash' || economyPhase === 'recession' ? colors.error : economyPhase === 'stable' ? colors.onDark : colors.paleGreen;
  const completeActivityInstantly = (_processId: string, remainingMs: number) => {
    advanceRealtime(Date.now());
    advanceGameTime(remainingMs);
  };

  useEffect(() => {
      setTutorialStage(tutorial.completedWelcome ? null : { kind: 'welcome', step: 1 });
      if (!tutorial.completedWelcome) setLastTutorialStage({ kind: 'welcome', step: 1 });
    if (!tutorial.completedWelcome) {
      setActiveView('company');
      setHasStartedProductionTutorial(false);
      setFirstBuiltFacilityType(facilities.getAll()[0]?.getView().facilityType ?? null);
    } else {
      setFirstBuiltFacilityType(null);
    }
  }, [tutorial.completedWelcome]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}><View style={styles.topBar}>
          <View style={styles.balanceInline}>
            <Pressable accessibilityLabel={isTutorialOpen && tutorialStep === 2 ? 'Tutorial highlighted company balance' : 'Open Finance'} accessibilityRole="button" onPress={() => setActiveView('finance')} style={styles.balanceAmount}>
              <MaterialCommunityIcons accessibilityLabel="Balance icon" color={colors.onDark} name={APP_ICONS.currency} size={21} />
              <Text style={styles.balanceInlineValue}>{formatCurrency(finance.getBalance())}</Text>
            </Pressable>
            {tutorial.completedWelcome && <Pressable accessibilityLabel="Open company prestige" accessibilityRole="button" onPress={() => setIsPrestigeOpen(true)} style={styles.prestigeInline}><MaterialCommunityIcons color={colors.onDark} name={APP_ICONS.achievements} size={17} /><Text style={styles.prestigeInlineValue}>{formatNumber(prestigeSummary.totalPrestige, { smartDecimals: true })}</Text></Pressable>}
          </View>
          <View style={styles.headerActions}>
            {tutorial.completedWelcome && <View accessibilityLabel={`Economy: ${economyPhase}`} style={styles.headerElapsedTime}><TooltipMaterialIcon color={economyPhaseColor} label={`${economyPhase} economy`} name={ECONOMY_PHASE_ICONS[economyPhase]} size={18} /></View>}
            {tutorial.completedWelcome && <IconButton accessibilityLabel="Fast-forward one minute" icon={APP_ICONS.fastForward} iconColor={colors.onDark} onPress={fastForwardOneMinute} />}
            <View accessibilityLabel={isTutorialOpen && tutorialStep === 3 ? 'Tutorial highlighted company time' : `Time ${formatElapsedTime(elapsedForegroundTimeMs)}`} style={styles.headerElapsedTime}><TooltipMaterialIcon color={colors.onDark} label="Elapsed game time" name={APP_ICONS.elapsedTime} size={17} /><Text style={styles.headerElapsedTimeValue}>{formatElapsedTime(elapsedForegroundTimeMs)}</Text></View>
            <Menu anchor={<Pressable accessibilityLabel="Open profile menu" accessibilityRole="button" onPress={() => setIsProfileMenuOpen(true)} style={styles.profileButton}><Avatar.Text label={companyName.slice(0, 2).toUpperCase()} size={38} style={styles.avatar} /></Pressable>} onDismiss={() => setIsProfileMenuOpen(false)} visible={isProfileMenuOpen}>
              <Menu.Item leadingIcon={APP_ICONS.account} onPress={() => { setIsProfileMenuOpen(false); setActiveView('profile'); }} title="Profile" />
              <Menu.Item leadingIcon={APP_ICONS.settings} onPress={() => { setIsProfileMenuOpen(false); setActiveView('settings'); }} title="Settings" />
              <Menu.Item leadingIcon="format-list-numbered" onPress={() => { setIsProfileMenuOpen(false); setActiveView('leaderboard'); }} title="Leaderboard" />
              <Menu.Item leadingIcon={APP_ICONS.help} onPress={() => { setIsProfileMenuOpen(false); setPediaInitialSection('resources'); setActiveView('pedia'); }} title="IndustriPedia" />
              <Menu.Item leadingIcon={APP_ICONS.achievements} onPress={() => { setIsProfileMenuOpen(false); setActiveView('achievements'); }} title="Achievements" />
              {isAdminDashboardAvailable && <Menu.Item leadingIcon={APP_ICONS.shield} onPress={() => { setIsProfileMenuOpen(false); setActiveView('admin'); }} title="Admin Dashboard" />}
              <Divider />
              <Menu.Item leadingIcon={APP_ICONS.logout} onPress={() => { setIsProfileMenuOpen(false); void logout(); }} title="Log out" />
            </Menu>
          </View>
        </View></View>
        <ScrollView contentContainerStyle={[styles.content, tutorialStage && styles.tutorialScrollableContent]} nestedScrollEnabled showsVerticalScrollIndicator={activeView === 'production'}>
          {activeView === 'admin' && isAdminDashboardAvailable ? <AdminDashboard isTutorialEnabled={!tutorial.completedWelcome} onAddFunds={addAdminFunds} onClearAllLocalData={clearAllLocalData} onCreateSalesOrderRequest={createSalesOrderRequest} onDeleteCompany={deleteActiveCompany} onDisableTutorial={completeWelcomeTutorial} onEnableTutorial={reopenWelcomeTutorial} onSetBalance={setAdminBalance} onSetInventoryAmount={setInventoryAmount} />
            : activeView === 'achievements' ? <AchievementsView achievements={achievements} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={lastProcessedAtMs} facilities={facilities} facilityMaintenance={facilityMaintenance} finance={finance} prestige={prestige} resourceFlow={resourceFlow} salesOrders={salesOrders} />
                : activeView === 'profile' ? <ProfileScreen companyName={companyName} onDeleteCompany={deleteActiveCompany} onManageCompanies={logout} onReplayTutorial={reopenWelcomeTutorial} playerName={playerName} />
                : activeView === 'research' ? <ResearchView facilities={facilities} finance={finance} getAvailability={getResearchAvailability} market={market} onCancel={cancelResearch} onStart={startResearch} research={research} />
                : activeView === 'settings' ? <SettingsScreen onLogout={logout} />
                  : activeView === 'leaderboard' ? <LeaderboardScreen />
                    : activeView === 'pedia' ? <IndustriPediaView companyPrestige={prestigeSummary.totalPrestige} currentGameTimeMs={lastProcessedAtMs} economyPhase={economyPhase} initialSection={pediaInitialSection} market={market} salesOrders={salesOrders} />
                    : <GameViewContent achievements={achievements} activeTab={activeView === 'admin' ? 'company' : activeView} buyMarketResource={buyMarketResource} companyName={companyName} companyPrestige={prestigeSummary.totalPrestige} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={lastProcessedAtMs} customerPipelineProgress={customerPipelineProgress} facilities={facilities} finance={finance} fulfillSalesOrder={fulfillSalesOrder} getResearchAvailability={getResearchAvailability} inventory={inventory} isBuildFacilityTutorial={isBuildFacilityTutorialOpen} isFirstFacilityTutorial={isFirstFacilityTutorialOpen} isProductionTutorial={isProductionTutorialOpen} market={market} maximumOpenOrders={maximumOpenOrders} onAcceptLoanOffer={acceptLoanOffer} onBuildFacilityLayout={setBuildFacilityButtonLayout} onCompanyOverviewLayout={setCompanyOverviewLayout} onExtraLoanPayment={makeExtraLoanPayment} onRemoveLoanOffer={removeLoanOffer} onRemoveUnavailableLoanOffers={removeUnavailableLoanOffers} onRepayLoanInFull={repayLoanInFull} onStartLoanSearch={startLoanSearch} onlyInStock={onlyInStock} openConstructionYard={() => { const wasBuildTutorialOpen = isBuildFacilityTutorialOpen; if (wasBuildTutorialOpen) setTutorialStage(null); setIsConstructionYardOpen(true); if (wasBuildTutorialOpen) setTutorialStage({ kind: 'construction' }); }} rejectSalesOrder={rejectSalesOrder} repairFacility={repairFacility} requestFacilityDestruction={setPendingDestruction} research={research} resourceFlow={resourceFlow} salesOrderAcquisition={salesOrderAcquisition} salesOrders={salesOrders} sellMarketResource={sellMarketResource} setFacilityProductionActive={setFacilityProductionActive} setFacilityProductionCycle={setFacilityProductionCycle} setFacilityWorkers={setFacilityWorkers} setMarketAutomation={setMarketAutomation} setOnlyInStock={setOnlyInStock} setShowActiveRecipeInputs={setShowActiveRecipeInputs} showActiveRecipeInputs={showActiveRecipeInputs} startResearch={startResearch} upgradeFacility={upgradeFacility} />}

        </ScrollView>
        {tutorial.completedWelcome && <ActiveProcessesOverlay customerPipelineProgress={customerPipelineProgress} facilities={facilities} finance={finance} inventory={inventory} maximumOpenOrders={maximumOpenOrders} onCompleteProcess={completeActivityInstantly} research={research} salesOrders={salesOrders} showInstantCompletion={isAdminDashboardAvailable} />}
        <View style={styles.bottomNavigation}>{(tutorial.completedWelcome ? [...tabs.slice(0, 3), salesTab, researchTab, ...tabs.slice(3)] : tutorialStep === 5 ? [tabs[0], tabs[2]] : [tabs[0]]).map((tab) => <BottomNavigationItem active={activeView === tab.key} highlight={tutorialStep === 5 && activeView !== 'production' && tab.key === 'production'} icon={tab.icon} key={tab.key} label={tab.label} onPress={() => { setActiveView(tab.key); if (tutorial.completedWelcome) return; if (tab.key === 'company') setTutorialStage({ kind: 'welcome', step: tutorialStep }); if (tab.key === 'production') setTutorialStage({ kind: hasStartedProductionTutorial ? 'build-facility' : 'production' }); }} symbol={tab.symbol} />)}</View>
      </View>
      <FacilityConstructionDialog facilities={facilities} finance={finance} inventory={inventory} isConstructionTutorial={isConstructionTutorialOpen || isFacilityChoiceTutorialOpen || isConstructionConfirmationTutorialOpen} isFacilitySelectionEnabled={isConstructionTutorialOpen || isFacilityChoiceTutorialOpen} isConstructionYardOpen={isConstructionYardOpen} market={market} onBuyMissingConstructionInputs={() => { if (pendingConstruction) buyMissingConstructionInputs(pendingConstruction); }} onCloseConstructionYard={() => dismissTutorialOrGameDialog(() => setIsConstructionYardOpen(false))} onConfirmConstruction={() => { const isFirstFacility = facilities.getAll().length === 0; if (pendingConstruction && buildFacility(pendingConstruction)) { if (isFirstFacility && !tutorial.completedWelcome) { setFirstBuiltFacilityType(pendingConstruction); setTutorialStage({ kind: 'first-facility' }); } setPendingConstruction(null); } }} onConfirmDestruction={() => { if (pendingDestruction && sellFacility(pendingDestruction)) setPendingDestruction(null); }} onDismissConstruction={() => dismissTutorialOrGameDialog(() => setPendingConstruction(null))} onDismissDestruction={() => dismissTutorialOrGameDialog(() => setPendingDestruction(null))} onSelectFacility={(facilityType) => { if (isConstructionTutorialOpen) { setTutorialStage({ kind: 'facility-choice' }); return; } setIsConstructionYardOpen(false); setPendingConstruction(facilityType); if (!tutorial.completedWelcome) setTutorialStage({ kind: 'construction-confirmation' }); }} pendingConstruction={pendingConstruction} pendingDestruction={pendingDestruction} />
      <PrestigeDialog currentGameTimeMs={lastProcessedAtMs} facilityConditions={facilities.getAll().map((facility) => facility.getView().facilityCondition)} isOpen={isPrestigeOpen} onClose={() => dismissTutorialOrGameDialog(() => setIsPrestigeOpen(false))} summary={prestigeSummary} />
      <CollectionDialog finance={finance} onAcceptRestructure={acceptDebtRestructure} onAcknowledge={acknowledgeCollectionNotice} />
      {!tutorial.completedWelcome && ((activeView === 'company' && !isTutorialOpen) || (activeView === 'production' && tutorialStage === null)) && <Portal><View style={styles.tutorialReopenControl}><Pressable accessibilityLabel="Reopen tutorial" accessibilityRole="button" onPress={reopenTutorial} style={styles.tutorialReopenButton}><Image accessibilityLabel="Simulucius" resizeMode="contain" source={SIMULUCIUS_TUTORIAL_BUTTON} style={styles.tutorialReopenCharacter} /></Pressable><IconButton accessibilityLabel="Exit tutorial" icon="close" onPress={() => { void completeWelcomeTutorial(); }} size={16} style={styles.tutorialReopenCloseButton} /></View></Portal>}
      <TutorialGuideDialog balance={formatCurrency(finance.getBalance())} companyOverviewLayout={companyOverviewLayout} elapsedTime={formatElapsedTime(elapsedForegroundTimeMs)} onBack={() => setTutorialStage({ kind: 'welcome', step: Math.max(1, tutorialStep - 1) as 1 | 2 | 3 | 4 | 5 })} onDismiss={dismissTutorial} onExit={() => { void completeWelcomeTutorial(); }} onNext={() => { if (tutorialStep === 5) { setActiveView('production'); setTutorialStage({ kind: 'production' }); } else setTutorialStage({ kind: 'welcome', step: (tutorialStep + 1) as 1 | 2 | 3 | 4 | 5 }); }} step={tutorialStep} visible={isTutorialOpen && activeView === 'company'} />
      <ProductionTutorialDialog onBack={() => { setActiveView('company'); setTutorialStage({ kind: 'welcome', step: tutorialStep }); }} onClose={() => { setHasStartedProductionTutorial(true); setTutorialStage({ kind: 'build-facility' }); }} onDismiss={dismissTutorial} onExit={() => { void completeWelcomeTutorial(); }} visible={isProductionTutorialOpen && activeView === 'production'} />
      <BuildFacilityTutorialDialog highlightLayout={buildFacilityButtonLayout} onBack={() => { setHasStartedProductionTutorial(false); setTutorialStage({ kind: 'production' }); }} onDismiss={dismissTutorial} onExit={() => { void completeWelcomeTutorial(); }} onNext={() => { setIsConstructionYardOpen(true); setTutorialStage({ kind: 'construction' }); }} visible={isBuildFacilityTutorialOpen && activeView === 'production'} />
      <ConstructionTutorialDialog onBack={() => { setIsConstructionYardOpen(false); setTutorialStage({ kind: 'build-facility' }); }} onExit={() => { void completeWelcomeTutorial(); }} onNext={() => setTutorialStage({ kind: 'facility-choice' })} visible={isConstructionTutorialOpen && activeView === 'production'} />
      <FacilityChoiceTutorialDialog onBack={() => setTutorialStage({ kind: 'construction' })} onExit={() => { void completeWelcomeTutorial(); }} onNext={advancePastFacilityChoice} visible={isFacilityChoiceTutorialOpen && activeView === 'production'} />
      <ConstructionConfirmationTutorialDialog onBack={() => { setPendingConstruction(null); setIsConstructionYardOpen(true); setTutorialStage({ kind: 'facility-choice' }); }} onExit={() => { void completeWelcomeTutorial(); }} onNext={advancePastConstructionConfirmation} visible={isConstructionConfirmationTutorialOpen} />
      <FirstFacilityTutorialDialog facilityType={firstBuiltFacilityType} onBack={() => setTutorialStage({ kind: 'build-facility' })} onDismiss={dismissTutorial} onExit={() => { void completeWelcomeTutorial(); }} onNext={() => { void completeWelcomeTutorial(); }} visible={isFirstFacilityTutorialOpen && activeView === 'production'} />
    </SafeAreaView>
  );
}

function BottomNavigationItem({ active, highlight, icon, label, onPress, symbol }: { active: boolean; highlight?: boolean; icon?: string; label: string; onPress: () => void; symbol: string }) {
  const activeStyle: StyleProp<ViewStyle> = active ? styles.activeNavigationItem : undefined;
  return <Pressable accessibilityLabel={`${label} tab`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.navigationItem, activeStyle, highlight && styles.tutorialProductionNavigation]}>{icon ? <MaterialCommunityIcons color={active ? colors.primary : colors.muted} name={icon as never} size={18} /> : <Text style={[styles.navigationSymbol, active && styles.activeNavigationText]}>{symbol}</Text>}<Text style={[styles.navigationLabel, active && styles.activeNavigationText]}>{label}</Text></Pressable>;
}
