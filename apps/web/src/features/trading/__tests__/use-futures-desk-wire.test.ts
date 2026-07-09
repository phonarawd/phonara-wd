import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  makeTradeEngine,
  mockFuturesMarket,
  queryWrapper,
} from '@/features/trading/__tests__/trade-desk-hook-fixtures';
import { useFuturesDeskWire } from '@/features/trading/use-futures-desk-wire';

const usePlatformGatesMock = vi.hoisted(() => vi.fn());
const useOpenOrdersMock = vi.hoisted(() => vi.fn());
const useTradingOrderFillsMock = vi.hoisted(() => vi.fn());
const useFundingPaymentsMock = vi.hoisted(() => vi.fn());
const useFuturesActionsMock = vi.hoisted(() => vi.fn());
const useTradingRiskAckMock = vi.hoisted(() => vi.fn());
const useHouseCounterpartyAckMock = vi.hoisted(() => vi.fn());
const useMarginAccountMock = vi.hoisted(() => vi.fn());
const useReferenceBookMock = vi.hoisted(() => vi.fn());
const useFundingRateMock = vi.hoisted(() => vi.fn());
const useTradeLaunchFlagsMock = vi.hoisted(() => vi.fn());
const openPositionMock = vi.hoisted(() => vi.fn());
const useOracleRealtimeMock = vi.hoisted(() => vi.fn(() => false));

vi.mock('@/hooks/use-platform-gates', () => ({
  usePlatformGates: () => usePlatformGatesMock(),
}));

vi.mock('@/hooks/use-trading', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-trading')>();
  return {
    ...actual,
    useOpenOrders: () => useOpenOrdersMock(),
    useTradingOrderFills: () => useTradingOrderFillsMock(),
    useFundingPayments: () => useFundingPaymentsMock(),
    useFuturesActions: () => useFuturesActionsMock(),
    useTradingRiskAcknowledgement: () => useTradingRiskAckMock(),
    useMarginAccount: () => useMarginAccountMock(),
    useReferenceBook: () => useReferenceBookMock(),
    useFundingRate: () => useFundingRateMock(),
  };
});

vi.mock('@/features/trading/use-house-counterparty-acknowledgement', () => ({
  useHouseCounterpartyAcknowledgement: () => useHouseCounterpartyAckMock(),
}));

vi.mock('@/hooks/use-trade-launch-flags', () => ({
  useTradeLaunchFlags: () => useTradeLaunchFlagsMock(),
}));

vi.mock('@/features/trading/use-trade-earn-vip-tier', () => ({
  useTradeEarnVipTier: () => ({ data: 'bronze' }),
}));

vi.mock('@/features/trading/use-trade-oracle-realtime-disconnected', () => ({
  useTradeOracleRealtimeDisconnected: () => useOracleRealtimeMock(),
}));

vi.mock('@/features/trading/market-store/use-order-book', () => ({
  useOrderBook: () => ({ feedStale: false, asks: [], bids: [] }),
}));

vi.mock('@/features/trading/display-chart/use-exchange-display-price', () => ({
  useExchangeDisplayPrice: () => ({ exchangePriceDisplay: null }),
}));

vi.mock('@/product/i18n', () => ({
  useI18n: () => ({ locale: 'ko' }),
}));

vi.mock('@/domain/trade-settings-prefs-display-contract', () => ({
  resolveTradeOrderConfirmRequired: () => false,
}));

vi.mock('@/features/trading/trade-feedback-display', () => ({
  showTradeFeedback: vi.fn(),
  showTradeRpcErrorFeedback: vi.fn(),
  tradeFeedbackDedupId: (event: string, id: string) => `${event}:${id}`,
}));

vi.mock('@/features/trading/trade-realtime-feedback-display', () => ({
  registerUserInitiatedPositionClose: vi.fn(),
}));

function seedFuturesDeskMocks(overrides?: { futuresBlocked?: boolean }) {
  usePlatformGatesMock.mockReturnValue({
    spotBlocked: false,
    futuresBlocked: overrides?.futuresBlocked ?? false,
    stakingBlocked: false,
    loading: false,
  });
  useOpenOrdersMock.mockReturnValue({ orders: [], loading: false, refresh: vi.fn() });
  useTradingOrderFillsMock.mockReturnValue({ fills: [], loading: false, refresh: vi.fn() });
  useFundingPaymentsMock.mockReturnValue({ payments: [], loading: false, refresh: vi.fn() });
  openPositionMock.mockResolvedValue({ id: 'pos-1' });
  useFuturesActionsMock.mockReturnValue({
    openPosition: openPositionMock,
    placeLimitOrder: vi.fn(),
    placeStopOrder: vi.fn(),
    cancelOrder: vi.fn(),
    closePosition: vi.fn(),
    partialClosePosition: vi.fn(),
    adjustIsolatedMargin: vi.fn(),
    updateFuturesPositionSltp: vi.fn(),
    busy: false,
    error: null,
  });
  useTradingRiskAckMock.mockReturnValue({
    acknowledged: true,
    acknowledge: vi.fn(),
    error: null,
  });
  useHouseCounterpartyAckMock.mockReturnValue({
    acknowledged: true,
    acknowledge: vi.fn(),
    busy: false,
    error: null,
    loading: false,
  });
  useMarginAccountMock.mockReturnValue({
    marginMode: 'isolated',
    setMarginMode: vi.fn(),
    busy: false,
    error: null,
  });
  useReferenceBookMock.mockReturnValue({ referenceBook: null });
  useFundingRateMock.mockReturnValue({ rate: '0.0001' });
  useTradeLaunchFlagsMock.mockReturnValue({ crossMarginEnabled: false });
}

describe('useFuturesDeskWire · renderHook · P1-E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOracleRealtimeMock.mockReturnValue(false);
    seedFuturesDeskMocks();
  });

  it('blocks submit when futures kill-switch is active', () => {
    seedFuturesDeskMocks({ futuresBlocked: true });
    const engine = makeTradeEngine({ selectedFuturesMarket: mockFuturesMarket });

    const { result } = renderHook(() => useFuturesDeskWire(engine), { wrapper: queryWrapper });

    expect(result.current.tradeBlocked).toBe(true);
    expect(result.current.submitBlockedReason).toBe('trade.gate.futuresBlocked');
  });

  it('blocks submit when oracle price is stale', () => {
    const engine = makeTradeEngine({
      selectedFuturesMarket: mockFuturesMarket,
      isPriceStale: () => true,
    });

    const { result } = renderHook(() => useFuturesDeskWire(engine), { wrapper: queryWrapper });

    expect(result.current.tradeBlocked).toBe(true);
    expect(result.current.submitBlockedReason).toBe('trade.dataStatus.staleDescription');
  });

  it('blocks submit when realtime oracle channel is disconnected', () => {
    useOracleRealtimeMock.mockReturnValue(true);
    const engine = makeTradeEngine({ selectedFuturesMarket: mockFuturesMarket });

    const { result } = renderHook(() => useFuturesDeskWire(engine), { wrapper: queryWrapper });

    expect(result.current.tradeBlocked).toBe(true);
    expect(result.current.submitBlockedReason).toBe(
      'trade.dataStatus.realtimeDisconnectedDescription',
    );
  });

  it('does not call openPosition when submit is blocked', async () => {
    seedFuturesDeskMocks({ futuresBlocked: true });
    const engine = makeTradeEngine({ selectedFuturesMarket: mockFuturesMarket });

    const { result } = renderHook(() => useFuturesDeskWire(engine), { wrapper: queryWrapper });

    await act(async () => {
      await result.current.requestSubmitOpen();
    });

    expect(openPositionMock).not.toHaveBeenCalled();
  });
});
