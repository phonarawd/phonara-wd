/**
 * Funding rate header + payment history — P9 WORLD step 18 (Plan §25.12.9.1-E #17).
 * Header: current `funding_rates.rate` only · history: dock tab single owner.
 *
 * Authority: TRADE_UX_CANON.md · trade-exchange-parity-display-contract.ts · §22.2.4
 */

export const P9_TRADE_FUNDING_HISTORY_DISPLAY_TODO = 'p9-trade-funding-history-display' as const;

export const FUNDING_RATES_TABLE = 'funding_rates' as const;
export const FUNDING_PAYMENTS_TABLE = 'funding_payments' as const;

export const FUNDING_HEADER_OWNER = 'futures-market-header.tsx' as const;
export const FUNDING_HISTORY_PANEL_OWNER = 'trade-funding-history-panel.tsx' as const;
export const FUNDING_HISTORY_MOUNT = 'TradeDeskBottomDock history tab' as const;

/** REST select for header — current rate only (no next_funding_at · no history). */
export const FUNDING_RATE_HEADER_SELECT = 'rate' as const;

/** User settlement rows — append-only ledger history (display-only). */
export const FUNDING_PAYMENTS_SELECT = 'id,market,amount,currency,created_at,position_id' as const;
