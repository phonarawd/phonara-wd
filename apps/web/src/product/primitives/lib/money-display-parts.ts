import type { Currency } from '@phonara/shared-types';
import type { MessageKey } from '@phonara/i18n';

import { formatMoney } from '@/hooks/use-money';

export interface MoneyDisplayParts {
  /** Formatted decimal string (grouping · optional sign) — no currency suffix inline. */
  amountText: string;
  /** i18n key for suffix span when `showCurrency` is true. */
  suffixKey: MessageKey | null;
}

const CURRENCY_SUFFIX_KEYS: Record<Currency, MessageKey> = {
  KRW: 'money.display.suffix.krw',
  PHON: 'wallet.currency.phon',
  USDT: 'wallet.currency.usdt',
};

/** RPC amount → display parts (@phonara/money only · client arithmetic 0). */
export function resolveMoneyDisplayParts(
  amount: string,
  currency: Currency,
  opts?: { signed?: boolean; showCurrency?: boolean },
): MoneyDisplayParts {
  const showCurrency = opts?.showCurrency ?? false;
  const amountText = formatMoney(amount, currency, {
    signed: opts?.signed ?? false,
    grouping: true,
    showCurrency: false,
  });

  return {
    amountText,
    suffixKey: showCurrency ? CURRENCY_SUFFIX_KEYS[currency] : null,
  };
}
