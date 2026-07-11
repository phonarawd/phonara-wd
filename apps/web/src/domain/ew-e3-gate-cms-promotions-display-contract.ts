/**
 * E3 Viral+CMS GATE pin (YAML #245).
 * Authority: Plan `ew-e3-gate-cms-promotions` · ADR-012 · engine verify + UI unlock.
 *
 * GATE does not re-ship Viral+CMS RPC — asserts wave green · remote apply ·
 * advisor 0 · launch gate unlock for leaderboard · admin CMS/promotions · announcements.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  AFFILIATE_RANK_LEADERBOARD_RPC,
  CMS_PUBLISH_SCHEDULED_RPC,
  VIRAL_ANALYTICS_RPC,
  VIRAL_CMS_ARTIFACT_PATHS,
  VIRAL_CMS_MIGRATION_NAME,
  VIRAL_CMS_NEXT_TODO,
  VIRAL_CMS_TODO,
  assertViralCmsWaveSync,
  isReferralLeaderboardLiveUnlocked,
  isViralCmsEngineReady,
} from './viral-cms-display-contract';
import { ANNOUNCEMENTS_LIST_RPC, ANNOUNCEMENTS_ROUTE } from './announcements-display-contract';
import { CMS_ADMIN_LIST_RPC, CMS_ADMIN_UPSERT_RPC } from './cms-banners-display-contract';
import { REFERRAL_LEADERBOARD_ROUTE } from './referral-leaderboard-display-contract';

export const EW_E3_GATE_CMS_PROMOTIONS_TODO = 'ew-e3-gate-cms-promotions' as const;
export const EW_E3_GATE_CMS_PROMOTIONS_PREREQUISITE_TODO = VIRAL_CMS_TODO;
export const EW_E3_GATE_CMS_PROMOTIONS_NEXT_TODO = 'ew-e4-tier-option-b-wave' as const;

export const EW_E3_GATE_CMS_PROMOTIONS_UNLOCK_ROUTES = [
  REFERRAL_LEADERBOARD_ROUTE,
  '/admin/promotions',
  '/admin/cms',
  ANNOUNCEMENTS_ROUTE,
] as const;

export const EW_E3_GATE_CMS_PROMOTIONS_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e3-gate-cms-promotions-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e3-gate-cms-promotions-display-contract.test.ts',
  'apps/web/src/domain/viral-cms-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/admin/src/domain/admin-cms-promotions-display-contract.ts',
  'docs/PRODUCT/ADR/012-viral-cms.md',
  'docs/OPERATIONS/ENGINE_GAP_E3_VIRAL_CMS.md',
  'docs/OPERATIONS/ENGINE_GAP_E3_GATE_CMS_PROMOTIONS.md',
  'supabase/migrations/20260803000001_ew_e3_viral_cms.sql',
  'supabase/tests/ew_e3_viral_cms_test.sql',
] as const;

export const EW_E3_GATE_CMS_PROMOTIONS_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e3-gate-cms-promotions-display-contract.test.ts',
  'apps/web/src/domain/__tests__/viral-cms-display-contract.test.ts',
  'apps/web/src/domain/__tests__/referral-leaderboard-display-contract.test.ts',
  'apps/web/src/domain/__tests__/announcements-display-contract.test.ts',
  'apps/admin/src/domain/__tests__/admin-cms-promotions-display-contract.test.ts',
] as const;

/** Remote migration name parity (Management API timestamp may differ). */
export const EW_E3_GATE_CMS_PROMOTIONS_REMOTE_MIGRATION_NAME = VIRAL_CMS_MIGRATION_NAME;

export function isAdminCmsPromotionsFullyUnlocked(): boolean {
  return (
    LAUNCH_GATES.viralCmsEngine === true &&
    LAUNCH_GATES.adminCmsPromotions === true &&
    CMS_ADMIN_LIST_RPC === 'rpc_admin_list_cms_content' &&
    CMS_ADMIN_UPSERT_RPC === 'rpc_admin_upsert_cms_content' &&
    CMS_PUBLISH_SCHEDULED_RPC === 'rpc_run_cms_publish_scheduled'
  );
}

export function isAnnouncementsFullyUnlocked(): boolean {
  return (
    LAUNCH_GATES.announcementsFull === true &&
    ANNOUNCEMENTS_LIST_RPC === 'rpc_list_cms_content' &&
    ANNOUNCEMENTS_ROUTE === '/announcements'
  );
}

export function isViralCmsSurfacesFullyUnlocked(): boolean {
  return (
    isViralCmsEngineReady() &&
    isReferralLeaderboardLiveUnlocked() &&
    isAdminCmsPromotionsFullyUnlocked() &&
    isAnnouncementsFullyUnlocked()
  );
}

export function assertEwE3GateCmsPromotionsSync(): void {
  assertViralCmsWaveSync();

  if (EW_E3_GATE_CMS_PROMOTIONS_TODO !== 'ew-e3-gate-cms-promotions') {
    throw new Error('E3 GATE todo id drift');
  }
  if (EW_E3_GATE_CMS_PROMOTIONS_PREREQUISITE_TODO !== 'ew-e3-viral-cms-wave') {
    throw new Error('E3 GATE prerequisite must be ew-e3-viral-cms-wave');
  }
  if (EW_E3_GATE_CMS_PROMOTIONS_NEXT_TODO !== 'ew-e4-tier-option-b-wave') {
    throw new Error('E3 GATE next must be ew-e4-tier-option-b-wave');
  }
  if (VIRAL_CMS_NEXT_TODO !== 'ew-e3-gate-cms-promotions') {
    throw new Error('E3 WAVE next must unlock ew-e3-gate-cms-promotions');
  }
  if (AFFILIATE_RANK_LEADERBOARD_RPC !== 'rpc_get_affiliate_rank_leaderboard') {
    throw new Error('E3 GATE leaderboard RPC drift');
  }
  if (VIRAL_ANALYTICS_RPC !== 'rpc_admin_get_viral_analytics') {
    throw new Error('E3 GATE viral analytics RPC drift');
  }
  if (!isViralCmsSurfacesFullyUnlocked()) {
    throw new Error(
      'E3 GATE unlock not live — leaderboard · admin CMS/promotions · announcements',
    );
  }
  if (EW_E3_GATE_CMS_PROMOTIONS_UNLOCK_ROUTES.length !== 4) {
    throw new Error('E3 GATE must unlock 4 routes');
  }
  if (VIRAL_CMS_ARTIFACT_PATHS.length < 5) {
    throw new Error('E3 WAVE artifacts missing');
  }
}
