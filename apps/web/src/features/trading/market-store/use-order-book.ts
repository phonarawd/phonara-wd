import { useSyncExternalStore } from "react";
import { orderBookStore } from "./order-book-store";

export function useOrderBook(symbol: string | null | undefined) {
  const sym = symbol?.toUpperCase() ?? "";
  return useSyncExternalStore(
    (cb) => (sym ? orderBookStore.subscribe(sym, cb) : () => {}),
    () => (sym ? orderBookStore.getSnapshot(sym) : orderBookStore.getSnapshot("")),
    () => (sym ? orderBookStore.getServerSnapshot(sym) : orderBookStore.getServerSnapshot("")),
  );
}
