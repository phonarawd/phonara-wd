import { useCallback, useEffect, useRef } from 'react';

import {
  diffTradeOrderFillEvents,
  diffTradePositionEvents,
  resetUserInitiatedPositionCloses,
  toTradeOpenOrderSnapshot,
  toTradePositionSnapshot,
  type TradeOpenOrderSnapshot,
  type TradePositionSnapshot,
} from '@/features/trading/trade-realtime-feedback-display';
import { showTradeFeedback, tradeFeedbackDedupId } from '@/features/trading/trade-feedback-display';
import { useAuth } from '@/contexts/auth-context';
import {
  tradingKeys,
  useFuturesPositions,
  useOpenOrders,
  useSpotOpenOrders,
} from '@/hooks/use-trading';
import { useRealtime } from '@/hooks/use-realtime';
import { useT } from '@/product/i18n';
import { useNotificationStore } from '@/stores/notifications';

/** Async fill · partial · liquidation · SL/TP feedback on `/trade*` routes. */
export function useTradeRealtimeFeedback(enabled: boolean): void {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const t = useT();
  const emitNotification = useNotificationStore((state) => state.emitNotification);

  const { orders: spotOrders, refetch: refetchSpotOrders } = useSpotOpenOrders();
  const { orders: futuresOrders, refetch: refetchFuturesOrders } = useOpenOrders();
  const { positions, refetch: refetchPositions } = useFuturesPositions();

  const spotSeededRef = useRef(false);
  const futuresSeededRef = useRef(false);
  const positionsSeededRef = useRef(false);
  const prevSpotRef = useRef<TradeOpenOrderSnapshot[]>([]);
  const prevFuturesRef = useRef<TradeOpenOrderSnapshot[]>([]);
  const prevPositionsRef = useRef<TradePositionSnapshot[]>([]);

  useEffect(() => {
    if (!enabled || !userId) return;
    spotSeededRef.current = false;
    futuresSeededRef.current = false;
    positionsSeededRef.current = false;
    prevSpotRef.current = [];
    prevFuturesRef.current = [];
    prevPositionsRef.current = [];
    resetUserInitiatedPositionCloses();
  }, [enabled, userId]);

  const emitOrderFillEvents = useCallback(
    (
      desk: 'spot' | 'futures',
      previous: TradeOpenOrderSnapshot[],
      next: TradeOpenOrderSnapshot[],
    ) => {
      for (const event of diffTradeOrderFillEvents(desk, previous, next)) {
        showTradeFeedback({
          eventId: event.eventId,
          dedupId: tradeFeedbackDedupId(event.eventId, event.orderId),
        });
      }
    },
    [],
  );

  const emitPositionEvents = useCallback(
    (previous: TradePositionSnapshot[], next: TradePositionSnapshot[]) => {
      for (const event of diffTradePositionEvents(previous, next)) {
        if (event.eventId === 'futures.liquidated') {
          const dedupId = tradeFeedbackDedupId('futures.liquidated', event.positionId);
          showTradeFeedback({ eventId: 'futures.liquidated', dedupId });
          emitNotification({
            id: dedupId,
            tone: 'danger',
            title: t('notif.liquidated.title'),
            body: t('notif.liquidated.body', { market: event.market }),
            toastZone: 'strict',
          });
          continue;
        }

        showTradeFeedback({
          eventId: 'futures.sltp.triggered',
          dedupId: tradeFeedbackDedupId('futures.sltp.triggered', event.positionId),
        });
      }
    },
    [emitNotification, t],
  );

  useEffect(() => {
    if (!enabled || !userId) return;

    const next = spotOrders.map(toTradeOpenOrderSnapshot);
    if (!spotSeededRef.current) {
      prevSpotRef.current = next;
      spotSeededRef.current = true;
      return;
    }

    emitOrderFillEvents('spot', prevSpotRef.current, next);
    prevSpotRef.current = next;
  }, [enabled, emitOrderFillEvents, spotOrders, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const next = futuresOrders.map(toTradeOpenOrderSnapshot);
    if (!futuresSeededRef.current) {
      prevFuturesRef.current = next;
      futuresSeededRef.current = true;
      return;
    }

    emitOrderFillEvents('futures', prevFuturesRef.current, next);
    prevFuturesRef.current = next;
  }, [enabled, emitOrderFillEvents, futuresOrders, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const next = positions.map(toTradePositionSnapshot);
    if (!positionsSeededRef.current) {
      prevPositionsRef.current = next;
      positionsSeededRef.current = true;
      return;
    }

    emitPositionEvents(prevPositionsRef.current, next);
    prevPositionsRef.current = next;
  }, [enabled, emitPositionEvents, positions, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const refresh = () => {
      void refetchSpotOrders();
      void refetchFuturesOrders();
      void refetchPositions();
    };

    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [enabled, refetchFuturesOrders, refetchPositions, refetchSpotOrders, userId]);

  const filter = userId ? `user_id=eq.${userId}` : undefined;
  const spotInvalidate = userId
    ? [tradingKeys.spotOpenOrders(userId), tradingKeys.spotOrderFills(userId)]
    : undefined;
  const futuresInvalidate = userId
    ? [tradingKeys.openOrders(userId), tradingKeys.orderFills(userId)]
    : undefined;
  const positionsInvalidate = userId ? [tradingKeys.futuresPositions(userId)] : undefined;
  const spotFillsInvalidate = userId ? [tradingKeys.spotOrderFills(userId)] : undefined;
  const futuresFillsInvalidate = userId ? [tradingKeys.orderFills(userId)] : undefined;

  useRealtime({
    table: 'spot_open_orders',
    filter,
    enabled: enabled && !!userId,
    invalidate: spotInvalidate,
  });

  useRealtime({
    table: 'trading_open_orders',
    filter,
    enabled: enabled && !!userId,
    invalidate: futuresInvalidate,
  });

  useRealtime({
    table: 'futures_positions',
    filter,
    enabled: enabled && !!userId,
    invalidate: positionsInvalidate,
  });

  useRealtime({
    table: 'spot_order_fills',
    event: 'INSERT',
    enabled: enabled && !!userId,
    invalidate: spotFillsInvalidate,
  });

  useRealtime({
    table: 'trading_order_fills',
    event: 'INSERT',
    enabled: enabled && !!userId,
    invalidate: futuresFillsInvalidate,
  });
}
