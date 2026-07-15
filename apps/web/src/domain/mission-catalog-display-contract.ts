/**
 * E2 Mission Catalog wave pin (YAML #242).
 * Authority: docs/PRODUCT/ADR/011-mission-catalog.md · Plan `ew-e2-missions-wave`
 *
 * Same-PR WAVE: ADR + mission_catalog CRUD RPCs + admin write path (hook).
 * Write UI unlock = `ew-e2-gate-missions` (LAUNCH_GATES.missionCatalogWrite).
 */

import { LAUNCH_GATES } from '../lib/launch-gates';

export const MISSION_CATALOG_TODO = 'ew-e2-missions-wave' as const;
export const MISSION_CATALOG_PREREQUISITE_TODO = 'ew-e1-gate-decay' as const;
export const MISSION_CATALOG_NEXT_TODO = 'ew-e2-gate-missions' as const;

export const MISSION_CATALOG_ADR_PATH = 'docs/PRODUCT/ADR/011-mission-catalog.md' as const;
export const MISSION_CATALOG_MIGRATION_NAME = 'ew_e2_mission_catalog' as const;
export const MISSION_CATALOG_LIST_RPC = 'rpc_admin_list_mission_catalog' as const;
export const MISSION_CATALOG_UPSERT_RPC = 'rpc_admin_upsert_mission_catalog' as const;
export const MISSION_CATALOG_AUDIT_ACTION = 'mission_catalog_upsert' as const;

/** Permanent exclusions — must never appear in catalog allowlist. */
export const MISSION_CATALOG_FORBIDDEN_CODES = [
  'ad_watch_mission',
  'survey_mission',
  'ad_watch',
  'survey',
] as const;

export const MISSION_CATALOG_VIRAL_KEYS = [
  'viral:share_referral_link',
  'viral:share_story_template',
  'viral:invite_friend_signup',
  'viral:affiliate_content_post',
  'viral:viral_streak_share',
] as const;

export const MISSION_CATALOG_EARN_LIMIT_KEYS = [
  'earn:referral_qualified_reward_phon',
  'earn:referral_pending_reward_phon',
  'earn:referral_velocity_max_24h',
  'earn:earn_phon_to_usdt_rate',
  'earn:earn_season_global_xp',
  'earn:launch_slots_total',
] as const;

export const MISSION_CATALOG_SEED_COUNT =
  MISSION_CATALOG_VIRAL_KEYS.length + MISSION_CATALOG_EARN_LIMIT_KEYS.length;

export const MISSION_CATALOG_ADMIN_ROUTE = '/earn/missions' as const;

export const MISSION_CATALOG_ARTIFACT_PATHS = [
  MISSION_CATALOG_ADR_PATH,
  'supabase/migrations/20260802000001_ew_e2_mission_catalog.sql',
  'supabase/tests/ew_e2_mission_catalog_test.sql',
  'apps/web/src/domain/mission-catalog-display-contract.ts',
  'apps/web/src/domain/__tests__/mission-catalog-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E2_MISSIONS.md',
] as const;

export const MISSION_CATALOG_TEST_PATHS = [
  'apps/web/src/domain/__tests__/mission-catalog-display-contract.test.ts',
] as const;

/** E2 ships migration — unlike E0 ADR-only. */
export const MISSION_CATALOG_MIGRATION_IN_THIS_TODO = true as const;

/** Write path = RPC + admin hook. */
export function isMissionCatalogWritePathReady(): boolean {
  return (
    MISSION_CATALOG_LIST_RPC === 'rpc_admin_list_mission_catalog' &&
    MISSION_CATALOG_UPSERT_RPC === 'rpc_admin_upsert_mission_catalog'
  );
}

/** UI write controls — unlocked by `ew-e2-gate-missions` via launch gate. */
export function isAdminMissionsWriteUnlocked(): boolean {
  return LAUNCH_GATES.missionCatalogWrite === true;
}

export function assertMissionCatalogWaveSync(): void {
  if (MISSION_CATALOG_TODO !== 'ew-e2-missions-wave') {
    throw new Error('E2 todo id drift');
  }
  if (MISSION_CATALOG_PREREQUISITE_TODO !== 'ew-e1-gate-decay') {
    throw new Error('E2 prerequisite must be ew-e1-gate-decay');
  }
  if (MISSION_CATALOG_NEXT_TODO !== 'ew-e2-gate-missions') {
    throw new Error('E2 next must be ew-e2-gate-missions');
  }
  if (MISSION_CATALOG_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E2 must ship migration in this todo');
  }
  if (MISSION_CATALOG_SEED_COUNT !== 11) {
    throw new Error('E2 seed must be 5 viral + 6 earn_limit');
  }
  if (!MISSION_CATALOG_FORBIDDEN_CODES.includes('ad_watch_mission')) {
    throw new Error('E2 must forbid ad_watch_mission');
  }
  if (!MISSION_CATALOG_FORBIDDEN_CODES.includes('survey_mission')) {
    throw new Error('E2 must forbid survey_mission');
  }
  if (!isMissionCatalogWritePathReady()) {
    throw new Error('E2 write path RPCs not ready');
  }
  if (MISSION_CATALOG_ADMIN_ROUTE !== '/earn/missions') {
    throw new Error('E2 admin route must be /earn/missions');
  }
}
