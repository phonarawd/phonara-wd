import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  findTradeFillRealtimeRow,
  TRADE_FILL_INVALIDATE_SURFACES,
  TRADE_FILL_PANEL_REFRESH_TARGET_MS,
  TRADE_FILL_REALTIME_MATRIX,
  TRADE_FILL_REALTIME_TODO,
} from '../trade-fill-realtime-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');

function readSrc(relativePath: string): string {
  return readFileSync(resolve(WEB_SRC, relativePath), 'utf8');
}

describe('trade-fill-realtime-display-contract · P1-A', () => {
  it('registers P1-A todo and ≤2s advisory refresh target', () => {
    expect(TRADE_FILL_REALTIME_TODO).toBe('p1-fill-realtime');
    expect(TRADE_FILL_PANEL_REFRESH_TARGET_MS).toBe(2_000);
    expect(TRADE_FILL_REALTIME_MATRIX).toHaveLength(2);
    expect(findTradeFillRealtimeRow('spot')?.fillsTable).toBe('spot_order_fills');
    expect(findTradeFillRealtimeRow('futures')?.fillsTable).toBe('trading_order_fills');
  });

  it('wires spot/futures fill realtime + post-RPC invalidation in use-trading.ts', () => {
    const trading = readSrc('hooks/use-trading.ts');
    const feedback = readSrc('features/trading/use-trade-realtime-feedback.ts');

    for (const surface of TRADE_FILL_INVALIDATE_SURFACES) {
      expect(() => readSrc(surface)).not.toThrow();
    }

    for (const row of TRADE_FILL_REALTIME_MATRIX) {
      expect(trading).toContain(`table: '${row.fillsTable}'`);
      expect(trading).toContain(`tradingKeys.${row.queryKeyField}(userId)`);
      expect(feedback).toContain(`table: '${row.fillsTable}'`);
      expect(feedback).toContain(`tradingKeys.${row.queryKeyField}(userId)`);
      expect(feedback).toContain(`table: '${row.openOrdersTable}'`);
    }

    expect(trading).toContain('invalidateSpotTrading');
    expect(trading).toContain('invalidateTrading');
    expect(trading).toMatch(/invalidateSpotTrading[\s\S]*spotOrderFills/);
    expect(trading).toMatch(/invalidateTrading[\s\S]*orderFills/);
  });
});
