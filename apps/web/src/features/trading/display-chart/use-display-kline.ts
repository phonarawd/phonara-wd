import { useCallback, useSyncExternalStore } from 'react';
import { createWsHeartbeatWatch, type WsHeartbeatWatch } from '@/workers/market-data-heartbeat';
import { DISPLAY_FEED_STALE_TICK_MS, resolveDisplayFeedStale } from './display-feed-stale';
import {
  DISPLAY_ONLY_FEED,
  parseBinanceKlineWsTick,
  parseBybitKlineWsMessage,
  type DisplayKlineCandle,
} from './display-feed-contract';
import { fetchMarketDataProxy } from './market-data-proxy-client';
import {
  advanceKlineProviderOnFailure,
  createInitialKlineProviderState,
  createReconnectScheduler,
  noteKlineWsConnected,
  noteKlineWsDisconnected,
  resetKlineProviderToBinance,
  resolveKlineConnectProvider,
  shouldReturnKlineToBinance,
  type KlineFeedProvider,
  type KlineProviderState,
} from './display-kline-reconnect';
import { resolveExchangePair } from './resolve-exchange-symbol';

export type DisplayKlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export type { DisplayCandle, DisplayKlineCandle } from './display-feed-contract';

export type DisplayKlineSnapshot = {
  candles: DisplayKlineCandle[];
  lastPrice: string | null;
  connected: boolean;
  error: boolean;
  historyReady: boolean;
  displayOnly: typeof DISPLAY_ONLY_FEED;
  lastReceivedAtMs: number | null;
  feedStale: boolean;
};

const EMPTY_SNAPSHOT: DisplayKlineSnapshot = {
  candles: [],
  lastPrice: null,
  connected: false,
  error: false,
  historyReady: false,
  displayOnly: DISPLAY_ONLY_FEED,
  lastReceivedAtMs: null,
  feedStale: false,
};

type SharedEntry = {
  state: DisplayKlineSnapshot;
  listeners: Set<() => void>;
  refcount: number;
  dispose: (() => void) | null;
};

const sharedEntries = new Map<string, SharedEntry>();

function isE2eChartFeedDisabled(): boolean {
  return import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1';
}

function isPhonDisplaySymbol(symbol: string): boolean {
  return symbol === 'PHONUSDT-PERP' || symbol.startsWith('PHON');
}

function wsSymbol(symbol: string): string {
  const pair = resolveExchangePair(symbol);
  return pair ? pair.toLowerCase() : '';
}

function intervalParam(interval: DisplayKlineInterval): string {
  if (interval === '1d') return '1d';
  if (interval === '1w') return '1w';
  return interval;
}

function bybitIntervalParam(interval: DisplayKlineInterval): string {
  const map: Record<DisplayKlineInterval, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W',
  };
  return map[interval];
}

function sharedKey(symbol: string, interval: DisplayKlineInterval): string {
  return `${symbol.toUpperCase()}:${interval}`;
}

// History (REST) is fetched through `market-data-proxy` (ZA-12) — direct
// browser calls to api.bybit.com/api.binance.com are blocked by CORS for
// some visitors. Live WS streams below stay direct (CORS does not gate WS).
async function fetchBybitKlineHistory(
  symbol: string,
  interval: DisplayKlineInterval,
): Promise<DisplayKlineCandle[]> {
  if (isPhonDisplaySymbol(symbol)) return [];
  const pair = resolveExchangePair(symbol);
  if (!pair) return [];
  const res = await fetchMarketDataProxy({
    provider: 'bybit',
    op: 'klines',
    symbol: pair,
    interval,
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    result?: { list?: string[][] };
  };
  const rows = json.result?.list ?? [];
  return rows
    .map((r) => ({
      time: Math.floor(Number(r[0]) / 1000),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }))
    .reverse();
}

async function fetchBinanceKlineHistory(
  symbol: string,
  interval: DisplayKlineInterval,
): Promise<DisplayKlineCandle[]> {
  if (isPhonDisplaySymbol(symbol)) return [];
  const pair = resolveExchangePair(symbol);
  if (!pair) return [];
  const res = await fetchMarketDataProxy({
    provider: 'binance',
    op: 'klines',
    symbol: pair,
    interval,
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as unknown[][];
  return rows.map((r) => ({
    time: Math.floor(Number(r[0]) / 1000),
    open: Number(r[1]),
    high: Number(r[2]),
    low: Number(r[3]),
    close: Number(r[4]),
    volume: Number(r[5]),
  }));
}

async function fetchKlineHistory(
  symbol: string,
  interval: DisplayKlineInterval,
): Promise<DisplayKlineCandle[]> {
  if (isPhonDisplaySymbol(symbol)) return [];
  const [binance, bybit] = await Promise.allSettled([
    fetchBinanceKlineHistory(symbol, interval),
    fetchBybitKlineHistory(symbol, interval),
  ]);
  const candidates = [
    binance.status === 'fulfilled' ? binance.value : [],
    bybit.status === 'fulfilled' ? bybit.value : [],
  ];
  return candidates.find((rows) => rows.length > 0) ?? [];
}

function closeWsSilently(
  wsRef: { current: WebSocket | null },
  heartbeatRef: { current: WsHeartbeatWatch | null },
) {
  heartbeatRef.current?.dispose();
  heartbeatRef.current = null;
  const ws = wsRef.current;
  wsRef.current = null;
  if (!ws) return;
  ws.onopen = null;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;
  try {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  } catch {
    /* ignore teardown races */
  }
}

function emit(key: string): void {
  const entry = sharedEntries.get(key);
  if (!entry) return;
  for (const listener of entry.listeners) {
    listener();
  }
}

function patchState(key: string, patch: Partial<DisplayKlineSnapshot>): void {
  const entry = sharedEntries.get(key);
  if (!entry) return;
  entry.state = { ...entry.state, ...patch };
  emit(key);
}

function startSharedSubscription(
  key: string,
  symbol: string,
  interval: DisplayKlineInterval,
): () => void {
  let cancelled = false;
  let cancelledWs = false;
  let providerState: KlineProviderState = createInitialKlineProviderState();
  const reconnectScheduler = createReconnectScheduler();
  let staleTimer: ReturnType<typeof setInterval> | null = null;
  const wsRef: { current: WebSocket | null } = { current: null };
  const heartbeatRef: { current: WsHeartbeatWatch | null } = { current: null };
  const rafRef: { current: number | null } = { current: null };
  const pendingRef: { current: DisplayKlineCandle | null } = { current: null };

  const flushPending = () => {
    rafRef.current = null;
    const next = pendingRef.current;
    if (!next) return;
    pendingRef.current = null;
    const entry = sharedEntries.get(key);
    if (!entry) return;
    const prev = entry.state.candles;
    const idx = prev.findIndex((c) => c.time === next.time);
    let candles: DisplayKlineCandle[];
    if (idx >= 0) {
      candles = prev.slice();
      candles[idx] = next;
    } else {
      candles = [...prev, next].sort((a, b) => a.time - b.time).slice(-500);
    }
    const receivedAtMs = Date.now();
    patchState(key, {
      candles,
      lastPrice: String(next.close),
      lastReceivedAtMs: receivedAtMs,
      feedStale: resolveDisplayFeedStale(receivedAtMs, 'kline', receivedAtMs),
    });
  };

  const applyKlineTick = (tick: DisplayKlineCandle) => {
    pendingRef.current = tick;
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flushPending);
    }
  };

  patchState(key, {
    candles: [],
    lastPrice: null,
    connected: false,
    error: false,
    historyReady: false,
    lastReceivedAtMs: null,
    feedStale: false,
  });

  if (isE2eChartFeedDisabled()) {
    patchState(key, { historyReady: true, error: false });
    return () => {
      cancelled = true;
      cancelledWs = true;
    };
  }

  void fetchKlineHistory(symbol, interval).then((seed) => {
    if (cancelled) return;
    if (seed.length > 0) {
      const receivedAtMs = Date.now();
      patchState(key, {
        candles: seed,
        lastPrice: String(seed[seed.length - 1]?.close ?? ''),
        error: false,
        lastReceivedAtMs: receivedAtMs,
        feedStale: resolveDisplayFeedStale(receivedAtMs, 'kline', receivedAtMs),
      });
    } else if (!isPhonDisplaySymbol(symbol)) {
      patchState(key, { error: true });
    }
    patchState(key, { historyReady: true });
  });

  const scheduleReconnect = (retry: () => void) => {
    if (cancelled || cancelledWs) return;
    reconnectScheduler.schedule(retry);
  };

  const onWsFailed = (retry: () => void) => {
    patchState(key, { connected: false });
    providerState = advanceKlineProviderOnFailure(providerState);
    if (!cancelled && !cancelledWs) {
      scheduleReconnect(retry);
    }
  };

  const connectBinance = () => {
    const stream = `${wsSymbol(symbol)}@kline_${intervalParam(interval)}`;
    const url = `wss://stream.binance.com:9443/ws/${stream}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled || cancelledWs) return;
      reconnectScheduler.reset();
      providerState = noteKlineWsConnected(providerState);
      patchState(key, { connected: true, error: false });
      heartbeatRef.current?.dispose();
      heartbeatRef.current = createWsHeartbeatWatch({
        mode: 'inactivity-only',
        onStale: () => {
          if (cancelled || cancelledWs) return;
          providerState = noteKlineWsDisconnected(providerState);
          closeWsSilently(wsRef, heartbeatRef);
          onWsFailed(connect);
        },
      });
      heartbeatRef.current.touch();
    };

    ws.onmessage = (ev) => {
      if (cancelled) return;
      heartbeatRef.current?.touch();
      const tick = parseBinanceKlineWsTick(String(ev.data));
      if (tick) applyKlineTick(tick);
    };

    ws.onerror = () => {
      if (!cancelled) patchState(key, { error: true });
    };

    ws.onclose = () => {
      if (cancelled || cancelledWs) return;
      onWsFailed(connect);
    };
  };

  const connectBybit = () => {
    const pair = resolveExchangePair(symbol)?.toUpperCase();
    if (!pair) return;
    const ws = new WebSocket('wss://stream.bybit.com/v5/public/spot');
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled || cancelledWs) return;
      ws.send(
        JSON.stringify({
          op: 'subscribe',
          args: [`kline.${bybitIntervalParam(interval)}.${pair}`],
        }),
      );
      reconnectScheduler.reset();
      providerState = noteKlineWsConnected(providerState);
      patchState(key, { connected: true, error: false });
      heartbeatRef.current?.dispose();
      heartbeatRef.current = createWsHeartbeatWatch({
        mode: 'bybit-ping',
        sendPing: () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 'ping' }));
          }
        },
        onStale: () => {
          if (cancelled || cancelledWs) return;
          providerState = noteKlineWsDisconnected(providerState);
          closeWsSilently(wsRef, heartbeatRef);
          scheduleReconnect(connect);
        },
      });
      heartbeatRef.current.touch();
    };

    ws.onmessage = (ev) => {
      if (cancelled) return;
      const parsed = parseBybitKlineWsMessage(String(ev.data));
      if (!parsed) return;
      if (parsed.kind === 'pong') {
        heartbeatRef.current?.notePong();
        return;
      }
      heartbeatRef.current?.touch();
      applyKlineTick(parsed.candle);
    };

    ws.onerror = () => {
      if (!cancelled) patchState(key, { error: true });
    };

    ws.onclose = () => {
      if (cancelled || cancelledWs) return;
      providerState = noteKlineWsDisconnected(providerState);
      scheduleReconnect(connect);
    };
  };

  const connect = (opts?: { preferPrimaryRetry?: boolean }) => {
    if (cancelled || cancelledWs || isPhonDisplaySymbol(symbol)) return;
    if (!wsSymbol(symbol)) return;
    const resolved = resolveKlineConnectProvider({
      state: providerState,
      preferPrimaryRetry: opts?.preferPrimaryRetry,
    });
    providerState = resolved.state;
    const provider: KlineFeedProvider = resolved.provider;
    closeWsSilently(wsRef, heartbeatRef);
    try {
      if (provider === 'binance') connectBinance();
      else connectBybit();
    } catch {
      patchState(key, { error: true });
      onWsFailed(connect);
    }
  };

  if (!isPhonDisplaySymbol(symbol)) {
    connect();
  }

  staleTimer = setInterval(() => {
    const entry = sharedEntries.get(key);
    if (!entry) return;
    const nextStale = resolveDisplayFeedStale(entry.state.lastReceivedAtMs, 'kline');
    if (nextStale !== entry.state.feedStale) {
      patchState(key, { feedStale: nextStale });
    }
    if (!cancelled && !cancelledWs && shouldReturnKlineToBinance(providerState)) {
      providerState = resetKlineProviderToBinance();
      reconnectScheduler.reset();
      connect();
    }
  }, DISPLAY_FEED_STALE_TICK_MS);

  const onVisibility = () => {
    if (document.hidden) {
      reconnectScheduler.cancel();
      closeWsSilently(wsRef, heartbeatRef);
      providerState = noteKlineWsDisconnected(providerState);
      patchState(key, { connected: false });
    } else if (
      !isPhonDisplaySymbol(symbol) &&
      (!wsRef.current || wsRef.current.readyState > WebSocket.OPEN)
    ) {
      reconnectScheduler.reset();
      connect({ preferPrimaryRetry: true });
    }
  };

  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    cancelled = true;
    cancelledWs = true;
    document.removeEventListener('visibilitychange', onVisibility);
    reconnectScheduler.cancel();
    if (staleTimer != null) clearInterval(staleTimer);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    closeWsSilently(wsRef, heartbeatRef);
  };
}

function acquireShared(
  symbol: string,
  interval: DisplayKlineInterval,
  listener: () => void,
): () => void {
  const key = sharedKey(symbol, interval);
  let entry = sharedEntries.get(key);
  if (!entry) {
    entry = {
      state: { ...EMPTY_SNAPSHOT },
      listeners: new Set(),
      refcount: 0,
      dispose: null,
    };
    sharedEntries.set(key, entry);
    entry.dispose = startSharedSubscription(key, symbol, interval);
  }
  entry.refcount += 1;
  entry.listeners.add(listener);
  return () => {
    const current = sharedEntries.get(key);
    if (!current) return;
    current.listeners.delete(listener);
    current.refcount -= 1;
    if (current.refcount <= 0) {
      current.dispose?.();
      sharedEntries.delete(key);
    }
  };
}

function readSnapshot(symbol: string, interval: DisplayKlineInterval): DisplayKlineSnapshot {
  return sharedEntries.get(sharedKey(symbol, interval))?.state ?? EMPTY_SNAPSHOT;
}

/**
 * Display-only kline stream (Binance → Bybit fallback). Never used for settlement.
 * One WebSocket per symbol+interval — shared across chart and header hooks.
 */
export function useDisplayKline(
  symbol: string | null,
  interval: DisplayKlineInterval = '1m',
  enabled = true,
) {
  const sym = symbol?.toUpperCase() ?? '';
  const active = Boolean(sym && enabled);

  const subscribe = useCallback(
    (listener: () => void) => (active ? acquireShared(sym, interval, listener) : () => {}),
    [active, interval, sym],
  );

  const getSnapshot = useCallback(
    () => (active ? readSnapshot(sym, interval) : EMPTY_SNAPSHOT),
    [active, interval, sym],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
