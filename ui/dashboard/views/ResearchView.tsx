import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, ProgressBar, Text } from 'react-native-paper';
import type { Finance } from '@/game/finance';
import { FACILITIES, type FacilityCollection } from '@/game/facilities';
import { getRecipe } from '@/game/recipes';
import { calculateDiminishingBonus } from '@/game/core/math/scaling';
import { RESEARCH_PROJECTS, describeResearchEffect, getResearchProject, type ResearchChainId, type ResearchLedger, type ResearchProjectDefinition, type ResearchProjectId } from '@/game/research';
import { LOCAL_MARKET_NETWORK_EXPANSION_PER_MINUTE, type Market } from '@/game/market';
import type { GateRequirement } from '@/game/gates';
import type { ResearchAvailability } from '@/game/core/stores';
import { colors } from '@/theme';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import { formatCurrency as formatCurrencyWithSymbol, formatDuration, formatElapsedTime, getColorClass } from '@/utils';
import { SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { styles as dashboardStyles } from '@/ui/dashboard/helpers/dashboard.styles';

const CHAIN_DETAILS: Record<ResearchChainId, { eyebrow: string; icon: string; title: string; subtitle: string }> = {
  'capital-grants': { eyebrow: 'CAPITAL', icon: 'bank-outline', title: 'Capital grants', subtitle: 'Fund staged company investment with one-time research grants.' },
  'sales-capacity': { eyebrow: 'SALES', icon: 'handshake-outline', title: 'Sales capacity', subtitle: 'Increase the number of customer orders your company may keep open.' },
  'sales-order-value-limit': { eyebrow: 'SALES', icon: 'scale-balance', title: 'Order scope', subtitle: 'Raise the share of company assets a customer order may request.' },
  'sales-targeting': { eyebrow: 'SALES', icon: 'bullseye-arrow', title: 'Sales targeting', subtitle: 'Focus customer offers on goods your company has produced.' },
  'bid-value': { eyebrow: 'SALES', icon: 'cash-multiple', title: 'Bid value', subtitle: 'Increase the premium paid by customer orders.' },
  'relationship-management': { eyebrow: 'SALES', icon: 'account-heart-outline', title: 'Relationship management', subtitle: 'Improve trust retention and soften losses from rejected or expired orders.' },
  'sales-intelligence': { eyebrow: 'SALES', icon: 'brain', title: 'Sales intelligence', subtitle: 'Reduce pressure offers, grow bundle maturity, and improve premium floors.' },
  'local-market-network': { eyebrow: 'MARKET', icon: 'storefront-outline', title: 'Local market network', subtitle: 'Expand local market depth so each trade shifts prices less.' },
  'market-diffusion-network': { eyebrow: 'MARKET', icon: 'transit-connection-variant', title: 'Market diffusion network', subtitle: 'Increase the rate at which local and regional markets rebalance.' },
  'research-capacity': { eyebrow: 'RESEARCH', icon: 'flask-plus-outline', title: 'Research capacity', subtitle: 'Unlock additional research slots so projects can run simultaneously.' },
  'recipe-unlocks': { eyebrow: 'RECIPES', icon: 'flask-outline', title: 'Recipe research', subtitle: 'Unlock production recipes for your facilities.' },
};

type ResearchGroupId = 'capital-grants' | 'sales' | 'research-capacity' | 'recipe-unlocks';
type ResearchGroup = { eyebrow: string; icon: string; id: ResearchGroupId; title: string; subtitle: string; chainIds: readonly ResearchChainId[] };

const RESEARCH_GROUPS: readonly ResearchGroup[] = [
  { id: 'capital-grants', chainIds: ['capital-grants'], eyebrow: 'CAPITAL', icon: 'bank-outline', title: 'Capital grants', subtitle: 'Fund staged company investment with one-time research grants.' },
  { id: 'sales', chainIds: ['sales-capacity', 'sales-order-value-limit', 'sales-targeting', 'bid-value', 'relationship-management', 'sales-intelligence', 'market-diffusion-network', 'local-market-network'], eyebrow: 'SALES', icon: 'handshake-outline', title: 'Sales research', subtitle: 'Grow your pipeline, improve trust outcomes, sharpen offers, and improve market reach.' },
  { id: 'research-capacity', chainIds: ['research-capacity'], eyebrow: 'RESEARCH', icon: 'flask-plus-outline', title: 'Research capacity', subtitle: 'Unlock additional research slots so projects can run simultaneously.' },
  { id: 'recipe-unlocks', chainIds: ['recipe-unlocks'], eyebrow: 'RECIPES', icon: 'flask-outline', title: 'Recipe research', subtitle: 'Unlock production recipes for your facilities.' },
];

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

function getRecipeProjectIcon(project: ResearchProjectDefinition): string | null {
  return project.effect.kind === 'recipe-unlock' || project.effect.kind === 'recipe-work-speed-bonus'
    ? RECIPE_ICONS[project.effect.recipeName]
    : null;
}

function ProjectIcon({ project }: { project: ResearchProjectDefinition }) {
  const recipeIcon = getRecipeProjectIcon(project);
  return recipeIcon ? <Text>{recipeIcon}</Text> : <MaterialCommunityIcons color={colors.primary} name={CHAIN_DETAILS[project.chainId].icon as never} size={20} />;
}

export function ResearchView({
  finance,
  facilities,
  getAvailability,
  onCancel,
  onStart,
  market,
  research,
}: {
  facilities: FacilityCollection;
  finance: Finance;
  getAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  onCancel: (projectId: ResearchProjectId) => boolean;
  onStart: (projectId: ResearchProjectId) => boolean;
  market: Market;
  research: ResearchLedger;
}) {
  const [selectedGroup, setSelectedGroup] = useState<ResearchGroupId | 'all'>('all');
  const [showOnlyConstructedRecipes, setShowOnlyConstructedRecipes] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Record<string, boolean>>({});
  const activeProjects = research.getActiveProjects().flatMap((active) => {
    const project = RESEARCH_PROJECTS.find((candidate) => candidate.id === active.projectId);
    return project ? [{ active, project }] : [];
  });
  const activeProjectIds = new Set(activeProjects.map(({ project }) => project.id));
  const localMarketNetworkActivations = market.getLocalMarketNetworkActivations();
  const completedIds = research.getCompletedProjectIds();
  const completedCount = completedIds.length;
  const completion = RESEARCH_PROJECTS.length === 0 ? 0 : completedCount / RESEARCH_PROJECTS.length;
  const visibleGroups = selectedGroup === 'all' ? RESEARCH_GROUPS : RESEARCH_GROUPS.filter((group) => group.id === selectedGroup);
  const visibleSeriesCount = getResearchSeries(RESEARCH_PROJECTS, completedIds).length;

  return (
    <View style={localStyles.layout}>
      <View style={localStyles.pageHeading}>
        <SectionHeading eyebrow="RESEARCH" title="Company research" subtitle="Research advances while you play. Complete Research Capacity projects to run more projects simultaneously." />
      </View>
      <View style={localStyles.researchCard}>
        <View style={localStyles.overviewHeader}>
          <View style={localStyles.overviewTitle}>
            <Text style={dashboardStyles.cardKicker}>PROGRESS OVERVIEW</Text>
            <Text variant="titleLarge">{`${completedCount} of ${RESEARCH_PROJECTS.length} completed`}</Text>
          </View>
          <View>
            <Text style={[localStyles.completionPercent, { color: getColorClass(completion) }]}>{`${Math.round(completion * 100)}%`}</Text>
            <Text style={localStyles.completionLabel}>Complete</Text>
          </View>
        </View>
        <ProgressBar accessible accessibilityLabel={`${completedCount} of ${RESEARCH_PROJECTS.length} research projects completed`} color={getColorClass(completion)} progress={completion} style={localStyles.overviewProgress} />
      </View>
      {activeProjects.map(({ active, project }) => (
        <View key={project.id} style={localStyles.researchCard}>
          <View style={localStyles.cardBody}>
            <Text style={dashboardStyles.cardKicker}>ACTIVE PROJECT</Text>
            <View style={localStyles.projectNameRow}><ProjectIcon project={project} /><Text style={localStyles.activeTitle} variant="titleLarge">{project.name}</Text></View>
            <View style={localStyles.iconValueRow}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.elapsedTime} size={15} /><Text style={[dashboardStyles.cardDescription, localStyles.timeLabel, { color: getColorClass(Math.min(1, active.progressMs / active.durationMs)) }]}>{`${formatElapsedTime(active.progressMs)} / ${formatElapsedTime(active.durationMs)}`}</Text></View>
            <View style={localStyles.progressTrack}>
              <ProgressBar accessible accessibilityLabel={`${project.name} progress ${formatElapsedTime(active.progressMs)} of ${formatElapsedTime(active.durationMs)}`} color={getColorClass(Math.min(1, active.progressMs / active.durationMs))} progress={Math.min(1, active.progressMs / active.durationMs)} style={localStyles.progress} />
            </View>
            <View style={[localStyles.iconValueRow, localStyles.paidCost]}><Text style={dashboardStyles.cardDescription}>Cost paid:</Text><CurrencyValue value={active.paidCost} /></View>
            <Button accessibilityLabel={`Cancel ${project.name} and refund ${formatCurrency(active.paidCost)}`} icon="close" mode="outlined" onPress={() => onCancel(project.id)} style={localStyles.cancelButton}>Cancel and refund <MaterialCommunityIcons color={colors.primary} name={APP_ICONS.coin} size={15} /> {formatCurrency(active.paidCost).replace(/\s*€/u, '')}</Button>
            <Text style={localStyles.cancelNote}>Cancellation refunds the full cost and resets this project’s progress.</Text>
          </View>
        </View>
      ))}
      {localMarketNetworkActivations.map((activation) => {
        const project = getResearchProject(activation.projectId);
        const progress = Math.min(1, activation.appliedDepthIncrease / activation.totalDepthIncrease);
        const durationMs = activation.totalDepthIncrease / LOCAL_MARKET_NETWORK_EXPANSION_PER_MINUTE * 60_000;
        const elapsedMs = activation.appliedDepthIncrease / LOCAL_MARKET_NETWORK_EXPANSION_PER_MINUTE * 60_000;
        const title = `${project?.name ?? 'Local Market Network'} activation`;
        return <View key={activation.projectId} style={localStyles.researchCard}>
          <View style={localStyles.cardBody}>
            <Text style={dashboardStyles.cardKicker}>MARKET ACTIVATION</Text>
            <View style={localStyles.projectNameRow}><MaterialCommunityIcons color={colors.primary} name="storefront-outline" size={20} /><Text style={localStyles.activeTitle} variant="titleLarge">{title}</Text></View>
            <View style={localStyles.iconValueRow}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.elapsedTime} size={15} /><Text style={[dashboardStyles.cardDescription, localStyles.timeLabel, { color: getColorClass(progress) }]}>{`${formatElapsedTime(elapsedMs)} / ${formatElapsedTime(durationMs)}`}</Text></View>
            <View style={localStyles.progressTrack}><ProgressBar accessible accessibilityLabel={`${title} progress ${formatElapsedTime(elapsedMs)} of ${formatElapsedTime(durationMs)}`} color={getColorClass(progress)} progress={progress} style={localStyles.progress} /></View>
            <Text style={[dashboardStyles.cardDescription, localStyles.activationNote]}>Adding local market stock and benchmark capacity at 5% of each resource’s initial local supply per minute.</Text>
          </View>
        </View>;
      })}
      <View style={[localStyles.researchCard, localStyles.filters]}>
        <Button compact icon="view-grid-outline" mode={selectedGroup === 'all' ? 'contained' : 'outlined'} onPress={() => setSelectedGroup('all')}>{`All (${visibleSeriesCount})`}</Button>
        {RESEARCH_GROUPS.map((group) => {
          const seriesCount = getResearchSeries(RESEARCH_PROJECTS.filter((project) => group.chainIds.includes(project.chainId)), completedIds).length;
          return <Button compact icon={group.icon} key={group.id} mode={selectedGroup === group.id ? 'contained' : 'outlined'} onPress={() => setSelectedGroup(group.id)}>{`${group.title} (${seriesCount})`}</Button>;
        })}
      </View>
      {visibleGroups.map((group) => {
        const chainProjects = RESEARCH_PROJECTS.filter((project) => group.chainIds.includes(project.chainId) && (project.chainId !== 'recipe-unlocks' || !showOnlyConstructedRecipes || isRecipeProjectForConstructedFacility(project, facilities)));
        const displayedSeries = getResearchSeries(chainProjects, completedIds)
          .sort((left, right) => Number(activeProjectIds.has(right.project.id)) - Number(activeProjectIds.has(left.project.id))
            || Number(getAvailability(right.project.id).startable) - Number(getAvailability(left.project.id).startable)
            || left.project.name.localeCompare(right.project.name));
        return (
          <View key={group.id} style={localStyles.chain}>
            <View style={localStyles.chainHeading}>
              <SectionHeading eyebrow={group.eyebrow} title={group.title} subtitle={group.subtitle} />
            </View>
            {group.id === 'recipe-unlocks' && <Button compact mode={showOnlyConstructedRecipes ? 'contained' : 'outlined'} onPress={() => setShowOnlyConstructedRecipes((current) => !current)}>{showOnlyConstructedRecipes ? 'Constructed facilities only' : 'All facility recipes'}</Button>}
            {displayedSeries.map((series) => (
              <View key={series.project.id} style={localStyles.projectCardWrap}>
                <ResearchProjectCard
                  activeProjectIds={activeProjectIds}
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

function ResearchProjectCard({ activeProjectIds, availability, completed, expanded, onStart, onToggleExpanded, project, seriesCompletedCount, seriesProjectCount }: {
  activeProjectIds: ReadonlySet<ResearchProjectId>;
  availability: ResearchAvailability;
  completed: boolean;
  expanded: boolean;
  onStart: (projectId: ResearchProjectId) => boolean;
  onToggleExpanded: () => void;
  project: ResearchProjectDefinition;
  seriesCompletedCount: number;
  seriesProjectCount: number;
}) {
  const isActive = activeProjectIds.has(project.id);
  const status = completed ? 'Completed' : isActive ? 'In progress' : availability.startable ? 'Ready to start' : 'Locked';
  const recipeTimeComparison = getRecipeTimeComparison(project);
  const requirementRows = project.requirements.map((requirement) => { const fulfilled = isRequirementFulfilled(requirement, availability); return <View key={`checked-${requirement.kind}-${getRequirementDescription(requirement)}`} style={localStyles.requirementRow}><MaterialCommunityIcons color={fulfilled ? colors.primary : colors.error} name={fulfilled ? 'check-circle-outline' : 'close-circle-outline'} size={16} /><Text style={localStyles.requirementText}>{getRequirementDescription(requirement)}</Text></View>; });
  return (
    <View style={[localStyles.researchCard, !completed && !isActive && !availability.startable && localStyles.lockedCard]}>
      <View style={localStyles.cardBody}>
        <View style={localStyles.projectHeader}><View style={localStyles.projectTitle}><View style={localStyles.projectNameRow}><ProjectIcon project={project} /><Text variant="titleMedium">{project.name}</Text></View><View style={localStyles.iconValueRow}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.coin} size={15} /><Text style={dashboardStyles.cardDescription}>{availability.usesFreeGrant ? 'Free tutorial grant · 10× faster' : formatCurrency(availability.cost)}</Text><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.elapsedTime} size={15} /><Text style={dashboardStyles.cardDescription}>{formatElapsedTime(availability.durationMs)}</Text></View></View><Text style={[localStyles.status, completed ? localStyles.completedStatus : availability.startable ? localStyles.readyStatus : localStyles.lockedStatus]}>{status}</Text></View>
        <View style={localStyles.seriesProgressHeader}><Text style={dashboardStyles.cardKicker}>RESEARCH CHAIN</Text><Text style={dashboardStyles.cardKicker}>{`${seriesCompletedCount} / ${seriesProjectCount}`}</Text></View>
        <View style={localStyles.seriesProgressTrack}><ProgressBar accessible accessibilityLabel={`${seriesCompletedCount} of ${seriesProjectCount} research projects completed in this chain`} color={getColorClass(seriesProjectCount === 0 ? 0 : seriesCompletedCount / seriesProjectCount)} progress={seriesProjectCount === 0 ? 0 : seriesCompletedCount / seriesProjectCount} style={localStyles.seriesProgress} /></View>
        {recipeTimeComparison && <View style={localStyles.recipeTimeComparison}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.elapsedTime} size={15} /><Text style={dashboardStyles.cardDescription}>Recipe time: {recipeTimeComparison.before} → {recipeTimeComparison.after}</Text></View>}
        {!expanded ? <Button compact onPress={onToggleExpanded}>Show details</Button> : <><Text style={[dashboardStyles.cardDescription, localStyles.reward]}>{`Completion reward: ${describeResearchEffect(project.effect)}`}</Text><Text style={[dashboardStyles.cardKicker, localStyles.requirementsHeading]}>REQUIREMENTS</Text>{requirementRows}{!completed && !isActive && !availability.startable && availability.unmetReasons.map((reason) => <Text accessibilityLabel={`Locked condition: ${reason}`} key={reason} style={localStyles.unmetRequirement}>{reason}</Text>)}{completed && <Text style={localStyles.completedStatus}>Reward applied permanently.</Text>}{!completed && !isActive && <Button accessibilityLabel={`Start ${project.name}`} disabled={!availability.startable} mode="contained" onPress={() => onStart(project.id)} style={localStyles.startButton}>Start research</Button>}<Button compact onPress={onToggleExpanded}>Hide details</Button></>}
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
  activationNote: { color: colors.muted, marginTop: 12 },
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
  progress: { borderRadius: 6, height: 8 },
  progressTrack: { height: 8, marginTop: 10 },
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
