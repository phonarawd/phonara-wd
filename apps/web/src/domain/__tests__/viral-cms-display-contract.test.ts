import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  AFFILIATE_RANK_LEADERBOARD_RPC,
  AFFILIATE_RANK_WINDOWS,
  CMS_AUDIENCE_VALUES,
  CMS_PUBLISH_SCHEDULED_RPC,
  CMS_TARGETING_COLUMNS,
  assertViralCmsWaveSync,
  isReferralLeaderboardLiveUnlocked,
  isViralCmsEngineReady,
  VIRAL_ANALYTICS_RPC,
  VIRAL_CMS_ADR_PATH,
  VIRAL_CMS_ARTIFACT_PATHS,
  VIRAL_CMS_MIGRATION_FILE,
  VIRAL_CMS_MIGRATION_IN_THIS_TODO,
  VIRAL_CMS_MIGRATION_NAME,
  VIRAL_CMS_NEXT_TODO,
  VIRAL_CMS_PREREQUISITE_TODO,
  VIRAL_CMS_TODO,
  VIRAL_CMS_UI_UNLOCK_TODO,
} from '../viral-cms-display-contract';
import { AFFILIATE_PARTNER_ENGINE_BRANCHES } from '../affiliate-partner-display-contract';
import { shouldDeferReferralLeaderboard } from '../referral-leaderboard-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('viral-cms-display-contract (E3)', () => {
  it('pins WAVE todo ids · RPCs · engine ready · live UI still gated', () => {
    assertViralCmsWaveSync();
    expect(VIRAL_CMS_TODO).toBe('ew-e3-viral-cms-wave');
    expect(VIRAL_CMS_PREREQUISITE_TODO).toBe('ew-e2-gate-missions');
    expect(VIRAL_CMS_NEXT_TODO).toBe('ew-e3-gate-cms-promotions');
    expect(VIRAL_CMS_UI_UNLOCK_TODO).toBe('ew-e5-gap-surfaces-wire');
    expect(VIRAL_CMS_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(VIRAL_CMS_MIGRATION_NAME).toBe('ew_e3_viral_cms');
    expect(AFFILIATE_RANK_LEADERBOARD_RPC).toBe('rpc_get_affiliate_rank_leaderboard');
    expect(VIRAL_ANALYTICS_RPC).toBe('rpc_admin_get_viral_analytics');
    expect(CMS_PUBLISH_SCHEDULED_RPC).toBe('rpc_run_cms_publish_scheduled');
    expect([...CMS_AUDIENCE_VALUES]).toEqual(
      expect.arrayContaining(['all', 'authenticated', 'referrer', 'new_user']),
    );
    expect(CMS_TARGETING_COLUMNS).toHaveLength(4);
    expect(AFFILIATE_RANK_WINDOWS).toEqual(['all_time', '30d', '7d']);
    expect(isViralCmsEngineReady()).toBe(true);
    // GATE (`ew-e3-gate-cms-promotions`) unlocks launch gate — rank list wire = E5.
    expect(isReferralLeaderboardLiveUnlocked()).toBe(true);
    expect(shouldDeferReferralLeaderboard()).toBe(false);
  });

  it('marks affiliate_rank_leaderboard engine exists with RPC', () => {
    expect(AFFILIATE_PARTNER_ENGINE_BRANCHES.affiliate_rank_leaderboard).toEqual({
      engine: 'exists',
      rpc: AFFILIATE_RANK_LEADERBOARD_RPC,
      moneyPath: false,
    });
  });

  it('requires ADR + migration + SQL test artifacts', () => {
    for (const rel of VIRAL_CMS_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(VIRAL_CMS_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(VIRAL_CMS_TODO);
    expect(adr).toContain('rpc_get_affiliate_rank_leaderboard');
    expect(adr).toContain('audience');
    expect(adr).toContain('schedule_publish_at');

    const migration = readRepo(VIRAL_CMS_MIGRATION_FILE);
    expect(migration).toContain(VIRAL_CMS_MIGRATION_NAME);
    expect(migration).toContain(AFFILIATE_RANK_LEADERBOARD_RPC);
    expect(migration).toContain(VIRAL_ANALYTICS_RPC);
    expect(migration).toContain(CMS_PUBLISH_SCHEDULED_RPC);
    expect(migration).toContain('audience');
    expect(migration).toContain('min_tier');
    expect(migration).toContain('schedule_publish_at');
    expect(migration).toContain('phonara_cms_publish_scheduled');

    const sqlTest = readRepo('supabase/tests/ew_e3_viral_cms_test.sql');
    expect(sqlTest).toContain('E3-0');
    expect(sqlTest).toContain('E3-1');
    expect(sqlTest).toContain('E3-2');
    expect(sqlTest).toContain('E3-3');
    expect(sqlTest).toContain('E3-4');
  });
});
