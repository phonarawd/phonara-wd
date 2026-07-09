import { describe, expect, it } from 'vitest';

import { PLATFORM_EWAVE_HIDDEN_ROUTES } from '../platform-narrative-display-contract';

import { resolveSettingsHubNavItems } from '../settings-hub-display-contract';

import {
  assertSettingsApiKeysHiddenFromIa,
  canManageTradingApiKeys,
  resolveSettingsApiKeysBranchExposure,
  resolveSettingsApiKeysHubExposure,
  resolveSettingsApiKeysPageExposure,
  resolveSettingsApiKeysRoute,
  SETTINGS_API_KEYS_ENGINE_BRANCHES,
  SETTINGS_API_KEYS_ENGINE_TODO,
  SETTINGS_API_KEYS_ROUTE,
  SETTINGS_API_KEYS_UI_UNLOCK_TODO,
  shouldExposeSettingsApiKeysInHubNav,
} from '../settings-api-keys-display-contract';

describe('settings-api-keys-display-contract', () => {
  it('locks canonical route and E-Wave IA hidden ownership', () => {
    expect(SETTINGS_API_KEYS_ROUTE).toBe('/settings/api-keys');

    expect(resolveSettingsApiKeysRoute()).toBe('/settings/api-keys');

    expect(PLATFORM_EWAVE_HIDDEN_ROUTES).toContain('/settings/api-keys');

    expect(() => assertSettingsApiKeysHiddenFromIa()).not.toThrow();
  });

  it('keeps hub nav hidden while page route stays live (Strict Perfect · E10 STUB)', () => {
    expect(resolveSettingsApiKeysPageExposure()).toBe('live');

    expect(resolveSettingsApiKeysHubExposure()).toBe('built_hidden');

    expect(shouldExposeSettingsApiKeysInHubNav()).toBe(false);

    expect(resolveSettingsHubNavItems().map((row) => row.route)).not.toContain(
      SETTINGS_API_KEYS_ROUTE,
    );
  });

  it('documents E8 engine gap and defers all CRUD branches', () => {
    expect(SETTINGS_API_KEYS_ENGINE_TODO).toBe('ew-e8-engine-api-keys');

    expect(SETTINGS_API_KEYS_UI_UNLOCK_TODO).toBe('ew-e10-ui-settings-api-keys');

    expect(canManageTradingApiKeys()).toBe(false);

    expect(SETTINGS_API_KEYS_ENGINE_BRANCHES.list_keys.engine).toBe('missing');

    expect(resolveSettingsApiKeysBranchExposure('create_key')).toBe('defer_stub');

    expect(resolveSettingsApiKeysBranchExposure('revoke_key')).toBe('defer_stub');
  });
});
