import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, ProgressBar, Text } from 'react-native-paper';
import { calculateFacilityEffectiveWork, getFacilityDefinition, getFacilityProductionStatus, type FacilityCollection } from '@/game/facilities';
import { BASE_WORK_PER_MINUTE } from '@/game/core/time';
import type { Finance } from '@/game/finance';
import type { Inventory } from '@/game/inventory';
import { getRecipeResearchWorkSpeedMultiplier, getResearchProject, type ResearchLedger } from '@/game/research';
import { calculateSalesContractEstimatedWaitMinutes, calculateSalesContractOfferChance, type SalesContracts } from '@/game/sales';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import { colors } from '@/theme';
import { clamp, formatDuration, formatElapsedTime, formatNumber } from '@/utils';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';

type ActiveProcess = { id: string; icon: string; label: string; progress: number; timing: string; title: string };

export function ActiveProcessesOverlay({ customerPipelineProgress, facilities, finance, inventory, maximumOpenContracts, onCompleteProcess, research, salesContracts, showInstantCompletion }: {
  customerPipelineProgress: number;
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  maximumOpenContracts: number;
  onCompleteProcess?: (processId: string, remainingMs: number) => void;
  research: ResearchLedger;
  salesContracts: SalesContracts;
  showInstantCompletion?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const processes = getActiveProcesses({ customerPipelineProgress, facilities, finance, inventory, maximumOpenContracts, research, salesContracts });
  const processCountLabel = processes.length === 1 ? '1 active process' : `${processes.length} active processes`;

  return <View pointerEvents="box-none" style={localStyles.container}>
    {isOpen && <View style={localStyles.panel}>
      <View style={localStyles.panelHeading}>
        <View><Text style={localStyles.eyebrow}>IN PROGRESS</Text><Text variant="titleMedium">Active timers</Text></View>
        <Pressable accessibilityLabel="Close active timers" accessibilityRole="button" hitSlop={8} onPress={() => setIsOpen(false)} style={localStyles.closeButton}>
          <MaterialCommunityIcons color={colors.muted} name={APP_ICONS.close} size={20} />
        </Pressable>
      </View>
      {processes.length === 0
        ? <Text style={localStyles.emptyText}>No timed processes are running.</Text>
        : <ScrollView contentContainerStyle={localStyles.processList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {processes.map((process) => <View key={process.id} style={localStyles.process}>
            <View style={localStyles.processHeader}>
              <MaterialCommunityIcons color={colors.primary} name={process.icon as never} size={18} />
              <View style={localStyles.processCopy}><Text numberOfLines={1} style={localStyles.processTitle}>{process.title}</Text><Text numberOfLines={1} style={localStyles.processLabel}>{process.label}</Text></View>
              <Text style={localStyles.processTiming}>{process.timing}</Text>
            </View>
            <ProgressBar accessible accessibilityLabel={`${process.title}: ${process.timing}`} color={colors.primary} progress={process.progress} style={localStyles.progressBar} />
            {showInstantCompletion && process.id !== 'customer-pipeline' && onCompleteProcess && <Button compact mode="outlined" onPress={() => onCompleteProcess(process.id, getRemainingProcessMilliseconds(process, facilities, finance, research))} style={localStyles.completeButton}>Complete instantly</Button>}
          </View>)}
        </ScrollView>}
    </View>}
    <Pressable accessibilityLabel={`${isOpen ? 'Hide' : 'Show'} active timers, ${processCountLabel}`} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setIsOpen((current) => !current)} style={localStyles.trigger}>
      <MaterialCommunityIcons color={colors.onDark} name={APP_ICONS.work} size={25} />
      {processes.length > 0 && <View style={localStyles.badge}><Text style={localStyles.badgeText}>{processes.length > 9 ? '9+' : processes.length}</Text></View>}
    </Pressable>
  </View>;
}

function getActiveProcesses({ customerPipelineProgress, facilities, finance, inventory, maximumOpenContracts, research, salesContracts }: Parameters<typeof ActiveProcessesOverlay>[0]): ActiveProcess[] {
  const production = facilities.getAll().flatMap((facility) => {
    const facilityView = facility.getView();
    if (getFacilityProductionStatus(facilityView, inventory) !== 'producing') return [];
    const recipeName = facilityView.activeRecipeName;
    const recipe = recipeName ? getFacilityDefinition(facilityView.facilityType).recipes.find((candidate) => candidate.name === recipeName) : null;
    if (!recipe) return [];

    const recipeProgress = facilityView.recipeProgress[recipe.name] ?? 0;
    const progress = clamp(recipeProgress / recipe.requiredWork, 0, 1);
    const workPerMinute = calculateFacilityEffectiveWork(facilityView, BASE_WORK_PER_MINUTE, getRecipeResearchWorkSpeedMultiplier(recipe.name, research.getCompletedProjectIds()));
    const minutesRemaining = workPerMinute > 0 ? (recipe.requiredWork - recipeProgress) / workPerMinute : 0;
    return [{ id: facilityView.id, icon: RECIPE_ICONS[recipe.name], label: formatRecipeName(recipe), progress, timing: `${formatNumber(progress * 100, { decimals: 0 })}% · ${formatDuration(minutesRemaining)} left`, title: facilityView.displayName }];
  });

  const activeResearch = research.getActiveProject();
  const researchProcess = activeResearch ? (() => {
    const project = getResearchProject(activeResearch.projectId);
    if (!project) return [];
    const progress = clamp(activeResearch.progressMs / project.durationMs, 0, 1);
    return [{ id: `research-${project.id}`, icon: APP_ICONS.research, label: 'Research', progress, timing: `${formatElapsedTime(Math.max(0, project.durationMs - activeResearch.progressMs))} left`, title: project.name }];
  })() : [];

  const activeLoanSearch = finance.getActiveLoanSearch();
  const lenderSearchProcess = activeLoanSearch ? [{
    id: 'lender-search',
    icon: APP_ICONS.bank,
    label: `${activeLoanSearch.criteria.offerCount} offers requested`,
    progress: clamp(activeLoanSearch.workCompletedMs / activeLoanSearch.workRequiredMs, 0, 1),
    timing: `${formatElapsedTime(Math.max(0, activeLoanSearch.workRequiredMs - activeLoanSearch.workCompletedMs))} left`,
    title: 'Lender search',
  }] : [];

  const unfulfilledContracts = salesContracts.getOfferedContracts().length;
  const offerChance = calculateSalesContractOfferChance(unfulfilledContracts);
  const expectedWaitMinutes = calculateSalesContractEstimatedWaitMinutes(unfulfilledContracts);
  const pipelineProgress = Math.max(0, customerPipelineProgress);
  const pipelineProcess = unfulfilledContracts < maximumOpenContracts && offerChance > 0 ? [{
    id: 'customer-pipeline',
    icon: APP_ICONS.contracts,
    label: `${formatNumber(unfulfilledContracts)} of ${formatNumber(maximumOpenContracts)} contract slots filled`,
    progress: clamp(pipelineProgress, 0, 1),
    timing: pipelineProgress >= 1 ? 'Past estimate' : `${formatDuration(Math.max(0, expectedWaitMinutes * (1 - pipelineProgress)))} estimated`,
    title: 'Customer pipeline',
  }] : [];

  return [...researchProcess, ...lenderSearchProcess, ...production, ...pipelineProcess];
}

function getRemainingProcessMilliseconds(process: ActiveProcess, facilities: FacilityCollection, finance: Finance, research: ResearchLedger): number {
  if (process.id === 'lender-search') {
    const activeLoanSearch = finance.getActiveLoanSearch();
    return activeLoanSearch ? Math.max(1, activeLoanSearch.workRequiredMs - activeLoanSearch.workCompletedMs) : 1;
  }

  if (process.id.startsWith('research-')) {
    const activeResearch = research.getActiveProject();
    const project = activeResearch ? getResearchProject(activeResearch.projectId) : null;
    return project ? Math.max(1, project.durationMs - activeResearch!.progressMs) : 1;
  }

  const facility = facilities.get(process.id);
  const facilityView = facility?.getView();
  const recipeName = facilityView?.activeRecipeName;
  const recipe = facilityView && recipeName ? getFacilityDefinition(facilityView.facilityType).recipes.find((candidate) => candidate.name === recipeName) : null;
  if (!facilityView || !recipe) return 1;

  const workPerMinute = calculateFacilityEffectiveWork(facilityView, BASE_WORK_PER_MINUTE, getRecipeResearchWorkSpeedMultiplier(recipe.name, research.getCompletedProjectIds()));
  const recipeProgress = facilityView.recipeProgress[recipe.name] ?? 0;
  return workPerMinute > 0 ? Math.max(1, Math.ceil(((recipe.requiredWork - recipeProgress) / workPerMinute) * 60_000)) : 1;
}

const localStyles = StyleSheet.create({
  badge: { alignItems: 'center', backgroundColor: colors.error, borderColor: colors.surface, borderRadius: 10, borderWidth: 2, justifyContent: 'center', minHeight: 20, minWidth: 20, paddingHorizontal: 3, position: 'absolute', right: -4, top: -4 },
  badgeText: { color: colors.onDark, fontSize: 10, fontWeight: '700' },
  closeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 40, minWidth: 40 },
  completeButton: { marginTop: 2 },
  container: { alignItems: 'flex-end', bottom: 86, position: 'absolute', right: 12, zIndex: 15 },
  emptyText: { color: colors.muted, lineHeight: 20, marginTop: 12 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  panel: { backgroundColor: colors.surface, borderRadius: 16, elevation: 8, marginBottom: 10, maxHeight: 340, padding: 14, shadowColor: '#000000', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.18, shadowRadius: 8, width: 300 },
  panelHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  process: { borderTopColor: '#E2E8E5', borderTopWidth: 1, gap: 7, paddingTop: 10 },
  processCopy: { flex: 1, gap: 1 },
  processHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  processLabel: { color: colors.muted, fontSize: 11 },
  processList: { gap: 10, paddingTop: 12 },
  processTiming: { color: colors.muted, fontSize: 11, textAlign: 'right' },
  processTitle: { color: colors.charcoal, fontSize: 13, fontWeight: '700' },
  progressBar: { borderRadius: 5, height: 7 },
  trigger: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 28, elevation: 6, height: 56, justifyContent: 'center', shadowColor: '#000000', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.2, shadowRadius: 5, width: 56 },
});
