export type FacilityMaintenanceStatisticsSnapshot = {
  repairedCondition: number;
  largestRepair: number;
  repairValueEuros: number;
};

export function isFacilityMaintenanceStatisticsSnapshot(value: unknown): value is FacilityMaintenanceStatisticsSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const snapshot = value as Record<string, unknown>;
  return typeof snapshot.repairedCondition === 'number' && Number.isFinite(snapshot.repairedCondition) && snapshot.repairedCondition >= 0
    && typeof snapshot.largestRepair === 'number' && Number.isFinite(snapshot.largestRepair) && snapshot.largestRepair >= 0
    && typeof snapshot.repairValueEuros === 'number' && Number.isFinite(snapshot.repairValueEuros) && snapshot.repairValueEuros >= 0;
}

/** Lifetime facility-maintenance facts used by facility and achievement consumers. */
export class FacilityMaintenanceStatistics {
  private repairedCondition = 0;
  private largestRepair = 0;
  private repairValueEuros = 0;

  constructor(snapshot?: FacilityMaintenanceStatisticsSnapshot) {
    if (!snapshot) return;
    this.repairedCondition = snapshot.repairedCondition;
    this.largestRepair = snapshot.largestRepair;
    this.repairValueEuros = snapshot.repairValueEuros;
  }

  recordRepair(condition: number, valueEuros: number): boolean {
    if (!Number.isFinite(condition) || condition <= 0 || !Number.isFinite(valueEuros) || valueEuros < 0) return false;
    this.repairedCondition += condition;
    this.largestRepair = Math.max(this.largestRepair, condition);
    this.repairValueEuros += valueEuros;
    return true;
  }

  getRepairedCondition(): number { return this.repairedCondition; }
  getLargestRepair(): number { return this.largestRepair; }
  getRepairValueEuros(): number { return this.repairValueEuros; }

  clone(): FacilityMaintenanceStatistics {
    return FacilityMaintenanceStatistics.fromSnapshot(this.toSnapshot());
  }

  toSnapshot(): FacilityMaintenanceStatisticsSnapshot {
    return { repairedCondition: this.repairedCondition, largestRepair: this.largestRepair, repairValueEuros: this.repairValueEuros };
  }

  static fromSnapshot(snapshot: FacilityMaintenanceStatisticsSnapshot): FacilityMaintenanceStatistics {
    return new FacilityMaintenanceStatistics(snapshot);
  }
}
