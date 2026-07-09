import { describe, expect, it } from 'vitest';

import {
  SPOT_DESK_BOOK_TICKER_FEED_SOURCE,
  toTradingChartCandle,
  toTradingChartCandles,
  parseBinanceKlineWsTick,
  parseBybitKlineWsMessage,
  type TradingChartCandle,
} from '../display-feed-contract';

describe('display-feed-contract · Phase C2 candle adapters', () => {
  it('unifies spot desk book/ticker feed source with chart klines', () => {
    expect(SPOT_DESK_BOOK_TICKER_FEED_SOURCE).toBe('binance-spot');
  });

  it('toTradingChartCandle normalizes numeric exchange rows to string OHLCV', () => {
    expect(
      toTradingChartCandle({
        time: 1_700_000_000,
        open: 1.1,
        high: 1.2,
        low: 1.0,
        close: 1.15,
        volume: 42.5,
      }),
    ).toEqual({
      time: 1_700_000_000,
      open: '1.1',
      high: '1.2',
      low: '1',
      close: '1.15',
      volume: '42.5',
    } satisfies TradingChartCandle);
  });

  it('toTradingChartCandles maps arrays and preserves null volume', () => {
    expect(
      toTradingChartCandles([
        {
          time: 1,
          open: '1',
          high: '2',
          low: '0.5',
          close: '1.5',
          volume: null,
        },
      ]),
    ).toEqual([
      {
        time: 1,
        open: '1',
        high: '2',
        low: '0.5',
        close: '1.5',
        volume: null,
      },
    ]);
  });

  it('parseBinanceKlineWsTick rejects malformed JSON and missing fields', () => {
    expect(parseBinanceKlineWsTick('not-json')).toBeNull();
    expect(parseBinanceKlineWsTick('{}')).toBeNull();
    expect(
      parseBinanceKlineWsTick(
        JSON.stringify({
          k: { t: 1_700_000_000_000, o: '1', h: '2', l: '0.5', c: '1.5', v: '10' },
        }),
      ),
    ).toEqual({
      time: 1_700_000_000,
      open: 1,
      high: 2,
      low: 0.5,
      close: 1.5,
      volume: 10,
    });
  });

  it('parseBybitKlineWsMessage handles pong and kline ticks', () => {
    expect(parseBybitKlineWsMessage(JSON.stringify({ op: 'pong' }))).toEqual({ kind: 'pong' });
    expect(
      parseBybitKlineWsMessage(
        JSON.stringify({
          topic: 'kline.1.BTCUSDT',
          data: [
            {
              start: 1_700_000_000_000,
              open: '1',
              high: '2',
              low: '0.5',
              close: '1.5',
              volume: '3',
            },
          ],
        }),
      ),
    ).toEqual({
      kind: 'tick',
      candle: {
        time: 1_700_000_000,
        open: 1,
        high: 2,
        low: 0.5,
        close: 1.5,
        volume: 3,
      },
    });
    expect(parseBybitKlineWsMessage('[]')).toBeNull();
  });
});
