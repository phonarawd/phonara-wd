import type { MessageKey } from '@phonara/i18n';
import type { Tables } from '@phonara/shared-types';

export type CryptoDepositChain = 'TRC20' | 'ERC20';
export type DepositRail = 'crypto' | 'krw' | 'giftcard';

export const CRYPTO_DEPOSIT_CHAINS: readonly CryptoDepositChain[] = ['TRC20', 'ERC20'] as const;

export type CryptoDepositRequest = Tables<'crypto_deposit_requests'>;

export function cryptoDepositStatusLabelKey(status: CryptoDepositRequest['status']): MessageKey {
  switch (status) {
    case 'pending':
      return 'wallet.crypto.deposit.status.pending';
    case 'matched':
      return 'wallet.crypto.deposit.status.confirming';
    case 'credited':
      return 'wallet.crypto.deposit.status.credited';
    case 'failed':
      return 'wallet.crypto.deposit.status.failed';
    case 'expired':
      return 'wallet.crypto.deposit.status.expired';
    default:
      return 'wallet.crypto.deposit.status.pending';
  }
}

export function isActiveCryptoDeposit(status: CryptoDepositRequest['status']): boolean {
  return status === 'pending' || status === 'matched';
}
