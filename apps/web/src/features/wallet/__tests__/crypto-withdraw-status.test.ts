import { describe, expect, it } from 'vitest';

import {
  CRYPTO_WITHDRAW_CHAINS,
  cryptoWithdrawStatusLabelKey,
  isActiveCryptoWithdraw,
  isPhonKrwWithdraw,
  withdrawalDestinationAddress,
  withdrawalDestinationChain,
} from '../crypto-withdraw-status';

describe('crypto-withdraw-status', () => {
  it('exposes TRC20 and ERC20 as supported withdraw chains', () => {
    expect(CRYPTO_WITHDRAW_CHAINS).toEqual(['TRC20', 'ERC20']);
  });

  it('maps withdrawal statuses to i18n keys', () => {
    expect(cryptoWithdrawStatusLabelKey('pending')).toBe('wallet.crypto.withdraw.status.pending');
    expect(cryptoWithdrawStatusLabelKey('approved')).toBe('wallet.crypto.withdraw.status.approved');
    expect(cryptoWithdrawStatusLabelKey('processing')).toBe(
      'wallet.crypto.withdraw.status.processing',
    );
    expect(cryptoWithdrawStatusLabelKey('sent')).toBe('wallet.crypto.withdraw.status.sent');
    expect(cryptoWithdrawStatusLabelKey('completed')).toBe(
      'wallet.crypto.withdraw.status.completed',
    );
    expect(cryptoWithdrawStatusLabelKey('rejected')).toBe('wallet.crypto.withdraw.status.rejected');
    expect(cryptoWithdrawStatusLabelKey('cancelled')).toBe(
      'wallet.crypto.withdraw.status.cancelled',
    );
  });

  it('falls back to pending label for unknown status', () => {
    expect(cryptoWithdrawStatusLabelKey('unknown' as 'pending')).toBe(
      'wallet.crypto.withdraw.status.pending',
    );
  });

  it('treats in-flight statuses as active', () => {
    expect(isActiveCryptoWithdraw('pending')).toBe(true);
    expect(isActiveCryptoWithdraw('approved')).toBe(true);
    expect(isActiveCryptoWithdraw('processing')).toBe(true);
    expect(isActiveCryptoWithdraw('sent')).toBe(true);
    expect(isActiveCryptoWithdraw('completed')).toBe(false);
    expect(isActiveCryptoWithdraw('rejected')).toBe(false);
    expect(isActiveCryptoWithdraw('cancelled')).toBe(false);
  });

  it('parses TRC20 and ERC20 destination chain and address from JSON', () => {
    const trc20 = { address: 'TExample123456', chain: 'TRC20' };
    expect(withdrawalDestinationChain(trc20)).toBe('TRC20');
    expect(withdrawalDestinationAddress(trc20)).toBe('TExample123456');

    const erc20 = { address: '0xD3CryptoWithdrawERC20Addr', chain: 'ERC20' };
    expect(withdrawalDestinationChain(erc20)).toBe('ERC20');
    expect(withdrawalDestinationAddress(erc20)).toBe('0xD3CryptoWithdrawERC20Addr');
  });

  it('returns null for invalid destination payloads', () => {
    expect(withdrawalDestinationChain(null)).toBeNull();
    expect(withdrawalDestinationAddress(null)).toBeNull();
    expect(withdrawalDestinationChain({ chain: 'SOL' })).toBeNull();
    expect(withdrawalDestinationAddress({ chain: 'TRC20' })).toBeNull();
  });

  it('detects PHON bank-transfer withdrawals', () => {
    expect(
      isPhonKrwWithdraw({
        currency: 'PHON',
        destination: { type: 'bank', chain: 'BANK', account: '110123456789' },
      } as never),
    ).toBe(true);
    expect(
      isPhonKrwWithdraw({
        currency: 'USDT',
        destination: { address: 'TExample123', chain: 'TRC20' },
      } as never),
    ).toBe(false);
    expect(withdrawalDestinationAddress({ account: '110123456789', type: 'bank' })).toBe(
      '110123456789',
    );
  });
});
