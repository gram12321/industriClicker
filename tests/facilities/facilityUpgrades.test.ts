import { describe, expect, it } from 'vitest';
import { getFacilityMaxStaffWage, getStaffingEfficiency, getStaffQualityFromProgress, getStaffQualityWorkMultiplier, getWageEfficiency } from '@/game/facilities';
import { getFacilityUpgradeResourceCost } from '@/game/facilities';
import { calculateUpgradeMaxQ } from '@/game/quality';

describe('getFacilityUpgradeResourceCost', () => {
  it('keeps upgrade resource costs proportional and fractional', () => {
    expect(getFacilityUpgradeResourceCost(1, 0)).toBeCloseTo(0.2);
    expect(getFacilityUpgradeResourceCost(4, 0)).toBeCloseTo(0.8);
    expect(getFacilityUpgradeResourceCost(4, 1)).toBeCloseTo(1.2);
  });

  it('starts facility quality at Q1 and follows the diminishing research curve', () => {
    expect(calculateUpgradeMaxQ(1)).toBe(1);
    expect(calculateUpgradeMaxQ(2)).toBeCloseTo(2);
    expect(calculateUpgradeMaxQ(3)).toBeGreaterThan(2);
    expect(calculateUpgradeMaxQ(1_000)).toBeLessThan(100);
  });
});

describe('wage staffing efficiency', () => {
  it('maps zero, base, and maximum wage to the intended endpoints', () => {
    expect(getWageEfficiency(0)).toBe(0);
    expect(getWageEfficiency(1)).toBeCloseTo(1);
    expect(getWageEfficiency(getFacilityMaxStaffWage())).toBeCloseTo(10);
  });

  it('penalizes below-base wages and gives diminishing gains above base', () => {
    expect(getWageEfficiency(0.5)).toBeLessThan(0.5);
    expect(getWageEfficiency(10)).toBeGreaterThan(2);
    expect(getWageEfficiency(10)).toBeLessThan(5);
    expect(getWageEfficiency(50)).toBeGreaterThan(getWageEfficiency(10));
    expect(getStaffingEfficiency(1, 1, 0)).toBeCloseTo(0.1);
  });

  it('uses Staff Q as a 1x to 10x work multiplier on the shared quality curve', () => {
    expect(getStaffQualityWorkMultiplier(1)).toBeCloseTo(1);
    expect(getStaffQualityWorkMultiplier(10)).toBeGreaterThan(1);
    expect(getStaffQualityWorkMultiplier(100)).toBeCloseTo(10);
    expect(getStaffQualityFromProgress(0)).toBe(1);
    expect(getStaffQualityFromProgress(1_000_000)).toBeLessThanOrEqual(100);
  });
});
