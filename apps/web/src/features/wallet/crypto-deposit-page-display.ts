import type { MessageKey } from '@phonara/i18n';

import { isPositiveAmount } from '@/lib/money-display';

import type { CryptoDepositChain } from './crypto-deposit-status';
import type { CryptoDepositRequestResult } from './use-crypto-deposit';

export type CryptoDepositTimelineStepId = 'request' | 'confirm' | 'credit';

export type CryptoDepositTimelineStepView = {
  id: CryptoDepositTimelineStepId;
  labelKey: MessageKey;
  state: 'done' | 'active' | 'upcoming';
  detailKey?: MessageKey;
  detailParams?: Record<string, string>;
};

/** Strip invalid chars; keep one decimal separator · max 6 fractional digits (USDT). */
export function normalizeUsdtAmountInput(raw: string): string {
  let value = raw.replace(/,/g, '').replace(/[^\d.]/g, '');
  const firstDot = value.indexOf('.');
  if (firstDot !== -1) {
    const before = value.slice(0, firstDot);
    const after = value
      .slice(firstDot + 1)
      .replace(/\./g, '')
      .slice(0, 6);
    value = `${before}.${after}`;
  }
  const [intPart = '', fracPart] = value.split('.');
  const normalizedInt = intPart.replace(/^0+(?=\d)/, '');
  if (fracPart !== undefined) {
    return `${normalizedInt || '0'}.${fracPart}`;
  }
  return normalizedInt;
}

export function cryptoDepositAmountGateKey(amountUsdt: string): MessageKey | null {
  if (!normalizeUsdtAmountInput(amountUsdt)) return 'wallet.crypto.deposit.gate.amount';
  if (!isPositiveAmount(normalizeUsdtAmountInput(amountUsdt)))
    return 'wallet.crypto.deposit.gate.amount';
  return null;
}

export function cryptoDepositChainHintKey(chain: CryptoDepositChain): MessageKey {
  return chain === 'ERC20'
    ? 'wallet.crypto.deposit.networkErc20Hint'
    : 'wallet.crypto.deposit.networkTrc20Hint';
}

export function canOpenCryptoDepositConfirm(input: {
  depositBlocked: boolean;
  amountUsdt: string;
  addressReady: boolean;
}): boolean {
  if (input.depositBlocked) return false;
  if (!input.addressReady) return false;
  if (cryptoDepositAmountGateKey(input.amountUsdt)) return false;
  return true;
}

export function canSubmitCryptoDepositRequest(input: {
  depositBlocked: boolean;
  amountUsdt: string;
  addressReady: boolean;
  submitting: boolean;
}): boolean {
  if (input.submitting) return false;
  return canOpenCryptoDepositConfirm(input);
}

export function canAcknowledgeCryptoDepositResult(
  result: CryptoDepositRequestResult | null,
): boolean {
  if (!result?.ok) return false;
  if (!result.address?.trim()) return false;
  return isPositiveAmount(result.amount);
}

export function buildCryptoDepositTimelineSteps(
  confirmationsRequired: number | string | null | undefined,
  slaHours?: string | null,
): CryptoDepositTimelineStepView[] {
  const required = confirmationsRequired?.toString().trim() || '1';
  const sla = slaHours?.trim() || '24';
  return [
    { id: 'request', labelKey: 'wallet.crypto.deposit.timeline.request', state: 'done' },
    {
      id: 'confirm',
      labelKey: 'wallet.crypto.deposit.timeline.confirm',
      state: 'active',
      detailKey: 'wallet.crypto.deposit.confirmations',
      detailParams: { seen: '0', required },
    },
    {
      id: 'credit',
      labelKey: 'wallet.crypto.deposit.timeline.credit',
      state: 'upcoming',
      detailKey: 'wallet.deposit.timeline.reviewEta',
      detailParams: { hours: sla },
    },
  ];
}
