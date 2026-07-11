import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertEwE21TradeParityWaveSync,
  EW_E21_EXISTS_FEATURES,
  EW_E21_EXISTS_RPC_REMIGRATION_FORBIDDEN,
  EW_E21_EXISTS_SPOT_LIMIT_RPC,
  EW_E21_EXISTS_TPSL_AMEND_RPC,
  EW_E21_EXISTS_TRAILING_SET_RPC,
  EW_E21_GET_POSITION_MODE_RPC,
  EW_E21_NEW_ENGINE_FEATURES,
  EW_E21_SET_POSITION_MODE_RPC,
  EW_E21_TRADE_PARITY_ADR_PATH,
  EW_E21_TRADE_PARITY_ARTIFACT_PATHS,
  EW_E21_TRADE_PARITY_MIGRATION_IN_THIS_TODO,
  EW_E21_TRADE_PARITY_MIGRATION_NAME,
  EW_E21_TRADE_PARITY_NEXT_TODO,
  EW_E21_TRADE_PARITY_PREREQUISITE_TODO,
  EW_E21_TRADE_PARITY_TODO,
  isEwE21TradeParityEngineReady,
  isEwE21TradeParityLiveUnlocked,
} from '../ew-e21-trade-parity-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('ew-e21-trade-parity-display-contract (E21 WAVE)', () => {
  it('pins WAVE todo ids · NEW vs EXISTS · engine ready', () => {
    assertEwE21TradeParityWaveSync();
    expect(EW_E21_TRADE_PARITY_TODO).toBe('ew-e21-trade-parity-wave');
    expect(EW_E21_TRADE_PARITY_PREREQUISITE_TODO).toBe('ew-e7-gate-engine-wave');
    expect(EW_E21_TRADE_PARITY_NEXT_TODO).toBe('ew-e21-gate-trade-engine-parity');
    expect(EW_E21_TRADE_PARITY_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(EW_E21_EXISTS_RPC_REMIGRATION_FORBIDDEN).toBe(true);
    expect([...EW_E21_NEW_ENGINE_FEATURES]).toEqual([
      'hedge_position_mode',
      'reduce_only_orders',
    ]);
    expect([...EW_E21_EXISTS_FEATURES]).toEqual([
      'tpsl_amend',
      'spot_limit_stop',
      'trailing_stop',
    ]);
    expect(isEwE21TradeParityEngineReady()).toBe(true);
    expect(typeof isEwE21TradeParityLiveUnlocked()).toBe('boolean');
  });

  it('requires ADR + migration + SQL test · forbids EXISTS remigration', () => {
    for (const rel of EW_E21_TRADE_PARITY_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(EW_E21_TRADE_PARITY_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(EW_E21_TRADE_PARITY_TODO);
    expect(adr).toContain('rpc_set_position_mode');
    expect(adr).toContain('reduce_only');
    expect(adr).toContain(EW_E21_EXISTS_TPSL_AMEND_RPC);
    expect(adr).toContain(EW_E21_EXISTS_SPOT_LIMIT_RPC);
    expect(adr).toContain(EW_E21_EXISTS_TRAILING_SET_RPC);
    expect(adr).toContain('migration **0**');

    const migration = readRepo(
      'supabase/migrations/20260808000001_ew_e21_trade_parity_hedge_reduce_only.sql',
    );
    expect(migration).toContain(EW_E21_TRADE_PARITY_MIGRATION_NAME);
    expect(migration).toContain(EW_E21_SET_POSITION_MODE_RPC);
    expect(migration).toContain(EW_E21_GET_POSITION_MODE_RPC);
    expect(migration).toContain('reduce_only');
    expect(migration).toContain('position_mode');
    expect(migration).toContain('_assert_futures_open_allowed');
    expect(migration).not.toContain('CREATE OR REPLACE FUNCTION rpc_update_futures_position_sltp');
    expect(migration).not.toContain('CREATE OR REPLACE FUNCTION rpc_place_spot_limit_order');
    expect(migration).not.toContain('CREATE OR REPLACE FUNCTION rpc_set_trailing_stop');

    const sqlTest = readRepo('supabase/tests/ew_e21_hedge_reduce_only_test.sql');
    expect(sqlTest).toContain('E21-0');
    expect(sqlTest).toContain('E21-1');
    expect(sqlTest).toContain('E21-2');
    expect(sqlTest).toContain('E21-3');
    expect(sqlTest).toContain('E21-4');
    expect(sqlTest).toContain('position_mode_hedge_side_exists');
    expect(sqlTest).toContain('reduce_only_no_position');
  });
});
