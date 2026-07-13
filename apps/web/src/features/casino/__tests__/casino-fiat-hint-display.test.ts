import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';

import {
  buildCasinoFiatHint,
  isCasinoFiatHintEligibleCurrency,
  resolveCasinoFiatHintPairKey,
} from '../casino-fiat-hint-display';

const SAMPLE_USDT_RATE = {
  displayOnly: true as const,
  rate: '1400',
  capturedAt: '2026-07-11T01:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
  tier: 'primary' as const,
  unavailable: false,
  blocked: false,
};

describe('casino-fiat-hint-display §13.1.4 Fiat#11', () => {
  it('registers Fiat#11 owner and prerequisites', () => {
    expect(P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO).toBe('p10-casino-fiat-hint-session-lock');
    expect(P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS).toEqual(
      expect.arrayContaining(['p4-fiat-money-display-hint', 'p10-casino-replay-and-infra']),
    );
  });

  it('allows PHON and USDT settlement currencies only', () => {
    expect(isCasinoFiatHintEligibleCurrency('PHON')).toBe(true);
    expect(isCasinoFiatHintEligibleCurrency('USDT')).toBe(true);
    expect(isCasinoFiatHintEligibleCurrency('KRW')).toBe(false);
  });

  it('resolves KRW pair keys for PHON and USDT', () => {
    expect(resolveCasinoFiatHintPairKey('PHON', 'KRW')).toBe('PHON/KRW');
    expect(resolveCasinoFiatHintPairKey('USDT', 'KRW')).toBe('USDT/KRW');
    expect(resolveCasinoFiatHintPairKey('PHON', 'OFF')).toBeNull();
  });

  it('converts stake settlement amount to fiat hint via rate snapshot', () => {
    const hint = buildCasinoFiatHint('10', 'USDT', 'KRW', {
      'USDT/KRW': SAMPLE_USDT_RATE,
    });

    expect(hint.formattedHint).toMatch(/^≈ ₩/);
    expect(hint.disabled).toBe(false);
  });

  it('keeps identical hint text when the same locked snapshot is reused (spin drift 0)', () => {
    const first = buildCasinoFiatHint('10', 'USDT', 'KRW', {
      'USDT/KRW': SAMPLE_USDT_RATE,
    });
    const second = buildCasinoFiatHint('10', 'USDT', 'KRW', {
      'USDT/KRW': SAMPLE_USDT_RATE,
    });
    const driftedLive = buildCasinoFiatHint('10', 'USDT', 'KRW', {
      'USDT/KRW': { ...SAMPLE_USDT_RATE, rate: '1500' },
    });

    expect(first.formattedHint).toBe(second.formattedHint);
    expect(first.formattedHint).not.toBe(driftedLive.formattedHint);
  });

  it('matches toFiatHint for win payout amounts', () => {
    const hint = buildCasinoFiatHint('19.50', 'USDT', 'KRW', {
      'USDT/KRW': SAMPLE_USDT_RATE,
    });

    const direct = toFiatHint('19.50', 'USDT', 'KRW', {
      displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
      rate: '1400',
      capturedAt: '2026-07-11T01:00:00.000Z',
      source: 'exchange_rate_snapshots:USDT/KRW',
      stale: false,
    });

    expect(hint.disabled).toBe(false);
    expect(hint.formattedHint).toBe(direct.formattedHint);
  });
});
