import { dec, type PositionSide } from './shared';

/** True when mark price hits stored SL/TP for the position side (display/preview only). */
export function isStopTriggered(args: {
  side: PositionSide;
  markPrice: string;
  stopLoss?: string | null;
  takeProfit?: string | null;
}): boolean {
  const mark = dec(args.markPrice, 'markPrice');
  const sl = args.stopLoss ? dec(args.stopLoss, 'stopLoss') : null;
  const tp = args.takeProfit ? dec(args.takeProfit, 'takeProfit') : null;

  if (args.side === 'long') {
    if (sl && mark.lessThanOrEqualTo(sl)) return true;
    if (tp && mark.greaterThanOrEqualTo(tp)) return true;
    return false;
  }
  if (sl && mark.greaterThanOrEqualTo(sl)) return true;
  if (tp && mark.lessThanOrEqualTo(tp)) return true;
  return false;
}
