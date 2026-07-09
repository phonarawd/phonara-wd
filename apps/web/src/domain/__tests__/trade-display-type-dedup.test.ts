import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { TradingChartCandle } from '@/features/trading/display-chart/display-feed-contract';
import type { TradingCandle } from '../trading-rpc-display-contract';
import { TradeDeskKind as MarketStatusDeskKind } from '../trade-market-status-display-contract';
import type { TradeDeskKind as SubmitDeskKind } from '../trade-submit-display-contract';
import type { MarginMode as OrderStatesMarginMode } from '../trade-order-states-display-contract';
import type { MarginMode as MarginContractMode } from '../margin-position-mode-display-contract';
import type { MarginMode as TicketMarginMode } from '@/features/trading/order-ticket/order-ticket-types';

const WEB_SRC = resolve(import.meta.dirname, '../..');

function readSrc(relativePath: string): string {
  return readFileSync(resolve(WEB_SRC, relativePath), 'utf8');
}

describe('trade display type dedup · Phase C2', () => {
  it('TradingCandle aliases canonical TradingChartCandle', () => {
    const chart: TradingChartCandle = {
      time: 1,
      open: '1',
      high: '2',
      low: '0.5',
      close: '1.5',
      volume: null,
    };
    const rpc: TradingCandle = chart;
    expect(rpc).toEqual(chart);
  });

  it('TradeDeskKind is single-sourced from trade-market-status-display-contract', () => {
    const spot: MarketStatusDeskKind = 'spot';
    const futures: SubmitDeskKind = 'futures';
    expect(spot).toBe('spot');
    expect(futures).toBe('futures');
    expect(readSrc('domain/trade-submit-display-contract.ts')).not.toMatch(
      /export type TradeDeskKind =/,
    );
  });

  it('MarginMode is single-sourced from trade-order-states-display-contract', () => {
    const isolated: OrderStatesMarginMode = 'isolated';
    const cross: MarginContractMode = 'cross';
    const ticket: TicketMarginMode = 'isolated';
    expect(isolated).toBe(ticket);
    expect(cross).toBe('cross');
    expect(readSrc('domain/margin-position-mode-display-contract.ts')).not.toMatch(
      /export type MarginMode =/,
    );
    expect(readSrc('features/trading/order-ticket/order-ticket-types.ts')).not.toMatch(
      /export type MarginMode =/,
    );
  });

  it('margin-position-mode re-exports FUTURES_MARKET_OPEN_RPC instead of parallel constant', () => {
    const src = readSrc('domain/margin-position-mode-display-contract.ts');
    expect(src).toContain('FUTURES_MARKET_OPEN_RPC');
    expect(src).not.toContain('FUTURES_OPEN_POSITION_RPC');
  });

  it('documents server-only rpc_run_open_order_fills callers (UNVERIFIED-4 closed)', () => {
    const src = readSrc('domain/trade-order-states-display-contract.ts');
    expect(src).toContain('FUTURES_OPEN_ORDER_FILLS_CALLERS');
    expect(src).toContain('pg_cron:trade-open-order-fills');
    expect(src).toContain('browser client NEVER');
  });

  it('use-display-kline routes WS through field-guard parsers (Phase C1)', () => {
    const src = readSrc('features/trading/display-chart/use-display-kline.ts');
    expect(src).toContain('parseBinanceKlineWsTick');
    expect(src).toContain('parseBybitKlineWsMessage');
    expect(src).not.toMatch(/JSON\.parse\(String\(ev\.data\)\) as/);
  });

  it('Ticker24hSnapshot is canonical in display-feed-contract (worker re-exports)', () => {
    expect(readSrc('features/trading/display-chart/display-feed-contract.ts')).toContain(
      'export type Ticker24hSnapshot',
    );
    expect(readSrc('workers/market-data.worker.ts')).not.toMatch(
      /export type Ticker24hSnapshot = \{/,
    );
  });

  it('apps/web controller-view-freeze dead contract removed (admin copy survives)', () => {
    expect(() => readSrc('contracts/controller-view-freeze.ts')).toThrow();
    expect(
      readFileSync(resolve(WEB_SRC, '../../admin/src/contracts/controller-view-freeze.ts'), 'utf8'),
    ).toContain('FreezeControllerView');
  });
});
