export function isLoopbackHostname(hostname: string | undefined | null): boolean {
  if (!hostname) return false;

  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[/, '')
    .replace(/\]$/, '');

  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

/** Development-only browser surfaces are never exposed on a device or network host. */
export function isDevAdminSurfaceAvailable(): boolean {
  return __DEV__
    && typeof window !== 'undefined'
    && isLoopbackHostname(window.location.hostname);
}
