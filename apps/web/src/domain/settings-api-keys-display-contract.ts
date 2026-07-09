/**

 * `/settings/api-keys` — trading bot API keys (ENGINE:gap · E8 · §12.18).

 * Route is E-Wave STUB: direct URL only — hidden from settings hub IA until engine green.

 * P8 wires the surface; hub exposure unlocks via `ew-e10-ui-settings-api-keys` after E8.

 */

import type { MessageKey } from '@phonara/i18n';

import { PLATFORM_EWAVE_HIDDEN_ROUTES } from './platform-narrative-display-contract';

export const SETTINGS_API_KEYS_ROUTE = '/settings/api-keys' as const;

export const SETTINGS_API_KEYS_P8_TODO = 'p8-page-settings-api-keys' as const;

/** E8 engine gate — trading API key CRUD RPC missing (§26.2b · ENGINE_GAP_ADR). */

export const SETTINGS_API_KEYS_ENGINE_TODO = 'ew-e8-engine-api-keys' as const;

/** E10 UI unlock — hub nav exposure after `ew-e8-gate-financial` green. */

export const SETTINGS_API_KEYS_UI_UNLOCK_TODO = 'ew-e10-ui-settings-api-keys' as const;

export type SettingsApiKeysEngineBranch = 'list_keys' | 'create_key' | 'revoke_key';

export type SettingsApiKeysEngineStatus = 'missing';

export type SettingsApiKeysExposureMode = 'live' | 'built_hidden' | 'defer_stub';

export const SETTINGS_API_KEYS_ENGINE_BRANCHES: Readonly<
  Record<SettingsApiKeysEngineBranch, { engine: SettingsApiKeysEngineStatus }>
> = {
  list_keys: { engine: 'missing' },

  create_key: { engine: 'missing' },

  revoke_key: { engine: 'missing' },
};

export const SETTINGS_API_KEYS_SEO_TITLE_KEY =
  'seo.settingsApiKeys.title' as const satisfies MessageKey;

export const SETTINGS_API_KEYS_SEO_DESCRIPTION_KEY =
  'seo.settingsApiKeys.description' as const satisfies MessageKey;

export function resolveSettingsApiKeysRoute(): typeof SETTINGS_API_KEYS_ROUTE {
  return SETTINGS_API_KEYS_ROUTE;
}

export function assertSettingsApiKeysHiddenFromIa(): void {
  if (!(PLATFORM_EWAVE_HIDDEN_ROUTES as readonly string[]).includes(SETTINGS_API_KEYS_ROUTE)) {
    throw new Error('settings-api-keys: route must stay E-Wave hidden from IA');
  }
}

/** P8 STUB — page route is wired (`live`); hub nav stays hidden until E10 UI unlock. */

export function resolveSettingsApiKeysPageExposure(): Extract<
  SettingsApiKeysExposureMode,
  'live' | 'built_hidden'
> {
  return 'live';
}

export function resolveSettingsApiKeysHubExposure(): SettingsApiKeysExposureMode {
  return 'built_hidden';
}

export function resolveSettingsApiKeysBranchExposure(
  branch: SettingsApiKeysEngineBranch,
): SettingsApiKeysExposureMode {
  const row = SETTINGS_API_KEYS_ENGINE_BRANCHES[branch];

  if (row.engine === 'missing') return 'defer_stub';

  return 'live';
}

export function shouldExposeSettingsApiKeysInHubNav(): boolean {
  return false;
}

export function canManageTradingApiKeys(): boolean {
  return false;
}
