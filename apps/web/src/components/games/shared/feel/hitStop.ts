/**
 * Pause a callback chain for `ms` to give weight to a hit/impact.
 * Reduced-motion shortens to 0.
 */
export function hitStop(ms: number, reduced = false): Promise<void> {
  if (reduced) return Promise.resolve();
  return new Promise((res) => window.setTimeout(res, Math.max(0, ms)));
}
