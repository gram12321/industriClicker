import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, ProgressBar, Text } from 'react-native-paper';
import type { Finance } from '@/game/finance';
import { FACILITIES, type FacilityCollection } from '@/game/facilities';
import { getRecipe, getRecipeDisplayName } from '@/game/recipes';
import { calculateDiminishingBonus } from '@/game/core/math/scaling';
import { RESEARCH_PROJECTS, type ResearchChainId, type ResearchLedger, type ResearchProjectDefinition, type ResearchProjectId } from '@/game/research';
import type { GateRequirement } from '@/game/gates';
import type { ResearchAvailability } from '@/game/core/stores';
import { colors } from '@/theme';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import { formatCurrency as formatCurrencyWithSymbol, formatDuration, formatElapsedTime } from '@/utils';
import { SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { styles as dashboardStyles } from '@/ui/dashboard/helpers/dashboard.styles';

const CHAIN_DETAILS: Record<ResearchChainId, { eyebrow: string; icon: string; title: string; subtitle: string }> = {
  'capital-grants': { eyebrow: 'CAPITAL', icon: 'bank-outline', title: 'Capital grants', subtitle: 'Fund staged company investment with one-time research grants.' },
  'sales-capacity': { eyebrow: 'SALES', icon: 'handshake-outline', title: 'Sales capacity', subtitle: 'Increase the number of customer contracts your company may keep open.' },
  'recipe-unlocks': { eyebrow: 'RECIPES', icon: 'flask-outline', title: 'Recipe research', subtitle: 'Unlock production recipes for your facilities.' },
};

const RESEARCH_CHAIN_IDS: readonly ResearchChainId[] = ['capital-grants', 'sales-capacity', 'recipe-unlocks'];

type ResearchSeries = { completedCount: number; project: ResearchProjectDefinition; projects: readonly ResearchProjectDefinition[] };

const formatCurrency = (value: number) => formatCurrencyWithSymbol(value).replace(/\s*€/u, '');

function isRecipeProjectForConstructedFacility(project: ResearchProjectDefinition, facilities: FacilityCollection): boolean {
  if (project.effect.kind !== 'recipe-unlock' && project.effect.kind !== 'recipe-work-speed-bonus') return false;
  const recipeName = project.effect.recipeName;
  return Object.values(FACILITIES).some((facility) => facility.recipes.some((recipe) => recipe.name === recipeName) && facilities.has(facility.type));
}

function CurrencyValue({ value }: { value: number }) {
  return <View style={localStyles.iconValueRow}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.coin} size={15} /><Text style={dashboardStyles.cardDescription}>{formatCurrency(value)}</Text></View>;
}

function isRequirementFulfilled(requirement: GateRequirement, availability: ResearchAvailability): boolean {
  if (availability.unmetReasons.length === 0) return true;
  const label = requirement.kind === 'minimum-prestige' ? String(requirement.minimumPrestige) : requirement.kind === 'starting-condition' ? requirement.label : requirement.label;
  return !availability.unmetReasons.some((reason) => reason.toLowerCase().includes(label.toLowerCase()));
}

function getRecipeTimeComparison(project: ResearchProjectDefinition): { before: string; after: string } | null {
  if (project.effect.kind !== 'recipe-work-speed-bonus') return null;
  const recipe = getRecipe(project.effect.recipeName);
  const beforeBonus = calculateDiminishingBonus(Math.max(0, project.effect.level - 1), 0.75, 0.35);
  const afterBonus = calculateDiminishingBonus(project.effect.level, 0.75, 0.35);
  return { before: formatDuration(recipe.requiredWork / (1 + beforeBonus)), after: formatDuration(recipe.requiredWork / (1 + afterBonus)) };
}

function getResearchSeries(projects: readonly ResearchProjectDefinition[], completedIds: readonly string[]): ResearchSeries[] {
  const projectsBySeries = new Map<string, ResearchProjectDefinition[]>();
  for (const project of projects) {
    const seriesId = project.effect.kind === 'recipe-unlock' || project.effect.kind === 'recipe-work-speed-bonus'
      ? project.effect.recipeName
      : project.chainId;
    projectsBySeries.set(seriesId, [...(projectsBySeries.get(seriesId) ?? []), project]);
  }

  return Array.from(projectsBySeries.values()).map((seriesProjects) => {
    const orderedProjects = [...seriesProjects].sort((left, right) => left.tier - right.tier);
    const completedCount = orderedProjects.filter((project) => completedIds.includes(project.id)).length;
    return { completedCount, project: orderedProjects.find((project) => !completedIds.includes(project.id)) ?? orderedProjects[orderedProjects.length - 1], projects: orderedProjects };
  });
}

function getProjectIcon(project: ResearchProjectDefinition): string {
  return project.effect.kind === 'recipe-unlock' || project.effect.kind === 'recipe-work-speed-bonus'
    ? RECIPE_ICONS[project.effect.recipeName]
    : CHAIN_DETAILS[project.chainId].icon;
}

export function ResearchView({
  finance,
  facilities,
  getAvailability,
  onCancel,
  onStart,
  research,
}: {
  facilities: FacilityCollection;
  finance: Finance;
  getAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  onCancel: () => boolean;
  onStart: (projectId: ResearchProjectId) => boolean;
  research: ResearchLedger;
}) {
  const [selectedChain, setSelectedChain] = useState<ResearchChainId | 'all'>('all');
  const [showOnlyConstructedRecipes, setShowOnlyConstructedRecipes] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Record<string, boolean>>({});
  const active = research.getActiveProject();
  const completedIds = research.getCompletedProjectIds();
  const activeProject = active ? RESEARCH_PROJECTS.find((project) => project.id === active.projectId) ?? null : null;
  const completedCount = completedIds.length;
  const completion = RESEARCH_PROJECTS.length === 0 ? 0 : completedCount / RESEARCH_PROJECTS.length;
  const visibleChains = selectedChain === 'all' ? RESEARCH_CHAIN_IDS : [selectedChain];
  const visibleSeriesCount = getResearchSeries(RESEARCH_PROJECTS, completedIds).length;

  return (
    <View style={localStyles.layout}>
      <View style={localStyles.pageHeading}>
        <SectionHeading eyebrow="RESEARCH" title="Company research" subtitle="Research advances while you play. One project can run at a time." />
      </View>
      <View style={localStyles.researchCard}>
        <View style={localStyles.overviewHeader}>
          <View style={localStyles.overviewTitle}>
            <Text style={dashboardStyles.cardKicker}>PROGRESS OVERVIEW</Text>
            <Text variant="titleLarge">{`${completedCount} of ${RESEARCH_PROJECTS.length} completed`}</Text>
          </View>
          <View>
            <Text style={localStyles.completionPercent}>{`${Math.round(completion * 100)}%`}</Text>
            <Text style={localStyles.completionLabel}>Complete</Text>
          </View>
        </View>
        <ProgressBar accessible accessibilityLabel={`${completedCount} of ${RESEARCH_PROJECTS.length} research projects completed`} color={colors.primary} progress={completion} style={localStyles.overviewProgress} />
      </View>
      {active && activeProject && (
        <View style={localStyles.researchCard}>
          <View style={localStyles.cardBody}>
            <Text style={dashboardStyles.cardKicker}>ACTIVE PROJECT</Text>
            <View style={localStyles.projectNameRow}><MaterialCommunityIcons color={colors.primary} name={getProjectIcon(activeProject) as never} size={20} /><Text style={localStyles.activeTitle} variant="titleLarge">{activeProject.name}</Text></View>
            <View style={localStyles.iconValueRow}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.elapsedTime} size={15} /><Text style={[dashboardStyles.cardDescription, localStyles.timeLabel]}>{`${formatElapsedTime(active.progressMs)} / ${formatElapsedTime(activeProject.durationMs)}`}</Text></View>
            <ProgressBar accessible accessibilityLabel={`${activeProject.name} progress ${formatElapsedTime(active.progressMs)} of ${formatElapsedTime(activeProject.durationMs)}`} color={colors.primary} progress={Math.min(1, active.progressMs / activeProject.durationMs)} style={localStyles.progress} />
            <View style={[localStyles.iconValueRow, localStyles.paidCost]}><Text style={dashboardStyles.cardDescription}>Cost paid:</Text><CurrencyValue value={active.paidCost} /></View>
            <Button accessibilityLabel={`Cancel ${activeProject.name} and refund ${formatCurrency(active.paidCost)}`} icon="close" mode="outlined" onPress={onCancel} style={localStyles.cancelButton}>Cancel and refund <MaterialCommunityIcons color={colors.primary} name={APP_ICONS.coin} size={15} /> {formatCurrency(active.paidCost).replace(/\s*€/u, '')}</Button>
            <Text style={localStyles.cancelNote}>Cancellation refunds the full cost and resets this project’s progress.</Text>
          </View>
        </View>
      )}
      <View style={[localStyles.researchCard, localStyles.filters]}>
        <Button compact icon="view-grid-outline" mode={selectedChain === 'all' ? 'contained' : 'outlined'} onPress={() => setSelectedChain('all')}>{`All (${visibleSeriesCount})`}</Button>
        {RESEARCH_CHAIN_IDS.map((chainId) => {
          const chain = CHAIN_DETAILS[chainId];
          const seriesCount = getResearchSeries(RESEARCH_PROJECTS.filter((project) => project.chainId === chainId), completedIds).length;
          return <Button compact icon={chain.icon} key={chainId} mode={selectedChain === chainId ? 'contained' : 'outlined'} onPress={() => setSelectedChain(chainId)}>{`${chain.title} (${seriesCount})`}</Button>;
        })}
      </View>
      {visibleChains.map((chainId) => {
        const chain = CHAIN_DETAILS[chainId];
        const chainProjects = RESEARCH_PROJECTS.filter((project) => project.chainId === chainId && (chainId !== 'recipe-unlocks' || !showOnlyConstructedRecipes || isRecipeProjectForConstructedFacility(project, facilities)));
        const displayedSeries = getResearchSeries(chainProjects, completedIds)
          .sort((left, right) => Number(right.project.id === active?.projectId) - Number(left.project.id === active?.projectId)
            || Number(getAvailability(right.project.id).startable) - Number(getAvailability(left.project.id).startable)
            || left.project.name.localeCompare(right.project.name));
        return (
          <View key={chainId} style={localStyles.chain}>
            <View style={localStyles.chainHeading}>
              <SectionHeading eyebrow={chain.eyebrow} title={chain.title} subtitle={chain.subtitle} />
            </View>
            {chainId === 'recipe-unlocks' && <Button compact mode={showOnlyConstructedRecipes ? 'contained' : 'outlined'} onPress={() => setShowOnlyConstructedRecipes((current) => !current)}>{showOnlyConstructedRecipes ? 'Constructed facilities only' : 'All facility recipes'}</Button>}
            {displayedSeries.map((series) => (
              <View key={series.project.id} style={localStyles.projectCardWrap}>
                <ResearchProjectCard
                  activeProjectId={active?.projectId ?? null}
                  availability={getAvailability(series.project.id)}
                  completed={completedIds.includes(series.project.id)}
                  expanded={expandedProjectIds[series.project.id] ?? getAvailability(series.project.id).startable}
                  onStart={onStart}
                  onToggleExpanded={() => setExpandedProjectIds((current) => ({ ...current, [series.project.id]: !(current[series.project.id] ?? getAvailability(series.project.id).startable) }))}
                  project={series.project}
                  seriesCompletedCount={series.completedCount}
                  seriesProjectCount={series.projects.length}
                />
              </View>
            ))}
          </View>
        );
      })}
      <View style={[localStyles.iconValueRow, localStyles.balanceHint]}><Text>Available balance:</Text><CurrencyValue value={finance.getBalance()} /></View>
    </View>
  );
}

function ResearchProjectCard({ activeProjectId, availability, completed, expanded, onStart, onToggleExpanded, project, seriesCompletedCount, seriesProjectCount }: {
  activeProjectId: ResearchProjectId | null;
  availability: ResearchAvailability;
  completed: boolean;
  expanded: boolean;
  onStart: (projectId: ResearchProjectId) => boolean;
  onToggleExpanded: () => void;
  project: ResearchProjectDefinition;
  seriesCompletedCount: number;
  seriesProjectCount: number;
}) {
  const isActive = activeProjectId === project.id;
  const status = completed ? 'Completed' : isActive ? 'In progress' : availability.startable ? 'Ready to start' : 'Locked';
  const recipeTimeComparison = getRecipeTimeComparison(project);
  const requirementRows = project.requirements.map((requirement) => { const fulfilled = isRequirementFulfilled(requirement, availability); return <View key={`checked-${requirement.kind}-${getRequirementDescription(requirement)}`} style={localStyles.requirementRow}><MaterialCommunityIcons color={fulfilled ? colors.primary : colors.error} name={fulfilled ? 'check-circle-outline' : 'close-circle-outline'} size={16} /><Text style={localStyles.requirementText}>{getRequirementDescription(requirement)}</Text></View>; });
  return (
    <View style={[localStyles.researchCard, !completed && !isActive && !availability.startable && localStyles.lockedCard]}>
      <View style={localStyles.cardBody}>
        <View style={localStyles.projectHeader}><View style={localStyles.projectTitle}><View style={localStyles.projectNameRow}><MaterialCommunityIcons color={colors.primary} name={getProjectIcon(project) as never} size={20} /><Text variant="titleMedium">{project.name}</Text></View><View style={localStyles.iconValueRow}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.coin} size={15} /><Text style={dashboardStyles.cardDescription}>{availability.usesFreeGrant ? 'Free tutorial grant' : formatCurrency(availability.cost)}</Text><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.elapsedTime} size={15} /><Text style={dashboardStyles.cardDescription}>{formatElapsedTime(project.durationMs)}</Text></View></View><Text style={[localStyles.status, completed ? localStyles.completedStatus : availability.startable ? localStyles.readyStatus : localStyles.lockedStatus]}>{status}</Text></View>
        <View style={localStyles.seriesProgressHeader}><Text style={dashboardStyles.cardKicker}>RESEARCH CHAIN</Text><Text style={dashboardStyles.cardKicker}>{`${seriesCompletedCount} / ${seriesProjectCount}`}</Text></View>
        <View style={localStyles.seriesProgressTrack}><ProgressBar accessible accessibilityLabel={`${seriesCompletedCount} of ${seriesProjectCount} research projects completed in this chain`} color={colors.primary} progress={seriesProjectCount === 0 ? 0 : seriesCompletedCount / seriesProjectCount} style={localStyles.seriesProgress} /></View>
        {recipeTimeComparison && <View style={localStyles.recipeTimeComparison}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.elapsedTime} size={15} /><Text style={dashboardStyles.cardDescription}>Recipe time: {recipeTimeComparison.before} → {recipeTimeComparison.after}</Text></View>}
        {!expanded ? <Button compact onPress={onToggleExpanded}>Show details</Button> : <><Text style={[dashboardStyles.cardDescription, localStyles.reward]}>{project.effect.kind === 'grant' ? `Completion reward: ${formatCurrency(project.effect.amount)}` : project.effect.kind === 'max-open-sales-contracts' ? `Completion reward: maximum ${project.effect.maximum} open contracts` : `Completion reward: unlock ${getRecipeDisplayName(project.effect.recipeName)}`}</Text><Text style={[dashboardStyles.cardKicker, localStyles.requirementsHeading]}>REQUIREMENTS</Text>{requirementRows}{!completed && !isActive && !availability.startable && availability.unmetReasons.map((reason) => <Text accessibilityLabel={`Locked condition: ${reason}`} key={reason} style={localStyles.unmetRequirement}>{reason}</Text>)}{completed && <Text style={localStyles.completedStatus}>Reward applied permanently.</Text>}{!completed && !isActive && <Button accessibilityLabel={`Start ${project.name}`} disabled={!availability.startable} mode="contained" onPress={() => onStart(project.id)} style={localStyles.startButton}>Start research</Button>}<Button compact onPress={onToggleExpanded}>Hide details</Button></>}
      </View>
    </View>
  );
}

function getRequirementDescription(requirement: GateRequirement): string {
  switch (requirement.kind) {
    case 'achievement': return `Achievement: ${requirement.label}`;
    case 'minimum-prestige': return `Prestige: ${requirement.minimumPrestige}`;
    case 'research': return `Research: ${requirement.label}`;
    case 'starting-condition': return `Starting condition: ${requirement.label}`;
  }
}

const localStyles = StyleSheet.create({
  activeTitle: { marginTop: 4 },
  balanceHint: { color: colors.muted, marginTop: 4, textAlign: 'right' },
  cancelButton: { marginTop: 12 },
  cancelNote: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  cardBody: { width: '100%' },
  chain: { marginTop: 20 },
  chainHeading: { marginBottom: 8 },
  completionLabel: { color: colors.muted, fontSize: 12, textAlign: 'right' },
  completionPercent: { color: colors.primary, fontSize: 24, fontWeight: '700', textAlign: 'right' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  iconValueRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  completedStatus: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  lockedCard: { opacity: 0.72 },
  lockedStatus: { color: colors.muted },
  layout: { width: '100%' },
  pageHeading: { marginBottom: 12 },
  overviewHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  overviewProgress: { borderRadius: 6, height: 8, marginTop: 12 },
  overviewTitle: { flex: 1 },
  paidCost: { marginTop: 12 },
  progress: { borderRadius: 6, height: 8, marginTop: 10 },
  projectCardWrap: { marginBottom: 12 },
  projectHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  projectNameRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  projectTitle: { flex: 1, marginRight: 12 },
  readyStatus: { color: colors.primary },
  researchCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, width: '100%' },
  requirement: { color: colors.muted, display: 'none', flex: 1, fontSize: 12, lineHeight: 18 },
  requirementText: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 18 },
  requirementRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 8 },
  recipeTimeComparison: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 6 },
  reward: { marginTop: 10 },
  seriesProgress: { borderRadius: 4, height: 6 },
  seriesProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  seriesProgressTrack: { height: 6, marginTop: 5 },
  requirementsHeading: { marginTop: 12 },
  status: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  startButton: { marginTop: 12 },
  timeLabel: { marginTop: 4 },
  unmetRequirement: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
