import { describe, expect, it, vi } from 'vitest';

import {
  CHART_LAYOUT_MIN_HEIGHT_PX,
  CHART_LAYOUT_MIN_WIDTH_PX,
  isChartHostSized,
  syncChartLayout,
} from '../sync-chart-layout';

describe('sync-chart-layout', () => {
  it('rejects undersized hosts', () => {
    expect(isChartHostSized({ width: CHART_LAYOUT_MIN_WIDTH_PX - 1, height: 200 })).toBe(false);
    expect(isChartHostSized({ width: 200, height: CHART_LAYOUT_MIN_HEIGHT_PX - 1 })).toBe(false);
    expect(isChartHostSized({ width: 200, height: 200 })).toBe(true);
  });

  it('applies size, resets autoscale, and fits time when host is sized', () => {
    const applyOptions = vi.fn();
    const priceScaleApply = vi.fn();
    const fitContent = vi.fn();
    const chart = {
      applyOptions,
      priceScale: vi.fn(() => ({ applyOptions: priceScaleApply })),
      timeScale: vi.fn(() => ({ fitContent })),
    };
    const host = { clientWidth: 390, clientHeight: 280 } as HTMLElement;

    expect(syncChartLayout(chart as never, host)).toBe(true);
    expect(applyOptions).toHaveBeenCalledWith({ width: 390, height: 280 });
    expect(priceScaleApply).toHaveBeenCalledWith({ autoScale: true });
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
});
