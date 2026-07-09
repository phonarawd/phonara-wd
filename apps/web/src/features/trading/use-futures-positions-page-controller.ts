import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  useFuturesActions,
  useFuturesPositions,
  usePrices,
  type FuturesPosition,
} from '@/hooks/use-trading';
import { useT } from '@/product/i18n';
import {
  showTradeFeedback,
  showTradeRpcErrorFeedback,
} from '@/features/trading/trade-feedback-display';
import { registerUserInitiatedPositionClose } from '@/features/trading/trade-realtime-feedback-display';

export type FuturesPositionsTab = 'open' | 'closed';

export type FuturesPositionsPageControllerView = {
  t: ReturnType<typeof useT>;
  authLoading: boolean;
  positionsLoading: boolean;
  positionsFetching: boolean;
  positionsError: boolean;
  activeTab: FuturesPositionsTab;
  openPositions: FuturesPosition[];
  closedPositions: FuturesPosition[];
  openCount: number;
  closedCount: number;
  closeBusy: boolean;
  closingPositionId: string | null;
  partialCloseBusy: boolean;
  partialClosingPositionId: string | null;
  marginAdjustBusy: boolean;
  adjustingMarginPositionId: string | null;
  sltpEditBusy: boolean;
  updatingSltpPositionId: string | null;
  markPrices: Record<string, string>;
  isMarkUnavailable: (market: string) => boolean;
  setActiveTab: (tab: FuturesPositionsTab) => void;
  closePosition: (positionId: string) => Promise<void>;
  partialClosePosition: (positionId: string, closeRatio: string) => Promise<void>;
  adjustIsolatedMargin: (positionId: string, delta: string) => Promise<void>;
  updatePositionSltp: (
    positionId: string,
    stopLoss: string | null,
    takeProfit: string | null,
  ) => Promise<void>;
  refresh: () => void;
};

export function useFuturesPositionsPageController(): FuturesPositionsPageControllerView {
  const t = useT();
  const { loading: authLoading } = useAuth();
  const {
    positions,
    loading: positionsLoading,
    refresh,
    isError: positionsError,
    isFetching: positionsFetching,
  } = useFuturesPositions();
  const { prices: markPrices, isPriceStale } = usePrices();
  const {
    closePosition: closePositionRpc,
    partialClosePosition: partialClosePositionRpc,
    adjustIsolatedMargin: adjustIsolatedMarginRpc,
    updateFuturesPositionSltp: updateFuturesPositionSltpRpc,
    busy: closeBusy,
    error,
  } = useFuturesActions(refresh);

  useEffect(() => {
    if (error) showTradeRpcErrorFeedback(error);
  }, [error]);

  const [activeTab, setActiveTab] = useState<FuturesPositionsTab>('open');
  const [closingPositionId, setClosingPositionId] = useState<string | null>(null);
  const [partialClosingPositionId, setPartialClosingPositionId] = useState<string | null>(null);
  const [adjustingMarginPositionId, setAdjustingMarginPositionId] = useState<string | null>(null);
  const [updatingSltpPositionId, setUpdatingSltpPositionId] = useState<string | null>(null);

  const isMarkUnavailable = useCallback(
    (market: string) => !markPrices[market] || markPrices[market] === '0' || isPriceStale(market),
    [markPrices, isPriceStale],
  );

  const openPositions = useMemo(
    () => positions.filter((position) => position.status === 'open'),
    [positions],
  );
  const closedPositions = useMemo(
    () => positions.filter((position) => position.status !== 'open'),
    [positions],
  );

  const closePosition = useCallback(
    async (positionId: string) => {
      setClosingPositionId(positionId);
      try {
        const result = await closePositionRpc(positionId);
        if (result) {
          registerUserInitiatedPositionClose(positionId);
          showTradeFeedback({ eventId: 'futures.position.closed' });
        }
      } finally {
        setClosingPositionId(null);
      }
    },
    [closePositionRpc],
  );

  const partialClosePosition = useCallback(
    async (positionId: string, closeRatio: string) => {
      setPartialClosingPositionId(positionId);
      try {
        const result = await partialClosePositionRpc(positionId, closeRatio);
        if (result) {
          registerUserInitiatedPositionClose(positionId);
          showTradeFeedback({
            eventId: 'futures.position.closed',
            i18nKeyOverride:
              closeRatio === '0.5' ? 'trade.partialCloseDone' : 'trade.partialCloseSuccess',
          });
        }
      } finally {
        setPartialClosingPositionId(null);
      }
    },
    [partialClosePositionRpc],
  );

  const adjustIsolatedMargin = useCallback(
    async (positionId: string, delta: string) => {
      setAdjustingMarginPositionId(positionId);
      try {
        const result = await adjustIsolatedMarginRpc(positionId, delta);
        if (result) showTradeFeedback({ eventId: 'futures.margin.adjusted' });
      } finally {
        setAdjustingMarginPositionId(null);
      }
    },
    [adjustIsolatedMarginRpc],
  );

  const updatePositionSltp = useCallback(
    async (positionId: string, stopLoss: string | null, takeProfit: string | null) => {
      setUpdatingSltpPositionId(positionId);
      try {
        const result = await updateFuturesPositionSltpRpc(positionId, stopLoss, takeProfit);
        if (result) showTradeFeedback({ eventId: 'futures.sltp.updated' });
      } finally {
        setUpdatingSltpPositionId(null);
      }
    },
    [updateFuturesPositionSltpRpc],
  );

  return {
    t,
    authLoading,
    positionsLoading,
    positionsFetching,
    positionsError,
    activeTab,
    openPositions,
    closedPositions,
    openCount: openPositions.length,
    closedCount: closedPositions.length,
    closeBusy,
    closingPositionId,
    partialCloseBusy: closeBusy,
    partialClosingPositionId,
    marginAdjustBusy: closeBusy,
    adjustingMarginPositionId,
    sltpEditBusy: closeBusy,
    updatingSltpPositionId,
    markPrices,
    isMarkUnavailable,
    setActiveTab,
    closePosition,
    partialClosePosition,
    adjustIsolatedMargin,
    updatePositionSltp,
    refresh,
  };
}
