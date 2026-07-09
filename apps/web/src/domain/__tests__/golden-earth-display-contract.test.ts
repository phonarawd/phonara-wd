import { describe, expect, it } from 'vitest';
import {
  GOLDEN_EARTH_ENGINE_BRANCHES,
  GOLDEN_EARTH_HOME_FOMO_ROUTE,
  GOLDEN_EARTH_PLACEMENT,
  GOLDEN_EARTH_PRIMARY_TAP_ROUTE,
  GOLDEN_EARTH_STATUS_RPC,
  GOLDEN_EARTH_TAP_RPC,
  GOLDEN_EARTH_UI_WIRE_STATUS,
  resolveGoldenEarthBranchExposure,
  resolveGoldenEarthTapBlocked,
  shouldDeferEventsSeasonCards,
} from '../golden-earth-display-contract';

describe('golden-earth-display-contract', () => {
  it('locks single primary tap owner to /events', () => {
    const primary = GOLDEN_EARTH_PLACEMENT.filter((row) => row.role === 'primary_tap');
    expect(primary).toHaveLength(1);
    expect(primary[0]?.route).toBe(GOLDEN_EARTH_PRIMARY_TAP_ROUTE);
    expect(GOLDEN_EARTH_HOME_FOMO_ROUTE).toBe('/home');
  });

  it('documents engine EXISTS for tap RPCs (Phase 1 audit)', () => {
    expect(GOLDEN_EARTH_ENGINE_BRANCHES.tap_status).toEqual({
      engine: 'exists',
      rpc: GOLDEN_EARTH_STATUS_RPC,
      moneyPath: false,
    });
    expect(GOLDEN_EARTH_ENGINE_BRANCHES.tap_action).toEqual({
      engine: 'exists',
      rpc: GOLDEN_EARTH_TAP_RPC,
      moneyPath: true,
    });
  });

  it('defers events season cards until engine branch exists', () => {
    expect(GOLDEN_EARTH_ENGINE_BRANCHES.events_season_cards.engine).toBe('missing');
    expect(shouldDeferEventsSeasonCards()).toBe(true);
    expect(resolveGoldenEarthBranchExposure('events_season_cards')).toBe('defer_stub');
  });

  it('tap_action is live exposure (engine-first money path)', () => {
    expect(resolveGoldenEarthBranchExposure('tap_action')).toBe('live');
    expect(resolveGoldenEarthBranchExposure('tap_status')).toBe('live');
  });

  it('blocks tap when guest, halted, or cap exhausted', () => {
    expect(
      resolveGoldenEarthTapBlocked({ authenticated: false, systemHalted: false, remaining: 10 }),
    ).toBe(true);
    expect(
      resolveGoldenEarthTapBlocked({ authenticated: true, systemHalted: true, remaining: 10 }),
    ).toBe(true);
    expect(
      resolveGoldenEarthTapBlocked({ authenticated: true, systemHalted: false, remaining: 0 }),
    ).toBe(true);
    expect(
      resolveGoldenEarthTapBlocked({ authenticated: true, systemHalted: false, remaining: 3 }),
    ).toBe(false);
  });

  it('records Phase 7 wired UI on /home and /events', () => {
    expect(GOLDEN_EARTH_UI_WIRE_STATUS['/events']).toBe('wired');
    expect(GOLDEN_EARTH_UI_WIRE_STATUS['/home']).toBe('wired');
  });
});
