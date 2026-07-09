import type { MessageKey } from '@phonara/i18n';

import type { Tables } from '@phonara/shared-types';

import type { CryptoDepositChain } from './crypto-deposit-status';

export type WithdrawRail = 'crypto' | 'krw';

export type CryptoWithdrawChain = CryptoDepositChain;

export const CRYPTO_WITHDRAW_CHAINS: readonly CryptoWithdrawChain[] = ['TRC20', 'ERC20'] as const;

export type WithdrawalRequest = Tables<'withdrawal_requests'>;

export function cryptoWithdrawStatusLabelKey(status: WithdrawalRequest['status']): MessageKey {
  switch (status) {
    case 'pending':
      return 'wallet.crypto.withdraw.status.pending';

    case 'approved':
      return 'wallet.crypto.withdraw.status.approved';

    case 'processing':
      return 'wallet.crypto.withdraw.status.processing';

    case 'sent':
      return 'wallet.crypto.withdraw.status.sent';

    case 'completed':
      return 'wallet.crypto.withdraw.status.completed';

    case 'rejected':
      return 'wallet.crypto.withdraw.status.rejected';

    case 'cancelled':
      return 'wallet.crypto.withdraw.status.cancelled';

    default:
      return 'wallet.crypto.withdraw.status.pending';
  }
}

export function isActiveCryptoWithdraw(status: WithdrawalRequest['status']): boolean {
  return (
    status === 'pending' || status === 'approved' || status === 'processing' || status === 'sent'
  );
}

export function withdrawalDestinationChain(
  destination: WithdrawalRequest['destination'],
): CryptoWithdrawChain | null {
  if (!destination || typeof destination !== 'object' || Array.isArray(destination)) return null;

  const chain = (destination as { chain?: string }).chain;

  return chain === 'TRC20' || chain === 'ERC20' ? chain : null;
}

export function withdrawalDestinationAddress(
  destination: WithdrawalRequest['destination'],
): string | null {
  if (!destination || typeof destination !== 'object' || Array.isArray(destination)) return null;

  const payload = destination as { address?: string; account?: string };

  const address = payload.account?.trim() || payload.address?.trim();

  return address ? address : null;
}

export function isActiveKrwWithdraw(status: WithdrawalRequest['status']): boolean {
  return isActiveCryptoWithdraw(status);
}

export function isPhonKrwWithdraw(row: WithdrawalRequest): boolean {
  if (row.currency !== 'PHON') return false;

  if (!row.destination || typeof row.destination !== 'object' || Array.isArray(row.destination)) {
    return false;
  }

  const payload = row.destination as { type?: string; chain?: string };

  return payload.type === 'bank' || payload.chain === 'BANK';
}
