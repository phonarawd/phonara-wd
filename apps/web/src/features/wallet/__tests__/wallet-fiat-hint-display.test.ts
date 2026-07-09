import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  LOCALE_FIAT_OFF,
  P4_PAGE_WALLET_FIAT_HINT_PREREQUISITE_TODO,
  P4_PAGE_WALLET_FIAT_HINT_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import type { ResolvedFiatReferenceRate } from '@/features/money/fiat-reference-rates-lib';

import {
  buildWalletFiatHint,
  isWalletFiatHintEligibleCurrency,
  resolveWalletFiatHintPairKey,
} from '../wallet-fiat-hint-display';

const PHON_KRW_RATE: ResolvedFiatReferenceRate = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1450',
  capturedAt: '2026-07-06T10:00:00.000Z',
  source: 'exchange_rate_snapshots:PHON/KRW',
  stale: false,
  tier: 'primary',
  unavailable: false,
  blocked: false,
};

const USDT_KRW_RATE: ResolvedFiatReferenceRate = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1450',
  capturedAt: '2026-07-06T10:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
  tier: 'primary',
  unavailable: false,
  blocked: false,
};

describe('wallet-fiat-hint-display §13.1.4 Fiat#6', () => {
  it('registers Fiat#6 todo with Fiat#5 prerequisite', () => {
    expect(P4_PAGE_WALLET_FIAT_HINT_TODO).toBe('p4-page-wallet-fiat-hint');
    expect(P4_PAGE_WALLET_FIAT_HINT_PREREQUISITE_TODO).toBe('p4-fiat-money-display-hint');
  });

  it('allows PHON and USDT only — KRW ledger rows stay settlement-only', () => {
    expect(isWalletFiatHintEligibleCurrency('PHON')).toBe(true);
    expect(isWalletFiatHintEligibleCurrency('USDT')).toBe(true);
    expect(isWalletFiatHintEligibleCurrency('KRW')).toBe(false);
  });

  it('resolves KRW pair keys shared with deposit rate card', () => {
    expect(resolveWalletFiatHintPairKey('PHON', 'KRW')).toBe('PHON/KRW');
    expect(resolveWalletFiatHintPairKey('USDT', 'KRW')).toBe('USDT/KRW');
    expect(resolveWalletFiatHintPairKey('KRW', 'KRW')).toBeNull();
    expect(resolveWalletFiatHintPairKey('PHON', LOCALE_FIAT_OFF)).toBeNull();
  });

  it('builds secondary hint for PHON balance without changing settlement primary', () => {
    const hint = buildWalletFiatHint('10', 'PHON', 'KRW', { 'PHON/KRW': PHON_KRW_RATE });
    const expected = toFiatHint('10', 'PHON', 'KRW', {
      displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
      rate: '1450',
      capturedAt: '2026-07-06T10:00:00.000Z',
      source: 'exchange_rate_snapshots:PHON/KRW',
      stale: false,
    });

    expect(hint).toEqual(expected);
    expect(hint.formattedHint).toMatch(/^≈ ₩/);
  });

  it('disables hint for KRW ledger settlement rows (ledger-leak guard)', () => {
    const hint = buildWalletFiatHint('50000', 'KRW', 'KRW', { 'USDT/KRW': USDT_KRW_RATE });

    expect(hint.disabled).toBe(true);
    expect(hint.formattedHint).toBe('');
  });

  it('marks unavailable when shared rate is blocked', () => {
    const hint = buildWalletFiatHint('10', 'USDT', 'KRW', {
      'USDT/KRW': { ...USDT_KRW_RATE, unavailable: true },
    });

    expect(hint.formattedHint).toBe('—');
    expect(hint.stale).toBe(true);
  });
});
