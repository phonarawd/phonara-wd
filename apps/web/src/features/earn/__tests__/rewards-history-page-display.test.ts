import { describe, expect, it } from 'vitest';

import {
  hasActiveRewardsHistoryFilters,
  parseRewardsHistoryPageSearch,
  rewardsHistoryFiltersFromSearch,
} from '../rewards-history-page-display';

describe('rewards-history-page-display', () => {
  it('parses search params and omits default values', () => {
    expect(
      parseRewardsHistoryPageSearch({
        currency: 'PHON',
        period: '30d',
        page: '2',
      }),
    ).toEqual({
      currency: 'PHON',
      period: '30d',
      page: 2,
    });

    expect(parseRewardsHistoryPageSearch({ page: '1' })).toEqual({});
  });

  it('derives controller filters from search', () => {
    expect(rewardsHistoryFiltersFromSearch({ currency: 'PHON', page: 3 })).toEqual({
      currency: 'PHON',
      period: 'all',
      page: 3,
    });
  });

  it('detects active filters', () => {
    expect(hasActiveRewardsHistoryFilters({ currency: 'all', period: 'all' })).toBe(false);
    expect(hasActiveRewardsHistoryFilters({ currency: 'PHON', period: 'all' })).toBe(true);
    expect(hasActiveRewardsHistoryFilters({ currency: 'all', period: '7d' })).toBe(true);
  });
});
