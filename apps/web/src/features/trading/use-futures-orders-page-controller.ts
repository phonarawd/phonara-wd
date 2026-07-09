import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  useFuturesActions,
  useOpenOrders,
  useTradingOrderFills,
  type TradingOpenOrder,
  type TradingOrderFill,
} from '@/hooks/use-trading';
import { useI18n, useT } from '@/product/i18n';
import {
  showTradeFeedback,
  showTradeRpcErrorFeedback,
  tradeFeedbackDedupId,
} from '@/features/trading/trade-feedback-display';

export type FuturesOrdersTab = 'open' | 'history';

export type FuturesOrdersPageControllerView = {
  t: ReturnType<typeof useT>;
  locale: string;
  authLoading: boolean;
  activeTab: FuturesOrdersTab;
  setActiveTab: (tab: FuturesOrdersTab) => void;
  ordersLoading: boolean;
  ordersFetching: boolean;
  ordersError: boolean;
  orders: TradingOpenOrder[];
  orderCount: number;
  fillsLoading: boolean;
  fillsFetching: boolean;
  fillsError: boolean;
  fills: TradingOrderFill[];
  fillCount: number;
  cancelBusy: boolean;
  cancellingOrderId: string | null;
  cancelOrder: (orderId: string) => Promise<void>;
  refresh: () => void;
};

export function useFuturesOrdersPageController(): FuturesOrdersPageControllerView {
  const t = useT();
  const { locale } = useI18n();
  const { loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<FuturesOrdersTab>('open');
  const {
    orders,
    loading: ordersLoading,
    refresh: refreshOrders,
    isError: ordersError,
    isFetching: ordersFetching,
  } = useOpenOrders();
  const {
    fills,
    loading: fillsLoading,
    refresh: refreshFills,
    isError: fillsError,
    isFetching: fillsFetching,
  } = useTradingOrderFills();
  const { cancelOrder: cancelOrderRpc, busy: cancelBusy, error } = useFuturesActions(refreshOrders);

  useEffect(() => {
    if (error) showTradeRpcErrorFeedback(error);
  }, [error]);

  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const cancelOrder = useCallback(
    async (orderId: string) => {
      setCancellingOrderId(orderId);
      try {
        const result = await cancelOrderRpc(orderId);
        if (result) {
          showTradeFeedback({
            eventId: 'futures.order.canceled',
            dedupId: tradeFeedbackDedupId('futures.order.canceled', orderId),
          });
        }
      } finally {
        setCancellingOrderId(null);
      }
    },
    [cancelOrderRpc],
  );

  const refresh = useCallback(() => {
    refreshOrders();
    refreshFills();
  }, [refreshFills, refreshOrders]);

  return {
    t,
    locale,
    authLoading,
    activeTab,
    setActiveTab,
    ordersLoading,
    ordersFetching,
    ordersError,
    orders,
    orderCount: orders.length,
    fillsLoading,
    fillsFetching,
    fillsError,
    fills,
    fillCount: fills.length,
    cancelBusy,
    cancellingOrderId,
    cancelOrder,
    refresh,
  };
}
