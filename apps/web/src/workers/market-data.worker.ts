import * as Comlink from "comlink";
import type { BookSnapshot } from "@phonara/market-display";
import { applyBookDelta, createSequenceGuard } from "@phonara/market-display";

export type MarketDataWorkerApi = {
  subscribeOrderBook(symbol: string): Promise<void>;
  unsubscribeOrderBook(symbol: string): Promise<void>;
};

type PortMessage = {
  type: "book";
  snapshot: BookSnapshot;
};

let ws: WebSocket | null = null;
let activeSymbol: string | null = null;
let guard = createSequenceGuard({ symbol: "", bids: [], asks: [], lastUpdateId: 0 });
let rafId: number | null = null;
let pendingSnapshot: BookSnapshot | null = null;

function postSnapshot(snapshot: BookSnapshot) {
  pendingSnapshot = snapshot;
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    if (pendingSnapshot) {
      const msg: PortMessage = { type: "book", snapshot: pendingSnapshot };
      self.postMessage(msg);
      pendingSnapshot = null;
    }
  });
}

async function seedDepth(symbol: string): Promise<BookSnapshot> {
  const res = await fetch(
    `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol.toUpperCase()}&limit=1000`,
  );
  const data = (await res.json()) as {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
  };
  const snapshot: BookSnapshot = {
    symbol: symbol.toUpperCase(),
    bids: data.bids,
    asks: data.asks,
    lastUpdateId: data.lastUpdateId,
  };
  guard = createSequenceGuard(snapshot);
  return snapshot;
}

function connectWs(symbol: string) {
  ws?.close();
  const stream = `${symbol.toLowerCase()}@depth@100ms`;
  ws = new WebSocket(`wss://fstream.binance.com/ws/${stream}`);
  ws.onmessage = (ev) => {
    const payload = JSON.parse(String(ev.data)) as {
      u: number;
      U: number;
      b: [string, string][];
      a: [string, string][];
    };
    const next = applyBookDelta(guard, {
      symbol: symbol.toUpperCase(),
      U: payload.U,
      u: payload.u,
      bids: payload.b,
      asks: payload.a,
    });
    guard = next;
    if (next.needsReseed) {
      void seedDepth(symbol).then(postSnapshot);
      return;
    }
    postSnapshot({
      symbol: symbol.toUpperCase(),
      bids: payload.b,
      asks: payload.a,
      lastUpdateId: payload.u,
    });
  };
}

const api: MarketDataWorkerApi = {
  async subscribeOrderBook(symbol: string) {
    const sym = symbol.toUpperCase();
    if (activeSymbol === sym) return;
    activeSymbol = sym;
    const snapshot = await seedDepth(sym);
    postSnapshot(snapshot);
    connectWs(sym);
  },
  async unsubscribeOrderBook(symbol: string) {
    if (activeSymbol !== symbol.toUpperCase()) return;
    ws?.close();
    ws = null;
    activeSymbol = null;
  },
};

Comlink.expose(api);
