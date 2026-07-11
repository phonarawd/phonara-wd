import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertEwE8FinancialWaveSync,
  EW_E8_ADMIN_FULFILL_GIFTCARD_REDEEM_RPC,
  EW_E8_CREATE_API_KEY_RPC,
  EW_E8_CREATE_GIFTCARD_REDEEM_RPC,
  EW_E8_DEFERRED_FEATURES,
  EW_E8_EXISTS_FEATURES,
  EW_E8_EXISTS_GIFTCARD_DEPOSIT_RPC,
  EW_E8_FINANCIAL_ADR_PATH,
  EW_E8_FINANCIAL_ARTIFACT_PATHS,
  EW_E8_FINANCIAL_MIGRATION_IN_THIS_TODO,
  EW_E8_FINANCIAL_MIGRATION_NAME,
  EW_E8_FINANCIAL_NEXT_TODO,
  EW_E8_FINANCIAL_PREREQUISITE_TODO,
  EW_E8_FINANCIAL_TODO,
  EW_E8_GIFTCARD_DEPOSIT_SEMANTICS_PRESERVED,
  EW_E8_LIVE_UI_SAME_PR_FORBIDDEN,
  EW_E8_NEW_ENGINE_FEATURES,
  EW_E8_P2P_LEGAL_REREVIEW_REQUIRED,
  EW_E8_TRANSFER_TO_USER_RPC,
  isEwE8FinancialEngineReady,
  isEwE8FinancialUiUnlocked,
} from '../ew-e8-financial-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('ew-e8-financial-display-contract (E8 WAVE)', () => {
  it('pins WAVE todo ids · NEW vs EXISTS · engine ready · UI gated', () => {
    assertEwE8FinancialWaveSync();
    expect(EW_E8_FINANCIAL_TODO).toBe('ew-e8-financial-wave');
    expect(EW_E8_FINANCIAL_PREREQUISITE_TODO).toBe(
      'ew-e23-ui-casino-live-unlocks',
    );
    expect(EW_E8_FINANCIAL_NEXT_TODO).toBe('ew-e8-gate-financial');
    expect(EW_E8_FINANCIAL_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(EW_E8_GIFTCARD_DEPOSIT_SEMANTICS_PRESERVED).toBe(true);
    expect(EW_E8_LIVE_UI_SAME_PR_FORBIDDEN).toBe(true);
    expect(EW_E8_P2P_LEGAL_REREVIEW_REQUIRED).toBe(true);
    expect([...EW_E8_NEW_ENGINE_FEATURES]).toEqual([
      'p2p_transfer',
      'trading_api_keys',
      'giftcard_redeem_reverse',
    ]);
    expect([...EW_E8_EXISTS_FEATURES]).toEqual([
      'giftcard_deposit',
      'withdraw_rails',
    ]);
    expect([...EW_E8_DEFERRED_FEATURES]).toEqual([
      'wallet_transfer_ui_live',
      'settings_api_keys_hub_live',
      'p2p_usdt',
    ]);
    expect(isEwE8FinancialEngineReady()).toBe(true);
    expect(isEwE8FinancialUiUnlocked()).toBe(true);
  });

  it('requires ADR + migration + SQL test · preserves deposit · gates live UI', () => {
    for (const rel of EW_E8_FINANCIAL_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(EW_E8_FINANCIAL_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(EW_E8_FINANCIAL_TODO);
    expect(adr).toContain(EW_E8_TRANSFER_TO_USER_RPC);
    expect(adr).toContain(EW_E8_CREATE_API_KEY_RPC);
    expect(adr).toContain(EW_E8_CREATE_GIFTCARD_REDEEM_RPC);
    expect(adr).toContain(EW_E8_EXISTS_GIFTCARD_DEPOSIT_RPC);
    expect(adr).toContain('LEGAL_BASIS');
    expect(adr).toContain('Σ=0');

    const sql = readRepo(
      'supabase/migrations/20260811000001_ew_e8_financial.sql',
    );
    expect(sql).toContain(EW_E8_FINANCIAL_MIGRATION_NAME);
    expect(sql).toContain('rpc_transfer_to_user');
    expect(sql).toContain('rpc_create_trading_api_key');
    expect(sql).toContain('rpc_create_giftcard_redeem_request');
    expect(sql).toContain(EW_E8_ADMIN_FULFILL_GIFTCARD_REDEEM_RPC);
    expect(sql).toContain('p2p_transfers');
    expect(sql).toContain('trading_api_keys');
    expect(sql).toContain('giftcard_redeem_requests');
    expect(sql).toContain('REVOKE ALL ON TABLE p2p_transfers');
    expect(sql).not.toMatch(
      /CREATE OR REPLACE FUNCTION rpc_create_giftcard_deposit_request/i,
    );

    const sqlTest = readRepo('supabase/tests/ew_e8_financial_test.sql');
    expect(sqlTest).toContain('E8-0');
    expect(sqlTest).toContain('E8-1');
    expect(sqlTest).toContain('E8-2');
    expect(sqlTest).toContain('E8-3');
    expect(sqlTest).toContain('E8-4');
    expect(sqlTest).toContain(EW_E8_TRANSFER_TO_USER_RPC);
  });
});
