import { StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text } from 'react-native-paper';
import type { Finance } from '@/game/finance/finance';
import { RESEARCH_PROJECTS, type ResearchChainId, type ResearchLedger, type ResearchProjectDefinition, type ResearchProjectId } from '@/game/research';
import type { ResearchAvailability } from '@/game/core/stores/gameStore';
import { colors } from '@/theme';
import { formatCurrency, formatElapsedTime } from '@/utils';
import { SectionHeading } from '../components/GameViewComponents';
import { styles as dashboardStyles } from '../helpers/dashboard.styles';

const CHAIN_DETAILS: Record<ResearchChainId, { eyebrow: string; title: string; subtitle: string }> = {
  'capital-grants': { eyebrow: 'CAPITAL', title: 'Capital grants', subtitle: 'Fund staged company investment with one-time research grants.' },
  'sales-capacity': { eyebrow: 'SALES', title: 'Sales capacity', subtitle: 'Increase the number of customer contracts your company may keep open.' },
};

export function ResearchView({
  finance,
  getAvailability,
  onCancel,
  onStart,
  research,
}: {
  finance: Finance;
  getAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  onCancel: () => boolean;
  onStart: (projectId: ResearchProjectId) => boolean;
  research: ResearchLedger;
}) {
  const active = research.getActiveProject();
  const completedIds = research.getCompletedProjectIds();
  const activeProject = active ? RESEARCH_PROJECTS.find((project) => project.id === active.projectId) ?? null : null;

  return (
    <View style={localStyles.layout}>
      <View style={localStyles.pageHeading}>
        <SectionHeading eyebrow="RESEARCH" title="Company research" subtitle="Research advances while you play. One project can run at a time." />
      </View>
      {active && activeProject && (
        <View style={localStyles.researchCard}>
          <View style={localStyles.cardBody}>
            <Text style={dashboardStyles.cardKicker}>ACTIVE PROJECT</Text>
            <Text style={localStyles.activeTitle} variant="titleLarge">{activeProject.name}</Text>
            <Text style={[dashboardStyles.cardDescription, localStyles.timeLabel]}>{`Time: ${formatElapsedTime(active.progressMs)} / ${formatElapsedTime(activeProject.durationMs)}`}</Text>
            <ProgressBar accessible accessibilityLabel={`${activeProject.name} progress ${formatElapsedTime(active.progressMs)} of ${formatElapsedTime(activeProject.durationMs)}`} color={colors.primary} progress={Math.min(1, active.progressMs / activeProject.durationMs)} style={localStyles.progress} />
            <Text style={[dashboardStyles.cardDescription, localStyles.paidCost]}>{`Cost paid: ${formatCurrency(active.paidCost)}`}</Text>
            <Button accessibilityLabel={`Cancel ${activeProject.name} and refund ${formatCurrency(active.paidCost)}`} icon="close" mode="outlined" onPress={onCancel} style={localStyles.cancelButton}>Cancel and refund {formatCurrency(active.paidCost)}</Button>
            <Text style={localStyles.cancelNote}>Cancellation refunds the full cost and resets this project’s progress.</Text>
          </View>
        </View>
      )}
      {(['capital-grants', 'sales-capacity'] as const).map((chainId) => {
        const chain = CHAIN_DETAILS[chainId];
        return (
          <View key={chainId} style={localStyles.chain}>
            <View style={localStyles.chainHeading}>
              <SectionHeading eyebrow={chain.eyebrow} title={chain.title} subtitle={chain.subtitle} />
            </View>
            {RESEARCH_PROJECTS.filter((project) => project.chainId === chainId).map((project) => (
              <View key={project.id} style={localStyles.projectCardWrap}>
                <ResearchProjectCard
                  activeProjectId={active?.projectId ?? null}
                  availability={getAvailability(project.id)}
                  completed={completedIds.includes(project.id)}
                  onStart={onStart}
                  project={project}
                />
              </View>
            ))}
          </View>
        );
      })}
      <Text style={localStyles.balanceHint}>{`Available balance: ${formatCurrency(finance.getBalance())}`}</Text>
    </View>
  );
}

function ResearchProjectCard({ activeProjectId, availability, completed, onStart, project }: {
  activeProjectId: ResearchProjectId | null;
  availability: ResearchAvailability;
  completed: boolean;
  onStart: (projectId: ResearchProjectId) => boolean;
  project: ResearchProjectDefinition;
}) {
  const isActive = activeProjectId === project.id;
  const status = completed ? 'Completed' : isActive ? 'In progress' : availability.startable ? 'Ready to start' : 'Locked';
  return (
    <View style={[localStyles.researchCard, !completed && !isActive && !availability.startable && localStyles.lockedCard]}>
      <View style={localStyles.cardBody}>
        <View style={localStyles.projectHeader}><View style={localStyles.projectTitle}><Text variant="titleMedium">{project.name}</Text><Text style={dashboardStyles.cardDescription}>{`${formatCurrency(project.cost)} · ${formatElapsedTime(project.durationMs)}`}</Text></View><Text style={[localStyles.status, completed ? localStyles.completedStatus : availability.startable ? localStyles.readyStatus : localStyles.lockedStatus]}>{status}</Text></View>
        <Text style={[dashboardStyles.cardDescription, localStyles.reward]}>{project.effect.kind === 'grant' ? `Completion reward: ${formatCurrency(project.effect.amount)}` : `Completion reward: maximum ${project.effect.maximum} open contracts`}</Text>
        {!completed && !isActive && !availability.startable && availability.unmetReasons.map((reason) => <Text accessibilityLabel={`Locked condition: ${reason}`} key={reason} style={localStyles.requirement}>{reason}</Text>)}
        {completed && <Text style={localStyles.completedStatus}>Reward applied permanently.</Text>}
        {!completed && !isActive && <Button accessibilityLabel={`Start ${project.name}`} disabled={!availability.startable} mode="contained" onPress={() => onStart(project.id)} style={localStyles.startButton}>Start research</Button>}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  activeTitle: { marginTop: 4 },
  balanceHint: { color: colors.muted, marginTop: 4, textAlign: 'right' },
  cancelButton: { marginTop: 12 },
  cancelNote: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  cardBody: { width: '100%' },
  chain: { marginTop: 20 },
  chainHeading: { marginBottom: 8 },
  completedStatus: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  lockedCard: { opacity: 0.72 },
  lockedStatus: { color: colors.muted },
  layout: { width: '100%' },
  pageHeading: { marginBottom: 12 },
  paidCost: { marginTop: 12 },
  progress: { borderRadius: 6, height: 8, marginTop: 10 },
  projectCardWrap: { marginBottom: 12 },
  projectHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  projectTitle: { flex: 1, marginRight: 12 },
  readyStatus: { color: colors.primary },
  researchCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, width: '100%' },
  requirement: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  reward: { marginTop: 10 },
  status: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  startButton: { marginTop: 12 },
  timeLabel: { marginTop: 4 },
});
