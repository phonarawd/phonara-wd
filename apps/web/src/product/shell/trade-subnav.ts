import type { SubnavItem } from './earn-subnav';

/** Trade-only chrome — §12.19 (no sports/casino embed) · §13.1.3 subnav help. */
export const TRADE_SUBNAV: readonly SubnavItem[] = [
  { labelKey: 'trade.subnav.spot', to: '/trade', end: true, helpKey: 'trade.subnav.help.spot' },
  { labelKey: 'trade.subnav.futures', to: '/trade/futures', helpKey: 'trade.subnav.help.futures' },
  {
    labelKey: 'trade.subnav.positions',
    to: '/trade/positions',
    helpKey: 'trade.subnav.help.positions',
  },
  { labelKey: 'trade.subnav.orders', to: '/trade/orders', helpKey: 'trade.subnav.help.orders' },
  {
    labelKey: 'trade.subnav.history',
    to: '/ledger',
    end: true,
    helpKey: 'trade.subnav.help.history',
  },
] as const;

export type { SubnavItem };
