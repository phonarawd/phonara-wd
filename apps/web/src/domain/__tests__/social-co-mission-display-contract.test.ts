import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertSocialCoMissionWaveSync,
  isSocialCoMissionEngineReady,
  isSocialMissionsLiveUnlocked,
  SOCIAL_CO_MISSION_ADR_PATH,
  SOCIAL_CO_MISSION_ARTIFACT_PATHS,
  SOCIAL_CO_MISSION_CODES,
  SOCIAL_CO_MISSION_COMPLETE_RPC,
  SOCIAL_CO_MISSION_FORBIDDEN_CODES,
  SOCIAL_CO_MISSION_INVITE_RPC,
  SOCIAL_CO_MISSION_MIGRATION_IN_THIS_TODO,
  SOCIAL_CO_MISSION_MIGRATION_NAME,
  SOCIAL_CO_MISSION_NEXT_TODO,
  SOCIAL_CO_MISSION_PREREQUISITE_TODO,
  SOCIAL_CO_MISSION_REWARD_REASON,
  SOCIAL_CO_MISSION_TODO,
  WHALE_MISSION_CLAIM_RPC,
  WHALE_MISSION_CODES,
  WHALE_MISSION_REWARD_REASON,
} from '../social-co-mission-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('social-co-mission-display-contract (E7)', () => {
  it('pins WAVE todo ids · seed · forbidden · engine ready', () => {
    assertSocialCoMissionWaveSync();
    expect(SOCIAL_CO_MISSION_TODO).toBe('ew-e7-social-wave');
    expect(SOCIAL_CO_MISSION_PREREQUISITE_TODO).toBe('ew-e6-gate-admin-desks');
    expect(SOCIAL_CO_MISSION_NEXT_TODO).toBe('ew-e7-gate-engine-wave');
    expect(SOCIAL_CO_MISSION_MIGRATION_IN_THIS_TODO).toBe(true);
    expect([...SOCIAL_CO_MISSION_CODES]).toEqual(['co_share_referral']);
    expect([...WHALE_MISSION_CODES]).toEqual(['whale_deposit_1m']);
    expect([...SOCIAL_CO_MISSION_FORBIDDEN_CODES]).toEqual(
      expect.arrayContaining(['ad_watch_mission', 'survey_mission', 'co_bet']),
    );
    expect(isSocialCoMissionEngineReady()).toBe(true);
    // UI unlock owned by GATE (`ew-e7-gate-engine-wave`) — flipped when GATE green.
    expect(isSocialMissionsLiveUnlocked()).toBe(true);
  });

  it('requires ADR + migration + SQL test artifacts', () => {
    for (const rel of SOCIAL_CO_MISSION_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(SOCIAL_CO_MISSION_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(SOCIAL_CO_MISSION_TODO);
    expect(adr).toContain('co_share_referral');
    expect(adr).toContain('whale_deposit_1m');
    expect(adr).toContain('광고');
    expect(adr).toContain('설문');

    const migration = readRepo(
      'supabase/migrations/20260807000001_ew_e7_social_co_mission.sql',
    );
    expect(migration).toContain(SOCIAL_CO_MISSION_MIGRATION_NAME);
    expect(migration).toContain(SOCIAL_CO_MISSION_INVITE_RPC);
    expect(migration).toContain(SOCIAL_CO_MISSION_COMPLETE_RPC);
    expect(migration).toContain(WHALE_MISSION_CLAIM_RPC);
    expect(migration).toContain(SOCIAL_CO_MISSION_REWARD_REASON);
    expect(migration).toContain(WHALE_MISSION_REWARD_REASON);
    expect(migration).toContain('co_mission_sessions');
    expect(migration).toContain('whale_mission_claims');
    expect(migration).toContain('krw_deposit_credit');

    const sqlTest = readRepo('supabase/tests/ew_e7_social_co_mission_test.sql');
    expect(sqlTest).toContain('E7-0');
    expect(sqlTest).toContain('E7-1');
    expect(sqlTest).toContain('E7-2');
    expect(sqlTest).toContain('E7-3');
    expect(sqlTest).toContain('E7-4');
  });
});
