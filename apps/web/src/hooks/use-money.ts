import { useMemo } from 'react';
import type { Currency } from '@phonara/shared-types';
import { format as formatMoneyAmount, toDecimal } from '@phonara/money';

export type FormatMoneyOptions = {
  showCurrency?: boolean;
  signed?: boolean;
  grouping?: boolean;
};

function withGrouping(value: string): string {
  const [whole = '0', fraction] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction !== undefined ? `${grouped}.${fraction}` : grouped;
}

export function formatMoney(amount: string, currency: Currency, opts?: FormatMoneyOptions): string {
  if (amount.trim() === '') return '—';

  const showCurrency = opts?.showCurrency ?? false;
  const signed = opts?.signed ?? false;
  const grouping = opts?.grouping ?? true;

  try {
    let text = formatMoneyAmount({ amount, currency });
    if (grouping) {
      text = withGrouping(text);
    }
    if (signed && toDecimal(amount).isNegative()) {
      text = `-${text.replace(/^-/, '')}`;
    } else if (signed && toDecimal(amount).greaterThan(0)) {
      text = `+${text}`;
    }
    if (showCurrency) {
      text = `${text} ${currency}`;
    }
    return text;
  } catch {
    return '—';
  }
}

/** KRW with won prefix — canonical display for wallet strings and presentation props. */
export function formatKrwWon(amount: string | null | undefined): string {
  if (amount == null || amount === '') return '—';
  try {
    return `₩${formatMoney(amount, 'KRW')}`;
  } catch {
    return '—';
  }
}

/** Presentation-only integer props (FOMO/ticker) — no float math, string coercion only. */
export function formatKrwWonFromInt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return formatKrwWon(String(Math.trunc(n)));
}

/**
 * Memoized, precision-safe money formatting for a raw decimal string.
 * Returns an em dash for null/undefined/invalid input so the UI never crashes
 * on a missing balance.
 */
export function useMoney(
  amount: string | null | undefined,
  currency: Currency,
  opts?: FormatMoneyOptions,
): string {
  const showCurrency = opts?.showCurrency;
  const signed = opts?.signed;
  const grouping = opts?.grouping;

  return useMemo(() => {
    if (amount == null || amount === '') return '—';
    try {
      return formatMoney(amount, currency, { showCurrency, signed, grouping });
    } catch {
      return '—';
    }
  }, [amount, currency, showCurrency, signed, grouping]);
}
