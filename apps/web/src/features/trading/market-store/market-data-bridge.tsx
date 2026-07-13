import { useEffect, useMemo, useRef } from 'react';
import { wrap, type Remote } from 'comlink';
import type { BookSnapshot } from '@phonara/market-display';

import { resolveExchangePair } from '@/features/trading/display-chart/resolve-exchange-symbol';
import { createRafBatcher } from '@/workers/market-data-emit-scheduler';
import type { MarketDataWorkerApi, Ticker24hSnapshot } from '@/workers/market-data.worker';

import { retainDisplayFeedStaleWatch } from './display-feed-stale-watch';
import { orderBookStore } from './order-book-store';
import { tickerStore } from './ticker-store';

type WorkerPortMessage =
  | { type: 'book'; snapshot: BookSnapshot; receivedAtMs: number }
  | { type: 'ticker'; snapshot: Ticker24hSnapshot; receivedAtMs: number };

let worker: Worker | null = null;
let api: Remote<MarketDataWorkerApi> | null = null;
let bridgeReady = false;
const exchangeToPlatform = new Map<string, string>();
const orderBookRefCount = new Map<string, number>();
const tickerRefCount = new Map<string, number>();

function platformFromExchange(exchangeSymbol: string): string {
  return exchangeToPlatform.get(exchangeSymbol.toUpperCase()) ?? exchangeSymbol.toUpperCase();
}

let pendingBook: BookSnapshot | null = null;
let pendingTicker: Ticker24hSnapshot | null = null;

let pendingBookReceivedAtMs: number | null = null;
let pendingTickerReceivedAtMs: number | null = null;

const mainBookEmitter = createRafBatcher(() => {
  if (pendingBook) {
    orderBookStore.setSnapshot({
      ...pendingBook,
      receivedAtMs: pendingBookReceivedAtMs ?? Date.now(),
    });
    pendingBook = null;
    pendingBookReceivedAtMs = null;
  }
});

const mainTickerEmitter = createRafBatcher(() => {
  if (pendingTicker) {
    tickerStore.setSnapshot({
      ...pendingTicker,
      receivedAtMs: pendingTickerReceivedAtMs ?? Date.now(),
    });
    pendingTicker = null;
    pendingTickerReceivedAtMs = null;
  }
});

function ensureWorker(): Remote<MarketDataWorkerApi> {
  if (!worker) {
    worker = new Worker(new URL('../../../workers/market-data.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (ev: MessageEvent<WorkerPortMessage>) => {
      const msg = ev.data;
      if (msg.type === 'book') {
        pendingBook = {
          ...msg.snapshot,
          symbol: platformFromExchange(msg.snapshot.symbol),
        };
        pendingBookReceivedAtMs = msg.receivedAtMs;
        mainBookEmitter.schedule();
      }
      if (msg.type === 'ticker') {
        pendingTicker = {
          ...msg.snapshot,
          symbol: platformFromExchange(msg.snapshot.symbol),
        };
        pendingTickerReceivedAtMs = msg.receivedAtMs;
        mainTickerEmitter.schedule();
      }
    };
    api = wrap<MarketDataWorkerApi>(worker);
    bridgeReady = true;
  }
  return api!;
}

function registerPlatformSymbol(platformSymbol: string): string | null {
  const exchange = resolveExchangePair(platformSymbol);
  if (!exchange) return null;
  exchangeToPlatform.set(exchange.toUpperCase(), platformSymbol.toUpperCase());
  return exchange.toUpperCase();
}

function retain(refMap: Map<string, number>, key: string): void {
  refMap.set(key, (refMap.get(key) ?? 0) + 1);
}

function release(refMap: Map<string, number>, key: string): boolean {
  const next = (refMap.get(key) ?? 0) - 1;
  if (next <= 0) {
    refMap.delete(key);
    return true;
  }
  refMap.set(key, next);
  return false;
}

export function useMarketDataBridge(
  activeSymbol: string | null | undefined,
  marketSymbols: readonly string[],
) {
  const remote = useMemo(() => (bridgeReady ? ensureWorker() : ensureWorker()), []);
  const activeRef = useRef<string | null>(null);
  const tickersKey = useMemo(
    () =>
      marketSymbols
        .map((s) => s.toUpperCase())
        .sort()
        .join(','),
    [marketSymbols],
  );

  useEffect(() => retainDisplayFeedStaleWatch(), []);

  useEffect(() => {
    const platform = activeSymbol?.toUpperCase() ?? '';
    const exchange = platform ? registerPlatformSymbol(platform) : null;

    if (activeRef.current && activeRef.current !== exchange) {
      if (release(orderBookRefCount, activeRef.current)) {
        void remote.unsubscribeOrderBook(activeRef.current);
      }
    }

    if (exchange) {
      retain(orderBookRefCount, exchange);
      activeRef.current = exchange;
      void remote.subscribeOrderBook(exchange);
    } else {
      activeRef.current = null;
    }

    return () => {
      if (activeRef.current && release(orderBookRefCount, activeRef.current)) {
        void remote.unsubscribeOrderBook(activeRef.current);
      }
      activeRef.current = null;
    };
  }, [activeSymbol, remote]);

  useEffect(() => {
    // Depend on tickersKey only — parents often pass a fresh `marketSymbols`
    // array each render (`.map`), which would churn subscribe/unsubscribe and
    // abort CONNECTING Binance sockets ("WebSocket is closed before …").
    const platforms = tickersKey.length > 0 ? tickersKey.split(',') : [];
    const exchangeSymbols: string[] = [];
    for (const platform of platforms) {
      const exchange = registerPlatformSymbol(platform);
      if (exchange) exchangeSymbols.push(exchange);
    }

    for (const exchange of exchangeSymbols) {
      retain(tickerRefCount, exchange);
    }
    if (exchangeSymbols.length > 0) {
      void remote.subscribeTickers(exchangeSymbols);
    }

    return () => {
      const toRelease: string[] = [];
      for (const exchange of exchangeSymbols) {
        if (release(tickerRefCount, exchange)) toRelease.push(exchange);
      }
      if (toRelease.length > 0) void remote.unsubscribeTickers(toRelease);
    };
  }, [tickersKey, remote]);
}

/** Mount once per terminal surface to wire display-only exchange feeds. */
export function MarketDataBridge({
  activeSymbol,
  marketSymbols,
}: {
  activeSymbol: string | null | undefined;
  marketSymbols: readonly string[];
}) {
  useMarketDataBridge(activeSymbol, marketSymbols);
  return null;
}
