/** Matches server `phon_krw_rate_stale` guard (15 min TTL on active PHON/KRW snapshots). */
export const PHON_KRW_RATE_STALE_MS = 15 * 60 * 1000;

export function isPhonKrwRateStale(
  capturedAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!capturedAt) return false;
  const capturedMs = Date.parse(capturedAt);
  if (!Number.isFinite(capturedMs)) return false;
  return nowMs - capturedMs > PHON_KRW_RATE_STALE_MS;
}

export function isPhonKrwRateUnavailable(
  rate: string | null | undefined,
  hasFetchError: boolean,
): boolean {
  if (hasFetchError) return true;
  if (!rate) return true;
  try {
    return !(Number(rate) > 0);
  } catch {
    return true;
  }
}
