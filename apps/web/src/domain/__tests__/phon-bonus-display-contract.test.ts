import { describe, expect, it } from 'vitest';
import type { PhonBalanceBreakdown } from '../phon-balance';
import {
  resolvePhonBonusDisplayContract,
  resolvePhonTrackRawValues,
  resolveWageringRemainingDisplay,
} from '../phon-bonus-display-contract';

const breakdown: PhonBalanceBreakdown = {
  ok: true,
  phon_bonus_available: '2345.000000',
  phon_real_available: '10000.000000',
  phon_bonus_locked: '0.000000',
  phon_real_locked: '0.000000',
  phon_available: '12345.000000',
  phon_locked: '0.000000',
  wagering_remaining: '500.000000',
};

describe('phon-bonus-display-contract (E8)', () => {
  it('reads bonus/real/wagering from RPC fields only — never phon_available - bonus', () => {
    const raw = resolvePhonTrackRawValues(breakdown);
    expect(raw.phonBonusAvailable).toBe('2345.000000');
    expect(raw.phonRealAvailable).toBe('10000.000000');
    expect(raw.wageringRemaining).toBe('500.000000');

    const mismatchedTotal = resolvePhonTrackRawValues({
      ...breakdown,
      phon_available: '50000.000000',
      phon_real_available: '10000.000000',
    });
    expect(mismatchedTotal.phonRealAvailable).toBe('10000.000000');
    expect(mismatchedTotal.phonRealAvailable).not.toBe('47655.000000');
  });

  it('falls back wallet track columns before legacy phon_available (real-only)', () => {
    const raw = resolvePhonTrackRawValues(null, {
      walletPhonBonusAvailable: '100.000000',
      walletPhonRealAvailable: '200.000000',
      walletPhonAvailable: '999.000000',
    });
    expect(raw.phonBonusAvailable).toBe('100.000000');
    expect(raw.phonRealAvailable).toBe('200.000000');
  });

  it('maps legacy phon_available to real when track columns missing', () => {
    const raw = resolvePhonTrackRawValues(null, {
      walletPhonAvailable: '7500.000000',
    });
    expect(raw.phonRealAvailable).toBe('7500.000000');
    expect(raw.phonBonusAvailable).toBe('0');
  });

  it('hides wagering display when remaining <= 0', () => {
    expect(resolveWageringRemainingDisplay('0.000000')).toBeNull();
    expect(resolveWageringRemainingDisplay('-1.000000')).toBeNull();
    expect(resolveWageringRemainingDisplay('500.000000')).toBe('500');
  });

  it('formats wallet displays with currency suffix when requested', () => {
    const contract = resolvePhonBonusDisplayContract({
      breakdown,
      showCurrency: true,
    });
    expect(contract.phonBonusAvailableDisplay).toBe('2,345 PHON');
    expect(contract.phonRealAvailableDisplay).toBe('10,000 PHON');
    expect(contract.wageringRemainingDisplay).toBe('500 PHON');
  });

  it('returns null sports displays until breakdown RPC resolves', () => {
    const contract = resolvePhonBonusDisplayContract({
      breakdown: null,
      nullWhenMissingBreakdown: true,
    });
    expect(contract.phonBonusAvailableDisplay).toBeNull();
    expect(contract.phonRealAvailableDisplay).toBeNull();
    expect(contract.wageringRemainingDisplay).toBeNull();
  });

  it('applies visual fixture overrides without mutating raw RPC values', () => {
    const contract = resolvePhonBonusDisplayContract({
      breakdown,
      fixture: {
        phonBonusAvailableDisplay: '2,345 PHON',
        phonRealAvailableDisplay: '10,000 PHON',
        wageringRemainingDisplay: '500 PHON',
      },
    });
    expect(contract.phonBonusAvailableDisplay).toBe('2,345 PHON');
    expect(contract.raw.phonBonusAvailable).toBe('2345.000000');
  });
});
