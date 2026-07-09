import { describe, expect, it } from 'vitest';
import {
  GIFTCARD_DEPOSIT_STATUSES,
  giftcardDepositStatusLabelKey,
  giftcardDepositStatusLabelKeyFromRow,
  isActiveGiftcardDeposit,
  isActiveGiftcardDepositRow,
  isGiftcardDepositStatus,
} from '../giftcard-deposit-status';

describe('giftcard-deposit-status', () => {
  it('keeps the four-status closed set aligned with DB CHECK (E5)', () => {
    expect(GIFTCARD_DEPOSIT_STATUSES).toEqual(['pending', 'approved', 'credited', 'rejected']);
  });

  it('maps deposit statuses to i18n keys', () => {
    expect(giftcardDepositStatusLabelKey('pending')).toBe('wallet.deposit.giftcard.status.pending');
    expect(giftcardDepositStatusLabelKey('approved')).toBe(
      'wallet.deposit.giftcard.status.approved',
    );
    expect(giftcardDepositStatusLabelKey('credited')).toBe(
      'wallet.deposit.giftcard.status.credited',
    );
    expect(giftcardDepositStatusLabelKey('rejected')).toBe(
      'wallet.deposit.giftcard.status.rejected',
    );
  });

  it('falls back for unknown row status strings', () => {
    expect(giftcardDepositStatusLabelKeyFromRow('pending')).toBe(
      'wallet.deposit.giftcard.status.pending',
    );
    expect(giftcardDepositStatusLabelKeyFromRow('unknown')).toBe(
      'wallet.deposit.giftcard.status.pending',
    );
    expect(isGiftcardDepositStatus('credited')).toBe(true);
    expect(isGiftcardDepositStatus('unknown')).toBe(false);
  });

  it('treats pending and approved as active', () => {
    expect(isActiveGiftcardDeposit('pending')).toBe(true);
    expect(isActiveGiftcardDeposit('approved')).toBe(true);
    expect(isActiveGiftcardDeposit('credited')).toBe(false);
    expect(isActiveGiftcardDeposit('rejected')).toBe(false);
    expect(isActiveGiftcardDepositRow('pending')).toBe(true);
    expect(isActiveGiftcardDepositRow('unknown')).toBe(false);
  });
});
