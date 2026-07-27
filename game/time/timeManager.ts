/** One work unit is completed by every active facility per foreground minute. */
export const REALTIME_WORK_MINUTE_MS = 60_000;

export type RealtimeAdvance = {
  elapsedMinutes: number;
  nextProcessedAtMs: number;
};

/**
 * Converts a wall-clock interval into whole foreground work minutes. It keeps
 * partial minutes for the next call, so timer scheduling drift cannot create
 * or lose completed work units.
 *
 * Offline progress is planned, but deliberately not implemented here. The
 * React Native lifecycle resets this clock whenever the app returns active.
 */
export function calculateRealtimeAdvance(lastProcessedAtMs: number, nowMs: number): RealtimeAdvance {
  if (!Number.isFinite(nowMs)) {
    return { elapsedMinutes: 0, nextProcessedAtMs: lastProcessedAtMs };
  }

  if (!Number.isFinite(lastProcessedAtMs) || nowMs < lastProcessedAtMs) {
    return { elapsedMinutes: 0, nextProcessedAtMs: nowMs };
  }

  const elapsedMinutes = Math.floor((nowMs - lastProcessedAtMs) / REALTIME_WORK_MINUTE_MS);

  return {
    elapsedMinutes,
    nextProcessedAtMs: lastProcessedAtMs + elapsedMinutes * REALTIME_WORK_MINUTE_MS,
  };
}
