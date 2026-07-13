/**
 * E21 Trade UI unlock pin (YAML #256 · `ew-e21-ui-trade-engine-unlocks`).
 * Authority: ADR-015 §5 · Plan E21 UI · GATE `#255` DONE.
 *
 * Flips `LAUNCH_GATES.tradeParityLive` · hedge / reduce-only wire `live`.
 * Spot limit/stop + post-open TP/SL stay EXISTS honesty (migration 0).
 * Next: `ew-e22-sports-parity-wave`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  TRADE_FUTURES_UI_CAPABILITIES,
  TRADE_SPOT_UI_CAPABILITIES,
} from '../features/trading/trade-rpc-capabilities';
import { OKX_MARGIN_POSITION_UI_WIRE_STATUS } from './margin-position-mode-display-contract';
import { TRADE_ORDER_UI_WIRE_STATUS } from './trade-order-states-display-contract';
import {
  EW_E21_EXISTS_SPOT_LIMIT_RPC,
  EW_E21_EXISTS_TPSL_AMEND_RPC,
  EW_E21_GET_POSITION_MODE_RPC,
  EW_E21_SET_POSITION_MODE_RPC,
  isEwE21TradeParityEngineReady,
  isEwE21TradeParityLiveUnlocked,
} from './ew-e21-trade-parity-display-contract';
import {
  EW_E21_GATE_TRADE_ENGINE_PARITY_TODO,
  isExistsTpslAndTrailingPinned,
  isSpotLimitStopUiUnlockedViaExistingRpc,
} from './ew-e21-gate-trade-engine-parity-display-contract';

export const EW_E21_UI_TRADE_ENGINE_UNLOCKS_TODO = 'ew-e21-ui-trade-engine-unlocks' as const;
export const EW_E21_UI_TRADE_ENGINE_UNLOCKS_PREREQUISITE_TODO =
  EW_E21_GATE_TRADE_ENGINE_PARITY_TODO;
export const EW_E21_UI_TRADE_ENGINE_UNLOCKS_NEXT_TODO = 'ew-e22-sports-parity-wave' as const;

export const EW_E21_UI_TRADE_ENGINE_UNLOCKS_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e21-ui-trade-engine-unlocks-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e21-ui-trade-engine-unlocks-display-contract.test.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/web/src/features/trading/trade-rpc-capabilities.ts',
  'apps/web/src/features/trading/order-ticket/position-mode-segment.tsx',
  'apps/web/src/product/surfaces/trade/futures-order-ticket.tsx',
  'docs/OPERATIONS/ENGINE_GAP_E21_UI_TRADE_ENGINE_UNLOCKS.md',
  'docs/PRODUCT/ADR/015-trade-parity-hedge-reduce-only.md',
] as const;

export const EW_E21_UI_TRADE_ENGINE_UNLOCKS_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e21-ui-trade-engine-unlocks-display-contract.test.ts',
  'apps/web/src/product/surfaces/trade/__tests__/futures-order-ticket.test.tsx',
  'apps/web/src/features/trading/__tests__/trade-rpc-capabilities.test.ts',
] as const;

/** Full Tier-B UI unlocked after GATE remote verify. */
export function isEwE21TradeUiParityUnlocked(): boolean {
  return (
    LAUNCH_GATES.tradeHedgeReduceOnlyEngine === true &&
    LAUNCH_GATES.tradeParityLive === true &&
    isEwE21TradeParityEngineReady() &&
    isEwE21TradeParityLiveUnlocked() &&
    TRADE_ORDER_UI_WIRE_STATUS.hedge_mode_toggle === 'live' &&
    TRADE_ORDER_UI_WIRE_STATUS.reduce_only_toggle === 'live' &&
    TRADE_FUTURES_UI_CAPABILITIES.reduceOnlyOrders === true &&
    OKX_MARGIN_POSITION_UI_WIRE_STATUS.position_mode_hedge_toggle === 'live' &&
    isSpotLimitStopUiUnlockedViaExistingRpc() &&
    isExistsTpslAndTrailingPinned() &&
    TRADE_SPOT_UI_CAPABILITIES.limitOrders === true &&
    TRADE_FUTURES_UI_CAPABILITIES.positionTpSlEdit === true &&
    EW_E21_SET_POSITION_MODE_RPC === 'rpc_set_position_mode' &&
    EW_E21_GET_POSITION_MODE_RPC === 'rpc_get_position_mode' &&
    EW_E21_EXISTS_SPOT_LIMIT_RPC === 'rpc_place_spot_limit_order' &&
    EW_E21_EXISTS_TPSL_AMEND_RPC === 'rpc_update_futures_position_sltp'
  );
}

export function assertEwE21UiTradeEngineUnlocksSync(): void {
  if (EW_E21_UI_TRADE_ENGINE_UNLOCKS_TODO !== 'ew-e21-ui-trade-engine-unlocks') {
    throw new Error('E21 UI todo id drift');
  }
  if (EW_E21_UI_TRADE_ENGINE_UNLOCKS_PREREQUISITE_TODO !== 'ew-e21-gate-trade-engine-parity') {
    throw new Error('E21 UI prerequisite must be ew-e21-gate-trade-engine-parity');
  }
  if (EW_E21_UI_TRADE_ENGINE_UNLOCKS_NEXT_TODO !== 'ew-e22-sports-parity-wave') {
    throw new Error('E21 UI next must be ew-e22-sports-parity-wave');
  }
  if (!isEwE21TradeUiParityUnlocked()) {
    throw new Error('E21 UI trade parity unlock not complete');
  }
  if (LAUNCH_GATES.tradeParityLive !== true) {
    throw new Error('E21 UI must set tradeParityLive true');
  }
  if (TRADE_ORDER_UI_WIRE_STATUS.hedge_mode_toggle !== 'live') {
    throw new Error('E21 UI must wire hedge_mode_toggle live');
  }
  if (TRADE_ORDER_UI_WIRE_STATUS.reduce_only_toggle !== 'live') {
    throw new Error('E21 UI must wire reduce_only_toggle live');
  }
  if (TRADE_ORDER_UI_WIRE_STATUS.spot_limit_tab !== 'live') {
    throw new Error('E21 UI must keep spot_limit_tab live (EXISTS)');
  }
  if (TRADE_ORDER_UI_WIRE_STATUS.position_tpsl_edit !== 'live') {
    throw new Error('E21 UI must keep position_tpsl_edit live (EXISTS)');
  }
}
