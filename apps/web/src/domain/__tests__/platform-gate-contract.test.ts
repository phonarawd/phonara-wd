import { describe, expect, it } from 'vitest';
import {
  PLATFORM_CONFIG_KEYS,
  buildPlatformConfigMap,
  isFeatureKillSwitchOff,
  isSystemModeActive,
  resolvePlatformGateBlocks,
  resolveShowKillSwitchBanner,
} from '../platform-gate-contract';

const ALL_ENABLED: Record<(typeof PLATFORM_CONFIG_KEYS)[number], string> = {
  system_halt: 'false',
  system_readonly: 'false',
  feature_game_enabled: 'true',
  feature_spot_enabled: 'true',
  feature_futures_enabled: 'true',
  feature_staking_enabled: 'true',
  feature_deposit_enabled: 'true',
  feature_withdrawal_enabled: 'true',
  feature_sports_enabled: 'true',
};

function config(overrides: Partial<typeof ALL_ENABLED> = {}) {
  return buildPlatformConfigMap(
    Object.entries({ ...ALL_ENABLED, ...overrides }).map(([key, value]) => ({ key, value })),
  );
}

describe('platform-gate-contract', () => {
  it('lists every client-readable kill-switch key from migration 20260702000001', () => {
    expect(PLATFORM_CONFIG_KEYS).toEqual([
      'system_halt',
      'system_readonly',
      'feature_game_enabled',
      'feature_spot_enabled',
      'feature_futures_enabled',
      'feature_staking_enabled',
      'feature_deposit_enabled',
      'feature_withdrawal_enabled',
      'feature_sports_enabled',
    ]);
  });

  it('treats only explicit false as feature-off (missing row fail-open after load)', () => {
    expect(isFeatureKillSwitchOff('false')).toBe(true);
    expect(isFeatureKillSwitchOff('true')).toBe(false);
    expect(isFeatureKillSwitchOff(null)).toBe(false);
    expect(isFeatureKillSwitchOff(undefined)).toBe(false);
  });

  it('blocks sports when feature_sports_enabled is false', () => {
    const blocks = resolvePlatformGateBlocks(config({ feature_sports_enabled: 'false' }));
    expect(blocks.sportsBlocked).toBe(true);
    expect(blocks.depositBlocked).toBe(false);
  });

  it('system_halt blocks all money surfaces', () => {
    const blocks = resolvePlatformGateBlocks(config({ system_halt: 'true' }));
    expect(blocks.systemHalted).toBe(true);
    expect(blocks.depositBlocked).toBe(true);
    expect(blocks.withdrawalBlocked).toBe(true);
    expect(blocks.tradeBlocked).toBe(true);
    expect(blocks.casinoBlocked).toBe(true);
    expect(blocks.sportsBlocked).toBe(true);
    expect(blocks.stakingBlocked).toBe(true);
  });

  it('system_readonly is equivalent to halt for client gates', () => {
    expect(isSystemModeActive('true')).toBe(true);
    const blocks = resolvePlatformGateBlocks(config({ system_readonly: 'true' }));
    expect(blocks.systemHalted).toBe(true);
    expect(blocks.tradeBlocked).toBe(true);
  });

  it('shows route-aware banner on wallet when deposit or withdrawal is off', () => {
    const depositOff = resolvePlatformGateBlocks(config({ feature_deposit_enabled: 'false' }));
    expect(resolveShowKillSwitchBanner('/wallet', depositOff)).toBe(true);
    expect(resolveShowKillSwitchBanner('/trade', depositOff)).toBe(false);

    const withdrawOff = resolvePlatformGateBlocks(config({ feature_withdrawal_enabled: 'false' }));
    expect(resolveShowKillSwitchBanner('/wallet', withdrawOff)).toBe(true);
  });

  it('shows banner on /sports when sports kill switch is off', () => {
    const sportsOff = resolvePlatformGateBlocks(config({ feature_sports_enabled: 'false' }));
    expect(resolveShowKillSwitchBanner('/sports', sportsOff)).toBe(true);
    expect(resolveShowKillSwitchBanner('/home', sportsOff)).toBe(false);
  });
});
