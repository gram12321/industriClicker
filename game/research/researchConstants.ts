import type { GateRequirement } from '@/game/gates';
import type { ResearchEffect } from './researchEffects';

export const RESEARCH_PROJECT_IDS = [
  'capital-grant-1', 'capital-grant-2', 'capital-grant-3', 'capital-grant-4', 'capital-grant-5',
  'sales-capacity-1', 'sales-capacity-2', 'sales-capacity-3', 'sales-capacity-4', 'sales-capacity-5',
] as const;

export type ResearchProjectId = (typeof RESEARCH_PROJECT_IDS)[number];
export type ResearchChainId = 'capital-grants' | 'sales-capacity';

export type ResearchProjectDefinition = {
  id: ResearchProjectId;
  chainId: ResearchChainId;
  tier: number;
  name: string;
  cost: number;
  durationMs: number;
  requirements: readonly GateRequirement[];
  effect: ResearchEffect;
};

const FACILITY_TIER_1: GateRequirement = { kind: 'achievement', achievementId: 'facility_portfolio_tier_1', label: 'Industrial Footprint 1' };
const CASH_TIER_1: GateRequirement = { kind: 'achievement', achievementId: 'cash_reserves_tier_1', label: 'Cash Reserves 1' };
const CONTRACTS_TIER_1: GateRequirement = { kind: 'achievement', achievementId: 'fulfilled_contracts_tier_1', label: 'Contract Closer 1' };
const CONTRACTS_TIER_2: GateRequirement = { kind: 'achievement', achievementId: 'fulfilled_contracts_tier_2', label: 'Contract Closer 2' };
const PRESTIGE_TIER_1: GateRequirement = { kind: 'minimum-prestige', minimumPrestige: 1 };

export const RESEARCH_PROJECTS: readonly ResearchProjectDefinition[] = [
  { id: 'capital-grant-1', chainId: 'capital-grants', tier: 1, name: 'Capital Grant I', cost: 1_000, durationMs: 60_000, requirements: [FACILITY_TIER_1], effect: { kind: 'grant', amount: 5_000 } },
  { id: 'capital-grant-2', chainId: 'capital-grants', tier: 2, name: 'Capital Grant II', cost: 2_500, durationMs: 120_000, requirements: [{ kind: 'research', projectId: 'capital-grant-1', label: 'Capital Grant I' }, CASH_TIER_1], effect: { kind: 'grant', amount: 10_000 } },
  { id: 'capital-grant-3', chainId: 'capital-grants', tier: 3, name: 'Capital Grant III', cost: 7_500, durationMs: 240_000, requirements: [{ kind: 'research', projectId: 'capital-grant-2', label: 'Capital Grant II' }, CONTRACTS_TIER_1], effect: { kind: 'grant', amount: 20_000 } },
  { id: 'capital-grant-4', chainId: 'capital-grants', tier: 4, name: 'Capital Grant IV', cost: 17_500, durationMs: 480_000, requirements: [{ kind: 'research', projectId: 'capital-grant-3', label: 'Capital Grant III' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 35_000 } },
  { id: 'capital-grant-5', chainId: 'capital-grants', tier: 5, name: 'Capital Grant V', cost: 35_000, durationMs: 900_000, requirements: [{ kind: 'research', projectId: 'capital-grant-4', label: 'Capital Grant IV' }, CONTRACTS_TIER_2], effect: { kind: 'grant', amount: 60_000 } },
  { id: 'sales-capacity-1', chainId: 'sales-capacity', tier: 1, name: 'Sales Capacity I', cost: 500, durationMs: 30_000, requirements: [FACILITY_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 2 } },
  { id: 'sales-capacity-2', chainId: 'sales-capacity', tier: 2, name: 'Sales Capacity II', cost: 1_500, durationMs: 60_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-1', label: 'Sales Capacity I' }, CONTRACTS_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 3 } },
  { id: 'sales-capacity-3', chainId: 'sales-capacity', tier: 3, name: 'Sales Capacity III', cost: 4_000, durationMs: 180_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-2', label: 'Sales Capacity II' }, CASH_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 5 } },
  { id: 'sales-capacity-4', chainId: 'sales-capacity', tier: 4, name: 'Sales Capacity IV', cost: 9_000, durationMs: 360_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-3', label: 'Sales Capacity III' }, PRESTIGE_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 7 } },
  { id: 'sales-capacity-5', chainId: 'sales-capacity', tier: 5, name: 'Sales Capacity V', cost: 20_000, durationMs: 720_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-4', label: 'Sales Capacity IV' }, CONTRACTS_TIER_2], effect: { kind: 'max-open-sales-contracts', maximum: 10 } },
];

export const RESEARCH_PROJECTS_BY_ID: Readonly<Record<ResearchProjectId, ResearchProjectDefinition>> = Object.fromEntries(
  RESEARCH_PROJECTS.map((project) => [project.id, project]),
) as Record<ResearchProjectId, ResearchProjectDefinition>;

export function getResearchProject(projectId: string): ResearchProjectDefinition | null {
  return (RESEARCH_PROJECTS_BY_ID as Record<string, ResearchProjectDefinition | undefined>)[projectId] ?? null;
}
