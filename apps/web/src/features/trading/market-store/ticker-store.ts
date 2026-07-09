import { resolveDisplayFeedStale } from '@/features/trading/display-chart/display-feed-stale';
import type { Ticker24hSnapshot } from '@/features/trading/display-chart/display-feed-contract';

/** Display-only 24h ticker view — wire snapshot + stale metadata (not settlement). */
export type Ticker24hView = Ticker24hSnapshot & {
  /** Last worker message receive time (display-only). */
  receivedAtMs: number | null;
  /** True when exchange ticker feed exceeds stale threshold. */
  feedStale: boolean;
};

const EMPTY: Ticker24hView = {
  symbol: '',
  lastPrice: '0',
  priceChangePercent: '0',
  volume: '0',
  quoteVolume: '0',
  highPrice: '0',
  lowPrice: '0',
  openInterest: '0',
  receivedAtMs: null,
  feedStale: false,
};

type Listener = () => void;

export type Ticker24hSnapshotInput = Omit<Ticker24hView, 'receivedAtMs' | 'feedStale'> & {
  receivedAtMs?: number;
};

class TickerStore {
  private tickers = new Map<string, Ticker24hView>();
  private emptySnapshots = new Map<string, Ticker24hView>();
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

  getSnapshot(symbol: string): Ticker24hView {
    const key = symbol.toUpperCase();
    const hit = this.tickers.get(key);
    if (hit) return hit;
    let empty = this.emptySnapshots.get(key);
    if (!empty) {
      empty = { ...EMPTY, symbol: key };
      this.emptySnapshots.set(key, empty);
    }
    return empty;
  }

  getServerSnapshot(symbol: string): Ticker24hView {
    return this.getSnapshot(symbol);
  }

  setSnapshot(snapshot: Ticker24hSnapshotInput): void {
    const key = snapshot.symbol.toUpperCase();
    const receivedAtMs = snapshot.receivedAtMs ?? Date.now();
    this.tickers.set(key, {
      ...snapshot,
      symbol: key,
      receivedAtMs,
      feedStale: resolveDisplayFeedStale(receivedAtMs, 'ticker'),
    });
    this.emit(key);
  }

  tickFeedStale(nowMs = Date.now()): void {
    for (const [symbol, ticker] of this.tickers) {
      const nextStale = resolveDisplayFeedStale(ticker.receivedAtMs, 'ticker', nowMs);
      if (nextStale === ticker.feedStale) continue;
      this.tickers.set(symbol, { ...ticker, feedStale: nextStale });
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

export const tickerStore = new TickerStore();
