import type { MessageKey } from '@phonara/i18n';

/** KRW Hybrid L3 deposit statuses — display-only · no fake auto-ingest (E1a). */
export type KrwDepositStatus =
  | 'pending'
  | 'matched'
  | 'credited'
  | 'failed'
  | 'expired'
  | 'unmatched'
  | 'disputed'
  | 'admin_rejected';

const ACTIVE_KRW_DEPOSIT: ReadonlySet<KrwDepositStatus> = new Set([
  'pending',
  'matched',
  'unmatched',
  'disputed',
]);

const ADMIN_REVIEW_KRW_DEPOSIT: ReadonlySet<KrwDepositStatus> = new Set(['unmatched', 'disputed']);

export function isKrwDepositStatus(value: string): value is KrwDepositStatus {
  return (
    value === 'pending' ||
    value === 'matched' ||
    value === 'credited' ||
    value === 'failed' ||
    value === 'expired' ||
    value === 'unmatched' ||
    value === 'disputed' ||
    value === 'admin_rejected'
  );
}

export function isActiveKrwDeposit(status: string): boolean {
  return isKrwDepositStatus(status) && ACTIVE_KRW_DEPOSIT.has(status);
}

export function isKrwDepositAdminReview(status: string): boolean {
  return isKrwDepositStatus(status) && ADMIN_REVIEW_KRW_DEPOSIT.has(status);
}

export function krwDepositStatusLabelKey(status: string): MessageKey {
  switch (status) {
    case 'pending':
      return 'wallet.deposit.krw.status.pending';
    case 'matched':
      return 'wallet.deposit.krw.status.matched';
    case 'credited':
      return 'wallet.deposit.krw.status.credited';
    case 'failed':
      return 'wallet.deposit.krw.status.failed';
    case 'expired':
      return 'wallet.deposit.krw.status.expired';
    case 'unmatched':
      return 'wallet.deposit.krw.status.unmatched';
    case 'disputed':
      return 'wallet.deposit.krw.status.disputed';
    case 'admin_rejected':
      return 'wallet.deposit.krw.status.adminRejected';
    default:
      return 'wallet.deposit.krw.status.pending';
  }
}
