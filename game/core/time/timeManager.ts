export type RealtimeAdvance = {
  elapsedMilliseconds: number;
  nextObservedAtMs: number;
};

/**
 * Measures a foreground wall-clock interval. Applying that interval to game
 * state belongs to the global game-time command in the runtime store.
 *
 * Offline progress is planned, but deliberately not implemented here. The
 * React Native lifecycle resets this observation anchor whenever the app
 * returns active.
 */
export function calculateRealtimeAdvance(lastObservedAtMs: number, nowMs: number): RealtimeAdvance {
  if (!Number.isFinite(nowMs)) {
    return { elapsedMilliseconds: 0, nextObservedAtMs: lastObservedAtMs };
  }

  if (!Number.isFinite(lastObservedAtMs) || nowMs < lastObservedAtMs) {
    return { elapsedMilliseconds: 0, nextObservedAtMs: nowMs };
  }

  return {
    elapsedMilliseconds: nowMs - lastObservedAtMs,
    nextObservedAtMs: nowMs,
  };
}
