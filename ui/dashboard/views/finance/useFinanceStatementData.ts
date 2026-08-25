import { useMemo } from 'react';
import { buildFinanceStatementData, type Finance } from '@/game/finance';
import type { AchievementLedger } from '@/game/achievements';
import type { FacilityCollection } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import type { ResearchLedger } from '@/game/research';

export function useFinanceStatementData(input: { achievements: AchievementLedger; cashFlowGroupDurationMs: number; companyStartedAtGameTimeMs: number; currentGameTimeMs: number; facilities: FacilityCollection; finance: Finance; inventory: Inventory; market: Market; period: Parameters<typeof buildFinanceStatementData>[0]['period']; research: ResearchLedger }) {
  const { achievements, cashFlowGroupDurationMs, companyStartedAtGameTimeMs, currentGameTimeMs, facilities, finance, inventory, market, period, research } = input;
  return useMemo(() => buildFinanceStatementData({ achievements, cashFlowGroupDurationMs, companyStartedAtGameTimeMs, currentGameTimeMs, facilities, finance, inventory, market, period, research }), [achievements, cashFlowGroupDurationMs, companyStartedAtGameTimeMs, currentGameTimeMs, facilities, finance, inventory, market, period, research]);
}
