import { useSyncExternalStore } from 'react';
import { tickerStore } from './ticker-store';

export function useMarketTicker(symbol: string | null | undefined) {
  const sym = symbol?.toUpperCase() ?? '';
  return useSyncExternalStore(
    (cb) => (sym ? tickerStore.subscribe(sym, cb) : () => {}),
    () => (sym ? tickerStore.getSnapshot(sym) : tickerStore.getSnapshot('')),
    () => (sym ? tickerStore.getServerSnapshot(sym) : tickerStore.getServerSnapshot('')),
  );
}
