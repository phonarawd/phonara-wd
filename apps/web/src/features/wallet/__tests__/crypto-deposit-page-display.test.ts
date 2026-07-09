import { describe, expect, it } from 'vitest';

import {
  buildCryptoDepositTimelineSteps,
  canAcknowledgeCryptoDepositResult,
  canOpenCryptoDepositConfirm,
  canSubmitCryptoDepositRequest,
  cryptoDepositAmountGateKey,
  cryptoDepositChainHintKey,
  normalizeUsdtAmountInput,
} from '../crypto-deposit-page-display';

describe('crypto-deposit-page-display', () => {
  it('normalizes USDT amount input with up to 6 fractional digits', () => {
    expect(normalizeUsdtAmountInput('100.5 USDT')).toBe('100.5');
    expect(normalizeUsdtAmountInput('00012.3400009')).toBe('12.340000');
    expect(normalizeUsdtAmountInput('1..2')).toBe('1.2');
  });

  it('maps chain hints to i18n keys', () => {
    expect(cryptoDepositChainHintKey('TRC20')).toBe('wallet.crypto.deposit.networkTrc20Hint');
    expect(cryptoDepositChainHintKey('ERC20')).toBe('wallet.crypto.deposit.networkErc20Hint');
  });

  it('gates amount and address readiness before confirm', () => {
    expect(cryptoDepositAmountGateKey('')).toBe('wallet.crypto.deposit.gate.amount');
    expect(
      canOpenCryptoDepositConfirm({
        depositBlocked: false,
        amountUsdt: '50',
        addressReady: true,
      }),
    ).toBe(true);
    expect(
      canOpenCryptoDepositConfirm({
        depositBlocked: false,
        amountUsdt: '50',
        addressReady: false,
      }),
    ).toBe(false);
    expect(
      canSubmitCryptoDepositRequest({
        depositBlocked: false,
        amountUsdt: '50',
        addressReady: true,
        submitting: true,
      }),
    ).toBe(false);
  });

  it('requires RPC address and amount before acknowledge', () => {
    expect(
      canAcknowledgeCryptoDepositResult({
        ok: true,
        deposit_id: 'dep-1',
        address: 'TAddr123',
        asset: 'USDT',
        chain: 'TRC20',
        amount: '25.5',
      }),
    ).toBe(true);
    expect(
      canAcknowledgeCryptoDepositResult({
        ok: true,
        deposit_id: 'dep-1',
        address: '',
        asset: 'USDT',
        chain: 'TRC20',
        amount: '25.5',
      }),
    ).toBe(false);
  });

  it('builds on-chain timeline with confirmations and sla from RPC', () => {
    const steps = buildCryptoDepositTimelineSteps(3, '12');
    expect(steps).toHaveLength(3);
    expect(steps[1]?.detailParams).toEqual({ seen: '0', required: '3' });
    expect(steps[2]?.detailParams).toEqual({ hours: '12' });
  });
});
