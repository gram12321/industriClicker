import { getRecipeResearchLevelProjectId, getResearchProject, RESEARCH_PROJECT_IDS, type ResearchProjectId } from './researchConstants';
import type { RecipeName } from '@/game/recipes';
import { RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import { calculateDiminishingBonus } from '@/game/core/math/scaling';

export type CompletedResearchProject = { projectId: ResearchProjectId; completedAtGameTimeMs: number };
export type ActiveResearchProject = { projectId: ResearchProjectId; progressMs: number; durationMs: number; paidCost: number };
export type ResearchLedgerSnapshot = { completed: CompletedResearchProject[]; active: ActiveResearchProject[] };

export const BASE_MAXIMUM_OPEN_SALES_CONTRACTS = 2;
export const BASE_SIMULTANEOUS_RESEARCH_PROJECTS = 1;

export function getMaximumSimultaneousResearchProjects(completedProjectIds: readonly string[]): number {
  return completedProjectIds.reduce((maximum, projectId) => {
    const effect = getResearchProject(projectId)?.effect;
    return effect?.kind === 'research-capacity' ? maximum + effect.additionalSlots : maximum;
  }, BASE_SIMULTANEOUS_RESEARCH_PROJECTS);
}

export function getMaximumOpenSalesContracts(completedProjectIds: readonly string[]): number {
  return completedProjectIds.reduce((maximum, projectId) => {
    const effect = getResearchProject(projectId)?.effect;
    return effect?.kind === 'max-open-sales-contracts' ? Math.max(maximum, effect.maximum) : maximum;
  }, BASE_MAXIMUM_OPEN_SALES_CONTRACTS);
}

export function getRecipeResearchWorkSpeedMultiplier(recipeName: RecipeName, completedProjectIds: readonly string[]): number {
  const level = Array.from({ length: 10 }, (_, index) => index + 1).filter((candidate) => completedProjectIds.includes(getRecipeResearchLevelProjectId(recipeName, candidate))).length;
  return 1 + calculateDiminishingBonus(level, 0.75, 0.35);
}

export function getSalesOfferResourceTypes(completedProjectIds: readonly string[], producedByResource: Readonly<Record<ResourceType, number>>): readonly ResourceType[] {
  const hasProducedOnlyTargeting = completedProjectIds.some((projectId) => getResearchProject(projectId)?.effect.kind === 'sales-offer-produced-only');
  const producedResourceTypes = RESOURCE_TYPES.filter((resourceType) => producedByResource[resourceType] > 0);
  return hasProducedOnlyTargeting && producedResourceTypes.length > 0 ? producedResourceTypes : RESOURCE_TYPES;
}

export function getSalesOfferProducedResourceWeight(completedProjectIds: readonly string[]): number {
  return completedProjectIds.reduce((weight, projectId) => {
    const effect = getResearchProject(projectId)?.effect;
    return effect?.kind === 'sales-offer-produced-resource-weight' ? Math.max(weight, effect.multiplier) : weight;
  }, 1);
}

export function getSalesContractPremiumMultiplier(completedProjectIds: readonly string[], baseMultiplier: number): number {
  return completedProjectIds.reduce((multiplier, projectId) => {
    const effect = getResearchProject(projectId)?.effect;
    return effect?.kind === 'sales-contract-premium' ? Math.max(multiplier, effect.multiplier) : multiplier;
  }, baseMultiplier);
}

export function getLocalMarketDepthMultiplier(completedProjectIds: readonly string[]): number {
  return completedProjectIds.reduce((multiplier, projectId) => {
    const effect = getResearchProject(projectId)?.effect;
    return effect?.kind === 'local-market-depth' ? Math.max(multiplier, effect.multiplier) : multiplier;
  }, 1);
}

export function getLocalRegionalDiffusionMultiplier(completedProjectIds: readonly string[]): number {
  return completedProjectIds.reduce((multiplier, projectId) => {
    const effect = getResearchProject(projectId)?.effect;
    return effect?.kind === 'local-regional-diffusion' ? Math.max(multiplier, effect.multiplier) : multiplier;
  }, 1);
}

function isProjectId(value: unknown): value is ResearchProjectId {
  return typeof value === 'string' && (RESEARCH_PROJECT_IDS as readonly string[]).includes(value);
}

function isCompletedProject(value: unknown): value is CompletedResearchProject {
  if (typeof value !== 'object' || value === null) return false;
  const project = value as Record<string, unknown>;
  return isProjectId(project.projectId) && typeof project.completedAtGameTimeMs === 'number' && Number.isFinite(project.completedAtGameTimeMs);
}

function isActiveProject(value: unknown): value is ActiveResearchProject {
  if (typeof value !== 'object' || value === null) return false;
  const project = value as Record<string, unknown>;
  return isProjectId(project.projectId)
    && typeof project.durationMs === 'number' && Number.isFinite(project.durationMs) && project.durationMs > 0
    && typeof project.progressMs === 'number' && Number.isFinite(project.progressMs) && project.progressMs >= 0 && project.progressMs < project.durationMs
    && typeof project.paidCost === 'number' && Number.isFinite(project.paidCost) && project.paidCost >= 0;
}

export function isResearchLedgerSnapshot(value: unknown): value is ResearchLedgerSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const ledger = value as Record<string, unknown>;
  const completed = Array.isArray(ledger.completed) ? ledger.completed : [];
  const active = Array.isArray(ledger.active) ? ledger.active : [];
  return Array.isArray(ledger.completed)
    && completed.every(isCompletedProject)
    && new Set(completed.map((project) => (project as CompletedResearchProject).projectId)).size === completed.length
    && Array.isArray(ledger.active)
    && active.every(isActiveProject)
    && new Set(active.map((project) => (project as ActiveResearchProject).projectId)).size === active.length
    && active.every((project) => !completed.some((completedProject) => (completedProject as CompletedResearchProject).projectId === (project as ActiveResearchProject).projectId));
}

/** Player-owned research progress, kept independent from store and UI concerns. */
export class ResearchLedger {
  private completed: CompletedResearchProject[] = [];
  private active: ActiveResearchProject[] = [];

  constructor(snapshot?: ResearchLedgerSnapshot) {
    if (snapshot) {
      this.completed = snapshot.completed.map((project) => ({ ...project }));
      this.active = snapshot.active.map((project) => ({ ...project }));
    }
  }

  getCompletedProjects(): CompletedResearchProject[] { return this.completed.map((project) => ({ ...project })); }
  getCompletedProjectIds(): ResearchProjectId[] { return this.completed.map((project) => project.projectId); }
  getActiveProjects(): ActiveResearchProject[] { return this.active.map((project) => ({ ...project })); }
  getActiveProject(): ActiveResearchProject | null { return this.active[0] ? { ...this.active[0] } : null; }
  hasCompleted(projectId: string): boolean { return this.completed.some((project) => project.projectId === projectId); }

  start(projectId: ResearchProjectId, paidCost: number, durationMs: number): boolean {
    if (this.hasCompleted(projectId) || this.active.some((project) => project.projectId === projectId) || !Number.isFinite(paidCost) || paidCost < 0 || !Number.isFinite(durationMs) || durationMs <= 0) return false;
    this.active.push({ projectId, progressMs: 0, durationMs: Math.floor(durationMs), paidCost });
    return true;
  }

  advance(elapsedMs: number): ResearchProjectId | null {
    return this.advanceAll(elapsedMs)[0] ?? null;
  }

  advanceAll(elapsedMs: number): ResearchProjectId[] {
    if (this.active.length === 0 || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return [];
    const completedProjects = this.active.filter((project) => {
      project.progressMs = Math.min(project.durationMs, project.progressMs + Math.floor(elapsedMs));
      return project.progressMs >= project.durationMs;
    });
    if (completedProjects.length === 0) return [];
    this.active = this.active.filter((project) => !completedProjects.includes(project));
    this.completed.push(...completedProjects.map((project) => ({ projectId: project.projectId, completedAtGameTimeMs: 0 })));
    return completedProjects.map((project) => project.projectId);
  }

  complete(projectId: ResearchProjectId, completedAtGameTimeMs: number): boolean {
    const record = this.completed.find((project) => project.projectId === projectId);
    if (!record || !Number.isFinite(completedAtGameTimeMs)) return false;
    record.completedAtGameTimeMs = completedAtGameTimeMs;
    return true;
  }

  cancel(): ActiveResearchProject | null {
    const active = this.getActiveProject();
    this.active = this.active.filter((project) => project.projectId !== active?.projectId);
    return active;
  }

  clone(): ResearchLedger { return ResearchLedger.fromSnapshot(this.toSnapshot()); }
  toSnapshot(): ResearchLedgerSnapshot { return { completed: this.getCompletedProjects(), active: this.getActiveProjects() }; }
  static fromSnapshot(snapshot: ResearchLedgerSnapshot): ResearchLedger { return new ResearchLedger(snapshot); }
}
