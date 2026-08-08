import type { RecipeName } from '@/game/recipes';
import { getFacilityDefinition } from './facilityConstants';
import { FacilityType } from './facilityTypes';
import { getBuildingEfficiency, getOutputUpgradeMultiplier, getRequiredWorkers, getSpeedUpgradeWorkSpeedMultiplier } from './facilityUpgrades';

/** Plain data used by the game snapshot and Expo SQLite adapter. */
export type FacilitySnapshot = {
  id: string;
  facilityType: FacilityType;
  activeRecipeName: RecipeName | null;
  isActive: boolean;
  recipeProgress: Partial<Record<RecipeName, number>>;
  speedUpgradeLevel?: number;
  outputUpgradeLevel?: number;
  assignedWorkers?: number;
};

/** Player-owned state for one constructed facility. */
export class Facility {
  private activeRecipeName: RecipeName | null = null;
  private active = false;
  private recipeProgress: Partial<Record<RecipeName, number>> = {};
  private speedUpgradeLevel = 0;
  private outputUpgradeLevel = 0;
  private assignedWorkers = 0;

  constructor(
    public readonly id: string,
    public readonly facilityType: FacilityType,
    snapshot?: FacilitySnapshot,
  ) {
    if (snapshot) {
      this.restore(snapshot);
    } else {
      this.assignedWorkers = this.getRequiredWorkers();
    }
  }

  getActiveRecipeName(): RecipeName | null {
    return this.activeRecipeName;
  }

  getDisplayName(): string {
    return `${getFacilityDefinition(this.facilityType).name} #${this.id.split('-').at(-1)}`;
  }

  isActive(): boolean {
    return this.active;
  }

  getRecipeProgress(recipeName: RecipeName): number {
    return this.recipeProgress[recipeName] ?? 0;
  }

  getSpeedUpgradeLevel(): number {
    return this.speedUpgradeLevel;
  }

  getOutputUpgradeLevel(): number {
    return this.outputUpgradeLevel;
  }

  getAssignedWorkers(): number {
    return this.assignedWorkers;
  }

  getRequiredWorkers(): number {
    return getRequiredWorkers(
      getFacilityDefinition(this.facilityType).baseWorkers,
      this.speedUpgradeLevel,
      this.outputUpgradeLevel,
    );
  }

  getBuildingEfficiency(): number {
    return getBuildingEfficiency(this.assignedWorkers, this.getRequiredWorkers());
  }

  getSpeedUpgradeWorkSpeedMultiplier(): number {
    return getSpeedUpgradeWorkSpeedMultiplier(this.speedUpgradeLevel);
  }

  getOutputMultiplier(): number {
    return getOutputUpgradeMultiplier(this.outputUpgradeLevel);
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
      assignedWorkers: this.assignedWorkers,
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
    this.assignedWorkers = isValidWorkerCount(snapshot.assignedWorkers)
      ? snapshot.assignedWorkers
      : this.getRequiredWorkers();

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
