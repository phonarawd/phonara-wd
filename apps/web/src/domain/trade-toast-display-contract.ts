/**
 * Trade toast event registry — Phase 2B P2-11 · UI = RPC = Toast honest.
 * Syncs with `trade-feedback-display.ts` and `trade-exchange-parity-display-contract`.
 */

import type { MessageKey } from '@phonara/i18n';

export type TradeToastPhase = 'P2-10' | 'P2-11' | 'P2-12' | 'T1' | 'T2' | 'Phase 1';

export type TradeToastCta = 'orders' | 'positions' | 'wallet';

export type TradeToastImplementation = 'yes' | 'deferred';

export type TradeToastEventId =
  | 'spot.market.buy'
  | 'spot.market.sell'
  | 'spot.limit.placed'
  | 'spot.limit.filled'
  | 'spot.limit.partial'
  | 'spot.order.canceled'
  | 'futures.market.open'
  | 'futures.limit.placed'
  | 'futures.order.canceled'
  | 'futures.position.closed'
  | 'futures.margin.adjusted'
  | 'futures.sltp.updated'
  | 'futures.sltp.triggered'
  | 'futures.trailingStop.set'
  | 'futures.trailingStop.cleared'
  | 'futures.liquidated'
  | 'futures.funding.applied'
  | 'staking.staked'
  | 'staking.unstaked'
  | 'staking.claimed'
  | 'staking.claimNothing'
  | 'trade.confirm.priceChanged'
  | 'trade.rpc.error'
  | 'trade.submit.blocked';

export type TradeToastRegistryRow = {
  eventId: TradeToastEventId;
  trigger: string;
  i18nKey: MessageKey;
  phase: TradeToastPhase;
  cta: TradeToastCta | null;
  ownerTodo: string | null;
  implemented: TradeToastImplementation;
  mitigatedBy: 'toast' | 'inline+toast' | 'realtime';
};

/** Canonical event → i18n map for spot · futures · staking desk feedback. */
export const TRADE_TOAST_EVENT_REGISTRY: readonly TradeToastRegistryRow[] = [
  {
    eventId: 'spot.market.buy',
    trigger: 'rpc spot market buy OK',
    i18nKey: 'trade.spot.buyDoneBase',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'spot.market.sell',
    trigger: 'rpc spot market sell OK',
    i18nKey: 'trade.spot.sellDoneQuote',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'spot.limit.placed',
    trigger: 'spot limit/stop RPC OK',
    i18nKey: 'trade.orderPlaced',
    phase: 'T1',
    cta: 'orders',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'spot.limit.filled',
    trigger: 'spot fill cron / realtime diff',
    i18nKey: 'trade.order.filled',
    phase: 'P2-12',
    cta: 'orders',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'realtime',
  },
  {
    eventId: 'spot.limit.partial',
    trigger: 'spot partial fill',
    i18nKey: 'trade.order.partialFill',
    phase: 'P2-12',
    cta: 'orders',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'realtime',
  },
  {
    eventId: 'spot.order.canceled',
    trigger: 'spot cancel OK',
    i18nKey: 'trade.orderCanceled',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'futures.market.open',
    trigger: 'futures market open OK',
    i18nKey: 'trade.openDone',
    phase: 'P2-10',
    cta: 'positions',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'futures.limit.placed',
    trigger: 'futures limit/stop RPC OK',
    i18nKey: 'trade.orderPlaced',
    phase: 'P2-10',
    cta: 'orders',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'futures.order.canceled',
    trigger: 'futures cancel OK',
    i18nKey: 'trade.orderCanceled',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'futures.position.closed',
    trigger: 'full or partial close OK',
    i18nKey: 'trade.closeDone',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'futures.margin.adjusted',
    trigger: 'isolated margin adjust OK',
    i18nKey: 'trade.marginAdjustSuccess',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'futures.sltp.updated',
    trigger: 'SL/TP RPC OK',
    i18nKey: 'trade.sltp.updated',
    phase: 'T2',
    cta: 'positions',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'futures.sltp.triggered',
    trigger: 'stop cron',
    i18nKey: 'trade.sltp.triggered',
    phase: 'P2-12',
    cta: 'positions',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'realtime',
  },
  {
    eventId: 'futures.trailingStop.set',
    trigger: 'trailing stop RPC OK',
    i18nKey: 'trade.trailingStop.set',
    phase: 'T2',
    cta: 'positions',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'futures.trailingStop.cleared',
    trigger: 'clear trailing stop RPC OK',
    i18nKey: 'trade.trailingStop.cleared',
    phase: 'T2',
    cta: 'positions',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'futures.liquidated',
    trigger: 'liquidation cron',
    i18nKey: 'trade.liquidation.notice',
    phase: 'P2-12',
    cta: 'wallet',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'realtime',
  },
  {
    eventId: 'futures.funding.applied',
    trigger: 'funding settlement cron',
    i18nKey: 'trade.funding.applied',
    phase: 'T2',
    cta: null,
    ownerTodo: 'engine-t2-futures-completion',
    implemented: 'deferred',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'staking.staked',
    trigger: 'stake RPC OK',
    i18nKey: 'staking.stakeDone',
    phase: 'P2-10',
    cta: 'positions',
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'staking.unstaked',
    trigger: 'unstake RPC OK',
    i18nKey: 'staking.unstakeDone',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'staking.claimed',
    trigger: 'claim RPC OK',
    i18nKey: 'staking.claimDone',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'staking.claimNothing',
    trigger: 'claim RPC nothing_to_claim',
    i18nKey: 'staking.claimNothingYet',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'trade.confirm.priceChanged',
    trigger: 'confirm dialog slippage drift',
    i18nKey: 'trade.confirm.priceChanged',
    phase: 'P2-10',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'trade.rpc.error',
    trigger: 'any RpcError / translateError path',
    i18nKey: 'error.UNKNOWN',
    phase: 'P2-11',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'toast',
  },
  {
    eventId: 'trade.submit.blocked',
    trigger: 'stale/kill/gate inline+toast',
    i18nKey: 'trade.dataStatus.staleDescription',
    phase: 'Phase 1',
    cta: null,
    ownerTodo: null,
    implemented: 'yes',
    mitigatedBy: 'inline+toast',
  },
] as const;

const REGISTRY_BY_ID = new Map(TRADE_TOAST_EVENT_REGISTRY.map((row) => [row.eventId, row]));

export function findTradeToastRegistryRow(
  eventId: TradeToastEventId,
): TradeToastRegistryRow | undefined {
  return REGISTRY_BY_ID.get(eventId);
}

export function resolveTradeToastI18nKey(
  eventId: TradeToastEventId,
  override?: MessageKey,
): MessageKey {
  if (override) return override;
  const row = findTradeToastRegistryRow(eventId);
  if (!row) throw new Error(`trade-toast: unknown eventId ${eventId}`);
  return row.i18nKey;
}

export function listTradeToastRowsByPhase(phase: TradeToastPhase): TradeToastRegistryRow[] {
  return TRADE_TOAST_EVENT_REGISTRY.filter((row) => row.phase === phase);
}

export function assertTradeToastRegistrySync(): void {
  const ids = new Set<string>();
  for (const row of TRADE_TOAST_EVENT_REGISTRY) {
    if (ids.has(row.eventId)) {
      throw new Error(`trade-toast: duplicate eventId ${row.eventId}`);
    }
    ids.add(row.eventId);
    if (row.implemented === 'deferred' && !row.ownerTodo) {
      throw new Error(`trade-toast: deferred ${row.eventId} requires ownerTodo`);
    }
    if (row.eventId === 'trade.rpc.error' && row.i18nKey !== 'error.UNKNOWN') {
      throw new Error('trade-toast: trade.rpc.error placeholder key must stay error.UNKNOWN');
    }
  }
}
