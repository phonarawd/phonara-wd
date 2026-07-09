import { describe, expect, it } from 'vitest';

import {
  addKrwChipAmount,
  buildKrwDepositTimelineSteps,
  canAcknowledgeKrwDepositResult,
  canOpenKrwDepositConfirm,
  canSubmitKrwDepositRequest,
  krwDepositAmountGateKey,
  krwDepositRateGateKey,
  normalizeKrwAmountInput,
} from '../krw-deposit-page-display';

describe('krw-deposit-page-display', () => {
  it('normalizes KRW amount input to whole digits', () => {
    expect(normalizeKrwAmountInput('50,000원')).toBe('50000');
    expect(normalizeKrwAmountInput('00012000')).toBe('12000');
  });

  it('adds chip amounts without float arithmetic', () => {
    expect(addKrwChipAmount('10000', '50000')).toBe('60000');
    expect(addKrwChipAmount('', '10000')).toBe('10000');
  });

  it('gates amount and rate before confirm', () => {
    expect(krwDepositAmountGateKey('')).toBe('wallet.deposit.gate.amount');
    expect(krwDepositRateGateKey(true, false)).toBe('wallet.rate.staleGate');
    expect(krwDepositRateGateKey(false, true)).toBe('wallet.rate.unavailableGate');
    expect(
      canOpenKrwDepositConfirm({
        depositBlocked: false,
        amountKrw: '50000',
        phonKrwRateStale: false,
        phonKrwRateUnavailable: false,
      }),
    ).toBe(true);
    expect(
      canOpenKrwDepositConfirm({
        depositBlocked: true,
        amountKrw: '50000',
        phonKrwRateStale: false,
        phonKrwRateUnavailable: false,
      }),
    ).toBe(false);
  });

  it('blocks submit while rate is stale or RPC is in flight', () => {
    expect(
      canSubmitKrwDepositRequest({
        depositBlocked: false,
        amountKrw: '50000',
        phonKrwRateStale: true,
        phonKrwRateUnavailable: false,
        submitting: false,
      }),
    ).toBe(false);
    expect(
      canSubmitKrwDepositRequest({
        depositBlocked: false,
        amountKrw: '50000',
        phonKrwRateStale: false,
        phonKrwRateUnavailable: false,
        submitting: true,
      }),
    ).toBe(false);
  });

  it('requires RPC expected_phon before acknowledge', () => {
    expect(
      canAcknowledgeKrwDepositResult({
        ok: true,
        deposit_id: 'id',
        reference_code: 'ABC',
        expected_phon: '36.231884',
        sla_hours: '24',
      }),
    ).toBe(true);
    expect(
      canAcknowledgeKrwDepositResult({
        ok: true,
        deposit_id: 'id',
        reference_code: 'ABC',
        expected_phon: '0',
        sla_hours: '24',
      }),
    ).toBe(false);
  });

  it('builds pending timeline with sla hours from RPC', () => {
    const steps = buildKrwDepositTimelineSteps('6');
    expect(steps).toHaveLength(3);
    expect(steps[0]?.state).toBe('done');
    expect(steps[1]?.state).toBe('active');
    expect(steps[1]?.detailParams).toEqual({ hours: '6' });
  });
});
