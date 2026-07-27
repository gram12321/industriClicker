import { Finance } from '@/game/finance/finance';
import { Inventory } from '@/game/inventory/inventory';
import { FacilityCollection } from '@/game/facilities/facilityCollection';
import type { FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityDefinition } from '@/game/facilities/facilityRegistry';
import type { RecipeName } from '@/game/recipes/recipeTypes';
import type { ResourceType } from '@/game/resources/resourceTypes';
import type { GameSnapshot } from '@/game/state/gameSnapshot';
import { create } from 'zustand';

type GameState = {
  finance: Finance;
  inventory: Inventory;
  facilities: FacilityCollection;
  addResource: (resourceType: ResourceType, amount?: number) => boolean;
  removeResource: (resourceType: ResourceType, amount?: number) => boolean;
  buildFacility: (facilityType: FacilityType) => boolean;
  destroyFacility: (facilityType: FacilityType) => boolean;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: RecipeName | null) => boolean;
  recordTransaction: (amount: number, description: string) => boolean;
  createSnapshot: () => GameSnapshot;
  restoreSnapshot: (snapshot: GameSnapshot) => void;
  resetInventory: () => void;
};

/** Runtime owner of player progress. Durable SQLite saves are introduced separately. */
export const useGameStore = create<GameState>((set, get) => ({
  finance: new Finance(),
  inventory: new Inventory(),
  facilities: new FacilityCollection(),
  addResource: (resourceType, amount) => {
    const inventory = get().inventory.clone();

    if (!inventory.add(resourceType, amount)) {
      return false;
    }

    set({ inventory });
    return true;
  },
  removeResource: (resourceType, amount) => {
    const inventory = get().inventory.clone();

    if (!inventory.remove(resourceType, amount)) {
      return false;
    }

    set({ inventory });
    return true;
  },
  buildFacility: (facilityType) => {
    const facilities = get().facilities.clone();
    const finance = get().finance.clone();
    const definition = getFacilityDefinition(facilityType);

    if (!finance.canAfford(definition.constructionCost) || !facilities.build(facilityType)) {
      return false;
    }

    if (!finance.applyTransaction(
      -definition.constructionCost,
      `Constructed ${definition.name}`,
      new Date().toISOString(),
    )) {
      return false;
    }

    set({ facilities, finance });
    return true;
  },
  destroyFacility: (facilityType) => {
    const facilities = get().facilities.clone();

    if (!facilities.destroy(facilityType)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  setFacilityRecipe: (facilityType, recipeName) => {
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityType);

    if (!facility || !facility.setActiveRecipe(recipeName)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  recordTransaction: (amount, description) => {
    const finance = get().finance.clone();

    if (!finance.applyTransaction(amount, description, new Date().toISOString())) {
      return false;
    }

    set({ finance });
    return true;
  },
  createSnapshot: () => ({
    finance: get().finance.toSnapshot(),
    inventory: get().inventory.toSnapshot(),
    facilities: get().facilities.toSnapshot(),
  }),
  restoreSnapshot: (snapshot) => set({
    finance: Finance.fromSnapshot(snapshot.finance),
    inventory: Inventory.fromSnapshot(snapshot.inventory),
    facilities: FacilityCollection.fromSnapshot(snapshot.facilities),
  }),
  resetInventory: () => set({ inventory: new Inventory() }),
}));
