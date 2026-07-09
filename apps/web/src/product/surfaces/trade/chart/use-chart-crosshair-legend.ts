import { useEffect, useState, type RefObject } from 'react';
import type { CandlestickData, Time } from 'lightweight-charts';

import { formatOraclePriceDisplay } from '@/features/trading/format-oracle-price-display';

import type { CrosshairLegendSnapshot } from './chart-overlay-contract';
import type { LightweightChartHandle } from './use-lightweight-chart';

const hiddenLegend: CrosshairLegendSnapshot = {
  open: '—',
  high: '—',
  low: '—',
  close: '—',
  visible: false,
};

function formatLegendPrice(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return formatOraclePriceDisplay(String(value));
}

function readCandleLegend(data: CandlestickData<Time> | undefined): CrosshairLegendSnapshot | null {
  if (!data) return null;
  return {
    open: formatLegendPrice(data.open),
    high: formatLegendPrice(data.high),
    low: formatLegendPrice(data.low),
    close: formatLegendPrice(data.close),
    visible: true,
  };
}

export function useChartCrosshairLegend(handleRef: RefObject<LightweightChartHandle | null>) {
  const [legend, setLegend] = useState<CrosshairLegendSnapshot>(hiddenLegend);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const onMove = (param: { time?: Time; seriesData: Map<unknown, unknown> }) => {
      if (!param.time) {
        setLegend(hiddenLegend);
        return;
      }

      const candleData = param.seriesData.get(handle.candles) as CandlestickData<Time> | undefined;
      const next = readCandleLegend(candleData);
      setLegend(next ?? hiddenLegend);
    };

    handle.chart.subscribeCrosshairMove(onMove);
    return () => {
      handle.chart.unsubscribeCrosshairMove(onMove);
    };
  }, [handleRef]);

  return legend;
}
