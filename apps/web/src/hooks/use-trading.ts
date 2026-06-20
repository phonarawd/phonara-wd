import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { env } from '../lib/env';
import type { Tables } from '@phonara/shared-types';
import type { MessageKey } from '@phonara/i18n';
import { computeOpenPosition, TradingError, type PositionSide } from '@phonara/trading-engine';
import { toDecimal } from '@phonara/money';
import { useAuth } from '../contexts/auth-context';
import { useRealtime } from './use-realtime';
import { translateError } from '../lib/translate-error';
import { isPositiveAmount } from '../lib/money-display';
import { walletKeys } from './use-wallet';

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

export interface TradingCandle {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string | null;
}

export interface SyntheticBookLevel {
  price: string;
  size: string;
}

export interface SyntheticBook {
  symbol: string;
  mid: string;
  asks: SyntheticBookLevel[];
  bids: SyntheticBookLevel[];
  disclosure: string;
}

// ─── Query keys ────────────────────────────────────────────────

export const tradingKeys = {
  futuresMarkets: () => ['futures-markets'] as const,
  spotMarkets: () => ['spot-markets'] as const,
  candles: (symbol: string | null, interval: string) => ['candles', symbol, interval] as const,
  syntheticBook: (symbol: string | null) => ['synthetic-book', symbol] as const,
  prices: () => ['prices'] as const,
  futuresPositions: (userId: string | null) => ['futures-positions', userId] as const,
  tradingRiskAcknowledgement: (userId: string | null) => ['trading-risk-acknowledgement', userId] as const,
  stakingPools: () => ['staking-pools'] as const,
  stakingPositions: (userId: string | null) => ['staking-positions', userId] as const,
  openOrders: (userId: string | null) => ['trading-open-orders', userId] as const,
  marginAccount: (userId: string | null) => ['margin-account', userId] as const,
  fundingRate: (market: string | null) => ['funding-rate', market] as const,
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

// ─── Market metadata ───────────────────────────────────────────

export function useFuturesMarkets() {
  const { data: markets = [], isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: tradingKeys.futuresMarkets(),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('futures_markets')
        .select('*')
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
  const { data: markets = [], isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: tradingKeys.spotMarkets(),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('spot_markets')
        .select('*')
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

export function useCandles(symbol: string | null, interval = '1m') {
  const { data: candles = [], isLoading: loading, isError, error, refetch, isFetching } = useQuery({
    queryKey: tradingKeys.candles(symbol, interval),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_get_candles', {
        p_symbol: symbol!,
        p_interval: interval,
        p_limit: 200,
      });
      if (error) throw error;
      return (data ?? []) as unknown as TradingCandle[];
    },
    enabled: !!symbol,
    refetchInterval: 30_000,
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });

  return { candles, loading, isError, error, refetch, isFetching };
}

export function useSyntheticBook(symbol: string | null) {
  const { data: book = null, isLoading: loading, error, refetch } = useQuery({
    queryKey: tradingKeys.syntheticBook(symbol),
    queryFn: async () => {
      const { data, error: e } = await supabase.rpc('rpc_get_synthetic_book', {
        p_symbol: symbol!,
        p_levels: undefined,
      });
      if (e) throw e;
      return data as unknown as SyntheticBook;
    },
    enabled: !!symbol,
    refetchInterval: 30_000,
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });

  return { book, loading, error, refetch };
}

// ─── Market prices ─────────────────────────────────────────────

export function usePrices() {
  const { data, isError, error, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: tradingKeys.prices(),
    queryFn: async () => {
      const [{ data: priceRows, error: priceError }, { data: circuitRows, error: circuitError }] = await Promise.all([
        supabase.from('oracle_prices').select('symbol, price, updated_at'),
        supabase.from('market_circuit_breakers').select('symbol, staleness_seconds'),
      ]);
      if (priceError) throw priceError;
      if (circuitError) throw circuitError;
      const prices: Record<string, string> = {};
      const updatedAt: Record<string, string> = {};
      const stalenessSeconds: Record<string, number> = {};
      for (const row of circuitRows ?? []) {
        stalenessSeconds[row.symbol] = row.staleness_seconds;
      }
      for (const row of priceRows ?? []) {
        prices[row.symbol] = row.price;
        updatedAt[row.symbol] = row.updated_at;
      }
      return { prices, updatedAt, stalenessSeconds };
    },
    // Realtime invalidation is primary; polling is a slow fallback.
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
  const prices = data?.prices ?? {};
  const oracleUpdatedAt = data?.updatedAt ?? {};
  const stalenessSeconds = data?.stalenessSeconds ?? {};
  const staleSymbols = Object.fromEntries(
    Object.entries(oracleUpdatedAt).map(([symbol, value]) => {
      const threshold = stalenessSeconds[symbol];
      const time = Date.parse(value);
      const stale = typeof threshold === 'number' && Number.isFinite(threshold) && Number.isFinite(time)
        ? Date.now() - time > threshold * 1000
        : false;
      return [symbol, stale];
    }),
  );
  const oracleStale = Object.values(staleSymbols).some(Boolean);
  const isPriceStale = useCallback((symbol: string | null | undefined) => {
    if (!symbol) return false;
    return staleSymbols[symbol] === true;
  }, [staleSymbols]);

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
  };
}

// ─── Futures positions ─────────────────────────────────────────

export function useFuturesPositions() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const { data: positions = [], isLoading: loading, isError, error, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: tradingKeys.futuresPositions(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('futures_positions')
        .select('*')
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

  const { data: orders = [], isLoading: loading, refetch } = useQuery({
    queryKey: tradingKeys.openOrders(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('trading_open_orders')
        .select('id, market, side, order_type, status, margin_currency, price, stop_price, quantity, filled_quantity, leverage, margin_amount, created_at')
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

  return { orders, loading, refresh, refetch };
}

export function useMarginAccount() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  const { data: account, isLoading: loading, refetch } = useQuery({
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

  const setMarginMode = useCallback(async (mode: 'isolated' | 'cross') => {
    setBusy(true);
    setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_set_margin_mode', { p_mode: mode });
      if (e) throw e;
      void qc.invalidateQueries({ queryKey: tradingKeys.marginAccount(userId) });
      return data as Record<string, unknown>;
    } catch (err) {
      setError(translateError(err));
      return null;
    } finally {
      setBusy(false);
    }
  }, [qc, userId]);

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

export function useFuturesOrderTicket({
  markets,
  prices,
  isPriceStale,
  realtimeDisconnected,
  selectedSymbol,
}: {
  markets: FuturesMarket[];
  prices: Record<string, string>;
  isPriceStale: (symbol: string | null | undefined) => boolean;
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
    maxLeverage,
    highLeverageThreshold,
    isHighLeverage,
    preview,
    tradeDisabled: priceStale || realtimeDisconnected,
  };
}

// ─── Futures actions ───────────────────────────────────────────

export function useFuturesActions(onChange?: () => void) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const openIdRef = useRef<string | null>(null);
  const invalidateTrading = useCallback(() => {
    void qc.invalidateQueries({ queryKey: walletKeys.all(userId) });
    void qc.invalidateQueries({ queryKey: tradingKeys.openOrders(userId) });
  }, [qc, userId]);

  const openPosition = useCallback(async (args: {
    market: string;
    side: 'long' | 'short';
    marginCurrency: 'PHON' | 'USDT';
    marginAmount: string;
    leverage: string;
    stopLoss?: string | null;
    takeProfit?: string | null;
  }) => {
    const reqId = openIdRef.current ?? (openIdRef.current = newRequestId());
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_open_futures_position', {
        p_market: args.market,
        p_side: args.side,
        p_margin_currency: args.marginCurrency,
        p_margin_amount: args.marginAmount,
        p_leverage: args.leverage,
        p_stop_loss: args.stopLoss ?? undefined,
        p_take_profit: args.takeProfit ?? undefined,
        p_client_request_id: reqId,
      });
      if (e) throw e;
      setLastResult(data as Record<string, unknown>);
      invalidateTrading();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) {
      setError(translateError(err));
      return null;
    } finally { setBusy(false); openIdRef.current = null; }
  }, [invalidateTrading, onChange]);

  const placeLimitOrder = useCallback(async (args: {
    market: string;
    side: 'long' | 'short';
    marginCurrency: 'PHON' | 'USDT';
    marginAmount: string;
    leverage: string;
    limitPrice: string;
  }) => {
    const reqId = openIdRef.current ?? (openIdRef.current = newRequestId());
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_place_limit_order', {
        p_market: args.market,
        p_side: args.side,
        p_margin_currency: args.marginCurrency,
        p_margin_amount: args.marginAmount,
        p_leverage: args.leverage,
        p_limit_price: args.limitPrice,
        p_client_request_id: reqId,
      });
      if (e) throw e;
      setLastResult(data as Record<string, unknown>);
      invalidateTrading();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) {
      setError(translateError(err));
      return null;
    } finally { setBusy(false); openIdRef.current = null; }
  }, [invalidateTrading, onChange]);

  const placeStopOrder = useCallback(async (args: {
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
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_place_stop_order', {
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
      if (e) throw e;
      setLastResult(data as Record<string, unknown>);
      invalidateTrading();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) {
      setError(translateError(err));
      return null;
    } finally { setBusy(false); openIdRef.current = null; }
  }, [invalidateTrading, onChange]);

  const cancelOrder = useCallback(async (orderId: string) => {
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_cancel_order', {
        p_order_id: orderId,
      });
      if (e) throw e;
      setLastResult(data as Record<string, unknown>);
      invalidateTrading();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) {
      setError(translateError(err));
      return null;
    } finally { setBusy(false); }
  }, [invalidateTrading, onChange]);

  const partialClosePosition = useCallback(async (positionId: string, closeRatio: string) => {
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_partial_close_futures', {
        p_position_id: positionId,
        p_close_ratio: closeRatio,
      });
      if (e) throw e;
      setLastResult(data as Record<string, unknown>);
      invalidateTrading();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) {
      setError(translateError(err));
      return null;
    } finally { setBusy(false); }
  }, [invalidateTrading, onChange]);

  const closePosition = useCallback(async (positionId: string) => {
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_close_futures_position', {
        p_position_id: positionId,
      });
      if (e) throw e;
      setLastResult(data as Record<string, unknown>);
      invalidateTrading();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) {
      setError(translateError(err));
      return null;
    } finally { setBusy(false); }
  }, [invalidateTrading, onChange]);

  return {
    openPosition,
    placeLimitOrder,
    placeStopOrder,
    cancelOrder,
    partialClosePosition,
    closePosition,
    busy,
    error,
    lastResult,
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
      const { error: e } = await supabase.rpc('rpc_record_consent', {
        p_doc_type: 'trading_risk_acknowledgement',
        p_doc_version: '1.0',
        p_accepted: true,
        p_ip_address: undefined,
        p_user_agent: globalThis.navigator?.userAgent,
        p_locale: globalThis.navigator?.language?.startsWith('ko') ? 'ko' : 'en',
      });
      if (e) throw e;
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
  const invalidateWallet = useCallback(() => {
    void qc.invalidateQueries({ queryKey: walletKeys.all(userId) });
  }, [qc, userId]);

  const buy = useCallback(async (usdtSpent: string) => {
    const reqId = buyIdRef.current ?? (buyIdRef.current = newRequestId());
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_spot_market_buy', { p_usdt_spent: usdtSpent, p_client_request_id: reqId });
      if (e) throw e;
      invalidateWallet();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) { setError(translateError(err)); return null; }
    finally { setBusy(false); buyIdRef.current = null; }
  }, [invalidateWallet, onChange]);

  const buyMarket = useCallback(async (market: string, stakeCurrency: 'USDT' | 'PHON', amount: string) => {
    const reqId = buyIdRef.current ?? (buyIdRef.current = newRequestId());
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_spot_market_buy', {
        p_market: market,
        p_stake_currency: stakeCurrency,
        p_amount: amount,
        p_client_request_id: reqId,
      });
      if (e) throw e;
      invalidateWallet();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) { setError(translateError(err)); return null; }
    finally { setBusy(false); buyIdRef.current = null; }
  }, [invalidateWallet, onChange]);

  const sellMarket = useCallback(async (market: string, stakeCurrency: 'USDT' | 'PHON', baseAmount: string) => {
    const reqId = sellIdRef.current ?? (sellIdRef.current = newRequestId());
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_spot_market_sell', {
        p_market: market,
        p_stake_currency: stakeCurrency,
        p_base_amount: baseAmount,
        p_client_request_id: reqId,
      });
      if (e) throw e;
      invalidateWallet();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) { setError(translateError(err)); return null; }
    finally { setBusy(false); sellIdRef.current = null; }
  }, [invalidateWallet, onChange]);

  const sell = useCallback(async (phonSold: string) => {
    const reqId = sellIdRef.current ?? (sellIdRef.current = newRequestId());
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_spot_market_sell', { p_phon_sold: phonSold, p_client_request_id: reqId });
      if (e) throw e;
      invalidateWallet();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) { setError(translateError(err)); return null; }
    finally { setBusy(false); sellIdRef.current = null; }
  }, [invalidateWallet, onChange]);

  return { buy, buyMarket, sell, sellMarket, busy, error };
}

// ─── Staking ───────────────────────────────────────────────────

export function useStakingPools() {
  const { data: pools = [] } = useQuery({
    queryKey: tradingKeys.stakingPools(),
    queryFn: async () => {
      const { data } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('is_active', true);
      return ((data ?? []) as StakingPool[]).sort((a, b) => a.lock_days - b.lock_days);
    },
    staleTime: 60_000,
  });
  return pools;
}

export function useStakingPositions() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const { data: positions = [], isLoading: loading, isError, error, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: tradingKeys.stakingPositions(userId),
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('staking_positions')
        .select('*')
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

  const stake = useCallback(async (term: string, amount: string) => {
    const reqId = stakeIdRef.current ?? (stakeIdRef.current = newRequestId());
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_stake_phon', { p_term: term, p_amount: amount, p_client_request_id: reqId });
      if (e) throw e;
      invalidateWallet();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) { setError(translateError(err)); return null; }
    finally { setBusy(false); stakeIdRef.current = null; }
  }, [invalidateWallet, onChange]);

  const stakePool = useCallback(async (
    referenceAsset: string,
    stakeCurrency: 'USDT' | 'PHON',
    term: string,
    amount: string,
  ) => {
    const reqId = stakeIdRef.current ?? (stakeIdRef.current = newRequestId());
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_stake', {
        p_reference_asset: referenceAsset,
        p_stake_currency: stakeCurrency,
        p_term: term,
        p_amount: amount,
        p_client_request_id: reqId,
      });
      if (e) throw e;
      invalidateWallet();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) { setError(translateError(err)); return null; }
    finally { setBusy(false); stakeIdRef.current = null; }
  }, [invalidateWallet, onChange]);

  const unstake = useCallback(async (positionId: string) => {
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_unstake_phon', { p_position_id: positionId });
      if (e) throw e;
      invalidateWallet();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) { setError(translateError(err)); return null; }
    finally { setBusy(false); }
  }, [invalidateWallet, onChange]);

  const claim = useCallback(async (positionId: string) => {
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc('rpc_claim_staking_reward', { p_position_id: positionId });
      if (e) throw e;
      invalidateWallet();
      onChange?.();
      return data as Record<string, unknown>;
    } catch (err) { setError(translateError(err)); return null; }
    finally { setBusy(false); }
  }, [invalidateWallet, onChange]);

  return { stake, stakePool, unstake, claim, busy, error };
}

// ─── Error translation ─────────────────────────────────────────
// Maps a raw RPC exception to a stable i18n message key.
