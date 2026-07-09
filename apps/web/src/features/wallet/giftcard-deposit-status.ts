import type { MessageKey } from '@phonara/i18n';
import type { Tables } from '@phonara/shared-types';

/** DB CHECK on giftcard_deposit_requests.status — maintain as closed set (E5). */
export const GIFTCARD_DEPOSIT_STATUSES = ['pending', 'approved', 'credited', 'rejected'] as const;

export type GiftcardDepositStatus = (typeof GIFTCARD_DEPOSIT_STATUSES)[number];

export type GiftcardDepositRequest = Tables<'giftcard_deposit_requests'>;

export function isGiftcardDepositStatus(status: string): status is GiftcardDepositStatus {
  return (GIFTCARD_DEPOSIT_STATUSES as readonly string[]).includes(status);
}

export function giftcardDepositStatusLabelKey(status: GiftcardDepositStatus): MessageKey {
  switch (status) {
    case 'pending':
      return 'wallet.deposit.giftcard.status.pending';
    case 'approved':
      return 'wallet.deposit.giftcard.status.approved';
    case 'credited':
      return 'wallet.deposit.giftcard.status.credited';
    case 'rejected':
      return 'wallet.deposit.giftcard.status.rejected';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function giftcardDepositStatusLabelKeyFromRow(
  status: GiftcardDepositRequest['status'],
): MessageKey {
  return isGiftcardDepositStatus(status)
    ? giftcardDepositStatusLabelKey(status)
    : 'wallet.deposit.giftcard.status.pending';
}

export function isActiveGiftcardDeposit(status: GiftcardDepositStatus): boolean {
  return status === 'pending' || status === 'approved';
}

export function isActiveGiftcardDepositRow(status: GiftcardDepositRequest['status']): boolean {
  return isGiftcardDepositStatus(status) && isActiveGiftcardDeposit(status);
}
