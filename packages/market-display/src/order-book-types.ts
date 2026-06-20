/** Canonical price level — Decimal strings only (no float). */
export type PriceLevel = readonly [price: string, qty: string];

export interface BookSnapshot {
  symbol: string;
  bids: PriceLevel[];
  asks: PriceLevel[];
  lastUpdateId: number;
}

export interface BookDelta {
  symbol: string;
  /** First update id in event. */
  U: number;
  /** Final update id in event. */
  u: number;
  bids: PriceLevel[];
  asks: PriceLevel[];
}

export type TradeTapeEntry = {
  symbol: string;
  price: string;
  qty: string;
  side: "buy" | "sell";
  timeMs: number;
};
