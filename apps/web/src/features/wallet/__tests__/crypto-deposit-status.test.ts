import { describe, expect, it } from 'vitest';
import { cryptoDepositStatusLabelKey, isActiveCryptoDeposit } from '../crypto-deposit-status';

describe('crypto-deposit-status', () => {
  it('maps deposit statuses to i18n keys', () => {
    expect(cryptoDepositStatusLabelKey('pending')).toBe('wallet.crypto.deposit.status.pending');
    expect(cryptoDepositStatusLabelKey('matched')).toBe('wallet.crypto.deposit.status.confirming');
    expect(cryptoDepositStatusLabelKey('credited')).toBe('wallet.crypto.deposit.status.credited');
    expect(cryptoDepositStatusLabelKey('failed')).toBe('wallet.crypto.deposit.status.failed');
    expect(cryptoDepositStatusLabelKey('expired')).toBe('wallet.crypto.deposit.status.expired');
  });

  it('falls back to pending label for unknown status', () => {
    expect(cryptoDepositStatusLabelKey('unknown' as 'pending')).toBe(
      'wallet.crypto.deposit.status.pending',
    );
  });

  it('treats pending and matched as active', () => {
    expect(isActiveCryptoDeposit('pending')).toBe(true);
    expect(isActiveCryptoDeposit('matched')).toBe(true);
    expect(isActiveCryptoDeposit('credited')).toBe(false);
    expect(isActiveCryptoDeposit('expired')).toBe(false);
  });
});
