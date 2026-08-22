import type { RecipeName } from '@/game/recipes';
import { calculateAsymmetricalScaler01 } from '@/game/core/math/scaling';
import { calculateUpgradeMaxQ } from '@/game/quality';
import { getFacilityDefinition } from './facilityConstants';
import { FacilityType } from './facilityTypes';
import { getConditionDecayMultiplier, getFacilityConditionEfficiency, getFacilityEfficiency, getOutputUpgradeMultiplier, getOverstaffingConditionDecayMultiplier, getRequiredWorkers, getSpeedUpgradeWorkSpeedMultiplier, getStaffingEfficiency } from './facilityUpgrades';

/** Plain data used by the game snapshot and Expo SQLite adapter. */
export type FacilitySnapshot = {
  id: string;
  facilityType: FacilityType;
  activeRecipeName: RecipeName | null;
  productionCycle: RecipeName[];
  productionCycleIndex: number;
  isActive: boolean;
  recipeProgress: Partial<Record<RecipeName, number>>;
  recipeInputQ: number | null;
  qualityUpgradeLevel: number;
  speedUpgradeLevel?: number;
  outputUpgradeLevel?: number;
  conditionDecayUpgradeLevel?: number;
  assignedWorkers?: number;
  facilityCondition: number;
  autoRepairEnabled: boolean;
  autoRepairThreshold: number;
  autoRepairTarget: number;
};

/** Immutable facility state and derived values for game rules and UI rendering. */
export type FacilityView = {
  id: string;
  facilityType: FacilityType;
  displayName: string;
  activeRecipeName: RecipeName | null;
  productionCycle: readonly RecipeName[];
  productionCycleIndex: number;
  isActive: boolean;
  recipeProgress: Readonly<Partial<Record<RecipeName, number>>>;
  recipeInputQ: number | null;
  qualityUpgradeLevel: number;
  upgradeMaxQ: number;
  speedUpgradeLevel: number;
  outputUpgradeLevel: number;
  conditionDecayUpgradeLevel: number;
  conditionDecayMultiplier: number;
  overstaffingConditionDecayMultiplier: number;
  assignedWorkers: number;
  requiredWorkers: number;
  staffingEfficiency: number;
  facilityCondition: number;
  conditionEfficiency: number;
  facilityEfficiency: number;
  autoRepairEnabled: boolean;
  autoRepairThreshold: number;
  autoRepairTarget: number;
  speedUpgradeWorkSpeedMultiplier: number;
  outputMultiplier: number;
};

/** Player-owned state for one constructed facility. */
export class Facility {
  private activeRecipeName: RecipeName | null = null;
  private productionCycle: RecipeName[] = [];
  private productionCycleIndex = 0;
  private active = false;
  private recipeProgress: Partial<Record<RecipeName, number>> = {};
  private recipeInputQ: number | null = null;
  private qualityUpgradeLevel = 1;
  private speedUpgradeLevel = 0;
  private outputUpgradeLevel = 0;
  private conditionDecayUpgradeLevel = 0;
  private assignedWorkers = 0;
  private facilityCondition = 1;
  private autoRepairEnabled = false;
  private autoRepairThreshold = 0.7;
  private autoRepairTarget = 1;

  constructor(
    public readonly id: string,
    public readonly facilityType: FacilityType,
    snapshot?: FacilitySnapshot,
  ) {
    if (snapshot) {
      this.restore(snapshot);
    } else {
      this.assignedWorkers = this.calculateRequiredWorkers();
    }
  }

  getView(): FacilityView {
    const requiredWorkers = this.calculateRequiredWorkers();
    const staffingEfficiency = getStaffingEfficiency(this.assignedWorkers, requiredWorkers);
    const facilityEfficiency = getFacilityEfficiency(staffingEfficiency, this.facilityCondition);
    return {
      id: this.id,
      facilityType: this.facilityType,
      displayName: `${getFacilityDefinition(this.facilityType).name} #${this.id.split('-').at(-1)}`,
      activeRecipeName: this.activeRecipeName,
      productionCycle: [...this.productionCycle],
      productionCycleIndex: this.productionCycleIndex,
      isActive: this.active,
      recipeProgress: { ...this.recipeProgress },
      recipeInputQ: this.recipeInputQ,
      qualityUpgradeLevel: this.qualityUpgradeLevel,
      upgradeMaxQ: calculateUpgradeMaxQ(this.qualityUpgradeLevel),
      speedUpgradeLevel: this.speedUpgradeLevel,
      outputUpgradeLevel: this.outputUpgradeLevel,
      conditionDecayUpgradeLevel: this.conditionDecayUpgradeLevel,
      conditionDecayMultiplier: getConditionDecayMultiplier(this.conditionDecayUpgradeLevel),
      overstaffingConditionDecayMultiplier: getOverstaffingConditionDecayMultiplier(this.assignedWorkers, requiredWorkers),
      assignedWorkers: this.assignedWorkers,
      requiredWorkers,
      staffingEfficiency,
      facilityCondition: this.facilityCondition,
      conditionEfficiency: getFacilityConditionEfficiency(this.facilityCondition),
      facilityEfficiency,
      autoRepairEnabled: this.autoRepairEnabled,
      autoRepairThreshold: this.autoRepairThreshold,
      autoRepairTarget: this.autoRepairTarget,
      speedUpgradeWorkSpeedMultiplier: getSpeedUpgradeWorkSpeedMultiplier(this.speedUpgradeLevel),
      outputMultiplier: getOutputUpgradeMultiplier(this.outputUpgradeLevel),
    };
  }

  private calculateRequiredWorkers(): number {
    return getRequiredWorkers(
      getFacilityDefinition(this.facilityType).baseWorkers,
      this.speedUpgradeLevel,
      this.outputUpgradeLevel,
    );
  }

  setAssignedWorkers(workerCount: number): boolean {
    if (!Number.isInteger(workerCount) || workerCount < 0) {
      return false;
    }

    this.assignedWorkers = workerCount;
    return true;
  }

  upgradeSpeed(): void {
    this.speedUpgradeLevel += 1;
  }

  upgradeOutput(): void {
    this.outputUpgradeLevel += 1;
  }

  upgradeConditionDecay(): void {
    this.conditionDecayUpgradeLevel += 1;
  }

  setActiveRecipe(recipeName: RecipeName | null): boolean {
    if (recipeName === null) {
      this.activeRecipeName = null;
      this.productionCycle = [];
      this.productionCycleIndex = 0;
      this.active = false;
      this.recipeInputQ = null;
      return true;
    }

    return this.setProductionCycle([recipeName]);
  }

  setAutoRepair(enabled: boolean, threshold: number, target: number): boolean {
    if (typeof enabled !== 'boolean' || !Number.isFinite(threshold) || !Number.isFinite(target)) return false;
    const normalizedThreshold = Math.min(1, Math.max(0, threshold));
    const normalizedTarget = Math.min(1, Math.max(0, target));
    if (normalizedTarget <= normalizedThreshold) return false;
    this.autoRepairEnabled = enabled;
    this.autoRepairThreshold = normalizedThreshold;
    this.autoRepairTarget = normalizedTarget;
    return true;
  }

  upgradeQuality(): void {
    this.qualityUpgradeLevel += 1;
  }

  setProductionCycle(recipeNames: readonly RecipeName[]): boolean {
    if (recipeNames.length === 0) return this.setActiveRecipe(null);
    if (!recipeNames.every((recipeName) => getFacilityDefinition(this.facilityType).recipes.some((recipe) => recipe.name === recipeName))) return false;

    this.productionCycle = [...recipeNames];
    this.productionCycleIndex = 0;
    this.activeRecipeName = this.productionCycle[0] ?? null;
    this.active = this.activeRecipeName !== null;
    this.recipeInputQ = null;
    return true;
  }

  /** Internal production-state command that selects the next recipe in the configured cycle. */
  advanceProductionCycle(): boolean {
    if (!this.activeRecipeName || this.productionCycle.length === 0) return false;
    this.productionCycleIndex = (this.productionCycleIndex + 1) % this.productionCycle.length;
    this.activeRecipeName = this.productionCycle[this.productionCycleIndex] ?? null;
    return this.activeRecipeName !== null;
  }

  setProductionActive(active: boolean): boolean {
    if (!this.activeRecipeName) return false;
    this.active = active;
    return true;
  }

  /** Applies condition-scaled wear while keeping the player-owned value in its 0–1 range. */
  applyConditionLoss(loss: number): boolean {
    if (!Number.isFinite(loss) || loss <= 0 || this.facilityCondition === 0) {
      return false;
    }

    const scaledLoss = loss
      * calculateAsymmetricalScaler01(this.facilityCondition)
      * getConditionDecayMultiplier(this.conditionDecayUpgradeLevel)
      * getOverstaffingConditionDecayMultiplier(this.assignedWorkers, this.calculateRequiredWorkers());
    this.facilityCondition = Math.max(0, this.facilityCondition - scaledLoss);
    return true;
  }

  repairCondition(targetCondition = 1): boolean {
    const target = Number.isFinite(targetCondition) ? Math.min(1, Math.max(0, targetCondition)) : 1;
    if (target <= this.facilityCondition) return false;
    this.facilityCondition = target;
    return true;
  }

  /** Internal production-state command used by the facility production engine. */
  setRecipeProgress(recipeName: RecipeName, progress: number): boolean {
    const recipe = getFacilityDefinition(this.facilityType).recipes.find((candidate) => candidate.name === recipeName);
    if (!recipe || !Number.isFinite(progress) || progress < 0 || progress >= recipe.requiredWork) {
      return false;
    }

    this.recipeProgress[recipeName] = progress;
    return true;
  }

  /** Records the weighted quality of inputs consumed for the in-progress cycle. */
  setRecipeInputQ(inputQ: number | null): void {
    this.recipeInputQ = inputQ !== null && Number.isFinite(inputQ) && inputQ > 0 ? inputQ : null;
  }

  toSnapshot(): FacilitySnapshot {
    return {
      id: this.id,
      facilityType: this.facilityType,
      activeRecipeName: this.activeRecipeName,
      productionCycle: [...this.productionCycle],
      productionCycleIndex: this.productionCycleIndex,
      isActive: this.active,
      recipeProgress: { ...this.recipeProgress },
      recipeInputQ: this.recipeInputQ,
      qualityUpgradeLevel: this.qualityUpgradeLevel,
      speedUpgradeLevel: this.speedUpgradeLevel,
      outputUpgradeLevel: this.outputUpgradeLevel,
      conditionDecayUpgradeLevel: this.conditionDecayUpgradeLevel,
      assignedWorkers: this.assignedWorkers,
      facilityCondition: this.facilityCondition,
      autoRepairEnabled: this.autoRepairEnabled,
      autoRepairThreshold: this.autoRepairThreshold,
      autoRepairTarget: this.autoRepairTarget,
    };
  }

  static fromSnapshot(snapshot: FacilitySnapshot): Facility {
    return new Facility(snapshot.id, snapshot.facilityType, snapshot);
  }

  private restore(snapshot: FacilitySnapshot): void {
    if (snapshot.facilityType !== this.facilityType) {
      return;
    }

    this.setProductionCycle(snapshot.productionCycle);
    this.productionCycleIndex = snapshot.productionCycleIndex;
    this.activeRecipeName = this.productionCycle[this.productionCycleIndex] ?? null;
    this.active = snapshot.isActive;

    this.recipeProgress = {};
    const recipeInputQ = snapshot.recipeInputQ;
    this.recipeInputQ = typeof recipeInputQ === 'number' && Number.isFinite(recipeInputQ) && recipeInputQ > 0
      ? recipeInputQ
      : null;
    this.qualityUpgradeLevel = isValidUpgradeLevel(snapshot.qualityUpgradeLevel) ? Math.max(1, snapshot.qualityUpgradeLevel) : 1;
    this.speedUpgradeLevel = isValidUpgradeLevel(snapshot.speedUpgradeLevel) ? snapshot.speedUpgradeLevel : 0;
    this.outputUpgradeLevel = isValidUpgradeLevel(snapshot.outputUpgradeLevel) ? snapshot.outputUpgradeLevel : 0;
    this.conditionDecayUpgradeLevel = isValidUpgradeLevel(snapshot.conditionDecayUpgradeLevel) ? snapshot.conditionDecayUpgradeLevel : 0;
    this.assignedWorkers = isValidWorkerCount(snapshot.assignedWorkers)
      ? snapshot.assignedWorkers
      : this.calculateRequiredWorkers();
    this.facilityCondition = isValidFacilityCondition(snapshot.facilityCondition)
      ? snapshot.facilityCondition
      : 1;
    this.autoRepairEnabled = snapshot.autoRepairEnabled;
    this.autoRepairThreshold = snapshot.autoRepairThreshold;
    this.autoRepairTarget = snapshot.autoRepairTarget;

    for (const recipe of getFacilityDefinition(this.facilityType).recipes) {
      const progress = snapshot.recipeProgress[recipe.name];

      if (Number.isFinite(progress) && progress !== undefined && progress >= 0 && progress < recipe.requiredWork) {
        this.recipeProgress[recipe.name] = progress;
      }
    }
  }
}

function isValidUpgradeLevel(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isValidWorkerCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isValidFacilityCondition(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}
