import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertTradeLayoutDedupContractSync,
  findTradeZoneOwner,
  P9_TRADE_LAYOUT_DEDUP_GATE_TODO,
  TRADE_UI_ZONE_OWNERS,
  TRADE_USER_COMPLAINT_RISKS,
} from '../trade-exchange-parity-display-contract';
import { TRADE_LAYOUT_DEDUP_SURFACE_OWNERS } from '../trade-layout-dedup-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const TRADE_SURFACES = resolve(WEB_SRC, 'product/surfaces/trade');

function readTradeSurface(filename: string): string {
  return readFileSync(resolve(TRADE_SURFACES, filename), 'utf8');
}

function countJsxTag(source: string, tag: string): number {
  const matches = source.match(new RegExp(`<${tag}(\\s|>|/)`, 'g'));
  return matches?.length ?? 0;
}

function desktopSectionBeforeCompactLayouts(source: string): string {
  const markers = ['<TradeDeskTabletLayout', '<TradeDeskMobileTabs'];
  let end = source.length;
  for (const marker of markers) {
    const index = source.indexOf(marker);
    if (index >= 0 && index < end) {
      end = index;
    }
  }
  return source.slice(0, end);
}

describe('trade-layout-dedup-contract §22.2.3 H1', () => {
  it('registers P9 layout dedup gate todo', () => {
    expect(P9_TRADE_LAYOUT_DEDUP_GATE_TODO).toBe('p9-trade-layout-dedup-gate');
    expect(TRADE_LAYOUT_DEDUP_SURFACE_OWNERS).toEqual(
      expect.arrayContaining(['futures-desk-page.tsx', 'spot-desk-page.tsx']),
    );
  });

  it('assertTradeLayoutDedupContractSync stays green', () => {
    expect(() => assertTradeLayoutDedupContractSync()).not.toThrow();
  });

  it('assigns a single owner per zone id (viewport duplicate 0 registry)', () => {
    const ids = TRADE_UI_ZONE_OWNERS.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(findTradeZoneOwner('desktop-bottom-strip')?.ownerComponent).toBe('TradeDeskBottomDock');
    expect(findTradeZoneOwner('desktop-status-banner')?.forbiddenDuplicates).toContain(
      'AppShell + page both',
    );
    expect(findTradeZoneOwner('mobile-tabs')?.forbiddenDuplicates).toContain(
      'bottom dock + tabs same data',
    );
  });

  it('requires §32.7 H1 mitigatedBy live | disabled | disabled+key | built_hidden on every risk row', () => {
    for (const row of TRADE_USER_COMPLAINT_RISKS) {
      expect(['live', 'disabled', 'disabled+key', 'built_hidden']).toContain(row.mitigatedBy);
      if (row.mitigatedBy === 'disabled+key') {
        expect(row.disabledReasonKey).toBeTruthy();
      }
    }
  });

  it('keeps lg+ futures positions mount in bottom dock only (no inline duplicate)', () => {
    const futuresDesk = readTradeSurface('futures-desk-page.tsx');
    const desktopTree = desktopSectionBeforeCompactLayouts(futuresDesk);

    expect(countJsxTag(desktopTree, 'TradeDeskBottomDock')).toBe(1);
    expect(desktopTree).not.toMatch(/<FuturesPositionsPanel[\s/>]/);
    expect(futuresDesk).toContain('useTradeDeskViewport');
    expect(futuresDesk).toMatch(/layoutTier\s*===\s*'desktop'/);
  });

  it('mounts MarketDataBridge and TradeMarketStatusBanner once per desk page', () => {
    for (const page of ['spot-desk-page.tsx', 'futures-desk-page.tsx'] as const) {
      const source = readTradeSurface(page);
      expect(countJsxTag(source, 'MarketDataBridge')).toBe(1);
      expect(countJsxTag(source, 'TradeMarketStatusBanner')).toBe(1);
    }
  });

  it('keeps lg+ spot book/chart/ticket in desktop grid only (mobile tab owns <lg copies)', () => {
    const spotDesk = readTradeSurface('spot-desk-page.tsx');
    const desktopTree = desktopSectionBeforeCompactLayouts(spotDesk);

    expect(countJsxTag(desktopTree, 'SpotOrderBookPanel')).toBe(1);
    expect(countJsxTag(spotDesk, 'TradeChartPanel')).toBe(1);
    expect(countJsxTag(desktopTree, 'SpotOrderTicket')).toBe(1);
    expect(spotDesk).toContain('useTradeDeskViewport');
    expect(spotDesk).toMatch(/layoutTier\s*===\s*'desktop'/);
  });

  it('mounts trade desk chart once via viewport conditional (A2 — no double WS)', () => {
    for (const page of ['spot-desk-page.tsx', 'futures-desk-page.tsx'] as const) {
      const source = readTradeSurface(page);
      expect(countJsxTag(source, 'TradeChartPanel')).toBe(1);
      expect(source).toContain('tradeChartPanel');
      expect(source).toContain('useTradeDeskViewport');
    }
  });

  it('switches desktop grid vs tablet vs mobile with viewport hook (not CSS-only duplicate trees)', () => {
    const futuresDesk = readTradeSurface('futures-desk-page.tsx');
    expect(futuresDesk).toMatch(/layoutTier\s*===\s*'desktop'/);
    expect(futuresDesk).toContain('TradeDeskTabletLayout');
    expect(futuresDesk).toContain('useTradeDeskViewport');
    expect(readTradeSurface('trade-desk-mobile-tabs.tsx')).toContain('md:hidden');
    expect(readTradeSurface('trade-desk-tablet-layout.tsx')).toContain('md:flex');
  });
});
