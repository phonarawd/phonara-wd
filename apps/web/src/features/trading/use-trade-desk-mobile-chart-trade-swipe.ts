import { useCallback, useRef, useState, type PointerEventHandler } from 'react';

import {
  TRADE_DESK_MOBILE_SWIPE_MIN_DELTA_PX,
  TRADE_DESK_MOBILE_SWIPE_TAB_IDS,
  type TradeDeskMobileSwipeTabId,
  type TradeDeskMobileTabId,
} from '@/domain/trade-mobile-layout-display-contract';

function isSwipeTab(tabId: TradeDeskMobileTabId): tabId is TradeDeskMobileSwipeTabId {
  return (TRADE_DESK_MOBILE_SWIPE_TAB_IDS as readonly string[]).includes(tabId);
}

export type TradeDeskMobileChartTradeSwipe = {
  swipeActive: boolean;
  swipeHandlers: {
    onPointerDown: PointerEventHandler<HTMLElement>;
    onPointerMove: PointerEventHandler<HTMLElement>;
    onPointerUp: PointerEventHandler<HTMLElement>;
    onPointerCancel: PointerEventHandler<HTMLElement>;
  };
};

/** Horizontal swipe assist between chart↔trade mobile tabs — tabs remain primary IA (P2-B). */
export function useTradeDeskMobileChartTradeSwipe(
  activeTab: TradeDeskMobileTabId,
  setActiveTab: (tab: TradeDeskMobileTabId) => void,
): TradeDeskMobileChartTradeSwipe {
  const startXRef = useRef<number | null>(null);
  const [swipeActive, setSwipeActive] = useState(false);
  const swipeEligible = isSwipeTab(activeTab);

  const resetSwipe = useCallback(() => {
    startXRef.current = null;
    setSwipeActive(false);
  }, []);

  const onPointerDown = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if (!swipeEligible || event.pointerType === 'mouse') return;
      startXRef.current = event.clientX;
      setSwipeActive(false);
    },
    [swipeEligible],
  );

  const onPointerMove = useCallback<PointerEventHandler<HTMLElement>>((event) => {
    if (startXRef.current === null) return;
    const delta = event.clientX - startXRef.current;
    if (Math.abs(delta) > 12) {
      setSwipeActive(true);
    }
  }, []);

  const onPointerUp = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if (startXRef.current === null) return;
      const delta = event.clientX - startXRef.current;
      startXRef.current = null;

      if (Math.abs(delta) < TRADE_DESK_MOBILE_SWIPE_MIN_DELTA_PX) {
        setSwipeActive(false);
        return;
      }

      if (activeTab === 'chart' && delta < 0) {
        setActiveTab('trade');
      } else if (activeTab === 'trade' && delta > 0) {
        setActiveTab('chart');
      }

      setSwipeActive(false);
    },
    [activeTab, setActiveTab],
  );

  return {
    swipeActive: swipeActive && swipeEligible,
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: resetSwipe,
    },
  };
}
