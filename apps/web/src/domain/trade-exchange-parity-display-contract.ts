/**
 * Trade exchange parity — Binance · Bybit · OKX vs PHONARA (Plan §22.2.1 · §22.2.3 · §32.7).
 * Zone ownership, complaint-risk registry, and extend-only rules for P9 WORLD.
 * Syncs with `margin-position-mode-display-contract` and `trade-order-states-display-contract`.
 *
 * Authority: REBUILD_PLAN_v1 §13.1.1 · §13.1.2 · §22.2 · §32.7 · TRADE_UX_CANON.md
 */

import {
  OKX_MARGIN_POSITION_PARITY_ACHIEVED,
  OKX_MARGIN_POSITION_UI_WIRE_STATUS,
  getCrossMarginDisabledReasonKey,
  resolveOkxBranchExposure,
  shouldHideHedgePositionModeToggle,
} from './margin-position-mode-display-contract';
import {
  assertTierFeeDisplayContractSync,
  P9_TRADE_TIER_FEE_DISPLAY_TODO,
} from './tier-fee-display-contract';
import {
  assertTradeMarketStatusDisplayContractSync,
  P9_TRADE_ORACLE_CIRCUIT_BANNER_TODO,
} from './trade-market-status-display-contract';
import {
  assertTradeToastRegistrySync,
  TRADE_TOAST_EVENT_REGISTRY,
} from './trade-toast-display-contract';
import {
  assertTradeI18nSurfaceAuditSync,
  P9_TRADE_I18N_SURFACE_AUDIT_TODO,
} from './trade-i18n-surface-display-contract';
import {
  assertTradeUltraLayoutContractSync,
  P9_TRADE_ULTRA_LAYOUT_TODO,
} from './trade-ultra-layout-display-contract';
import {
  assertTradeMobileLayoutContractSync,
  P9_TRADE_MOBILE_FUTURES_BOOK_TAB_TODO,
  P9_TRADE_MOBILE_HISTORY_TAB_TODO,
} from './trade-mobile-layout-display-contract';
import {
  FUTURES_CANCEL_ORDER_RPC,
  FUTURES_CLOSE_POSITION_RPC,
  FUTURES_PARTIAL_CLOSE_RPC,
  FUTURES_ADJUST_ISOLATED_MARGIN_RPC,
  FUTURES_SET_MARGIN_MODE_RPC,
  FUTURES_UPDATE_SLTP_RPC,
  TRADE_FUTURES_PANEL_CAPABILITIES,
  TRADE_ORDER_UI_WIRE_STATUS,
  resolveTradeOrderBranchExposure,
  shouldHideHedgePositionMode,
  isSpotLimitStopSupported,
} from './trade-order-states-display-contract';

export {
  CROSS_MARGIN_LAUNCH_FLAG,
  OKX_MARGIN_POSITION_PARITY_ACHIEVED,
} from './margin-position-mode-display-contract';

export const TRADE_SPOT_DESK_ROUTE = '/trade' as const;
export const TRADE_FUTURES_DESK_ROUTE = '/trade/futures' as const;
export const TRADE_POSITIONS_ROUTE = '/trade/positions' as const;
export const TRADE_ORDERS_ROUTE = '/trade/orders' as const;

export type ExchangeReference = 'binance' | 'bybit' | 'okx';

export type TradeParityTier = 'A' | 'B' | 'C' | 'N/A' | 'DONE';

export type TradeComplaintMitigation = 'live' | 'disabled' | 'disabled+key' | 'built_hidden';

export type SettlementCurrency = 'USDT' | 'PHON';

export const TRADE_SETTLEMENT_CURRENCIES: readonly SettlementCurrency[] = ['USDT', 'PHON'] as const;

export type TradeDualCurrencySurface =
  | 'futures_margin'
  | 'futures_tables'
  | 'spot_stake'
  | 'desk_balances'
  | 'sports_slip'
  | 'casino_stake'
  | 'staking_pool';

export type TradeDualCurrencyRow = {
  id: string;
  surface: TradeDualCurrencySurface;
  label: string;
  usdt: boolean;
  phon: boolean;
  engineRpc: string;
  phonara: 'yes' | 'partial' | 'no';
  ownerTodo: string | null;
};
export const TRADE_DUAL_CURRENCY_MATRIX: readonly TradeDualCurrencyRow[] = [
  {
    id: 'futures-margin-selector',
    surface: 'futures_margin',
    label: 'Futures margin currency selector',
    usdt: true,
    phon: true,
    engineRpc: 'p_margin_currency · rpc_open_futures_position',
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'futures-table-columns',
    surface: 'futures_tables',
    label: 'Positions/orders/fills margin_currency column',
    usdt: true,
    phon: true,
    engineRpc: 'margin_currency row',
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'spot-stake-rules',
    surface: 'spot_stake',
    label: 'Spot stake per pair (buy=quote · sell=base)',
    usdt: true,
    phon: true,
    engineRpc: 'rpc_spot_market_buy · rpc_spot_market_sell',
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'desk-dual-balance',
    surface: 'desk_balances',
    label: 'Trade desk phonAvail + usdtAvail',
    usdt: true,
    phon: true,
    engineRpc: 'wallet RPC',
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'sports-slip-currency',
    surface: 'sports_slip',
    label: 'Sports bet slip stake currency',
    usdt: true,
    phon: true,
    engineRpc: 'rpc_place_sports_bet(p_currency)',
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'casino-stake-currency',
    surface: 'casino_stake',
    label: 'Casino game stake currency',
    usdt: true,
    phon: true,
    engineRpc: 'game bet p_currency',
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'staking-pool-currency',
    surface: 'staking_pool',
    label: 'Staking pool stake_currency label',
    usdt: true,
    phon: true,
    engineRpc: 'rpc_stake · rpc_stake_phon · staking_pools.stake_currency',
    phonara: 'yes',
    ownerTodo: null,
  },
] as const;

export type TradePlatformSettlementSurface =
  | 'spot'
  | 'futures'
  | 'staking'
  | 'sports'
  | 'casino'
  | 'display';

export type TradePlatformSettlementRow = {
  id: string;
  surface: TradePlatformSettlementSurface;
  label: string;
  settlementEngine: string;
  /** PHONARA never routes orders to external exchange matching. */
  externalExchangeRouting: false;
  uxReference: readonly ExchangeReference[];
  phonara: 'yes' | 'partial' | 'no';
  ownerTodo: string | null;
};

/** §13.1.2 — on-platform settlement only; exchange-grade UX is pattern-only. */
export const TRADE_PLATFORM_SETTLEMENT_MODEL: readonly TradePlatformSettlementRow[] = [
  {
    id: 'spot-market-on-platform',
    surface: 'spot',
    label: 'Spot market buy/sell',
    settlementEngine: 'rpc_spot_market_buy · rpc_spot_market_sell · wallet lock · Σ=0',
    externalExchangeRouting: false,
    uxReference: ['binance', 'bybit', 'okx'],
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'futures-on-platform',
    surface: 'futures',
    label: 'Futures open/close/limit/stop',
    settlementEngine:
      'rpc_open_futures_position · rpc_close_futures_position · rpc_partial_close_futures · rpc_place_limit_order · rpc_place_stop_order · rpc_run_open_order_fills',
    externalExchangeRouting: false,
    uxReference: ['binance', 'bybit', 'okx'],
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'house-fill-worker',
    surface: 'futures',
    label: 'House / synthetic book fill',
    settlementEngine: '_fill_house_order · rpc_run_open_order_fills',
    externalExchangeRouting: false,
    uxReference: ['binance', 'bybit', 'okx'],
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'staking-on-platform',
    surface: 'staking',
    label: 'Stake / unstake / claim rewards',
    settlementEngine:
      'rpc_stake · rpc_stake_phon · rpc_unstake_phon · rpc_claim_staking_reward · stake_currency',
    externalExchangeRouting: false,
    uxReference: ['binance', 'okx'],
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'sports-bet-on-platform',
    surface: 'sports',
    label: 'Sports bet placement',
    settlementEngine: 'rpc_place_sports_bet(p_currency) · ledger Σ=0',
    externalExchangeRouting: false,
    uxReference: ['binance'],
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'casino-bet-on-platform',
    surface: 'casino',
    label: 'Casino game bet',
    settlementEngine: 'game bet RPC · p_currency · provably-fair settlement',
    externalExchangeRouting: false,
    uxReference: ['binance'],
    phonara: 'yes',
    ownerTodo: 'p10-casino-replay-and-infra',
  },
  {
    id: 'synthetic-book-display',
    surface: 'display',
    label: 'Synthetic order book (display)',
    settlementEngine: 'rpc_get_synthetic_book — display-only · fill via house RPC',
    externalExchangeRouting: false,
    uxReference: ['binance', 'bybit', 'okx'],
    phonara: 'yes',
    ownerTodo: null,
  },
] as const;

export type TradeRealtimeFeedRow = {
  id: string;
  module: string;
  feedSource: string;
  displayOnly: true;
  settlementSource: string;
  phonara: 'yes' | 'partial' | 'no';
  ownerTodo: string | null;
};

/** §13.1.2 · ADR-0002 — realtime UX feeds; never settlement input. */
export const TRADE_REALTIME_MARKET_DATA_MATRIX: readonly TradeRealtimeFeedRow[] = [
  {
    id: 'lwc-majors-ws',
    module: 'LWC chart (majors)',
    feedSource: 'Binance/Bybit WS klines · use-display-kline · use-exchange-live-candles',
    displayOnly: true,
    settlementSource: 'oracle mark RPC · not chart tick',
    phonara: 'yes',
    ownerTodo: 'p9-trade-chart-pro-lwc',
  },
  {
    id: 'phon-oracle-candles',
    module: 'PHON pair chart fallback',
    feedSource: 'rpc_get_candles · ORACLE_DISPLAY_INTERVALS',
    displayOnly: true,
    settlementSource: 'oracle price RPC',
    phonara: 'yes',
    ownerTodo: 'p9-trade-chart-pro-lwc',
  },
  {
    id: 'ticker-24h',
    module: '24h ticker header',
    feedSource: 'useMarketTicker · display strings',
    displayOnly: true,
    settlementSource: 'oracle/mark RPC on order path',
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'synthetic-book',
    module: 'Order book depth',
    feedSource: 'rpc_get_synthetic_book',
    displayOnly: true,
    settlementSource: 'house fill · limit/stop RPC',
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'recent-trades-tape',
    module: 'Recent trades tape',
    feedSource: 'price_ticks reference rail',
    displayOnly: true,
    settlementSource: 'engine trade history — not external tape',
    phonara: 'yes',
    ownerTodo: null,
  },
  {
    id: 'market-data-bridge',
    module: 'Market WS bridge',
    feedSource: 'MarketDataBridge · DISPLAY_ONLY_FEED',
    displayOnly: true,
    settlementSource: 'order/position RPC only',
    phonara: 'yes',
    ownerTodo: null,
  },
] as const;

export type TradeExchangeParityRow = {
  id: string;
  module: string;
  category: 'layout' | 'spot' | 'futures_order' | 'futures_position' | 'engine';
  binance: boolean;
  bybit: boolean;
  okx: boolean;
  phonara: 'yes' | 'partial' | 'no';
  tier: TradeParityTier;
  ownerTodo: string | null;
};

/** §22.2.1 — Binance · Bybit · OKX feature matrix (clone forbidden · pattern+RPC parity). */
export const TRADE_EXCHANGE_PARITY_MATRIX: readonly TradeExchangeParityRow[] = [
  {
    id: 'desktop-3-panel',
    module: 'Desktop 3-panel chart｜book｜ticket',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'bottom-dock',
    module: 'Bottom dock positions｜orders｜history',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'ticker-24h',
    module: '24h ticker (change/high/low/vol/OI)',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'mobile-tabs',
    module: 'Mobile chart|trade|positions|history 4-tab',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'mobile-futures-book-tab',
    module: 'Mobile trade tab order|book subtab',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'recent-trades-tape',
    module: 'Recent trades tape',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'orderbook-parity',
    module: 'Order book grouping·spread·click price',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'oracle-circuit-banner',
    module: 'Connection / oracle / circuit banner',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'ultra-2560-layout',
    module: 'Ultra 2560+ density',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'chart-overlays',
    module: 'Chart overlays MA/EMA·oracle/liq lines',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'spot-market',
    module: 'Spot market buy/sell',
    category: 'spot',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'spot-limit-stop',
    module: 'Spot limit/stop orders',
    category: 'spot',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'futures-order-types',
    module: 'Futures market/limit/stop/stop-limit',
    category: 'futures_order',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'leverage-slider',
    module: 'Leverage slider + max cap',
    category: 'futures_order',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'isolated-margin',
    module: 'Isolated margin (account)',
    category: 'futures_order',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'cross-margin',
    module: 'Cross margin (account)',
    category: 'futures_order',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'partial',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'margin-adjust',
    module: 'Isolated margin adjust ±',
    category: 'futures_order',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'reduce-only',
    module: 'Reduce-only orders',
    category: 'futures_order',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'one-way-position',
    module: 'One-way (net) position',
    category: 'futures_position',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'hedge-position',
    module: 'Hedge / dual-side position mode',
    category: 'futures_position',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'partial-close',
    module: 'Partial close',
    category: 'futures_position',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'full-close',
    module: 'Full close',
    category: 'futures_position',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'unrealized-pnl',
    module: 'Unrealized PnL / ROE (mark)',
    category: 'futures_position',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'order-fills-history',
    module: 'Order fills / trade history',
    category: 'futures_position',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'funding-rate-history',
    module: 'Funding rate + history',
    category: 'futures_position',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'tier-fee-badge',
    module: 'VIP tier badge + fee HelpTip on order ticket',
    category: 'futures_order',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'i18n-surface-audit',
    module: 'Trade i18n surface coverage audit',
    category: 'layout',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
  {
    id: 'okx-parity-flag',
    module: 'OKX 100% margin/position parity',
    category: 'engine',
    binance: true,
    bybit: true,
    okx: true,
    phonara: 'yes',
    tier: 'DONE',
    ownerTodo: null,
  },
] as const;

export type TradeUiViewport = 'lg+' | 'mobile<lg' | 'all';

export type TradeUiZoneOwner = {
  id: string;
  viewport: TradeUiViewport;
  zone: string;
  ownerComponent: string;
  mountLocation: string;
  forbiddenDuplicates: readonly string[];
  ownerTodo: string | null;
};

/** §22.2.3 H1 — viewport × zone = single owner (no duplicate mount). */
export const TRADE_UI_ZONE_OWNERS: readonly TradeUiZoneOwner[] = [
  {
    id: 'desktop-main-3col',
    viewport: 'lg+',
    zone: 'Main 3-col',
    ownerComponent: 'SpotOrderBookPanel · TradeChartPanel · {Spot|Futures}OrderTicket',
    mountLocation: 'desk grid row 1',
    forbiddenDuplicates: ['2nd chart', '2nd book', '2nd ticket'],
    ownerTodo: null,
  },
  {
    id: 'desktop-bottom-strip',
    viewport: 'lg+',
    zone: 'Bottom strip',
    ownerComponent: 'TradeDeskBottomDock',
    mountLocation: 'desk row 2',
    forbiddenDuplicates: ['inline FuturesPositionsPanel on futures-desk-page'],
    ownerTodo: null,
  },
  {
    id: 'desktop-status-banner',
    viewport: 'lg+',
    zone: 'Status',
    ownerComponent: 'TradeMarketStatusBanner',
    mountLocation: 'below header',
    forbiddenDuplicates: ['AppShell + page both'],
    ownerTodo: null,
  },
  {
    id: 'desktop-recent-tape',
    viewport: 'lg+',
    zone: 'Recent tape',
    ownerComponent: 'TradeRecentTradesRail',
    mountLocation: 'inside/adjacent book',
    forbiddenDuplicates: ['full-width second tape'],
    ownerTodo: null,
  },
  {
    id: 'mobile-tabs',
    viewport: 'mobile<lg',
    zone: 'Tabs',
    ownerComponent: 'Tabs (one set)',
    mountLocation: 'desk page',
    forbiddenDuplicates: ['bottom dock + tabs same data'],
    ownerTodo: null,
  },
  {
    id: 'mobile-book',
    viewport: 'mobile<lg',
    zone: 'Order book',
    ownerComponent: 'SpotOrderBookPanel',
    mountLocation: 'trade tab book subtab only',
    forbiddenDuplicates: ['lg+ side rail book on same viewport', '2nd book on mobile'],
    ownerTodo: null,
  },
  {
    id: 'mobile-positions',
    viewport: 'mobile<lg',
    zone: 'Positions',
    ownerComponent: 'FuturesPositionsPanel',
    mountLocation: 'positions tab only',
    forbiddenDuplicates: ['dock + tab duplicate'],
    ownerTodo: null,
  },
  {
    id: 'all-market-ws',
    viewport: 'all',
    zone: 'Market WS',
    ownerComponent: 'MarketDataBridge',
    mountLocation: 'top of desk page',
    forbiddenDuplicates: ['second bridge'],
    ownerTodo: null,
  },
  {
    id: 'positions-page-full',
    viewport: 'all',
    zone: '/trade/positions full table',
    ownerComponent: 'FuturesPositionsPanel variant=full',
    mountLocation: 'page only',
    forbiddenDuplicates: ['third positions table on desk'],
    ownerTodo: null,
  },
] as const;

export type TradeExtendOnlyRule = {
  concern: string;
  extendFile: string;
  doNotCreate: string;
};

/** §22.2.3 H2 — extend-only registry (no parallel files). */
export const TRADE_EXTEND_ONLY_REGISTRY: readonly TradeExtendOnlyRule[] = [
  {
    concern: 'Positions table/actions',
    extendFile: 'futures-positions-panel.tsx',
    doNotCreate: 'positions-table-v2.tsx',
  },
  {
    concern: 'Order book',
    extendFile: 'spot-order-book-panel.tsx',
    doNotCreate: 'futures-order-book-panel.tsx',
  },
  {
    concern: 'Chart',
    extendFile: 'chart/*',
    doNotCreate: 'second TradeChart.tsx',
  },
  {
    concern: 'Order ticket',
    extendFile: 'futures-order-ticket.tsx / spot-order-ticket.tsx',
    doNotCreate: 'advanced-ticket.tsx',
  },
  {
    concern: 'Tier fee badge',
    extendFile: 'trade-tier-fee-badge.tsx · order ticket headers',
    doNotCreate: 'second numeric est fee row from tier',
  },
  {
    concern: 'Market status banner',
    extendFile: 'trade-market-status-banner.tsx · desk pages below header',
    doNotCreate: 'AppShell duplicate · header inline stale copy',
  },
  {
    concern: 'Fills/history',
    extendFile: 'trade-fills-history-panel.tsx',
    doNotCreate: 'duplicate history on header',
  },
  {
    concern: 'Funding history',
    extendFile: 'trade-funding-history-panel.tsx',
    doNotCreate: 'duplicate funding history on header',
  },
  {
    concern: 'Bottom dock',
    extendFile: 'trade-desk-bottom-dock.tsx',
    doNotCreate: 'inline copy-paste tabs',
  },
] as const;

export type TradeActionPathIntent =
  | 'full-close-position'
  | 'partial-close-position'
  | 'adjust-isolated-margin'
  | 'cancel-open-order'
  | 'cancel-spot-open-order'
  | 'view-fills'
  | 'submit-order';

export type TradeActionPathRow = {
  intent: TradeActionPathIntent;
  canonicalSurface: string;
  secondarySurface: string | null;
  /** Single RPC/hook module shared by canonical + secondary surfaces (§32.7 H2). */
  sharedHookModule: string;
};

/** §32.7 H2 — dock · desk mobile · secondary routes must share one action path per intent. */
export const TRADE_ACTION_PATH_REGISTRY: readonly TradeActionPathRow[] = [
  {
    intent: 'full-close-position',
    canonicalSurface: 'TradeDeskBottomDock (lg+) · futures mobile positions tab',
    secondarySurface: TRADE_POSITIONS_ROUTE,
    sharedHookModule: 'hooks/use-trading.ts',
  },
  {
    intent: 'partial-close-position',
    canonicalSurface: 'TradeDeskBottomDock · futures mobile positions tab',
    secondarySurface: TRADE_POSITIONS_ROUTE,
    sharedHookModule: 'hooks/use-trading.ts',
  },
  {
    intent: 'adjust-isolated-margin',
    canonicalSurface: 'TradeDeskBottomDock · futures mobile positions tab',
    secondarySurface: TRADE_POSITIONS_ROUTE,
    sharedHookModule: 'hooks/use-trading.ts',
  },
  {
    intent: 'cancel-open-order',
    canonicalSurface: 'TradeDeskBottomDock orders tab · futures mobile history stack',
    secondarySurface: TRADE_ORDERS_ROUTE,
    sharedHookModule: 'hooks/use-trading.ts',
  },
  {
    intent: 'cancel-spot-open-order',
    canonicalSurface: 'Spot desk mobile history stack (spotOpenOrders whitelist)',
    secondarySurface: null,
    sharedHookModule: 'features/trading/use-spot-desk-wire.ts',
  },
  {
    intent: 'view-fills',
    canonicalSurface: 'TradeDeskBottomDock history · mobile history tab',
    secondarySurface: `${TRADE_ORDERS_ROUTE} history tab`,
    sharedHookModule: 'hooks/use-trading.ts',
  },
  {
    intent: 'submit-order',
    canonicalSurface: 'SpotOrderTicket · FuturesOrderTicket · mobile sticky CTA',
    secondarySurface: 'book price click → ticket prefill',
    sharedHookModule: 'features/trading/use-futures-desk-wire.ts',
  },
] as const;

export type TradeUserComplaintRisk = {
  id: string;
  control: string;
  rpcPath: string | null;
  failSymptom: string;
  ownerTodo: string;
  mitigatedBy: TradeComplaintMitigation;
  disabledReasonKey?: string;
};

/** §32.7 H9 — repo-measured gap rows; button↔RPC↔disabled reason registry. */
export const TRADE_USER_COMPLAINT_RISKS: readonly TradeUserComplaintRisk[] = [
  {
    id: 'trade-dock-orphan',
    control: 'TradeDeskBottomDock mount',
    rpcPath: null,
    failSymptom: 'bottom dock typecheck orphan / not mounted',
    ownerTodo: 'p9-trade-terminal-bottom-dock',
    mitigatedBy: 'live',
  },
  {
    id: 'futures-inline-positions',
    control: 'FuturesPositionsPanel lg+ inline block',
    rpcPath: 'rpc_close_futures_position',
    failSymptom: 'lg+ positions×2 · inline without close',
    ownerTodo: 'p9-trade-terminal-bottom-dock',
    mitigatedBy: 'live',
  },
  {
    id: 'desk-no-cancel',
    control: 'Open order cancel button on desk',
    rpcPath: FUTURES_CANCEL_ORDER_RPC,
    failSymptom: 'open orders visible · no cancel on desk',
    ownerTodo: 'p9-trade-terminal-bottom-dock',
    mitigatedBy: 'live',
  },
  {
    id: 'pnl-dash',
    control: 'Unrealized PnL column',
    rpcPath: 'compute-position-display-metrics (RPC mark)',
    failSymptom: 'unrealized shows — while RPC has mark',
    ownerTodo: 'p9-trade-futures-unrealized-pnl',
    mitigatedBy: 'live',
  },
  {
    id: 'fills-missing',
    control: 'History / fills tab',
    rpcPath: 'useTradingOrderFills',
    failSymptom: 'history tab empty',
    ownerTodo: 'p9-trade-fills-history-wire',
    mitigatedBy: 'live',
  },
  {
    id: 'funding-history-missing',
    control: 'Funding history dock sub-tab',
    rpcPath: 'useFundingPayments',
    failSymptom: 'funding payments exist · dock sub-tab empty',
    ownerTodo: 'p9-trade-funding-history-display',
    mitigatedBy: 'live',
  },
  {
    id: 'duplicate-est-fee-row',
    control: 'Order ticket est fee numeric row',
    rpcPath: 'preview.openFee · order-ticket-display estFee',
    failSymptom: 'tier badge adds second numeric fee row',
    ownerTodo: P9_TRADE_TIER_FEE_DISPLAY_TODO,
    mitigatedBy: 'live',
  },
  {
    id: 'partial-close-ui',
    control: 'Partial close ratio dialog',
    rpcPath: FUTURES_PARTIAL_CLOSE_RPC,
    failSymptom: 'UI advertises partial · RPC exists',
    ownerTodo: 'p9-trade-futures-partial-close-ui',
    mitigatedBy: 'live',
  },
  {
    id: 'margin-adjust-ui',
    control: 'Isolated margin adjust dialog',
    rpcPath: FUTURES_ADJUST_ISOLATED_MARGIN_RPC,
    failSymptom: 'UI advertises margin adjust · RPC exists',
    ownerTodo: 'p9-trade-futures-margin-adjust-ui',
    mitigatedBy: 'live',
  },
  {
    id: 'hedge-visible',
    control: 'Hedge / dual-side position mode toggle',
    rpcPath: 'rpc_set_position_mode',
    failSymptom: 'hedge toggle missing after E21 UI unlock',
    ownerTodo: 'ew-e21-ui-trade-engine-unlocks',
    mitigatedBy: 'live',
  },
  {
    id: 'spot-limit-visible',
    control: 'Spot limit/stop order tabs',
    rpcPath: 'rpc_place_spot_limit_order',
    failSymptom: 'limit on spot when engine market-only',
    ownerTodo: 'engine-t1-spot-limit',
    mitigatedBy: 'live',
  },
  {
    id: 'cross-margin-live-claim',
    control: 'Cross margin selector',
    rpcPath: FUTURES_SET_MARGIN_MODE_RPC,
    failSymptom: 'cross selectable while flag OFF · silent reject',
    ownerTodo: 'p9-trade-cross-margin-canary',
    mitigatedBy: 'disabled+key',
    disabledReasonKey: 'trade.margin.crossDisabled',
  },
  {
    id: 'reduce-only-visible',
    control: 'Reduce-only order toggle',
    rpcPath: 'rpc_place_limit_order',
    failSymptom: 'reduce-only toggle missing after E21 UI unlock',
    ownerTodo: 'ew-e21-ui-trade-engine-unlocks',
    mitigatedBy: 'live',
  },
  {
    id: 'position-tpsl-edit',
    control: 'Post-open TP/SL amend',
    rpcPath: FUTURES_UPDATE_SLTP_RPC,
    failSymptom: 'edit TP/SL visible · RPC wired',
    ownerTodo: 'ew-e21-trade-parity-wave',
    mitigatedBy: 'live',
  },
  {
    id: 'dock-page-close-split',
    control: 'Full close position',
    rpcPath: FUTURES_CLOSE_POSITION_RPC,
    failSymptom: 'close only on /trade/positions · desk read-only',
    ownerTodo: 'p9-trade-terminal-bottom-dock',
    mitigatedBy: 'live',
  },
  {
    id: 'futures-margin-phon-hidden',
    control: 'Futures margin currency PHON selector',
    rpcPath: 'p_margin_currency',
    failSymptom: 'PHON margin path exists · selector missing/broken',
    ownerTodo: 'p9-trade-order-ticket-density',
    mitigatedBy: 'live',
  },
  {
    id: 'spot-stake-hardcode-usdt',
    control: 'Spot market buy stake currency',
    rpcPath: 'rpc_spot_market_buy',
    failSymptom: 'buy always USDT · ignores pair stake rule',
    ownerTodo: 'p9-trade-spot-pair-wire',
    mitigatedBy: 'live',
  },
  {
    id: 'fills-currency-mismatch',
    control: 'Fills/history margin_currency column',
    rpcPath: 'useTradingOrderFills',
    failSymptom: 'fill row currency ≠ RPC margin_currency',
    ownerTodo: 'p9-trade-fills-history-wire',
    mitigatedBy: 'live',
  },
  {
    id: 'sports-stake-usdt-only',
    control: 'Sports slip stake currency',
    rpcPath: 'rpc_place_sports_bet(p_currency)',
    failSymptom: 'slip USDT-only · PHON reject',
    ownerTodo: 'p10-page-sports',
    mitigatedBy: 'live',
  },
  {
    id: 'casino-stake-usdt-only',
    control: 'Casino stake currency toggle',
    rpcPath: 'game bet p_currency',
    failSymptom: 'game shell USDT-only · PHON path exists',
    ownerTodo: 'p10-casino-replay-and-infra',
    mitigatedBy: 'live',
  },
  {
    id: 'chart-price-settlement',
    control: 'Chart/WS price on order path',
    rpcPath: null,
    failSymptom: 'order uses chart tick instead of oracle/mark RPC',
    ownerTodo: 'p9-trade-chart-pro-lwc',
    mitigatedBy: 'live',
  },
  {
    id: 'recent-trades-missing',
    control: 'TradeRecentTradesRail mount (lg+ book column)',
    rpcPath: 'price_ticks',
    failSymptom: 'no reference time&sales rail beside order book',
    ownerTodo: 'p9-trade-recent-trades-rail',
    mitigatedBy: 'live',
  },
  {
    id: 'duplicate-status-banner',
    control: 'TradeMarketStatusBanner mount',
    rpcPath: 'market_circuit_breakers.is_halted · app_config kill-switch',
    failSymptom: 'AppShell + desk both show status · header inline stale duplicate',
    ownerTodo: P9_TRADE_ORACLE_CIRCUIT_BANNER_TODO,
    mitigatedBy: 'live',
  },
  {
    id: 'external-exchange-copy',
    control: 'External exchange settlement copy',
    rpcPath: null,
    failSymptom: 'UI claims Binance/Bybit execution or API linkage',
    ownerTodo: P9_TRADE_I18N_SURFACE_AUDIT_TODO,
    mitigatedBy: 'live',
  },
  {
    id: 'trade-feedback-silent-fail',
    control: 'Trade desk money action toast on RPC outcome',
    rpcPath: 'showTradeFeedback · TRADE_TOAST_EVENT_REGISTRY',
    failSymptom: 'submit/cancel/stake success or RpcError with silent fail',
    ownerTodo: 'phase-2-toast-arch',
    mitigatedBy: 'live',
  },
  {
    id: 'trade-feedback-double-toast',
    control: 'Desk wire toast single exit',
    rpcPath: 'features/trading/trade-feedback-display.ts',
    failSymptom: 'productToast direct in desk wire + mutation onError duplicate',
    ownerTodo: 'phase-2-toast-arch',
    mitigatedBy: 'live',
  },
] as const;

export const P9_TRADE_PARITY_MATRIX_SYNC_TODO = 'p9-trade-parity-matrix-sync' as const;
export const P9_TRADE_LAYOUT_DEDUP_GATE_TODO = 'p9-trade-layout-dedup-gate' as const;
export const P9_TRADE_WORLD_CLASS_GATE_TODO = 'p9-gate-trade-world-class' as const;

export { P9_TRADE_I18N_SURFACE_AUDIT_TODO } from './trade-i18n-surface-display-contract';

export function findTradeDualCurrencyRow(id: string): TradeDualCurrencyRow | undefined {
  return TRADE_DUAL_CURRENCY_MATRIX.find((row) => row.id === id);
}

export function findTradePlatformSettlementRow(id: string): TradePlatformSettlementRow | undefined {
  return TRADE_PLATFORM_SETTLEMENT_MODEL.find((row) => row.id === id);
}

export function listTradePlatformSettlementBySurface(
  surface: TradePlatformSettlementSurface,
): TradePlatformSettlementRow[] {
  return TRADE_PLATFORM_SETTLEMENT_MODEL.filter((row) => row.surface === surface);
}

export function findTradeRealtimeFeedRow(id: string): TradeRealtimeFeedRow | undefined {
  return TRADE_REALTIME_MARKET_DATA_MATRIX.find((row) => row.id === id);
}

export function listTradeDualCurrencyBySurface(
  surface: TradeDualCurrencySurface,
): TradeDualCurrencyRow[] {
  return TRADE_DUAL_CURRENCY_MATRIX.filter((row) => row.surface === surface);
}

export function findTradeParityRow(id: string): TradeExchangeParityRow | undefined {
  return TRADE_EXCHANGE_PARITY_MATRIX.find((row) => row.id === id);
}

export function findTradeZoneOwner(id: string): TradeUiZoneOwner | undefined {
  return TRADE_UI_ZONE_OWNERS.find((row) => row.id === id);
}

export function findTradeActionPath(intent: TradeActionPathIntent): TradeActionPathRow | undefined {
  return TRADE_ACTION_PATH_REGISTRY.find((row) => row.intent === intent);
}

/** §22.2.3 H1 · §32.7 H1 — zone owner registry + visible control mitigation invariants. */
export function assertTradeLayoutDedupContractSync(): void {
  if (TRADE_UI_ZONE_OWNERS.length < 9) {
    throw new Error('trade-layout-dedup: TRADE_UI_ZONE_OWNERS must register all H1 zones');
  }

  const zoneIds = TRADE_UI_ZONE_OWNERS.map((row) => row.id);
  if (new Set(zoneIds).size !== zoneIds.length) {
    throw new Error('trade-layout-dedup: duplicate TRADE_UI_ZONE_OWNERS id');
  }

  for (const row of TRADE_UI_ZONE_OWNERS) {
    if (!row.ownerComponent || !row.mountLocation) {
      throw new Error(`trade-layout-dedup: zone ${row.id} missing owner or mount`);
    }
    if (row.forbiddenDuplicates.length === 0) {
      throw new Error(`trade-layout-dedup: zone ${row.id} must declare forbiddenDuplicates`);
    }
  }

  const bottomStrip = TRADE_UI_ZONE_OWNERS.find((row) => row.id === 'desktop-bottom-strip');
  if (
    !bottomStrip?.forbiddenDuplicates.includes('inline FuturesPositionsPanel on futures-desk-page')
  ) {
    throw new Error('trade-layout-dedup: desktop-bottom-strip must forbid inline lg+ positions');
  }

  const h1Mitigation: readonly TradeComplaintMitigation[] = [
    'live',
    'disabled',
    'disabled+key',
    'built_hidden',
  ];
  for (const row of TRADE_USER_COMPLAINT_RISKS) {
    if (!h1Mitigation.includes(row.mitigatedBy)) {
      throw new Error(`trade-layout-dedup: complaint risk ${row.id} has invalid mitigatedBy`);
    }
    if (row.mitigatedBy === 'disabled+key' && !row.disabledReasonKey) {
      throw new Error(`trade-layout-dedup: complaint risk ${row.id} missing disabledReasonKey`);
    }
  }
}

export function findTradeComplaintRisk(id: string): TradeUserComplaintRisk | undefined {
  return TRADE_USER_COMPLAINT_RISKS.find((row) => row.id === id);
}

export function listTradeComplaintRisksByOwnerTodo(ownerTodo: string): TradeUserComplaintRisk[] {
  return TRADE_USER_COMPLAINT_RISKS.filter((row) => row.ownerTodo === ownerTodo);
}

/** Phase 2B — toast registry ↔ complaint-risk sync. */
export function assertTradeToastFeedbackSync(): void {
  assertTradeToastRegistrySync();
  const implementedCount = TRADE_TOAST_EVENT_REGISTRY.filter(
    (row) => row.implemented === 'yes',
  ).length;
  if (implementedCount < 18) {
    throw new Error('trade-toast: expected at least 18 implemented sync events');
  }
  for (const id of ['trade-feedback-silent-fail', 'trade-feedback-double-toast'] as const) {
    const risk = findTradeComplaintRisk(id);
    if (!risk || risk.mitigatedBy !== 'live') {
      throw new Error(`trade-toast: complaint risk ${id} must be live`);
    }
  }
}

export function listTradeParityRowsByTier(tier: TradeParityTier): TradeExchangeParityRow[] {
  return TRADE_EXCHANGE_PARITY_MATRIX.filter((row) => row.tier === tier);
}

/** Assert margin-position-mode · trade-order-states · parity contract agree on honest UX gates. */
export function assertTradeParityContractSync(): void {
  if (!OKX_MARGIN_POSITION_PARITY_ACHIEVED) {
    throw new Error('trade-parity: OKX_MARGIN_POSITION_PARITY_ACHIEVED must be true after E21 UI');
  }
  if (shouldHideHedgePositionModeToggle() || shouldHideHedgePositionMode()) {
    throw new Error('trade-parity: hedge position mode must be visible after E21 UI unlock');
  }
  if (OKX_MARGIN_POSITION_UI_WIRE_STATUS.position_mode_hedge_toggle !== 'live') {
    throw new Error('trade-parity: margin contract hedge toggle must be live');
  }
  if (TRADE_ORDER_UI_WIRE_STATUS.hedge_mode_toggle !== 'live') {
    throw new Error('trade-parity: order-states hedge toggle must be live');
  }
  if (isSpotLimitStopSupported()) {
    if (TRADE_ORDER_UI_WIRE_STATUS.spot_limit_tab !== 'live') {
      throw new Error('trade-parity: spot limit tab must be live when T1 RPCs exist');
    }
    const spotLimitRisk = findTradeComplaintRisk('spot-limit-visible');
    if (!spotLimitRisk || spotLimitRisk.mitigatedBy !== 'live') {
      throw new Error('trade-parity: spot-limit-visible must be live when T1 RPCs exist');
    }
    const spotLimitRow = TRADE_EXCHANGE_PARITY_MATRIX.find((row) => row.id === 'spot-limit-stop');
    if (!spotLimitRow || spotLimitRow.phonara !== 'yes') {
      throw new Error('trade-parity: spot-limit-stop must be yes when T1 RPCs exist');
    }
  } else {
    if (TRADE_ORDER_UI_WIRE_STATUS.spot_limit_tab !== 'built_hidden') {
      throw new Error('trade-parity: spot limit tab must be built_hidden');
    }
    const spotLimitRiskHidden = findTradeComplaintRisk('spot-limit-visible');
    if (!spotLimitRiskHidden || spotLimitRiskHidden.mitigatedBy !== 'built_hidden') {
      throw new Error('trade-parity: spot-limit-visible complaint risk must be built_hidden');
    }
  }
  const hedgeRisk = findTradeComplaintRisk('hedge-visible');
  if (!hedgeRisk || hedgeRisk.mitigatedBy !== 'live') {
    throw new Error('trade-parity: hedge-visible complaint risk must be live after E21 UI');
  }
  if (TRADE_FUTURES_PANEL_CAPABILITIES.positionTpSlEdit) {
    if (TRADE_ORDER_UI_WIRE_STATUS.position_tpsl_edit !== 'live') {
      throw new Error('trade-parity: position_tpsl_edit wire must be live when RPC exists');
    }
    const tpslRisk = findTradeComplaintRisk('position-tpsl-edit');
    if (!tpslRisk || tpslRisk.mitigatedBy !== 'live') {
      throw new Error(
        'trade-parity: position-tpsl-edit complaint risk must be live when RPC exists',
      );
    }
    if (tpslRisk.rpcPath !== FUTURES_UPDATE_SLTP_RPC) {
      throw new Error('trade-parity: position-tpsl-edit rpcPath drift');
    }
  }
  const reduceOnlyRisk = findTradeComplaintRisk('reduce-only-visible');
  if (!reduceOnlyRisk || reduceOnlyRisk.mitigatedBy !== 'live') {
    throw new Error('trade-parity: reduce-only-visible must be live after E21 UI');
  }
  if (TRADE_ORDER_UI_WIRE_STATUS.reduce_only_toggle !== 'live') {
    throw new Error('trade-parity: reduce_only_toggle must be live after E21 UI');
  }
  if (!TRADE_FUTURES_PANEL_CAPABILITIES.reduceOnlyOrders) {
    throw new Error('trade-parity: reduceOnlyOrders capability must be true after E21 UI');
  }
  const crossRisk = findTradeComplaintRisk('cross-margin-live-claim');
  if (!crossRisk || crossRisk.mitigatedBy !== 'disabled+key') {
    throw new Error('trade-parity: cross-margin-live-claim must be disabled+key');
  }
  if (crossRisk.disabledReasonKey !== getCrossMarginDisabledReasonKey()) {
    throw new Error('trade-parity: cross margin disabled reason key drift');
  }
  if (
    resolveOkxBranchExposure('margin_cross', false) !==
    OKX_MARGIN_POSITION_UI_WIRE_STATUS.margin_cross_selector
  ) {
    throw new Error('trade-parity: margin cross selector default wire status drift');
  }
  if (
    resolveTradeOrderBranchExposure('futures_cross_margin', false) !==
    TRADE_ORDER_UI_WIRE_STATUS.futures_margin_cross
  ) {
    throw new Error('trade-parity: order-states futures cross wire status drift');
  }
  for (const row of TRADE_DUAL_CURRENCY_MATRIX) {
    if (!row.usdt || !row.phon) {
      throw new Error(`trade-parity: dual currency row ${row.id} must support USDT and PHON`);
    }
  }
  const currencyRiskIds = [
    'futures-margin-phon-hidden',
    'spot-stake-hardcode-usdt',
    'fills-currency-mismatch',
    'sports-stake-usdt-only',
    'casino-stake-usdt-only',
  ] as const;
  for (const id of currencyRiskIds) {
    if (!findTradeComplaintRisk(id)) {
      throw new Error(`trade-parity: missing dual currency complaint risk ${id}`);
    }
  }
  for (const row of TRADE_PLATFORM_SETTLEMENT_MODEL) {
    if (row.externalExchangeRouting !== false) {
      throw new Error(`trade-parity: platform settlement row ${row.id} must not route externally`);
    }
  }
  for (const row of TRADE_REALTIME_MARKET_DATA_MATRIX) {
    if (row.displayOnly !== true) {
      throw new Error(`trade-parity: realtime feed row ${row.id} must be display-only`);
    }
  }
  const platformRiskIds = ['chart-price-settlement', 'external-exchange-copy'] as const;
  for (const id of platformRiskIds) {
    if (!findTradeComplaintRisk(id)) {
      throw new Error(`trade-parity: missing platform settlement complaint risk ${id}`);
    }
  }
  const tierFeeRisk = findTradeComplaintRisk('duplicate-est-fee-row');
  if (!tierFeeRisk || tierFeeRisk.mitigatedBy !== 'live') {
    throw new Error('trade-parity: duplicate-est-fee-row must be live');
  }
  if (tierFeeRisk.ownerTodo !== P9_TRADE_TIER_FEE_DISPLAY_TODO) {
    throw new Error('trade-parity: duplicate-est-fee-row owner todo drift');
  }
  assertTierFeeDisplayContractSync();
  assertTradeMarketStatusDisplayContractSync();
  assertTradeUltraLayoutContractSync();
  assertTradeMobileLayoutContractSync();
  assertTradeLayoutDedupContractSync();
  assertTradeI18nSurfaceAuditSync();
  if (TRADE_ACTION_PATH_REGISTRY.length < 7) {
    throw new Error('trade-parity: TRADE_ACTION_PATH_REGISTRY must cover §32.7 H2 intents');
  }
  for (const row of TRADE_ACTION_PATH_REGISTRY) {
    if (!row.sharedHookModule || !row.canonicalSurface) {
      throw new Error(`trade-parity: action path row ${row.intent} incomplete`);
    }
  }
  const i18nRow = TRADE_EXCHANGE_PARITY_MATRIX.find((row) => row.id === 'i18n-surface-audit');
  if (!i18nRow || i18nRow.phonara !== 'yes' || i18nRow.tier !== 'DONE') {
    throw new Error(
      `trade-parity: i18n-surface-audit row must be DONE yes after ${P9_TRADE_I18N_SURFACE_AUDIT_TODO}`,
    );
  }
  if (i18nRow.ownerTodo !== null) {
    throw new Error(
      `trade-parity: i18n surface audit owner must be null after ${P9_TRADE_I18N_SURFACE_AUDIT_TODO}`,
    );
  }
  const ultraRow = TRADE_EXCHANGE_PARITY_MATRIX.find((row) => row.id === 'ultra-2560-layout');
  if (!ultraRow || ultraRow.phonara !== 'yes' || ultraRow.tier !== 'DONE') {
    throw new Error('trade-parity: ultra-2560-layout row must be DONE yes');
  }
  if (ultraRow.ownerTodo !== null) {
    throw new Error(
      `trade-parity: ultra layout owner must be null after ${P9_TRADE_ULTRA_LAYOUT_TODO}`,
    );
  }
  const mobileTabsRow = TRADE_EXCHANGE_PARITY_MATRIX.find((row) => row.id === 'mobile-tabs');
  if (!mobileTabsRow || mobileTabsRow.phonara !== 'yes' || mobileTabsRow.tier !== 'DONE') {
    throw new Error('trade-parity: mobile-tabs row must be DONE yes');
  }
  if (mobileTabsRow.ownerTodo !== null) {
    throw new Error(
      `trade-parity: mobile tabs owner must be null after ${P9_TRADE_MOBILE_HISTORY_TAB_TODO}`,
    );
  }
  const mobileTabsZone = findTradeZoneOwner('mobile-tabs');
  if (mobileTabsZone?.ownerTodo !== null) {
    throw new Error(
      `trade-parity: mobile-tabs zone owner must be null after ${P9_TRADE_MOBILE_HISTORY_TAB_TODO}`,
    );
  }
  const mobileBookRow = TRADE_EXCHANGE_PARITY_MATRIX.find(
    (row) => row.id === 'mobile-futures-book-tab',
  );
  if (!mobileBookRow || mobileBookRow.phonara !== 'yes' || mobileBookRow.tier !== 'DONE') {
    throw new Error('trade-parity: mobile-futures-book-tab row must be DONE yes');
  }
  if (mobileBookRow.ownerTodo !== null) {
    throw new Error(
      `trade-parity: mobile book owner must be null after ${P9_TRADE_MOBILE_FUTURES_BOOK_TAB_TODO}`,
    );
  }
  const mobileBookZone = findTradeZoneOwner('mobile-book');
  if (mobileBookZone?.ownerTodo !== null) {
    throw new Error(
      `trade-parity: mobile-book zone owner must be null after ${P9_TRADE_MOBILE_FUTURES_BOOK_TAB_TODO}`,
    );
  }
  const statusBannerRisk = findTradeComplaintRisk('duplicate-status-banner');
  if (!statusBannerRisk || statusBannerRisk.mitigatedBy !== 'live') {
    throw new Error('trade-parity: duplicate-status-banner must be live');
  }
  assertTradeToastFeedbackSync();
}
