/**
 * App-install viral mission — growth tab on `/home/missions` (E9 engine · E10 UI).
 * Engine RPC: `rpc_record_app_install_attribution` auto-grants `app_install` viral reward.
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';
import { detectPwaInstallPlatform, isPwaStandalone } from '../features/pwa/pwa-install';
import { EW_E9_RECORD_APP_INSTALL_RPC } from './ew-e9-identity-support-display-contract';
import { HOME_MISSIONS_ROUTE } from './home-missions-display-contract';

export const APP_INSTALL_MISSION_UI_ID = 'growth-appInstall' as const;
export const APP_INSTALL_VIRAL_RPC = 'app_install' as const;
export const APP_INSTALL_RECORD_RPC = EW_E9_RECORD_APP_INSTALL_RPC;
export const APP_INSTALL_MISSION_UI_UNLOCK_TODO = 'ew-e10-growth-ui' as const;
export const APP_INSTALL_MISSION_ENGINE_TODO = 'ew-e9-identity-wave' as const;

export const APP_INSTALL_MISSION_TITLE_KEY =
  'mission.growth.appInstall' as const satisfies MessageKey;
export const APP_INSTALL_MISSION_BODY_KEY =
  'mission.growth.appInstall.body' as const satisfies MessageKey;
export const APP_INSTALL_MISSION_CTA_KEY =
  'mission.growth.appInstall.cta' as const satisfies MessageKey;
export const APP_INSTALL_MISSION_VERIFY_KEY =
  'mission.growth.appInstall.verify' as const satisfies MessageKey;
export const APP_INSTALL_MISSION_SUCCESS_KEY =
  'mission.growth.appInstall.success' as const satisfies MessageKey;
export const APP_INSTALL_MISSION_ERROR_KEY =
  'mission.growth.appInstall.error' as const satisfies MessageKey;

export type AppInstallPlatform = 'pwa' | 'android' | 'ios' | 'other';

export type AppInstallAttributionResult = {
  ok: boolean;
  granted: boolean;
  idempotent: boolean;
  attributionId: string | null;
};

export function isAppInstallMissionLiveUnlocked(): boolean {
  return LAUNCH_GATES.appInstallMissionLive === true;
}

/** Growth tab row is live when E10 growth UI unlock flips the launch gate. */
export function isAppInstallMissionHubLive(): boolean {
  return (
    isAppInstallMissionLiveUnlocked() &&
    APP_INSTALL_RECORD_RPC === 'rpc_record_app_install_attribution' &&
    APP_INSTALL_VIRAL_RPC === 'app_install'
  );
}

export function shouldDeferAppInstallMissionRow(uiId: string): boolean {
  if (uiId !== APP_INSTALL_MISSION_UI_ID) return false;
  return !isAppInstallMissionHubLive();
}

export function resolveAppInstallGrowthTabRoute(): typeof HOME_MISSIONS_ROUTE {
  return HOME_MISSIONS_ROUTE;
}

export function resolveAppInstallPlatform(): AppInstallPlatform {
  if (typeof window === 'undefined') return 'other';
  if (isPwaStandalone()) return 'pwa';
  const platform = detectPwaInstallPlatform();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'other';
}

export function canRecordAppInstallAttribution(): boolean {
  return isAppInstallMissionHubLive();
}

export function parseAppInstallAttributionResult(raw: unknown): AppInstallAttributionResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  if (payload['ok'] !== true) return null;
  return {
    ok: true,
    granted: payload['granted'] === true,
    idempotent: payload['idempotent'] === true,
    attributionId: typeof payload['attribution_id'] === 'string' ? payload['attribution_id'] : null,
  };
}

export function assertAppInstallMissionLiveSync(): void {
  if (!isAppInstallMissionHubLive()) {
    throw new Error('app-install mission hub must be live after E10 growth UI unlock');
  }
}
