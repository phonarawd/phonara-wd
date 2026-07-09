import { describe, expect, it } from 'vitest';

import {
  assertTradeDeskFetchErrorDisplayContractSync,
  resolveTradeDeskFetchErrorVisible,
  TRADE_DESK_FETCH_ERROR_BANNER_COMPONENT,
  TRADE_DESK_FETCH_ERROR_MESSAGE_KEY,
  TRADE_DESK_FETCH_ERROR_TEST_ID,
} from '../trade-desk-fetch-error-display-contract';

describe('trade-desk-fetch-error-display-contract P0-1', () => {
  it('exports stable banner identifiers', () => {
    expect(TRADE_DESK_FETCH_ERROR_TEST_ID).toBe('trade-desk-fetch-error');
    expect(TRADE_DESK_FETCH_ERROR_BANNER_COMPONENT).toContain('trade-desk-fetch-error-banner');
    expect(TRADE_DESK_FETCH_ERROR_MESSAGE_KEY).toBe('trade.dataStatus.errorDescription');
  });

  it('surfaces banner when any market-data fetch error is set', () => {
    expect(
      resolveTradeDeskFetchErrorVisible({
        pricesError: true,
        marketsError: false,
        spotMarketsError: false,
      }),
    ).toBe(true);
    expect(
      resolveTradeDeskFetchErrorVisible({
        pricesError: false,
        marketsError: true,
        spotMarketsError: false,
      }),
    ).toBe(true);
    expect(
      resolveTradeDeskFetchErrorVisible({
        pricesError: false,
        marketsError: false,
        spotMarketsError: true,
      }),
    ).toBe(true);
    expect(
      resolveTradeDeskFetchErrorVisible({
        pricesError: false,
        marketsError: false,
        spotMarketsError: false,
      }),
    ).toBe(false);
  });

  it('assertTradeDeskFetchErrorDisplayContractSync passes', () => {
    expect(() => assertTradeDeskFetchErrorDisplayContractSync()).not.toThrow();
  });
});
