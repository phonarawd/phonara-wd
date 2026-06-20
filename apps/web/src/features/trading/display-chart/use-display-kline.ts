import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveExchangePair } from './resolve-exchange-symbol';

export type DisplayKlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export type DisplayCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type BinanceKlineMsg = {
  k?: {
    t: number;
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    x: boolean;
  };
};

type BybitKlineMsg = {
  topic?: string;
  data?: Array<{
    start: number | string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
};

type FeedProvider = 'binance' | 'bybit';

function isPhonDisplaySymbol(symbol: string): boolean {
  return symbol === 'PHONUSDT-PERP' || symbol.startsWith('PHON');
}

function wsSymbol(symbol: string): string {
  const pair = resolveExchangePair(symbol);
  return pair ? pair.toLowerCase() : '';
}

function intervalParam(interval: DisplayKlineInterval): string {
  return interval === '1d' ? '1d' : interval;
}

function bybitIntervalParam(interval: DisplayKlineInterval): string {
  const map: Record<DisplayKlineInterval, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
  };
  return map[interval];
}

async function fetchBybitKlineHistory(
  symbol: string,
  interval: DisplayKlineInterval,
): Promise<DisplayCandle[]> {
  if (isPhonDisplaySymbol(symbol)) return [];
  const pair = resolveExchangePair(symbol);
  if (!pair) return [];
  const res = await fetch(
    `https://api.bybit.com/v5/market/kline?category=spot&symbol=${pair}&interval=${bybitIntervalParam(interval)}&limit=120`,
  );
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
): Promise<DisplayCandle[]> {
  if (isPhonDisplaySymbol(symbol)) return [];
  const pair = resolveExchangePair(symbol);
  if (!pair) return [];
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${intervalParam(interval)}&limit=120`,
  );
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
): Promise<DisplayCandle[]> {
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

function closeWsSilently(wsRef: { current: WebSocket | null }) {
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

function applyKlineTick(
  pendingRef: { current: DisplayCandle | null },
  rafRef: { current: number | null },
  flushPending: () => void,
  tick: DisplayCandle,
) {
  pendingRef.current = tick;
  if (rafRef.current == null) {
    rafRef.current = requestAnimationFrame(flushPending);
  }
}

/**
 * Display-only kline stream (Binance → Bybit fallback). Never used for settlement.
 */
export function useDisplayKline(
  symbol: string | null,
  interval: DisplayKlineInterval = '1m',
  enabled = true,
) {
  const [candles, setCandles] = useState<DisplayCandle[]>([]);
  const [lastPrice, setLastPrice] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<DisplayCandle | null>(null);

  const flushPending = useCallback(() => {
    rafRef.current = null;
    const next = pendingRef.current;
    if (!next) return;
    pendingRef.current = null;
    setCandles((prev) => {
      const idx = prev.findIndex((c) => c.time === next.time);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = next;
        return copy;
      }
      const merged = [...prev, next].sort((a, b) => a.time - b.time);
      return merged.slice(-500);
    });
    setLastPrice(String(next.close));
  }, []);

  useEffect(() => {
    if (!symbol || !enabled || typeof document === 'undefined') {
      setConnected(false);
      setCandles([]);
      setHistoryReady(false);
      return;
    }

    let cancelled = false;
    let cancelledWs = false;
    let provider: FeedProvider = 'binance';
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    setCandles([]);
    setError(false);
    setHistoryReady(false);

    void fetchKlineHistory(symbol, interval).then((seed) => {
      if (cancelled) return;
      if (seed.length > 0) {
        setCandles(seed);
        setLastPrice(String(seed[seed.length - 1]?.close ?? ''));
        setError(false);
      } else if (!isPhonDisplaySymbol(symbol)) {
        setError(true);
      }
      setHistoryReady(true);
    });

    const scheduleReconnect = () => {
      if (cancelled || cancelledWs || reconnectTimer != null) return;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 3000);
    };

    const onWsFailed = () => {
      setConnected(false);
      if (provider === 'binance') {
        provider = 'bybit';
      }
      if (!cancelled && !cancelledWs) {
        scheduleReconnect();
      }
    };

    const connectBinance = () => {
      const stream = `${wsSymbol(symbol)}@kline_${intervalParam(interval)}`;
      const url = `wss://stream.binance.com:9443/ws/${stream}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled || cancelledWs) return;
        setConnected(true);
        setError(false);
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(String(ev.data)) as BinanceKlineMsg;
          const k = payload.k;
          if (!k) return;
          applyKlineTick(pendingRef, rafRef, flushPending, {
            time: Math.floor(k.t / 1000),
            open: Number(k.o),
            high: Number(k.h),
            low: Number(k.l),
            close: Number(k.c),
            volume: Number(k.v),
          });
        } catch {
          /* ignore malformed tick */
        }
      };

      ws.onerror = () => {
        if (!cancelled) setError(true);
      };

      ws.onclose = () => {
        if (cancelled || cancelledWs) return;
        onWsFailed();
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
        setConnected(true);
        setError(false);
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(String(ev.data)) as BybitKlineMsg;
          const k = payload.data?.[0];
          if (!k || !payload.topic?.startsWith('kline.')) return;
          applyKlineTick(pendingRef, rafRef, flushPending, {
            time: Math.floor(Number(k.start) / 1000),
            open: Number(k.open),
            high: Number(k.high),
            low: Number(k.low),
            close: Number(k.close),
            volume: Number(k.volume),
          });
        } catch {
          /* ignore malformed tick */
        }
      };

      ws.onerror = () => {
        if (!cancelled) setError(true);
      };

      ws.onclose = () => {
        if (cancelled || cancelledWs) return;
        scheduleReconnect();
      };
    };

    const connect = () => {
      if (cancelled || cancelledWs || isPhonDisplaySymbol(symbol)) return;
      if (!wsSymbol(symbol)) return;
      closeWsSilently(wsRef);
      try {
        if (provider === 'binance') connectBinance();
        else connectBybit();
      } catch {
        setError(true);
        onWsFailed();
      }
    };

    if (!isPhonDisplaySymbol(symbol)) {
      connect();
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (reconnectTimer != null) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        closeWsSilently(wsRef);
        setConnected(false);
      } else if (
        !isPhonDisplaySymbol(symbol) &&
        (!wsRef.current || wsRef.current.readyState > WebSocket.OPEN)
      ) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      cancelledWs = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (reconnectTimer != null) clearTimeout(reconnectTimer);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      closeWsSilently(wsRef);
    };
  }, [symbol, interval, enabled, flushPending]);

  return {
    candles,
    lastPrice,
    connected,
    error,
    historyReady,
    displayOnly: true as const,
  };
};
