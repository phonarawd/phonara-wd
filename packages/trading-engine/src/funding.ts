import { dec } from './shared';

/** 8h funding payment preview (signed: negative = user pays). */
export function computeFundingPayment(args: {
  notional: string;
  rate: string;
  side: 'long' | 'short';
}): string {
  const base = dec(args.notional, 'notional').mul(dec(args.rate, 'rate'));
  if (args.side === 'long') {
    return base.negated().toFixed();
  }
  return base.toFixed();
}
