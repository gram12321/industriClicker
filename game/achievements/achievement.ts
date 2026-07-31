export type AchievementUnlock = {
  achievementId: string;
  unlockedAtGameTimeMs: number;
};

export type AchievementLedgerSnapshot = {
  unlocks: AchievementUnlock[];
};

function isAchievementUnlock(value: unknown): value is AchievementUnlock {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const unlock = value as Record<string, unknown>;
  return typeof unlock.achievementId === 'string'
    && unlock.achievementId.length > 0
    && typeof unlock.unlockedAtGameTimeMs === 'number'
    && Number.isFinite(unlock.unlockedAtGameTimeMs);
}

export function isAchievementLedgerSnapshot(value: unknown): value is AchievementLedgerSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const unlocks = (value as Record<string, unknown>).unlocks;
  return Array.isArray(unlocks) && unlocks.every(isAchievementUnlock);
}

export class AchievementLedger {
  private unlocks: AchievementUnlock[] = [];

  constructor(snapshot?: AchievementLedgerSnapshot) {
    if (snapshot) {
      this.unlocks = snapshot.unlocks.map((unlock) => ({ ...unlock }));
    }
  }

  getUnlocks(): AchievementUnlock[] {
    return this.unlocks.map((unlock) => ({ ...unlock }));
  }

  getUnlock(achievementId: string): AchievementUnlock | null {
    const unlock = this.unlocks.find((candidate) => candidate.achievementId === achievementId);
    return unlock ? { ...unlock } : null;
  }

  hasUnlocked(achievementId: string): boolean {
    return this.unlocks.some((unlock) => unlock.achievementId === achievementId);
  }

  unlock(achievementId: string, unlockedAtGameTimeMs: number): boolean {
    if (achievementId.length === 0 || !Number.isFinite(unlockedAtGameTimeMs) || this.hasUnlocked(achievementId)) {
      return false;
    }

    this.unlocks.push({ achievementId, unlockedAtGameTimeMs });
    return true;
  }

  clone(): AchievementLedger {
    return AchievementLedger.fromSnapshot(this.toSnapshot());
  }

  toSnapshot(): AchievementLedgerSnapshot {
    return { unlocks: this.getUnlocks() };
  }

  static fromSnapshot(snapshot: AchievementLedgerSnapshot): AchievementLedger {
    return new AchievementLedger(snapshot);
  }
}
