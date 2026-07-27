import { RecipeName, type RecipeInput } from '../recipes/recipeTypes';
import type { Inventory } from '../inventory/inventory';
import { getRecipe } from '../recipes/recipes';
import { getFacilityDefinition } from './facilityRegistry';
import { FacilityType } from './facilityTypes';

/** Plain data used by the game snapshot and Expo SQLite adapter. */
export type FacilitySnapshot = {
  facilityType: FacilityType;
  activeRecipeName: RecipeName | null;
  isActive: boolean;
  recipeProgress: Partial<Record<RecipeName, number>>;
};

/** Player-owned state for one constructed facility. */
export class Facility {
  private activeRecipeName: RecipeName | null = null;
  private active = false;
  private recipeProgress: Partial<Record<RecipeName, number>> = {};

  constructor(
    public readonly facilityType: FacilityType,
    snapshot?: FacilitySnapshot,
  ) {
    if (snapshot) {
      this.restore(snapshot);
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

    let remainingWork = workAmount;
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

      if (progress === recipe.workAmount) {
        inventory.add(recipe.output.resourceType, recipe.output.amount);
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

    for (const recipe of getFacilityDefinition(this.facilityType).recipes) {
      const progress = snapshot.recipeProgress[recipe.name];

      if (Number.isFinite(progress) && progress !== undefined && progress >= 0 && progress < recipe.workAmount) {
        this.recipeProgress[recipe.name] = progress;
      }
    }
  }
}
