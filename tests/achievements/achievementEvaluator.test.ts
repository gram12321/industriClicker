import { describe, expect, it } from 'vitest';
import { createAchievementEvaluationContext } from '@/game/achievements';
import { FacilityCollection, FacilityMaintenanceStatistics } from '@/game/facilities';
import { Finance } from '@/game/finance';
import { ResourceFlowLedger } from '@/game/inventory';
import { PrestigeLedger } from '@/game/prestige';
import { ResourceType } from '@/game/resources';
import { SalesOrders } from '@/game/sales';

describe('achievement evaluation context', () => {
  it('consumes lifetime facility output from resource flow', () => {
    const resourceFlow = new ResourceFlowLedger();
    resourceFlow.record('facility-output', ResourceType.Grain, 12, 10_000);
    resourceFlow.record('market-buy', ResourceType.Grain, 100, 10_000);

    const context = createAchievementEvaluationContext({
      facilities: new FacilityCollection(),
      facilityMaintenance: new FacilityMaintenanceStatistics(),
      finance: new Finance(),
      salesOrders: new SalesOrders(),
      prestige: new PrestigeLedger(),
      resourceFlow,
      companyStartedAtGameTimeMs: 0,
      currentGameTimeMs: 10_000,
    });

    expect(context.producedByResource[ResourceType.Grain]).toBe(12);
    expect(context.totalProduced).toBe(12);
  });
});
