/**
 * E3 Viral+CMS wave pin (YAML #244).
 * Authority: docs/PRODUCT/ADR/012-viral-cms.md · Plan `ew-e3-viral-cms-wave`
 *
 * Same-PR WAVE: ADR + leaderboard RPC + CMS targeting/schedule + viral analytics.
 * Live leaderboard UI unlock = GATE (`ew-e3-gate-cms-promotions`) + E5 wire.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';

export const VIRAL_CMS_TODO = 'ew-e3-viral-cms-wave' as const;
export const VIRAL_CMS_PREREQUISITE_TODO = 'ew-e2-gate-missions' as const;
export const VIRAL_CMS_NEXT_TODO = 'ew-e3-gate-cms-promotions' as const;
export const VIRAL_CMS_UI_UNLOCK_TODO = 'ew-e5-gap-surfaces-wire' as const;

export const VIRAL_CMS_ADR_PATH = 'docs/PRODUCT/ADR/012-viral-cms.md' as const;
export const VIRAL_CMS_MIGRATION_NAME = 'ew_e3_viral_cms' as const;
export const VIRAL_CMS_MIGRATION_FILE =
  'supabase/migrations/20260803000001_ew_e3_viral_cms.sql' as const;

export const AFFILIATE_RANK_LEADERBOARD_RPC = 'rpc_get_affiliate_rank_leaderboard' as const;
export const VIRAL_ANALYTICS_RPC = 'rpc_admin_get_viral_analytics' as const;
export const CMS_PUBLISH_SCHEDULED_RPC = 'rpc_run_cms_publish_scheduled' as const;

export const CMS_AUDIENCE_VALUES = [
  'all',
  'authenticated',
  'referrer',
  'new_user',
] as const;

export const CMS_TARGETING_COLUMNS = [
  'audience',
  'min_tier',
  'max_tier',
  'schedule_publish_at',
] as const;

export const AFFILIATE_RANK_WINDOWS = ['all_time', '30d', '7d'] as const;

export const VIRAL_CMS_ADMIN_ROUTES = [
  '/admin/promotions',
  '/admin/cms',
  '/viral-stats',
] as const;

export const VIRAL_CMS_USER_ROUTES = [
  '/referral/leaderboard',
  '/announcements',
] as const;

export const VIRAL_CMS_ARTIFACT_PATHS = [
  VIRAL_CMS_ADR_PATH,
  VIRAL_CMS_MIGRATION_FILE,
  'supabase/tests/ew_e3_viral_cms_test.sql',
  'apps/web/src/domain/viral-cms-display-contract.ts',
  'apps/web/src/domain/__tests__/viral-cms-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E3_VIRAL_CMS.md',
] as const;

/** E3 ships migration — unlike E0 ADR-only. */
export const VIRAL_CMS_MIGRATION_IN_THIS_TODO = true as const;

/** Engine surface ready (RPCs exist). */
export function isViralCmsEngineReady(): boolean {
  return (
    LAUNCH_GATES.viralCmsEngine === true &&
    AFFILIATE_RANK_LEADERBOARD_RPC === 'rpc_get_affiliate_rank_leaderboard' &&
    VIRAL_ANALYTICS_RPC === 'rpc_admin_get_viral_analytics' &&
    CMS_PUBLISH_SCHEDULED_RPC === 'rpc_run_cms_publish_scheduled'
  );
}

/**
 * Live leaderboard UI — unlocked by GATE via launch gate.
 * WAVE keeps this false so stub defer remains until verify + unlock.
 */
export function isReferralLeaderboardLiveUnlocked(): boolean {
  return LAUNCH_GATES.referralLeaderboardLive;
}

export function assertViralCmsWaveSync(): void {
  if (VIRAL_CMS_TODO !== 'ew-e3-viral-cms-wave') {
    throw new Error('E3 todo id drift');
  }
  if (VIRAL_CMS_PREREQUISITE_TODO !== 'ew-e2-gate-missions') {
    throw new Error('E3 prerequisite must be ew-e2-gate-missions');
  }
  if (VIRAL_CMS_NEXT_TODO !== 'ew-e3-gate-cms-promotions') {
    throw new Error('E3 next must be ew-e3-gate-cms-promotions');
  }
  if (VIRAL_CMS_UI_UNLOCK_TODO !== 'ew-e5-gap-surfaces-wire') {
    throw new Error('E3 UI unlock must be ew-e5-gap-surfaces-wire');
  }
  if (VIRAL_CMS_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E3 must ship migration in this todo');
  }
  if (!CMS_AUDIENCE_VALUES.includes('all')) {
    throw new Error('E3 audience must include all');
  }
  if (CMS_TARGETING_COLUMNS.length !== 4) {
    throw new Error('E3 targeting columns must be 4');
  }
  if (!isViralCmsEngineReady()) {
    throw new Error('E3 engine surface not ready');
  }
}
