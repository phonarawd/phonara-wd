/**
 * E21 Trade engine parity GATE pin (YAML #255).
 * Authority: Plan `ew-e21-gate-trade-engine-parity` · ADR-015 · remote verify.
 *
 * GATE does not remigrate EXISTS RPCs — asserts WAVE green · remote apply ·
 * advisor 0 · spot limit/stop UI unlock honesty (existing RPC).
 * Full Tier-B UI (`tradeParityLive`) = `ew-e21-ui-trade-engine-unlocks`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  TRADE_SPOT_UI_CAPABILITIES,
  TRADE_FUTURES_UI_CAPABILITIES,
} from '../features/trading/trade-rpc-capabilities';
import { TRADE_ORDER_UI_WIRE_STATUS } from './trade-order-states-display-contract';
import {
  EW_E21_EXISTS_FEATURES,
  EW_E21_EXISTS_SPOT_LIMIT_RPC,
  EW_E21_EXISTS_SPOT_STOP_RPC,
  EW_E21_EXISTS_TPSL_AMEND_RPC,
  EW_E21_EXISTS_TRAILING_CLEAR_RPC,
  EW_E21_EXISTS_TRAILING_SET_RPC,
  EW_E21_GET_POSITION_MODE_RPC,
  EW_E21_NEW_ENGINE_FEATURES,
  EW_E21_SET_POSITION_MODE_RPC,
  EW_E21_TRADE_PARITY_ARTIFACT_PATHS,
  EW_E21_TRADE_PARITY_MIGRATION_NAME,
  EW_E21_TRADE_PARITY_NEXT_TODO,
  EW_E21_TRADE_PARITY_TODO,
  assertEwE21TradeParityWaveSync,
  isEwE21TradeParityEngineReady,
} from './ew-e21-trade-parity-display-contract';

export const EW_E21_GATE_TRADE_ENGINE_PARITY_TODO = 'ew-e21-gate-trade-engine-parity' as const;
export const EW_E21_GATE_TRADE_ENGINE_PARITY_PREREQUISITE_TODO = EW_E21_TRADE_PARITY_TODO;
export const EW_E21_GATE_TRADE_ENGINE_PARITY_NEXT_TODO = 'ew-e21-ui-trade-engine-unlocks' as const;

export const EW_E21_GATE_TRADE_ENGINE_PARITY_REMOTE_MIGRATION_NAME =
  EW_E21_TRADE_PARITY_MIGRATION_NAME;

export const EW_E21_GATE_TRADE_ENGINE_PARITY_SQL_TEST =
  'supabase/tests/ew_e21_hedge_reduce_only_test.sql' as const;

export const EW_E21_GATE_TRADE_ENGINE_PARITY_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e21-gate-trade-engine-parity-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e21-gate-trade-engine-parity-display-contract.test.ts',
  'apps/web/src/domain/ew-e21-trade-parity-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/web/src/features/trading/trade-rpc-capabilities.ts',
  'docs/PRODUCT/ADR/015-trade-parity-hedge-reduce-only.md',
  'docs/OPERATIONS/ENGINE_GAP_E21_TRADE_PARITY.md',
  'docs/OPERATIONS/ENGINE_GAP_E21_GATE_TRADE_ENGINE_PARITY.md',
  'supabase/migrations/20260808000001_ew_e21_trade_parity_hedge_reduce_only.sql',
  EW_E21_GATE_TRADE_ENGINE_PARITY_SQL_TEST,
] as const;

export const EW_E21_GATE_TRADE_ENGINE_PARITY_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e21-gate-trade-engine-parity-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e21-trade-parity-display-contract.test.ts',
] as const;

/** Spot limit/stop already live via T1 EXISTS RPCs — GATE honesty pin (migration 0). */
export function isSpotLimitStopUiUnlockedViaExistingRpc(): boolean {
  return (
    TRADE_SPOT_UI_CAPABILITIES.limitOrders === true &&
    TRADE_SPOT_UI_CAPABILITIES.stopOrders === true &&
    TRADE_ORDER_UI_WIRE_STATUS.spot_limit_tab === 'live' &&
    EW_E21_EXISTS_SPOT_LIMIT_RPC === 'rpc_place_spot_limit_order' &&
    EW_E21_EXISTS_SPOT_STOP_RPC === 'rpc_place_spot_stop_order'
  );
}

/** Post-open TP/SL + trailing EXISTS — UI capability live; remigration forbidden. */
export function isExistsTpslAndTrailingPinned(): boolean {
  return (
    TRADE_FUTURES_UI_CAPABILITIES.positionTpSlEdit === true &&
    TRADE_FUTURES_UI_CAPABILITIES.trailingStop === true &&
    TRADE_ORDER_UI_WIRE_STATUS.position_tpsl_edit === 'live' &&
    EW_E21_EXISTS_TPSL_AMEND_RPC === 'rpc_update_futures_position_sltp' &&
    EW_E21_EXISTS_TRAILING_SET_RPC === 'rpc_set_trailing_stop' &&
    EW_E21_EXISTS_TRAILING_CLEAR_RPC === 'rpc_clear_trailing_stop'
  );
}

/**
 * GATE complete when engine remote-ready + EXISTS honesty pins hold.
 * Full Tier-B UI (`tradeParityLive`) is owned by `ew-e21-ui-trade-engine-unlocks`
 * and may be true after GATE closeout — does not invalidate GATE readiness.
 */
export function isEwE21TradeEngineParityGateReady(): boolean {
  return (
    LAUNCH_GATES.tradeHedgeReduceOnlyEngine === true &&
    isEwE21TradeParityEngineReady() &&
    isSpotLimitStopUiUnlockedViaExistingRpc() &&
    isExistsTpslAndTrailingPinned() &&
    EW_E21_SET_POSITION_MODE_RPC === 'rpc_set_position_mode' &&
    EW_E21_GET_POSITION_MODE_RPC === 'rpc_get_position_mode'
  );
}

export function assertEwE21GateTradeEngineParitySync(): void {
  assertEwE21TradeParityWaveSync();

  if (EW_E21_GATE_TRADE_ENGINE_PARITY_TODO !== 'ew-e21-gate-trade-engine-parity') {
    throw new Error('E21 GATE todo id drift');
  }
  if (EW_E21_GATE_TRADE_ENGINE_PARITY_PREREQUISITE_TODO !== 'ew-e21-trade-parity-wave') {
    throw new Error('E21 GATE prerequisite must be ew-e21-trade-parity-wave');
  }
  if (EW_E21_GATE_TRADE_ENGINE_PARITY_NEXT_TODO !== 'ew-e21-ui-trade-engine-unlocks') {
    throw new Error('E21 GATE next must be ew-e21-ui-trade-engine-unlocks');
  }
  if (EW_E21_TRADE_PARITY_NEXT_TODO !== 'ew-e21-gate-trade-engine-parity') {
    throw new Error('E21 WAVE next must unlock ew-e21-gate-trade-engine-parity');
  }
  if (
    EW_E21_GATE_TRADE_ENGINE_PARITY_REMOTE_MIGRATION_NAME !==
    'ew_e21_trade_parity_hedge_reduce_only'
  ) {
    throw new Error('E21 GATE remote migration name drift');
  }
  if (EW_E21_NEW_ENGINE_FEATURES.length !== 2) {
    throw new Error('E21 GATE must pin NEW = hedge + reduce-only only');
  }
  if (EW_E21_EXISTS_FEATURES.length !== 3) {
    throw new Error('E21 GATE must pin EXISTS = tpsl + spot + trailing');
  }
  if (!isSpotLimitStopUiUnlockedViaExistingRpc()) {
    throw new Error('E21 GATE spot limit/stop UI unlock evidence missing');
  }
  if (!isExistsTpslAndTrailingPinned()) {
    throw new Error('E21 GATE EXISTS TP/SL · trailing pin missing');
  }
  if (!isEwE21TradeEngineParityGateReady()) {
    throw new Error('E21 GATE trade engine parity not ready');
  }
  // Hedge / reduce-only wire status owned by UI todo after GATE closeout.
  if (EW_E21_TRADE_PARITY_ARTIFACT_PATHS.length < 5) {
    throw new Error('E21 WAVE artifacts missing');
  }
}
