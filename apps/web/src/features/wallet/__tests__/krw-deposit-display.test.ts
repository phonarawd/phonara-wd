import { describe, expect, it } from 'vitest';
import {
  isActiveKrwDeposit,
  isKrwDepositAdminReview,
  isKrwDepositStatus,
  krwDepositStatusLabelKey,
} from '../krw-deposit-display';

describe('krw-deposit-display', () => {
  it('maps Hybrid L3 statuses to i18n keys', () => {
    expect(krwDepositStatusLabelKey('pending')).toBe('wallet.deposit.krw.status.pending');
    expect(krwDepositStatusLabelKey('matched')).toBe('wallet.deposit.krw.status.matched');
    expect(krwDepositStatusLabelKey('disputed')).toBe('wallet.deposit.krw.status.disputed');
    expect(krwDepositStatusLabelKey('admin_rejected')).toBe(
      'wallet.deposit.krw.status.adminRejected',
    );
  });

  it('treats pending/matched/unmatched/disputed as active', () => {
    expect(isActiveKrwDeposit('pending')).toBe(true);
    expect(isActiveKrwDeposit('matched')).toBe(true);
    expect(isActiveKrwDeposit('unmatched')).toBe(true);
    expect(isActiveKrwDeposit('disputed')).toBe(true);
    expect(isActiveKrwDeposit('credited')).toBe(false);
  });

  it('flags admin-review states', () => {
    expect(isKrwDepositAdminReview('unmatched')).toBe(true);
    expect(isKrwDepositAdminReview('disputed')).toBe(true);
    expect(isKrwDepositAdminReview('pending')).toBe(false);
  });

  it('narrows unknown strings', () => {
    expect(isKrwDepositStatus('pending')).toBe(true);
    expect(isKrwDepositStatus('bogus')).toBe(false);
  });
});
