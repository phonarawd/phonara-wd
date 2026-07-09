import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_PROFILE_BACK_ROUTE,
  ACCOUNT_PROFILE_P8_MANIFEST_ROUTES,
  ACCOUNT_PROFILE_P8_TODO,
  ACCOUNT_PROFILE_READ_HOOK,
  ACCOUNT_PROFILE_ROUTE,
  ACCOUNT_PROFILE_TIER_RPC,
  mapProfileUpdateErrorCode,
  normalizeProfileDisplayNameInput,
  normalizeProfileUsernameInput,
  profileDisplayNameGateKey,
  profileUsernameGateKey,
  resolveProfileDisplayLabel,
} from '../account-profile-display-contract';

describe('account-profile-display-contract', () => {
  it('locks canonical route, manifest, and engine ownership', () => {
    expect(ACCOUNT_PROFILE_ROUTE).toBe('/account/profile');
    expect(ACCOUNT_PROFILE_BACK_ROUTE).toBe('/account');
    expect(ACCOUNT_PROFILE_P8_TODO).toBe('p8-page-account-profile');
    expect(ACCOUNT_PROFILE_P8_MANIFEST_ROUTES).toEqual(['/account/profile']);
    expect(ACCOUNT_PROFILE_READ_HOOK).toBe('use-profile');
    expect(ACCOUNT_PROFILE_TIER_RPC).toBe('rpc_get_earn_hub_status');
  });

  it('validates username shape for complete_profile trigger path', () => {
    expect(profileUsernameGateKey('')).toBe('account.profile.usernameRequired');
    expect(profileUsernameGateKey('ab')).toBe('account.profile.usernameTooShort');
    expect(profileUsernameGateKey('1bad')).toBe('account.profile.usernameInvalid');
    expect(profileUsernameGateKey('phon_user')).toBeNull();
    expect(normalizeProfileUsernameInput('  phon_user  ')).toBe('phon_user');
  });

  it('allows optional display name with max length gate', () => {
    expect(profileDisplayNameGateKey('')).toBeNull();
    expect(profileDisplayNameGateKey('a'.repeat(65))).toBe('account.profile.displayNameTooLong');
    expect(normalizeProfileDisplayNameInput('  Hello   World  ')).toBe('Hello World');
  });

  it('resolves display label priority and maps unique violation', () => {
    expect(
      resolveProfileDisplayLabel({
        displayName: 'Operator',
        username: 'phon_user',
        email: 'user@example.com',
      }),
    ).toBe('Operator');
    expect(
      resolveProfileDisplayLabel({
        displayName: null,
        username: 'phon_user',
        email: 'user@example.com',
      }),
    ).toBe('phon_user');
    expect(mapProfileUpdateErrorCode('23505')).toBe('account.profile.usernameTaken');
  });
});
