import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

import type { TradePageControllerView } from '@/features/trading/use-trade-page-controller';
import type { FuturesMarket, SpotMarket } from '@/hooks/use-trading';

export const mockSpotMarket: SpotMarket = {
  symbol: 'PHON_USDT',
  display_name: 'PHON/USDT',
  base_asset: 'PHON',
  quote_asset: 'USDT',
  fee_rate: '0.001',
  price_precision: 4,
  quantity_precision: 6,
  min_notional: '1',
  is_active: true,
  sort_order: 1,
};

export const mockFuturesMarket: FuturesMarket = {
  symbol: 'BTCUSDT-SIM',
  display_name: 'BTC/USDT Perp',
  base_label: 'BTC',
  quote_label: 'USDT',
  max_leverage: '100',
  price_precision: 2,
  quantity_precision: 4,
  is_active: true,
  sort_order: 1,
};

export function makeTradeEngine(
  overrides: Partial<TradePageControllerView> = {},
): TradePageControllerView {
  return {
    t: (key) => String(key),
    authLoading: false,
    walletLoading: false,
    phonAvail: '1000.000000',
    usdtAvail: '250.000000',
    phonBonusAvailableDisplay: '200.000000',
    phonRealAvailableDisplay: '800.000000',
    phonBreakdownLoading: false,
    prices: { PHON_USDT: '0.12', 'BTCUSDT-SIM': '68000' },
    spotMarkets: [mockSpotMarket],
    futuresMarkets: [mockFuturesMarket],
    futuresMarketsLoading: false,
    selectedSpotMarket: mockSpotMarket,
    selectedFuturesMarket: mockFuturesMarket,
    futuresPositions: [],
    positionsLoading: false,
    pricesError: false,
    positionsError: false,
    marketsError: false,
    spotMarketsError: false,
    pricesFetching: false,
    positionsFetching: false,
    oracleStale: false,
    isPriceStale: () => false,
    isPriceFrozen: () => false,
    priceDisplay: '0.1200',
    oraclePriceDisplay: '0.1200',
    oracleMarkUnavailable: false,
    refreshMarkets: vi.fn(),
    refreshFuturesPositions: vi.fn(),
    setSelectedSpotSymbol: vi.fn(),
    setSelectedFuturesSymbol: vi.fn(),
    ...overrides,
  };
}

export function queryWrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}
