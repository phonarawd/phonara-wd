/**
 * Trade beginner (elementary) language — §13.1.3 · §30.2.
 * How-it-works slots · HelpTip term registry · subnav help keys.
 * Separate from risk education (§32.5 · operator-trust-pages-display-contract).
 *
 * Authority: TRADE_BEGINNER_LANGUAGE_CANON.md · REBUILD_PLAN_v1 §13.1.3
 */

import type { MessageKey } from '@phonara/i18n';

import { P9_TRADE_POSITION_MODE_LABEL_TODO } from './margin-position-mode-display-contract';
import { P9_TRADE_TIER_FEE_DISPLAY_TODO } from './tier-fee-display-contract';

export const P9_TRADE_BEGINNER_HELP_LAYER_TODO = 'p9-trade-beginner-help-layer' as const;

export type TradeHelpOwnerTodo =
  | typeof P9_TRADE_BEGINNER_HELP_LAYER_TODO
  | typeof P9_TRADE_POSITION_MODE_LABEL_TODO
  | typeof P9_TRADE_TIER_FEE_DISPLAY_TODO
  | 'ew-e21-ui-trade-engine-unlocks';

export type TradeBeginnerSurface = 'spot' | 'futures' | 'staking' | 'staking_positions';

export type TradeHowItWorksSlot = {
  id: string;
  surface: TradeBeginnerSurface;
  route: string;
  titleKey: MessageKey;
  stepKeys: readonly [MessageKey, MessageKey, MessageKey];
  persistenceId: string;
  ownerTodo: typeof P9_TRADE_BEGINNER_HELP_LAYER_TODO;
};

/** §30.2 — collapsible 3-step cards per trade surface. */
export const TRADE_BEGINNER_HOW_IT_WORKS: readonly TradeHowItWorksSlot[] = [
  {
    id: 'spot-desk',
    surface: 'spot',
    route: '/trade',
    titleKey: 'trade.spot.howItWorks.title',
    stepKeys: [
      'trade.spot.howItWorks.step1',
      'trade.spot.howItWorks.step2',
      'trade.spot.howItWorks.step3',
    ],
    persistenceId: 'trade-spot',
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'futures-desk',
    surface: 'futures',
    route: '/trade/futures',
    titleKey: 'trade.futures.howItWorks.title',
    stepKeys: [
      'trade.futures.howItWorks.step1',
      'trade.futures.howItWorks.step2',
      'trade.futures.howItWorks.step3',
    ],
    persistenceId: 'trade-futures',
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'staking-hub',
    surface: 'staking',
    route: '/staking',
    titleKey: 'trade.staking.howItWorks.title',
    stepKeys: [
      'trade.staking.howItWorks.step1',
      'trade.staking.howItWorks.step2',
      'trade.staking.howItWorks.step3',
    ],
    persistenceId: 'trade-staking',
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
] as const;

export type TradeHelpTermId =
  | 'spot_buy'
  | 'spot_sell'
  | 'long'
  | 'short'
  | 'leverage'
  | 'margin'
  | 'margin_mode'
  | 'position_mode'
  | 'reduce_only'
  | 'liquidation'
  | 'order_book'
  | 'funding'
  | 'mark_price'
  | 'staking_lock'
  | 'staking_apr'
  | 'stake_currency'
  | 'tier_fee';

export type TradeHelpTerm = {
  id: TradeHelpTermId;
  labelKey: MessageKey;
  bodyKey: MessageKey;
  surfaces: readonly TradeBeginnerSurface[];
  ownerTodo: TradeHelpOwnerTodo;
};

/** §30.2 HelpTip — 3 sentences max · i18n `trade.help.{term}.*`. */
export const TRADE_BEGINNER_HELP_TERMS: readonly TradeHelpTerm[] = [
  {
    id: 'spot_buy',
    labelKey: 'trade.help.spot_buy.label',
    bodyKey: 'trade.help.spot_buy.body',
    surfaces: ['spot'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'spot_sell',
    labelKey: 'trade.help.spot_sell.label',
    bodyKey: 'trade.help.spot_sell.body',
    surfaces: ['spot'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'long',
    labelKey: 'trade.help.long.label',
    bodyKey: 'trade.help.long.body',
    surfaces: ['futures'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'short',
    labelKey: 'trade.help.short.label',
    bodyKey: 'trade.help.short.body',
    surfaces: ['futures'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'leverage',
    labelKey: 'trade.help.leverage.label',
    bodyKey: 'trade.help.leverage.body',
    surfaces: ['futures'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'margin',
    labelKey: 'trade.help.margin.label',
    bodyKey: 'trade.help.margin.body',
    surfaces: ['futures'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'margin_mode',
    labelKey: 'trade.help.margin_mode.label',
    bodyKey: 'trade.help.margin_mode.body',
    surfaces: ['futures'],
    ownerTodo: P9_TRADE_POSITION_MODE_LABEL_TODO,
  },
  {
    id: 'position_mode',
    labelKey: 'trade.help.position_mode.label',
    bodyKey: 'trade.help.position_mode.body',
    surfaces: ['futures'],
    ownerTodo: P9_TRADE_POSITION_MODE_LABEL_TODO,
  },
  {
    id: 'reduce_only',
    labelKey: 'trade.help.reduce_only.label',
    bodyKey: 'trade.help.reduce_only.body',
    surfaces: ['futures'],
    ownerTodo: 'ew-e21-ui-trade-engine-unlocks',
  },
  {
    id: 'liquidation',
    labelKey: 'trade.help.liquidation.label',
    bodyKey: 'trade.help.liquidation.body',
    surfaces: ['futures', 'staking_positions'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'order_book',
    labelKey: 'trade.help.order_book.label',
    bodyKey: 'trade.help.order_book.body',
    surfaces: ['spot', 'futures'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'funding',
    labelKey: 'trade.help.funding.label',
    bodyKey: 'trade.help.funding.body',
    surfaces: ['futures'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'mark_price',
    labelKey: 'trade.help.mark_price.label',
    bodyKey: 'trade.help.mark_price.body',
    surfaces: ['futures'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'staking_lock',
    labelKey: 'trade.help.staking_lock.label',
    bodyKey: 'trade.help.staking_lock.body',
    surfaces: ['staking', 'staking_positions'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'staking_apr',
    labelKey: 'trade.help.staking_apr.label',
    bodyKey: 'trade.help.staking_apr.body',
    surfaces: ['staking'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'stake_currency',
    labelKey: 'trade.help.stake_currency.label',
    bodyKey: 'trade.help.stake_currency.body',
    surfaces: ['staking', 'spot', 'futures'],
    ownerTodo: P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  },
  {
    id: 'tier_fee',
    labelKey: 'trade.help.tier_fee.label',
    bodyKey: 'trade.help.tier_fee.body',
    surfaces: ['spot', 'futures'],
    ownerTodo: P9_TRADE_TIER_FEE_DISPLAY_TODO,
  },
] as const;

export type TradeSubnavHelpKey = {
  subnavLabelKey: MessageKey;
  helpKey: MessageKey;
};

/** One-line subnav help — §13.1.3 menu clarity. */
export const TRADE_SUBNAV_BEGINNER_HELP: readonly TradeSubnavHelpKey[] = [
  { subnavLabelKey: 'trade.subnav.spot', helpKey: 'trade.subnav.help.spot' },
  { subnavLabelKey: 'trade.subnav.futures', helpKey: 'trade.subnav.help.futures' },
  { subnavLabelKey: 'trade.subnav.positions', helpKey: 'trade.subnav.help.positions' },
  { subnavLabelKey: 'trade.subnav.orders', helpKey: 'trade.subnav.help.orders' },
  { subnavLabelKey: 'trade.subnav.history', helpKey: 'trade.subnav.help.history' },
] as const;

/** User-facing jargon forbidden without HelpTip (TRADE_BEGINNER_LANGUAGE_CANON §7). */
export const TRADE_BEGINNER_FORBIDDEN_SCREEN_JARGON = [
  'CLOB',
  'maker',
  'taker',
  'rpc_',
  'synthetic book',
  'house fill',
  'Binance',
  'Bybit',
  'external exchange',
] as const;

export function findTradeHowItWorksSlot(id: string): TradeHowItWorksSlot | undefined {
  return TRADE_BEGINNER_HOW_IT_WORKS.find((row) => row.id === id);
}

export function findTradeHelpTerm(id: TradeHelpTermId): TradeHelpTerm | undefined {
  return TRADE_BEGINNER_HELP_TERMS.find((row) => row.id === id);
}

export function listTradeHelpTermsBySurface(surface: TradeBeginnerSurface): TradeHelpTerm[] {
  return TRADE_BEGINNER_HELP_TERMS.filter((row) => row.surfaces.includes(surface));
}

export function assertTradeBeginnerLanguageContractSync(): void {
  if (TRADE_BEGINNER_HOW_IT_WORKS.length < 3) {
    throw new Error('trade-beginner: must register spot · futures · staking howItWorks');
  }
  for (const slot of TRADE_BEGINNER_HOW_IT_WORKS) {
    if (slot.stepKeys.length !== 3) {
      throw new Error(`trade-beginner: ${slot.id} must have exactly 3 steps`);
    }
  }
  const requiredTerms: TradeHelpTermId[] = [
    'spot_buy',
    'spot_sell',
    'leverage',
    'liquidation',
    'staking_lock',
    'stake_currency',
  ];
  for (const id of requiredTerms) {
    if (!findTradeHelpTerm(id)) {
      throw new Error(`trade-beginner: missing required help term ${id}`);
    }
  }
}
