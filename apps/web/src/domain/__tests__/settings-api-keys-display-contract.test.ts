import { describe, expect, it } from 'vitest';

import { PLATFORM_EWAVE_HIDDEN_ROUTES } from '../platform-narrative-display-contract';

import { resolveSettingsHubNavItems } from '../settings-hub-display-contract';

import {
  assertSettingsApiKeysIaExposure,
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
  it('locks canonical route and E10 live IA exposure', () => {
    expect(SETTINGS_API_KEYS_ROUTE).toBe('/settings/api-keys');

    expect(resolveSettingsApiKeysRoute()).toBe('/settings/api-keys');

    expect(PLATFORM_EWAVE_HIDDEN_ROUTES).not.toContain('/settings/api-keys');

    expect(() => assertSettingsApiKeysIaExposure()).not.toThrow();
  });

  it('exposes hub nav and CRUD when financialConnectivityLive', () => {
    expect(resolveSettingsApiKeysPageExposure()).toBe('live');

    expect(resolveSettingsApiKeysHubExposure()).toBe('live');

    expect(shouldExposeSettingsApiKeysInHubNav()).toBe(true);

    expect(resolveSettingsHubNavItems().map((row) => row.route)).toContain(SETTINGS_API_KEYS_ROUTE);
  });

  it('documents E8 engine ready and E10 live manage', () => {
    expect(SETTINGS_API_KEYS_ENGINE_TODO).toBe('ew-e8-financial-wave');

    expect(SETTINGS_API_KEYS_UI_UNLOCK_TODO).toBe('ew-e10-wallet-settings-ui');

    expect(canManageTradingApiKeys()).toBe(true);

    expect(SETTINGS_API_KEYS_ENGINE_BRANCHES.list_keys.engine).toBe('ready');

    expect(resolveSettingsApiKeysBranchExposure('create_key')).toBe('live');

    expect(resolveSettingsApiKeysBranchExposure('revoke_key')).toBe('live');
  });
});
