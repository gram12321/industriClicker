import { RecipeName, type RecipeInput } from '../recipes/recipeTypes';
import type { Inventory } from '../inventory/inventory';
import { getRecipe } from '../recipes/recipeConstants';
import { getFacilityDefinition } from './facilityConstants';
import { FacilityType } from './facilityTypes';
import { getOutputUpgradeMultiplier, getRequiredWorkers, getSpeedUpgradeMultiplier, getStaffingEfficiency } from './facilityUpgrades';

const WORK_COMPLETION_EPSILON = 1e-9;

/** Plain data used by the game snapshot and Expo SQLite adapter. */
export type FacilitySnapshot = {
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

  getEfficiency(): number {
    return getStaffingEfficiency(this.assignedWorkers, this.getRequiredWorkers());
  }

  getSpeedMultiplier(): number {
    return getSpeedUpgradeMultiplier(this.speedUpgradeLevel);
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

  getProductionStatus(inventory: Inventory): 'not-started' | 'missing-inputs' | 'producing' {
    if (!this.active || !this.activeRecipeName) {
      return 'not-started';
    }

    const recipe = getRecipe(this.activeRecipeName);
    const isAtCycleStart = this.getRecipeProgress(recipe.name) === 0;

    return isAtCycleStart && this.getMissingInputs(inventory).length > 0 ? 'missing-inputs' : 'producing';
  }

  getMissingInputs(inventory: Inventory): RecipeInput[] {
    if (!this.activeRecipeName) {
      return [];
    }

    return getRecipe(this.activeRecipeName).inputs.filter((input) => (
      !inventory.has(input.resourceType, input.amount)
    ));
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

  deactivate(): void {
    this.active = false;
  }

  /**
   * Applies work to the selected recipe. Inputs are paid at the beginning of
   * each cycle, matching the Baseclicker production rule.
   */
  advanceProduction(inventory: Inventory, workAmount: number): void {
    if (!Number.isFinite(workAmount) || workAmount <= 0 || !this.active || !this.activeRecipeName) {
      return;
    }

    const recipe = getRecipe(this.activeRecipeName);
    if (!recipe || recipe.workAmount <= 0) {
      return;
    }

    let remainingWork = workAmount * this.getEfficiency() * this.getSpeedMultiplier();
    let progress = this.getRecipeProgress(recipe.name);

    while (remainingWork > 0) {
      if (progress === 0 && !recipe.inputs.every((input) => inventory.has(input.resourceType, input.amount))) {
        break;
      }

      if (progress === 0) {
        for (const input of recipe.inputs) {
          inventory.remove(input.resourceType, input.amount);
        }
      }

      const appliedWork = Math.min(remainingWork, recipe.workAmount - progress);
      progress += appliedWork;
      remainingWork -= appliedWork;

      if (progress + WORK_COMPLETION_EPSILON >= recipe.workAmount) {
        inventory.add(recipe.output.resourceType, recipe.output.amount * this.getOutputMultiplier());
        progress = 0;
      }
    }

    this.recipeProgress[recipe.name] = progress;
  }

  clone(): Facility {
    return Facility.fromSnapshot(this.toSnapshot());
  }

  toSnapshot(): FacilitySnapshot {
    return {
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
    return new Facility(snapshot.facilityType, snapshot);
  }

  private restore(snapshot: FacilitySnapshot): void {
    if (snapshot.facilityType !== this.facilityType) {
      return;
    }

    this.setActiveRecipe(snapshot.activeRecipeName);

    if (!snapshot.isActive) {
      this.deactivate();
    }

    this.recipeProgress = {};
    this.speedUpgradeLevel = isValidUpgradeLevel(snapshot.speedUpgradeLevel) ? snapshot.speedUpgradeLevel : 0;
    this.outputUpgradeLevel = isValidUpgradeLevel(snapshot.outputUpgradeLevel) ? snapshot.outputUpgradeLevel : 0;
    this.assignedWorkers = isValidWorkerCount(snapshot.assignedWorkers)
      ? snapshot.assignedWorkers
      : this.getRequiredWorkers();

    for (const recipe of getFacilityDefinition(this.facilityType).recipes) {
      const progress = snapshot.recipeProgress[recipe.name];

      if (Number.isFinite(progress) && progress !== undefined && progress >= 0 && progress < recipe.workAmount) {
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
