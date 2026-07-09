/**
 * Trade i18n surface audit — P9 WORLD step 26.
 * Every `trade.*` · `desk.trade.*` · `seo.trade.*` catalog key is wired on a P9 surface
 * or explicitly deferred (Tier B/C) with an owner todo — orphan unwired keys = FAIL.
 *
 * Authority: I18N_FIRST.md · TRADE_UX_CANON.md · trade-beginner-language-display-contract
 * Plan: p9-trade-i18n-surface-audit (§25.12.9.1-D step 26)
 */

import type { MessageKey } from '@phonara/i18n';

import {
  TRADE_BEGINNER_FORBIDDEN_SCREEN_JARGON,
  TRADE_BEGINNER_HELP_TERMS,
  TRADE_BEGINNER_HOW_IT_WORKS,
  TRADE_SUBNAV_BEGINNER_HELP,
} from './trade-beginner-language-display-contract';
import { FIAT_HINT_I18N_KEYS } from './fiat-reference-display-contract';
import {
  TRADE_EDUCATION_I18N_KEYS,
  TRADE_EDUCATION_RISK_TOPICS,
  tradeEducationRiskBodyKey,
  tradeEducationRiskTitleKey,
} from './operator-trust-pages-display-contract';
import { TRADE_TOAST_EVENT_REGISTRY } from './trade-toast-display-contract';

const TRADE_TOAST_REGISTRY_I18N_KEYS = new Set<MessageKey>(
  TRADE_TOAST_EVENT_REGISTRY.map((row) => row.i18nKey),
);

export const P9_TRADE_I18N_SURFACE_AUDIT_TODO = 'p9-trade-i18n-surface-audit' as const;

export type TradeI18nDeferTier = 'B' | 'C';

export type TradeI18nWireStatus = 'wired' | 'defer';

export type TradeI18nDeferRule = {
  id: string;
  /** First matching rule wins. */
  test: (key: string) => boolean;
  deferTier: TradeI18nDeferTier;
  ownerTodo: string;
  note: string;
};

/** Relative to `apps/web/src` — static scan roots for vitest audit (surfaces + features + shell glue). */
export const TRADE_I18N_SURFACE_SCAN_ROOTS = [
  'product/primitives',
  'product/surfaces/trade',
  'product/surfaces/staking',
  'features/trading',
  'hooks/use-trading.ts',
  'product/shell/trade-subnav.ts',
  'product/shell/appshell.tsx',
  'domain/trade-beginner-language-display-contract.ts',
  'domain/trade-market-status-display-contract.ts',
  'domain/trade-desk-fetch-error-display-contract.ts',
  'domain/operator-trust-pages-display-contract.ts',
  'domain/tier-fee-display-contract.ts',
  'domain/margin-position-mode-display-contract.ts',
  'domain/fiat-reference-display-contract.ts',
] as const;

/** Keys wired via domain contracts or shell manifests (not always visible as string literals in surfaces). */
export const TRADE_I18N_CONTRACT_WIRED_KEYS: readonly MessageKey[] = [
  ...Object.values(TRADE_EDUCATION_I18N_KEYS),
  ...TRADE_EDUCATION_RISK_TOPICS.flatMap((topic) => [
    tradeEducationRiskTitleKey(topic),
    tradeEducationRiskBodyKey(topic),
  ]),
  ...TRADE_BEGINNER_HOW_IT_WORKS.flatMap((slot) => [slot.titleKey, ...slot.stepKeys]),
  ...TRADE_BEGINNER_HELP_TERMS.flatMap((term) => [term.labelKey, term.bodyKey]),
  ...TRADE_SUBNAV_BEGINNER_HELP.flatMap((row) => [row.subnavLabelKey, row.helpKey]),
  'trade.subnav.aria',
  'trade.subnav.spot',
  'trade.subnav.futures',
  'trade.subnav.positions',
  'trade.subnav.orders',
  'trade.subnav.history',
  'trade.gate.spotBlocked',
  'trade.gate.futuresBlocked',
  'trade.dataStatus.circuit',
  'trade.dataStatus.circuitDescription',
  'trade.dataStatus.stale',
  'trade.dataStatus.staleDescription',
  'trade.dataStatus.freeze',
  'trade.dataStatus.freezeDescription',
  'trade.dataStatus.errorDescription',
  'trade.displayFeed.staleBadge',
  'trade.displayFeed.staleDescription',
  'trade.orderbook.displayOnly',
  'trade.margin.crossDisabled',
  'trade.order.crossDisabled',
  'seo.trade.title',
  ...Object.values(FIAT_HINT_I18N_KEYS),
] as const;

/**
 * Tier-B = E21 / built_hidden branches · Tier-C = post-P13 · legacy hub · staking page · chart extras.
 * New catalog keys only in their owner-todo session — this audit classifies + wires existing keys only.
 */
export const TRADE_I18N_DEFER_RULES: readonly TradeI18nDeferRule[] = [
  {
    id: 'legacy-desk-hub',
    test: (key) => key.startsWith('desk.trade.'),
    deferTier: 'C',
    ownerTodo: 'post-p13-legacy-desk-hub',
    note: 'Pre-P9 multi-mode desk hub — canonical routes are /trade/* subnav only',
  },
  {
    id: 'trade-hub-sections',
    test: (key) =>
      key.startsWith('trade.hub.') ||
      key.startsWith('trade.section.') ||
      key.startsWith('trade.rules.'),
    deferTier: 'C',
    ownerTodo: 'post-p13-trade-hub',
    note: 'Legacy trade landing sections — not mounted on P9 desk surfaces',
  },
  {
    id: 'staking-page-copy',
    test: (key) =>
      key.startsWith('trade.staking.') &&
      !key.includes('.howItWorks.') &&
      key !== 'trade.staking.openStaking',
    deferTier: 'C',
    ownerTodo: 'p9-page-staking-positions',
    note: 'Staking hub hero/pool copy — staking surfaces owner (howItWorks wired via beginner contract)',
  },
  {
    id: 'legacy-mode-tabs',
    test: (key) => key.startsWith('trade.mode.') || key.startsWith('trade.tab.'),
    deferTier: 'C',
    ownerTodo: 'post-p13-trade-mode-switcher',
    note: 'Old mode switcher tabs — AppShell subnav is canonical (§12.19)',
  },
  {
    id: 'legacy-orderbook-pascal',
    test: (key) => key.startsWith('trade.orderBook.'),
    deferTier: 'C',
    ownerTodo: 'deprecated.uiReset.orderBookPascalCase',
    note: 'Duplicate PascalCase keys — canonical = trade.orderbook.* on SpotOrderBookPanel',
  },
  {
    id: 'orderbook-side-labels',
    test: (key) => key === 'trade.orderbook.asks' || key === 'trade.orderbook.bids',
    deferTier: 'C',
    ownerTodo: 'p9-trade-orderbook-parity',
    note: 'Optional ask/bid column headers — book uses price/size/total only',
  },
  {
    id: 'chart-advanced-overlays',
    test: (key) =>
      key.startsWith('trade.chart.') &&
      ![
        'trade.chart.loading',
        'trade.chart.emptyTitle',
        'trade.chart.emptyDescription',
        'trade.chart.errorTitle',
        'trade.chart.syncedTitle',
        'trade.chart.intervals',
        'trade.chart.typeCandles',
        'trade.chart.typeLine',
        'trade.chart.fullscreen',
        'trade.chart.exitFullscreen',
        'trade.chart.resetLayout',
        'trade.chart.overlays',
        'trade.chart.overlayMa',
        'trade.chart.overlayEma',
        'trade.chart.crosshairLegend',
        'trade.chart.ohlcOpen',
        'trade.chart.ohlcHigh',
        'trade.chart.ohlcLow',
        'trade.chart.ohlcClose',
        'trade.chart.displayFeedDisclosure',
      ].includes(key),
    deferTier: 'C',
    ownerTodo: 'p9-trade-chart-overlays-lwc',
    note: 'Chart policy/volume/liq proximity copy — extend chart/* when overlays ship',
  },
  {
    id: 'market-picker',
    test: (key) => key.startsWith('trade.markets.'),
    deferTier: 'C',
    ownerTodo: 'post-p13-watchlist',
    note: 'Multi-tab symbol picker — market selector only on P9 desk header',
  },
  {
    id: 'data-status-secondary',
    test: (key) =>
      key.startsWith('trade.dataStatus.') &&
      ![
        'trade.dataStatus.circuit',
        'trade.dataStatus.circuitDescription',
        'trade.dataStatus.stale',
        'trade.dataStatus.staleDescription',
        'trade.dataStatus.errorDescription',
      ].includes(key),
    deferTier: 'C',
    ownerTodo: P9_TRADE_I18N_SURFACE_AUDIT_TODO,
    note: 'Secondary sync/error banners — primary kill/circuit/stale wired on TradeMarketStatusBanner',
  },
  {
    id: 'e21-order-branches',
    test: (key) =>
      key === 'trade.order.limitComingSoon' ||
      key === 'trade.order.stopComingSoon' ||
      key === 'trade.order.margin.crossHint' ||
      key === 'trade.order.placed',
    deferTier: 'B',
    ownerTodo: 'ew-e21-engine-spot-limit-stop',
    note: 'Legacy coming-soon keys — spot limit/stop live (T1); catalog cleanup deferred',
  },
  {
    id: 'legacy-spot-submit-labels',
    test: (key) =>
      key === 'trade.spot.placed' ||
      key === 'trade.spot.submitBuy' ||
      key === 'trade.spot.submitSell',
    deferTier: 'C',
    ownerTodo: 'deprecated.uiReset.spotSubmitLabels',
    note: 'Superseded by trade.spot.submitBuyBase · submitSellBase + pair-aware toasts',
  },
  {
    id: 'legacy-single-word-actions',
    test: (key) =>
      [
        'trade.buy',
        'trade.sell',
        'trade.spot',
        'trade.futures',
        'trade.amount',
        'trade.leverage',
        'trade.closePosition',
        'trade.openPosition',
        'trade.noPositions',
        'trade.myPositions',
        'trade.longUp',
        'trade.shortDown',
        'trade.mobile.buyLong',
        'trade.mobile.sellShort',
        'trade.mobile.longEntry',
        'trade.mobile.shortEntry',
        'trade.chartPreview',
        'trade.spotTitle',
        'trade.spotRate',
        'trade.payUsdt',
        'trade.buyPhon',
        'trade.sellPhonBtn',
        'trade.sellPhonLabel',
        'trade.buyDone',
        'trade.sellDone',
        'trade.estReceiveFee',
        'trade.simWarning',
        'trade.highLeverageWarning',
        'trade.footer.learnMore',
        'trade.footer.note',
        'trade.loginRequired',
        'trade.favorite',
        'trade.indexPrice',
        'trade.perp',
        'trade.pnlPercent',
        'trade.liquidationDistance',
        'trade.oracleSettlementPrice',
        'trade.recentClosed',
        'trade.partialClose50Btn',
        'trade.openLongPosition',
        'trade.openShortPosition',
        'trade.marginWith',
        'trade.gate.stakingBlocked',
        'trade.staking.openStaking',
        'trade.fills.loadError',
        'trade.order.size',
        'trade.title',
      ].includes(key),
    deferTier: 'C',
    ownerTodo: 'deprecated.uiReset.preP9TradeDesk',
    note: 'Pre-P9 monolithic desk strings — P9 surfaces use granular trade.order.* · trade.spot.* keys',
  },
  {
    id: 'seo-trade-meta',
    test: (key) => key === 'seo.trade.description',
    deferTier: 'C',
    ownerTodo: 'p1-foundation-brand',
    note: 'Page meta description — desk uses seo.trade.title only today',
  },
  {
    id: 'real-fill-disclosure',
    test: (key) => key === 'trade.realFill.disclosure',
    deferTier: 'C',
    ownerTodo: 'p9-trade-recent-trades-rail',
    note: 'Per-fill toast disclosure — rail uses trade.recent.referenceDisclosure',
  },
  {
    id: 'toast-realtime-feedback',
    test: (key) => TRADE_TOAST_REGISTRY_I18N_KEYS.has(key as MessageKey),
    deferTier: 'B',
    ownerTodo: 'phase-2-toast-arch',
    note: 'Desk toast/realtime feedback — wired via TRADE_TOAST_EVENT_REGISTRY + showTradeFeedback, not static t() JSX scan',
  },
] as const;

const TRADE_CATALOG_KEY_PREFIXES = ['trade.', 'desk.trade.', 'seo.trade.'] as const;

export function isTradeCatalogKey(key: string): boolean {
  return TRADE_CATALOG_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function resolveTradeI18nDeferRule(key: string): TradeI18nDeferRule | undefined {
  return TRADE_I18N_DEFER_RULES.find((rule) => rule.test(key));
}

export function classifyTradeI18nKey(
  key: string,
  wiredKeys: ReadonlySet<string>,
):
  | { status: 'wired' }
  | { status: 'defer'; deferTier: TradeI18nDeferTier; ownerTodo: string }
  | { status: 'unclassified' } {
  if (wiredKeys.has(key)) {
    return { status: 'wired' };
  }
  const defer = resolveTradeI18nDeferRule(key);
  if (defer) {
    return { status: 'defer', deferTier: defer.deferTier, ownerTodo: defer.ownerTodo };
  }
  return { status: 'unclassified' };
}

/** §22.2.1 external-exchange-copy — catalog must not claim Binance/Bybit/CLOB execution. */
export function assertTradeI18nExternalCopyFree(catalogValues: readonly string[]): void {
  const forbidden = TRADE_BEGINNER_FORBIDDEN_SCREEN_JARGON.filter(
    (term) => term === 'Binance' || term === 'Bybit' || term === 'external exchange',
  );
  for (const value of catalogValues) {
    const lower = value.toLowerCase();
    for (const term of forbidden) {
      if (lower.includes(term.toLowerCase())) {
        throw new Error(
          `trade-i18n-audit: forbidden external exchange copy: "${term}" in catalog value`,
        );
      }
    }
  }
}

export function assertTradeI18nSurfaceAuditSync(): void {
  if (TRADE_I18N_DEFER_RULES.length < 10) {
    throw new Error('trade-i18n-audit: defer rule registry too small');
  }
  const ruleIds = TRADE_I18N_DEFER_RULES.map((row) => row.id);
  if (new Set(ruleIds).size !== ruleIds.length) {
    throw new Error('trade-i18n-audit: duplicate defer rule id');
  }
  for (const key of TRADE_I18N_CONTRACT_WIRED_KEYS) {
    if (!isTradeCatalogKey(key)) {
      throw new Error(`trade-i18n-audit: contract wired key ${key} is not a trade catalog prefix`);
    }
  }
  for (const rule of TRADE_I18N_DEFER_RULES) {
    if (!rule.ownerTodo || !rule.note) {
      throw new Error(`trade-i18n-audit: defer rule ${rule.id} incomplete`);
    }
  }
}
