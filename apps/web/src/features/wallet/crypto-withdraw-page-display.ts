import { toDecimal } from '@phonara/money';

import type { MessageKey } from '@phonara/i18n';

import { isPositiveAmount } from '@/lib/money-display';
import { normalizeDecimalInput } from '@/lib/money-input';

import type { CryptoWithdrawalResult } from '@/domain/wallet';

import { CRYPTO_WITHDRAW_CHAINS, type CryptoWithdrawChain } from './crypto-withdraw-status';
import { normalizeUsdtAmountInput } from './crypto-deposit-page-display';

export type CryptoWithdrawTimelineStepId = 'request' | 'review' | 'approve' | 'broadcast' | 'done';

export type CryptoWithdrawTimelineStepView = {
  id: CryptoWithdrawTimelineStepId;
  labelKey: MessageKey;
  state: 'done' | 'active' | 'upcoming';
  detailKey?: MessageKey;
  detailParams?: Record<string, string>;
};

/** Display-only network fee estimates (§30.3 preview — not RPC settlement). */
export const CRYPTO_WITHDRAW_NETWORK_FEE_USDT: Readonly<Record<CryptoWithdrawChain, string>> = {
  TRC20: '1',
  ERC20: '5',
};

export { CRYPTO_WITHDRAW_CHAINS };

export function formatUsdtAmountForRpc(amountUsdt: string): string {
  const normalized = normalizeUsdtAmountInput(amountUsdt);
  if (!isPositiveAmount(normalized)) return normalized;
  return toDecimal(normalized).toFixed(6);
}

export function normalizeCryptoWithdrawAddressInput(raw: string): string {
  return raw.trim();
}

export function cryptoWithdrawAmountGateKey(amountUsdt: string): MessageKey | null {
  const normalized = normalizeUsdtAmountInput(amountUsdt);
  if (!normalized) return 'wallet.crypto.withdraw.gate.amount';
  if (!isPositiveAmount(normalized)) return 'wallet.crypto.withdraw.gate.amount';
  return null;
}

export function cryptoWithdrawAddressGateKey(
  address: string,
  chain: CryptoWithdrawChain,
): MessageKey | null {
  const normalized = normalizeCryptoWithdrawAddressInput(address);
  if (normalized.length < 10) return 'wallet.crypto.withdraw.invalid_address';
  if (chain === 'TRC20' && !normalized.startsWith('T')) {
    return 'wallet.crypto.withdraw.invalid_address';
  }
  if (chain === 'ERC20' && !/^0x[0-9a-fA-F]{40}$/.test(normalized)) {
    return 'wallet.crypto.withdraw.invalid_address';
  }
  return null;
}

export function cryptoWithdrawBalanceGateKey(
  amountUsdt: string,
  usdtAvailable: string | null | undefined,
): MessageKey | null {
  if (!usdtAvailable) return null;
  const normalized = normalizeUsdtAmountInput(amountUsdt);
  if (!isPositiveAmount(normalized)) return null;
  try {
    if (toDecimal(normalized).greaterThan(toDecimal(usdtAvailable))) {
      return 'wallet.crypto.withdraw.gate.insufficientUsdt';
    }
  } catch {
    return 'wallet.crypto.withdraw.gate.insufficientUsdt';
  }
  return null;
}

export function cryptoWithdrawNetGateKey(
  amountUsdt: string,
  chain: CryptoWithdrawChain,
): MessageKey | null {
  const net = estimateCryptoWithdrawNetUsdt(amountUsdt, chain);
  if (!net || !isPositiveAmount(net)) return 'wallet.crypto.withdraw.gate.amount';
  return null;
}

export function cryptoWithdrawWhitelistGateKey(
  address: string,
  chain: CryptoWithdrawChain,
  whitelistEnabled: boolean,
  whitelistAddresses: readonly { chain: string; address: string }[],
): MessageKey | null {
  if (!whitelistEnabled) return null;
  const normalized = normalizeCryptoWithdrawAddressInput(address);
  if (!normalized) return null;
  const allowed = whitelistAddresses.some(
    (entry) =>
      entry.chain === chain && entry.address.trim().toLowerCase() === normalized.toLowerCase(),
  );
  return allowed ? null : 'wallet.crypto.withdraw.gate.whitelist';
}

export function cryptoWithdrawChainHintKey(chain: CryptoWithdrawChain): MessageKey {
  return chain === 'ERC20'
    ? 'wallet.crypto.withdraw.networkErc20Hint'
    : 'wallet.crypto.withdraw.networkTrc20Hint';
}

export function cryptoWithdrawFeeHintKey(chain: CryptoWithdrawChain): MessageKey {
  return chain === 'ERC20'
    ? 'wallet.crypto.withdraw.feeErc20Hint'
    : 'wallet.crypto.withdraw.feeTrc20Hint';
}

export function estimateCryptoWithdrawNetUsdt(
  amountUsdt: string,
  chain: CryptoWithdrawChain,
): string | null {
  const normalized = normalizeUsdtAmountInput(amountUsdt);
  if (!isPositiveAmount(normalized)) return null;
  try {
    const net = toDecimal(normalized).minus(toDecimal(CRYPTO_WITHDRAW_NETWORK_FEE_USDT[chain]));
    if (net.lessThanOrEqualTo(0)) return '0';
    return net.toFixed(6);
  } catch {
    return null;
  }
}

export function isEarnVipPriorityWithdrawTier(tier: string | null | undefined): boolean {
  const normalized = tier?.toLowerCase();
  return normalized === 'gold' || normalized === 'platinum' || normalized === 'diamond';
}

export function canOpenCryptoWithdrawConfirm(input: {
  withdrawalBlocked: boolean;
  withdrawalReady: boolean;
  withdrawalMfaRequired?: boolean;
  geoBlocked?: boolean;
  amountUsdt: string;
  address: string;
  chain: CryptoWithdrawChain;
  usdtAvailable: string | null | undefined;
  whitelistEnabled: boolean;
  whitelistAddresses: readonly { chain: string; address: string }[];
}): boolean {
  if (input.withdrawalBlocked) return false;
  if (input.withdrawalMfaRequired) return false;
  if (input.geoBlocked) return false;
  if (!input.withdrawalReady) return false;
  if (cryptoWithdrawAmountGateKey(input.amountUsdt)) return false;
  if (cryptoWithdrawAddressGateKey(input.address, input.chain)) return false;
  if (cryptoWithdrawBalanceGateKey(input.amountUsdt, input.usdtAvailable)) return false;
  if (cryptoWithdrawNetGateKey(input.amountUsdt, input.chain)) return false;
  if (
    cryptoWithdrawWhitelistGateKey(
      input.address,
      input.chain,
      input.whitelistEnabled,
      input.whitelistAddresses,
    )
  ) {
    return false;
  }
  return true;
}

export function canSubmitCryptoWithdrawRequest(input: {
  withdrawalBlocked: boolean;
  withdrawalReady: boolean;
  amountUsdt: string;
  address: string;
  chain: CryptoWithdrawChain;
  usdtAvailable: string | null | undefined;
  whitelistEnabled: boolean;
  whitelistAddresses: readonly { chain: string; address: string }[];
  submitting: boolean;
  submitResult: CryptoWithdrawalResult | null;
}): boolean {
  if (input.submitting) return false;
  if (input.submitResult) return false;
  return canOpenCryptoWithdrawConfirm(input);
}

/** §30.3 — user must see estimated net USDT before leaving the confirm flow. */
export function canAcknowledgeCryptoWithdrawResult(result: CryptoWithdrawalResult | null): boolean {
  if (!result?.ok) return false;
  if (!result.withdrawal_id?.trim()) return false;
  return isPositiveAmount(result.estimated_net_usdt);
}

export function buildCryptoWithdrawTimelineSteps(): CryptoWithdrawTimelineStepView[] {
  return [
    { id: 'request', labelKey: 'wallet.crypto.withdraw.timeline.request', state: 'done' },
    { id: 'review', labelKey: 'wallet.crypto.withdraw.timeline.review', state: 'active' },
    { id: 'approve', labelKey: 'wallet.crypto.withdraw.timeline.approve', state: 'upcoming' },
    { id: 'broadcast', labelKey: 'wallet.crypto.withdraw.timeline.broadcast', state: 'upcoming' },
    { id: 'done', labelKey: 'wallet.crypto.withdraw.timeline.done', state: 'upcoming' },
  ];
}

/** Re-export for controller input normalization consistency. */
export function normalizeUsdtWithdrawAmountInput(raw: string): string {
  return normalizeDecimalInput(raw, { maxFractionDigits: 6, allowDecimal: true });
}
