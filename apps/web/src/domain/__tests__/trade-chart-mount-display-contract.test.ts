/**
 * T0-e PR-1B — spot chart mount verify (PHON_USDT · BTC_USDT).
 * Evidence: gate:ai-impl --test apps/web/src/domain/__tests__/trade-chart-mount-display-contract.test.ts
 */

import { describe, expect, it } from 'vitest';

import {
  PR1B_SPOT_CHART_VERIFY_SYMBOLS,
  TRADE_CHART_MOUNT_MIN_CANDLES,
  TRADE_ORACLE_STALE_SECONDS,
  resolveOraclePriceStale,
  resolvePr1bSpotChartVerifyPass,
  resolveTradeChartEmptyReason,
  resolveTradeChartFeedStrategy,
  resolveTradeChartPanelMount,
} from '../trade-chart-mount-display-contract';

describe('T0-e PR-1B · trade chart mount display contract', () => {
  it('mount gate requires at least 2 candles (trade-chart-panel path)', () => {
    expect(resolveTradeChartPanelMount({ candleCount: 0, loading: false })).toBe('empty');
    expect(resolveTradeChartPanelMount({ candleCount: 1, loading: false })).toBe('empty');
    expect(resolveTradeChartPanelMount({ candleCount: 2, loading: false })).toBe('mounted');
    expect(TRADE_CHART_MOUNT_MIN_CANDLES).toBe(2);
  });

  it('loading skeleton when feed in flight and candles < 2', () => {
    expect(resolveTradeChartPanelMount({ candleCount: 0, loading: true })).toBe('loading');
    expect(resolveTradeChartPanelMount({ candleCount: 2, loading: true })).toBe('mounted');
  });

  it('PHON uses oracle-rpc-only feed; BTC uses exchange WS with oracle fallback', () => {
    expect(resolveTradeChartFeedStrategy('PHON_USDT')).toBe('oracle-rpc-only');
    expect(resolveTradeChartFeedStrategy('PHONUSDT-PERP')).toBe('oracle-rpc-only');
    expect(resolveTradeChartFeedStrategy('BTC_USDT')).toBe('exchange-ws-with-oracle-fallback');
    expect(resolveTradeChartFeedStrategy('BTCUSDT-SIM')).toBe('exchange-ws-with-oracle-fallback');
  });

  it('ZA-12: differentiates empty-copy reason by feed strategy', () => {
    expect(resolveTradeChartEmptyReason('PHON_USDT')).toBe('oracle-awaiting-seed');
    expect(resolveTradeChartEmptyReason('PHONUSDT-PERP')).toBe('oracle-awaiting-seed');
    expect(resolveTradeChartEmptyReason('BTC_USDT')).toBe('feed-unavailable');
    expect(resolveTradeChartEmptyReason('BTCUSDT-SIM')).toBe('feed-unavailable');
    expect(resolveTradeChartEmptyReason(null)).toBe('unsupported');
  });

  it('oracle stale when age exceeds 300s (submit block threshold)', () => {
    const now = Date.UTC(2026, 6, 7, 12, 0, 0);
    const fresh = now - 299_000;
    const stale = now - 301_000;

    expect(resolveOraclePriceStale(fresh, now)).toBe(false);
    expect(resolveOraclePriceStale(stale, now)).toBe(true);
    expect(TRADE_ORACLE_STALE_SECONDS).toBe(300);
  });

  it('PR-1B verify pass when PHON + BTC each have >= 2 candles and fresh oracle', () => {
    expect(PR1B_SPOT_CHART_VERIFY_SYMBOLS).toEqual(['PHON_USDT', 'BTC_USDT']);

    expect(
      resolvePr1bSpotChartVerifyPass({
        symbolResults: {
          PHON_USDT: { candleCount: 60, oracleStale: false },
          BTC_USDT: { candleCount: 120, oracleStale: false },
        },
      }),
    ).toBe(true);

    expect(
      resolvePr1bSpotChartVerifyPass({
        symbolResults: {
          PHON_USDT: { candleCount: 1, oracleStale: false },
          BTC_USDT: { candleCount: 120, oracleStale: false },
        },
      }),
    ).toBe(false);

    expect(
      resolvePr1bSpotChartVerifyPass({
        symbolResults: {
          PHON_USDT: { candleCount: 60, oracleStale: true },
          BTC_USDT: { candleCount: 120, oracleStale: false },
        },
      }),
    ).toBe(false);
  });
});
