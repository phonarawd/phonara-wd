import { describe, expect, it } from 'vitest';
import {
  LEDGER_PAGE_SIZE,
  clampLedgerPage,
  filterLedgerRows,
  ledgerEntryCategory,
  ledgerPageCount,
  paginateLedgerRows,
} from '../ledger-entry-filters';
import type { LedgerRowView } from '../ledger-entry-filters';

const sampleRow = (overrides: Partial<LedgerRowView> = {}): LedgerRowView => ({
  id: 'row-1',
  createdAt: '2026-06-29T12:00:00.000Z',
  reasonCode: 'crypto_deposit_credit',
  amount: '100.00000000',
  currency: 'USDT',
  direction: 'credit',
  availableAfter: '100.00000000',
  seq: 1,
  relatedEntityId: null,
  rateSnapshotId: null,
  ...overrides,
});

describe('ledger-entry-filters', () => {
  it('maps reason codes to filter categories', () => {
    expect(ledgerEntryCategory('krw_deposit_credit', 'credit')).toBe('deposit');
    expect(ledgerEntryCategory('withdrawal_request_lock', 'lock')).toBe('withdraw');
    expect(ledgerEntryCategory('game_bet_lock', 'lock')).toBe('bet');
    expect(ledgerEntryCategory('staking_reward', 'credit')).toBe('reward');
  });

  it('filters rows by type, currency, and period', () => {
    const nowMs = new Date('2026-07-01T00:00:00.000Z').getTime();
    const rows = [
      sampleRow({ id: 'a', reasonCode: 'krw_deposit_credit', currency: 'PHON' }),
      sampleRow({
        id: 'b',
        reasonCode: 'game_bet_lock',
        direction: 'lock',
        currency: 'PHON',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
      sampleRow({ id: 'c', reasonCode: 'crypto_deposit_credit', currency: 'USDT' }),
    ];

    expect(
      filterLedgerRows(rows, { type: 'deposit', currency: 'all', period: 'all' }, nowMs),
    ).toHaveLength(2);
    expect(
      filterLedgerRows(rows, { type: 'all', currency: 'USDT', period: 'all' }, nowMs),
    ).toHaveLength(1);
    expect(
      filterLedgerRows(rows, { type: 'all', currency: 'all', period: '7d' }, nowMs),
    ).toHaveLength(2);
  });

  it('paginates and clamps page indices', () => {
    const rows = Array.from({ length: 25 }, (_, index) => sampleRow({ id: `row-${index}` }));
    expect(ledgerPageCount(rows.length, LEDGER_PAGE_SIZE)).toBe(2);
    expect(paginateLedgerRows(rows, 2, LEDGER_PAGE_SIZE)).toHaveLength(5);
    expect(clampLedgerPage(99, 2)).toBe(2);
    expect(clampLedgerPage(0, 2)).toBe(1);
  });
});
