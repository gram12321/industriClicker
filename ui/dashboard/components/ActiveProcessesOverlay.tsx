import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar, Text } from 'react-native-paper';
import { getFacilityDefinition, type FacilityCollection } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import { getResearchProject, type ResearchLedger } from '@/game/research';
import { calculateSalesContractEstimatedWaitMinutes, calculateSalesContractOfferChance, type SalesContracts } from '@/game/sales';
import { APP_ICONS } from '@/icons';
import { colors } from '@/theme';
import { clamp, formatDuration, formatElapsedTime, formatNumber } from '@/utils';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';

type ActiveProcess = { id: string; icon: string; label: string; progress: number; timing: string; title: string };

export function ActiveProcessesOverlay({ customerPipelineProgress, facilities, inventory, maximumOpenContracts, research, salesContracts }: {
  customerPipelineProgress: number;
  facilities: FacilityCollection;
  inventory: Inventory;
  maximumOpenContracts: number;
  research: ResearchLedger;
  salesContracts: SalesContracts;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const processes = getActiveProcesses({ customerPipelineProgress, facilities, inventory, maximumOpenContracts, research, salesContracts });
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
          </View>)}
        </ScrollView>}
    </View>}
    <Pressable accessibilityLabel={`${isOpen ? 'Hide' : 'Show'} active timers, ${processCountLabel}`} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setIsOpen((current) => !current)} style={localStyles.trigger}>
      <MaterialCommunityIcons color={colors.onDark} name={APP_ICONS.work} size={25} />
      {processes.length > 0 && <View style={localStyles.badge}><Text style={localStyles.badgeText}>{processes.length > 9 ? '9+' : processes.length}</Text></View>}
    </Pressable>
  </View>;
}

function getActiveProcesses({ customerPipelineProgress, facilities, inventory, maximumOpenContracts, research, salesContracts }: Parameters<typeof ActiveProcessesOverlay>[0]): ActiveProcess[] {
  const production = facilities.getAll().flatMap((facility) => {
    if (facility.getProductionStatus(inventory) !== 'producing') return [];
    const recipeName = facility.getActiveRecipeName();
    const recipe = recipeName ? getFacilityDefinition(facility.facilityType).recipes.find((candidate) => candidate.name === recipeName) : null;
    if (!recipe) return [];

    const progress = clamp(facility.getRecipeProgress(recipe.name) / recipe.workAmount, 0, 1);
    const workPerMinute = facility.getEfficiency() * facility.getSpeedMultiplier();
    const minutesRemaining = workPerMinute > 0 ? (recipe.workAmount - facility.getRecipeProgress(recipe.name)) / workPerMinute : 0;
    return [{ id: facility.id, icon: getFacilityDefinition(facility.facilityType).icon, label: formatRecipeName(recipe), progress, timing: `${formatNumber(progress * 100, { decimals: 0 })}% · ${formatDuration(minutesRemaining)} left`, title: facility.getDisplayName() }];
  });

  const activeResearch = research.getActiveProject();
  const researchProcess = activeResearch ? (() => {
    const project = getResearchProject(activeResearch.projectId);
    if (!project) return [];
    const progress = clamp(activeResearch.progressMs / project.durationMs, 0, 1);
    return [{ id: `research-${project.id}`, icon: APP_ICONS.research, label: 'Research', progress, timing: `${formatElapsedTime(Math.max(0, project.durationMs - activeResearch.progressMs))} left`, title: project.name }];
  })() : [];

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

  return [...researchProcess, ...production, ...pipelineProcess];
}

const localStyles = StyleSheet.create({
  badge: { alignItems: 'center', backgroundColor: colors.error, borderColor: colors.surface, borderRadius: 10, borderWidth: 2, justifyContent: 'center', minHeight: 20, minWidth: 20, paddingHorizontal: 3, position: 'absolute', right: -4, top: -4 },
  badgeText: { color: colors.onDark, fontSize: 10, fontWeight: '700' },
  closeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 40, minWidth: 40 },
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
