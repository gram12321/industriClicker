/** Quality is intentionally fixed at this value until quality rules are designed. */
export const INVENTORY_DEFAULT_RESOURCE_QUALITY = 1;

/** Shared Inventory flow-history windows, measured in foreground game time. */
export const INVENTORY_FLOW_PERIODS = [
  { id: '15-seconds', label: '15 sec', milliseconds: 15_000 },
  { id: '1-minute', label: '1 min', milliseconds: 60_000 },
  { id: '15-minutes', label: '15 min', milliseconds: 15 * 60_000 },
  { id: '1-hour', label: '1 hour', milliseconds: 60 * 60_000 },
  { id: 'all-time', label: 'All time', milliseconds: null },
] as const;
