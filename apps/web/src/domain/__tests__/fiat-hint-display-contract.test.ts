import { describe, expect, it } from 'vitest';

import {
  assertFiatHintDisplayContractSync,
  FIAT_HINT_DISPLAY_DECIMALS,
  FIAT_HINT_I18N_KEYS,
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  formatFiatHintAmount,
  isFiatHintTargetActive,
  LOCALE_FIAT_MAP,
  LOCALE_FIAT_OFF,
  P4_FIAT_HINT_DISPLAY_CONTRACT_TODO,
  P4_FIAT_HINT_DISPLAY_PREREQUISITE_TODO,
  P4_FIAT_REFERENCE_RATES_HOOK_TODO,
  P5_PAGE_SETTINGS_FIAT_REFERENCE_PREREQUISITE_TODO,
  P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO,
  resolveLocaleTargetFiat,
  toFiatHint,
} from '../fiat-reference-display-contract';

const SAMPLE_SNAPSHOT = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1450',
  capturedAt: '2026-07-06T10:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
} as const;

describe('fiat-hint-display-contract §13.1.4.3 Fiat#4', () => {
  it('registers Fiat#4 todo with Fiat#3 prerequisite', () => {
    expect(P4_FIAT_HINT_DISPLAY_CONTRACT_TODO).toBe('p4-fiat-hint-display-contract');
    expect(P4_FIAT_HINT_DISPLAY_PREREQUISITE_TODO).toBe(P4_FIAT_REFERENCE_RATES_HOOK_TODO);
    expect(P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO).toBe('p5-page-settings-fiat-reference');
    expect(P5_PAGE_SETTINGS_FIAT_REFERENCE_PREREQUISITE_TODO).toBe(
      P4_FIAT_HINT_DISPLAY_CONTRACT_TODO,
    );
  });

  it('maps ko→KRW · en→OFF · ja→JPY slot', () => {
    expect(LOCALE_FIAT_MAP['ko']).toBe('KRW');
    expect(LOCALE_FIAT_MAP['en']).toBe(LOCALE_FIAT_OFF);
    expect(LOCALE_FIAT_MAP['ja']).toBe('JPY');
    expect(resolveLocaleTargetFiat('ko-KR')).toBe('KRW');
    expect(resolveLocaleTargetFiat('en-US')).toBe(LOCALE_FIAT_OFF);
    expect(resolveLocaleTargetFiat('ja-JP')).toBe('JPY');
    expect(resolveLocaleTargetFiat('fr-FR')).toBe(LOCALE_FIAT_OFF);
  });

  it('respects hintEnabled toggle before locale map', () => {
    expect(resolveLocaleTargetFiat('ko', false)).toBe(LOCALE_FIAT_OFF);
    expect(resolveLocaleTargetFiat('en', true)).toBe(LOCALE_FIAT_OFF);
  });

  it('anchors trade.fiatHint.* i18n keys', () => {
    expect(FIAT_HINT_I18N_KEYS.asOf).toBe('trade.fiatHint.asOf');
    expect(FIAT_HINT_I18N_KEYS.disclaimer).toBe('trade.fiatHint.disclaimer');
    expect(FIAT_HINT_I18N_KEYS.staleBadge).toBe('trade.fiatHint.staleBadge');
    expect(FIAT_HINT_I18N_KEYS.unavailable).toBe('trade.fiatHint.unavailable');
  });

  it('formats KRW hint amounts with won symbol and grouping', () => {
    expect(formatFiatHintAmount('14500', 'KRW')).toBe('₩14,500');
    expect(FIAT_HINT_DISPLAY_DECIMALS.KRW).toBe(0);
  });

  it('converts settlement amount to fiat hint via rate snapshot', () => {
    const hint = toFiatHint('10', 'USDT', 'KRW', SAMPLE_SNAPSHOT);
    expect(hint.displayOnly).toBe(true);
    expect(hint.disabled).toBe(false);
    expect(hint.formattedHint).toBe('≈ ₩14,500');
    expect(hint.targetFiat).toBe('KRW');
    expect(hint.asOf).toBe(SAMPLE_SNAPSHOT.capturedAt);
    expect(hint.stale).toBe(false);
    expect(hint.sourceCurrency).toBe('USDT');
  });

  it('returns disabled view when target fiat is OFF', () => {
    const hint = toFiatHint('10', 'USDT', LOCALE_FIAT_OFF, SAMPLE_SNAPSHOT);
    expect(hint.disabled).toBe(true);
    expect(hint.formattedHint).toBe('');
    expect(isFiatHintTargetActive(LOCALE_FIAT_OFF)).toBe(false);
    expect(isFiatHintTargetActive('KRW')).toBe(true);
  });

  it('shows em dash when rate snapshot is missing or stale-unavailable', () => {
    expect(toFiatHint('10', 'USDT', 'KRW', null).formattedHint).toBe('—');
    expect(toFiatHint('10', 'USDT', 'KRW', { ...SAMPLE_SNAPSHOT, rate: '0' }).formattedHint).toBe(
      '—',
    );
    const staleHint = toFiatHint('10', 'USDT', 'KRW', { ...SAMPLE_SNAPSHOT, stale: true });
    expect(staleHint.stale).toBe(true);
    expect(staleHint.formattedHint).toBe('≈ ₩14,500');
  });

  it('assertFiatHintDisplayContractSync stays green', () => {
    expect(() => assertFiatHintDisplayContractSync()).not.toThrow();
  });
});
