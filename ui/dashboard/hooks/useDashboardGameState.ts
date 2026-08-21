import { useGameStore } from '@/game';

/** Dashboard composition needs the active game command surface, while leaf views stay prop-driven. */
export function useDashboardGameState() {
  return useGameStore();
}
