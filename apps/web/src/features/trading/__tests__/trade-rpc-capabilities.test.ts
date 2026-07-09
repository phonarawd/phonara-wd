import { describe, it, expect } from 'vitest';
import { TRADE_FUTURES_UI_CAPABILITIES } from '../trade-rpc-capabilities';

describe('TRADE_FUTURES_UI_CAPABILITIES', () => {
  it('exposes partial close when rpc_partial_close_futures exists', () => {
    expect(TRADE_FUTURES_UI_CAPABILITIES.partialClose).toBe(true);
  });

  it('exposes isolated margin adjust when rpc_adjust_isolated_margin exists', () => {
    expect(TRADE_FUTURES_UI_CAPABILITIES.isolatedMarginAdjust).toBe(true);
  });

  it('hides reduce-only and post-open position TP-SL without RPC', () => {
    expect(TRADE_FUTURES_UI_CAPABILITIES.reduceOnlyOrders).toBe(false);
    expect(TRADE_FUTURES_UI_CAPABILITIES.positionTpSlEdit).toBe(true);
  });
});
