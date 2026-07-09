/**
 * @phonara/sportsbook-engine — preview/validation only.
 *
 * Authoritative sportsbook settlement, grading, void/cancel, and ledger paths are
 * Supabase RPC (`rpc_place_sports_bet`, `rpc_settle_sports_fixture*`, `rpc_void_sports_*`).
 * Do not use this package for balance mutations or settlement decisions.
 */
export { SPORTS_MARKET_TYPES, parseTotalsLine } from './market-types';
export type { RegisteredMarketType, SportsBetKind } from './market-types';
export { MAX_COMBO_LEGS } from './constants';
export { SportsbookComboError, productComboOdds, productComboOddsFromLegs } from './combo-odds';
export { previewComboPayout, previewSinglePayout } from './payout-preview';
export { validateBetLegs } from './validate-legs';
export type {
  BetLegInput,
  FixturePayload,
  FixtureStatus,
  IngestMessage,
  MarketPayload,
  MarketType,
  OutcomePayload,
  Selection,
} from './types';
