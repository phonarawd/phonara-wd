import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { callRpc } from '../lib/rpc';
import { env } from '../lib/env';
import type { Tables } from '@phonara/shared-types';
import {
  FUTURES_MARKETS_ROW,
  FUTURES_POSITIONS_ROW,
  SPOT_MARKETS_ROW,
  STAKING_POOLS_ROW,
  STAKING_POSITIONS_ROW,
} from '@phonara/shared-types';
import type { MessageKey } from '@phonara/i18n';

import { TRADE_FILLS_FETCH_LIMIT } from '@/domain/trade-desk-perf-display-contract';
import { computeOpenPosition, TradingError, type PositionSide } from '@phonara/trading-engine';
import { toDecimal } from '@phonara/money';
import { useAuth } from '../contexts/auth-context';
import { useRealtime } from './use-realtime';
import { translateError } from '../lib/translate-error';
import { isPositiveAmount } from '../lib/money-display';
import { walletKeys } from './use-wallet';
import { TRADE_ORACLE_PRICE_FREEZE_SECONDS } from '@/domain/trade-desk-failure-recovery-display-contract';
import {
  FUTURES_ADJUST_ISOLATED_MARGIN_RPC,
  FUTURES_CANCEL_ORDER_RPC,
  FUTURES_CLOSE_POSITION_RPC,
  FUTURES_LIMIT_ORDER_RPC,
  FUTURES_MARKET_OPEN_RPC,
  FUTURES_PARTIAL_CLOSE_RPC,
  FUTURES_SET_MARGIN_MODE_RPC,
  FUTURES_STOP_ORDER_RPC,
  FUTURES_UPDATE_SLTP_RPC,
  FUTURES_SET_TRAILING_STOP_RPC,
  FUTURES_CLEAR_TRAILING_STOP_RPC,
  parseMarginModeRpcResult,
  parseOrderCancelRpcResult,
  parseSyntheticBook,
  parseTradingCandles,
  parseTradingRpcPayload,
  realFillBookFromRpcResult,
  resolveTradingRpcMarket,
  SPOT_MARKET_BUY_RPC,
  SPOT_MARKET_SELL_RPC,
  TRADING_CANCEL_SPOT_ORDER_RPC,
  TRADING_CLAIM_STAKING_REWARD_RPC,
  TRADING_GET_CANDLES_RPC,
  TRADING_GET_SYNTHETIC_BOOK_RPC,
  TRADING_PLACE_SPOT_LIMIT_ORDER_RPC,
  TRADING_PLACE_SPOT_STOP_ORDER_RPC,
  TRADING_RECORD_CONSENT_RPC,
  TRADING_STAKE_PHON_RPC,
  TRADING_STAKE_RPC,
  TRADING_UNSTAKE_PHON_RPC,
  type SyntheticBook,
  type TradingRpcPayload,
} from '@/domain/trading-rpc-display-contract';

// Stable id for a single user intent. Rapid double-clicks share the same id
// (the ref is held while a submit is in-flight) so the server dedups both the
// client-side double tap and any cross-tab/network race into one entity.
function newRequestId(): string {
  const c = globalThis.crypto;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type FuturesPosition = Tables<'futures_positions'>;
export type FuturesMarket = Tables<'futures_markets'>;
export type SpotMarket = Tables<'spot_markets'>;
export type StakingPosition = Tables<'staking_positions'>;
export type StakingPool = Tables<'staking_pools'>;
export type OraclePrice = Tables<'oracle_prices'>;
export type MarketCircuitBreaker = Tables<'market_circuit_breakers'>;

export type {
  RealFillBook,
  SyntheticBook,
  SyntheticBookLevel,
  TradingCandle,
} from '@/domain/trading-rpc-display-contract';
export { realFillBookFromRpcResult } from '@/domain/trading-rpc-display-contract';

/** House/oracle reference liquidity shown in the terminal — not CLOB matching. */
export type ReferenceOrderBook = SyntheticBook & { bookKind: 'reference' };

// ─── Query keys ────────────────────────────────────────────────

export const tradingKeys = {
  futuresMarkets: () => ['futures-markets'] as const,
  spotMarkets: () => ['spot-markets'] as const,
  candles: (symbol: string | null, interval: string) => ['candles', symbol, interval] as const,
  syntheticBook: (symbol: string | null) => ['synthetic-book', symbol] as const,
  prices: () => ['prices'] as const,
  futuresPositions: (userId: string | null) => ['futures-positions', userId] as const,
  tradingRiskAcknowledgement: (userId: string | null) =>
    ['trading-risk-acknowledgement', userId] as const,
  stakingPools: () => ['staking-pools'] as const,
  stakingPositions: (userId: string | null) => ['staking-positions', userId] as const,
  openOrders: (userId: string | null) => ['trading-open-orders', userId] as const,
  spotOpenOrders: (userId: string | null) => ['spot-open-orders', userId] as const,
  orderFills: (userId: string | null) => ['trading-order-fills', userId] as const,
  spotOrderFills: (userId: string | null) => ['spot-order-fills', userId] as const,
  marginAccount: (userId: string | null) => ['margin-account', userId] as const,
  fundingRate: (market: string | null) => ['funding-rate', market] as const,
  fundingPayments: (userId: string | null) => ['funding-payments', userId] as const,
  spotHoldings: (userId: string | null) => ['spot-holdings', userId] as const,
  referencePriceTicks: (symbol: string | null) => ['reference-price-ticks', symbol] as const,
};

/** Oracle reference tick row — display-only time&sales rail (not user settlement). */
export type ReferencePriceTick = {
  id: string;
  price: string;
  created_at: string;
};

export type SpotHolding = {
  base_asset: string;
  quantity: string;
};

export type MarginAccount = {
  user_id: string;
  margin_mode: 'isolated' | 'cross';
  cross_collateral_phon: string;
  cross_collateral_usdt: string;
  updated_at: string;
};

export type TradingOpenOrder = {
  id: string;
  market: string;
  side: 'long' | 'short';
  order_type: 'market' | 'limit' | 'stop_market' | 'stop_limit';
  status: 'pending' | 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'triggered';
  margin_currency: 'USDT' | 'PHON';
  price: string | null;
  stop_price: string | null;
  quantity: string;
  filled_quantity: string;
  leverage: string;
  margin_amount: string;
  created_at: string;
};

/** Spot limit/stop open order row (`spot_open_orders` · display-only). */
export type SpotOpenOrder = {
  id: string;
  market: string;
  side: 'buy' | 'sell';
  order_type: 'limit' | 'stop_market' | 'stop_limit';
  status: TradingOpenOrder['status'];
  stake_currency: 'USDT' | 'PHON';
  stake_amount: string;
  price: string | null;
  stop_price: string | null;
  quantity: string;
  filled_quantity: string;
  base_asset: string;
  created_at: string;
};

/** Unified open-order row for spot desk panels (maps spot schema → panel columns). */
export type SpotDeskOpenOrder = SpotOpenOrder & {
  margin_currency: 'USDT' | 'PHON';
  margin_amount: string;
  leverage: string;
};

export function mapSpotOpenOrderForDesk(order: SpotOpenOrder): SpotDeskOpenOrder {
  return {
    ...order,
    margin_currency: order.stake_currency,
    margin_amount: order.stake_amount,
    leverage: '1',
  };
}

/** Map spot rows to futures-shaped columns for shared OpenOrdersPanel (display-only). */
export function mapSpotOpenOrderToTradingDisplay(order: SpotOpenOrder): TradingOpenOrder {
  return {
    id: order.id,
    market: order.market,
    side: order.side === 'buy' ? 'long' : 'short',
    order_type: order.order_type,
    status: order.status,
    margin_currency: order.stake_currency,
    price: order.price,
    stop_price: order.stop_price,
    quantity: order.quantity,
    filled_quantity: order.filled_quantity,
    leverage: '1',
    margin_amount: order.stake_amount,
    created_at: order.created_at,
  };
}

/** Append-only user funding settlement row (display-only · `funding_payments`). */
export type FundingPayment = {
  id: string;
  market: string;
  amount: string;
  currency: 'USDT' | 'PHON';
  created_at: string;
  position_id: string;
};

/** Single house fill row joined with parent order metadata (display-only · §22.2.4). */
export type TradingOrderFill = {
  id: string;
  order_id: string;
  fill_price: string;
  fill_quantity: string;
  fee: string;
  created_at: string;
  market: string;
  side: 'long' | 'short';
  order_type: TradingOpenOrder['order_type'];
  margin_currency: 'USDT' | 'PHON';
  leverage: string;
};

type TradingOrderFillRow = {
  id: string;
  order_id: string;
  fill_price: string;
  fill_quantity: string;
  fee: string;
  created_at: string;
  order: {
    market: string;
    side: 'long' | 'short';
    order_type: TradingOpenOrder['order_type'];
    margin_currency: 'USDT' | 'PHON';
    leverage: string;
  } | null;
};

function mapTradingOrderFillRow(row: TradingOrderFillRow): TradingOrderFill | null {
  if (!row.order) return null;
  return {
    id: row.id,
    order_id: row.order_id,
    fill_price: row.fill_price,
    fill_quantity: row.fill_quantity,
    fee: row.fee,
    created_at: row.created_at,
    market: row.order.market,
    side: row.order.side,
    order_type: row.order.order_type,
    margin_currency: row.order.margin_currency,
    leverage: row.order.leverage,
  };
}

// ─── Market metadata ───────────────────────────────────────────

export function useFuturesMarkets() {
  const {
    data: markets = [],
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.futuresMarkets(),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('futures_markets')
        .select(FUTURES_MARKETS_ROW)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (e) throw e;
      return (data ?? []) as FuturesMarket[];
    },
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

  return { markets, loading, isError, error, refetch };
}

export function useSpotMarkets() {
  const {
    data: markets = [],
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.spotMarkets(),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('spot_markets')
        .select(SPOT_MARKETS_ROW)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (e) throw e;
      return (data ?? []) as SpotMarket[];
    },
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

  return { markets, loading, isError, error, refetch };
}

export function useSpotHoldings() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const { data: holdings = [], refetch } = useQuery({
    queryKey: tradingKeys.spotHoldings(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('spot_holdings')
        .select('base_asset, quantity')
        .eq('user_id', userId!);
      if (e) throw e;
      return (data ?? []) as SpotHolding[];
    },
    enabled: !!userId,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  const holdingByAsset = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of holdings) {
      map[row.base_asset] = row.quantity;
    }
    return map;
  }, [holdings]);

  return { holdings, holdingByAsset, refetch };
}

export function useCandles(symbol: string | null, interval = '1m') {
  const {
    data: candles = [],
    isLoading: loading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: tradingKeys.candles(symbol, interval),
    queryFn: async () => {
      const data = await callRpc(TRADING_GET_CANDLES_RPC, {
        p_symbol: symbol!,
        p_interval: interval,
        p_limit: 200,
      });
      return parseTradingCandles(data);
    },
    enabled: !!symbol,
    refetchInterval: 30_000,
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });

  return { candles, loading, isError, error, refetch, isFetching };
}

export function useSyntheticBook(symbol: string | null) {
  const {
    data: book = null,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.syntheticBook(symbol),
    queryFn: async () => {
      const data = await callRpc(TRADING_GET_SYNTHETIC_BOOK_RPC, {
        p_symbol: symbol!,
        p_levels: undefined,
      });
      return parseSyntheticBook(data);
    },
    enabled: !!symbol,
    retry: false,
    refetchInterval: (query) => (query.state.status === 'error' ? false : 30_000),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });

  return { book, loading, error, refetch };
}

/** Reference order book for terminal display (house/oracle priced · not CLOB). */
export function useReferenceBook(symbol: string | null) {
  const { book, loading, error, refetch } = useSyntheticBook(symbol);
  const referenceBook: ReferenceOrderBook | null = book ? { ...book, bookKind: 'reference' } : null;
  return { referenceBook, loading, error, refetch };
}

/** Reference liquidity ticks for the recent-trades rail (price_ticks · display-only · §22.2.3 H1). */
export function useReferencePriceTicks(symbol: string | null, limit = 20) {
  const {
    data: ticks = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.referencePriceTicks(symbol),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('price_ticks')
        .select('id, price, created_at')
        .eq('symbol', symbol!)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (e) throw e;
      return (data ?? []) as ReferencePriceTick[];
    },
    enabled: !!symbol,
    refetchInterval: 15_000,
    staleTime: 5_000,
    placeholderData: keepPreviousData,
  });

  useRealtime({
    table: 'price_ticks',
    filter: symbol ? `symbol=eq.${symbol}` : undefined,
    event: 'INSERT',
    invalidate: [tradingKeys.referencePriceTicks(symbol)],
    enabled: !!symbol,
  });

  return { ticks, loading, error, refetch };
}

// ─── Market prices ─────────────────────────────────────────────

export function usePrices() {
  const prevPricesRef = useRef<Record<string, string>>({});
  const lastPriceChangeAtRef = useRef<Record<string, number>>({});
  const [freezeTick, setFreezeTick] = useState(0);
  const { data, isError, error, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: tradingKeys.prices(),
    queryFn: async () => {
      const [{ data: priceRows, error: priceError }, { data: circuitRows, error: circuitError }] =
        await Promise.all([
          supabase.from('oracle_prices').select('symbol, price, updated_at'),
          supabase.from('market_circuit_breakers').select('symbol, staleness_seconds, is_halted'),
        ]);
      if (priceError) throw priceError;
      if (circuitError) throw circuitError;
      const prices: Record<string, string> = {};
      const updatedAt: Record<string, string> = {};
      const stalenessSeconds: Record<string, number> = {};
      const haltedSymbols: Record<string, boolean> = {};
      for (const row of circuitRows ?? []) {
        stalenessSeconds[row.symbol] = row.staleness_seconds;
        haltedSymbols[row.symbol] = row.is_halted === true;
      }
      for (const row of priceRows ?? []) {
        prices[row.symbol] = row.price;
        updatedAt[row.symbol] = row.updated_at;
      }
      return { prices, updatedAt, stalenessSeconds, haltedSymbols };
    },
    // Realtime invalidation is primary; polling is a slow fallback.
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
  const prices = data?.prices ?? {};
  const oracleUpdatedAt = data?.updatedAt ?? {};
  const stalenessSeconds = data?.stalenessSeconds ?? {};
  const haltedSymbols = data?.haltedSymbols ?? {};

  useEffect(() => {
    const pricesData = data?.prices;
    if (!pricesData) return;
    const now = Date.now();
    for (const [symbol, price] of Object.entries(pricesData)) {
      const prev = prevPricesRef.current[symbol];
      if (prev === undefined || prev !== price) {
        lastPriceChangeAtRef.current[symbol] = now;
      }
      prevPricesRef.current[symbol] = price;
    }
  }, [data?.prices]);

  useEffect(() => {
    const id = window.setInterval(() => setFreezeTick((n) => n + 1), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const staleSymbols = Object.fromEntries(
    Object.entries(oracleUpdatedAt).map(([symbol, value]) => {
      const threshold = stalenessSeconds[symbol];
      const time = Date.parse(value);
      const stale =
        typeof threshold === 'number' && Number.isFinite(threshold) && Number.isFinite(time)
          ? Date.now() - time > threshold * 1000
          : false;
      return [symbol, stale];
    }),
  );
  const oracleStale = Object.values(staleSymbols).some(Boolean);
  const isPriceStale = useCallback(
    (symbol: string | null | undefined) => {
      if (!symbol) return false;
      return staleSymbols[symbol] === true;
    },
    [staleSymbols],
  );
  const isPriceFrozen = useCallback(
    (symbol: string | null | undefined) => {
      if (!symbol) return false;
      if (staleSymbols[symbol] === true) return false;
      const lastChange = lastPriceChangeAtRef.current[symbol];
      if (lastChange === undefined) return false;
      void freezeTick;
      return Date.now() - lastChange >= TRADE_ORACLE_PRICE_FREEZE_SECONDS * 1000;
    },
    [staleSymbols, freezeTick],
  );
  const isMarketHalted = useCallback(
    (symbol: string | null | undefined) => {
      if (!symbol) return false;
      return haltedSymbols[symbol] === true;
    },
    [haltedSymbols],
  );

  const qc = useQueryClient();
  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: tradingKeys.prices() });
  }, [qc]);

  useRealtime({
    table: 'oracle_prices',
    invalidate: [tradingKeys.prices()],
  });

  return {
    prices,
    refresh,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
    oracleStale,
    isPriceStale,
    isPriceFrozen,
    isMarketHalted,
    haltedSymbols,
  };
}

// ─── Futures positions ─────────────────────────────────────────

export function useFuturesPositions() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const {
    data: positions = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.futuresPositions(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('futures_positions')
        .select(FUTURES_POSITIONS_ROW)
        .eq('user_id', userId!)
        .order('opened_at', { ascending: false })
        .limit(50);
      if (e) throw e;
      return (data ?? []) as FuturesPosition[];
    },
    enabled: !!userId,
  });

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: tradingKeys.futuresPositions(userId) });
  }, [qc, userId]);

  return { positions, loading, refresh, isError, error, isFetching, dataUpdatedAt, refetch };
}

export function useOpenOrders() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const {
    data: orders = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.openOrders(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('trading_open_orders')
        .select(
          'id, market, side, order_type, status, margin_currency, price, stop_price, quantity, filled_quantity, leverage, margin_amount, created_at',
        )
        .in('status', ['pending', 'open', 'triggered'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (e) throw e;
      return (data ?? []) as TradingOpenOrder[];
    },
    enabled: !!userId,
    staleTime: 10_000,
  });

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: tradingKeys.openOrders(userId) });
  }, [qc, userId]);

  return { orders, loading, refresh, isError, error, isFetching, dataUpdatedAt, refetch };
}

export function useSpotOpenOrders() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const {
    data: orders = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.spotOpenOrders(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('spot_open_orders')
        .select(
          'id, market, side, order_type, status, stake_currency, stake_amount, price, stop_price, quantity, filled_quantity, base_asset, created_at',
        )
        .in('status', ['pending', 'open', 'triggered'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (e) throw e;
      return (data ?? []) as SpotOpenOrder[];
    },
    enabled: !!userId,
    staleTime: 10_000,
  });

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: tradingKeys.spotOpenOrders(userId) });
  }, [qc, userId]);

  return { orders, loading, refresh, isError, error, isFetching, dataUpdatedAt, refetch };
}

export type SpotOrderFill = {
  id: string;
  order_id: string;
  fill_price: string;
  fill_quantity: string;
  fee: string;
  created_at: string;
  market: string;
  side: 'buy' | 'sell';
  order_type: SpotOpenOrder['order_type'];
  stake_currency: 'USDT' | 'PHON';
};

type SpotOrderFillRow = {
  id: string;
  order_id: string;
  fill_price: string;
  fill_quantity: string;
  fee: string;
  created_at: string;
  order: {
    market: string;
    side: 'buy' | 'sell';
    order_type: SpotOpenOrder['order_type'];
    stake_currency: 'USDT' | 'PHON';
  } | null;
};

function mapSpotOrderFillRow(row: SpotOrderFillRow): SpotOrderFill | null {
  if (!row.order) return null;
  return {
    id: row.id,
    order_id: row.order_id,
    fill_price: row.fill_price,
    fill_quantity: row.fill_quantity,
    fee: row.fee,
    created_at: row.created_at,
    market: row.order.market,
    side: row.order.side,
    order_type: row.order.order_type,
    stake_currency: row.order.stake_currency,
  };
}

export function useSpotOrderFills() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const {
    data: fills = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.spotOrderFills(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('spot_order_fills')
        .select(
          `
          id,
          order_id,
          fill_price,
          fill_quantity,
          fee,
          created_at,
          order:spot_open_orders!inner (
            market,
            side,
            order_type,
            stake_currency
          )
        `,
        )
        .order('created_at', { ascending: false })
        .limit(TRADE_FILLS_FETCH_LIMIT);
      if (e) throw e;
      return (data ?? [])
        .map((row) => mapSpotOrderFillRow(row as SpotOrderFillRow))
        .filter((row): row is SpotOrderFill => row !== null);
    },
    enabled: !!userId,
    staleTime: 10_000,
  });

  // PIR E2: spot_order_fills dropped from publication — refresh via open_orders
  // realtime (use-trade-realtime-feedback) + post-RPC invalidateSpotTrading.

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: tradingKeys.spotOrderFills(userId) });
  }, [qc, userId]);

  return { fills, loading, refresh, isError, error, isFetching, dataUpdatedAt, refetch };
}

export function useCancelSpotOrder(onChange?: () => void) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  const invalidateSpotTrading = useCallback(() => {
    void qc.invalidateQueries({ queryKey: walletKeys.all(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.spotOpenOrders(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.spotHoldings(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.spotOrderFills(userId) });
  }, [qc, userId]);

  const cancelSpotOrder = useCallback(
    async (orderId: string) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(TRADING_CANCEL_SPOT_ORDER_RPC, {
          p_order_id: orderId,
        });
        invalidateSpotTrading();
        onChange?.();
        return parseOrderCancelRpcResult(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateSpotTrading, onChange],
  );

  return { cancelSpotOrder, busy, error };
}

export function useTradingOrderFills() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const {
    data: fills = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.orderFills(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('trading_order_fills')
        .select(
          `
          id,
          order_id,
          fill_price,
          fill_quantity,
          fee,
          created_at,
          order:trading_open_orders!inner (
            market,
            side,
            order_type,
            margin_currency,
            leverage
          )
        `,
        )
        .order('created_at', { ascending: false })
        .limit(TRADE_FILLS_FETCH_LIMIT);
      if (e) throw e;
      return (data ?? [])
        .map((row) => mapTradingOrderFillRow(row as TradingOrderFillRow))
        .filter((row): row is TradingOrderFill => row !== null);
    },
    enabled: !!userId,
    staleTime: 10_000,
  });

  // PIR E2: trading_order_fills dropped from publication — refresh via open_orders
  // realtime (use-trade-realtime-feedback) + post-RPC invalidateTrading.

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: tradingKeys.orderFills(userId) });
  }, [qc, userId]);

  return { fills, loading, refresh, isError, error, isFetching, dataUpdatedAt, refetch };
}

export function useMarginAccount() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  const {
    data: account,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.marginAccount(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('margin_accounts')
        .select('user_id, margin_mode, cross_collateral_phon, cross_collateral_usdt, updated_at')
        .eq('user_id', userId!)
        .maybeSingle();
      if (e) throw e;
      return (data ?? null) as MarginAccount | null;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const marginMode: 'isolated' | 'cross' = account?.margin_mode ?? 'isolated';

  const setMarginMode = useCallback(
    async (mode: 'isolated' | 'cross') => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_SET_MARGIN_MODE_RPC, { p_mode: mode });
        void qc.invalidateQueries({ queryKey: tradingKeys.marginAccount(userId) });
        return parseMarginModeRpcResult(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [qc, userId],
  );

  return { marginMode, account, loading, busy, error, setMarginMode, refetch };
}

export function useFundingRate(market: string | null) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: tradingKeys.fundingRate(market),
    queryFn: async (): Promise<string> => {
      const token = session?.access_token;
      if (!token || !market) return '0';
      const params = new URLSearchParams({
        select: 'rate',
        market: `eq.${market}`,
      });
      const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/funding_rates?${params}`, {
        headers: {
          apikey: env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`funding_rates fetch failed: ${res.status}`);
      const rows = (await res.json()) as { rate: string }[];
      return rows[0]?.rate ?? '0';
    },
    enabled: !!userId && !!market,
    staleTime: 30_000,
  });

  return { rate: data ?? null, loading: isLoading };
}

export function useFundingPayments() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const {
    data: payments = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.fundingPayments(userId),
    queryFn: async (): Promise<FundingPayment[]> => {
      const token = session?.access_token;
      if (!token || !userId) return [];
      const params = new URLSearchParams({
        select: 'id,market,amount,currency,created_at,position_id',
        order: 'created_at.desc',
        limit: '100',
      });
      const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/funding_payments?${params}`, {
        headers: {
          apikey: env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`funding_payments fetch failed: ${res.status}`);
      return (await res.json()) as FundingPayment[];
    },
    enabled: !!userId,
    staleTime: 10_000,
  });

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: tradingKeys.fundingPayments(userId) });
  }, [qc, userId]);

  return { payments, loading, refresh, isError, error, isFetching, dataUpdatedAt, refetch };
}

export function useFuturesOrderTicket({
  markets,
  prices,
  isPriceStale,
  isPriceFrozen,
  realtimeDisconnected,
  selectedSymbol,
}: {
  markets: FuturesMarket[];
  prices: Record<string, string>;
  isPriceStale: (symbol: string | null | undefined) => boolean;
  isPriceFrozen: (symbol: string | null | undefined) => boolean;
  realtimeDisconnected: boolean;
  selectedSymbol?: string | null;
}) {
  const initialIdx = Math.max(
    0,
    selectedSymbol ? markets.findIndex((m) => m.symbol === selectedSymbol) : 0,
  );
  const [marketIdx, setMarketIdx] = useState(initialIdx);
  const [side, setSide] = useState<PositionSide>('long');
  const [marginCurrency, setMarginCurrency] = useState<'PHON' | 'USDT'>('USDT');
  const [margin, setMargin] = useState('100');
  const [leverage, setLeverage] = useState('10');
  const [tpEnabled, setTpEnabled] = useState(false);
  const [tpPrice, setTpPrice] = useState('');
  const [slEnabled, setSlEnabled] = useState(false);
  const [slPrice, setSlPrice] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const market = markets[marketIdx] ?? markets[0] ?? null;
  const price = market ? (prices[market.symbol] ?? '0') : '0';
  const priceStale = market ? isPriceStale(market.symbol) : false;
  const priceFrozen = market ? isPriceFrozen(market.symbol) : false;
  const maxLeverage = market?.max_leverage ?? '1';

  const highLeverageThreshold = useMemo(() => {
    try {
      const half = toDecimal(maxLeverage).div(2).ceil();
      return half.lessThanOrEqualTo('20') ? half.toString() : '20';
    } catch {
      return '1';
    }
  }, [maxLeverage]);

  const isHighLeverage = useMemo(() => {
    try {
      return toDecimal(leverage).greaterThan(highLeverageThreshold);
    } catch {
      return false;
    }
  }, [highLeverageThreshold, leverage]);

  useEffect(() => {
    if (marketIdx >= markets.length) setMarketIdx(0);
  }, [marketIdx, markets.length]);

  useEffect(() => {
    if (!selectedSymbol) return;
    const idx = markets.findIndex((m) => m.symbol === selectedSymbol);
    if (idx >= 0 && idx !== marketIdx) setMarketIdx(idx);
  }, [selectedSymbol, markets, marketIdx]);

  useEffect(() => {
    try {
      if (toDecimal(leverage).greaterThan(maxLeverage)) {
        setLeverage(toDecimal(maxLeverage).toFixed(0));
      }
    } catch {
      setLeverage('1');
    }
  }, [leverage, maxLeverage]);

  const preview = useMemo(() => {
    try {
      if (!isPositiveAmount(price) || !isPositiveAmount(margin)) return null;
      return computeOpenPosition({
        side,
        marginCurrency,
        marginAmount: margin,
        leverage,
        entryPrice: price,
        maxLeverage,
      });
    } catch (error) {
      return error instanceof TradingError ? null : null;
    }
  }, [side, marginCurrency, margin, leverage, price, maxLeverage]);

  return {
    marketIdx,
    setMarketIdx,
    side,
    setSide,
    marginCurrency,
    setMarginCurrency,
    margin,
    setMargin,
    leverage,
    setLeverage,
    tpEnabled,
    setTpEnabled,
    tpPrice,
    setTpPrice,
    slEnabled,
    setSlEnabled,
    slPrice,
    setSlPrice,
    confirmOpen,
    setConfirmOpen,
    market,
    price,
    priceStale,
    priceFrozen,
    maxLeverage,
    highLeverageThreshold,
    isHighLeverage,
    preview,
    tradeDisabled: priceStale || priceFrozen || realtimeDisconnected,
  };
}

// ─── Shared cancel (spot + futures open orders) ────────────────

export function useCancelTradingOrder(onChange?: () => void) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  const invalidateTrading = useCallback(() => {
    void qc.invalidateQueries({ queryKey: walletKeys.all(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.openOrders(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.orderFills(userId) });
  }, [qc, userId]);

  const cancelOrder = useCallback(
    async (orderId: string) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_CANCEL_ORDER_RPC, {
          p_order_id: orderId,
        });
        invalidateTrading();
        onChange?.();
        return parseOrderCancelRpcResult(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateTrading, onChange],
  );

  return { cancelOrder, busy, error };
}

// ─── Futures actions ───────────────────────────────────────────

export function useFuturesActions(onChange?: () => void) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [lastResult, setLastResult] = useState<TradingRpcPayload | null>(null);
  const openIdRef = useRef<string | null>(null);
  const { cancelOrder, busy: cancelBusy, error: cancelError } = useCancelTradingOrder(onChange);
  const invalidateTrading = useCallback(() => {
    void qc.invalidateQueries({ queryKey: walletKeys.all(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.openOrders(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.orderFills(userId) });
  }, [qc, userId]);

  const openPosition = useCallback(
    async (args: {
      market: string;
      side: 'long' | 'short';
      marginCurrency: 'PHON' | 'USDT';
      marginAmount: string;
      leverage: string;
      stopLoss?: string | null;
      takeProfit?: string | null;
    }) => {
      const reqId = openIdRef.current ?? (openIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_MARKET_OPEN_RPC, {
          p_market: args.market,
          p_side: args.side,
          p_margin_currency: args.marginCurrency,
          p_margin_amount: args.marginAmount,
          p_leverage: args.leverage,
          p_stop_loss: args.stopLoss ?? undefined,
          p_take_profit: args.takeProfit ?? undefined,
          p_client_request_id: reqId,
        });
        const result = parseTradingRpcPayload(data);
        setLastResult(result);
        invalidateTrading();
        onChange?.();
        return result;
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        openIdRef.current = null;
      }
    },
    [invalidateTrading, onChange],
  );

  const placeLimitOrder = useCallback(
    async (args: {
      market: string;
      side: 'long' | 'short';
      marginCurrency: 'PHON' | 'USDT';
      marginAmount: string;
      leverage: string;
      limitPrice: string;
      timeInForce?: 'gtc' | 'post_only' | 'ioc' | 'fok';
      displayQuantity?: string | null;
    }) => {
      const reqId = openIdRef.current ?? (openIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_LIMIT_ORDER_RPC, {
          p_market: args.market,
          p_side: args.side,
          p_margin_currency: args.marginCurrency,
          p_margin_amount: args.marginAmount,
          p_leverage: args.leverage,
          p_limit_price: args.limitPrice,
          p_client_request_id: reqId,
          p_time_in_force: args.timeInForce ?? 'gtc',
          p_display_quantity: args.displayQuantity ?? undefined,
        });
        const result = parseTradingRpcPayload(data);
        setLastResult(result);
        invalidateTrading();
        onChange?.();
        return result;
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        openIdRef.current = null;
      }
    },
    [invalidateTrading, onChange],
  );

  const placeStopOrder = useCallback(
    async (args: {
      market: string;
      side: 'long' | 'short';
      marginCurrency: 'PHON' | 'USDT';
      marginAmount: string;
      leverage: string;
      stopPrice: string;
      orderType: 'stop_market' | 'stop_limit';
      limitPrice?: string | null;
    }) => {
      const reqId = openIdRef.current ?? (openIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_STOP_ORDER_RPC, {
          p_market: args.market,
          p_side: args.side,
          p_margin_currency: args.marginCurrency,
          p_margin_amount: args.marginAmount,
          p_leverage: args.leverage,
          p_stop_price: args.stopPrice,
          p_order_type: args.orderType,
          p_limit_price: args.limitPrice ?? undefined,
          p_client_request_id: reqId,
        });
        const result = parseTradingRpcPayload(data);
        setLastResult(result);
        invalidateTrading();
        onChange?.();
        return result;
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        openIdRef.current = null;
      }
    },
    [invalidateTrading, onChange],
  );

  const partialClosePosition = useCallback(
    async (positionId: string, closeRatio: string) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_PARTIAL_CLOSE_RPC, {
          p_position_id: positionId,
          p_close_ratio: closeRatio,
        });
        const result = parseTradingRpcPayload(data);
        setLastResult(result);
        invalidateTrading();
        onChange?.();
        return result;
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateTrading, onChange],
  );

  const adjustIsolatedMargin = useCallback(
    async (positionId: string, delta: string) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_ADJUST_ISOLATED_MARGIN_RPC, {
          p_position_id: positionId,
          p_delta: delta,
        });
        const result = parseTradingRpcPayload(data);
        setLastResult(result);
        invalidateTrading();
        onChange?.();
        return result;
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateTrading, onChange],
  );

  const updateFuturesPositionSltp = useCallback(
    async (positionId: string, stopLoss: string | null, takeProfit: string | null) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_UPDATE_SLTP_RPC, {
          p_position_id: positionId,
          p_stop_loss: stopLoss ?? undefined,
          p_take_profit: takeProfit ?? undefined,
        });
        const result = parseTradingRpcPayload(data);
        setLastResult(result);
        invalidateTrading();
        onChange?.();
        return result;
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateTrading, onChange],
  );

  const setTrailingStop = useCallback(
    async (positionId: string, callbackRate: string, activationPrice?: string | null) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_SET_TRAILING_STOP_RPC, {
          p_position_id: positionId,
          p_callback_rate: callbackRate,
          p_activation_price: activationPrice ?? undefined,
        });
        const result = parseTradingRpcPayload(data);
        setLastResult(result);
        invalidateTrading();
        onChange?.();
        return result;
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateTrading, onChange],
  );

  const clearTrailingStop = useCallback(
    async (positionId: string) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_CLEAR_TRAILING_STOP_RPC, {
          p_position_id: positionId,
        });
        const result = parseTradingRpcPayload(data);
        setLastResult(result);
        invalidateTrading();
        onChange?.();
        return result;
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateTrading, onChange],
  );

  const closePosition = useCallback(
    async (positionId: string) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(FUTURES_CLOSE_POSITION_RPC, {
          p_position_id: positionId,
        });
        const result = parseTradingRpcPayload(data);
        setLastResult(result);
        invalidateTrading();
        onChange?.();
        return result;
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateTrading, onChange],
  );

  return {
    openPosition,
    placeLimitOrder,
    placeStopOrder,
    cancelOrder,
    partialClosePosition,
    adjustIsolatedMargin,
    updateFuturesPositionSltp,
    setTrailingStop,
    clearTrailingStop,
    closePosition,
    busy: busy || cancelBusy,
    error: error ?? cancelError,
    lastResult,
    lastRealFill: realFillBookFromRpcResult(resolveTradingRpcMarket(lastResult), lastResult),
  };
}

export function useTradingRiskAcknowledgement() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  const { data: acknowledged = false, isLoading: loading } = useQuery({
    queryKey: tradingKeys.tradingRiskAcknowledgement(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from('user_consents')
        .select('accepted')
        .eq('user_id', userId!)
        .eq('doc_type', 'trading_risk_acknowledgement')
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.accepted === true;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const acknowledge = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await callRpc(TRADING_RECORD_CONSENT_RPC, {
        p_doc_type: 'trading_risk_acknowledgement',
        p_doc_version: '1.0',
        p_accepted: true,
        p_ip_address: undefined,
        p_user_agent: globalThis.navigator?.userAgent,
        p_locale: globalThis.navigator?.language?.startsWith('ko') ? 'ko' : 'en',
      });
      await qc.invalidateQueries({ queryKey: tradingKeys.tradingRiskAcknowledgement(userId) });
      return true;
    } catch (err) {
      setError(translateError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, [qc, userId]);

  return { acknowledged, acknowledge, busy, error, loading };
}

// ─── Spot actions ──────────────────────────────────────────────

export function useSpotActions(onChange?: () => void) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const buyIdRef = useRef<string | null>(null);
  const sellIdRef = useRef<string | null>(null);
  const orderIdRef = useRef<string | null>(null);
  const invalidateWallet = useCallback(() => {
    void qc.invalidateQueries({ queryKey: walletKeys.all(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.spotHoldings(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.spotOpenOrders(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.spotOrderFills(userId) });
  }, [qc, userId]);

  const buy = useCallback(
    async (usdtSpent: string) => {
      const reqId = buyIdRef.current ?? (buyIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(SPOT_MARKET_BUY_RPC, {
          p_usdt_spent: usdtSpent,
          p_client_request_id: reqId,
        });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        buyIdRef.current = null;
      }
    },
    [invalidateWallet, onChange],
  );

  const buyMarket = useCallback(
    async (market: string, stakeCurrency: 'USDT' | 'PHON', amount: string) => {
      const reqId = buyIdRef.current ?? (buyIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(SPOT_MARKET_BUY_RPC, {
          p_market: market,
          p_stake_currency: stakeCurrency,
          p_amount: amount,
          p_client_request_id: reqId,
        });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        buyIdRef.current = null;
      }
    },
    [invalidateWallet, onChange],
  );

  const sellMarket = useCallback(
    async (market: string, stakeCurrency: 'USDT' | 'PHON', baseAmount: string) => {
      const reqId = sellIdRef.current ?? (sellIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(SPOT_MARKET_SELL_RPC, {
          p_market: market,
          p_stake_currency: stakeCurrency,
          p_base_amount: baseAmount,
          p_client_request_id: reqId,
        });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        sellIdRef.current = null;
      }
    },
    [invalidateWallet, onChange],
  );

  const sell = useCallback(
    async (phonSold: string) => {
      const reqId = sellIdRef.current ?? (sellIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(SPOT_MARKET_SELL_RPC, {
          p_phon_sold: phonSold,
          p_client_request_id: reqId,
        });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        sellIdRef.current = null;
      }
    },
    [invalidateWallet, onChange],
  );

  const placeLimitOrder = useCallback(
    async (args: {
      market: string;
      side: 'buy' | 'sell';
      stakeCurrency: 'USDT' | 'PHON';
      amount: string;
      limitPrice: string;
    }) => {
      const reqId = orderIdRef.current ?? (orderIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(TRADING_PLACE_SPOT_LIMIT_ORDER_RPC, {
          p_market: args.market,
          p_side: args.side,
          p_stake_currency: args.stakeCurrency,
          p_amount: args.amount,
          p_limit_price: args.limitPrice,
          p_client_request_id: reqId,
        });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        orderIdRef.current = null;
      }
    },
    [invalidateWallet, onChange],
  );

  const placeStopOrder = useCallback(
    async (args: {
      market: string;
      side: 'buy' | 'sell';
      stakeCurrency: 'USDT' | 'PHON';
      amount: string;
      stopPrice: string;
      orderType: 'stop_market' | 'stop_limit';
      limitPrice?: string;
    }) => {
      const reqId = orderIdRef.current ?? (orderIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(TRADING_PLACE_SPOT_STOP_ORDER_RPC, {
          p_market: args.market,
          p_side: args.side,
          p_stake_currency: args.stakeCurrency,
          p_amount: args.amount,
          p_stop_price: args.stopPrice,
          p_order_type: args.orderType,
          p_limit_price: args.limitPrice ?? undefined,
          p_client_request_id: reqId,
        });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        orderIdRef.current = null;
      }
    },
    [invalidateWallet, onChange],
  );

  return { buy, buyMarket, sell, sellMarket, placeLimitOrder, placeStopOrder, busy, error };
}

// ─── Staking ───────────────────────────────────────────────────

export function useStakingPools() {
  const {
    data: pools = [],
    isLoading: loading,
    isError,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.stakingPools(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staking_pools')
        .select(STAKING_POOLS_ROW)
        .eq('is_active', true);
      if (error) throw error;
      return ((data ?? []) as StakingPool[]).sort(
        (a, b) => a.sort_order - b.sort_order || a.lock_days - b.lock_days,
      );
    },
    staleTime: 60_000,
  });
  return { pools, loading, isError, refetch };
}

export function useStakingPositions() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const {
    data: positions = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: tradingKeys.stakingPositions(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('staking_positions')
        .select(STAKING_POSITIONS_ROW)
        .eq('user_id', userId!)
        .order('staked_at', { ascending: false });
      if (e) throw e;
      return (data ?? []) as StakingPosition[];
    },
    enabled: !!userId,
  });

  useRealtime({
    table: 'staking_positions',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    invalidate: [tradingKeys.stakingPositions(userId)],
    enabled: !!userId,
  });

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: tradingKeys.stakingPositions(userId) });
  }, [qc, userId]);

  return { positions, loading, refresh, isError, error, isFetching, dataUpdatedAt, refetch };
}

export function useStakingActions(onChange?: () => void) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const stakeIdRef = useRef<string | null>(null);
  const invalidateWallet = useCallback(() => {
    void qc.invalidateQueries({ queryKey: walletKeys.all(userId) });
  }, [qc, userId]);

  const stake = useCallback(
    async (term: string, amount: string) => {
      const reqId = stakeIdRef.current ?? (stakeIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(TRADING_STAKE_PHON_RPC, {
          p_term: term,
          p_amount: amount,
          p_client_request_id: reqId,
        });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        stakeIdRef.current = null;
      }
    },
    [invalidateWallet, onChange],
  );

  const stakePool = useCallback(
    async (
      referenceAsset: string,
      stakeCurrency: 'USDT' | 'PHON',
      term: string,
      amount: string,
    ) => {
      const reqId = stakeIdRef.current ?? (stakeIdRef.current = newRequestId());
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(TRADING_STAKE_RPC, {
          p_reference_asset: referenceAsset,
          p_stake_currency: stakeCurrency,
          p_term: term,
          p_amount: amount,
          p_client_request_id: reqId,
        });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
        stakeIdRef.current = null;
      }
    },
    [invalidateWallet, onChange],
  );

  const unstake = useCallback(
    async (positionId: string) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(TRADING_UNSTAKE_PHON_RPC, { p_position_id: positionId });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateWallet, onChange],
  );

  const claim = useCallback(
    async (positionId: string) => {
      setBusy(true);
      setError(null);
      try {
        const data = await callRpc(TRADING_CLAIM_STAKING_REWARD_RPC, { p_position_id: positionId });
        invalidateWallet();
        onChange?.();
        return parseTradingRpcPayload(data);
      } catch (err) {
        setError(translateError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateWallet, onChange],
  );

  return { stake, stakePool, unstake, claim, busy, error };
}

// ─── Error translation ─────────────────────────────────────────
// Maps a raw RPC exception to a stable i18n message key.
