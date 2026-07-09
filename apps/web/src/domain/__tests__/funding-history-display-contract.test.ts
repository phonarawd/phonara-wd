import { describe, expect, it } from 'vitest';

import {
  FUNDING_HEADER_OWNER,
  FUNDING_HISTORY_MOUNT,
  FUNDING_HISTORY_PANEL_OWNER,
  FUNDING_PAYMENTS_SELECT,
  FUNDING_PAYMENTS_TABLE,
  FUNDING_RATE_HEADER_SELECT,
  FUNDING_RATES_TABLE,
  P9_TRADE_FUNDING_HISTORY_DISPLAY_TODO,
} from '../funding-history-display-contract';

describe('funding-history-display-contract §25.12.9.1-E #17', () => {
  it('registers P9 todo id and table sources', () => {
    expect(P9_TRADE_FUNDING_HISTORY_DISPLAY_TODO).toBe('p9-trade-funding-history-display');
    expect(FUNDING_RATES_TABLE).toBe('funding_rates');
    expect(FUNDING_PAYMENTS_TABLE).toBe('funding_payments');
  });

  it('limits header read to current rate only', () => {
    expect(FUNDING_RATE_HEADER_SELECT).toBe('rate');
    expect(FUNDING_RATE_HEADER_SELECT).not.toContain('next_funding_at');
  });

  it('defines single mount owner for funding payment history', () => {
    expect(FUNDING_HEADER_OWNER).toBe('futures-market-header.tsx');
    expect(FUNDING_HISTORY_PANEL_OWNER).toBe('trade-funding-history-panel.tsx');
    expect(FUNDING_HISTORY_MOUNT).toContain('TradeDeskBottomDock');
    expect(FUNDING_PAYMENTS_SELECT).toContain('amount');
    expect(FUNDING_PAYMENTS_SELECT).toContain('currency');
  });
});
