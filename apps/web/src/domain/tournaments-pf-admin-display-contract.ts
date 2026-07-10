/**
 * Tournaments + PF admin — Phase 1 E18 discovery contract.
 * Maps presentation-only tournament mock vs engine-backed provably-fair paths,
 * and documents admin casino desk coverage gaps (catalog/RTP wired · PF seed ops missing).
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E18 · Phase 6 casino infra
 */

import type { PlatformGateBlocks } from './platform-gate-contract';

export const PF_OPEN_ROUND_RPC = 'rpc_open_game_round' as const;
export const PF_PLACE_BET_RPC = 'rpc_place_game_bet' as const;
export const PF_REVEAL_ROUND_RPC = 'rpc_reveal_game_round' as const;
export const PF_CREATE_ROUND_RPC = 'rpc_create_game_round' as const;

export const PF_ADMIN_LIST_CATALOG_RPC = 'rpc_admin_list_casino_catalog' as const;
export const PF_ADMIN_SET_GAME_STATUS_RPC = 'rpc_admin_set_casino_game_status' as const;

export const PF_GAME_ROUNDS_TABLE = 'game_rounds' as const;
export const PF_GAME_BETS_VIEW = 'v_game_bets_client' as const;
export const PF_GAME_ROUNDS_PUBLIC_VIEW = 'v_game_rounds_public' as const;
export const PF_SEED_REVEALS_TABLE = 'game_seed_reveals' as const;

export const TOURNAMENTS_ROUTE_LEGACY = '/games/tournaments' as const;
export const TOURNAMENTS_ROUTE_CANONICAL = '/casino/tournaments' as const;
export const PF_FAIRNESS_ROUTE_LEGACY = '/games/fairness' as const;
export const PF_FAIRNESS_ROUTE_CANONICAL = '/casino/fairness' as const;
export const CASINO_HUB_ROUTE = '/casino' as const;
export const ADMIN_CASINO_ROUTE = '/admin/casino' as const;

export type TournamentsPfAdminEngineBranch =
  | 'tournament_list'
  | 'tournament_leaderboard'
  | 'tournament_entry'
  | 'tournament_prize_settlement'
  | 'tournament_cms_intro'
  | 'pf_user_open_round'
  | 'pf_user_place_bet'
  | 'pf_user_reveal_round'
  | 'pf_user_fairness_history'
  | 'pf_user_client_verify'
  | 'pf_admin_create_round'
  | 'pf_admin_seed_rotation'
  | 'pf_admin_orphan_round_monitor'
  | 'pf_admin_seed_reveal_audit'
  | 'admin_casino_catalog'
  | 'admin_casino_game_status'
  | 'admin_casino_pf_seed_tab';

export type TournamentsPfAdminEngineStatus = 'exists' | 'partial' | 'missing';

export type TournamentsPfAdminExposureMode = 'live' | 'built_hidden' | 'defer_stub';

export const TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES: Readonly<
  Record<
    TournamentsPfAdminEngineBranch,
    {
      engine: TournamentsPfAdminEngineStatus;
      source: string;
      moneyPath: boolean;
      domain: 'tournament' | 'pf_user' | 'pf_admin';
    }
  >
> = {
  tournament_list: {
    engine: 'missing',
    source: 'casino-tournaments.ts TOURNAMENTS mock',
    moneyPath: false,
    domain: 'tournament',
  },
  tournament_leaderboard: {
    engine: 'missing',
    source: 'useLeaderboardSim · LEADERBOARD_SEED mock',
    moneyPath: false,
    domain: 'tournament',
  },
  tournament_entry: {
    engine: 'missing',
    source: 'no rpc_join_tournament / enrollment RPC',
    moneyPath: false,
    domain: 'tournament',
  },
  tournament_prize_settlement: {
    engine: 'missing',
    source: 'formatPrize display-only · no ledger payout RPC',
    moneyPath: true,
    domain: 'tournament',
  },
  tournament_cms_intro: {
    engine: 'partial',
    source: 'admin CMS seed casino.tournaments.intro · not live tournament rows',
    moneyPath: false,
    domain: 'tournament',
  },
  pf_user_open_round: {
    engine: 'exists',
    source: PF_OPEN_ROUND_RPC,
    moneyPath: false,
    domain: 'pf_user',
  },
  pf_user_place_bet: {
    engine: 'exists',
    source: PF_PLACE_BET_RPC,
    moneyPath: true,
    domain: 'pf_user',
  },
  pf_user_reveal_round: {
    engine: 'exists',
    source: PF_REVEAL_ROUND_RPC,
    moneyPath: false,
    domain: 'pf_user',
  },
  pf_user_fairness_history: {
    engine: 'exists',
    source: `${PF_GAME_BETS_VIEW} · loadFairnessHistory`,
    moneyPath: false,
    domain: 'pf_user',
  },
  pf_user_client_verify: {
    engine: 'exists',
    source: '@phonara/game-engine verifyRound · FairnessSheet',
    moneyPath: false,
    domain: 'pf_user',
  },
  pf_admin_create_round: {
    engine: 'partial',
    source: `${PF_CREATE_ROUND_RPC} · service_role only · no admin UI`,
    moneyPath: false,
    domain: 'pf_admin',
  },
  pf_admin_seed_rotation: {
    engine: 'missing',
    source: 'no rpc_admin_rotate_game_seed / operator seed queue',
    moneyPath: false,
    domain: 'pf_admin',
  },
  pf_admin_orphan_round_monitor: {
    engine: 'partial',
    source: 'invariant_orphan_game_rounds ops alert · read-only',
    moneyPath: false,
    domain: 'pf_admin',
  },
  pf_admin_seed_reveal_audit: {
    engine: 'partial',
    source: `${PF_SEED_REVEALS_TABLE} append-only · no rpc_admin_list_seed_reveals`,
    moneyPath: false,
    domain: 'pf_admin',
  },
  admin_casino_catalog: {
    engine: 'exists',
    source: PF_ADMIN_LIST_CATALOG_RPC,
    moneyPath: false,
    domain: 'pf_admin',
  },
  admin_casino_game_status: {
    engine: 'exists',
    source: PF_ADMIN_SET_GAME_STATUS_RPC,
    moneyPath: false,
    domain: 'pf_admin',
  },
  admin_casino_pf_seed_tab: {
    engine: 'missing',
    source: 'CasinoDeskHub tabs catalog|rtp only',
    moneyPath: false,
    domain: 'pf_admin',
  },
};

export type TournamentsPfAdminSurfacePlacement = {
  route:
    | typeof TOURNAMENTS_ROUTE_LEGACY
    | typeof TOURNAMENTS_ROUTE_CANONICAL
    | typeof PF_FAIRNESS_ROUTE_LEGACY
    | typeof PF_FAIRNESS_ROUTE_CANONICAL
    | typeof CASINO_HUB_ROUTE
    | typeof ADMIN_CASINO_ROUTE;
  role:
    | 'tournaments_hub'
    | 'tournaments_hub_preview'
    | 'pf_fairness_hub'
    | 'admin_casino_catalog'
    | 'admin_casino_rtp'
    | 'admin_pf_seed_ops';
  hook: string;
  canonicalTarget?: typeof TOURNAMENTS_ROUTE_CANONICAL | typeof PF_FAIRNESS_ROUTE_CANONICAL;
};

export const TOURNAMENTS_PF_ADMIN_PLACEMENT: Readonly<TournamentsPfAdminSurfacePlacement[]> = [
  {
    route: TOURNAMENTS_ROUTE_LEGACY,
    role: 'tournaments_hub',
    hook: 'ImportedGamesTournamentsPage · casino-tournaments.ts',
    canonicalTarget: TOURNAMENTS_ROUTE_CANONICAL,
  },
  {
    route: CASINO_HUB_ROUTE,
    role: 'tournaments_hub_preview',
    hook: 'CasinoLobbyPage · casino-lobby-page.tsx',
    canonicalTarget: TOURNAMENTS_ROUTE_CANONICAL,
  },
  {
    route: PF_FAIRNESS_ROUTE_LEGACY,
    role: 'pf_fairness_hub',
    hook: 'ImportedGamesFairnessPage · loadFairnessHistory',
    canonicalTarget: PF_FAIRNESS_ROUTE_CANONICAL,
  },
  {
    route: ADMIN_CASINO_ROUTE,
    role: 'admin_casino_catalog',
    hook: 'useAdminCasinoDesk · CasinoCatalogQueue',
  },
  {
    route: ADMIN_CASINO_ROUTE,
    role: 'admin_casino_rtp',
    hook: 'useAdminCasinoDesk · CasinoRtpReviewQueue',
  },
  {
    route: ADMIN_CASINO_ROUTE,
    role: 'admin_pf_seed_ops',
    hook: 'CasinoDeskHub — defer until admin PF RPC ships',
  },
];

/** Phase 1 audit (2026-07-02). */
export const TOURNAMENTS_PF_ADMIN_UI_WIRE_STATUS: Readonly<
  Record<
    | typeof TOURNAMENTS_ROUTE_LEGACY
    | typeof PF_FAIRNESS_ROUTE_LEGACY
    | typeof CASINO_HUB_ROUTE
    | typeof ADMIN_CASINO_ROUTE,
    'wired' | 'partial' | 'unwired' | 'mock_only' | 'defer_stub'
  >
> = {
  '/games/tournaments': 'mock_only',
  '/games/fairness': 'wired',
  '/casino': 'partial',
  '/admin/casino': 'partial',
};

export function isTournamentMockPresentation(): boolean {
  return TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.tournament_list.engine === 'missing';
}

export function shouldDeferTournamentLiveFeatures(): boolean {
  return (
    TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.tournament_list.engine === 'missing' ||
    TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.tournament_entry.engine === 'missing'
  );
}

export function resolveTournamentBranchExposure(
  branch: Extract<TournamentsPfAdminEngineBranch, `tournament_${string}`>,
): TournamentsPfAdminExposureMode {
  const row = TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES[branch];
  if (row.engine === 'missing') {
    return row.moneyPath ? 'built_hidden' : 'defer_stub';
  }
  if (row.engine === 'partial') return 'defer_stub';
  return 'live';
}

export function resolvePfUserBranchExposure(
  branch: Extract<TournamentsPfAdminEngineBranch, `pf_user_${string}`>,
  blocks: Pick<PlatformGateBlocks, 'casinoBlocked'> = { casinoBlocked: false },
): TournamentsPfAdminExposureMode {
  if (blocks.casinoBlocked) return 'built_hidden';
  const row = TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES[branch];
  if (row.engine === 'missing') return 'defer_stub';
  if (row.engine === 'partial') return 'built_hidden';
  return 'live';
}

export function resolvePfAdminBranchExposure(
  branch: Extract<TournamentsPfAdminEngineBranch, `pf_admin_${string}` | `admin_casino_${string}`>,
): TournamentsPfAdminExposureMode {
  const row = TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES[branch];
  if (row.engine === 'missing') return 'defer_stub';
  if (row.engine === 'partial') return 'built_hidden';
  return 'live';
}

export function resolveAdminCasinoDeskTabExposure(
  tab: 'catalog' | 'rtp' | 'pf_seed',
): TournamentsPfAdminExposureMode {
  if (tab === 'catalog') return resolvePfAdminBranchExposure('admin_casino_catalog');
  if (tab === 'rtp') return resolvePfAdminBranchExposure('admin_casino_game_status');
  return resolvePfAdminBranchExposure('admin_casino_pf_seed_tab');
}

/** Non-money tournament CTAs must not imply live prize settlement until engine ships. */
export function resolveTournamentEnterCtaExposure(): TournamentsPfAdminExposureMode {
  if (shouldDeferTournamentLiveFeatures()) return 'defer_stub';
  return 'live';
}
