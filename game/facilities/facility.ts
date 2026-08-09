import type { RecipeName } from '@/game/recipes';
import { calculateAsymmetricalScaler01 } from '@/game/core/math/scaling';
import { getFacilityDefinition } from './facilityConstants';
import { FacilityType } from './facilityTypes';
import { getConditionDecayMultiplier, getFacilityConditionEfficiency, getFacilityEfficiency, getOutputUpgradeMultiplier, getOverstaffingConditionDecayMultiplier, getRequiredWorkers, getSpeedUpgradeWorkSpeedMultiplier, getStaffingEfficiency } from './facilityUpgrades';

/** Plain data used by the game snapshot and Expo SQLite adapter. */
export type FacilitySnapshot = {
  id: string;
  facilityType: FacilityType;
  activeRecipeName: RecipeName | null;
  isActive: boolean;
  recipeProgress: Partial<Record<RecipeName, number>>;
  speedUpgradeLevel?: number;
  outputUpgradeLevel?: number;
  conditionDecayUpgradeLevel?: number;
  assignedWorkers?: number;
  facilityCondition: number;
};

/** Immutable facility state and derived values for game rules and UI rendering. */
export type FacilityView = {
  id: string;
  facilityType: FacilityType;
  displayName: string;
  activeRecipeName: RecipeName | null;
  isActive: boolean;
  recipeProgress: Readonly<Partial<Record<RecipeName, number>>>;
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
  speedUpgradeWorkSpeedMultiplier: number;
  outputMultiplier: number;
};

/** Player-owned state for one constructed facility. */
export class Facility {
  private activeRecipeName: RecipeName | null = null;
  private active = false;
  private recipeProgress: Partial<Record<RecipeName, number>> = {};
  private speedUpgradeLevel = 0;
  private outputUpgradeLevel = 0;
  private conditionDecayUpgradeLevel = 0;
  private assignedWorkers = 0;
  private facilityCondition = 1;

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
      isActive: this.active,
      recipeProgress: { ...this.recipeProgress },
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
      this.active = false;
      return true;
    }

    if (!getFacilityDefinition(this.facilityType).recipes.some((recipe) => recipe.name === recipeName)) {
      return false;
    }

    this.activeRecipeName = recipeName;
    this.active = true;
    return true;
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

  repairCondition(): boolean {
    if (this.facilityCondition >= 1) return false;
    this.facilityCondition = 1;
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

  toSnapshot(): FacilitySnapshot {
    return {
      id: this.id,
      facilityType: this.facilityType,
      activeRecipeName: this.activeRecipeName,
      isActive: this.active,
      recipeProgress: { ...this.recipeProgress },
      speedUpgradeLevel: this.speedUpgradeLevel,
      outputUpgradeLevel: this.outputUpgradeLevel,
      conditionDecayUpgradeLevel: this.conditionDecayUpgradeLevel,
      assignedWorkers: this.assignedWorkers,
      facilityCondition: this.facilityCondition,
    };
  }

  static fromSnapshot(snapshot: FacilitySnapshot): Facility {
    return new Facility(snapshot.id, snapshot.facilityType, snapshot);
  }

  private restore(snapshot: FacilitySnapshot): void {
    if (snapshot.facilityType !== this.facilityType) {
      return;
    }

    this.setActiveRecipe(snapshot.activeRecipeName);

    if (!snapshot.isActive) {
      this.active = false;
    }

    this.recipeProgress = {};
    this.speedUpgradeLevel = isValidUpgradeLevel(snapshot.speedUpgradeLevel) ? snapshot.speedUpgradeLevel : 0;
    this.outputUpgradeLevel = isValidUpgradeLevel(snapshot.outputUpgradeLevel) ? snapshot.outputUpgradeLevel : 0;
    this.conditionDecayUpgradeLevel = isValidUpgradeLevel(snapshot.conditionDecayUpgradeLevel) ? snapshot.conditionDecayUpgradeLevel : 0;
    this.assignedWorkers = isValidWorkerCount(snapshot.assignedWorkers)
      ? snapshot.assignedWorkers
      : this.calculateRequiredWorkers();
    this.facilityCondition = isValidFacilityCondition(snapshot.facilityCondition)
      ? snapshot.facilityCondition
      : 1;

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
