/**
 * Trade async feedback diff — Phase 2B P2-12.
 * Pure order/position snapshot transitions for useTradeRealtimeFeedback.
 */

import { toDecimal } from '@phonara/money';

import type { TradeToastEventId } from '@/domain/trade-toast-display-contract';

export type TradeOpenOrderSnapshot = {
  id: string;
  filled_quantity: string;
  quantity: string;
};

export type TradePositionSnapshot = {
  id: string;
  status: string;
  market: string;
  stop_loss: string | null;
  take_profit: string | null;
};

export type TradeOrderFillEvent = {
  eventId: Extract<TradeToastEventId, 'spot.limit.filled' | 'spot.limit.partial'>;
  orderId: string;
  desk: 'spot' | 'futures';
};

export type TradePositionFeedbackEvent =
  | { eventId: 'futures.liquidated'; positionId: string; market: string }
  | { eventId: 'futures.sltp.triggered'; positionId: string };

const userClosedPositionIdsRef = { current: new Map<string, number>() };

export function tradeOrderBaselineKey(desk: 'spot' | 'futures', orderId: string): string {
  return `${desk}:${orderId}`;
}

export function registerUserInitiatedPositionClose(positionId: string, ttlMs = 15_000): void {
  userClosedPositionIdsRef.current.set(positionId, Date.now() + ttlMs);
}

export function isUserInitiatedPositionClose(positionId: string): boolean {
  const expiry = userClosedPositionIdsRef.current.get(positionId);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    userClosedPositionIdsRef.current.delete(positionId);
    return false;
  }
  return true;
}

export function resetUserInitiatedPositionCloses(): void {
  userClosedPositionIdsRef.current.clear();
}

function hasFillProgress(filledQuantity: string): boolean {
  return toDecimal(filledQuantity).gt(0);
}

function isFullyFilled(filledQuantity: string, quantity: string): boolean {
  return toDecimal(quantity).gt(0) && toDecimal(filledQuantity).gte(toDecimal(quantity));
}

function filledIncreased(previousFilled: string, nextFilled: string): boolean {
  return toDecimal(nextFilled).gt(toDecimal(previousFilled));
}

function resolveFillEvent(
  previousFilled: string,
  nextFilled: string,
  quantity: string,
): TradeOrderFillEvent['eventId'] | null {
  if (!filledIncreased(previousFilled, nextFilled)) return null;
  if (isFullyFilled(nextFilled, quantity)) return 'spot.limit.filled';
  return 'spot.limit.partial';
}

/** Diff open-order snapshots after query refresh — spot and futures share generic fill copy. */
export function diffTradeOrderFillEvents(
  desk: 'spot' | 'futures',
  previous: ReadonlyArray<TradeOpenOrderSnapshot>,
  next: ReadonlyArray<TradeOpenOrderSnapshot>,
): TradeOrderFillEvent[] {
  const events: TradeOrderFillEvent[] = [];
  const prevById = new Map(previous.map((order) => [order.id, order]));
  const nextById = new Map(next.map((order) => [order.id, order]));

  for (const order of next) {
    const prev = prevById.get(order.id);
    if (!prev) continue;
    const eventId = resolveFillEvent(prev.filled_quantity, order.filled_quantity, order.quantity);
    if (!eventId) continue;
    events.push({ eventId, orderId: order.id, desk });
  }

  for (const prev of previous) {
    if (nextById.has(prev.id)) continue;
    if (!hasFillProgress(prev.filled_quantity)) continue;
    const eventId = isFullyFilled(prev.filled_quantity, prev.quantity)
      ? 'spot.limit.filled'
      : 'spot.limit.partial';
    events.push({ eventId, orderId: prev.id, desk });
  }

  return events;
}

function hadProtectiveOrder(position: TradePositionSnapshot): boolean {
  return Boolean(position.stop_loss) || Boolean(position.take_profit);
}

/** Diff futures position rows — liquidation inbox + SL/TP async close detection. */
export function diffTradePositionEvents(
  previous: ReadonlyArray<TradePositionSnapshot>,
  next: ReadonlyArray<TradePositionSnapshot>,
): TradePositionFeedbackEvent[] {
  const events: TradePositionFeedbackEvent[] = [];
  const prevById = new Map(previous.map((position) => [position.id, position]));

  for (const position of next) {
    const prev = prevById.get(position.id);
    if (!prev || prev.status !== 'open') continue;

    if (position.status === 'liquidated') {
      events.push({
        eventId: 'futures.liquidated',
        positionId: position.id,
        market: position.market,
      });
      continue;
    }

    if (
      position.status === 'closed' &&
      hadProtectiveOrder(prev) &&
      !isUserInitiatedPositionClose(position.id)
    ) {
      events.push({ eventId: 'futures.sltp.triggered', positionId: position.id });
    }
  }

  return events;
}

export function toTradeOpenOrderSnapshot(order: {
  id: string;
  filled_quantity: string;
  quantity: string;
}): TradeOpenOrderSnapshot {
  return {
    id: order.id,
    filled_quantity: order.filled_quantity,
    quantity: order.quantity,
  };
}

export function toTradePositionSnapshot(position: {
  id: string;
  status: string;
  market: string;
  stop_loss: string | null;
  take_profit: string | null;
}): TradePositionSnapshot {
  return {
    id: position.id,
    status: position.status,
    market: position.market,
    stop_loss: position.stop_loss,
    take_profit: position.take_profit,
  };
}

export function tradeLiquidationNotificationId(positionId: string): string {
  return `trade:liquidated:${positionId}`;
}
