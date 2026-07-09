import { toDecimal } from '@phonara/money';
import type { MessageKey } from '@phonara/i18n';

import { isPositiveAmount } from '@/lib/money-display';
import type { KrwDepositResult } from '@/domain/wallet';

export const KRW_DEPOSIT_CHIP_AMOUNTS = ['10000', '50000', '100000'] as const;

export type KrwDepositChipKey =
  | 'wallet.deposit.chip.10k'
  | 'wallet.deposit.chip.50k'
  | 'wallet.deposit.chip.100k';

export const KRW_DEPOSIT_CHIP_KEYS: readonly KrwDepositChipKey[] = [
  'wallet.deposit.chip.10k',
  'wallet.deposit.chip.50k',
  'wallet.deposit.chip.100k',
] as const;

export type KrwDepositTimelineStepId = 'request' | 'match' | 'credit';

export type KrwDepositTimelineStepView = {
  id: KrwDepositTimelineStepId;
  labelKey: MessageKey;
  state: 'done' | 'active' | 'upcoming';
  detailKey?: MessageKey;
  detailParams?: Record<string, string>;
};

/** Strip non-digits from KRW amount input — whole-won only. */
export function normalizeKrwAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.replace(/^0+(?=\d)/, '');
}

export function addKrwChipAmount(current: string, chipAmount: string): string {
  const base = normalizeKrwAmountInput(current);
  if (!base) return chipAmount;
  return toDecimal(base).add(toDecimal(chipAmount)).toFixed(0);
}

export function krwDepositAmountGateKey(amountKrw: string): MessageKey | null {
  if (!normalizeKrwAmountInput(amountKrw)) return 'wallet.deposit.gate.amount';
  if (!isPositiveAmount(normalizeKrwAmountInput(amountKrw))) return 'wallet.deposit.gate.amount';
  return null;
}

export function krwDepositRateGateKey(
  phonKrwRateStale: boolean,
  phonKrwRateUnavailable: boolean,
): MessageKey | null {
  if (phonKrwRateUnavailable) return 'wallet.rate.unavailableGate';
  if (phonKrwRateStale) return 'wallet.rate.staleGate';
  return null;
}

export function canOpenKrwDepositConfirm(input: {
  depositBlocked: boolean;
  amountKrw: string;
  phonKrwRateStale: boolean;
  phonKrwRateUnavailable: boolean;
}): boolean {
  if (input.depositBlocked) return false;
  if (krwDepositAmountGateKey(input.amountKrw)) return false;
  if (krwDepositRateGateKey(input.phonKrwRateStale, input.phonKrwRateUnavailable)) return false;
  return true;
}

/** RPC create — only after confirm review; blocked without valid amount/rate. */
export function canSubmitKrwDepositRequest(input: {
  depositBlocked: boolean;
  amountKrw: string;
  phonKrwRateStale: boolean;
  phonKrwRateUnavailable: boolean;
  submitting: boolean;
}): boolean {
  if (input.submitting) return false;
  return canOpenKrwDepositConfirm(input);
}

/** User must see RPC `expected_phon` before leaving the success flow (§30.3). */
export function canAcknowledgeKrwDepositResult(result: KrwDepositResult | null): boolean {
  if (!result?.ok) return false;
  return isPositiveAmount(result.expected_phon);
}

export function buildKrwDepositTimelineSteps(
  slaHours: string | null | undefined,
): KrwDepositTimelineStepView[] {
  const sla = slaHours?.trim() ? slaHours.trim() : '24';
  return [
    { id: 'request', labelKey: 'wallet.deposit.timeline.request', state: 'done' },
    {
      id: 'match',
      labelKey: 'wallet.deposit.timeline.match',
      state: 'active',
      detailKey: 'wallet.deposit.timeline.reviewEta',
      detailParams: { hours: sla },
    },
    { id: 'credit', labelKey: 'wallet.deposit.timeline.credit', state: 'upcoming' },
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
