/**
 * Sports cashout / combo / system / slip policy — Phase 1 E15 discovery contract.
 * Place/cashout/settlement math is engine/RPC only; this module defines launch-gate
 * exposure, RPC branch inventory, server bet-policy keys (EXISTS vs MISSING), and UI wiring.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E15 · §E2 launch gates · plan §14.2
 */

export const SPORTS_PLACE_BET_RPC = 'rpc_place_sports_bet' as const;
export const SPORTS_SYSTEM_BET_RPC = 'rpc_place_sports_system_bet' as const;
export const SPORTS_PREVIEW_CASHOUT_RPC = 'rpc_preview_sports_cashout' as const;
export const SPORTS_CASHOUT_BET_RPC = 'rpc_cashout_sports_bet' as const;

export const SPORTS_PRIMARY_ROUTE = '/sports' as const;
export const SPORTS_FIXTURE_ROUTE_PREFIX = '/sports/fixture/' as const;

/** §7 Money Rollout — cashout UI live only (`sportsCashout` gate flip). Slip/place outside §7. */
export const SPORTS_CASHOUT_CANARY_WAVE = 'phase5-sports-cashout' as const;

export type SportsLaunchGateKey =
  | 'sportsBetting'
  | 'sportsComboBetting'
  | 'sportsSystemBetting'
  | 'sportsCashout';

export type SportsBetKind = 'single' | 'combo' | 'sgp' | 'system';

export type SportsCashoutEngineBranch =
  | 'place_single'
  | 'place_combo'
  | 'place_sgp'
  | 'place_system'
  | 'preview_cashout'
  | 'execute_cashout';

export type SportsPolicyEngineStatus = 'exists' | 'partial' | 'missing';

export type SportsCashoutExposureMode = 'live' | 'built_hidden' | 'built_disabled' | 'defer_stub';

/** E2 launch gates controlling sports slip / cashout exposure (compile-time). */
export const SPORTS_LAUNCH_GATE_DEFAULTS: Readonly<Record<SportsLaunchGateKey, boolean>> = {
  sportsBetting: false,
  sportsComboBetting: false,
  sportsSystemBetting: false,
  sportsCashout: false,
};

export const SPORTS_CASHOUT_ENGINE_BRANCHES: Readonly<
  Record<
    SportsCashoutEngineBranch,
    {
      engine: 'exists' | 'partial';
      rpc: string;
      moneyPath: boolean;
      launchGate: SportsLaunchGateKey;
      section7Canary: boolean;
    }
  >
> = {
  place_single: {
    engine: 'exists',
    rpc: SPORTS_PLACE_BET_RPC,
    moneyPath: true,
    launchGate: 'sportsBetting',
    section7Canary: false,
  },
  place_combo: {
    engine: 'exists',
    rpc: SPORTS_PLACE_BET_RPC,
    moneyPath: true,
    launchGate: 'sportsComboBetting',
    section7Canary: false,
  },
  place_sgp: {
    engine: 'exists',
    rpc: SPORTS_PLACE_BET_RPC,
    moneyPath: true,
    launchGate: 'sportsComboBetting',
    section7Canary: false,
  },
  place_system: {
    engine: 'exists',
    rpc: SPORTS_SYSTEM_BET_RPC,
    moneyPath: true,
    launchGate: 'sportsSystemBetting',
    section7Canary: false,
  },
  preview_cashout: {
    engine: 'exists',
    rpc: SPORTS_PREVIEW_CASHOUT_RPC,
    moneyPath: false,
    launchGate: 'sportsCashout',
    section7Canary: true,
  },
  execute_cashout: {
    engine: 'exists',
    rpc: SPORTS_CASHOUT_BET_RPC,
    moneyPath: true,
    launchGate: 'sportsCashout',
    section7Canary: true,
  },
};

/**
 * Server-owned bet policy keys — Phase 1 audit 2026-07-02.
 * UI must consume these via RPC/config read in Phase 5; client-only hide is forbidden (§14.2).
 */
export const SPORTS_BET_POLICY_KEYS: Readonly<
  Record<
    | 'min_stake'
    | 'max_stake'
    | 'max_payout'
    | 'combo_max_legs'
    | 'sgp_max_legs'
    | 'sgp_min_legs'
    | 'system_max_legs'
    | 'system_max_lines'
    | 'system_ui_min_legs'
    | 'per_leg_odds_floor'
    | 'single_bet_forbidden'
    | 'combo_min_legs'
    | 'min_odds_per_leg'
    | 'combined_min_odds'
    | 'tier_bet_policy'
    | 'sports_risk_stake_cap',
    {
      engine: SportsPolicyEngineStatus;
      appConfigKey: string | null;
      enforcedIn: string;
      clientMirror: boolean;
    }
  >
> = {
  min_stake: {
    engine: 'exists',
    appConfigKey: 'sports_min_stake_{phon|usdt}',
    enforcedIn: '_assert_sports_stake_limits',
    clientMirror: false,
  },
  max_stake: {
    engine: 'exists',
    appConfigKey: 'sports_max_stake_{phon|usdt}',
    enforcedIn: '_assert_sports_stake_limits',
    clientMirror: false,
  },
  max_payout: {
    engine: 'exists',
    appConfigKey: 'sports_max_payout_{phon|usdt}',
    enforcedIn: '_assert_sports_payout_cap',
    clientMirror: false,
  },
  combo_max_legs: {
    engine: 'exists',
    appConfigKey: null,
    enforcedIn: 'rpc_place_sports_bet (hard cap 8)',
    clientMirror: true,
  },
  sgp_max_legs: {
    engine: 'exists',
    appConfigKey: 'sports_sgp_max_legs',
    enforcedIn: 'rpc_place_sports_bet',
    clientMirror: true,
  },
  sgp_min_legs: {
    engine: 'exists',
    appConfigKey: null,
    enforcedIn: 'rpc_place_sports_bet (sgp_min_legs ≥2)',
    clientMirror: true,
  },
  system_max_legs: {
    engine: 'exists',
    appConfigKey: 'sports_system_max_legs',
    enforcedIn: 'rpc_place_sports_system_bet',
    clientMirror: false,
  },
  system_max_lines: {
    engine: 'exists',
    appConfigKey: 'sports_system_max_lines',
    enforcedIn: 'rpc_place_sports_system_bet',
    clientMirror: false,
  },
  system_ui_min_legs: {
    engine: 'partial',
    appConfigKey: null,
    enforcedIn: 'BetSlipProvider canPlace (≥3) · server system RPC (≥2)',
    clientMirror: true,
  },
  per_leg_odds_floor: {
    engine: 'partial',
    appConfigKey: null,
    enforcedIn: 'rpc_place_sports_bet (odds > 1 only)',
    clientMirror: false,
  },
  single_bet_forbidden: {
    engine: 'missing',
    appConfigKey: null,
    enforcedIn: '—',
    clientMirror: false,
  },
  combo_min_legs: {
    engine: 'missing',
    appConfigKey: null,
    enforcedIn: '—',
    clientMirror: false,
  },
  min_odds_per_leg: {
    engine: 'missing',
    appConfigKey: null,
    enforcedIn: '—',
    clientMirror: false,
  },
  combined_min_odds: {
    engine: 'missing',
    appConfigKey: null,
    enforcedIn: '—',
    clientMirror: false,
  },
  tier_bet_policy: {
    engine: 'missing',
    appConfigKey: null,
    enforcedIn: '— (E20 unified tier backlog)',
    clientMirror: false,
  },
  sports_risk_stake_cap: {
    engine: 'partial',
    appConfigKey: 'sports_risk_*_stake_mult',
    enforcedIn: '_assert_sports_risk_stake_cap · sports_risk_profiles',
    clientMirror: false,
  },
};

/** Default app_config values seeded in migrations (display hints for Phase 5 UI badges). */
export const SPORTS_BET_POLICY_DEFAULTS = {
  minStakePhon: '1.000000',
  minStakeUsdt: '0.010000',
  maxStakePhon: '100000.000000',
  maxStakeUsdt: '10000.000000',
  maxPayoutPhon: '1000000.000000',
  maxPayoutUsdt: '100000.000000',
  comboMaxLegs: 8,
  sgpMaxLegs: 12,
  sgpMinLegs: 2,
  systemMaxLegs: 16,
  systemMaxLines: 128,
  systemUiMinLegs: 3,
  perLegOddsFloorExclusive: '1',
} as const;

export type SportsSlipSurfacePlacement = {
  surface: 'slip_mode_tabs' | 'slip_panel' | 'my_bets_cashout' | 'fixture_slip';
  route: typeof SPORTS_PRIMARY_ROUTE | `${typeof SPORTS_FIXTURE_ROUTE_PREFIX}$fixtureId`;
  component: string;
  hook: string;
  launchGate: SportsLaunchGateKey;
};

export const SPORTS_SLIP_SURFACE_PLACEMENT: Readonly<SportsSlipSurfacePlacement[]> = [
  {
    surface: 'slip_mode_tabs',
    route: SPORTS_PRIMARY_ROUTE,
    component: 'BetSlipModeTabs',
    hook: 'BetSlipProvider',
    launchGate: 'sportsComboBetting',
  },
  {
    surface: 'slip_panel',
    route: SPORTS_PRIMARY_ROUTE,
    component: 'BetSlipPanel',
    hook: 'BetSlipProvider',
    launchGate: 'sportsBetting',
  },
  {
    surface: 'fixture_slip',
    route: `${SPORTS_FIXTURE_ROUTE_PREFIX}$fixtureId`,
    component: 'BetSlipPanel',
    hook: 'BetSlipProvider',
    launchGate: 'sportsBetting',
  },
  {
    surface: 'my_bets_cashout',
    route: SPORTS_PRIMARY_ROUTE,
    component: 'CashoutCard',
    hook: 'usePreviewSportsCashout / useCashoutSportsBet',
    launchGate: 'sportsCashout',
  },
];

/** UI wire status — 2026-07-02 discovery (gates false = built-hidden). */
export const SPORTS_CASHOUT_UI_WIRE_STATUS: Readonly<
  Record<
    | 'slip_single_mode'
    | 'slip_combo_tab'
    | 'slip_sgp_tab'
    | 'slip_system_tab'
    | 'slip_place_cta'
    | 'my_bets_cashout_card'
    | 'cashout_live_refresh'
    | 'slip_policy_badges',
    SportsCashoutExposureMode
  >
> = {
  slip_single_mode: 'live',
  slip_combo_tab: 'built_hidden',
  slip_sgp_tab: 'built_hidden',
  slip_system_tab: 'built_hidden',
  slip_place_cta: 'built_disabled',
  my_bets_cashout_card: 'built_hidden',
  cashout_live_refresh: 'built_hidden',
  slip_policy_badges: 'defer_stub',
};

/** Phase 1 engine backlog — policies required by plan §14.2 but not yet server-enforced. */
export const SPORTS_BET_POLICY_ENGINE_BACKLOG: readonly (keyof typeof SPORTS_BET_POLICY_KEYS)[] = [
  'single_bet_forbidden',
  'combo_min_legs',
  'min_odds_per_leg',
  'combined_min_odds',
  'tier_bet_policy',
];

export function resolveSportsLaunchGateExposure(
  gate: SportsLaunchGateKey,
  gateValue = SPORTS_LAUNCH_GATE_DEFAULTS[gate],
): SportsCashoutExposureMode {
  if (gateValue) return 'live';
  if (gate === 'sportsBetting') return 'built_disabled';
  return 'built_hidden';
}

/** Only cashout branches participate in §7 Money Rollout Canary. */
export function isSportsSection7CanaryBranch(branch: SportsCashoutEngineBranch): boolean {
  return SPORTS_CASHOUT_ENGINE_BRANCHES[branch].section7Canary;
}

export function resolveSportsBetPolicyStatus(
  key: keyof typeof SPORTS_BET_POLICY_KEYS,
): SportsPolicyEngineStatus {
  return SPORTS_BET_POLICY_KEYS[key].engine;
}

/** Client must not simulate policy — server MISSING keys block UI badge claims until engine ships. */
export function shouldDeferSlipPolicyBadges(): boolean {
  return SPORTS_BET_POLICY_ENGINE_BACKLOG.length > 0;
}

/** Combo/SGP tabs require parent sportsBetting AND respective combo gate. */
export function isSportsSlipModeLaunchEnabled(
  mode: SportsBetKind,
  gates: Readonly<Record<SportsLaunchGateKey, boolean>> = SPORTS_LAUNCH_GATE_DEFAULTS,
): boolean {
  if (mode === 'single') return true;
  if (mode === 'combo' || mode === 'sgp') return gates.sportsComboBetting;
  if (mode === 'system') return gates.sportsSystemBetting;
  return false;
}

/** Cashout card renders only when gate live and bet still pending. */
export function shouldShowSportsCashoutCard(
  betStatus: 'pending' | 'won' | 'lost' | 'void' | 'cashed_out',
  sportsCashoutGate = SPORTS_LAUNCH_GATE_DEFAULTS.sportsCashout,
): boolean {
  return sportsCashoutGate && betStatus === 'pending';
}

/** System matrix UI requires ≥3 legs; server system RPC accepts ≥2 — document mismatch, do not weaken client. */
export function isSystemSlipPlaceReady(legCount: number, systemK: number): boolean {
  return (
    legCount >= SPORTS_BET_POLICY_DEFAULTS.systemUiMinLegs && systemK >= 2 && systemK < legCount
  );
}
