import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TradeDeskMobileTabId } from '@/domain/trade-mobile-layout-display-contract';
import {
  isTradeChartGestureTarget,
  useTradeDeskMobileChartTradeSwipe,
} from '@/features/trading/use-trade-desk-mobile-chart-trade-swipe';

describe('useTradeDeskMobileChartTradeSwipe', () => {
  it('advances chart→trade on left swipe delta', () => {
    let activeTab: TradeDeskMobileTabId = 'chart';
    const setActiveTab = vi.fn((tab: TradeDeskMobileTabId) => {
      activeTab = tab;
    });

    const { result, rerender } = renderHook(() =>
      useTradeDeskMobileChartTradeSwipe(activeTab, setActiveTab),
    );

    act(() => {
      result.current.swipeHandlers.onPointerDown({
        pointerType: 'touch',
        clientX: 200,
        target: document.createElement('div'),
      } as React.PointerEvent<HTMLElement>);
      result.current.swipeHandlers.onPointerMove({
        clientX: 120,
      } as React.PointerEvent<HTMLElement>);
      result.current.swipeHandlers.onPointerUp({
        clientX: 120,
      } as React.PointerEvent<HTMLElement>);
    });

    expect(setActiveTab).toHaveBeenCalledWith('trade');
    rerender();
  });

  it('ignores swipe when pointer starts on chart gesture owner', () => {
    const setActiveTab = vi.fn();
    const chartHost = document.createElement('div');
    chartHost.setAttribute('data-chart-gesture-owner', '');
    const canvas = document.createElement('canvas');
    chartHost.appendChild(canvas);
    document.body.appendChild(chartHost);

    const { result } = renderHook(() =>
      useTradeDeskMobileChartTradeSwipe('chart', setActiveTab),
    );

    act(() => {
      result.current.swipeHandlers.onPointerDown({
        pointerType: 'touch',
        clientX: 200,
        target: canvas,
      } as unknown as React.PointerEvent<HTMLElement>);
      result.current.swipeHandlers.onPointerMove({
        clientX: 80,
      } as React.PointerEvent<HTMLElement>);
      result.current.swipeHandlers.onPointerUp({
        clientX: 80,
      } as React.PointerEvent<HTMLElement>);
    });

    expect(setActiveTab).not.toHaveBeenCalled();
    expect(result.current.swipeActive).toBe(false);
    expect(isTradeChartGestureTarget(canvas)).toBe(true);
    chartHost.remove();
  });

  it('ignores swipe when active tab is not chart or trade', () => {
    const setActiveTab = vi.fn();

    const { result } = renderHook(() =>
      useTradeDeskMobileChartTradeSwipe('positions', setActiveTab),
    );

    act(() => {
      result.current.swipeHandlers.onPointerDown({
        pointerType: 'touch',
        clientX: 200,
        target: document.createElement('div'),
      } as React.PointerEvent<HTMLElement>);
      result.current.swipeHandlers.onPointerUp({
        clientX: 120,
      } as React.PointerEvent<HTMLElement>);
    });

    expect(setActiveTab).not.toHaveBeenCalled();
  });
});
