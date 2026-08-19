export type FreeActionGrant = {
  id: string;
  action: 'start-research';
  targetId: string;
  grantedAtGameTimeMs: number;
  usedAtGameTimeMs: number | null;
  resourceRewardGrantedAtGameTimeMs?: number | null;
};

export type GrantLedgerSnapshot = { grants: FreeActionGrant[] };

function isFreeActionGrant(value: unknown): value is FreeActionGrant {
  if (typeof value !== 'object' || value === null) return false;
  const grant = value as Record<string, unknown>;
  return typeof grant.id === 'string' && grant.id.length > 0
    && grant.action === 'start-research'
    && typeof grant.targetId === 'string' && grant.targetId.length > 0
    && typeof grant.grantedAtGameTimeMs === 'number' && Number.isFinite(grant.grantedAtGameTimeMs)
    && (grant.usedAtGameTimeMs === null || (typeof grant.usedAtGameTimeMs === 'number' && Number.isFinite(grant.usedAtGameTimeMs)))
    && (grant.resourceRewardGrantedAtGameTimeMs === undefined || grant.resourceRewardGrantedAtGameTimeMs === null || (typeof grant.resourceRewardGrantedAtGameTimeMs === 'number' && Number.isFinite(grant.resourceRewardGrantedAtGameTimeMs)));

}

export function isGrantLedgerSnapshot(value: unknown): value is GrantLedgerSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const grants = (value as Record<string, unknown>).grants;
  return Array.isArray(grants)
    && grants.every(isFreeActionGrant)
    && new Set((grants as FreeActionGrant[]).map((grant) => grant.id)).size === grants.length;
}

/** Durable one-use grants that waive the cost of a specific player action. */
export class GrantLedger {
  private grants: FreeActionGrant[] = [];

  constructor(snapshot?: GrantLedgerSnapshot) {
    if (snapshot) this.grants = snapshot.grants.map((grant) => ({ ...grant }));
  }

  grant(input: Omit<FreeActionGrant, 'usedAtGameTimeMs'>): boolean {
    if (this.grants.some((grant) => grant.id === input.id)) return false;
    this.grants.push({ ...input, usedAtGameTimeMs: null, resourceRewardGrantedAtGameTimeMs: null });
    return true;
  }

  hasAvailableFreeAction(action: FreeActionGrant['action'], targetId: string): boolean {
    return this.grants.some((grant) => grant.action === action && grant.targetId === targetId && grant.usedAtGameTimeMs === null);
  }

  hasAvailableFreeActionForTargets(action: FreeActionGrant['action'], targetIds: readonly string[]): boolean {
    return this.grants.some((grant) => grant.action === action && targetIds.includes(grant.targetId) && grant.usedAtGameTimeMs === null);
  }

  useFreeAction(action: FreeActionGrant['action'], targetId: string, usedAtGameTimeMs: number): boolean {
    const grant = this.grants.find((candidate) => candidate.action === action && candidate.targetId === targetId && candidate.usedAtGameTimeMs === null);
    if (!grant || !Number.isFinite(usedAtGameTimeMs)) return false;
    grant.usedAtGameTimeMs = usedAtGameTimeMs;
    return true;
  }

  useFreeActionForTargets(action: FreeActionGrant['action'], targetIds: readonly string[], usedAtGameTimeMs: number): boolean {
    const grant = this.grants.find((candidate) => candidate.action === action && targetIds.includes(candidate.targetId) && candidate.usedAtGameTimeMs === null);
    if (!grant || !Number.isFinite(usedAtGameTimeMs)) return false;
    grant.usedAtGameTimeMs = usedAtGameTimeMs;
    return true;
  }

  claimResourceReward(action: FreeActionGrant['action'], targetId: string, rewardedAtGameTimeMs: number): boolean {
    const grant = this.grants.find((candidate) => candidate.action === action
      && candidate.targetId === targetId
      && candidate.usedAtGameTimeMs !== null
      && candidate.resourceRewardGrantedAtGameTimeMs == null);
    if (!grant || !Number.isFinite(rewardedAtGameTimeMs)) return false;
    grant.resourceRewardGrantedAtGameTimeMs = rewardedAtGameTimeMs;
    return true;
  }

  toSnapshot(): GrantLedgerSnapshot {
    return { grants: this.grants.map((grant) => ({ ...grant })) };
  }

  clone(): GrantLedger {
    return GrantLedger.fromSnapshot(this.toSnapshot());
  }

  static fromSnapshot(snapshot: GrantLedgerSnapshot): GrantLedger {
    return new GrantLedger(snapshot);
  }
}
