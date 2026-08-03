import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, List, ProgressBar, Text } from 'react-native-paper';
import type { AchievementLedger } from '@/game/achievements/achievement';
import { ACHIEVEMENT_CATEGORIES, type AchievementCategory } from '@/game/achievements/achievementConstants';
import { createAchievementEvaluationContext, filterAchievementSeriesForDisplay, getAchievementDisplay } from '@/game/achievements/achievementEvaluator';
import type { ProductionStatistics } from '@/game/achievements/productionStatistics';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import type { Finance } from '@/game/finance/finance';
import type { PrestigeLedger } from '@/game/prestige/prestige';
import type { SalesContracts } from '@/game/sales/salesContracts';
import { colors } from '@/theme';
import { formatNumber, getAchievementMasteryName } from '@/utils';
import { SectionHeading } from '../../components/GameViewComponents';
import { styles as dashboardStyles } from '../../helpers/dashboard.styles';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  facilities: 'Facilities',
  production: 'Production',
  sales: 'Sales',
  finance: 'Finance',
  time: 'Time',
  prestige: 'Prestige',
};

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  facilities: 'factory',
  production: 'cog-outline',
  sales: 'handshake-outline',
  finance: 'cash-multiple',
  time: 'clock-outline',
  prestige: 'trophy-outline',
};

export function AchievementsView({
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
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [showCompletedTiers, setShowCompletedTiers] = useState(false);
  const context = createAchievementEvaluationContext({
    facilities,
    finance,
    salesContracts,
    prestige,
    productionStatistics,
    companyStartedAtGameTimeMs,
    currentGameTimeMs,
  });
  const allAchievements = getAchievementDisplay(context, achievements);
  const displayed = showCompletedTiers ? allAchievements : filterAchievementSeriesForDisplay(allAchievements);
  const visibleAchievements = selectedCategory === 'all'
    ? displayed
    : displayed.filter((achievement) => achievement.category === selectedCategory);
  const unlockedCount = allAchievements.filter((achievement) => achievement.isUnlocked).length;
  const completion = allAchievements.length === 0 ? 0 : unlockedCount / allAchievements.length;

  return (
    <>
      <SectionHeading eyebrow="ACHIEVEMENTS" title="Company milestones" subtitle="Track the milestones your company has earned through active play." />
      <Card mode="contained" style={dashboardStyles.featureCard}>
        <Card.Content style={dashboardStyles.cardContent}>
          <View style={localStyles.overviewHeader}>
            <View style={localStyles.overviewTitle}>
              <Text style={dashboardStyles.cardKicker}>PROGRESS OVERVIEW</Text>
              <Text variant="titleLarge">{`${formatNumber(unlockedCount)} of ${formatNumber(allAchievements.length)} unlocked`}</Text>
            </View>
            <View>
              <Text style={localStyles.completionPercent}>{`${formatNumber(completion * 100, { decimals: 0 })}%`}</Text>
              <Text style={localStyles.completionLabel}>Complete</Text>
            </View>
          </View>
          <ProgressBar accessible accessibilityLabel={`${formatNumber(unlockedCount)} of ${formatNumber(allAchievements.length)} achievements unlocked`} color={colors.primary} progress={completion} style={localStyles.overviewProgress} />
        </Card.Content>
      </Card>
      <Card mode="contained" style={dashboardStyles.featureCard}>
        <Card.Content style={localStyles.filters}>
          <Button compact icon="view-grid-outline" mode={selectedCategory === 'all' ? 'contained' : 'outlined'} onPress={() => setSelectedCategory('all')}>{`All (${formatNumber(allAchievements.length)})`}</Button>
          {ACHIEVEMENT_CATEGORIES.map((category) => (
            <Button compact icon={CATEGORY_ICONS[category]} key={category} mode={selectedCategory === category ? 'contained' : 'outlined'} onPress={() => setSelectedCategory(category)}>{`${CATEGORY_LABELS[category]} (${formatNumber(allAchievements.filter((achievement) => achievement.category === category).length)})`}</Button>
          ))}
          <Button compact icon={showCompletedTiers ? 'chevron-up' : 'history'} mode={showCompletedTiers ? 'contained' : 'outlined'} onPress={() => setShowCompletedTiers((current) => !current)}>{showCompletedTiers ? 'Hide completed tiers' : 'Show completed tiers'}</Button>
        </Card.Content>
      </Card>
      {(selectedCategory === 'all' ? ACHIEVEMENT_CATEGORIES : [selectedCategory]).map((category) => {
        const categoryAchievements = visibleAchievements.filter((achievement) => achievement.category === category);
        if (categoryAchievements.length === 0) {
          return null;
        }

        return (
          <View key={category} style={localStyles.category}>
            <Text style={dashboardStyles.sectionEyebrow}>{CATEGORY_LABELS[category].toUpperCase()}</Text>
            {categoryAchievements.map((achievement) => {
              const progress = Math.max(0, Math.min(1, achievement.currentValue / achievement.threshold));
              const masteryName = getAchievementMasteryName(achievement.tier);
              return (
                <Card key={achievement.id} mode="contained" style={dashboardStyles.featureCard}>
                  <Card.Content style={dashboardStyles.cardContent}>
                    <View style={localStyles.header}>
                      <View style={localStyles.title}>
                        <List.Icon color={achievement.isUnlocked ? colors.primary : colors.muted} icon={achievement.isUnlocked ? achievement.icon : 'lock-outline'} />
                        <Text numberOfLines={1} style={localStyles.titleText} variant="titleMedium">{achievement.name}</Text>
                      </View>
                      <View style={[localStyles.masteryPill, achievement.isUnlocked ? localStyles.unlockedMasteryPill : localStyles.lockedMasteryPill]}>
                        <Text style={achievement.isUnlocked ? localStyles.unlocked : localStyles.locked}>{achievement.isUnlocked ? `Unlocked · ${masteryName}` : masteryName}</Text>
                      </View>
                    </View>
                    <Text style={dashboardStyles.cardDescription}>{achievement.description}</Text>
                    <Text style={localStyles.reward}>{`Reward: ${formatNumber(achievement.prestigeAmount, { smartDecimals: true })} prestige`}</Text>
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
  completionLabel: { color: colors.muted, fontSize: 12, textAlign: 'right' },
  completionPercent: { color: colors.primary, fontSize: 24, fontWeight: '700', textAlign: 'right' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  locked: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  lockedMasteryPill: { backgroundColor: colors.softBackground },
  masteryPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  overviewHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  overviewProgress: { borderRadius: 6, height: 8 },
  overviewTitle: { flex: 1, gap: 2 },
  progress: { borderRadius: 6, height: 8 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  reward: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  title: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  titleText: { flexShrink: 1 },
  unlocked: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  unlockedMasteryPill: { backgroundColor: colors.paleGreen },
});
