import { formatNumber } from '@/utils';

export function formatStaffQualityWagePressure(value: number): string {
  if (!Number.isFinite(value) || value === 0) return 'Neutral';

  return `${value > 0 ? '+' : '-'}Q${formatNumber(Math.abs(value), { decimals: 3, forceDecimals: true })}/min`;
}
