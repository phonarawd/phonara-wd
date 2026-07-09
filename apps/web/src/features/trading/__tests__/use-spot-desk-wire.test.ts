import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  makeTradeEngine,
  mockSpotMarket,
  queryWrapper,
} from '@/features/trading/__tests__/trade-desk-hook-fixtures';
import { useSpotDeskWire } from '@/features/trading/use-spot-desk-wire';

const usePlatformGatesMock = vi.hoisted(() => vi.fn());
const useSpotOpenOrdersMock = vi.hoisted(() => vi.fn());
const useSpotOrderFillsMock = vi.hoisted(() => vi.fn());
const useSpotActionsMock = vi.hoisted(() => vi.fn());
const useCancelSpotOrderMock = vi.hoisted(() => vi.fn());
const useSpotHoldingsMock = vi.hoisted(() => vi.fn());
const useReferenceBookMock = vi.hoisted(() => vi.fn());
const useOrderBookMock = vi.hoisted(() => vi.fn());
const useHouseCounterpartyAckMock = vi.hoisted(() => vi.fn());
const buyMarketMock = vi.hoisted(() => vi.fn());
const useOracleRealtimeMock = vi.hoisted(() => vi.fn(() => false));

vi.mock('@/hooks/use-platform-gates', () => ({
  usePlatformGates: () => usePlatformGatesMock(),
}));

vi.mock('@/hooks/use-trading', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-trading')>();
  return {
    ...actual,
    useSpotOpenOrders: () => useSpotOpenOrdersMock(),
    useSpotOrderFills: () => useSpotOrderFillsMock(),
    useSpotActions: () => useSpotActionsMock(),
    useCancelSpotOrder: () => useCancelSpotOrderMock(),
    useSpotHoldings: () => useSpotHoldingsMock(),
    useReferenceBook: () => useReferenceBookMock(),
  };
});

vi.mock('@/features/trading/use-trade-earn-vip-tier', () => ({
  useTradeEarnVipTier: () => ({ data: 'bronze' }),
}));

vi.mock('@/features/trading/use-trade-oracle-realtime-disconnected', () => ({
  useTradeOracleRealtimeDisconnected: () => useOracleRealtimeMock(),
}));

vi.mock('@/features/trading/market-store/use-order-book', () => ({
  useOrderBook: () => useOrderBookMock(),
}));

vi.mock('@/features/trading/display-chart/use-exchange-display-price', () => ({
  useExchangeDisplayPrice: () => ({
    exchangePriceDisplay: null,
    exchangePriceDir: 'flat',
  }),
}));

vi.mock('@/product/i18n', () => ({
  useI18n: () => ({ locale: 'ko' }),
}));

const resolveTradeOrderConfirmRequiredMock = vi.hoisted(() => vi.fn(() => false));

vi.mock('@/domain/trade-settings-prefs-display-contract', () => ({
  resolveTradeOrderConfirmRequired: () => resolveTradeOrderConfirmRequiredMock(),
}));

vi.mock('@/features/trading/use-house-counterparty-acknowledgement', () => ({
  useHouseCounterpartyAcknowledgement: () => useHouseCounterpartyAckMock(),
}));

vi.mock('@/features/trading/trade-feedback-display', () => ({
  showTradeFeedback: vi.fn(),
  showTradeRpcErrorFeedback: vi.fn(),
  tradeFeedbackDedupId: (event: string, id: string) => `${event}:${id}`,
}));

function seedSpotDeskMocks(overrides?: { spotBlocked?: boolean }) {
  usePlatformGatesMock.mockReturnValue({
    spotBlocked: overrides?.spotBlocked ?? false,
    futuresBlocked: false,
    loading: false,
  });
  useSpotOpenOrdersMock.mockReturnValue({
    orders: [],
    loading: false,
    refresh: vi.fn(),
  });
  useSpotOrderFillsMock.mockReturnValue({
    fills: [],
    loading: false,
    refresh: vi.fn(),
  });
  buyMarketMock.mockResolvedValue({ received_amount: '1', received_currency: 'PHON' });
  useSpotActionsMock.mockReturnValue({
    buyMarket: buyMarketMock,
    sellMarket: vi.fn(),
    placeLimitOrder: vi.fn(),
    placeStopOrder: vi.fn(),
    busy: false,
    error: null,
  });
  useCancelSpotOrderMock.mockReturnValue({
    cancelSpotOrder: vi.fn(),
    busy: false,
    error: null,
  });
  useSpotHoldingsMock.mockReturnValue({ holdingByAsset: {} });
  useReferenceBookMock.mockReturnValue({ referenceBook: null });
  useOrderBookMock.mockReturnValue({
    symbol: '',
    bids: [],
    asks: [],
    lastUpdateId: 0,
    receivedAtMs: null,
    feedStale: false,
  });
  useHouseCounterpartyAckMock.mockReturnValue({
    acknowledged: true,
    acknowledge: vi.fn(),
    busy: false,
    error: null,
    loading: false,
  });
}

describe('useSpotDeskWire · renderHook · P1-E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOracleRealtimeMock.mockReturnValue(false);
    seedSpotDeskMocks();
  });

  it('sets insufficientAvail when buy amount exceeds USDT balance', () => {
    const engine = makeTradeEngine({
      selectedSpotMarket: mockSpotMarket,
      usdtAvail: '5.000000',
      prices: { PHON_USDT: '0.12' },
    });

    const { result } = renderHook(() => useSpotDeskWire(engine), { wrapper: queryWrapper });

    expect(result.current.insufficientAvail).toBe(true);
  });

  it('clears insufficientAvail when amount fits available balance', () => {
    const engine = makeTradeEngine({
      selectedSpotMarket: mockSpotMarket,
      usdtAvail: '100.000000',
      prices: { PHON_USDT: '0.12' },
    });

    const { result } = renderHook(() => useSpotDeskWire(engine), { wrapper: queryWrapper });

    expect(result.current.insufficientAvail).toBe(false);
  });

  it('blocks submit when spot kill-switch is active', () => {
    seedSpotDeskMocks({ spotBlocked: true });
    const engine = makeTradeEngine({ selectedSpotMarket: mockSpotMarket });

    const { result } = renderHook(() => useSpotDeskWire(engine), { wrapper: queryWrapper });

    expect(result.current.tradeBlocked).toBe(true);
    expect(result.current.submitBlockedReason).toBe('trade.gate.spotBlocked');
  });

  it('falls back to reference book when exchange book feed is stale', () => {
    useOrderBookMock.mockReturnValue({
      symbol: 'PHON_USDT',
      asks: [['999', '1']],
      bids: [['998', '1']],
      lastUpdateId: 1,
      receivedAtMs: Date.now() - 60_000,
      feedStale: true,
    });
    useReferenceBookMock.mockReturnValue({
      referenceBook: {
        asks: [{ price: '0.1205', size: '10' }],
        bids: [{ price: '0.1200', size: '15' }],
      },
    });
    const engine = makeTradeEngine({
      selectedSpotMarket: mockSpotMarket,
      prices: { PHON_USDT: '0.12' },
    });

    const { result } = renderHook(() => useSpotDeskWire(engine), { wrapper: queryWrapper });

    expect(result.current.bookFeedStale).toBe(true);
    expect(result.current.bookDisplaySource).toBe('synthetic');
    expect(result.current.asks[0]?.priceDisplay).toBe('0.1205');
    expect(result.current.bids[0]?.priceDisplay).toBe('0.1200');
  });

  it('blocks submit when oracle price is stale', () => {
    const engine = makeTradeEngine({
      selectedSpotMarket: mockSpotMarket,
      isPriceStale: () => true,
    });

    const { result } = renderHook(() => useSpotDeskWire(engine), { wrapper: queryWrapper });

    expect(result.current.tradeBlocked).toBe(true);
    expect(result.current.submitBlockedReason).toBe('trade.dataStatus.staleDescription');
  });

  it('blocks submit when realtime oracle channel is disconnected', () => {
    useOracleRealtimeMock.mockReturnValue(true);
    const engine = makeTradeEngine({ selectedSpotMarket: mockSpotMarket });

    const { result } = renderHook(() => useSpotDeskWire(engine), { wrapper: queryWrapper });

    expect(result.current.tradeBlocked).toBe(true);
    expect(result.current.submitBlockedReason).toBe(
      'trade.dataStatus.realtimeDisconnectedDescription',
    );
  });

  it('does not call buyMarket when submit is blocked', async () => {
    seedSpotDeskMocks({ spotBlocked: true });
    const engine = makeTradeEngine({ selectedSpotMarket: mockSpotMarket });

    const { result } = renderHook(() => useSpotDeskWire(engine), { wrapper: queryWrapper });

    await act(async () => {
      await result.current.requestSubmit();
    });

    expect(buyMarketMock).not.toHaveBeenCalled();
  });

  it('E12: allows one confirm submit after oracle goes stale (stale race)', async () => {
    resolveTradeOrderConfirmRequiredMock.mockReturnValue(true);
    let stale = false;
    const engine = makeTradeEngine({
      selectedSpotMarket: mockSpotMarket,
      isPriceStale: () => stale,
    });

    const { result, rerender } = renderHook(() => useSpotDeskWire(engine), {
      wrapper: queryWrapper,
    });

    await act(async () => {
      result.current.requestSubmit();
    });
    expect(result.current.confirmOpen).toBe(true);
    expect(result.current.canConfirm).toBe(true);

    stale = true;
    rerender();

    await act(async () => {
      await result.current.submit();
    });

    expect(buyMarketMock).toHaveBeenCalledTimes(1);
  });
});
