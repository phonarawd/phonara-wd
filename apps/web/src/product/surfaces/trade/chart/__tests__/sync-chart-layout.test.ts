import { describe, expect, it, vi } from 'vitest';

import {
  CHART_LAYOUT_MIN_HEIGHT_PX,
  CHART_LAYOUT_MIN_WIDTH_PX,
  CHART_RIGHT_SCALE_MARGINS,
  isChartHostSized,
  shouldFitChartOnLayoutSync,
  syncChartLayout,
} from '../sync-chart-layout';

describe('sync-chart-layout', () => {
  it('rejects undersized hosts', () => {
    expect(isChartHostSized({ width: CHART_LAYOUT_MIN_WIDTH_PX - 1, height: 200 })).toBe(false);
    expect(isChartHostSized({ width: 200, height: CHART_LAYOUT_MIN_HEIGHT_PX - 1 })).toBe(false);
    expect(isChartHostSized({ width: 200, height: 200 })).toBe(true);
  });

  it('fits on first successful sync and when recovering from a collapsed host', () => {
    expect(
      shouldFitChartOnLayoutSync({
        awaitingFirstSuccessfulFit: true,
        recoveringFromCollapsedHost: false,
      }),
    ).toBe(true);
    expect(
      shouldFitChartOnLayoutSync({
        awaitingFirstSuccessfulFit: false,
        recoveringFromCollapsedHost: true,
      }),
    ).toBe(true);
    expect(
      shouldFitChartOnLayoutSync({
        awaitingFirstSuccessfulFit: false,
        recoveringFromCollapsedHost: false,
      }),
    ).toBe(false);
  });

  it('applies size, setAutoScale, and fits time when host is sized', () => {
    const applyOptions = vi.fn();
    const setAutoScale = vi.fn();
    const priceScaleApply = vi.fn();
    const fitContent = vi.fn();
    const chart = {
      applyOptions,
      priceScale: vi.fn((id: string) => {
        if (id === 'right') {
          return { applyOptions: priceScaleApply, setAutoScale };
        }
        return { applyOptions: priceScaleApply, setAutoScale: vi.fn() };
      }),
      timeScale: vi.fn(() => ({ fitContent })),
    };
    const host = { clientWidth: 390, clientHeight: 280 } as HTMLElement;

    expect(syncChartLayout(chart as never, host)).toBe(true);
    expect(applyOptions).toHaveBeenCalledWith({ width: 390, height: 280 });
    expect(priceScaleApply).toHaveBeenCalledWith({
      scaleMargins: { ...CHART_RIGHT_SCALE_MARGINS },
    });
    expect(setAutoScale).toHaveBeenCalledWith(true);
    expect(fitContent).toHaveBeenCalledTimes(1);
  });

  it('skips sync when host is collapsed', () => {
    const applyOptions = vi.fn();
    const chart = {
      applyOptions,
      priceScale: vi.fn(),
      timeScale: vi.fn(),
    };
    const host = { clientWidth: 10, clientHeight: 10 } as HTMLElement;

    expect(syncChartLayout(chart as never, host)).toBe(false);
    expect(applyOptions).not.toHaveBeenCalled();
  });

  it('skips fitContent when fit:false (ResizeObserver resync must preserve zoom/pan)', () => {
    const applyOptions = vi.fn();
    const setAutoScale = vi.fn();
    const priceScaleApply = vi.fn();
    const fitContent = vi.fn();
    const chart = {
      applyOptions,
      priceScale: vi.fn((id: string) => {
        if (id === 'right') {
          return { applyOptions: priceScaleApply, setAutoScale };
        }
        return { applyOptions: priceScaleApply, setAutoScale: vi.fn() };
      }),
      timeScale: vi.fn(() => ({ fitContent })),
    };
    const host = { clientWidth: 390, clientHeight: 280 } as HTMLElement;

    expect(syncChartLayout(chart as never, host, { fit: false })).toBe(true);
    expect(applyOptions).toHaveBeenCalledWith({ width: 390, height: 280 });
    // Still autoscales the right price scale — only the time-range fit is skipped.
    expect(setAutoScale).toHaveBeenCalledWith(true);
    expect(fitContent).not.toHaveBeenCalled();
  });

  it('defaults to fit:true when the options param is omitted (manual reset / fullscreen)', () => {
    const applyOptions = vi.fn();
    const setAutoScale = vi.fn();
    const priceScaleApply = vi.fn();
    const fitContent = vi.fn();
    const chart = {
      applyOptions,
      priceScale: vi.fn((id: string) => {
        if (id === 'right') {
          return { applyOptions: priceScaleApply, setAutoScale };
        }
        return { applyOptions: priceScaleApply, setAutoScale: vi.fn() };
      }),
      timeScale: vi.fn(() => ({ fitContent })),
    };
    const host = { clientWidth: 390, clientHeight: 280 } as HTMLElement;

    expect(syncChartLayout(chart as never, host, { fit: true })).toBe(true);
    expect(fitContent).toHaveBeenCalledTimes(1);
  });
});
