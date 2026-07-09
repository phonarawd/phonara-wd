import { toDecimal } from '@phonara/money';

import type { MessageKey } from '@phonara/i18n';

import { isPositiveAmount } from '@/lib/money-display';

import { normalizeDecimalInput } from '@/lib/money-input';

import type { KrwWithdrawalResult } from '@/domain/wallet';

export type KrwWithdrawTimelineStepId = 'request' | 'review' | 'send' | 'done';

export type KrwWithdrawTimelineStepView = {
  id: KrwWithdrawTimelineStepId;

  labelKey: MessageKey;

  state: 'done' | 'active' | 'upcoming';

  detailKey?: MessageKey;

  detailParams?: Record<string, string>;
};

/** Strip invalid chars; max 6 fractional digits (PHON). */

export function normalizePhonWithdrawAmountInput(raw: string): string {
  return normalizeDecimalInput(raw, { maxFractionDigits: 6, allowDecimal: true });
}

export function formatPhonAmountForRpc(amountPhon: string): string {
  const normalized = normalizePhonWithdrawAmountInput(amountPhon);

  if (!isPositiveAmount(normalized)) return normalized;

  return toDecimal(normalized).toFixed(6);
}

export function normalizeBankAccountInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function krwWithdrawAmountGateKey(amountPhon: string): MessageKey | null {
  const normalized = normalizePhonWithdrawAmountInput(amountPhon);

  if (!normalized) return 'wallet.withdraw.gate.amount';

  if (!isPositiveAmount(normalized)) return 'wallet.withdraw.gate.amount';

  return null;
}

export function krwWithdrawAccountGateKey(account: string): MessageKey | null {
  const normalized = normalizeBankAccountInput(account);

  if (normalized.length < 6) return 'wallet.withdraw.gate.bankFields';

  return null;
}

export function krwWithdrawBalanceGateKey(
  amountPhon: string,

  phonRealAvailable: string | null | undefined,
): MessageKey | null {
  if (!phonRealAvailable) return null;

  const normalized = normalizePhonWithdrawAmountInput(amountPhon);

  if (!isPositiveAmount(normalized)) return null;

  try {
    if (toDecimal(normalized).greaterThan(toDecimal(phonRealAvailable))) {
      return 'wallet.withdraw.gate.insufficientReal';
    }
  } catch {
    return 'wallet.withdraw.gate.insufficientReal';
  }

  return null;
}

export function krwWithdrawRateGateKey(
  phonKrwRateStale: boolean,

  phonKrwRateUnavailable: boolean,
): MessageKey | null {
  if (phonKrwRateUnavailable) return 'wallet.withdraw.rateUnavailable';

  if (phonKrwRateStale) return 'wallet.rate.staleGate';

  return null;
}

export function canOpenKrwWithdrawConfirm(input: {
  withdrawalBlocked: boolean;

  withdrawalReady: boolean;

  withdrawalMfaRequired?: boolean;

  geoBlocked?: boolean;

  amountPhon: string;

  bankAccount: string;

  phonKrwRateStale: boolean;

  phonKrwRateUnavailable: boolean;

  phonRealAvailable: string | null | undefined;
}): boolean {
  if (input.withdrawalBlocked) return false;

  if (input.withdrawalMfaRequired) return false;

  if (input.geoBlocked) return false;

  if (!input.withdrawalReady) return false;

  if (krwWithdrawAmountGateKey(input.amountPhon)) return false;

  if (krwWithdrawAccountGateKey(input.bankAccount)) return false;

  if (krwWithdrawRateGateKey(input.phonKrwRateStale, input.phonKrwRateUnavailable)) return false;

  if (krwWithdrawBalanceGateKey(input.amountPhon, input.phonRealAvailable)) return false;

  return true;
}

/** RPC submit — only after confirm review; blocked without valid amount/rate/account. */

export function canSubmitKrwWithdrawRequest(input: {
  withdrawalBlocked: boolean;

  withdrawalReady: boolean;

  amountPhon: string;

  bankAccount: string;

  phonKrwRateStale: boolean;

  phonKrwRateUnavailable: boolean;

  phonRealAvailable: string | null | undefined;

  submitting: boolean;

  submitResult: KrwWithdrawalResult | null;
}): boolean {
  if (input.submitting) return false;

  if (input.submitResult) return false;

  return canOpenKrwWithdrawConfirm(input);
}

/** §30.3 — user must see RPC `expected_krw` before leaving the success flow. */

export function canAcknowledgeKrwWithdrawResult(result: KrwWithdrawalResult | null): boolean {
  if (!result?.ok) return false;

  return isPositiveAmount(result.expected_krw);
}

export function buildKrwWithdrawTimelineSteps(): KrwWithdrawTimelineStepView[] {
  return [
    { id: 'request', labelKey: 'wallet.withdraw.timeline.request', state: 'done' },

    { id: 'review', labelKey: 'wallet.withdraw.timeline.review', state: 'active' },

    { id: 'send', labelKey: 'wallet.withdraw.timeline.send', state: 'upcoming' },

    { id: 'done', labelKey: 'wallet.withdraw.timeline.done', state: 'upcoming' },
  ];
}

export function formatRateCapturedAt(
  capturedAt: string | null | undefined,
  locale: string,
): string | null {
  if (!capturedAt) return null;

  const ms = Date.parse(capturedAt);

  if (!Number.isFinite(ms)) return null;

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
    month: 'short',

    day: 'numeric',

    hour: '2-digit',

    minute: '2-digit',
  }).format(new Date(ms));
}
