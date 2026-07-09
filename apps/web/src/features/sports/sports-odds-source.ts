/**
 * External sports odds/results adapter seam — contract only (not implemented).
 *
 * Settlement and ledger paths MUST keep using the sportsbook-engine RPCs
 * (`rpc_place_sports_bet`, settle/cashout). External vendor payloads are
 * display/ingest inputs only — same boundary as trade `display-feed-contract`.
 *
 * ## Current internal ingest (implemented)
 *
 * - Edge/worker posts JSON to `rpc_ingest_sports_c1` (service_role).
 * - Migration: `20260616000100_wave_s2_sportsbook_ingest.sql`.
 * - Writes `sports_fixtures`, markets, outcomes, `sports_odds_snapshots`.
 *
 * ## Planned external vendor entry (NOT implemented)
 *
 * ```
 * supabase/functions/sports-odds-ingest/index.ts   ← future edge entry
 *   → validate vendor HMAC / service auth
 *   → normalize vendor payload → rpc_ingest_sports_c1 shape
 *   → NEVER call settlement or wallet RPCs from this path
 * ```
 *
 * UI (`SportsBettingFomoTicker`, filter sort "fomo") stays presentation-only
 * and must not read `SportsOddsSource` for money or bet placement.
 *
 * @see apps/web/src/features/trading/display-chart/display-feed-contract.ts
 * @see supabase/migrations/20260616000100_wave_s2_sportsbook_ingest.sql
 */

/** Marker: values from `SportsOddsSource` are not settlement truth. */
export const DISPLAY_ONLY_ODDS_SOURCE = true as const;

export type DisplayOnlyOddsSourceMeta = {
  readonly displayOnly: typeof DISPLAY_ONLY_ODDS_SOURCE;
};

/** Normalized odds tick — mirrors ingest snapshot fields (string odds only). */
export type SportsOddsSnapshot = {
  readonly outcomeId: string;
  readonly odds: string;
  readonly capturedAt: string;
  readonly sourceVendor: string;
};

/** Normalized fixture status from an external feed (ingest mapping only). */
export type SportsOddsFixtureStatus = 'scheduled' | 'live' | 'finished' | 'void' | 'cancelled';

/** Vendor-agnostic fixture row for ingest adapters. */
export type SportsOddsFixtureUpsert = {
  readonly canonicalFixtureId: string;
  readonly leagueCode: string;
  readonly homeName: string;
  readonly awayName: string;
  readonly kickoffAt: string;
  readonly status: SportsOddsFixtureStatus;
  readonly markets: readonly {
    readonly marketType: string;
    readonly status: string;
    readonly outcomes: readonly {
      readonly selection: string;
      readonly odds: string;
      readonly line?: string | null;
    }[];
  }[];
};

/**
 * Adapter contract for a third-party odds/results vendor.
 * Implementations run server-side (edge function / worker) — not in the browser.
 */
export interface SportsOddsSource {
  readonly vendorId: string;
  /** Pull or receive-push normalized upserts for ingest RPC. */
  fetchFixtureBatch(signal?: AbortSignal): Promise<readonly SportsOddsFixtureUpsert[]>;
  /** Optional live score/clock overlay — display tables only. */
  fetchLiveState?(
    fixtureId: string,
    signal?: AbortSignal,
  ): Promise<{ homeScore: number; awayScore: number; minute: number } | null>;
}

/** Documented future edge entry path (directory not created until vendor is chosen). */
export const SPORTS_ODDS_INGEST_EDGE_ENTRY =
  'supabase/functions/sports-odds-ingest/index.ts' as const;
