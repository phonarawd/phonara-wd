/**
 * H-05 — sports odds freshness fail-closed (server `captured_at` authoritative).
 *
 * Mirrors engine TTL defaults from:
 * - `app_config.sports_odds_snapshot_max_age_sec` → 300s prematch
 * - `app_config.sports_live_odds_max_age_sec` / `sports_live_ttl_by_sport.live_max_age_sec` → 15s live
 *
 * Stale / missing outcomes render `—`, are not selectable, and must not trigger
 * place/cashout network mutations. Betting/cashout launch gates stay false until
 * ingest health is green (ops flip — this contract never auto-enables gates).
 *
 * Finding: H-05 · Plan todo `audit-r2c-sports-odds-freshness`
 */

import { LAUNCH_GATES } from '@/lib/launch-gates';

/** Prematch max age (seconds) — engine default `sports_odds_snapshot_max_age_sec`. */
export const SPORTS_ODDS_PREMATCH_MAX_AGE_SEC = 300 as const;

/** Live max age (seconds) — engine default `sports_live_odds_max_age_sec` / TTL table. */
export const SPORTS_ODDS_LIVE_MAX_AGE_SEC = 15 as const;

/** Display glyph when odds are missing or stale (not a bettable value). */
export const SPORTS_ODDS_STALE_DISPLAY = '—' as const;

export type SportsOddsFreshnessKind = 'fresh' | 'stale' | 'missing';

export type SportsOddsCellDisplay = {
  kind: SportsOddsFreshnessKind;
  /** User-visible odds text — numeric string when fresh, otherwise `—`. */
  display: typeof SPORTS_ODDS_STALE_DISPLAY | string;
  /** False when missing/stale — board must not call onToggleSelection. */
  selectable: boolean;
};

export type SportsOddsOutcomeFreshnessInput = {
  odds: string | null | undefined;
  capturedAt: string | null | undefined;
  /** True for in-play fixtures — uses live TTL. */
  isLive?: boolean;
  /** Injected clock for tests; production uses Date.now(). */
  nowMs?: number;
};

export function resolveSportsOddsMaxAgeSec(isLive: boolean): number {
  return isLive ? SPORTS_ODDS_LIVE_MAX_AGE_SEC : SPORTS_ODDS_PREMATCH_MAX_AGE_SEC;
}

/** Server `captured_at` within max age of `nowMs`. Missing/invalid → not fresh. */
export function isSportsOddsCapturedAtFresh(
  capturedAt: string | null | undefined,
  nowMs: number = Date.now(),
  maxAgeSec: number = SPORTS_ODDS_PREMATCH_MAX_AGE_SEC,
): boolean {
  if (!capturedAt) return false;
  const capturedMs = Date.parse(capturedAt);
  if (!Number.isFinite(capturedMs)) return false;
  const ageSec = (nowMs - capturedMs) / 1000;
  if (ageSec < 0) return true;
  return ageSec <= maxAgeSec;
}

export function resolveSportsOddsCellDisplay(
  input: SportsOddsOutcomeFreshnessInput,
): SportsOddsCellDisplay {
  const odds = typeof input.odds === 'string' ? input.odds.trim() : '';
  if (!odds) {
    return {
      kind: 'missing',
      display: SPORTS_ODDS_STALE_DISPLAY,
      selectable: false,
    };
  }

  const maxAgeSec = resolveSportsOddsMaxAgeSec(Boolean(input.isLive));
  const fresh = isSportsOddsCapturedAtFresh(input.capturedAt, input.nowMs ?? Date.now(), maxAgeSec);
  if (!fresh) {
    return {
      kind: 'stale',
      display: SPORTS_ODDS_STALE_DISPLAY,
      selectable: false,
    };
  }

  return {
    kind: 'fresh',
    display: odds,
    selectable: true,
  };
}

export type SportsOddsSnapshotLike = {
  captured_at?: string | null;
  odds?: string | null;
};

/**
 * Ingest health is green only when ≥1 outcome has a bettable (fresh) snapshot.
 * Fail-closed default: empty / all-stale boards → not green.
 */
export function isSportsOddsIngestHealthGreen(
  outcomes: readonly SportsOddsSnapshotLike[],
  nowMs: number = Date.now(),
  isLive = false,
): boolean {
  const maxAgeSec = resolveSportsOddsMaxAgeSec(isLive);
  for (const row of outcomes) {
    const odds = typeof row.odds === 'string' ? row.odds.trim() : '';
    if (!odds) continue;
    if (isSportsOddsCapturedAtFresh(row.captured_at, nowMs, maxAgeSec)) return true;
  }
  return false;
}

/** Flatten match_1x2 cells for ingest-health scan. */
export function collectSportsMatch1x2Outcomes(
  match1x2:
    | Readonly<Record<string, { odds?: string | null; captured_at?: string | null }>>
    | null
    | undefined,
): SportsOddsSnapshotLike[] {
  if (!match1x2) return [];
  return Object.values(match1x2).map((cell) => ({
    odds: cell.odds,
    captured_at: cell.captured_at,
  }));
}

/**
 * ZA-13 — board transparency: fixtures exist (board is not empty) but every
 * outcome is stale/missing (ingest health not green). The per-cell `—` +
 * `selectable: false` freshness rule (above) stays untouched — this only adds
 * a board-level banner so a fully-stale board reads as "feed paused" instead
 * of a silent wall of dashes. Never flips LAUNCH_GATES.
 */
export function shouldShowSportsIngestOfflineBanner(input: {
  hasFixtures: boolean;
  ingestHealthGreen: boolean;
}): boolean {
  return input.hasFixtures && !input.ingestHealthGreen;
}

/**
 * Gate flip eligibility — never auto-flip. Ops may set LAUNCH_GATES only after
 * this returns true (ingest health green).
 */
export function shouldAllowSportsBettingGateFlip(ingestHealthGreen: boolean): boolean {
  return ingestHealthGreen;
}

export function shouldAllowSportsCashoutGateFlip(ingestHealthGreen: boolean): boolean {
  return ingestHealthGreen;
}

/**
 * Soft-launch: place/cashout stay closed while ingest is down OR gate is false.
 * Does not mutate LAUNCH_GATES — read-only eligibility.
 */
export function resolveSportsBettingExposureAllowed(input: {
  sportsBettingGate?: boolean;
  ingestHealthGreen: boolean;
}): boolean {
  const gate = input.sportsBettingGate ?? LAUNCH_GATES.sportsBetting;
  return gate && input.ingestHealthGreen;
}

export function resolveSportsCashoutExposureAllowed(input: {
  sportsCashoutGate?: boolean;
  ingestHealthGreen: boolean;
}): boolean {
  const gate = input.sportsCashoutGate ?? LAUNCH_GATES.sportsCashout;
  return gate && input.ingestHealthGreen;
}

/** Defense-in-depth: block place RPC while gate off, ingest down, or any leg stale. */
export function shouldBlockSportsPlaceNetworkMutation(input: {
  sportsBettingGate?: boolean;
  ingestHealthGreen: boolean;
  hasStaleOrMissingSelection: boolean;
}): boolean {
  if (!resolveSportsBettingExposureAllowed(input)) return true;
  return input.hasStaleOrMissingSelection;
}

export function shouldBlockSportsCashoutNetworkMutation(input: {
  sportsCashoutGate?: boolean;
  ingestHealthGreen: boolean;
}): boolean {
  return !resolveSportsCashoutExposureAllowed(input);
}

/**
 * Pin: until ingest health is green, shipped LAUNCH_GATES must remain false.
 * Used by owner vitest / closeout evidence — not a runtime throw.
 */
export function sportsBettingGatesClosedUntilIngestGreen(input: {
  ingestHealthGreen: boolean;
  sportsBettingGate?: boolean;
  sportsCashoutGate?: boolean;
}): boolean {
  if (input.ingestHealthGreen) return true;
  const betting = input.sportsBettingGate ?? LAUNCH_GATES.sportsBetting;
  const cashout = input.sportsCashoutGate ?? LAUNCH_GATES.sportsCashout;
  return betting === false && cashout === false;
}
