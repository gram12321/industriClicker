import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, ProgressBar, Text } from 'react-native-paper';
import { calculateFacilityEffectiveWork, getFacilityDefinition, getFacilityProductionStatus, type FacilityCollection } from '@/game/facilities';
import { BASE_WORK_PER_MINUTE } from '@/game/core/time';
import type { Finance } from '@/game/finance';
import type { Inventory } from '@/game/inventory';
import { getRecipeResearchWorkSpeedMultiplier, getResearchProject, type ResearchLedger } from '@/game/research';
import { type SalesOrders } from '@/game/sales';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import { colors } from '@/theme';
import { clamp, formatDuration, formatElapsedTime, formatNumber, getColorClass } from '@/utils';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { TooltipMaterialIcon, TooltipTextIcon } from '@/ui/dashboard/components/IconTooltip';

type ProcessCategory = 'production' | 'research' | 'finance' | 'sales' | 'staffing' | 'maintenance';
type ActiveProcess = { category: ProcessCategory; icon: string; id: string; isRecipe?: boolean; label: string; progress: number; timing: string; title: string };

const PROCESS_FILTERS: ReadonlyArray<{ category: ProcessCategory; icon: ComponentProps<typeof MaterialCommunityIcons>['name']; label: string }> = [
  { category: 'production', icon: APP_ICONS.production, label: 'Production' },
  { category: 'research', icon: APP_ICONS.research, label: 'Research' },
  { category: 'finance', icon: APP_ICONS.bank, label: 'Finance' },
  { category: 'sales', icon: APP_ICONS.salesOrders, label: 'Sales' },
  { category: 'staffing', icon: APP_ICONS.staffing, label: 'Staffing' },
  { category: 'maintenance', icon: APP_ICONS.repair, label: 'Maintenance' },
];

export function ActiveProcessesOverlay({ customerPipelineProgress, currentGameTimeMs, facilities, finance, initiallyOpen = false, inventory, maximumOpenOrders, onCompleteProcess, research, salesOrders, showInstantCompletion }: {
  customerPipelineProgress: number;
  currentGameTimeMs: number;
  facilities: FacilityCollection;
  finance: Finance;
  initiallyOpen?: boolean;
  inventory: Inventory;
  maximumOpenOrders: number;
  onCompleteProcess?: (processId: string, remainingMs: number) => void;
  research: ResearchLedger;
  salesOrders: SalesOrders;
  showInstantCompletion?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [visibleCategories, setVisibleCategories] = useState<ReadonlySet<ProcessCategory>>(() => new Set(PROCESS_FILTERS.map(({ category }) => category)));
  const processes = getActiveProcesses({ customerPipelineProgress, currentGameTimeMs, facilities, finance, inventory, maximumOpenOrders, research, salesOrders });
  const visibleProcesses = processes.filter((process) => visibleCategories.has(process.category));
  const processCountLabel = visibleProcesses.length === 1 ? '1 active process' : `${visibleProcesses.length} active processes`;

  function toggleCategory(category: ProcessCategory) {
    setVisibleCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return <View pointerEvents="box-none" style={localStyles.container}>
    {isOpen && <View style={localStyles.panel}>
      <View style={localStyles.panelHeading}>
        <View><Text style={localStyles.eyebrow}>IN PROGRESS</Text><Text variant="titleMedium">Active timers</Text></View>
        <Pressable accessibilityLabel="Close active timers" accessibilityRole="button" hitSlop={8} onPress={() => setIsOpen(false)} style={localStyles.closeButton}>
          <MaterialCommunityIcons color={colors.muted} name={APP_ICONS.close} size={20} />
        </Pressable>
      </View>
      <View accessibilityLabel="Active process filters" style={localStyles.filterRow}>
        {PROCESS_FILTERS.map(({ category, icon, label }) => {
          const isVisible = visibleCategories.has(category);
          return <Pressable accessibilityLabel={`${isVisible ? 'Hide' : 'Show'} ${label.toLowerCase()} processes`} accessibilityRole="button" accessibilityState={{ selected: isVisible }} key={category} onPress={() => toggleCategory(category)} style={[localStyles.filterButton, isVisible && localStyles.filterButtonActive]}>
            <MaterialCommunityIcons color={isVisible ? colors.primary : colors.muted} name={icon} size={18} />
          </Pressable>;
        })}
      </View>
      {visibleProcesses.length === 0
        ? <Text style={localStyles.emptyText}>No timed processes are running.</Text>
        : <ScrollView contentContainerStyle={localStyles.processList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {visibleProcesses.map((process) => <View key={process.id} style={localStyles.process}>
            <View style={localStyles.processHeader}>
              {process.isRecipe ? <TooltipTextIcon label={process.label}>{process.icon}</TooltipTextIcon> : <TooltipMaterialIcon color={colors.primary} label={process.label} name={process.icon} size={18} />}
              <View style={localStyles.processCopy}><Text numberOfLines={1} style={localStyles.processTitle}>{process.title}</Text><Text numberOfLines={1} style={localStyles.processLabel}>{process.label}</Text></View>
              <Text style={[localStyles.processTiming, { color: getColorClass(process.progress) }]}>{process.timing}</Text>
            </View>
            <ProgressBar accessible accessibilityLabel={`${process.title}: ${process.timing}`} color={getColorClass(process.progress)} progress={process.progress} style={localStyles.progressBar} />
            {showInstantCompletion && process.category !== 'staffing' && process.category !== 'maintenance' && process.id !== 'customer-pipeline' && onCompleteProcess && <Button compact mode="outlined" onPress={() => onCompleteProcess(process.id, getRemainingProcessMilliseconds(process, facilities, finance, research))} style={localStyles.completeButton}>Complete instantly</Button>}
          </View>)}
        </ScrollView>}
    </View>}
    <Pressable accessibilityLabel={`${isOpen ? 'Hide' : 'Show'} active timers, ${processCountLabel}`} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setIsOpen((current) => !current)} style={localStyles.trigger}>
      <MaterialCommunityIcons color={colors.onDark} name={APP_ICONS.work} size={25} />
      {processes.length > 0 && <View style={localStyles.badge}><Text style={localStyles.badgeText}>{processes.length > 9 ? '9+' : processes.length}</Text></View>}
    </Pressable>
  </View>;
}

function getActiveProcesses({ customerPipelineProgress, currentGameTimeMs, facilities, finance, inventory, maximumOpenOrders, research, salesOrders }: Parameters<typeof ActiveProcessesOverlay>[0]): ActiveProcess[] {
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
    return [{ category: 'production' as const, id: facilityView.id, icon: RECIPE_ICONS[recipe.name], isRecipe: true, label: formatRecipeName(recipe), progress, timing: `${formatNumber(progress * 100, { decimals: 0 })}% · ${formatDuration(minutesRemaining)} left`, title: facilityView.displayName }];
  });

  const researchProcesses = research.getActiveProjects().flatMap((activeResearch) => {
    const project = getResearchProject(activeResearch.projectId);
    if (!project) return [];
    const progress = clamp(activeResearch.progressMs / activeResearch.durationMs, 0, 1);
    return [{ category: 'research' as const, id: `research-${project.id}`, icon: APP_ICONS.research, label: 'Research', progress, timing: `${formatElapsedTime(Math.max(0, activeResearch.durationMs - activeResearch.progressMs))} left`, title: project.name }];
  });

  const activeLoanSearch = finance.getActiveLoanSearch();
  const lenderSearchProcess = activeLoanSearch ? [{
    category: 'finance' as const,
    id: 'lender-search',
    icon: APP_ICONS.bank,
    label: `${activeLoanSearch.criteria.offerCount} offers requested`,
    progress: clamp(activeLoanSearch.workCompletedMs / activeLoanSearch.workRequiredMs, 0, 1),
    timing: `${formatElapsedTime(Math.max(0, activeLoanSearch.workRequiredMs - activeLoanSearch.workCompletedMs))} left`,
    title: 'Lender search',
  }] : [];

  const openOrders = salesOrders.getOfferedOrders().length;
  const pipelineProgress = Math.max(0, customerPipelineProgress);
  const pipelineProcess = openOrders < maximumOpenOrders ? [{
    category: 'sales' as const,
    id: 'customer-pipeline',
    icon: APP_ICONS.salesOrders,
    label: `${formatNumber(openOrders)} of ${formatNumber(maximumOpenOrders)} order slots filled`,
    progress: clamp(pipelineProgress, 0, 1),
    timing: pipelineProgress >= 1 ? 'Expected arrival interval exceeded' : `${formatNumber(pipelineProgress * 100, { decimals: 0 })}% through expected interval`,
    title: 'Customer acquisition',
  }] : [];

  const staffingProcesses = facilities.getAll().flatMap((facility) => {
    const view = facility.getView();
    const processes: ActiveProcess[] = [];
    if (view.pendingStaffingChange) {
      const change = view.pendingStaffingChange;
      const progress = clamp((currentGameTimeMs - change.startedAtGameTimeMs) / (change.completesAtGameTimeMs - change.startedAtGameTimeMs), 0, 1);
      processes.push({ category: 'staffing', id: `staffing-${view.id}`, icon: APP_ICONS.staffing, label: change.targetWorkers > change.initialWorkers ? 'Hiring' : 'Fire/severance', progress, timing: `${formatNumber(progress * 100, { decimals: 0 })}% · ${formatDuration(Math.max(0, change.completesAtGameTimeMs - currentGameTimeMs) / 60_000)} left`, title: view.displayName });
    }
    if (view.staffTraining) {
      const training = view.staffTraining;
      const progress = clamp((currentGameTimeMs - training.startedAtGameTimeMs) / (training.completesAtGameTimeMs - training.startedAtGameTimeMs), 0, 1);
      processes.push({ category: 'staffing', id: `training-${view.id}`, icon: APP_ICONS.training, label: 'Staff training', progress, timing: `${formatNumber(progress * 100, { decimals: 0 })}% · ${formatDuration(Math.max(0, training.completesAtGameTimeMs - currentGameTimeMs) / 60_000)} left`, title: view.displayName });
    }
    if (view.pendingRepair) {
      const repair = view.pendingRepair;
      const progress = clamp((currentGameTimeMs - repair.startedAtGameTimeMs) / (repair.completesAtGameTimeMs - repair.startedAtGameTimeMs), 0, 1);
      processes.push({ category: 'maintenance', id: `repair-${view.id}`, icon: APP_ICONS.repair, label: 'Repair', progress, timing: `${formatNumber(progress * 100, { decimals: 0 })}% · ${formatDuration(Math.max(0, repair.completesAtGameTimeMs - currentGameTimeMs) / 60_000)} left`, title: view.displayName });
    }
    return processes;
  });

  return [...researchProcesses, ...lenderSearchProcess, ...production, ...pipelineProcess, ...staffingProcesses];
}

function getRemainingProcessMilliseconds(process: ActiveProcess, facilities: FacilityCollection, finance: Finance, research: ResearchLedger): number {
  if (process.id === 'lender-search') {
    const activeLoanSearch = finance.getActiveLoanSearch();
    return activeLoanSearch ? Math.max(1, activeLoanSearch.workRequiredMs - activeLoanSearch.workCompletedMs) : 1;
  }

  if (process.id.startsWith('research-')) {
    const projectId = process.id.slice('research-'.length);
    const activeResearch = research.getActiveProjects().find((project) => project.projectId === projectId);
    const project = activeResearch ? getResearchProject(activeResearch.projectId) : null;
    return project ? Math.max(1, activeResearch!.durationMs - activeResearch!.progressMs) : 1;
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
  panel: { backgroundColor: colors.surface, borderRadius: 16, elevation: 8, marginBottom: 10, maxHeight: 460, padding: 14, shadowColor: '#000000', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.18, shadowRadius: 8, width: 300 },
  panelHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  filterButton: { alignItems: 'center', borderColor: '#D7E2DE', borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  filterButtonActive: { backgroundColor: colors.paleGreen, borderColor: colors.primary },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
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
