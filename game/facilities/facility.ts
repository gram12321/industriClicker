import { RecipeName } from '../recipes/recipeTypes';
import { getFacilityDefinition } from './facilityRegistry';
import { FacilityType } from './facilityTypes';

/** Plain data used by a future game snapshot and Expo SQLite adapter. */
export type FacilitySnapshot = {
  facilityType: FacilityType;
  activeRecipeName: RecipeName | null;
  isActive: boolean;
};

/** Player-owned state for one constructed facility. */
export class Facility {
  private activeRecipeName: RecipeName | null = null;
  private active = false;

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

  clone(): Facility {
    return Facility.fromSnapshot(this.toSnapshot());
  }

  toSnapshot(): FacilitySnapshot {
    return {
      facilityType: this.facilityType,
      activeRecipeName: this.activeRecipeName,
      isActive: this.active,
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
  }
}
