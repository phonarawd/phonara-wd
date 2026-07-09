import { toFixed } from '@phonara/money';
import { dec, type MarginCurrency } from './shared';

/**
 * 8h funding payment preview (signed: negative = user pays).
 * Amount is quantized to margin currency (truncated ROUND_DOWN), matching wallet
 * ledger settlement precision for PHON/USDT (6dp).
 */
export function computeFundingPayment(args: {
  notional: string;
  rate: string;
  side: 'long' | 'short';
  marginCurrency: MarginCurrency;
}): string {
  const base = dec(args.notional, 'notional').mul(dec(args.rate, 'rate'));
  const signed = args.side === 'long' ? base.negated() : base;
  return toFixed(signed, args.marginCurrency);
}
