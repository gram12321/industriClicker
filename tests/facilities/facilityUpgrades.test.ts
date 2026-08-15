import { describe, expect, it } from 'vitest';
import { getFacilityUpgradeResourceCost } from '@/game/facilities';

describe('getFacilityUpgradeResourceCost', () => {
  it('keeps upgrade resource costs proportional and fractional', () => {
    expect(getFacilityUpgradeResourceCost(1, 0)).toBeCloseTo(0.2);
    expect(getFacilityUpgradeResourceCost(4, 0)).toBeCloseTo(0.8);
    expect(getFacilityUpgradeResourceCost(4, 1)).toBeCloseTo(1.2);
  });
});
