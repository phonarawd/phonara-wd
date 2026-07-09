import { useEffect, useRef, type RefObject } from 'react';
import { LineStyle, type IPriceLine } from 'lightweight-charts';

import { readChartTheme } from './chart-theme';
import { toChartPriceLineValue } from './to-chart-data';
import type { LightweightChartHandle } from './use-lightweight-chart';

type ChartPriceLineLabels = {
  oracle: string;
  liquidation: string;
};

export function useChartPriceLines(
  handleRef: RefObject<LightweightChartHandle | null>,
  oracleMarkPrice: string | null | undefined,
  liquidationPrice: string | null | undefined,
  labels: ChartPriceLineLabels,
) {
  const oracleLineRef = useRef<IPriceLine | null>(null);
  const liquidationLineRef = useRef<IPriceLine | null>(null);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const theme = readChartTheme();
    const oracleValue = toChartPriceLineValue(oracleMarkPrice);
    const liquidationValue = toChartPriceLineValue(liquidationPrice);

    if (oracleLineRef.current) {
      handle.candles.removePriceLine(oracleLineRef.current);
      oracleLineRef.current = null;
    }
    if (liquidationLineRef.current) {
      handle.candles.removePriceLine(liquidationLineRef.current);
      liquidationLineRef.current = null;
    }

    if (oracleValue !== null) {
      oracleLineRef.current = handle.candles.createPriceLine({
        price: oracleValue,
        color: theme.textMuted,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: labels.oracle,
      });
    }

    if (liquidationValue !== null) {
      liquidationLineRef.current = handle.candles.createPriceLine({
        price: liquidationValue,
        color: theme.marketDown,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: labels.liquidation,
      });
    }

    return () => {
      if (!handleRef.current) return;
      if (oracleLineRef.current) {
        handleRef.current.candles.removePriceLine(oracleLineRef.current);
        oracleLineRef.current = null;
      }
      if (liquidationLineRef.current) {
        handleRef.current.candles.removePriceLine(liquidationLineRef.current);
        liquidationLineRef.current = null;
      }
    };
  }, [handleRef, labels.liquidation, labels.oracle, liquidationPrice, oracleMarkPrice]);
}
