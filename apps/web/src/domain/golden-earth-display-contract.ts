/**
 * Golden Earth — Phase 1 E10 discovery contract (placement + exposure).
 * Tap rewards are engine/RPC only; this module defines route ownership and defer rules.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E10
 */

export const GOLDEN_EARTH_STATUS_RPC = 'rpc_get_golden_earth_status' as const;
export const GOLDEN_EARTH_TAP_RPC = 'rpc_golden_earth_tap' as const;

/** Single canonical owner for the primary tap CTA (E10 duplicate-owner gate). */
export const GOLDEN_EARTH_PRIMARY_TAP_ROUTE = '/events' as const;

/** Compact summary + link only — no second primary tap button on `/home`. */
export const GOLDEN_EARTH_HOME_FOMO_ROUTE = '/home' as const;

export type GoldenEarthEngineBranch =
  | 'tap_status'
  | 'tap_action'
  | 'season_hub'
  | 'events_season_cards';

export type GoldenEarthBranchEngineStatus = 'exists' | 'partial' | 'missing';

export type GoldenEarthExposureMode = 'live' | 'built_hidden' | 'defer_stub';

export const GOLDEN_EARTH_ENGINE_BRANCHES: Readonly<
  Record<
    GoldenEarthEngineBranch,
    { engine: GoldenEarthBranchEngineStatus; rpc: string | null; moneyPath: boolean }
  >
> = {
  tap_status: { engine: 'exists', rpc: GOLDEN_EARTH_STATUS_RPC, moneyPath: false },
  tap_action: { engine: 'exists', rpc: GOLDEN_EARTH_TAP_RPC, moneyPath: true },
  season_hub: { engine: 'exists', rpc: 'rpc_get_earn_hub_status.season', moneyPath: false },
  events_season_cards: { engine: 'missing', rpc: null, moneyPath: false },
};

export type GoldenEarthSurfacePlacement = {
  route: typeof GOLDEN_EARTH_PRIMARY_TAP_ROUTE | typeof GOLDEN_EARTH_HOME_FOMO_ROUTE;
  role: 'primary_tap' | 'fomo_summary';
  hook: 'useGoldenEarthTap' | 'useGoldenEarthStatus';
};

export const GOLDEN_EARTH_PLACEMENT: Readonly<GoldenEarthSurfacePlacement[]> = [
  {
    route: GOLDEN_EARTH_PRIMARY_TAP_ROUTE,
    role: 'primary_tap',
    hook: 'useGoldenEarthTap',
  },
  {
    route: GOLDEN_EARTH_HOME_FOMO_ROUTE,
    role: 'fomo_summary',
    hook: 'useGoldenEarthStatus',
  },
];

/** Phase 1 audit (2026-07-02): hero stack exists but is not mounted on either route yet. */
export const GOLDEN_EARTH_UI_WIRE_STATUS: Readonly<
  Record<(typeof GOLDEN_EARTH_PLACEMENT)[number]['route'], 'unwired' | 'wired'>
> = {
  '/events': 'wired',
  '/home': 'wired',
};

export function resolveGoldenEarthBranchExposure(
  branch: GoldenEarthEngineBranch,
): GoldenEarthExposureMode {
  const row = GOLDEN_EARTH_ENGINE_BRANCHES[branch];
  if (row.engine === 'exists') {
    if (row.moneyPath) return 'live';
    return 'live';
  }
  if (row.engine === 'partial') return 'defer_stub';
  return 'defer_stub';
}

/** Tap CTA must stay disabled when unauthenticated, halted, or cap exhausted — no client reward math. */
export function resolveGoldenEarthTapBlocked(params: {
  authenticated: boolean;
  systemHalted: boolean;
  remaining: number;
}): boolean {
  if (!params.authenticated) return true;
  if (params.systemHalted) return true;
  return params.remaining <= 0;
}

/** `/events` season card grid has no engine RPC — defer_stub (static i18n OK until engine). */
export function shouldDeferEventsSeasonCards(): boolean {
  return GOLDEN_EARTH_ENGINE_BRANCHES.events_season_cards.engine !== 'exists';
}

/** Presentation-only ticker usernames — not engine activity feed. */
export const GOLDEN_EARTH_TICKER_IS_PRESENTATION = true as const;
