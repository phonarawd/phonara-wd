import { describe, expect, it } from 'vitest';
import {
  ADMIN_CASINO_ROUTE,
  CASINO_HUB_ROUTE,
  PF_ADMIN_LIST_CATALOG_RPC,
  PF_CREATE_ROUND_RPC,
  PF_FAIRNESS_ROUTE_LEGACY,
  PF_OPEN_ROUND_RPC,
  PF_PLACE_BET_RPC,
  PF_REVEAL_ROUND_RPC,
  TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES,
  TOURNAMENTS_PF_ADMIN_PLACEMENT,
  TOURNAMENTS_PF_ADMIN_UI_WIRE_STATUS,
  TOURNAMENTS_ROUTE_CANONICAL,
  TOURNAMENTS_ROUTE_LEGACY,
  isTournamentMockPresentation,
  resolveAdminCasinoDeskTabExposure,
  resolvePfAdminBranchExposure,
  resolvePfUserBranchExposure,
  resolveTournamentBranchExposure,
  resolveTournamentEnterCtaExposure,
  shouldDeferTournamentLiveFeatures,
} from '../tournaments-pf-admin-display-contract';

describe('tournaments-pf-admin-display-contract', () => {
  it('locks E18 placement to tournaments hub · PF fairness · admin casino desk', () => {
    expect(TOURNAMENTS_PF_ADMIN_PLACEMENT).toHaveLength(6);
    const routes = TOURNAMENTS_PF_ADMIN_PLACEMENT.map((row) => row.route);
    expect(routes).toContain(TOURNAMENTS_ROUTE_LEGACY);
    expect(routes).toContain(CASINO_HUB_ROUTE);
    expect(routes).toContain(PF_FAIRNESS_ROUTE_LEGACY);
    expect(routes).toContain(ADMIN_CASINO_ROUTE);
    expect(
      TOURNAMENTS_PF_ADMIN_PLACEMENT.find((row) => row.role === 'tournaments_hub')?.canonicalTarget,
    ).toBe(TOURNAMENTS_ROUTE_CANONICAL);
  });

  it('documents EXISTS client PF round RPCs (Phase 1 audit)', () => {
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.pf_user_open_round).toMatchObject({
      engine: 'exists',
      source: PF_OPEN_ROUND_RPC,
      moneyPath: false,
    });
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.pf_user_place_bet.source).toBe(PF_PLACE_BET_RPC);
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.pf_user_reveal_round.source).toBe(
      PF_REVEAL_ROUND_RPC,
    );
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.pf_user_fairness_history.engine).toBe('exists');
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.pf_user_client_verify.engine).toBe('exists');
  });

  it('marks tournament engine branches MISSING and defers non-money UI', () => {
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.tournament_list.engine).toBe('missing');
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.tournament_leaderboard.engine).toBe('missing');
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.tournament_entry.engine).toBe('missing');
    expect(resolveTournamentBranchExposure('tournament_list')).toBe('defer_stub');
    expect(resolveTournamentBranchExposure('tournament_prize_settlement')).toBe('built_hidden');
    expect(shouldDeferTournamentLiveFeatures()).toBe(true);
    expect(isTournamentMockPresentation()).toBe(true);
    expect(resolveTournamentEnterCtaExposure()).toBe('defer_stub');
  });

  it('documents admin casino catalog EXISTS and PF seed tab MISSING', () => {
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.admin_casino_catalog).toMatchObject({
      engine: 'exists',
      source: PF_ADMIN_LIST_CATALOG_RPC,
    });
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.admin_casino_pf_seed_tab.engine).toBe('missing');
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.pf_admin_create_round.engine).toBe('partial');
    expect(TOURNAMENTS_PF_ADMIN_ENGINE_BRANCHES.pf_admin_create_round.source).toContain(
      PF_CREATE_ROUND_RPC,
    );
    expect(resolvePfAdminBranchExposure('admin_casino_catalog')).toBe('live');
    expect(resolvePfAdminBranchExposure('admin_casino_pf_seed_tab')).toBe('defer_stub');
    expect(resolvePfAdminBranchExposure('pf_admin_seed_rotation')).toBe('defer_stub');
    expect(resolvePfAdminBranchExposure('pf_admin_create_round')).toBe('built_hidden');
  });

  it('hides PF user branches when casino kill-switch blocks', () => {
    expect(resolvePfUserBranchExposure('pf_user_open_round')).toBe('live');
    expect(resolvePfUserBranchExposure('pf_user_place_bet', { casinoBlocked: true })).toBe(
      'built_hidden',
    );
    expect(resolvePfUserBranchExposure('pf_user_fairness_history', { casinoBlocked: true })).toBe(
      'built_hidden',
    );
  });

  it('maps admin casino desk tab exposure', () => {
    expect(resolveAdminCasinoDeskTabExposure('catalog')).toBe('live');
    expect(resolveAdminCasinoDeskTabExposure('rtp')).toBe('live');
    expect(resolveAdminCasinoDeskTabExposure('pf_seed')).toBe('defer_stub');
  });

  it('records Phase 1 UI wire status for mock tournaments vs wired fairness', () => {
    expect(TOURNAMENTS_PF_ADMIN_UI_WIRE_STATUS['/games/tournaments']).toBe('mock_only');
    expect(TOURNAMENTS_PF_ADMIN_UI_WIRE_STATUS['/games/fairness']).toBe('wired');
    expect(TOURNAMENTS_PF_ADMIN_UI_WIRE_STATUS['/casino']).toBe('partial');
    expect(TOURNAMENTS_PF_ADMIN_UI_WIRE_STATUS['/admin/casino']).toBe('partial');
  });
});
