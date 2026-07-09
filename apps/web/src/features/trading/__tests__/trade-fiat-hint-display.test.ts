import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P9_TRADE_FIAT_HINT_WIRE_PREREQUISITE_TODO,
  P9_TRADE_FIAT_HINT_WIRE_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';

import {
  buildTradeFiatHint,
  isTradeFiatHintEligibleCurrency,
  resolveTradeFiatHintPairKey,
} from '../trade-fiat-hint-display';

const SAMPLE_SNAPSHOT = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1450',
  capturedAt: '2026-07-06T10:00:00.000Z',
  source: 'exchange_rate_snapshots:PHON/KRW',
  stale: false,
} as const;

describe('trade-fiat-hint-display §13.1.4 Fiat#7', () => {
  it('registers Fiat#7 owner and prerequisite todos', () => {
    expect(P9_TRADE_FIAT_HINT_WIRE_TODO).toBe('p9-trade-fiat-hint-wire');
    expect(P9_TRADE_FIAT_HINT_WIRE_PREREQUISITE_TODO).toBe('p4-page-wallet-fiat-hint');
  });

  it('allows PHON and USDT settlement currencies only', () => {
    expect(isTradeFiatHintEligibleCurrency('PHON')).toBe(true);
    expect(isTradeFiatHintEligibleCurrency('USDT')).toBe(true);
    expect(isTradeFiatHintEligibleCurrency('KRW')).toBe(false);
    expect(isTradeFiatHintEligibleCurrency('BTC')).toBe(false);
  });

  it('resolves KRW pair keys for PHON and USDT', () => {
    expect(resolveTradeFiatHintPairKey('PHON', 'KRW')).toBe('PHON/KRW');
    expect(resolveTradeFiatHintPairKey('USDT', 'KRW')).toBe('USDT/KRW');
    expect(resolveTradeFiatHintPairKey('PHON', 'OFF')).toBeNull();
  });

  it('converts settlement amount to fiat hint via rate snapshot', () => {
    const hint = buildTradeFiatHint('10', 'PHON', 'KRW', {
      'PHON/KRW': {
        displayOnly: true,
        rate: '1450',
        capturedAt: '2026-07-06T10:00:00.000Z',
        source: 'exchange_rate_snapshots:PHON/KRW',
        stale: false,
        tier: 'primary',
        unavailable: false,
        blocked: false,
      },
    });

    expect(hint.formattedHint).toMatch(/^≈ ₩/);
    expect(hint.disabled).toBe(false);
  });

  it('shows unavailable hint when oracle is stale', () => {
    const hint = buildTradeFiatHint('3200', 'USDT', 'KRW', {}, { oracleStale: true });
    expect(hint.formattedHint).toBe('—');
    expect(hint.stale).toBe(true);
  });

  it('matches toFiatHint for eligible USDT amounts', () => {
    const built = buildTradeFiatHint('100', 'USDT', 'KRW', {
      'USDT/KRW': {
        displayOnly: true,
        rate: '1400',
        capturedAt: '2026-07-06T10:00:00.000Z',
        source: 'exchange_rate_snapshots:USDT/KRW',
        stale: false,
        tier: 'primary',
        unavailable: false,
        blocked: false,
      },
    });
    const direct = toFiatHint('100', 'USDT', 'KRW', {
      ...SAMPLE_SNAPSHOT,
      rate: '1400',
      source: 'exchange_rate_snapshots:USDT/KRW',
    });
    expect(built.formattedHint).toBe(direct.formattedHint);
  });
});
