import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS,
  P10_SPORTS_FIAT_HINT_WIRE_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';

import {
  buildSportsFiatHint,
  isSportsFiatHintEligibleCurrency,
  resolveSportsFiatHintPairKey,
} from '../sports-fiat-hint-display';

const SAMPLE_USDT_RATE = {
  displayOnly: true as const,
  rate: '1400',
  capturedAt: '2026-07-10T10:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
  tier: 'primary' as const,
  unavailable: false,
  blocked: false,
};

describe('sports-fiat-hint-display §13.1.4 Fiat#10', () => {
  it('registers Fiat#10 owner and prerequisites', () => {
    expect(P10_SPORTS_FIAT_HINT_WIRE_TODO).toBe('p10-sports-fiat-hint-wire');
    expect(P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS).toEqual(
      expect.arrayContaining([
        'p4-fiat-money-display-hint',
        'p10-page-sports',
        'da-w5-gate-domain-cards',
      ]),
    );
  });

  it('allows PHON and USDT settlement currencies only', () => {
    expect(isSportsFiatHintEligibleCurrency('PHON')).toBe(true);
    expect(isSportsFiatHintEligibleCurrency('USDT')).toBe(true);
    expect(isSportsFiatHintEligibleCurrency('KRW')).toBe(false);
  });

  it('resolves KRW pair keys for PHON and USDT', () => {
    expect(resolveSportsFiatHintPairKey('PHON', 'KRW')).toBe('PHON/KRW');
    expect(resolveSportsFiatHintPairKey('USDT', 'KRW')).toBe('USDT/KRW');
    expect(resolveSportsFiatHintPairKey('PHON', 'OFF')).toBeNull();
  });

  it('converts stake settlement amount to fiat hint via rate snapshot', () => {
    const hint = buildSportsFiatHint('10', 'USDT', 'KRW', {
      'USDT/KRW': SAMPLE_USDT_RATE,
    });

    expect(hint.formattedHint).toMatch(/^≈ ₩/);
    expect(hint.disabled).toBe(false);
  });

  it('disables potential_return hint when preview amount is missing (odds-after)', () => {
    const hint = buildSportsFiatHint(
      null,
      'USDT',
      'KRW',
      {
        'USDT/KRW': SAMPLE_USDT_RATE,
      },
      { requirePotentialReturn: true },
    );

    expect(hint.disabled).toBe(true);
    expect(hint.formattedHint).toBe('');
  });

  it('hints potential_return only after preview amount exists', () => {
    const hint = buildSportsFiatHint(
      '19.50',
      'USDT',
      'KRW',
      {
        'USDT/KRW': SAMPLE_USDT_RATE,
      },
      { requirePotentialReturn: true },
    );

    const direct = toFiatHint('19.50', 'USDT', 'KRW', {
      displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
      rate: '1400',
      capturedAt: '2026-07-10T10:00:00.000Z',
      source: 'exchange_rate_snapshots:USDT/KRW',
      stale: false,
    });

    expect(hint.disabled).toBe(false);
    expect(hint.formattedHint).toBe(direct.formattedHint);
  });

  it('never accepts odds as source currency for fiat conversion', () => {
    const hint = buildSportsFiatHint('1.95', 'ODDS', 'KRW', {
      'USDT/KRW': SAMPLE_USDT_RATE,
    });
    expect(hint.disabled).toBe(true);
  });
});
