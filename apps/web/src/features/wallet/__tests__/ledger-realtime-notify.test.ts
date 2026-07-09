import { describe, expect, it } from 'vitest';
import {
  isLedgerCreditDirection,
  ledgerEntryMoneyLine,
  ledgerEntryNotificationId,
  markLedgerEntrySeen,
  resetLedgerEntryIds,
  shouldEmitLedgerEntryNotify,
} from '../ledger-realtime-notify';

describe('ledger-realtime-notify', () => {
  it('dedupes ledger entry notifications', () => {
    resetLedgerEntryIds();
    expect(shouldEmitLedgerEntryNotify('entry-1')).toBe(true);
    markLedgerEntrySeen('entry-1');
    expect(shouldEmitLedgerEntryNotify('entry-1')).toBe(false);
    expect(ledgerEntryNotificationId('entry-1')).toBe('ledger:entry-1:posted');
  });

  it('detects credit directions and formats money lines without client math', () => {
    expect(isLedgerCreditDirection('credit')).toBe(true);
    expect(isLedgerCreditDirection('unlock')).toBe(true);
    expect(isLedgerCreditDirection('debit')).toBe(false);
    expect(ledgerEntryMoneyLine({ amount: '10.00000000', currency: 'PHON' })).toBe(
      '10.00000000 PHON',
    );
  });
});
