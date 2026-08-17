import { describe, expect, it } from 'vitest';
import { getFacilityQualityLimit, getFacilityUpgradeResourceCost } from '@/game/facilities';

describe('getFacilityUpgradeResourceCost', () => {
  it('keeps upgrade resource costs proportional and fractional', () => {
    expect(getFacilityUpgradeResourceCost(1, 0)).toBeCloseTo(0.2);
    expect(getFacilityUpgradeResourceCost(4, 0)).toBeCloseTo(0.8);
    expect(getFacilityUpgradeResourceCost(4, 1)).toBeCloseTo(1.2);
  });

  it('starts facility quality at Q1 and follows the diminishing research curve', () => {
    expect(getFacilityQualityLimit(1)).toBe(1);
    expect(getFacilityQualityLimit(2)).toBeCloseTo(2);
    expect(getFacilityQualityLimit(3)).toBeGreaterThan(2);
    expect(getFacilityQualityLimit(1_000)).toBeLessThan(100);
  });
});
