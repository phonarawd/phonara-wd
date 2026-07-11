/**
 * Sports exchange parity — bet365 · Pinnacle · DraftKings · FanDuel · Stake · majors (Plan §22.2.5).
 * Zone ownership, complaint-risk registry, action paths, and multi-market board types.
 *
 * Authority: REBUILD_PLAN_v1 §22.2.5 · §20.13.3 Sports#1 · SPORTS_UX_CANON.md
 * Owner: `p10-sports-parity-contract-and-board` (BUNDLE — contract + board same PR).
 */

import {
  SPORTS_CASHOUT_BET_RPC,
  SPORTS_FIXTURE_ROUTE_PREFIX,
  SPORTS_PLACE_BET_RPC,
  SPORTS_PREVIEW_CASHOUT_RPC,
  SPORTS_PRIMARY_ROUTE,
  SPORTS_SYSTEM_BET_RPC,
} from './sports-cashout-combo-display-contract';
import { SPORTS_HUB_FIXTURE_PRIMARY_MARKET } from './sports-hub-pages-display-contract';

export const P10_SPORTS_PARITY_CONTRACT_AND_BOARD_TODO =
  'p10-sports-parity-contract-and-board' as const;

export const P10_SPORTS_PARITY_PREREQUISITE_TODOS = ['p10-sports-hub-pages'] as const;

export const P10_SPORTS_LIVE_SURFACE_TODO = 'p10-sports-live-surface-wire' as const;
export const P10_SPORTS_SLIP_ADVANCED_TODO = 'p10-sports-slip-advanced-wire' as const;
export const P10_SPORTS_LAYOUT_DEDUP_TODO = 'p10-sports-layout-dedup-gate' as const;
export const EW_E22_SPORTS_PARITY_WAVE_TODO = 'ew-e22-sports-parity-wave' as const;

export type SportsBookReference =
  | 'bet365'
  | 'pinnacle'
  | 'draftkings'
  | 'fanduel'
  | 'stake'
  | 'william_hill'
  | 'betway'
  | '1xbet'
  | 'unibet'
  | 'domestic_toto';

export type SportsParityTier = 'A' | 'B' | 'DONE' | 'N/A';

export type SportsComplaintMitigation = 'live' | 'disabled' | 'disabled+key' | 'built_hidden';

export type SportsParityCategory =
  | 'bet_type'
  | 'settlement'
  | 'market'
  | 'live'
  | 'risk'
  | 'layout';

export type SportsParityRow = {
  id: string;
  module: string;
  category: SportsParityCategory;
  /** Majors offer the capability (pattern reference — not clone). */
  majors: true;
  engine: 'exists' | 'partial' | 'gap';
  engineRpc: string | null;
  phonara: 'yes' | 'partial' | 'no';
  tier: SportsParityTier;
  ownerTodo: string | null;
};

/**
 * §22.2.5 A–C — Sports Exchange Parity Matrix (engine-measured · UI wire owners).
 * Tier-A = engine exists → P10 wire · Tier-B = E22 migration.
 */
export const SPORTS_PARITY_MATRIX: readonly SportsParityRow[] = [
  {
    id: 'bet-single',
    module: 'Single bet',
    category: 'bet_type',
    majors: true,
    engine: 'exists',
    engineRpc: SPORTS_PLACE_BET_RPC,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'bet-combo',
    module: 'Combo ≤8 legs (cross-fixture)',
    category: 'bet_type',
    majors: true,
    engine: 'exists',
    engineRpc: SPORTS_PLACE_BET_RPC,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'bet-sgp',
    module: 'SGP same-fixture ≤12 legs',
    category: 'bet_type',
    majors: true,
    engine: 'exists',
    engineRpc: SPORTS_PLACE_BET_RPC,
    phonara: 'partial',
    tier: 'A',
    ownerTodo: P10_SPORTS_SLIP_ADVANCED_TODO,
  },
  {
    id: 'bet-system',
    module: 'System bet ≤16 legs · 128 lines',
    category: 'bet_type',
    majors: true,
    engine: 'exists',
    engineRpc: SPORTS_SYSTEM_BET_RPC,
    phonara: 'partial',
    tier: 'A',
    ownerTodo: P10_SPORTS_SLIP_ADVANCED_TODO,
  },
  {
    id: 'cashout-full',
    module: 'Full cash-out (preview + execute)',
    category: 'settlement',
    majors: true,
    engine: 'exists',
    engineRpc: `${SPORTS_PREVIEW_CASHOUT_RPC} · ${SPORTS_CASHOUT_BET_RPC}`,
    phonara: 'partial',
    tier: 'A',
    ownerTodo: P10_SPORTS_SLIP_ADVANCED_TODO,
  },
  {
    id: 'cashout-partial',
    module: 'Partial cash-out',
    category: 'settlement',
    majors: true,
    engine: 'exists',
    engineRpc: 'rpc_partial_cashout_sports_bet',
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'bet-builder-correlated',
    module: 'Bet builder (correlated odds)',
    category: 'bet_type',
    majors: true,
    engine: 'gap',
    engineRpc: null,
    phonara: 'no',
    tier: 'B',
    ownerTodo: EW_E22_SPORTS_PARITY_WAVE_TODO,
  },
  {
    id: 'odds-accept-policy',
    module: 'Odds change accept policy (any/worse)',
    category: 'bet_type',
    majors: true,
    engine: 'exists',
    engineRpc: `${SPORTS_PLACE_BET_RPC} · p_odds_acceptance`,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'market-type-registry',
    module: 'Market type registry (10 engine types)',
    category: 'market',
    majors: true,
    engine: 'exists',
    engineRpc: 'sports_market_type_registry',
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'fixture-multi-market-board',
    module: 'Fixture multi-market board (rpc_get_fixture_markets)',
    category: 'market',
    majors: true,
    engine: 'exists',
    engineRpc: 'rpc_get_fixture_markets',
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'correct-score',
    module: 'Correct score market',
    category: 'market',
    majors: true,
    engine: 'exists',
    engineRpc: 'sports_market_type_registry.correct_score',
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'sport-catalog',
    module: 'Full sport catalog table',
    category: 'market',
    majors: true,
    engine: 'exists',
    engineRpc: 'rpc_list_sports_catalog',
    phonara: 'partial',
    tier: 'B',
    ownerTodo: EW_E22_SPORTS_PARITY_WAVE_TODO,
  },
  {
    id: 'odds-feed-vendor',
    module: 'Vendor odds feed worker',
    category: 'market',
    majors: true,
    engine: 'partial',
    engineRpc: 'rpc_ingest_sports_c1*',
    phonara: 'partial',
    tier: 'B',
    ownerTodo: EW_E22_SPORTS_PARITY_WAVE_TODO,
  },
  {
    id: 'live-inplay-state',
    module: 'Live in-play state + suspend TTL',
    category: 'live',
    majors: true,
    engine: 'exists',
    engineRpc: 'rpc_get_live_fixture_state',
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'live-realtime-cache',
    module: 'Realtime odds/score cache wire',
    category: 'live',
    majors: true,
    engine: 'exists',
    engineRpc: 'sports-realtime-cache.ts',
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'risk-stake-cap-display',
    module: 'Risk-tier stake cap display',
    category: 'risk',
    majors: true,
    engine: 'exists',
    engineRpc: '_assert_sports_risk_stake_cap',
    phonara: 'partial',
    tier: 'A',
    ownerTodo: P10_SPORTS_SLIP_ADVANCED_TODO,
  },
  {
    id: 'dual-currency-slip',
    module: 'Dual currency slip (PHON/USDT)',
    category: 'bet_type',
    majors: true,
    engine: 'exists',
    engineRpc: `${SPORTS_PLACE_BET_RPC}(p_currency)`,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
] as const;

/** Engine registry market types exposed as selectable board rows (Sports#1 + E22 correct_score). */
export const SPORTS_BOARD_SELECTABLE_MARKET_TYPES = [
  'match_1x2',
  'totals',
  'totals_2_5',
  'spread',
  'handicap',
  'asian_handicap',
  'btts',
  'both_teams_score',
  'prop_over_under',
  'prop_yes_no',
  'correct_score',
] as const;

export type SportsBoardSelectableMarketType = (typeof SPORTS_BOARD_SELECTABLE_MARKET_TYPES)[number];

export const SPORTS_BOARD_MARKETS_RPC = 'rpc_get_fixture_markets' as const;
export const SPORTS_BOARD_MARKETS_HOOK = 'useGetFixtureMarkets' as const;
export const SPORTS_BOARD_PANEL_OWNER = 'sports-fixture-markets-panel.tsx' as const;

export type SportsUiViewport = 'lg+' | 'mobile<lg' | 'all';

export type SportsUiZoneOwner = {
  id: string;
  viewport: SportsUiViewport;
  zone: string;
  ownerComponent: string;
  mountLocation: string;
  forbiddenDuplicates: readonly string[];
  ownerTodo: string | null;
};

/** §22.2.5-D — single owner per sports UI zone. */
export const SPORTS_UI_ZONE_OWNERS: readonly SportsUiZoneOwner[] = [
  {
    id: 'bet-slip',
    viewport: 'all',
    zone: 'Bet slip',
    ownerComponent: 'SportsBetSlipPanel · useSportsBetSlipState',
    mountLocation: 'sports-page slip rail (lg+) · bottom sheet (mobile)',
    forbiddenDuplicates: ['2nd slip mount', 'page-local stake state'],
    ownerTodo: null,
  },
  {
    id: 'fixture-market-board',
    viewport: 'all',
    zone: 'Fixture market board',
    ownerComponent: 'SportsFixtureMarketsPanel',
    mountLocation: `${SPORTS_FIXTURE_ROUTE_PREFIX}$fixtureId · sports-page fixture mode`,
    forbiddenDuplicates: ['market-board-v2.tsx', 'parallel fixture markets panel'],
    ownerTodo: null,
  },
  {
    id: 'cashout-action',
    viewport: 'all',
    zone: 'Cash-out action',
    ownerComponent: 'SportsMyBetsPanel cashout controller (preview→confirm→RPC)',
    mountLocation: '/sports/my-bets',
    forbiddenDuplicates: ['list+detail dual cashout controllers'],
    ownerTodo: P10_SPORTS_SLIP_ADVANCED_TODO,
  },
  {
    id: 'live-state',
    viewport: 'all',
    zone: 'Live fixture state',
    ownerComponent: 'useLiveFixtureState · sports-realtime-cache · SportsLiveInPlayBanner',
    mountLocation: '/sports/live · fixture live banner',
    forbiddenDuplicates: ['per-page polling forks'],
    ownerTodo: null,
  },
  {
    id: 'fixture-list-board',
    viewport: 'all',
    zone: 'Fixture list / quick 1x2',
    ownerComponent: 'SportsFixtureBoard',
    mountLocation: `${SPORTS_PRIMARY_ROUTE} · /sports/prematch · /sports/live`,
    forbiddenDuplicates: ['duplicate fixture board on same route'],
    ownerTodo: null,
  },
] as const;

export type SportsActionPathIntent =
  | 'toggle-slip-selection'
  | 'place-sports-bet'
  | 'preview-cashout'
  | 'execute-cashout'
  | 'refresh-fixture-markets'
  | 'load-live-fixture-state';

export type SportsActionPathRow = {
  intent: SportsActionPathIntent;
  canonicalSurface: string;
  secondarySurface: string | null;
  sharedHookModule: string;
};

/** §22.2.5-D / §32.7 H2 symmetry — one hook/RPC module per intent. */
export const SPORTS_ACTION_PATH_REGISTRY: readonly SportsActionPathRow[] = [
  {
    intent: 'toggle-slip-selection',
    canonicalSurface: 'SportsFixtureBoard · SportsFixtureMarketsPanel',
    secondarySurface: 'SportsBetSlipPanel remove',
    sharedHookModule: 'features/sports/use-sports-bet-slip-state.ts',
  },
  {
    intent: 'place-sports-bet',
    canonicalSurface: 'SportsBetSlipPanel confirm',
    secondarySurface: null,
    sharedHookModule: 'features/sports/use-sports-betting.ts',
  },
  {
    intent: 'preview-cashout',
    canonicalSurface: 'SportsMyBetsPanel',
    secondarySurface: null,
    sharedHookModule: 'features/sports/use-sports-betting.ts',
  },
  {
    intent: 'execute-cashout',
    canonicalSurface: 'SportsMyBetsPanel',
    secondarySurface: null,
    sharedHookModule: 'features/sports/use-sports-betting.ts',
  },
  {
    intent: 'refresh-fixture-markets',
    canonicalSurface: 'SportsFixtureMarketsPanel retry',
    secondarySurface: null,
    sharedHookModule: 'features/sports/use-sports-betting.ts',
  },
  {
    intent: 'load-live-fixture-state',
    canonicalSurface: '/sports/live surface',
    secondarySurface: 'fixture live banner',
    sharedHookModule: 'features/sports/use-sports-betting.ts',
  },
] as const;

export type SportsUserComplaintRisk = {
  id: string;
  control: string;
  rpcPath: string | null;
  failSymptom: string;
  ownerTodo: string;
  mitigatedBy: SportsComplaintMitigation;
  disabledReasonKey?: string;
};

/**
 * §22.2.5-D required ComplaintRisk rows — register gaps; owner todos mitigate.
 * `sports-market-1x2-only` becomes live after Sports#1 multi-market board wire.
 */
export const SPORTS_USER_COMPLAINT_RISKS: readonly SportsUserComplaintRisk[] = [
  {
    id: 'sports-sgp-hidden-forever',
    control: 'SGP bet kind on slip',
    rpcPath: SPORTS_PLACE_BET_RPC,
    failSymptom: 'engine SGP exists · UI permanently built_hidden',
    ownerTodo: P10_SPORTS_SLIP_ADVANCED_TODO,
    mitigatedBy: 'built_hidden',
  },
  {
    id: 'sports-cashout-dead',
    control: 'My-bets cashout CTA',
    rpcPath: SPORTS_CASHOUT_BET_RPC,
    failSymptom: 'cashout shown · preview/execute not wired',
    ownerTodo: P10_SPORTS_SLIP_ADVANCED_TODO,
    mitigatedBy: 'built_hidden',
  },
  {
    id: 'sports-market-1x2-only',
    control: 'Fixture multi-market board',
    rpcPath: SPORTS_BOARD_MARKETS_RPC,
    failSymptom: 'rpc_get_fixture_markets returns totals/spread/… · board shows 1x2 only',
    ownerTodo: P10_SPORTS_PARITY_CONTRACT_AND_BOARD_TODO,
    mitigatedBy: 'live',
  },
  {
    id: 'sports-odds-changed-deadend',
    control: 'Odds-changed reject recovery',
    rpcPath: SPORTS_PLACE_BET_RPC,
    failSymptom: 'odds_changed error · no refresh/reselect path',
    ownerTodo: P10_SPORTS_SLIP_ADVANCED_TODO,
    mitigatedBy: 'built_hidden',
  },
  {
    id: 'sports-stake-cap-surprise',
    control: 'Risk stake cap display',
    rpcPath: '_assert_sports_risk_stake_cap',
    failSymptom: 'cap not shown · place rejected by risk tier',
    ownerTodo: P10_SPORTS_SLIP_ADVANCED_TODO,
    mitigatedBy: 'built_hidden',
  },
] as const;

export function isSportsBoardSelectableMarketType(
  marketType: string,
): marketType is SportsBoardSelectableMarketType {
  return (SPORTS_BOARD_SELECTABLE_MARKET_TYPES as readonly string[]).includes(marketType);
}

export function findSportsParityRow(id: string): SportsParityRow | undefined {
  return SPORTS_PARITY_MATRIX.find((row) => row.id === id);
}

export function listSportsParityRowsByTier(tier: SportsParityTier): SportsParityRow[] {
  return SPORTS_PARITY_MATRIX.filter((row) => row.tier === tier);
}

export function findSportsZoneOwner(id: string): SportsUiZoneOwner | undefined {
  return SPORTS_UI_ZONE_OWNERS.find((row) => row.id === id);
}

export function findSportsActionPath(
  intent: SportsActionPathIntent,
): SportsActionPathRow | undefined {
  return SPORTS_ACTION_PATH_REGISTRY.find((row) => row.intent === intent);
}

export function findSportsComplaintRisk(id: string): SportsUserComplaintRisk | undefined {
  return SPORTS_USER_COMPLAINT_RISKS.find((row) => row.id === id);
}

export function listSportsComplaintRisksByOwnerTodo(ownerTodo: string): SportsUserComplaintRisk[] {
  return SPORTS_USER_COMPLAINT_RISKS.filter((row) => row.ownerTodo === ownerTodo);
}

/** Non-waivable sync for Sports#1 closeout — contract drift 0. */
export function assertSportsParityContractSync(): void {
  if (P10_SPORTS_PARITY_CONTRACT_AND_BOARD_TODO !== 'p10-sports-parity-contract-and-board') {
    throw new Error('sports-parity: owner todo id drift');
  }
  if (!P10_SPORTS_PARITY_PREREQUISITE_TODOS.includes('p10-sports-hub-pages')) {
    throw new Error('sports-parity: hub-pages prerequisite missing');
  }
  if (SPORTS_HUB_FIXTURE_PRIMARY_MARKET !== 'match_1x2') {
    throw new Error('sports-parity: primary market must remain match_1x2');
  }
  if (!SPORTS_BOARD_SELECTABLE_MARKET_TYPES.includes('match_1x2')) {
    throw new Error('sports-parity: board must include match_1x2');
  }
  for (const required of [
    'totals',
    'spread',
    'handicap',
    'asian_handicap',
    'btts',
    'prop_over_under',
    'prop_yes_no',
    'correct_score',
  ] as const) {
    if (!SPORTS_BOARD_SELECTABLE_MARKET_TYPES.includes(required)) {
      throw new Error(`sports-parity: board missing selectable market ${required}`);
    }
  }

  if (SPORTS_PARITY_MATRIX.length < 15) {
    throw new Error('sports-parity: SPORTS_PARITY_MATRIX incomplete vs §22.2.5');
  }
  const parityIds = SPORTS_PARITY_MATRIX.map((row) => row.id);
  if (new Set(parityIds).size !== parityIds.length) {
    throw new Error('sports-parity: duplicate SPORTS_PARITY_MATRIX id');
  }

  const marketRegistry = findSportsParityRow('market-type-registry');
  const multiBoard = findSportsParityRow('fixture-multi-market-board');
  if (!marketRegistry || marketRegistry.tier !== 'DONE' || marketRegistry.phonara !== 'yes') {
    throw new Error('sports-parity: market-type-registry must be DONE yes after Sports#1');
  }
  if (marketRegistry.ownerTodo !== null) {
    throw new Error('sports-parity: market-type-registry owner must be null after Sports#1');
  }
  if (!multiBoard || multiBoard.tier !== 'DONE' || multiBoard.phonara !== 'yes') {
    throw new Error('sports-parity: fixture-multi-market-board must be DONE yes after Sports#1');
  }
  if (multiBoard.ownerTodo !== null) {
    throw new Error('sports-parity: fixture-multi-market-board owner must be null after Sports#1');
  }

  const liveInplay = findSportsParityRow('live-inplay-state');
  const liveRealtime = findSportsParityRow('live-realtime-cache');
  if (!liveInplay || liveInplay.tier !== 'DONE' || liveInplay.phonara !== 'yes') {
    throw new Error('sports-parity: live-inplay-state must be DONE yes after Sports#2');
  }
  if (liveInplay.ownerTodo !== null) {
    throw new Error('sports-parity: live-inplay-state owner must be null after Sports#2');
  }
  if (!liveRealtime || liveRealtime.tier !== 'DONE' || liveRealtime.phonara !== 'yes') {
    throw new Error('sports-parity: live-realtime-cache must be DONE yes after Sports#2');
  }
  if (liveRealtime.ownerTodo !== null) {
    throw new Error('sports-parity: live-realtime-cache owner must be null after Sports#2');
  }
  if (liveInplay.engineRpc !== 'rpc_get_live_fixture_state') {
    throw new Error('sports-parity: live-inplay-state RPC drift');
  }

  if (SPORTS_UI_ZONE_OWNERS.length < 4) {
    throw new Error('sports-parity: SPORTS_UI_ZONE_OWNERS must cover §22.2.5-D zones');
  }
  const zoneIds = SPORTS_UI_ZONE_OWNERS.map((row) => row.id);
  if (new Set(zoneIds).size !== zoneIds.length) {
    throw new Error('sports-parity: duplicate SPORTS_UI_ZONE_OWNERS id');
  }
  for (const row of SPORTS_UI_ZONE_OWNERS) {
    if (!row.ownerComponent || !row.mountLocation) {
      throw new Error(`sports-parity: zone ${row.id} missing owner or mount`);
    }
    if (row.forbiddenDuplicates.length === 0) {
      throw new Error(`sports-parity: zone ${row.id} must declare forbiddenDuplicates`);
    }
  }
  const boardZone = findSportsZoneOwner('fixture-market-board');
  if (!boardZone?.forbiddenDuplicates.includes('market-board-v2.tsx')) {
    throw new Error('sports-parity: fixture-market-board must forbid market-board-v2.tsx');
  }

  if (SPORTS_ACTION_PATH_REGISTRY.length < 5) {
    throw new Error('sports-parity: SPORTS_ACTION_PATH_REGISTRY incomplete');
  }
  for (const row of SPORTS_ACTION_PATH_REGISTRY) {
    if (!row.sharedHookModule || !row.canonicalSurface) {
      throw new Error(`sports-parity: action path ${row.intent} incomplete`);
    }
  }

  const requiredRisks = [
    'sports-sgp-hidden-forever',
    'sports-cashout-dead',
    'sports-market-1x2-only',
    'sports-odds-changed-deadend',
    'sports-stake-cap-surprise',
  ] as const;
  for (const id of requiredRisks) {
    const risk = findSportsComplaintRisk(id);
    if (!risk) {
      throw new Error(`sports-parity: missing required complaint risk ${id}`);
    }
  }
  const marketOnly = findSportsComplaintRisk('sports-market-1x2-only');
  if (
    !marketOnly ||
    marketOnly.mitigatedBy !== 'live' ||
    marketOnly.ownerTodo !== P10_SPORTS_PARITY_CONTRACT_AND_BOARD_TODO
  ) {
    throw new Error('sports-parity: sports-market-1x2-only must be live under Sports#1 owner');
  }

  const mitigationOk: readonly SportsComplaintMitigation[] = [
    'live',
    'disabled',
    'disabled+key',
    'built_hidden',
  ];
  for (const row of SPORTS_USER_COMPLAINT_RISKS) {
    if (!mitigationOk.includes(row.mitigatedBy)) {
      throw new Error(`sports-parity: complaint risk ${row.id} has invalid mitigatedBy`);
    }
    if (row.mitigatedBy === 'disabled+key' && !row.disabledReasonKey) {
      throw new Error(`sports-parity: complaint risk ${row.id} missing disabledReasonKey`);
    }
  }
}
