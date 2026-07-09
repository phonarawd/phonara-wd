import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTradePageController } from '@/features/trading/use-trade-page-controller';
import {
  mockFuturesMarket,
  mockSpotMarket,
} from '@/features/trading/__tests__/trade-desk-hook-fixtures';

const useAuthMock = vi.hoisted(() => vi.fn());
const useWalletMock = vi.hoisted(() => vi.fn());
const usePricesMock = vi.hoisted(() => vi.fn());
const useFuturesMarketsMock = vi.hoisted(() => vi.fn());
const useSpotMarketsMock = vi.hoisted(() => vi.fn());
const useFuturesPositionsMock = vi.hoisted(() => vi.fn());
const usePhonBalanceBreakdownMock = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => useWalletMock(),
}));

vi.mock('@/hooks/use-trading', () => ({
  usePrices: () => usePricesMock(),
  useFuturesMarkets: () => useFuturesMarketsMock(),
  useSpotMarkets: () => useSpotMarketsMock(),
  useFuturesPositions: () => useFuturesPositionsMock(),
}));

vi.mock('@/features/wallet/use-phon-balance-breakdown', () => ({
  usePhonBalanceBreakdown: () => usePhonBalanceBreakdownMock(),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

function seedTradePageMocks(overrides?: {
  pricesError?: boolean;
  walletLoading?: boolean;
  wallet?: { phon_available: string; usdt_available: string } | null;
}) {
  useAuthMock.mockReturnValue({ loading: false });
  useWalletMock.mockReturnValue({
    wallet:
      overrides && 'wallet' in overrides
        ? overrides.wallet
        : {
            phon_available: '1000.000000',
            usdt_available: '250.000000',
          },
    loading: overrides?.walletLoading ?? false,
  });
  usePricesMock.mockReturnValue({
    prices: { PHON_USDT: '0.12', 'BTCUSDT-SIM': '68000' },
    isPriceStale: () => false,
    isError: overrides?.pricesError ?? false,
    isFetching: false,
    oracleStale: false,
    refetch: vi.fn(),
  });
  useFuturesMarketsMock.mockReturnValue({
    markets: [mockFuturesMarket],
    loading: false,
    isError: false,
    refetch: vi.fn(),
  });
  useSpotMarketsMock.mockReturnValue({
    markets: [mockSpotMarket],
    isError: false,
    refetch: vi.fn(),
  });
  useFuturesPositionsMock.mockReturnValue({
    positions: [],
    loading: false,
    refresh: vi.fn(),
    isError: false,
    isFetching: false,
  });
  usePhonBalanceBreakdownMock.mockReturnValue({
    breakdown: null,
    loading: false,
  });
}

describe('useTradePageController · renderHook · P1-E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedTradePageMocks();
  });

  it('surfaces pricesError from usePrices', () => {
    seedTradePageMocks({ pricesError: true });

    const { result } = renderHook(() => useTradePageController());

    expect(result.current.pricesError).toBe(true);
  });

  it('exposes wallet balances and walletLoading from useWallet', () => {
    seedTradePageMocks({
      walletLoading: true,
      wallet: { phon_available: '42.000000', usdt_available: '99.000000' },
    });

    const { result } = renderHook(() => useTradePageController());

    expect(result.current.walletLoading).toBe(true);
    expect(result.current.phonAvail).toBe('42.000000');
    expect(result.current.usdtAvail).toBe('99.000000');
  });

  it('defaults wallet balances to zero when wallet is null', () => {
    seedTradePageMocks({ wallet: null });

    const { result } = renderHook(() => useTradePageController());

    expect(result.current.phonAvail).toBe('0');
    expect(result.current.usdtAvail).toBe('0');
  });

  it('selects canonical spot and futures markets', () => {
    const { result } = renderHook(() => useTradePageController());

    expect(result.current.selectedSpotMarket?.symbol).toBe('PHON_USDT');
    expect(result.current.selectedFuturesMarket?.symbol).toBe('BTCUSDT-SIM');
  });
});
