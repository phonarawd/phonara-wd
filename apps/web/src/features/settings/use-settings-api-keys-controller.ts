import {
  canManageTradingApiKeys,
  resolveSettingsApiKeysHubExposure,
  resolveSettingsApiKeysPageExposure,
  SETTINGS_API_KEYS_ROUTE,
  type SettingsApiKeysExposureMode,
} from '@/domain/settings-api-keys-display-contract';

import { useT } from '@/product/i18n';

export type SettingsApiKeysControllerView = {
  t: ReturnType<typeof useT>;

  route: typeof SETTINGS_API_KEYS_ROUTE;

  pageExposure: ReturnType<typeof resolveSettingsApiKeysPageExposure>;

  hubExposure: SettingsApiKeysExposureMode;

  canManageKeys: boolean;
};

/** Canonical `/settings/api-keys` — ENGINE:gap trading bot API STUB (P8 · IA hidden). */

export function useSettingsApiKeysController(): SettingsApiKeysControllerView {
  const t = useT();

  return {
    t,

    route: SETTINGS_API_KEYS_ROUTE,

    pageExposure: resolveSettingsApiKeysPageExposure(),

    hubExposure: resolveSettingsApiKeysHubExposure(),

    canManageKeys: canManageTradingApiKeys(),
  };
}
