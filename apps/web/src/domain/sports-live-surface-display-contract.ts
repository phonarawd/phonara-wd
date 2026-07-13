/**
 * P10 Sports live surface — `/sports/live` in-play wire (§20.13.3 Sports#2).
 * ENGINE:exists — `rpc_get_live_fixture_state` · `sports-realtime-cache` · live delay · suspend TTL.
 * Display-only — no client odds/score recompute · existing route extension only.
 */

import type { MessageKey } from '@phonara/i18n';

import { SPORTS_LIVE_ROUTE } from './sports-hub-pages-display-contract';
import { P10_SPORTS_LIVE_SURFACE_TODO as PARITY_LIVE_TODO } from './sports-exchange-parity-display-contract';

export const P10_SPORTS_LIVE_SURFACE_TODO = 'p10-sports-live-surface-wire' as const;

export const P10_SPORTS_LIVE_PREREQUISITE_TODOS = ['p10-sports-parity-contract-and-board'] as const;

/** Canonical live route — must stay the hub-registered path (no parallel route). */
export const SPORTS_LIVE_SURFACE_ROUTE = SPORTS_LIVE_ROUTE;

export const SPORTS_LIVE_STATE_RPC = 'rpc_get_live_fixture_state' as const;
export const SPORTS_LIVE_STATE_HOOK = 'useLiveFixtureState' as const;
export const SPORTS_LIVE_REALTIME_HOOK = 'useSportsRealtime' as const;
export const SPORTS_LIVE_REALTIME_CACHE = 'sports-realtime-cache.ts' as const;
/** PIR pir-p1 — odds INSERT trailing debounce (≥500ms) + visible-fixture scope. */
export const SPORTS_LIVE_ODDS_INSERT_DEBOUNCE = 'sports-odds-insert-debounce.ts' as const;

export const SPORTS_LIVE_BANNER_OWNER = 'sports-live-inplay-banner.tsx' as const;
export const SPORTS_LIVE_BOARD_OWNER = 'sports-fixture-board.tsx' as const;
export const SPORTS_LIVE_PAGE_OWNER = 'sports-page.tsx' as const;

export const SPORTS_LIVE_ENGINE_RPCS = [SPORTS_LIVE_STATE_RPC] as const;

export const SPORTS_LIVE_SURFACE_OWNERS = [
  SPORTS_LIVE_PAGE_OWNER,
  SPORTS_LIVE_BANNER_OWNER,
  SPORTS_LIVE_BOARD_OWNER,
  'use-sports-page-controller.ts',
  'use-sports-betting.ts',
  'use-sports-realtime.ts',
  SPORTS_LIVE_REALTIME_CACHE,
  SPORTS_LIVE_ODDS_INSERT_DEBOUNCE,
] as const;

/** Honest live-delay notice — engine applies delay server-side; UI does not invent ms. */
export const SPORTS_LIVE_DELAY_NOTICE_KEY = 'sports.live.delayNotice' as const satisfies MessageKey;

export const SPORTS_LIVE_GOAL_SUSPEND_KEY = 'sports.live.goalSuspend' as const satisfies MessageKey;

export const SPORTS_LIVE_MARKET_SUSPEND_KEY =
  'sports.live.marketSuspend' as const satisfies MessageKey;

export const SPORTS_LIVE_SCORE_LABEL_KEY = 'sports.live.score' as const satisfies MessageKey;

export const SPORTS_LIVE_BADGE_KEY = 'sports.live.badge' as const satisfies MessageKey;

export type SportsLiveMarketState = {
  readonly market_id: string;
  readonly market_type: string;
  readonly status: string;
  readonly suspended_until: string | null;
  readonly suspend_reason: string | null;
};

/** Display shape for `rpc_get_live_fixture_state` — RPC strings only. */
export type SportsLiveFixtureState = {
  readonly fixture_id: string;
  readonly league_code: string;
  readonly home_name: string;
  readonly away_name: string;
  readonly kickoff_at: string;
  readonly status: string;
  readonly suspended_until: string | null;
  readonly suspend_reason: string | null;
  readonly result_home_goals: number | null;
  readonly result_away_goals: number | null;
  readonly markets: readonly SportsLiveMarketState[];
};

export type SportsLiveSuspendKind = 'fixture' | 'market' | 'goal' | null;

export function parseSportsLiveFixtureState(raw: unknown): SportsLiveFixtureState | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (typeof row['fixture_id'] !== 'string') return null;
  if (typeof row['home_name'] !== 'string' || typeof row['away_name'] !== 'string') return null;
  if (typeof row['status'] !== 'string') return null;

  const marketsRaw = row['markets'];
  const markets: SportsLiveMarketState[] = Array.isArray(marketsRaw)
    ? marketsRaw.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const m = item as Record<string, unknown>;
        if (typeof m['market_id'] !== 'string' || typeof m['market_type'] !== 'string') return [];
        if (typeof m['status'] !== 'string') return [];
        return [
          {
            market_id: m['market_id'],
            market_type: m['market_type'],
            status: m['status'],
            suspended_until: typeof m['suspended_until'] === 'string' ? m['suspended_until'] : null,
            suspend_reason: typeof m['suspend_reason'] === 'string' ? m['suspend_reason'] : null,
          },
        ];
      })
    : [];

  return {
    fixture_id: row['fixture_id'],
    league_code: typeof row['league_code'] === 'string' ? row['league_code'] : '',
    home_name: row['home_name'],
    away_name: row['away_name'],
    kickoff_at: typeof row['kickoff_at'] === 'string' ? row['kickoff_at'] : '',
    status: row['status'],
    suspended_until: typeof row['suspended_until'] === 'string' ? row['suspended_until'] : null,
    suspend_reason: typeof row['suspend_reason'] === 'string' ? row['suspend_reason'] : null,
    result_home_goals:
      typeof row['result_home_goals'] === 'number' ? row['result_home_goals'] : null,
    result_away_goals:
      typeof row['result_away_goals'] === 'number' ? row['result_away_goals'] : null,
    markets,
  };
}

export function isSportsLiveSuspendedUntil(
  suspendedUntil: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!suspendedUntil) return false;
  const until = Date.parse(suspendedUntil);
  if (Number.isNaN(until)) return false;
  return until > nowMs;
}

export function formatSportsLiveScore(
  homeGoals: number | null | undefined,
  awayGoals: number | null | undefined,
): string | null {
  if (homeGoals == null || awayGoals == null) return null;
  if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return null;
  return `${homeGoals}–${awayGoals}`;
}

export function resolveSportsLiveSuspendKind(
  state: SportsLiveFixtureState | null | undefined,
  nowMs: number = Date.now(),
): SportsLiveSuspendKind {
  if (!state) return null;
  if (isSportsLiveSuspendedUntil(state.suspended_until, nowMs)) {
    const reason = (state.suspend_reason ?? '').toLowerCase();
    if (reason.includes('goal')) return 'goal';
    return 'fixture';
  }
  const marketSuspended = state.markets.some(
    (m) => m.status === 'suspended' || isSportsLiveSuspendedUntil(m.suspended_until, nowMs),
  );
  if (marketSuspended) {
    const goalMarket = state.markets.some((m) => {
      const reason = (m.suspend_reason ?? '').toLowerCase();
      return reason.includes('goal') && isSportsLiveSuspendedUntil(m.suspended_until, nowMs);
    });
    return goalMarket ? 'goal' : 'market';
  }
  return null;
}

export function resolveSportsLiveSuspendMessageKey(kind: SportsLiveSuspendKind): MessageKey | null {
  if (kind === 'goal') return SPORTS_LIVE_GOAL_SUSPEND_KEY;
  if (kind === 'market' || kind === 'fixture') return SPORTS_LIVE_MARKET_SUSPEND_KEY;
  return null;
}

export function isSportsLiveInPlayStatus(status: string | null | undefined): boolean {
  return status === 'live';
}

export function assertSportsLiveSurfaceDisplayContractSync(): void {
  if (P10_SPORTS_LIVE_SURFACE_TODO !== 'p10-sports-live-surface-wire') {
    throw new Error('sports-live-surface: owner todo id drift');
  }
  if (P10_SPORTS_LIVE_SURFACE_TODO !== PARITY_LIVE_TODO) {
    throw new Error('sports-live-surface: parity live todo id drift');
  }
  if (!P10_SPORTS_LIVE_PREREQUISITE_TODOS.includes('p10-sports-parity-contract-and-board')) {
    throw new Error('sports-live-surface: parity prerequisite missing');
  }
  if (SPORTS_LIVE_SURFACE_ROUTE !== '/sports/live') {
    throw new Error('sports-live-surface: must extend /sports/live only — no parallel route');
  }
  if (SPORTS_LIVE_STATE_RPC !== 'rpc_get_live_fixture_state') {
    throw new Error('sports-live-surface: live state RPC drift');
  }
  if (SPORTS_LIVE_STATE_HOOK !== 'useLiveFixtureState') {
    throw new Error('sports-live-surface: live state hook drift');
  }
  if (SPORTS_LIVE_REALTIME_HOOK !== 'useSportsRealtime') {
    throw new Error('sports-live-surface: realtime hook drift');
  }
}
