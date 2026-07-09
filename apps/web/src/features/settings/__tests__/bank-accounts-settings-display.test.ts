import { describe, expect, it } from 'vitest';

import {
  bankAccountGateKey,
  formatBankAccountCooldownUntil,
  isBankAccountCooldownActive,
  maskBankAccountNumber,
  normalizeSettingsBankAccountInput,
} from '@/features/settings/bank-accounts-settings-display';

describe('bank-accounts-settings-display', () => {
  it('normalizes bank account input to digits only', () => {
    expect(normalizeSettingsBankAccountInput('110-1234-5678')).toBe('11012345678');
  });

  it('gates short bank account numbers', () => {
    expect(bankAccountGateKey('12345')).toBe('wallet.withdraw.gate.bankFields');
    expect(bankAccountGateKey('110123456789')).toBeNull();
  });

  it('masks account numbers for display', () => {
    expect(maskBankAccountNumber('110123456789')).toBe('•••• 6789');
  });

  it('detects active cooldown windows', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isBankAccountCooldownActive(future)).toBe(true);
    expect(isBankAccountCooldownActive(past)).toBe(false);
  });

  it('formats cooldown timestamps for locale', () => {
    const formatted = formatBankAccountCooldownUntil('2026-07-05T05:00:00.000Z', 'ko');
    expect(formatted).toBeTruthy();
  });
});
