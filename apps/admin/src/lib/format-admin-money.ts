import { format } from '@phonara/money';
import type { Currency } from '@phonara/shared-types';

/**
 * Admin desk money display — Decimal-string path via `@phonara/money`.
 * KRW keeps ₩ + grouping; other currencies use format() + currency suffix.
 */
export function formatAdminMoney(amount: string, currency: string): string {
  if (currency === 'KRW') {
    const neg = amount.startsWith('-');
    const body = neg ? amount.slice(1) : amount;
    return `${neg ? '-' : ''}₩${body.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
  try {
    return `${format({ amount, currency: currency as Currency })} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}
