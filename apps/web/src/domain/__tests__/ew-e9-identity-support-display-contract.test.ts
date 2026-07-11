import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertEwE9IdentityWaveSync,
  EW_E9_ADMIN_LIST_SUPPORT_TICKETS_RPC,
  EW_E9_ADMIN_RESOLVE_SUPPORT_TICKET_RPC,
  EW_E9_AD_SURVEY_MISSIONS_FORBIDDEN,
  EW_E9_CREATE_SIWE_CHALLENGE_RPC,
  EW_E9_CREATE_SUPPORT_TICKET_RPC,
  EW_E9_DEFERRED_FEATURES,
  EW_E9_EXISTS_FEATURES,
  EW_E9_IDENTITY_ADR_PATH,
  EW_E9_IDENTITY_ARTIFACT_PATHS,
  EW_E9_IDENTITY_MIGRATION_IN_THIS_TODO,
  EW_E9_IDENTITY_MIGRATION_NAME,
  EW_E9_IDENTITY_NEXT_TODO,
  EW_E9_IDENTITY_PREREQUISITE_TODO,
  EW_E9_IDENTITY_TODO,
  EW_E9_LIVE_UI_SAME_PR_FORBIDDEN,
  EW_E9_NEW_ENGINE_FEATURES,
  EW_E9_RECORD_ANALYTICS_RPC,
  EW_E9_RECORD_APP_INSTALL_RPC,
  EW_E9_SERVICE_COMPLETE_SIWE_RPC,
  EW_E9_SIWE_EDGE_FUNCTION,
  EW_E9_TIER_LEADERBOARD_RPC,
  isEwE9IdentityEngineReady,
  isEwE9IdentityUiUnlocked,
} from '../ew-e9-identity-support-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('ew-e9-identity-support-display-contract (E9 WAVE)', () => {
  it('pins WAVE todo ids · NEW vs EXISTS · engine ready · UI gated', () => {
    assertEwE9IdentityWaveSync();
    expect(EW_E9_IDENTITY_TODO).toBe('ew-e9-identity-wave');
    expect(EW_E9_IDENTITY_PREREQUISITE_TODO).toBe('ew-e8-gate-financial');
    expect(EW_E9_IDENTITY_NEXT_TODO).toBe('ew-e9-gate-identity-support');
    expect(EW_E9_IDENTITY_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(EW_E9_LIVE_UI_SAME_PR_FORBIDDEN).toBe(true);
    expect(EW_E9_AD_SURVEY_MISSIONS_FORBIDDEN).toBe(true);
    expect([...EW_E9_NEW_ENGINE_FEATURES]).toEqual([
      'siwe_wallet_login',
      'support_tickets',
      'product_analytics_events',
      'app_install_mission',
      'tier_leaderboard',
    ]);
    expect([...EW_E9_EXISTS_FEATURES]).toEqual([
      'viral_share_missions',
      'affiliate_rank_leaderboard',
      'passkey_login',
    ]);
    expect([...EW_E9_DEFERRED_FEATURES]).toEqual([
      'siwe_login_ui_live',
      'support_ticket_ui_live',
      'tier_leaderboard_ui_live',
      'app_install_mission_ui_live',
    ]);
    expect(isEwE9IdentityEngineReady()).toBe(true);
    expect(isEwE9IdentityUiUnlocked()).toBe(true);
  });

  it('requires ADR + migrations + SQL + edge · pins RPCs · forbids ad/survey', () => {
    for (const rel of EW_E9_IDENTITY_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(EW_E9_IDENTITY_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(EW_E9_IDENTITY_TODO);
    expect(adr).toContain(EW_E9_CREATE_SIWE_CHALLENGE_RPC);
    expect(adr).toContain(EW_E9_CREATE_SUPPORT_TICKET_RPC);
    expect(adr).toContain(EW_E9_RECORD_ANALYTICS_RPC);
    expect(adr).toContain(EW_E9_RECORD_APP_INSTALL_RPC);
    expect(adr).toContain(EW_E9_TIER_LEADERBOARD_RPC);
    expect(adr).toContain(EW_E9_ADMIN_LIST_SUPPORT_TICKETS_RPC);
    expect(adr).toContain('광고');
    expect(adr).toContain('설문');

    const enumSql = readRepo('supabase/migrations/20260812000001_ew_e9_app_install_enum.sql');
    expect(enumSql).toContain('app_install');
    expect(enumSql).toContain('viral_mission_code');

    const sql = readRepo('supabase/migrations/20260812000002_ew_e9_identity_support.sql');
    expect(sql).toContain(EW_E9_IDENTITY_MIGRATION_NAME);
    expect(sql).toContain(EW_E9_CREATE_SIWE_CHALLENGE_RPC);
    expect(sql).toContain(EW_E9_SERVICE_COMPLETE_SIWE_RPC);
    expect(sql).toContain(EW_E9_CREATE_SUPPORT_TICKET_RPC);
    expect(sql).toContain(EW_E9_ADMIN_RESOLVE_SUPPORT_TICKET_RPC);
    expect(sql).toContain(EW_E9_RECORD_ANALYTICS_RPC);
    expect(sql).toContain(EW_E9_RECORD_APP_INSTALL_RPC);
    expect(sql).toContain(EW_E9_TIER_LEADERBOARD_RPC);
    expect(sql).toContain('siwe_challenges');
    expect(sql).toContain('support_tickets');
    expect(sql).toContain('product_analytics_events');
    expect(sql).toContain('app_install_attributions');
    expect(sql).toContain('viral:app_install');
    expect(sql).not.toMatch(/ad_watch|survey_mission/i);

    const edge = readRepo('supabase/functions/siwe-auth/index.ts');
    expect(edge).toContain(EW_E9_SIWE_EDGE_FUNCTION);
    expect(edge).toContain(EW_E9_SERVICE_COMPLETE_SIWE_RPC);

    const sqlTest = readRepo('supabase/tests/ew_e9_identity_support_test.sql');
    expect(sqlTest).toContain('E9-0');
    expect(sqlTest).toContain('E9-1');
    expect(sqlTest).toContain('E9-2');
    expect(sqlTest).toContain('E9-3');
    expect(sqlTest).toContain('E9-4');
    expect(sqlTest).toContain('E9-5');
    expect(sqlTest).toContain(EW_E9_CREATE_SIWE_CHALLENGE_RPC);
  });
});
