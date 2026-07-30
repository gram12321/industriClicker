import { StyleSheet, View } from 'react-native';
import { Card, List, ProgressBar, Text } from 'react-native-paper';
import type { AchievementLedger } from '@/game/achievements/achievement';
import { ACHIEVEMENT_CATEGORIES, type AchievementCategory } from '@/game/achievements/achievementConstants';
import { createAchievementEvaluationContext, filterAchievementSeriesForDisplay, getAchievementDisplay } from '@/game/achievements/achievementEvaluator';
import type { ProductionStatistics } from '@/game/achievements/productionStatistics';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import type { Finance } from '@/game/finance/finance';
import type { PrestigeLedger } from '@/game/prestige/prestige';
import type { SalesContracts } from '@/game/sales/salesContracts';
import { colors } from '@/theme';
import { formatNumber } from '@/utils';
import { SectionHeading } from '../components/DashboardViewComponents';
import { styles as dashboardStyles } from '../dashboard.styles';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  facilities: 'Facilities',
  production: 'Production',
  sales: 'Sales',
  finance: 'Finance',
  time: 'Time',
  prestige: 'Prestige',
};

export function AchievementsDashboard({
  achievements,
  companyStartedAtGameTimeMs,
  currentGameTimeMs,
  facilities,
  finance,
  prestige,
  productionStatistics,
  salesContracts,
}: {
  achievements: AchievementLedger;
  companyStartedAtGameTimeMs: number;
  currentGameTimeMs: number;
  facilities: FacilityCollection;
  finance: Finance;
  prestige: PrestigeLedger;
  productionStatistics: ProductionStatistics;
  salesContracts: SalesContracts;
}) {
  const context = createAchievementEvaluationContext({
    facilities,
    finance,
    salesContracts,
    prestige,
    productionStatistics,
    companyStartedAtGameTimeMs,
    currentGameTimeMs,
  });
  const displayed = filterAchievementSeriesForDisplay(getAchievementDisplay(context, achievements));
  const unlockedCount = getAchievementDisplay(context, achievements).filter((achievement) => achievement.isUnlocked).length;

  return (
    <>
      <SectionHeading eyebrow="ACHIEVEMENTS" title="Company milestones" subtitle="Track the milestones your company has earned through active play." />
      <Card mode="contained" style={dashboardStyles.featureCard}>
        <Card.Content style={dashboardStyles.cardContent}>
          <Text style={dashboardStyles.cardKicker}>COMPLETION</Text>
          <Text variant="titleLarge">{`${formatNumber(unlockedCount)} unlocked`}</Text>
          <Text style={dashboardStyles.cardDescription}>Completed milestones earn company prestige that fades through active foreground time.</Text>
        </Card.Content>
      </Card>
      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const categoryAchievements = displayed.filter((achievement) => achievement.category === category);
        if (categoryAchievements.length === 0) {
          return null;
        }

        return (
          <View key={category} style={localStyles.category}>
            <Text style={dashboardStyles.sectionEyebrow}>{CATEGORY_LABELS[category].toUpperCase()}</Text>
            {categoryAchievements.map((achievement) => {
              const progress = Math.max(0, Math.min(1, achievement.currentValue / achievement.threshold));
              return (
                <Card key={achievement.id} mode="contained" style={dashboardStyles.featureCard}>
                  <Card.Content style={dashboardStyles.cardContent}>
                    <View style={localStyles.header}>
                      <View style={localStyles.title}>
                        <List.Icon color={achievement.isUnlocked ? colors.primary : colors.muted} icon={achievement.icon} />
                        <Text numberOfLines={1} style={localStyles.titleText} variant="titleMedium">{achievement.name}</Text>
                      </View>
                      <Text style={achievement.isUnlocked ? localStyles.unlocked : localStyles.locked}>{achievement.isUnlocked ? 'Unlocked' : `Tier ${achievement.tier}`}</Text>
                    </View>
                    <Text style={dashboardStyles.cardDescription}>{achievement.description}</Text>
                    <View style={localStyles.progressHeader}><Text style={dashboardStyles.cardKicker}>PROGRESS</Text><Text style={dashboardStyles.cardKicker}>{`${formatNumber(Math.min(achievement.currentValue, achievement.threshold), { smartDecimals: true })} / ${formatNumber(achievement.threshold)}`}</Text></View>
                    <ProgressBar accessible accessibilityLabel={`Progress toward ${achievement.name}`} color={achievement.isUnlocked ? colors.primary : colors.muted} progress={progress} style={localStyles.progress} />
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        );
      })}
    </>
  );
}

const localStyles = StyleSheet.create({
  category: { gap: 8, marginTop: 8 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  locked: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  progress: { borderRadius: 6, height: 8 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  title: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  titleText: { flexShrink: 1 },
  unlocked: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});
