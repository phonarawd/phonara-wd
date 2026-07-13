/**
 * E21 Trade parity WAVE pin (YAML #254).
 * Authority: docs/PRODUCT/ADR/015-trade-parity-hedge-reduce-only.md
 * Plan: ew-e21-trade-parity-wave
 *
 * Same-PR WAVE: ADR + hedge/reduce-only migration + SQL test.
 * EXISTS (migration 0): TP/SL amend · spot limit/stop · trailing.
 * UI unlock = ew-e21-gate / ew-e21-ui (LAUNCH_GATES.tradeParityLive).
 */

import { LAUNCH_GATES } from '../lib/launch-gates';

export const EW_E21_TRADE_PARITY_TODO = 'ew-e21-trade-parity-wave' as const;
export const EW_E21_TRADE_PARITY_PREREQUISITE_TODO = 'ew-e7-gate-engine-wave' as const;
export const EW_E21_TRADE_PARITY_NEXT_TODO = 'ew-e21-gate-trade-engine-parity' as const;

export const EW_E21_TRADE_PARITY_ADR_PATH =
  'docs/PRODUCT/ADR/015-trade-parity-hedge-reduce-only.md' as const;
export const EW_E21_TRADE_PARITY_MIGRATION_NAME = 'ew_e21_trade_parity_hedge_reduce_only' as const;

export const EW_E21_SET_POSITION_MODE_RPC = 'rpc_set_position_mode' as const;
export const EW_E21_GET_POSITION_MODE_RPC = 'rpc_get_position_mode' as const;

/** EXISTS — do not remigrate in E21. */
export const EW_E21_EXISTS_TPSL_AMEND_RPC = 'rpc_update_futures_position_sltp' as const;
export const EW_E21_EXISTS_TRAILING_SET_RPC = 'rpc_set_trailing_stop' as const;
export const EW_E21_EXISTS_TRAILING_CLEAR_RPC = 'rpc_clear_trailing_stop' as const;
export const EW_E21_EXISTS_SPOT_LIMIT_RPC = 'rpc_place_spot_limit_order' as const;
export const EW_E21_EXISTS_SPOT_STOP_RPC = 'rpc_place_spot_stop_order' as const;

export const EW_E21_NEW_ENGINE_FEATURES = ['hedge_position_mode', 'reduce_only_orders'] as const;
export const EW_E21_EXISTS_FEATURES = ['tpsl_amend', 'spot_limit_stop', 'trailing_stop'] as const;

export const EW_E21_TRADE_PARITY_ARTIFACT_PATHS = [
  EW_E21_TRADE_PARITY_ADR_PATH,
  'supabase/migrations/20260808000001_ew_e21_trade_parity_hedge_reduce_only.sql',
  'supabase/tests/ew_e21_hedge_reduce_only_test.sql',
  'apps/web/src/domain/ew-e21-trade-parity-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e21-trade-parity-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E21_TRADE_PARITY.md',
] as const;

/** E21 ships migration for hedge + reduce-only only. */
export const EW_E21_TRADE_PARITY_MIGRATION_IN_THIS_TODO = true as const;
export const EW_E21_EXISTS_RPC_REMIGRATION_FORBIDDEN = true as const;

/** Engine RPCs ready (WAVE). */
export function isEwE21TradeParityEngineReady(): boolean {
  return (
    EW_E21_SET_POSITION_MODE_RPC === 'rpc_set_position_mode' &&
    EW_E21_GET_POSITION_MODE_RPC === 'rpc_get_position_mode' &&
    LAUNCH_GATES.tradeHedgeReduceOnlyEngine === true
  );
}

/** UI unlock — owned by GATE/UI todos. */
export function isEwE21TradeParityLiveUnlocked(): boolean {
  return LAUNCH_GATES.tradeParityLive;
}

export function assertEwE21TradeParityWaveSync(): void {
  if (EW_E21_TRADE_PARITY_TODO !== 'ew-e21-trade-parity-wave') {
    throw new Error('E21 todo id drift');
  }
  if (EW_E21_TRADE_PARITY_PREREQUISITE_TODO !== 'ew-e7-gate-engine-wave') {
    throw new Error('E21 prerequisite must be ew-e7-gate-engine-wave');
  }
  if (EW_E21_TRADE_PARITY_NEXT_TODO !== 'ew-e21-gate-trade-engine-parity') {
    throw new Error('E21 next must be ew-e21-gate-trade-engine-parity');
  }
  if (EW_E21_TRADE_PARITY_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E21 must ship hedge/reduce-only migration in this todo');
  }
  if (EW_E21_EXISTS_RPC_REMIGRATION_FORBIDDEN !== true) {
    throw new Error('E21 must forbid EXISTS RPC remigration');
  }
  if (EW_E21_NEW_ENGINE_FEATURES.length !== 2) {
    throw new Error('E21 NEW features must be hedge + reduce-only only');
  }
  if (EW_E21_EXISTS_FEATURES.length !== 3) {
    throw new Error('E21 EXISTS pin must be tpsl + spot + trailing');
  }
  if (!isEwE21TradeParityEngineReady()) {
    throw new Error('E21 engine RPCs / launch gate not ready');
  }
  // UI unlock (`tradeParityLive`) is owned by `ew-e21-ui-trade-engine-unlocks` — WAVE stays engine-only.
}
