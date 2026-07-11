import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  EW_E8_GATE_FINANCIAL_ARTIFACT_PATHS,
  EW_E8_GATE_FINANCIAL_NEXT_TODO,
  EW_E8_GATE_FINANCIAL_PREREQUISITE_TODO,
  EW_E8_GATE_FINANCIAL_REMOTE_MIGRATION_NAME,
  EW_E8_GATE_FINANCIAL_REMOTE_TAIL,
  EW_E8_GATE_FINANCIAL_SQL_TEST,
  EW_E8_GATE_FINANCIAL_TEST_PATHS,
  EW_E8_GATE_FINANCIAL_TODO,
  EW_E8_GATE_UI_UNLOCK_WIRE_STATUS,
  assertEwE8GateFinancialSync,
  isEwE8FinancialGateReady,
  isExistsGiftcardDepositPinned,
  isGiftcardRedeemReverseEnginePathReady,
  isP2pTransferEnginePathReady,
  isTradingApiKeysEnginePathReady,
} from '../ew-e8-gate-financial-display-contract';
import {
  EW_E8_CREATE_API_KEY_RPC,
  EW_E8_CREATE_GIFTCARD_REDEEM_RPC,
  EW_E8_EXISTS_GIFTCARD_DEPOSIT_RPC,
  EW_E8_FINANCIAL_NEXT_TODO,
  EW_E8_FINANCIAL_TODO,
  EW_E8_TRANSFER_TO_USER_RPC,
  isEwE8FinancialEngineReady,
} from '../ew-e8-financial-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e8-gate-financial-display-contract (E8 GATE)', () => {
  it('pins GATE todo · WAVE prerequisite · next E9 identity wave', () => {
    expect(EW_E8_GATE_FINANCIAL_TODO).toBe('ew-e8-gate-financial');
    expect(EW_E8_GATE_FINANCIAL_PREREQUISITE_TODO).toBe(EW_E8_FINANCIAL_TODO);
    expect(EW_E8_GATE_FINANCIAL_NEXT_TODO).toBe('ew-e9-identity-wave');
    expect(EW_E8_FINANCIAL_NEXT_TODO).toBe('ew-e8-gate-financial');
    expect(EW_E8_GATE_FINANCIAL_REMOTE_MIGRATION_NAME).toBe('ew_e8_financial');
    expect(EW_E8_GATE_FINANCIAL_REMOTE_TAIL).toContain('ew_e8_financial');
    expect(EW_E8_GATE_FINANCIAL_SQL_TEST).toContain('ew_e8_financial_test');
    expect(() => assertEwE8GateFinancialSync()).not.toThrow();
  });

  it('keeps hub path authorized · engine ready · EXISTS deposit pinned', () => {
    expect(isEwE8FinancialGateReady()).toBe(true);
    expect(isEwE8FinancialEngineReady()).toBe(true);
    expect(isP2pTransferEnginePathReady()).toBe(true);
    expect(isTradingApiKeysEnginePathReady()).toBe(true);
    expect(isGiftcardRedeemReverseEnginePathReady()).toBe(true);
    expect(isExistsGiftcardDepositPinned()).toBe(true);
    expect(LAUNCH_GATES.financialConnectivityEngine).toBe(true);
    expect(LAUNCH_GATES.financialConnectivityLive).toBe(true);
    expect(EW_E8_GATE_UI_UNLOCK_WIRE_STATUS.wallet_transfer_hub).toBe('live');
    expect(EW_E8_GATE_UI_UNLOCK_WIRE_STATUS.settings_api_keys_hub).toBe('live');
    expect(EW_E8_GATE_UI_UNLOCK_WIRE_STATUS.giftcard_redeem_reverse_ui).toBe(
      'live',
    );
    expect(EW_E8_TRANSFER_TO_USER_RPC).toBe('rpc_transfer_to_user');
    expect(EW_E8_CREATE_API_KEY_RPC).toBe('rpc_create_trading_api_key');
    expect(EW_E8_CREATE_GIFTCARD_REDEEM_RPC).toBe(
      'rpc_create_giftcard_redeem_request',
    );
    expect(EW_E8_EXISTS_GIFTCARD_DEPOSIT_RPC).toBe(
      'rpc_create_giftcard_deposit_request',
    );
  });

  it('requires GATE artifacts · SQL Σ=0 · remote/advisor docs', () => {
    for (const rel of EW_E8_GATE_FINANCIAL_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E8_GATE_FINANCIAL_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const sqlTest = readRepo(EW_E8_GATE_FINANCIAL_SQL_TEST);
    expect(sqlTest).toContain('E8-0');
    expect(sqlTest).toContain('E8-4');
    expect(sqlTest).toContain('Σ=0');
    expect(sqlTest).toContain('rpc_transfer_to_user');
    expect(sqlTest).toContain('rpc_create_trading_api_key');
    expect(sqlTest).toContain('rpc_create_giftcard_redeem_request');

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E8_GATE_FINANCIAL.md');
    expect(ops).toContain(EW_E8_GATE_FINANCIAL_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('rpc_transfer_to_user');
    expect(ops).toContain('ew_e8_financial_test');
    expect(ops).toContain('ew-e9-identity-wave');
    expect(ops).toContain(EW_E8_GATE_FINANCIAL_REMOTE_TAIL);
  });
});
