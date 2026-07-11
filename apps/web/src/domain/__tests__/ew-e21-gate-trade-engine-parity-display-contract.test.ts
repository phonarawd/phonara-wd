import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  TRADE_FUTURES_UI_CAPABILITIES,
  TRADE_SPOT_UI_CAPABILITIES,
} from '../../features/trading/trade-rpc-capabilities';
import { TRADE_ORDER_UI_WIRE_STATUS } from '../trade-order-states-display-contract';
import {
  EW_E21_GATE_TRADE_ENGINE_PARITY_ARTIFACT_PATHS,
  EW_E21_GATE_TRADE_ENGINE_PARITY_NEXT_TODO,
  EW_E21_GATE_TRADE_ENGINE_PARITY_PREREQUISITE_TODO,
  EW_E21_GATE_TRADE_ENGINE_PARITY_REMOTE_MIGRATION_NAME,
  EW_E21_GATE_TRADE_ENGINE_PARITY_SQL_TEST,
  EW_E21_GATE_TRADE_ENGINE_PARITY_TEST_PATHS,
  EW_E21_GATE_TRADE_ENGINE_PARITY_TODO,
  assertEwE21GateTradeEngineParitySync,
  isEwE21TradeEngineParityGateReady,
  isExistsTpslAndTrailingPinned,
  isSpotLimitStopUiUnlockedViaExistingRpc,
} from '../ew-e21-gate-trade-engine-parity-display-contract';
import {
  EW_E21_EXISTS_SPOT_LIMIT_RPC,
  EW_E21_EXISTS_TPSL_AMEND_RPC,
  EW_E21_TRADE_PARITY_NEXT_TODO,
  EW_E21_TRADE_PARITY_TODO,
  isEwE21TradeParityEngineReady,
} from '../ew-e21-trade-parity-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e21-gate-trade-engine-parity-display-contract (E21 GATE)', () => {
  it('pins GATE todo · WAVE prerequisite · next UI unlock', () => {
    expect(EW_E21_GATE_TRADE_ENGINE_PARITY_TODO).toBe('ew-e21-gate-trade-engine-parity');
    expect(EW_E21_GATE_TRADE_ENGINE_PARITY_PREREQUISITE_TODO).toBe(EW_E21_TRADE_PARITY_TODO);
    expect(EW_E21_GATE_TRADE_ENGINE_PARITY_NEXT_TODO).toBe('ew-e21-ui-trade-engine-unlocks');
    expect(EW_E21_TRADE_PARITY_NEXT_TODO).toBe('ew-e21-gate-trade-engine-parity');
    expect(EW_E21_GATE_TRADE_ENGINE_PARITY_REMOTE_MIGRATION_NAME).toBe(
      'ew_e21_trade_parity_hedge_reduce_only',
    );
    expect(EW_E21_GATE_TRADE_ENGINE_PARITY_SQL_TEST).toContain('ew_e21_hedge_reduce_only_test');
    expect(() => assertEwE21GateTradeEngineParitySync()).not.toThrow();
  });

  it('pins engine ready · spot/TP/SL EXISTS unlock · GATE still ready after UI live', () => {
    expect(isEwE21TradeEngineParityGateReady()).toBe(true);
    expect(isEwE21TradeParityEngineReady()).toBe(true);
    expect(isSpotLimitStopUiUnlockedViaExistingRpc()).toBe(true);
    expect(isExistsTpslAndTrailingPinned()).toBe(true);
    expect(LAUNCH_GATES.tradeHedgeReduceOnlyEngine).toBe(true);
    expect(TRADE_SPOT_UI_CAPABILITIES.limitOrders).toBe(true);
    expect(TRADE_SPOT_UI_CAPABILITIES.stopOrders).toBe(true);
    expect(TRADE_ORDER_UI_WIRE_STATUS.spot_limit_tab).toBe('live');
    expect(TRADE_FUTURES_UI_CAPABILITIES.positionTpSlEdit).toBe(true);
    expect(TRADE_ORDER_UI_WIRE_STATUS.position_tpsl_edit).toBe('live');
    expect(EW_E21_EXISTS_SPOT_LIMIT_RPC).toBe('rpc_place_spot_limit_order');
    expect(EW_E21_EXISTS_TPSL_AMEND_RPC).toBe('rpc_update_futures_position_sltp');
  });

  it('requires GATE artifacts · SQL test · remote/advisor evidence docs', () => {
    for (const rel of EW_E21_GATE_TRADE_ENGINE_PARITY_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E21_GATE_TRADE_ENGINE_PARITY_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const sqlTest = readRepo(EW_E21_GATE_TRADE_ENGINE_PARITY_SQL_TEST);
    expect(sqlTest).toContain('E21-0');
    expect(sqlTest).toContain('E21-4');
    expect(sqlTest).toContain('Σ=0');

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E21_GATE_TRADE_ENGINE_PARITY.md');
    expect(ops).toContain(EW_E21_GATE_TRADE_ENGINE_PARITY_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('spot');
    expect(ops).toContain('rpc_place_spot_limit_order');
    expect(ops).toContain('ew_e21_hedge_reduce_only_test');
    expect(ops).toContain('ew-e21-ui-trade-engine-unlocks');
  });
});
