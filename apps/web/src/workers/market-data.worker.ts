import * as Comlink from 'comlink';
import type { BookSnapshot, PriceLevel } from '@phonara/market-display';
import { applyBookDelta, createSequenceGuard } from '@phonara/market-display';
import { toDecimal } from '@phonara/money';
import { createRafBatcher } from './market-data-emit-scheduler';
import { createWsHeartbeatWatch, type WsHeartbeatWatch } from './market-data-heartbeat';
import { createReconnectScheduler, parseWsJson } from './market-data-reconnect';
import type { Ticker24hSnapshot } from '@/features/trading/display-chart/display-feed-contract';
import { fetchMarketDataProxy } from '@/features/trading/display-chart/market-data-proxy-client';

export type { Ticker24hSnapshot } from '@/features/trading/display-chart/display-feed-contract';

export type MarketDataWorkerApi = {
  subscribeOrderBook(symbol: string): Promise<void>;
  unsubscribeOrderBook(symbol: string): Promise<void>;
  subscribeTickers(symbols: readonly string[]): Promise<void>;
  unsubscribeTickers(symbols: readonly string[]): Promise<void>;
};

type PortMessage =
  | { type: 'book'; snapshot: BookSnapshot; receivedAtMs: number }
  | { type: 'ticker'; snapshot: Ticker24hSnapshot; receivedAtMs: number };

type DepthWsPayload = {
  u: number;
  U: number;
  b: [string, string][];
  a: [string, string][];
};

type TickerWsPayload = {
  data?: Record<string, unknown>;
};

function isE2eMarketFeedDisabled(): boolean {
  return import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1';
}

function e2eStubBook(symbol: string): BookSnapshot {
  return {
    symbol: symbol.toUpperCase(),
    bids: [['68000', '1.000']],
    asks: [['68001', '1.000']],
    lastUpdateId: 1,
  };
}

function e2eStubTicker(symbol: string): Ticker24hSnapshot {
  return {
    symbol: symbol.toUpperCase(),
    lastPrice: '68000',
    priceChangePercent: '0',
    volume: '0',
    quoteVolume: '0',
    highPrice: '68000',
    lowPrice: '68000',
    openInterest: '0',
  };
}

let ws: WebSocket | null = null;
let tickerWs: WebSocket | null = null;
let activeSymbol: string | null = null;
const tickerSymbols = new Set<string>();
/** Stable sorted stream key for the current ticker multiplex socket. */
let tickerStreamKey: string | null = null;
let guard = createSequenceGuard({ symbol: '', bids: [], asks: [], lastUpdateId: 0 });
let currentBook: BookSnapshot = { symbol: '', bids: [], asks: [], lastUpdateId: 0 };
let pendingSnapshot: BookSnapshot | null = null;
let pendingTicker: Ticker24hSnapshot | null = null;
let depthIntentionalClose = false;
let tickerIntentionalClose = false;
let depthHeartbeat: WsHeartbeatWatch | null = null;
let tickerHeartbeat: WsHeartbeatWatch | null = null;

const depthReconnect = createReconnectScheduler();
const tickerReconnect = createReconnectScheduler();

const bookEmitter = createRafBatcher(() => {
  if (pendingSnapshot) {
    emitBook(pendingSnapshot);
    pendingSnapshot = null;
  }
});

const tickerEmitter = createRafBatcher(() => {
  if (pendingTicker) {
    emitTicker(pendingTicker);
    pendingTicker = null;
  }
});

function postBookSnapshot(snapshot: BookSnapshot) {
  pendingSnapshot = snapshot;
  bookEmitter.schedule();
}

function postTickerSnapshot(snapshot: Ticker24hSnapshot) {
  pendingTicker = snapshot;
  tickerEmitter.schedule();
}

function emitBook(snapshot: BookSnapshot) {
  const msg: PortMessage = { type: 'book', snapshot, receivedAtMs: Date.now() };
  postMessage(msg);
}

function emitTicker(snapshot: Ticker24hSnapshot) {
  const msg: PortMessage = { type: 'ticker', snapshot, receivedAtMs: Date.now() };
  postMessage(msg);
}

function parseTickerPayload(raw: Record<string, unknown>): Ticker24hSnapshot | null {
  const symbol = String(raw['s'] ?? raw['symbol'] ?? '').toUpperCase();
  if (!symbol) return null;
  return {
    symbol,
    lastPrice: String(raw['c'] ?? raw['lastPrice'] ?? '0'),
    priceChangePercent: String(raw['P'] ?? raw['priceChangePercent'] ?? '0'),
    volume: String(raw['v'] ?? raw['volume'] ?? '0'),
    quoteVolume: String(raw['q'] ?? raw['quoteVolume'] ?? '0'),
    highPrice: String(raw['h'] ?? raw['highPrice'] ?? '0'),
    lowPrice: String(raw['l'] ?? raw['lowPrice'] ?? '0'),
    openInterest: '0',
  };
}

function mergeLevels(
  current: PriceLevel[] | undefined,
  delta: PriceLevel[] | undefined,
): PriceLevel[] {
  const map = new Map((current ?? []).map(([price, qty]) => [price, qty]));
  for (const [price, qty] of delta ?? []) {
    try {
      if (toDecimal(qty).isZero()) map.delete(price);
      else map.set(price, qty);
    } catch {
      /* skip malformed delta row */
    }
  }
  return [...map.entries()];
}

// Depth/ticker REST snapshots go through `market-data-proxy` (ZA-12) — direct
// browser fetches to api.binance.com are blocked by CORS for some visitors.
// The live depth WS below stays direct (CORS does not gate the WS handshake).
async function seedDepth(symbol: string): Promise<BookSnapshot> {
  const res = await fetchMarketDataProxy({ provider: 'binance', op: 'depth', symbol });
  if (!res.ok) {
    throw new Error(`depth_fetch_failed:${res.status}`);
  }
  const data = (await res.json()) as {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
  };
  const snapshot: BookSnapshot = {
    symbol: symbol.toUpperCase(),
    bids: data.bids ?? [],
    asks: data.asks ?? [],
    lastUpdateId: data.lastUpdateId ?? 0,
  };
  guard = createSequenceGuard(snapshot);
  currentBook = snapshot;
  return snapshot;
}

async function seedTicker(symbol: string): Promise<void> {
  const sym = symbol.toUpperCase();
  const tickerRes = await fetchMarketDataProxy({
    provider: 'binance',
    op: 'ticker24h',
    symbol: sym,
  });
  if (!tickerRes.ok) return;
  const data = (await tickerRes.json()) as Record<string, unknown>;
  const snapshot = parseTickerPayload(data);
  if (snapshot) postTickerSnapshot(snapshot);
}

async function seedAllTickers(): Promise<void> {
  await Promise.all([...tickerSymbols].map((sym) => seedTicker(sym)));
}

function disposeDepthHeartbeat() {
  depthHeartbeat?.dispose();
  depthHeartbeat = null;
}

function disposeTickerHeartbeat() {
  tickerHeartbeat?.dispose();
  tickerHeartbeat = null;
}

function closeDepthWs(intentional: boolean) {
  disposeDepthHeartbeat();
  depthIntentionalClose = intentional;
  ws?.close();
  ws = null;
}

function scheduleDepthReconnect(symbol: string) {
  depthReconnect.schedule(async () => {
    if (activeSymbol !== symbol.toUpperCase()) return;
    try {
      const snapshot = await seedDepth(symbol);
      postBookSnapshot(snapshot);
      connectWs(symbol);
    } catch {
      scheduleDepthReconnect(symbol);
    }
  });
}

function connectWs(symbol: string) {
  closeDepthWs(true);
  depthIntentionalClose = false;

  const sym = symbol.toUpperCase();
  const stream = `${symbol.toLowerCase()}@depth@100ms`;
  ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

  ws.onopen = () => {
    depthReconnect.reset();
    depthHeartbeat = createWsHeartbeatWatch({
      mode: 'inactivity-only',
      onStale: () => {
        if (activeSymbol === sym && ws) {
          closeDepthWs(false);
        }
      },
    });
    depthHeartbeat.touch();
  };

  ws.onmessage = (ev) => {
    depthHeartbeat?.touch();
    const payload = parseWsJson<DepthWsPayload>(String(ev.data));
    if (!payload) return;

    const next = applyBookDelta(guard, {
      symbol: sym,
      U: payload.U,
      u: payload.u,
      bids: payload.b,
      asks: payload.a,
    });
    guard = next;
    if (next.needsReseed) {
      void seedDepth(symbol)
        .then(postBookSnapshot)
        .catch(() => scheduleDepthReconnect(symbol));
      return;
    }
    currentBook = {
      symbol: sym,
      bids: mergeLevels(currentBook.bids, payload.b),
      asks: mergeLevels(currentBook.asks, payload.a),
      lastUpdateId: payload.u,
    };
    postBookSnapshot(currentBook);
  };

  ws.onerror = () => {
    /* onclose follows; reconnect scheduled there */
  };

  ws.onclose = () => {
    disposeDepthHeartbeat();
    ws = null;
    if (depthIntentionalClose || activeSymbol !== sym) return;
    scheduleDepthReconnect(symbol);
  };
}

function closeTickerWs(intentional: boolean) {
  disposeTickerHeartbeat();
  tickerIntentionalClose = intentional;
  tickerWs?.close();
  tickerWs = null;
}

function scheduleTickerReconnect() {
  tickerReconnect.schedule(async () => {
    if (tickerSymbols.size === 0) return;
    try {
      await seedAllTickers();
      connectTickerWs();
    } catch {
      scheduleTickerReconnect();
    }
  });
}

function connectTickerWs() {
  if (tickerSymbols.size === 0) {
    closeTickerWs(true);
    tickerStreamKey = null;
    return;
  }

  const streams = [...tickerSymbols]
    .map((sym) => `${sym.toLowerCase()}@ticker`)
    .sort()
    .join('/');

  // Skip reopen when the multiplex target is unchanged and the socket is still alive —
  // avoids Chrome "WebSocket is closed before the connection is established" spam.
  if (
    tickerWs &&
    tickerStreamKey === streams &&
    (tickerWs.readyState === WebSocket.CONNECTING || tickerWs.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  closeTickerWs(true);
  tickerIntentionalClose = false;
  tickerStreamKey = streams;
  tickerWs = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

  tickerWs.onopen = () => {
    tickerReconnect.reset();
    tickerHeartbeat = createWsHeartbeatWatch({
      mode: 'inactivity-only',
      onStale: () => {
        if (tickerSymbols.size > 0 && tickerWs) {
          closeTickerWs(false);
        }
      },
    });
    tickerHeartbeat.touch();
  };

  tickerWs.onmessage = (ev) => {
    tickerHeartbeat?.touch();
    const payload = parseWsJson<TickerWsPayload>(String(ev.data));
    if (!payload) return;
    const raw = payload.data ?? (payload as Record<string, unknown>);
    const snapshot = parseTickerPayload(raw);
    if (snapshot) postTickerSnapshot(snapshot);
  };

  tickerWs.onerror = () => {
    /* onclose follows; reconnect scheduled there */
  };

  tickerWs.onclose = () => {
    disposeTickerHeartbeat();
    tickerWs = null;
    tickerStreamKey = null;
    if (tickerIntentionalClose || tickerSymbols.size === 0) return;
    scheduleTickerReconnect();
  };
}

const api: MarketDataWorkerApi = {
  async subscribeOrderBook(symbol: string) {
    const sym = symbol.toUpperCase();
    if (activeSymbol === sym) return;
    depthReconnect.cancel();
    depthReconnect.reset();
    closeDepthWs(true);
    activeSymbol = sym;
    if (isE2eMarketFeedDisabled()) {
      postBookSnapshot(e2eStubBook(sym));
      return;
    }
    try {
      const snapshot = await seedDepth(sym);
      postBookSnapshot(snapshot);
      connectWs(sym);
    } catch {
      // Initial seed failed (proxy/upstream unavailable) — retry through the
      // same reconnect scheduler as WS drops instead of rejecting the
      // Comlink call and leaving no book/retry at all.
      scheduleDepthReconnect(sym);
    }
  },
  async unsubscribeOrderBook(symbol: string) {
    if (activeSymbol !== symbol.toUpperCase()) return;
    depthReconnect.cancel();
    closeDepthWs(true);
    activeSymbol = null;
  },
  async subscribeTickers(symbols: readonly string[]) {
    let changed = false;
    for (const sym of symbols) {
      const key = sym.toUpperCase();
      if (!tickerSymbols.has(key)) {
        tickerSymbols.add(key);
        changed = true;
        if (isE2eMarketFeedDisabled()) {
          postTickerSnapshot(e2eStubTicker(key));
        } else {
          void seedTicker(key);
        }
      }
    }
    if (changed && !isE2eMarketFeedDisabled()) {
      tickerReconnect.cancel();
      tickerReconnect.reset();
      connectTickerWs();
    }
  },
  async unsubscribeTickers(symbols: readonly string[]) {
    let changed = false;
    for (const sym of symbols) {
      const key = sym.toUpperCase();
      if (tickerSymbols.delete(key)) changed = true;
    }
    if (!changed) return;
    tickerReconnect.cancel();
    if (tickerSymbols.size === 0) {
      closeTickerWs(true);
      return;
    }
    connectTickerWs();
  },
};

Comlink.expose(api);
