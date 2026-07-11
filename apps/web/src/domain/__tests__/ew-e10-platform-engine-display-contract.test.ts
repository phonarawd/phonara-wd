import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertEwE10PlatformWaveSync,
  EW_E10_ACCEPT_CO_BET_RPC,
  EW_E10_ADMIN_REVIEW_KRW_PROOF_RPC,
  EW_E10_AD_SURVEY_MISSIONS_FORBIDDEN,
  EW_E10_ATTACH_KRW_PROOF_RPC,
  EW_E10_COMPLETE_CO_BET_RPC,
  EW_E10_DEFERRED_FEATURES,
  EW_E10_EXISTS_FEATURES,
  EW_E10_GET_CO_BET_STATUS_RPC,
  EW_E10_GET_MISSION_CHAIN_STATUS_RPC,
  EW_E10_INVITE_CO_BET_RPC,
  EW_E10_LINK_CO_BET_RPC,
  EW_E10_LIST_MISSION_CHAINS_RPC,
  EW_E10_LIVE_UI_SAME_PR_FORBIDDEN,
  EW_E10_NEW_ENGINE_FEATURES,
  EW_E10_PLATFORM_ADR_PATH,
  EW_E10_PLATFORM_ARTIFACT_PATHS,
  EW_E10_PLATFORM_MIGRATION_IN_THIS_TODO,
  EW_E10_PLATFORM_MIGRATION_NAME,
  EW_E10_PLATFORM_NEXT_TODO,
  EW_E10_PLATFORM_PREREQUISITE_TODO,
  EW_E10_PLATFORM_TODO,
  EW_E10_PROOF_REVIEW_CREDITS_FORBIDDEN,
  EW_E10_RECOMMEND_MISSIONS_RPC,
  isEwE10PlatformEngineReady,
  isEwE10PlatformUiUnlocked,
} from '../ew-e10-platform-engine-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('ew-e10-platform-engine-display-contract (E10 WAVE)', () => {
  it('pins WAVE todo ids · NEW vs EXISTS · engine ready · UI gated', () => {
    assertEwE10PlatformWaveSync();
    expect(EW_E10_PLATFORM_TODO).toBe('ew-e10-platform-engine-wave');
    expect(EW_E10_PLATFORM_PREREQUISITE_TODO).toBe(
      'ew-e9-gate-identity-support',
    );
    expect(EW_E10_PLATFORM_NEXT_TODO).toBe(
      'ew-e10-page-admin-krw-proof-review',
    );
    expect(EW_E10_PLATFORM_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(EW_E10_LIVE_UI_SAME_PR_FORBIDDEN).toBe(true);
    expect(EW_E10_AD_SURVEY_MISSIONS_FORBIDDEN).toBe(true);
    expect(EW_E10_PROOF_REVIEW_CREDITS_FORBIDDEN).toBe(true);
    expect([...EW_E10_NEW_ENGINE_FEATURES]).toEqual([
      'krw_deposit_proof',
      'mission_chains',
      'co_bet',
      'ml_mission_recommend',
    ]);
    expect([...EW_E10_EXISTS_FEATURES]).toEqual([
      'krw_deposit_create_match_rails',
      'co_mission_sessions',
      'whale_deposit_1m',
      'mission_catalog',
    ]);
    expect([...EW_E10_DEFERRED_FEATURES]).toEqual([
      'krw_proof_upload_ui_live',
      'mission_chain_hub_ui_live',
      'co_bet_sports_ui_live',
      'ml_recommend_carousel_ui_live',
      'kakao_share_sdk',
      'system_status_page',
    ]);
    expect(isEwE10PlatformEngineReady()).toBe(true);
    expect(isEwE10PlatformUiUnlocked()).toBe(false);
  });

  it('requires ADR + migration + SQL · pins RPCs · forbids ad/survey · no proof credit', () => {
    for (const rel of EW_E10_PLATFORM_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(EW_E10_PLATFORM_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(EW_E10_PLATFORM_TODO);
    expect(adr).toContain(EW_E10_ATTACH_KRW_PROOF_RPC);
    expect(adr).toContain(EW_E10_ADMIN_REVIEW_KRW_PROOF_RPC);
    expect(adr).toContain(EW_E10_LIST_MISSION_CHAINS_RPC);
    expect(adr).toContain(EW_E10_INVITE_CO_BET_RPC);
    expect(adr).toContain(EW_E10_RECOMMEND_MISSIONS_RPC);
    expect(adr).toContain('원장 이동 0');
    expect(adr).toMatch(/광고|ad_watch|survey/);

    const migration = readRepo(
      'supabase/migrations/20260813000001_ew_e10_platform_engine.sql',
    );
    expect(migration).toContain(EW_E10_PLATFORM_MIGRATION_NAME);
    expect(migration).toContain(EW_E10_ATTACH_KRW_PROOF_RPC);
    expect(migration).toContain(EW_E10_ADMIN_REVIEW_KRW_PROOF_RPC);
    expect(migration).toContain(EW_E10_LIST_MISSION_CHAINS_RPC);
    expect(migration).toContain(EW_E10_GET_MISSION_CHAIN_STATUS_RPC);
    expect(migration).toContain(EW_E10_INVITE_CO_BET_RPC);
    expect(migration).toContain(EW_E10_ACCEPT_CO_BET_RPC);
    expect(migration).toContain(EW_E10_LINK_CO_BET_RPC);
    expect(migration).toContain(EW_E10_COMPLETE_CO_BET_RPC);
    expect(migration).toContain(EW_E10_GET_CO_BET_STATUS_RPC);
    expect(migration).toContain(EW_E10_RECOMMEND_MISSIONS_RPC);
    expect(migration).toContain('co_bet_reward');
    expect(migration).toContain('krw-deposit-proofs');
    expect(migration).toContain('onboarding_viral');
    expect(migration).toContain('ledger_credit_created');
    expect(migration).not.toMatch(/ad_watch|survey_mission/);

    const sqlTest = readRepo('supabase/tests/ew_e10_platform_engine_test.sql');
    expect(sqlTest).toContain('E10-0');
    expect(sqlTest).toContain('E10-1');
    expect(sqlTest).toContain('E10-2');
    expect(sqlTest).toContain('E10-3');
    expect(sqlTest).toContain('E10-4');
    expect(sqlTest).toContain('E10-5');
    expect(sqlTest).toContain('ROLLBACK');
  });
});
