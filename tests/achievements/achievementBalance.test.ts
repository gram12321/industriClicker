import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_DEFINITIONS } from '@/game/achievements';

describe('early achievement balance', () => {
  it('keeps the first milestones from unlocking immediately', () => {
    const threshold = (seriesId: string) => ACHIEVEMENT_DEFINITIONS.find((achievement) => achievement.seriesId === seriesId && achievement.tier === 1)?.threshold;

    expect(threshold('facility_portfolio')).toBe(1);
    expect(threshold('total_production')).toBe(25);
    expect(threshold('fulfilled_orders')).toBe(3);
    expect(threshold('company_time')).toBe(30);
  });

  it('decays early achievement prestige on shorter half-lives', () => {
    const firstTier = ACHIEVEMENT_DEFINITIONS.find((achievement) => achievement.seriesId === 'facility_portfolio' && achievement.tier === 1);
    const secondTier = ACHIEVEMENT_DEFINITIONS.find((achievement) => achievement.seriesId === 'facility_portfolio' && achievement.tier === 2);

    expect(firstTier?.prestigeHalfLifeForegroundHours).toBe(1);
    expect(secondTier?.prestigeHalfLifeForegroundHours).toBe(5);
  });
});
