import { describe, expect, it } from 'vitest';

import {
  buildCryptoWithdrawTimelineSteps,
  canAcknowledgeCryptoWithdrawResult,
  canOpenCryptoWithdrawConfirm,
  canSubmitCryptoWithdrawRequest,
  cryptoWithdrawAddressGateKey,
  cryptoWithdrawAmountGateKey,
  cryptoWithdrawBalanceGateKey,
  cryptoWithdrawWhitelistGateKey,
  estimateCryptoWithdrawNetUsdt,
  formatUsdtAmountForRpc,
  isEarnVipPriorityWithdrawTier,
  normalizeCryptoWithdrawAddressInput,
} from '../crypto-withdraw-page-display';

describe('crypto-withdraw-page-display', () => {
  it('normalizes USDT amount for RPC with 6 decimal places', () => {
    expect(formatUsdtAmountForRpc('25')).toBe('25.000000');
    expect(formatUsdtAmountForRpc('10.5')).toBe('10.500000');
  });

  it('validates TRC20 and ERC20 addresses', () => {
    expect(cryptoWithdrawAddressGateKey('TExample123456', 'TRC20')).toBeNull();
    expect(
      cryptoWithdrawAddressGateKey('0xD3aBcDeF1234567890abcdef1234567890AbCdEf', 'ERC20'),
    ).toBeNull();
    expect(cryptoWithdrawAddressGateKey('short', 'TRC20')).toBe(
      'wallet.crypto.withdraw.invalid_address',
    );
    expect(cryptoWithdrawAddressGateKey('0xbad', 'ERC20')).toBe(
      'wallet.crypto.withdraw.invalid_address',
    );
  });

  it('estimates net USDT after display-only network fee', () => {
    expect(estimateCryptoWithdrawNetUsdt('10', 'TRC20')).toBe('9.000000');
    expect(estimateCryptoWithdrawNetUsdt('10', 'ERC20')).toBe('5.000000');
    expect(estimateCryptoWithdrawNetUsdt('1', 'TRC20')).toBe('0');
  });

  it('gates amount, balance, and whitelist before confirm', () => {
    expect(cryptoWithdrawAmountGateKey('')).toBe('wallet.crypto.withdraw.gate.amount');
    expect(cryptoWithdrawBalanceGateKey('100', '50')).toBe(
      'wallet.crypto.withdraw.gate.insufficientUsdt',
    );
    expect(
      cryptoWithdrawWhitelistGateKey('TExample123456', 'TRC20', true, [
        { chain: 'TRC20', address: 'TExample123456' },
      ]),
    ).toBeNull();
    expect(cryptoWithdrawWhitelistGateKey('TExample123456', 'TRC20', true, [])).toBe(
      'wallet.crypto.withdraw.gate.whitelist',
    );
    expect(
      canOpenCryptoWithdrawConfirm({
        withdrawalBlocked: false,
        withdrawalReady: true,
        amountUsdt: '10',
        address: 'TExample123456',
        chain: 'TRC20',
        usdtAvailable: '100',
        whitelistEnabled: false,
        whitelistAddresses: [],
      }),
    ).toBe(true);
  });

  it('blocks submit when result already returned', () => {
    expect(
      canSubmitCryptoWithdrawRequest({
        withdrawalBlocked: false,
        withdrawalReady: true,
        amountUsdt: '10',
        address: 'TExample123456',
        chain: 'TRC20',
        usdtAvailable: '100',
        whitelistEnabled: false,
        whitelistAddresses: [],
        submitting: false,
        submitResult: {
          ok: true,
          withdrawal_id: 'wd-1',
          amount_usdt: '10.000000',
          chain: 'TRC20',
          address: 'TExample123456',
          estimated_net_usdt: '9.000000',
        },
      }),
    ).toBe(false);
  });

  it('requires estimated net USDT before acknowledge (§30.3)', () => {
    expect(
      canAcknowledgeCryptoWithdrawResult({
        ok: true,
        withdrawal_id: 'wd-1',
        amount_usdt: '10.000000',
        chain: 'TRC20',
        address: 'TExample123456',
        estimated_net_usdt: '9.000000',
      }),
    ).toBe(true);
    expect(
      canAcknowledgeCryptoWithdrawResult({
        ok: true,
        withdrawal_id: 'wd-1',
        amount_usdt: '10.000000',
        chain: 'TRC20',
        address: 'TExample123456',
        estimated_net_usdt: '0',
      }),
    ).toBe(false);
    expect(canAcknowledgeCryptoWithdrawResult(null)).toBe(false);
  });

  it('detects gold+ tiers for priority copy only', () => {
    expect(isEarnVipPriorityWithdrawTier('gold')).toBe(true);
    expect(isEarnVipPriorityWithdrawTier('platinum')).toBe(true);
    expect(isEarnVipPriorityWithdrawTier('silver')).toBe(false);
  });

  it('trims withdraw address input', () => {
    expect(normalizeCryptoWithdrawAddressInput('  TExample123456  ')).toBe('TExample123456');
  });

  it('builds crypto withdraw timeline with review active', () => {
    const steps = buildCryptoWithdrawTimelineSteps();
    expect(steps.map((step) => step.id)).toEqual([
      'request',
      'review',
      'approve',
      'broadcast',
      'done',
    ]);
    expect(steps.find((step) => step.id === 'review')?.state).toBe('active');
  });
});
