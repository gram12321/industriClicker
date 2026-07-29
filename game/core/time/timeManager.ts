/** One work unit is completed by every active facility per game-time minute. */
export const REALTIME_WORK_MINUTE_MS = 60_000;
/** Production state resolves at this foreground simulation cadence. */
export const FOREGROUND_SIMULATION_STEP_MS = 1_000;

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
