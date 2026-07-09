import { describe, expect, it } from 'vitest';

import {
  buildKrwWithdrawTimelineSteps,
  canAcknowledgeKrwWithdrawResult,
  canOpenKrwWithdrawConfirm,
  canSubmitKrwWithdrawRequest,
  formatPhonAmountForRpc,
  krwWithdrawAccountGateKey,
  krwWithdrawAmountGateKey,
  krwWithdrawBalanceGateKey,
  krwWithdrawRateGateKey,
  normalizeBankAccountInput,
  normalizePhonWithdrawAmountInput,
} from '../krw-withdraw-page-display';

describe('krw-withdraw-page-display', () => {
  it('normalizes PHON amount input with up to 6 fractional digits', () => {
    expect(normalizePhonWithdrawAmountInput('10.5')).toBe('10.5');
    expect(normalizePhonWithdrawAmountInput('10.1234567')).toBe('10.123456');
    expect(normalizePhonWithdrawAmountInput('abc12.3x')).toBe('12.3');
  });

  it('formats PHON amount for RPC with 6 decimal places', () => {
    expect(formatPhonAmountForRpc('25')).toBe('25.000000');
    expect(formatPhonAmountForRpc('10.5')).toBe('10.500000');
  });

  it('normalizes bank account to digits only', () => {
    expect(normalizeBankAccountInput('110-1234-5678')).toBe('11012345678');
  });

  it('gates amount, account, balance, and rate before confirm', () => {
    expect(krwWithdrawAmountGateKey('')).toBe('wallet.withdraw.gate.amount');
    expect(krwWithdrawAccountGateKey('12345')).toBe('wallet.withdraw.gate.bankFields');
    expect(krwWithdrawBalanceGateKey('100', '50')).toBe('wallet.withdraw.gate.insufficientReal');
    expect(krwWithdrawRateGateKey(true, false)).toBe('wallet.rate.staleGate');
    expect(krwWithdrawRateGateKey(false, true)).toBe('wallet.withdraw.rateUnavailable');
    expect(
      canOpenKrwWithdrawConfirm({
        withdrawalBlocked: false,
        withdrawalReady: true,
        amountPhon: '10',
        bankAccount: '110123456789',
        phonKrwRateStale: false,
        phonKrwRateUnavailable: false,
        phonRealAvailable: '100',
      }),
    ).toBe(true);
  });

  it('blocks submit when expected_krw is not yet returned from RPC', () => {
    expect(
      canSubmitKrwWithdrawRequest({
        withdrawalBlocked: false,
        withdrawalReady: true,
        amountPhon: '10',
        bankAccount: '110123456789',
        phonKrwRateStale: false,
        phonKrwRateUnavailable: false,
        phonRealAvailable: '100',
        submitting: false,
        submitResult: {
          ok: true,
          withdrawal_id: 'wd-1',
          expected_krw: '250.000000',
          rate_snapshot_id: 'rate-1',
        },
      }),
    ).toBe(false);
  });

  it('requires RPC expected_krw before acknowledge (§30.3)', () => {
    expect(
      canAcknowledgeKrwWithdrawResult({
        ok: true,
        withdrawal_id: 'wd-1',
        expected_krw: '250.000000',
        rate_snapshot_id: 'rate-1',
      }),
    ).toBe(true);
    expect(
      canAcknowledgeKrwWithdrawResult({
        ok: true,
        withdrawal_id: 'wd-1',
        expected_krw: '0',
        rate_snapshot_id: 'rate-1',
      }),
    ).toBe(false);
    expect(canAcknowledgeKrwWithdrawResult(null)).toBe(false);
  });

  it('builds withdraw timeline with review active', () => {
    const steps = buildKrwWithdrawTimelineSteps();
    expect(steps.map((step) => step.id)).toEqual(['request', 'review', 'send', 'done']);
    expect(steps.find((step) => step.id === 'review')?.state).toBe('active');
  });
});
