import { describe, expect, it } from 'vitest';
import { FacilityMaintenanceStatistics } from '@/game/facilities';

describe('FacilityMaintenanceStatistics', () => {
  it('retains lifetime repair facts independently from production flow', () => {
    const statistics = new FacilityMaintenanceStatistics();

    expect(statistics.recordRepair(0.25, 15)).toBe(true);
    expect(statistics.recordRepair(0.5, 30)).toBe(true);
    expect(statistics.toSnapshot()).toEqual({
      repairedCondition: 0.75,
      largestRepair: 0.5,
      repairValueEuros: 45,
    });

    expect(FacilityMaintenanceStatistics.fromSnapshot(statistics.toSnapshot()).getRepairedCondition()).toBe(0.75);
  });
});
