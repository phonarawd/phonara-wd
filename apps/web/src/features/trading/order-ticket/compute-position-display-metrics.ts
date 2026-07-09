import { Decimal, toDecimal } from '@phonara/money';
import { computePnl, type MarginCurrency, type PositionSide } from '@phonara/trading-engine';

export type PositionMarkDisplayInput = {
  side: PositionSide;
  quantity: string;
  entryPrice: string;
  marginAmount: string;
  marginCurrency: MarginCurrency;
};

/** Oracle mark from RPC — null when missing, zero, or caller marks unavailable (stale). */
export function resolveMarkPriceForPosition(
  market: string,
  markPrices: Record<string, string | null | undefined> | undefined,
  isMarkUnavailable?: (market: string) => boolean,
): string | null {
  if (isMarkUnavailable?.(market)) return null;
  const mark = markPrices?.[market];
  if (!mark || mark === '0') return null;
  return mark;
}

/** Mark-based unrealized PnL — engine formula · display only (§22.2.4). */
export function resolveUnrealizedPnlFromMark(
  input: PositionMarkDisplayInput,
  markPrice: string | null,
): string | null {
  if (!markPrice) return null;
  try {
    return computePnl(
      input.side,
      input.quantity,
      input.entryPrice,
      markPrice,
      input.marginCurrency,
    );
  } catch {
    return null;
  }
}

/** ROE % from mark-based unrealized PnL and posted margin. */
export function resolveRoePercentFromMark(
  input: PositionMarkDisplayInput,
  markPrice: string | null,
): string | null {
  const unrealized = resolveUnrealizedPnlFromMark(input, markPrice);
  if (!unrealized) return null;
  return computePositionRoePercent(unrealized, input.marginAmount);
}

/** Price-change % for display (mark vs entry). Not settlement PnL. */
export function computePositionPnlPercent(
  side: PositionSide,
  entryPrice: string,
  markPrice: string,
): string | null {
  try {
    const entry = toDecimal(entryPrice);
    const mark = toDecimal(markPrice);
    if (entry.isZero() || entry.isNegative() || mark.isNegative()) return null;
    const delta = side === 'long' ? mark.minus(entry).div(entry) : entry.minus(mark).div(entry);
    return delta.mul(100).toDecimalPlaces(2, Decimal.ROUND_DOWN).toFixed();
  } catch {
    return null;
  }
}

/** ROE % = unrealized PnL / posted margin (display-only). */
export function computePositionRoePercent(
  unrealizedPnl: string,
  marginAmount: string,
): string | null {
  try {
    const margin = toDecimal(marginAmount);
    if (margin.isZero() || margin.isNegative()) return null;
    return toDecimal(unrealizedPnl)
      .div(margin)
      .mul(100)
      .toDecimalPlaces(2, Decimal.ROUND_DOWN)
      .toFixed();
  } catch {
    return null;
  }
}

/** Est. total required = margin + open fee (order ticket preview). */
export function computeEstRequiredMargin(margin: string, openFee: string): string {
  try {
    return toDecimal(margin)
      .plus(toDecimal(openFee))
      .toDecimalPlaces(6, Decimal.ROUND_DOWN)
      .toFixed();
  } catch {
    return margin;
  }
}
