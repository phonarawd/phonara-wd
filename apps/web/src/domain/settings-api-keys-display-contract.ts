/**
 * `/settings/api-keys` — trading bot API keys (E8 engine ready · E10 hub unlock).
 *
 * P8 wired the surface; E8 ships list/create/revoke RPCs;
 * `ew-e10-wallet-settings-ui` flips hub + CRUD live via `financialConnectivityLive`.
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';
import { PLATFORM_EWAVE_HIDDEN_ROUTES } from './platform-narrative-display-contract';

export const SETTINGS_API_KEYS_ROUTE = '/settings/api-keys' as const;

export const SETTINGS_API_KEYS_P8_TODO = 'p8-page-settings-api-keys' as const;

/** E8 WAVE — trading API key CRUD RPCs (merged into ew-e8-financial-wave). */
export const SETTINGS_API_KEYS_ENGINE_TODO = 'ew-e8-financial-wave' as const;

/** E10 UI unlock — hub nav + CRUD after `ew-e8-gate-financial` green. */
export const SETTINGS_API_KEYS_UI_UNLOCK_TODO = 'ew-e10-wallet-settings-ui' as const;

export type SettingsApiKeysEngineBranch = 'list_keys' | 'create_key' | 'revoke_key';

export type SettingsApiKeysEngineStatus = 'missing' | 'ready';

export type SettingsApiKeysExposureMode = 'live' | 'built_hidden' | 'defer_stub';

export const SETTINGS_API_KEYS_ENGINE_BRANCHES: Readonly<
  Record<SettingsApiKeysEngineBranch, { engine: SettingsApiKeysEngineStatus }>
> = {
  list_keys: { engine: 'ready' },
  create_key: { engine: 'ready' },
  revoke_key: { engine: 'ready' },
};

export const SETTINGS_API_KEYS_SEO_TITLE_KEY =
  'seo.settingsApiKeys.title' as const satisfies MessageKey;

export const SETTINGS_API_KEYS_SEO_DESCRIPTION_KEY =
  'seo.settingsApiKeys.description' as const satisfies MessageKey;

export function resolveSettingsApiKeysRoute(): typeof SETTINGS_API_KEYS_ROUTE {
  return SETTINGS_API_KEYS_ROUTE;
}

/** After E10 unlock the route must leave E-Wave hidden list. */
export function assertSettingsApiKeysIaExposure(): void {
  const hidden = (PLATFORM_EWAVE_HIDDEN_ROUTES as readonly string[]).includes(
    SETTINGS_API_KEYS_ROUTE,
  );
  if (LAUNCH_GATES.financialConnectivityLive && hidden) {
    throw new Error('settings-api-keys: must leave E-Wave hidden after E10 live');
  }
  if (!LAUNCH_GATES.financialConnectivityLive && !hidden) {
    throw new Error('settings-api-keys: must stay E-Wave hidden until E10 live');
  }
}

/** @deprecated Use assertSettingsApiKeysIaExposure — kept for test migration. */
export function assertSettingsApiKeysHiddenFromIa(): void {
  assertSettingsApiKeysIaExposure();
}

export function resolveSettingsApiKeysPageExposure(): Extract<
  SettingsApiKeysExposureMode,
  'live' | 'built_hidden'
> {
  return 'live';
}

export function resolveSettingsApiKeysHubExposure(): SettingsApiKeysExposureMode {
  return LAUNCH_GATES.financialConnectivityLive ? 'live' : 'built_hidden';
}

export function resolveSettingsApiKeysBranchExposure(
  branch: SettingsApiKeysEngineBranch,
): SettingsApiKeysExposureMode {
  const row = SETTINGS_API_KEYS_ENGINE_BRANCHES[branch];
  if (row.engine === 'missing') return 'defer_stub';
  return LAUNCH_GATES.financialConnectivityLive ? 'live' : 'defer_stub';
}

export function shouldExposeSettingsApiKeysInHubNav(): boolean {
  return LAUNCH_GATES.financialConnectivityLive;
}

export function canManageTradingApiKeys(): boolean {
  return (
    LAUNCH_GATES.financialConnectivityEngine &&
    LAUNCH_GATES.financialConnectivityLive
  );
}
