import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { Avatar, Divider, IconButton, Menu, Portal, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_ICONS, ECONOMY_PHASE_ICONS } from '@/icons';
import { calculateCompanyPrestigeSummary, FARM_DEFAULT_SIZE_HECTARES, FacilityType, getMaximumOpenSalesOrders, getNextTutorialStage, getPreviousTutorialStage, getTutorialProductionPresentation, getTutorialStagePresentation, recoverTutorialStage, type TutorialStage, useCompanySessionStore } from '@/game';
import { colors } from '@/theme';
import { ActiveProcessesOverlay, AdminDashboard, AchievementsView, CollectionDialog, ConstructionConfirmationTutorialDialog, ConstructionTutorialDialog, FacilityChoiceTutorialDialog, FirstFacilityTutorialDialog, GameViewContent, FacilityConstructionDialog, BuildFacilityTutorialDialog, IndustriPediaView, isDevAdminSurfaceAvailable, LeaderboardScreen, PrestigeDialog, ProfileScreen, ResearchView, SettingsScreen, styles, ProductionTutorialDialog, TutorialGuideDialog, LoginView, type GameViewId, type IndustriPediaSection } from '@/ui';
import { InventoryTutorialDialog } from '@/ui/dashboard/components/dialog/TutorialDialog';
import { formatCurrency, formatElapsedTime, formatNumber } from '@/utils';
import { TooltipMaterialIcon } from '@/ui/dashboard/components/IconTooltip';
import { useDashboardGameState } from '@/ui/dashboard/hooks/useDashboardGameState';
import type { Recipe } from '@/game/recipes';
import { getRecipe } from '@/game/recipes';
import type { SalesCustomerType } from '@/game/sales';

type ActiveScreen = GameViewId | 'achievements' | 'admin' | 'profile' | 'pedia' | 'settings' | 'leaderboard';
type PendingConstruction = { facilityType: FacilityType; sizeHectares: number };

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
  const { width } = useWindowDimensions();
  const isCompactHeader = width <= 420;
  const [activeView, setActiveView] = useState<ActiveScreen>('company');
  const [collapsedFacilities, setCollapsedFacilities] = useState<Record<string, boolean>>({});
  const [pediaInitialSection, setPediaInitialSection] = useState<IndustriPediaSection>('resources');
  const [pediaInitialCustomerId, setPediaInitialCustomerId] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [showActiveRecipeInputs, setShowActiveRecipeInputs] = useState(false);
  const [isConstructionYardOpen, setIsConstructionYardOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [tutorialStage, setTutorialStage] = useState<TutorialStage | null>(null);
  const [lastTutorialStage, setLastTutorialStage] = useState<TutorialStage>({ kind: 'welcome-company' });
  const [hasStartedProductionTutorial, setHasStartedProductionTutorial] = useState(false);
  const [isFirstFacilityStaffingTutorialReady, setIsFirstFacilityStaffingTutorialReady] = useState(false);
  const [firstBuiltFacilityType, setFirstBuiltFacilityType] = useState<FacilityType | null>(null);
  const [firstFacilityTutorialRecipeName, setFirstFacilityTutorialRecipeName] = useState<Recipe['name'] | null>(null);
  const [firstFacilityRecipeFocusActive, setFirstFacilityRecipeFocusActive] = useState(true);
  const [firstFacilityFocusLayout, setFirstFacilityFocusLayout] = useState<{ height: number; width: number; x: number; y: number } | null>(null);
  const [buildFacilityButtonLayout, setBuildFacilityButtonLayout] = useState<{ height: number; width: number; x: number; y: number } | null>(null);
  const [companyOverviewLayout, setCompanyOverviewLayout] = useState<{ height: number; width: number; x: number; y: number } | null>(null);
  const [pendingConstruction, setPendingConstruction] = useState<PendingConstruction | null>(null);
  const [pendingDestruction, setPendingDestruction] = useState<string | null>(null);
  const { acknowledgeCollectionNotice, acceptDebtRestructure, acceptLoanOffer, achievements, addAdminFunds, advanceGameTime, advanceRealtime, buildFacility, buyMarketResource, buyMissingConstructionInputs, cancelResearch, companyStartedAtGameTimeMs, createSalesOrderRequest, customerPipelineProgress, facilities, facilityMaintenance, fastForwardOneMinute, finance, fulfillSalesOrder, getResearchAvailability, getSalesOrderAcquisitionStatus, inventory, lastProcessedAtMs, makeExtraLoanPayment, market, prestige, rejectSalesOrder, removeLoanOffer, removeUnavailableLoanOffers, repairFacility, repayLoanInFull, research, resourceFlow, salesOrders, sellFacility, sellMarketResource, setAdminBalance, setFacilityAutoRepair, setFacilityOptionalInputEnabled, setFacilityProductionActive, setFacilityProductionCycle, setFacilityStaffing, trainFacilityStaff, setInventoryAmount, setMarketAutomation, startLoanSearch, startResearch, upgradeFacility } = useDashboardGameState();
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
  const tutorialStagePresentation = getTutorialStagePresentation(tutorialStage);
  const isTutorialOpen = tutorialStagePresentation?.flow === 'welcome';
  const tutorialStep = isTutorialOpen ? tutorialStagePresentation.progress.step : 1;
  const tutorialPresentation = useMemo(() => {
    const selectedRecipeName = firstFacilityTutorialRecipeName ?? facilities.getAll()[0]?.getView().activeRecipeName ?? null;
    return {
      ...getTutorialProductionPresentation(tutorialStage, firstFacilityTutorialRecipeName, firstFacilityRecipeFocusActive),
      inventoryResource: selectedRecipeName ? getRecipe(selectedRecipeName).outputs[0].resourceType : null,
      tutorialStageKind: tutorialStage?.kind,
    };
  }, [facilities, firstFacilityRecipeFocusActive, firstFacilityTutorialRecipeName, tutorialStage]);
  const { firstFacilityFocus: firstFacilityTutorialFocus, firstFacilityStep: firstFacilityTutorialStep, isBuildFacilityTutorial: isBuildFacilityTutorialOpen, isFirstFacilityTutorial: isFirstFacilityTutorialOpen, isProductionTutorial: isProductionTutorialOpen } = tutorialPresentation;
  const isConstructionTutorialOpen = tutorialStage?.kind === 'construction';
  const isFacilityChoiceTutorialOpen = tutorialStage?.kind === 'facility-choice';
  const isConstructionConfirmationTutorialOpen = tutorialStage?.kind === 'construction-confirmation';
  const isInventoryTutorialOpen = tutorialStagePresentation?.flow === 'inventory';
  const isInventoryTutorialMinimized = !tutorial.completedWelcome && activeView === 'inventory' && tutorialStage === null && getTutorialStagePresentation(lastTutorialStage)?.flow === 'inventory';
  const isFirstFacilityStaffingTutorial =
    firstFacilityTutorialStep === 'staff-management' ||
    firstFacilityTutorialStep === 'staff-training';
  const dismissTutorial = () => {
    if (tutorialStage) setLastTutorialStage(tutorialStage);
    setTutorialStage(null);
  };
  const dismissTutorialOrGameDialog = (dismissGameDialog: () => void) => {
    if (tutorialStage) dismissTutorial();
    else dismissGameDialog();
  };
  const jumpToTutorial = (tutorial: 'company' | 'facility' | 'inventory') => {
    setPendingConstruction(null);
    setIsConstructionYardOpen(false);
    setFirstFacilityFocusLayout(null);
    const nextStage: TutorialStage = tutorial === 'company'
      ? { kind: 'welcome-company' }
      : tutorial === 'facility'
        ? { kind: 'production' }
        : { kind: 'inventory' };
    setLastTutorialStage(nextStage);
    setTutorialStage(nextStage);
    setActiveView(tutorial === 'company' ? 'company' : tutorial === 'inventory' ? 'inventory' : 'production');
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
  const advanceFirstFacilityTutorial = useCallback(() => {
    if (!tutorialStage) return;
    const nextStage = getNextTutorialStage(tutorialStage);
    if (nextStage) {
      setTutorialStage(nextStage);
      if (nextStage.kind === 'inventory') setActiveView('inventory');
    } else if (tutorialStage.kind === 'inventory') void completeWelcomeTutorial();
  }, [tutorialStage]);
  const handleFirstFacilityRecipeSelected = useCallback((recipeName: Recipe['name']) => {
    setFirstFacilityFocusLayout(null);
    setFirstFacilityRecipeFocusActive(true);
    setFirstFacilityTutorialRecipeName(recipeName);
    advanceFirstFacilityTutorial();
  }, [advanceFirstFacilityTutorial]);
  const handleFacilityTutorialScroll = useCallback(() => {
    if (tutorialStage?.kind === 'first-facility-research') {
      setFirstFacilityRecipeFocusActive(false);
      setFirstFacilityFocusLayout(null);
    }
  }, [tutorialStage]);
  const retreatFirstFacilityTutorial = () => {
    const previousStage = tutorialStage ? getPreviousTutorialStage(tutorialStage) : null;
    if (previousStage) setTutorialStage(previousStage);
  };
  const reopenTutorial = () => {
    const firstFacility = facilities.getAll()[0];
    const recoveredStage = recoverTutorialStage(lastTutorialStage, Boolean(firstFacility), Boolean(pendingConstruction));
    if (firstFacility && recoveredStage.kind.startsWith('first-facility')) setFirstBuiltFacilityType(firstFacility.getView().facilityType);
    if (recoveredStage.kind.startsWith('first-facility')) {
      setPendingConstruction(null);
      setIsConstructionYardOpen(false);
    }
    setTutorialStage(recoveredStage);
    if (getTutorialStagePresentation(recoveredStage)?.flow === 'welcome') setActiveView('company');
    else {
      setActiveView(recoveredStage.kind === 'inventory' ? 'inventory' : 'production');
      if (recoveredStage.kind === 'construction' || recoveredStage.kind === 'facility-choice') setIsConstructionYardOpen(true);
    }
  };
  const economyPhase = finance.getEconomyPhase();
  const economyPhaseColor = economyPhase === 'crash' || economyPhase === 'recession' ? colors.error : economyPhase === 'stable' ? colors.onDark : colors.paleGreen;
  const completeActivityInstantly = (_processId: string, remainingMs: number) => {
    advanceRealtime(Date.now());
    advanceGameTime(remainingMs);
  };
  const openConstructionYard = useCallback(() => {
    const wasBuildTutorialOpen = isBuildFacilityTutorialOpen;
    if (wasBuildTutorialOpen) setTutorialStage(null);
    setIsConstructionYardOpen(true);
    if (wasBuildTutorialOpen) setTutorialStage({ kind: 'construction' });
  }, [isBuildFacilityTutorialOpen]);

  useEffect(() => {
      setTutorialStage(tutorial.completedWelcome ? null : { kind: 'welcome-company' });
      if (!tutorial.completedWelcome) setLastTutorialStage({ kind: 'welcome-company' });
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
        <View style={styles.header}><View style={[styles.topBar, isCompactHeader && styles.compactTopBar]}>
          <View style={[styles.balanceInline, isCompactHeader && styles.compactBalanceInline]}>
            <Pressable accessibilityLabel={isTutorialOpen && tutorialStep === 2 ? 'Tutorial highlighted company balance' : 'Open Finance'} accessibilityRole="button" onPress={() => setActiveView('finance')} style={[styles.balanceAmount, isCompactHeader && styles.compactBalanceAmount]}>
              <MaterialCommunityIcons accessibilityLabel="Balance icon" color={colors.onDark} name={APP_ICONS.currency} size={isCompactHeader ? 17 : 21} />
              <Text numberOfLines={1} style={[styles.balanceInlineValue, isCompactHeader && styles.compactBalanceInlineValue]}>{formatCurrency(finance.getBalance())}</Text>
            </Pressable>
            {tutorial.completedWelcome && <Pressable accessibilityLabel="Open company prestige" accessibilityRole="button" onPress={() => setIsPrestigeOpen(true)} style={[styles.prestigeInline, isCompactHeader && styles.compactPrestigeInline]}><MaterialCommunityIcons color={colors.onDark} name={APP_ICONS.achievements} size={isCompactHeader ? 14 : 17} /><Text numberOfLines={1} style={[styles.prestigeInlineValue, isCompactHeader && styles.compactPrestigeInlineValue]}>{formatNumber(prestigeSummary.totalPrestige, { smartDecimals: true })}</Text></Pressable>}
          </View>
          <View style={styles.headerActions}>
            {tutorial.completedWelcome && <View accessibilityLabel={`Economy: ${economyPhase}`} style={[styles.headerElapsedTime, isCompactHeader && styles.compactHeaderElapsedTime]}><TooltipMaterialIcon color={economyPhaseColor} label={`${economyPhase} economy`} name={ECONOMY_PHASE_ICONS[economyPhase]} size={isCompactHeader ? 15 : 18} /></View>}
            {tutorial.completedWelcome && <IconButton accessibilityLabel="Fast-forward one minute" icon={APP_ICONS.fastForward} iconColor={colors.onDark} onPress={fastForwardOneMinute} size={isCompactHeader ? 18 : 24} style={isCompactHeader ? styles.compactHeaderIconButton : undefined} />}
            <View accessibilityLabel={isTutorialOpen && tutorialStep === 3 ? 'Tutorial highlighted company time' : `Time ${formatElapsedTime(elapsedForegroundTimeMs)}`} style={[styles.headerElapsedTime, isCompactHeader && styles.compactHeaderElapsedTime]}><TooltipMaterialIcon color={colors.onDark} label="Elapsed game time" name={APP_ICONS.elapsedTime} size={isCompactHeader ? 15 : 17} /><Text numberOfLines={1} style={[styles.headerElapsedTimeValue, isCompactHeader && styles.compactHeaderElapsedTimeValue]}>{formatElapsedTime(elapsedForegroundTimeMs)}</Text></View>
            <Menu anchor={<Pressable accessibilityLabel="Open profile menu" accessibilityRole="button" onPress={() => setIsProfileMenuOpen(true)} style={[styles.profileButton, isCompactHeader && styles.compactProfileButton]}><Avatar.Text label={companyName.slice(0, 2).toUpperCase()} size={isCompactHeader ? 30 : 38} style={styles.avatar} /></Pressable>} onDismiss={() => setIsProfileMenuOpen(false)} visible={isProfileMenuOpen}>
              <Menu.Item leadingIcon={APP_ICONS.account} onPress={() => { setIsProfileMenuOpen(false); setActiveView('profile'); }} title="Profile" />
              <Menu.Item leadingIcon={APP_ICONS.settings} onPress={() => { setIsProfileMenuOpen(false); setActiveView('settings'); }} title="Settings" />
              <Menu.Item leadingIcon="format-list-numbered" onPress={() => { setIsProfileMenuOpen(false); setActiveView('leaderboard'); }} title="Leaderboard" />
              <Menu.Item leadingIcon={APP_ICONS.help} onPress={() => { setIsProfileMenuOpen(false); setPediaInitialCustomerId(null); setPediaInitialSection('resources'); setActiveView('pedia'); }} title="IndustriPedia" />
              <Menu.Item leadingIcon={APP_ICONS.achievements} onPress={() => { setIsProfileMenuOpen(false); setActiveView('achievements'); }} title="Achievements" />
              {isAdminDashboardAvailable && <Menu.Item leadingIcon={APP_ICONS.shield} onPress={() => { setIsProfileMenuOpen(false); setActiveView('admin'); }} title="Admin Dashboard" />}
              <Divider />
              <Menu.Item leadingIcon={APP_ICONS.logout} onPress={() => { setIsProfileMenuOpen(false); void logout(); }} title="Log out" />
            </Menu>
          </View>
        </View></View>
        {activeView === 'production' ? <View style={styles.gameViewViewport}><GameViewContent achievements={achievements} activeTab="production" buyMarketResource={buyMarketResource} collapsedFacilities={collapsedFacilities} companyName={companyName} companyPrestige={prestigeSummary.totalPrestige} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={lastProcessedAtMs} customerPipelineProgress={customerPipelineProgress} facilities={facilities} finance={finance} fulfillSalesOrder={fulfillSalesOrder} getResearchAvailability={getResearchAvailability} inventory={inventory} market={market} maximumOpenOrders={maximumOpenOrders} onAcceptLoanOffer={acceptLoanOffer} onBuildFacilityLayout={setBuildFacilityButtonLayout} onCompanyOverviewLayout={setCompanyOverviewLayout} onFirstFacilityFocusLayout={setFirstFacilityFocusLayout} onFirstFacilityRecipeSelected={handleFirstFacilityRecipeSelected} onFirstFacilityStaffingClosed={() => setIsFirstFacilityStaffingTutorialReady(false)} onFirstFacilityStaffingOpened={() => setIsFirstFacilityStaffingTutorialReady(true)} onOpenCustomer={(customerId) => { setPediaInitialCustomerId(customerId); setPediaInitialSection('customers'); setActiveView('pedia'); }} onOpenCustomerType={(_customerType: SalesCustomerType) => { setPediaInitialCustomerId(null); setPediaInitialSection('customer-types'); setActiveView('pedia'); }} onExtraLoanPayment={makeExtraLoanPayment} onRemoveLoanOffer={removeLoanOffer} onRemoveUnavailableLoanOffers={removeUnavailableLoanOffers} onRepayLoanInFull={repayLoanInFull} onStartLoanSearch={startLoanSearch} onScrollBeginDrag={handleFacilityTutorialScroll} onlyInStock={onlyInStock} openConstructionYard={openConstructionYard} rejectSalesOrder={rejectSalesOrder} repairFacility={repairFacility} requestFacilityDestruction={setPendingDestruction} research={research} resourceFlow={resourceFlow} salesOrderAcquisition={salesOrderAcquisition} salesOrders={salesOrders} sellMarketResource={sellMarketResource} setCollapsedFacilities={setCollapsedFacilities} setFacilityAutoRepair={setFacilityAutoRepair} setFacilityOptionalInputEnabled={setFacilityOptionalInputEnabled} setFacilityProductionActive={setFacilityProductionActive} setFacilityProductionCycle={setFacilityProductionCycle} setFacilityStaffing={setFacilityStaffing} trainFacilityStaff={trainFacilityStaff} setMarketAutomation={setMarketAutomation} setOnlyInStock={setOnlyInStock} setShowActiveRecipeInputs={setShowActiveRecipeInputs} showActiveRecipeInputs={showActiveRecipeInputs} startResearch={startResearch} tutorial={tutorialPresentation} upgradeFacility={upgradeFacility} /></View> : <ScrollView contentContainerStyle={[styles.content, tutorialStage && styles.tutorialScrollableContent]} nestedScrollEnabled onScrollBeginDrag={handleFacilityTutorialScroll}>
          {activeView === 'admin' && isAdminDashboardAvailable ? <AdminDashboard isTutorialEnabled={!tutorial.completedWelcome} onAddFunds={addAdminFunds} onClearAllLocalData={clearAllLocalData} onCreateSalesOrderRequest={createSalesOrderRequest} onDeleteCompany={deleteActiveCompany} onDisableTutorial={completeWelcomeTutorial} onEnableTutorial={reopenWelcomeTutorial} onSetBalance={setAdminBalance} onSetInventoryAmount={setInventoryAmount} />
            : activeView === 'achievements' ? <AchievementsView achievements={achievements} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={lastProcessedAtMs} facilities={facilities} facilityMaintenance={facilityMaintenance} finance={finance} prestige={prestige} resourceFlow={resourceFlow} salesOrders={salesOrders} />
                : activeView === 'profile' ? <ProfileScreen companyName={companyName} onDeleteCompany={deleteActiveCompany} onManageCompanies={logout} onReplayTutorial={reopenWelcomeTutorial} playerName={playerName} />
                : activeView === 'research' ? <ResearchView facilities={facilities} finance={finance} getAvailability={getResearchAvailability} market={market} onCancel={cancelResearch} onStart={startResearch} research={research} />
                : activeView === 'settings' ? <SettingsScreen onLogout={logout} />
                  : activeView === 'leaderboard' ? <LeaderboardScreen />
                    : activeView === 'pedia' ? <IndustriPediaView companyPrestige={prestigeSummary.totalPrestige} currentGameTimeMs={lastProcessedAtMs} economyPhase={economyPhase} initialCustomerId={pediaInitialCustomerId} initialSection={pediaInitialSection} market={market} salesOrders={salesOrders} />
                    : <GameViewContent achievements={achievements} activeTab={activeView === 'admin' ? 'company' : activeView} buyMarketResource={buyMarketResource} collapsedFacilities={collapsedFacilities} companyName={companyName} companyPrestige={prestigeSummary.totalPrestige} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={lastProcessedAtMs} customerPipelineProgress={customerPipelineProgress} facilities={facilities} finance={finance} fulfillSalesOrder={fulfillSalesOrder} getResearchAvailability={getResearchAvailability} inventory={inventory} market={market} maximumOpenOrders={maximumOpenOrders} onAcceptLoanOffer={acceptLoanOffer} onBuildFacilityLayout={setBuildFacilityButtonLayout} onCompanyOverviewLayout={setCompanyOverviewLayout} onFirstFacilityFocusLayout={setFirstFacilityFocusLayout} onFirstFacilityRecipeSelected={handleFirstFacilityRecipeSelected} onFirstFacilityStaffingClosed={() => setIsFirstFacilityStaffingTutorialReady(false)} onFirstFacilityStaffingOpened={() => setIsFirstFacilityStaffingTutorialReady(true)} onOpenCustomer={(customerId) => { setPediaInitialCustomerId(customerId); setPediaInitialSection('customers'); setActiveView('pedia'); }} onOpenCustomerType={(_customerType: SalesCustomerType) => { setPediaInitialCustomerId(null); setPediaInitialSection('customer-types'); setActiveView('pedia'); }} onExtraLoanPayment={makeExtraLoanPayment} onRemoveLoanOffer={removeLoanOffer} onRemoveUnavailableLoanOffers={removeUnavailableLoanOffers} onRepayLoanInFull={repayLoanInFull} onStartLoanSearch={startLoanSearch} onScrollBeginDrag={handleFacilityTutorialScroll} onlyInStock={onlyInStock} openConstructionYard={openConstructionYard} rejectSalesOrder={rejectSalesOrder} repairFacility={repairFacility} requestFacilityDestruction={setPendingDestruction} research={research} resourceFlow={resourceFlow} salesOrderAcquisition={salesOrderAcquisition} salesOrders={salesOrders} sellMarketResource={sellMarketResource} setCollapsedFacilities={setCollapsedFacilities} setFacilityAutoRepair={setFacilityAutoRepair} setFacilityOptionalInputEnabled={setFacilityOptionalInputEnabled} setFacilityProductionActive={setFacilityProductionActive} setFacilityProductionCycle={setFacilityProductionCycle} setFacilityStaffing={setFacilityStaffing} trainFacilityStaff={trainFacilityStaff} setMarketAutomation={setMarketAutomation} setOnlyInStock={setOnlyInStock} setShowActiveRecipeInputs={setShowActiveRecipeInputs} showActiveRecipeInputs={showActiveRecipeInputs} startResearch={startResearch} tutorial={tutorialPresentation} upgradeFacility={upgradeFacility} />}

        </ScrollView>}
        <View style={styles.bottomNavigation}>{(tutorial.completedWelcome ? [...tabs.slice(0, 3), salesTab, researchTab, ...tabs.slice(3)] : isInventoryTutorialOpen || isInventoryTutorialMinimized ? [tabs[0], tabs[1], tabs[2]] : firstFacilityTutorialStep === 'inventory-transition' ? [tabs[0], tabs[1], tabs[2]] : tutorialStep === 5 || isFirstFacilityTutorialOpen || isProductionTutorialOpen || isBuildFacilityTutorialOpen || isConstructionTutorialOpen || isFacilityChoiceTutorialOpen || isConstructionConfirmationTutorialOpen ? [tabs[0], tabs[2]] : [tabs[0]]).map((tab) => <BottomNavigationItem active={activeView === tab.key} highlight={(tutorialStep === 5 && activeView !== 'production' && tab.key === 'production') || ((isInventoryTutorialOpen || firstFacilityTutorialStep === 'inventory-transition') && tab.key === 'inventory')} icon={tab.icon} key={tab.key} label={tab.label} onPress={() => { if (!tutorial.completedWelcome && (isInventoryTutorialOpen || firstFacilityTutorialStep === 'inventory-transition') && tab.key === 'inventory') { setActiveView('inventory'); setTutorialStage({ kind: 'inventory' }); return; } setActiveView(tab.key); if (tutorial.completedWelcome) return; if (isInventoryTutorialOpen) { setTutorialStage({ kind: 'inventory' }); return; } if (tab.key === 'company') return; if (tab.key === 'production') setTutorialStage({ kind: hasStartedProductionTutorial ? 'build-facility' : 'production' }); }} symbol={tab.symbol} />)}</View>
      </View>
      <FacilityConstructionDialog facilities={facilities} finance={finance} inventory={inventory} isConstructionTutorial={isConstructionTutorialOpen || isFacilityChoiceTutorialOpen} isConstructionConfirmationTutorial={isConstructionConfirmationTutorialOpen || !tutorial.completedWelcome} isFacilitySelectionEnabled={isConstructionTutorialOpen || isFacilityChoiceTutorialOpen} isConstructionYardOpen={isConstructionYardOpen} market={market} onBuyMissingConstructionInputs={() => { if (pendingConstruction) buyMissingConstructionInputs(pendingConstruction.facilityType, pendingConstruction.sizeHectares); }} onCloseConstructionYard={() => dismissTutorialOrGameDialog(() => setIsConstructionYardOpen(false))} onConfirmConstruction={() => { const isFirstFacility = facilities.getAll().length === 0; if (pendingConstruction && buildFacility(pendingConstruction.facilityType, pendingConstruction.sizeHectares)) { if (isFirstFacility && !tutorial.completedWelcome) { setFirstBuiltFacilityType(pendingConstruction.facilityType); setTutorialStage({ kind: 'first-facility' }); } setPendingConstruction(null); } }} onConfirmDestruction={() => { if (pendingDestruction && sellFacility(pendingDestruction)) setPendingDestruction(null); }} onDismissConstruction={() => dismissTutorialOrGameDialog(() => setPendingConstruction(null))} onDismissDestruction={() => dismissTutorialOrGameDialog(() => setPendingConstruction(null))} onSelectConstructionSize={(sizeHectares) => setPendingConstruction((current) => current ? { ...current, sizeHectares } : current)} onSelectFacility={(facilityType) => { if (isConstructionTutorialOpen) { setTutorialStage({ kind: 'facility-choice' }); return; } setIsConstructionYardOpen(false); setPendingConstruction({ facilityType, sizeHectares: facilityType === FacilityType.Farm ? FARM_DEFAULT_SIZE_HECTARES : 1 }); if (!tutorial.completedWelcome) setTutorialStage({ kind: 'construction-confirmation' }); }} pendingConstruction={pendingConstruction} pendingDestruction={pendingDestruction} />
      <PrestigeDialog currentGameTimeMs={lastProcessedAtMs} facilityConditions={facilities.getAll().map((facility) => facility.getView().facilityCondition)} isOpen={isPrestigeOpen} onClose={() => dismissTutorialOrGameDialog(() => setIsPrestigeOpen(false))} summary={prestigeSummary} />
      <CollectionDialog finance={finance} onAcceptRestructure={acceptDebtRestructure} onAcknowledge={acknowledgeCollectionNotice} />
      {!tutorial.completedWelcome && ((activeView === 'company' && !isTutorialOpen) || (activeView === 'production' && tutorialStage === null) || isInventoryTutorialMinimized) && <Portal><View style={styles.tutorialReopenControl}><Pressable accessibilityLabel="Reopen tutorial" accessibilityRole="button" onPress={reopenTutorial} style={styles.tutorialReopenButton}><Image accessibilityLabel="Simulucius" resizeMode="contain" source={SIMULUCIUS_TUTORIAL_BUTTON} style={styles.tutorialReopenCharacter} /></Pressable><IconButton accessibilityLabel="Exit tutorial" icon="close" onPress={() => { void completeWelcomeTutorial(); }} size={16} style={styles.tutorialReopenCloseButton} /></View></Portal>}
      <TutorialGuideDialog balance={formatCurrency(finance.getBalance())} companyOverviewLayout={companyOverviewLayout} elapsedTime={formatElapsedTime(elapsedForegroundTimeMs)} onBack={() => { const previousStage = tutorialStage ? getPreviousTutorialStage(tutorialStage) : null; if (previousStage) setTutorialStage(previousStage); }} onDismiss={dismissTutorial} onExit={() => { void completeWelcomeTutorial(); }} onJumpToTutorial={jumpToTutorial} onNext={() => { if (!tutorialStage) return; const nextStage = getNextTutorialStage(tutorialStage); if (!nextStage) return; setTutorialStage(nextStage); if (nextStage.kind === 'production') setActiveView('production'); }} tutorial={tutorialStagePresentation} visible={isTutorialOpen && activeView === 'company'} />
      <ProductionTutorialDialog onBack={() => { const previousStage = tutorialStage ? getPreviousTutorialStage(tutorialStage) : null; if (previousStage) { setActiveView('company'); setTutorialStage(previousStage); } }} onClose={() => { setHasStartedProductionTutorial(true); setTutorialStage({ kind: 'build-facility' }); }} onDismiss={dismissTutorial} onExit={() => { void completeWelcomeTutorial(); }} onJumpToTutorial={jumpToTutorial} tutorial={tutorialStagePresentation} visible={isProductionTutorialOpen && activeView === 'production'} />
      <BuildFacilityTutorialDialog highlightLayout={buildFacilityButtonLayout} onBack={() => { setHasStartedProductionTutorial(false); setTutorialStage({ kind: 'production' }); }} onDismiss={dismissTutorial} onExit={() => { void completeWelcomeTutorial(); }} onJumpToTutorial={jumpToTutorial} onNext={() => { setIsConstructionYardOpen(true); setTutorialStage({ kind: 'construction' }); }} tutorial={tutorialStagePresentation} visible={isBuildFacilityTutorialOpen && activeView === 'production'} />
      <ConstructionTutorialDialog onBack={() => { setIsConstructionYardOpen(false); setTutorialStage({ kind: 'build-facility' }); }} onExit={() => { void completeWelcomeTutorial(); }} onJumpToTutorial={jumpToTutorial} onNext={() => setTutorialStage({ kind: 'facility-choice' })} tutorial={tutorialStagePresentation} visible={isConstructionTutorialOpen && activeView === 'production'} />
      <FacilityChoiceTutorialDialog onBack={() => setTutorialStage({ kind: 'construction' })} onExit={() => { void completeWelcomeTutorial(); }} onJumpToTutorial={jumpToTutorial} onNext={advancePastFacilityChoice} tutorial={tutorialStagePresentation} visible={isFacilityChoiceTutorialOpen && activeView === 'production'} />
      <ConstructionConfirmationTutorialDialog onBack={() => { setPendingConstruction(null); setIsConstructionYardOpen(true); setTutorialStage({ kind: 'facility-choice' }); }} onExit={() => { void completeWelcomeTutorial(); }} onJumpToTutorial={jumpToTutorial} onNext={advancePastConstructionConfirmation} tutorial={tutorialStagePresentation} visible={isConstructionConfirmationTutorialOpen} />
      {(!isFirstFacilityStaffingTutorial || isFirstFacilityStaffingTutorialReady) && (
        <FirstFacilityTutorialDialog focus={firstFacilityTutorialFocus} focusLayout={firstFacilityFocusLayout} facilityType={firstBuiltFacilityType} nextLabel={firstFacilityTutorialStep === 'inventory-transition' ? 'Go to Inventory' : undefined} recipeName={firstFacilityTutorialRecipeName} research={research} onBack={retreatFirstFacilityTutorial} onDismiss={dismissTutorial} onExit={() => { void completeWelcomeTutorial(); }} onJumpToTutorial={jumpToTutorial} onNext={advanceFirstFacilityTutorial} step={firstFacilityTutorialStep ?? 'overview'} tutorial={tutorialStagePresentation} visible={isFirstFacilityTutorialOpen && activeView === 'production'} />
      )}
      <InventoryTutorialDialog inventoryResource={tutorialPresentation.inventoryResource ?? null} onBack={() => { const previousStage = tutorialStage ? getPreviousTutorialStage(tutorialStage) : null; if (previousStage) { setActiveView(previousStage.kind === 'inventory' || previousStage.kind === 'inventory-resource' ? 'inventory' : 'production'); setTutorialStage(previousStage); } }} onDismiss={dismissTutorial} onExit={() => { void completeWelcomeTutorial(); }} onJumpToTutorial={jumpToTutorial} onNext={() => { if (tutorialStage?.kind === 'inventory') setTutorialStage({ kind: 'inventory-resource' }); else void completeWelcomeTutorial(); }} tutorial={tutorialStagePresentation} visible={isInventoryTutorialOpen && activeView === 'inventory'} />
      {(tutorial.completedWelcome || firstFacilityTutorialStep === 'footprint' || firstFacilityTutorialStep === 'research') && (firstFacilityTutorialStep === 'research' ? <Portal><ActiveProcessesOverlay currentGameTimeMs={lastProcessedAtMs} customerPipelineProgress={customerPipelineProgress} facilities={facilities} finance={finance} initiallyOpen inventory={inventory} maximumOpenOrders={maximumOpenOrders} onCompleteProcess={completeActivityInstantly} research={research} salesOrders={salesOrders} showInstantCompletion={isAdminDashboardAvailable} /></Portal> : <ActiveProcessesOverlay currentGameTimeMs={lastProcessedAtMs} customerPipelineProgress={customerPipelineProgress} facilities={facilities} finance={finance} initiallyOpen={firstFacilityTutorialStep === 'footprint'} inventory={inventory} maximumOpenOrders={maximumOpenOrders} onCompleteProcess={completeActivityInstantly} research={research} salesOrders={salesOrders} showInstantCompletion={isAdminDashboardAvailable} />)}
    </SafeAreaView>
  );
}

function BottomNavigationItem({ active, highlight, icon, label, onPress, symbol }: { active: boolean; highlight?: boolean; icon?: string; label: string; onPress: () => void; symbol: string }) {
  const activeStyle: StyleProp<ViewStyle> = active ? styles.activeNavigationItem : undefined;
  return <Pressable accessibilityLabel={`${label} tab`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.navigationItem, activeStyle, highlight && styles.tutorialProductionNavigation]}>{icon ? <MaterialCommunityIcons color={active ? colors.primary : colors.muted} name={icon as never} size={18} /> : <Text style={[styles.navigationSymbol, active && styles.activeNavigationText]}>{symbol}</Text>}<Text style={[styles.navigationLabel, active && styles.activeNavigationText]}>{label}</Text></Pressable>;
}
