/**
 * Trade desk market-data fetch error banner (P0-1 · Silent → Visible).
 * Covers prices · futures markets · spot markets controller errors.
 */

export const TRADE_DESK_FETCH_ERROR_BANNER_COMPONENT = 'trade-desk-fetch-error-banner.tsx' as const;

export const TRADE_DESK_FETCH_ERROR_TEST_ID = 'trade-desk-fetch-error' as const;

export const TRADE_DESK_FETCH_ERROR_MESSAGE_KEY = 'trade.dataStatus.errorDescription' as const;

export type TradeDeskFetchErrorInput = {
  pricesError: boolean;
  marketsError: boolean;
  spotMarketsError: boolean;
};

export function resolveTradeDeskFetchErrorVisible(input: TradeDeskFetchErrorInput): boolean {
  return input.pricesError || input.marketsError || input.spotMarketsError;
}

export function assertTradeDeskFetchErrorDisplayContractSync(): void {
  if (
    !resolveTradeDeskFetchErrorVisible({
      pricesError: true,
      marketsError: false,
      spotMarketsError: false,
    })
  ) {
    throw new Error('trade-desk-fetch-error: pricesError must surface banner');
  }
  if (
    !resolveTradeDeskFetchErrorVisible({
      pricesError: false,
      marketsError: true,
      spotMarketsError: false,
    })
  ) {
    throw new Error('trade-desk-fetch-error: marketsError must surface banner');
  }
  if (
    !resolveTradeDeskFetchErrorVisible({
      pricesError: false,
      marketsError: false,
      spotMarketsError: true,
    })
  ) {
    throw new Error('trade-desk-fetch-error: spotMarketsError must surface banner');
  }
  if (
    resolveTradeDeskFetchErrorVisible({
      pricesError: false,
      marketsError: false,
      spotMarketsError: false,
    })
  ) {
    throw new Error('trade-desk-fetch-error: all-clear must hide banner');
  }
}
