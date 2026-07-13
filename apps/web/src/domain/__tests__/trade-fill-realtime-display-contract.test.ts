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

describe('trade-fill-realtime-display-contract · P1-A + PIR E2', () => {
  it('registers P1-A todo and ≤2s advisory refresh target', () => {
    expect(TRADE_FILL_REALTIME_TODO).toBe('p1-fill-realtime');
    expect(TRADE_FILL_PANEL_REFRESH_TARGET_MS).toBe(2_000);
    expect(TRADE_FILL_REALTIME_MATRIX).toHaveLength(2);
    expect(findTradeFillRealtimeRow('spot')?.fillsTable).toBe('spot_order_fills');
    expect(findTradeFillRealtimeRow('futures')?.fillsTable).toBe('trading_order_fills');
    expect(findTradeFillRealtimeRow('spot')?.realtimeSource).toBe('open_orders');
    expect(findTradeFillRealtimeRow('futures')?.realtimeSource).toBe('open_orders');
  });

  it('wires fill refresh via open_orders + post-RPC (no fills-table realtime)', () => {
    const trading = readSrc('hooks/use-trading.ts');
    const feedback = readSrc('features/trading/use-trade-realtime-feedback.ts');

    for (const surface of TRADE_FILL_INVALIDATE_SURFACES) {
      expect(() => readSrc(surface)).not.toThrow();
    }

    for (const row of TRADE_FILL_REALTIME_MATRIX) {
      // PIR E2: must NOT subscribe to high-churn fills tables
      expect(trading).not.toContain(`table: '${row.fillsTable}'`);
      expect(feedback).not.toContain(`table: '${row.fillsTable}'`);

      // open_orders remains the realtime source and invalidates fills keys
      expect(feedback).toContain(`table: '${row.openOrdersTable}'`);
      expect(feedback).toContain(`tradingKeys.${row.queryKeyField}(userId)`);
      expect(trading).toContain(`tradingKeys.${row.queryKeyField}(userId)`);
    }

    expect(trading).toContain('invalidateSpotTrading');
    expect(trading).toContain('invalidateTrading');
    expect(trading).toMatch(/invalidateSpotTrading[\s\S]*spotOrderFills/);
    expect(trading).toMatch(/invalidateTrading[\s\S]*orderFills/);
  });
});
