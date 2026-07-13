import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  parseMarginModeRpcResult,
  parseOrderCancelRpcResult,
  parseSyntheticBook,
  parseTradingCandles,
  parseTradingRpcPayload,
  realFillBookFromRpcResult,
  resolveTradingRpcMarket,
  TRADING_CLIENT_RPC_NAMES,
} from '../trading-rpc-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');

function readSrc(relativePath: string): string {
  return readFileSync(resolve(WEB_SRC, relativePath), 'utf8');
}

describe('trading-rpc-display-contract · Phase C1', () => {
  it('registers 25 unique client trade RPC names (§3.1 audit · Phase E + staking)', () => {
    expect(TRADING_CLIENT_RPC_NAMES).toHaveLength(25);
    expect(new Set(TRADING_CLIENT_RPC_NAMES).size).toBe(25);
    expect(TRADING_CLIENT_RPC_NAMES).toContain('rpc_get_candles');
    expect(TRADING_CLIENT_RPC_NAMES).toContain('rpc_set_trailing_stop');
    expect(TRADING_CLIENT_RPC_NAMES).toContain('rpc_clear_trailing_stop');
    expect(TRADING_CLIENT_RPC_NAMES).toContain('rpc_claim_staking_reward');
  });

  it('parseTradingCandles validates candle rows without cast', () => {
    expect(parseTradingCandles([])).toEqual([]);
    expect(parseTradingCandles(null)).toEqual([]);
    expect(
      parseTradingCandles([
        {
          time: 1_700_000_000,
          open: '1.0',
          high: '1.1',
          low: '0.9',
          close: '1.05',
          volume: '10.000000',
        },
        { time: 'bad', open: '1' },
      ]),
    ).toEqual([
      {
        time: 1_700_000_000,
        open: '1.0',
        high: '1.1',
        low: '0.9',
        close: '1.05',
        volume: '10.000000',
      },
    ]);
  });

  it('parseSyntheticBook validates book shape', () => {
    expect(
      parseSyntheticBook({
        symbol: 'PHON-USDT',
        mid: '100',
        disclosure: 'house_reference_liquidity',
        asks: [{ price: '101', size: '1.000000' }],
        bids: [{ price: '99', size: '2.000000' }],
      }),
    ).toEqual({
      symbol: 'PHON-USDT',
      mid: '100',
      disclosure: 'house_reference_liquidity',
      asks: [{ price: '101', size: '1.000000' }],
      bids: [{ price: '99', size: '2.000000' }],
    });
    expect(parseSyntheticBook({ symbol: 'X' })).toBeNull();
  });

  it('parseMarginModeRpcResult and parseOrderCancelRpcResult validate enums/ids', () => {
    expect(parseMarginModeRpcResult({ user_id: 'u1', margin_mode: 'cross' })).toEqual({
      user_id: 'u1',
      margin_mode: 'cross',
    });
    expect(parseMarginModeRpcResult({ user_id: 'u1', margin_mode: 'bad' })).toBeNull();
    expect(parseOrderCancelRpcResult({ order_id: 'o1', status: 'cancelled' })).toEqual({
      order_id: 'o1',
      status: 'cancelled',
    });
  });

  it('realFillBookFromRpcResult resolves market/symbol and fill fields', () => {
    const payload = parseTradingRpcPayload({
      market: 'PHON-USDT',
      entry_price: '100.5',
      quantity: '2.000000',
    });
    expect(resolveTradingRpcMarket(payload)).toBe('PHON-USDT');
    expect(realFillBookFromRpcResult('PHON-USDT', payload)).toEqual({
      symbol: 'PHON-USDT',
      mid: '100.5',
      asks: [],
      bids: [{ price: '100.5', size: '2.000000' }],
      disclosure: 'house_fill',
      bookKind: 'realFill',
    });
  });

  it('use-trading.ts routes §3.1 RPCs through callRpc + parsers (no supabase.rpc / as cast)', () => {
    const trading = readSrc('hooks/use-trading.ts');
    expect(trading).toContain("from '../lib/rpc'");
    expect(trading).toContain('callRpc(');
    expect(trading).toContain('parseTradingCandles');
    expect(trading).toContain('parseTradingRpcPayload');
    expect(trading).not.toMatch(/supabase\.rpc\s*\(\s*['"]rpc_/);
    expect(trading).not.toMatch(/as Record<string, unknown>/);
    expect(trading).not.toMatch(/as unknown as TradingCandle/);
    expect(trading).toContain('TRADING_GET_CANDLES_RPC');
    expect(trading).toContain('FUTURES_MARKET_OPEN_RPC');
    expect(trading).toContain('TRADING_RECORD_CONSENT_RPC');
    expect(trading).toContain('FUTURES_SET_TRAILING_STOP_RPC');
  });
});
