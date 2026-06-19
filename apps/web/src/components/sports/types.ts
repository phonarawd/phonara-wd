// Paste wire SOT: PHONARA apps/web/src/features/sports/use-sports-betting.ts
// Field names: snake_case · RPC shape mirror · DO NOT camelCase rename (paste churn ban).
// Lovable canvas mock loader returns the same shapes — Cursor adapter swaps RPC behind them.

export interface SportsFixtureSummary {
  fixture_id: string;
  league_code: "world-cup" | "mlb" | "epl" | "k-league";
  home_name: string;
  away_name: string;
  kickoff_at: string; // ISO
  status: SportsFixtureStatus; // F12
  match_1x2?: Record<
    "home" | "draw" | "away",
    { outcome_id: string; odds: string; captured_at: string }
  >;
}

// F12 — fixture enum (suspended NOT included; suspended lives on market.status)
export type SportsFixtureStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "void"
  | "cancelled";

// F13 — market enum (settled NOT included · engine SOT)
export type SportsMarketStatus = "open" | "suspended" | "closed";

export type SportsMarketType =
  | "match_1x2"
  | "totals"
  | "totals_2_5"
  | "spread"
  | "handicap"
  | "asian_handicap"
  | "btts"
  | "prop_over_under"
  | "prop_yes_no";

export interface SportsMarketOutcome {
  outcome_id: string;
  selection: string;
  line?: string | null;
  odds?: string | null; // string only · client multiply 금지
  captured_at?: string | null;
}

export interface SportsMarketSummary {
  market_id: string;
  market_type: SportsMarketType;
  status: SportsMarketStatus;
  line?: string | null;
  outcomes: SportsMarketOutcome[];
}

// REVISE #3 — rpc_get_fixture_markets wrapper
export interface GetFixtureMarketsResult {
  markets: SportsMarketSummary[];
}

// Bet status enum — Cursor settlement SOT
// F1/B-status: NO `settled` literal anywhere in this canvas.
export type SportsBetStatus =
  | "pending"
  | "won"
  | "lost"
  | "void"
  | "cashed_out";

export type BetSlipMode = "single" | "combo" | "sgp" | "system";

export interface BetSlipLeg {
  fixtureId: string;
  // V3-4 — derived via slipMarketId(fixtureId, marketType) · mutex key only.
  // engine market_id (UUID) wire는 paste 후 adapter 한 곳에서만 교체.
  marketId: string;
  outcomeId: string;
  selection: string;
  oddsDisplay: string;
  marketType: SportsMarketType;
  homeName: string;
  awayName: string;
  capturedAt: string;
}
