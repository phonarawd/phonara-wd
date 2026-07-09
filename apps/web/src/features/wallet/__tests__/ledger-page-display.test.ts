import { describe, expect, it } from 'vitest';

import {
  hasActiveLedgerFilters,
  ledgerDirectionLabelKey,
  ledgerPageFiltersFromSearch,
  parseLedgerPageSearch,
  parseLedgerTypeFilter,
} from '../ledger-page-display';

describe('ledger-page-display', () => {
  it('maps legacy trade filter to bet category', () => {
    expect(parseLedgerTypeFilter('trade')).toBe('bet');
    expect(parseLedgerTypeFilter('deposit')).toBe('deposit');
    expect(parseLedgerTypeFilter('unknown')).toBe('all');
  });

  it('parses ledger search params and omits default values', () => {
    expect(
      parseLedgerPageSearch({
        filter: 'reward',
        currency: 'PHON',
        period: '30d',
        page: '2',
      }),
    ).toEqual({
      filter: 'reward',
      currency: 'PHON',
      period: '30d',
      page: 2,
    });

    expect(parseLedgerPageSearch({ filter: 'all', page: '1' })).toEqual({});
  });

  it('derives controller filters from search', () => {
    expect(ledgerPageFiltersFromSearch({ filter: 'bet', page: 3 })).toEqual({
      type: 'bet',
      currency: 'all',
      period: 'all',
      page: 3,
    });
  });

  it('detects active filters', () => {
    expect(hasActiveLedgerFilters({ type: 'all', currency: 'all', period: 'all' })).toBe(false);
    expect(hasActiveLedgerFilters({ type: 'deposit', currency: 'all', period: 'all' })).toBe(true);
  });

  it('maps ledger direction to i18n keys', () => {
    expect(ledgerDirectionLabelKey('credit')).toBe('ledger.direction.credit');
    expect(ledgerDirectionLabelKey('unknown')).toBe('ledger.direction.unknown');
  });
});
