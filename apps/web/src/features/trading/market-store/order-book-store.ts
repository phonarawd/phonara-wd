import type { BookSnapshot, PriceLevel } from '@phonara/market-display';

import { resolveDisplayFeedStale } from '@/features/trading/display-chart/display-feed-stale';

export type OrderBookView = {
  symbol: string;
  bids: PriceLevel[];
  asks: PriceLevel[];
  lastUpdateId: number;
  /** Last worker message receive time (display-only). */
  receivedAtMs: number | null;
  /** True when exchange book feed exceeds stale threshold. */
  feedStale: boolean;
};

const EMPTY: OrderBookView = {
  symbol: '',
  bids: [],
  asks: [],
  lastUpdateId: 0,
  receivedAtMs: null,
  feedStale: false,
};

type Listener = () => void;

export type OrderBookSnapshotInput = BookSnapshot & {
  receivedAtMs?: number;
};

class OrderBookStore {
  private books = new Map<string, OrderBookView>();
  private emptySnapshots = new Map<string, OrderBookView>();
  private listeners = new Map<string, Set<Listener>>();

  subscribe(symbol: string, listener: Listener): () => void {
    const key = symbol.toUpperCase();
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
    };
  }

  getSnapshot(symbol: string): OrderBookView {
    const key = symbol.toUpperCase();
    const hit = this.books.get(key);
    if (hit) return hit;
    let empty = this.emptySnapshots.get(key);
    if (!empty) {
      empty = { ...EMPTY, symbol: key };
      this.emptySnapshots.set(key, empty);
    }
    return empty;
  }

  getServerSnapshot(symbol: string): OrderBookView {
    return this.getSnapshot(symbol);
  }

  setSnapshot(snapshot: OrderBookSnapshotInput): void {
    const key = snapshot.symbol.toUpperCase();
    const receivedAtMs = snapshot.receivedAtMs ?? Date.now();
    this.books.set(key, {
      symbol: key,
      bids: snapshot.bids ?? [],
      asks: snapshot.asks ?? [],
      lastUpdateId: snapshot.lastUpdateId ?? 0,
      receivedAtMs,
      feedStale: resolveDisplayFeedStale(receivedAtMs, 'book'),
    });
    this.emit(key);
  }

  tickFeedStale(nowMs = Date.now()): void {
    for (const [symbol, book] of this.books) {
      const nextStale = resolveDisplayFeedStale(book.receivedAtMs, 'book', nowMs);
      if (nextStale === book.feedStale) continue;
      this.books.set(symbol, { ...book, feedStale: nextStale });
      this.emit(symbol);
    }
  }

  private emit(symbol: string): void {
    const set = this.listeners.get(symbol);
    if (!set) return;
    for (const listener of set) {
      listener();
    }
  }
}

export const orderBookStore = new OrderBookStore();
