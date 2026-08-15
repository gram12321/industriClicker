export type WeightedEntry<T> = {
  value: T;
  weight: number;
};

/** Stable FNV-1a-derived roll for deterministic local simulation. */
export function getDeterministicUnitInterval(seed: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0) / 4_294_967_296;
}

export function pickDeterministicWeighted<T>(
  entries: readonly WeightedEntry<T>[],
  seed: string,
): T | null {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) return null;

  let remaining = getDeterministicUnitInterval(seed) * total;
  for (const entry of entries) {
    remaining -= Math.max(0, entry.weight);
    if (remaining <= 0) return entry.value;
  }

  return entries.at(-1)?.value ?? null;
}
