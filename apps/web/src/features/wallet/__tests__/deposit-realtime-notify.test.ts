import { describe, expect, it } from 'vitest';
import {
  depositCreditedAmountDisplay,
  depositCreditedNotificationId,
  depositStatusKey,
  shouldEmitDepositCreditedNotify,
} from '../deposit-realtime-notify';

describe('deposit-realtime-notify', () => {
  it('emits only on first transition to credited', () => {
    expect(shouldEmitDepositCreditedNotify(undefined, 'credited')).toBe(false);
    expect(shouldEmitDepositCreditedNotify('pending', 'credited')).toBe(true);
    expect(shouldEmitDepositCreditedNotify('matched', 'credited')).toBe(true);
    expect(shouldEmitDepositCreditedNotify('approved', 'credited')).toBe(true);
    expect(shouldEmitDepositCreditedNotify('credited', 'credited')).toBe(false);
    expect(shouldEmitDepositCreditedNotify('pending', 'matched')).toBe(false);
  });

  it('builds stable notification ids per rail', () => {
    expect(depositCreditedNotificationId('krw', 'abc')).toBe('deposit:krw:abc:credited');
    expect(depositStatusKey('crypto', 'abc')).toBe('crypto:abc');
  });

  it('maps display amount by rail without client-side math', () => {
    expect(depositCreditedAmountDisplay('crypto', { amount: '25.500000' })).toEqual({
      amount: '25.500000',
      currency: 'USDT',
    });
    expect(
      depositCreditedAmountDisplay('krw', { expected_phon: '100.000000', amount_krw: '138000' }),
    ).toEqual({
      amount: '100.000000',
      currency: 'PHON',
    });
    expect(depositCreditedAmountDisplay('giftcard', { expected_phon: '72.463768' })).toEqual({
      amount: '72.463768',
      currency: 'PHON',
    });
  });
});
