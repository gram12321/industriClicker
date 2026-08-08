import { getRecipeResearchLevelProjectId, getResearchProject, RESEARCH_PROJECT_IDS, type ResearchProjectId } from './researchConstants';
import type { RecipeName } from '@/game/recipes';
import { calculateDiminishingBonus } from '@/game/core/math/scaling';

export type CompletedResearchProject = { projectId: ResearchProjectId; completedAtGameTimeMs: number };
export type ActiveResearchProject = { projectId: ResearchProjectId; progressMs: number; paidCost: number };
export type ResearchLedgerSnapshot = { completed: CompletedResearchProject[]; active: ActiveResearchProject | null };

export const BASE_MAXIMUM_OPEN_SALES_CONTRACTS = 1;

export function getMaximumOpenSalesContracts(completedProjectIds: readonly string[]): number {
  return completedProjectIds.reduce((maximum, projectId) => {
    const effect = getResearchProject(projectId)?.effect;
    return effect?.kind === 'max-open-sales-contracts' ? Math.max(maximum, effect.maximum) : maximum;
  }, BASE_MAXIMUM_OPEN_SALES_CONTRACTS);
}

export function getRecipeTimeMultiplier(recipeName: RecipeName, completedProjectIds: readonly string[]): number {
  const level = Array.from({ length: 10 }, (_, index) => index + 1).filter((candidate) => completedProjectIds.includes(getRecipeResearchLevelProjectId(recipeName, candidate))).length;
  return 1 + calculateDiminishingBonus(level, 0.75, 0.35);
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
  const definition = isProjectId(project.projectId) ? getResearchProject(project.projectId) : null;
  return definition !== null
    && typeof project.progressMs === 'number' && Number.isFinite(project.progressMs) && project.progressMs >= 0 && project.progressMs < definition.durationMs
    && typeof project.paidCost === 'number' && Number.isFinite(project.paidCost) && project.paidCost >= 0;
}

export function isResearchLedgerSnapshot(value: unknown): value is ResearchLedgerSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const ledger = value as Record<string, unknown>;
  return Array.isArray(ledger.completed)
    && ledger.completed.every(isCompletedProject)
    && new Set(ledger.completed.map((project: CompletedResearchProject) => project.projectId)).size === ledger.completed.length
    && (ledger.active === null || isActiveProject(ledger.active));
}

/** Player-owned research progress, kept independent from store and UI concerns. */
export class ResearchLedger {
  private completed: CompletedResearchProject[] = [];
  private active: ActiveResearchProject | null = null;

  constructor(snapshot?: ResearchLedgerSnapshot) {
    if (snapshot) {
      this.completed = snapshot.completed.map((project) => ({ ...project }));
      this.active = snapshot.active ? { ...snapshot.active } : null;
    }
  }

  getCompletedProjects(): CompletedResearchProject[] { return this.completed.map((project) => ({ ...project })); }
  getCompletedProjectIds(): ResearchProjectId[] { return this.completed.map((project) => project.projectId); }
  getActiveProject(): ActiveResearchProject | null { return this.active ? { ...this.active } : null; }
  hasCompleted(projectId: string): boolean { return this.completed.some((project) => project.projectId === projectId); }

  start(projectId: ResearchProjectId, paidCost: number): boolean {
    if (this.active || this.hasCompleted(projectId) || !Number.isFinite(paidCost) || paidCost < 0) return false;
    this.active = { projectId, progressMs: 0, paidCost };
    return true;
  }

  advance(elapsedMs: number): ResearchProjectId | null {
    if (!this.active || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return null;
    const definition = getResearchProject(this.active.projectId);
    if (!definition) return null;
    this.active.progressMs = Math.min(definition.durationMs, this.active.progressMs + Math.floor(elapsedMs));
    if (this.active.progressMs < definition.durationMs) return null;
    const projectId = this.active.projectId;
    this.completed.push({ projectId, completedAtGameTimeMs: 0 });
    this.active = null;
    return projectId;
  }

  complete(projectId: ResearchProjectId, completedAtGameTimeMs: number): boolean {
    const record = this.completed.find((project) => project.projectId === projectId);
    if (!record || !Number.isFinite(completedAtGameTimeMs)) return false;
    record.completedAtGameTimeMs = completedAtGameTimeMs;
    return true;
  }

  cancel(): ActiveResearchProject | null {
    const active = this.getActiveProject();
    this.active = null;
    return active;
  }

  clone(): ResearchLedger { return ResearchLedger.fromSnapshot(this.toSnapshot()); }
  toSnapshot(): ResearchLedgerSnapshot { return { completed: this.getCompletedProjects(), active: this.getActiveProject() }; }
  static fromSnapshot(snapshot: ResearchLedgerSnapshot): ResearchLedger { return new ResearchLedger(snapshot); }
}
