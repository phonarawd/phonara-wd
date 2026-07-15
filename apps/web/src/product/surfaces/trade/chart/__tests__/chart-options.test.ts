import { CrosshairMode } from 'lightweight-charts';
import { describe, expect, it } from 'vitest';

import {
  chartCrosshairOptions,
  chartInteractionOptions,
  createChartOptions,
} from '../chart-options';
import { readChartTheme } from '../chart-theme';

describe('chart-options', () => {
  const theme = readChartTheme();

  it('enables MagnetOHLC crosshair for exchange-grade snapping', () => {
    expect(chartCrosshairOptions(theme).mode).toBe(CrosshairMode.MagnetOHLC);
  });

  it('enables wheel zoom and touch pan interactions', () => {
    const interaction = chartInteractionOptions();
    expect(interaction.handleScroll?.mouseWheel).toBe(true);
    expect(interaction.handleScroll?.horzTouchDrag).toBe(true);
    expect(interaction.handleScale?.mouseWheel).toBe(true);
    expect(interaction.handleScale?.pinch).toBe(true);
  });

  it('builds createChart options without autoSize (manual ResizeObserver sizing)', () => {
    const options = createChartOptions(theme);
    expect(options.autoSize).toBe(false);
    expect(options.layout?.attributionLogo).toBe(true);
    expect(options.crosshair?.mode).toBe(CrosshairMode.MagnetOHLC);
    expect(options.timeScale?.timeVisible).toBe(true);
  });

  it('resolves layout.fontFamily to a computed value, not the literal var() string', () => {
    const options = createChartOptions(theme);
    expect(options.layout?.fontFamily).toBeTypeOf('string');
    expect(options.layout?.fontFamily.length).toBeGreaterThan(0);
    expect(options.layout?.fontFamily).not.toBe('var(--ds-font-sans)');
    expect(options.layout?.fontFamily).not.toMatch(/var\(/i);
  });
});
