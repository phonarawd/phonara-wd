import type { BookSnapshot, PriceLevel } from "@phonara/market-display";

export type OrderBookView = {
  symbol: string;
  bids: PriceLevel[];
  asks: PriceLevel[];
  lastUpdateId: number;
};

const EMPTY: OrderBookView = {
  symbol: "",
  bids: [],
  asks: [],
  lastUpdateId: 0,
};

type Listener = () => void;

class OrderBookStore {
  private books = new Map<string, OrderBookView>();
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
    return this.books.get(symbol.toUpperCase()) ?? { ...EMPTY, symbol };
  }

  getServerSnapshot(symbol: string): OrderBookView {
    return this.getSnapshot(symbol);
  }

  setSnapshot(snapshot: BookSnapshot): void {
    const key = snapshot.symbol.toUpperCase();
    this.books.set(key, {
      symbol: key,
      bids: snapshot.bids,
      asks: snapshot.asks,
      lastUpdateId: snapshot.lastUpdateId,
    });
    this.emit(key);
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
