import { describe, expect, it } from 'vitest';

import {
  CROSS_MARGIN_DISABLED_REASON_KEY,
  getCrossMarginDisabledReasonKey,
  shouldDisableCrossMarginSelector,
} from '../margin-position-mode-display-contract';
import { supportsEntryTpSlOnOrderType } from '../trade-order-states-display-contract';
import { TRADE_FUTURES_UI_CAPABILITIES } from '@/features/trading/trade-rpc-capabilities';

describe('R6 M-11 trade capability honesty', () => {
  it('keeps entry TP/SL on open orders and cross margin disabled until canary', () => {
    expect(TRADE_FUTURES_UI_CAPABILITIES.entryTpSlOnOpenOrders).toBe(false);
    expect(supportsEntryTpSlOnOrderType('limit')).toBe(false);
    expect(supportsEntryTpSlOnOrderType('stop_market')).toBe(false);
    expect(supportsEntryTpSlOnOrderType('market')).toBe(true);

    expect(shouldDisableCrossMarginSelector(false)).toBe(true);
    expect(getCrossMarginDisabledReasonKey()).toBe(CROSS_MARGIN_DISABLED_REASON_KEY);
    expect(CROSS_MARGIN_DISABLED_REASON_KEY).toBe('trade.margin.crossDisabled');
  });
});
