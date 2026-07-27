import { Inventory } from '@/game/inventory/inventory';
import type { ResourceType } from '@/game/resources/resourceTypes';
import { create } from 'zustand';

type GameState = {
  inventory: Inventory;
  addResource: (resourceType: ResourceType, amount?: number) => boolean;
  removeResource: (resourceType: ResourceType, amount?: number) => boolean;
  resetInventory: () => void;
};

/** Runtime owner of player progress. Durable SQLite saves are introduced separately. */
export const useGameStore = create<GameState>((set, get) => ({
  inventory: new Inventory(),
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
  resetInventory: () => set({ inventory: new Inventory() }),
}));
