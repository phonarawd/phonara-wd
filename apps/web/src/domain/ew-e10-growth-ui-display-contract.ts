/**
 * E10 growth UI unlock (YAML `ew-e10-growth-ui`).
 * Authority: ADR-019 · ADR-020 · Plan §21.1 E10 linear · trust-support DONE.
 *
 * Flips Kakao share augment on `/referral/invite` · app-install growth tab live.
 * Next: `ew-e10-gate-platform-world-class`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  assertAppInstallMissionLiveSync,
  APP_INSTALL_MISSION_UI_ID,
  APP_INSTALL_RECORD_RPC,
  APP_INSTALL_VIRAL_RPC,
  isAppInstallMissionHubLive,
} from './app-install-mission-display-contract';
import {
  assertEwE10TrustSupportUiSync,
  EW_E10_TRUST_SUPPORT_UI_TODO,
} from './ew-e10-trust-support-ui-display-contract';
import {
  isAppInstallMissionEnginePathReady,
  resolveEwE9GateUiUnlockWireStatus,
} from './ew-e9-gate-identity-support-display-contract';
import {
  canConfigureKakaoShare,
  KAKAO_SHARE_UI_UNLOCK_TODO,
  resolveKakaoShareRoute,
} from './kakao-share-display-contract';
import { REFERRAL_INVITE_ROUTE } from './referral-hub-display-contract';

export const EW_E10_GROWTH_UI_TODO = 'ew-e10-growth-ui' as const;
export const EW_E10_GROWTH_UI_PREREQUISITE_TODO = EW_E10_TRUST_SUPPORT_UI_TODO;
export const EW_E10_GROWTH_UI_NEXT_TODO = 'ew-e10-gate-platform-world-class' as const;

export const EW_E10_GROWTH_UI_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e10-growth-ui-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e10-growth-ui-display-contract.test.ts',
  'apps/web/src/domain/kakao-share-display-contract.ts',
  'apps/web/src/domain/__tests__/kakao-share-display-contract.test.ts',
  'apps/web/src/domain/app-install-mission-display-contract.ts',
  'apps/web/src/domain/__tests__/app-install-mission-display-contract.test.ts',
  'apps/web/src/lib/kakao-share-sdk.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/web/src/domain/referral-invite-display-contract.ts',
  'apps/web/src/domain/viral-missions-display-contract.ts',
  'apps/web/src/data/earn-static-missions.ts',
  'apps/web/src/features/earn/use-app-install-mission-action.ts',
  'apps/web/src/features/earn/__tests__/use-app-install-mission-action.test.ts',
  'apps/web/src/features/earn/use-referral-invite-page-controller.ts',
  'apps/web/src/features/earn/use-home-missions-page-controller.ts',
  'apps/web/src/product/surfaces/referral/referral-invite-page.tsx',
  'apps/web/src/product/surfaces/home/home-missions-page.tsx',
  'docs/OPERATIONS/ENGINE_GAP_E10_GROWTH_UI.md',
  'docs/PRODUCT/ADR/019-identity-support-analytics.md',
  'docs/PRODUCT/ADR/020-platform-engine.md',
] as const;

export const EW_E10_GROWTH_UI_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e10-growth-ui-display-contract.test.ts',
  'apps/web/src/domain/__tests__/kakao-share-display-contract.test.ts',
  'apps/web/src/domain/__tests__/app-install-mission-display-contract.test.ts',
  'apps/web/src/features/earn/__tests__/use-app-install-mission-action.test.ts',
  'apps/web/src/product/surfaces/referral/__tests__/referral-invite-page.test.tsx',
  'apps/web/src/product/surfaces/home/__tests__/home-missions-page.test.tsx',
] as const;

export function isKakaoShareSdkLive(): boolean {
  return (
    LAUNCH_GATES.kakaoShareSdkLive === true && resolveKakaoShareRoute() === REFERRAL_INVITE_ROUTE
  );
}

/** Kakao augment is configured when launch gate + JS key are present. */
export function isKakaoShareAugmentReady(): boolean {
  return isKakaoShareSdkLive() && canConfigureKakaoShare();
}

export function isEwE10GrowthUiUnlocked(): boolean {
  const wire = resolveEwE9GateUiUnlockWireStatus();
  return (
    LAUNCH_GATES.appInstallMissionLive === true &&
    LAUNCH_GATES.kakaoShareSdkLive === true &&
    isAppInstallMissionEnginePathReady() &&
    isAppInstallMissionHubLive() &&
    wire.app_install_mission_tab === 'live' &&
    isKakaoShareSdkLive()
  );
}

export function assertEwE10GrowthUiSync(): void {
  assertEwE10TrustSupportUiSync();

  if (EW_E10_GROWTH_UI_TODO !== 'ew-e10-growth-ui') {
    throw new Error('E10 growth UI todo id drift');
  }
  if (EW_E10_GROWTH_UI_PREREQUISITE_TODO !== 'ew-e10-trust-support-ui') {
    throw new Error('E10 growth prerequisite must be ew-e10-trust-support-ui');
  }
  if (EW_E10_GROWTH_UI_NEXT_TODO !== 'ew-e10-gate-platform-world-class') {
    throw new Error('E10 growth next must be ew-e10-gate-platform-world-class');
  }
  if (KAKAO_SHARE_UI_UNLOCK_TODO !== 'ew-e10-growth-ui') {
    throw new Error('Kakao share unlock todo drift');
  }
  if (APP_INSTALL_MISSION_UI_ID !== 'growth-appInstall') {
    throw new Error('app-install mission ui id drift');
  }
  if (APP_INSTALL_VIRAL_RPC !== 'app_install') {
    throw new Error('app-install viral rpc drift');
  }
  if (APP_INSTALL_RECORD_RPC !== 'rpc_record_app_install_attribution') {
    throw new Error('app-install record rpc drift');
  }
  if (!isEwE10GrowthUiUnlocked()) {
    throw new Error('E10 growth UI unlock not complete');
  }
  if (LAUNCH_GATES.appInstallMissionLive !== true) {
    throw new Error('E10 growth must set appInstallMissionLive true');
  }
  if (LAUNCH_GATES.kakaoShareSdkLive !== true) {
    throw new Error('E10 growth must set kakaoShareSdkLive true');
  }
  if (resolveEwE9GateUiUnlockWireStatus().app_install_mission_tab !== 'live') {
    throw new Error('E10 growth must wire app_install_mission_tab live');
  }
  assertAppInstallMissionLiveSync();
}
