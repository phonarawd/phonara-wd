import { describe, expect, it } from 'vitest';
import {
  SPORTS_BET_POLICY_DEFAULTS,
  SPORTS_BET_POLICY_ENGINE_BACKLOG,
  SPORTS_BET_POLICY_KEYS,
  SPORTS_CASHOUT_BET_RPC,
  SPORTS_CASHOUT_CANARY_WAVE,
  SPORTS_CASHOUT_ENGINE_BRANCHES,
  SPORTS_CASHOUT_UI_WIRE_STATUS,
  SPORTS_LAUNCH_GATE_DEFAULTS,
  SPORTS_PLACE_BET_RPC,
  SPORTS_PREVIEW_CASHOUT_RPC,
  SPORTS_PRIMARY_ROUTE,
  SPORTS_SLIP_SURFACE_PLACEMENT,
  SPORTS_SYSTEM_BET_RPC,
  isSportsSection7CanaryBranch,
  isSportsSlipModeLaunchEnabled,
  isSystemSlipPlaceReady,
  resolveSportsBetPolicyStatus,
  resolveSportsLaunchGateExposure,
  resolveSportsPlaceBetLaunchAllowed,
  resolveSportsSlipPlaceCtaExposure,
  shouldDeferSlipPolicyBadges,
  shouldShowSportsCashoutCard,
} from '../sports-cashout-combo-display-contract';
import { LAUNCH_GATES } from '../../lib/launch-gates';

describe('sports-cashout-combo-display-contract', () => {
  it('locks sports slip and cashout to /sports canonical route', () => {
    expect(SPORTS_PRIMARY_ROUTE).toBe('/sports');
    for (const row of SPORTS_SLIP_SURFACE_PLACEMENT) {
      expect(row.route.startsWith('/sports')).toBe(true);
    }
  });

  it('documents cashout/combo/system RPC branches as engine EXISTS', () => {
    expect(SPORTS_CASHOUT_ENGINE_BRANCHES.place_single.rpc).toBe(SPORTS_PLACE_BET_RPC);
    expect(SPORTS_CASHOUT_ENGINE_BRANCHES.place_system.rpc).toBe(SPORTS_SYSTEM_BET_RPC);
    expect(SPORTS_CASHOUT_ENGINE_BRANCHES.preview_cashout.rpc).toBe(SPORTS_PREVIEW_CASHOUT_RPC);
    expect(SPORTS_CASHOUT_ENGINE_BRANCHES.execute_cashout.rpc).toBe(SPORTS_CASHOUT_BET_RPC);
    for (const row of Object.values(SPORTS_CASHOUT_ENGINE_BRANCHES)) {
      expect(row.engine).toBe('exists');
    }
  });

  it('maps §7 Canary to cashout branches only (not slip place)', () => {
    expect(SPORTS_CASHOUT_CANARY_WAVE).toBe('phase5-sports-cashout');
    expect(isSportsSection7CanaryBranch('preview_cashout')).toBe(true);
    expect(isSportsSection7CanaryBranch('execute_cashout')).toBe(true);
    expect(isSportsSection7CanaryBranch('place_combo')).toBe(false);
    expect(isSportsSection7CanaryBranch('place_system')).toBe(false);
  });

  it('defaults all four sports launch gates to false (built-hidden/disabled)', () => {
    expect(SPORTS_LAUNCH_GATE_DEFAULTS.sportsBetting).toBe(LAUNCH_GATES.sportsBetting);
    expect(SPORTS_LAUNCH_GATE_DEFAULTS.sportsComboBetting).toBe(LAUNCH_GATES.sportsComboBetting);
    expect(SPORTS_LAUNCH_GATE_DEFAULTS.sportsSystemBetting).toBe(LAUNCH_GATES.sportsSystemBetting);
    expect(SPORTS_LAUNCH_GATE_DEFAULTS.sportsCashout).toBe(LAUNCH_GATES.sportsCashout);
    expect(SPORTS_LAUNCH_GATE_DEFAULTS.sportsBetting).toBe(false);
    expect(resolveSportsLaunchGateExposure('sportsCashout')).toBe('built_hidden');
    expect(resolveSportsLaunchGateExposure('sportsBetting')).toBe('built_disabled');
    expect(resolveSportsSlipPlaceCtaExposure()).toBe('built_disabled');
  });

  it('ANDs LAUNCH_GATES.sportsBetting with feature_sports kill-switch for place eligibility', () => {
    expect(
      resolveSportsPlaceBetLaunchAllowed({
        sportsBettingGate: false,
        sportsKillSwitchBlocked: false,
      }),
    ).toEqual({ placeCtaExposure: 'built_disabled', launchPlaceAllowed: false });

    expect(
      resolveSportsPlaceBetLaunchAllowed({
        sportsBettingGate: true,
        sportsKillSwitchBlocked: true,
      }),
    ).toEqual({ placeCtaExposure: 'live', launchPlaceAllowed: false });

    expect(
      resolveSportsPlaceBetLaunchAllowed({
        sportsBettingGate: true,
        sportsKillSwitchBlocked: false,
      }),
    ).toEqual({ placeCtaExposure: 'live', launchPlaceAllowed: true });
  });

  it('documents server EXISTS stake/payout/leg-cap policies', () => {
    expect(resolveSportsBetPolicyStatus('min_stake')).toBe('exists');
    expect(resolveSportsBetPolicyStatus('max_stake')).toBe('exists');
    expect(resolveSportsBetPolicyStatus('max_payout')).toBe('exists');
    expect(resolveSportsBetPolicyStatus('combo_max_legs')).toBe('exists');
    expect(SPORTS_BET_POLICY_KEYS.min_stake.enforcedIn).toContain('_assert_sports_stake_limits');
    expect(SPORTS_BET_POLICY_DEFAULTS.comboMaxLegs).toBe(8);
    expect(SPORTS_BET_POLICY_DEFAULTS.sgpMaxLegs).toBe(12);
  });

  it('flags §14.2 tier/single/combo-min-odds policies as MISSING engine backlog', () => {
    expect(resolveSportsBetPolicyStatus('single_bet_forbidden')).toBe('missing');
    expect(resolveSportsBetPolicyStatus('combo_min_legs')).toBe('missing');
    expect(resolveSportsBetPolicyStatus('min_odds_per_leg')).toBe('missing');
    expect(resolveSportsBetPolicyStatus('combined_min_odds')).toBe('missing');
    expect(resolveSportsBetPolicyStatus('tier_bet_policy')).toBe('missing');
    expect(SPORTS_BET_POLICY_ENGINE_BACKLOG).toContain('single_bet_forbidden');
    expect(SPORTS_BET_POLICY_ENGINE_BACKLOG).toContain('combo_min_legs');
    expect(shouldDeferSlipPolicyBadges()).toBe(true);
  });

  it('documents system UI min legs (3) stricter than server RPC min (2)', () => {
    expect(resolveSportsBetPolicyStatus('system_ui_min_legs')).toBe('partial');
    expect(isSystemSlipPlaceReady(2, 2)).toBe(false);
    expect(isSystemSlipPlaceReady(3, 2)).toBe(true);
  });

  it('gates combo/sgp/system slip modes behind launch gates', () => {
    expect(isSportsSlipModeLaunchEnabled('single')).toBe(true);
    expect(isSportsSlipModeLaunchEnabled('combo')).toBe(false);
    expect(isSportsSlipModeLaunchEnabled('system')).toBe(false);
    expect(
      isSportsSlipModeLaunchEnabled('combo', {
        ...SPORTS_LAUNCH_GATE_DEFAULTS,
        sportsComboBetting: true,
      }),
    ).toBe(true);
  });

  it('hides cashout card until sportsCashout gate live', () => {
    expect(shouldShowSportsCashoutCard('pending')).toBe(false);
    expect(shouldShowSportsCashoutCard('pending', true)).toBe(true);
    expect(shouldShowSportsCashoutCard('won', true)).toBe(false);
  });

  it('freezes UI wire: combo/system/cashout built-hidden · place built-disabled · policy badges defer_stub', () => {
    expect(SPORTS_CASHOUT_UI_WIRE_STATUS.slip_combo_tab).toBe('built_hidden');
    expect(SPORTS_CASHOUT_UI_WIRE_STATUS.slip_system_tab).toBe('built_hidden');
    expect(SPORTS_CASHOUT_UI_WIRE_STATUS.my_bets_cashout_card).toBe('built_hidden');
    expect(SPORTS_CASHOUT_UI_WIRE_STATUS.slip_place_cta).toBe('built_disabled');
    expect(SPORTS_CASHOUT_UI_WIRE_STATUS.slip_policy_badges).toBe('defer_stub');
  });
});
