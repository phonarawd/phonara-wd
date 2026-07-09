import { describe, expect, it } from 'vitest';

import {
  allClientGateConfigSelectKeys,
  buildClientGateConfigMap,
  CLIENT_GATE_CONFIG_KEYS,
  isClientGateFlagOn,
  PER_GAME_CONFIG_SLUGS,
  perGameConfigKey,
  resolveConsentGateBlocked,
  resolveGeoAccessBlocked,
  resolvePerGameCasinoBlocked,
  resolveWithdrawalMfaStepUpRequired,
} from '../client-gate-contract';

describe('client-gate-contract · PQA F2 prechecks', () => {
  it('lists every client-readable gate key from migration 20260723000001', () => {
    expect(CLIENT_GATE_CONFIG_KEYS).toEqual([
      'consent_gate_enabled',
      'withdrawal_mfa_step_up_enabled',
      'geo_block_enabled',
    ]);
    expect(PER_GAME_CONFIG_SLUGS).toHaveLength(12);
    expect(allClientGateConfigSelectKeys()).toHaveLength(15);
    expect(perGameConfigKey('dice')).toBe('feature_game_dice_enabled');
  });

  it('buildClientGateConfigMap maps per-game rows', () => {
    const map = buildClientGateConfigMap([
      { key: 'consent_gate_enabled', value: 'true' },
      { key: 'feature_game_dice_enabled', value: 'false' },
    ]);
    expect(map.consent_gate_enabled).toBe('true');
    expect(map.perGame.dice).toBe('false');
    expect(map.perGame.crash).toBeNull();
  });

  it('consent gate blocks only when enabled and onboarding incomplete', () => {
    expect(
      resolveConsentGateBlocked({ consentGateEnabled: false, onboardingConsentComplete: false }),
    ).toBe(false);
    expect(
      resolveConsentGateBlocked({ consentGateEnabled: true, onboardingConsentComplete: false }),
    ).toBe(true);
    expect(
      resolveConsentGateBlocked({ consentGateEnabled: true, onboardingConsentComplete: true }),
    ).toBe(false);
  });

  it('geo gate blocks when flag on and profile geo_blocked', () => {
    expect(resolveGeoAccessBlocked({ geoBlockEnabled: false, profileGeoBlocked: true })).toBe(
      false,
    );
    expect(resolveGeoAccessBlocked({ geoBlockEnabled: true, profileGeoBlocked: false })).toBe(
      false,
    );
    expect(resolveGeoAccessBlocked({ geoBlockEnabled: true, profileGeoBlocked: true })).toBe(true);
  });

  it('withdrawal MFA step-up requires AAL2 when TOTP enrolled', () => {
    expect(
      resolveWithdrawalMfaStepUpRequired({
        mfaStepUpEnabled: true,
        hasVerifiedTotp: true,
        currentAal: 'aal1',
      }),
    ).toBe(true);
    expect(
      resolveWithdrawalMfaStepUpRequired({
        mfaStepUpEnabled: true,
        hasVerifiedTotp: true,
        currentAal: 'aal2',
      }),
    ).toBe(false);
    expect(
      resolveWithdrawalMfaStepUpRequired({
        mfaStepUpEnabled: true,
        hasVerifiedTotp: false,
        currentAal: 'aal1',
      }),
    ).toBe(false);
  });

  it('per-game casino gate distinguishes aggregate vs per-game kill', () => {
    expect(
      resolvePerGameCasinoBlocked({
        aggregateCasinoBlocked: true,
        perGameEnabled: 'true',
      }),
    ).toEqual({ blocked: true, reasonKey: 'gate.killswitch.casinoBlocked' });

    expect(
      resolvePerGameCasinoBlocked({
        aggregateCasinoBlocked: false,
        perGameEnabled: 'false',
      }),
    ).toEqual({ blocked: true, reasonKey: 'gate.killswitch.gameOff' });

    expect(
      resolvePerGameCasinoBlocked({
        aggregateCasinoBlocked: false,
        perGameEnabled: 'true',
      }),
    ).toEqual({ blocked: false, reasonKey: null });
  });

  it('isClientGateFlagOn matches server true-only semantics', () => {
    expect(isClientGateFlagOn('true')).toBe(true);
    expect(isClientGateFlagOn('false')).toBe(false);
    expect(isClientGateFlagOn(null)).toBe(false);
  });
});
