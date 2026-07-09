// ─── PHONARA Trading Engine ──────────────────────────────────────────────────
// Pure, side-effect-free financial math for Spot, Futures and Staking.
// All settlement boundaries return canonical decimal strings via @phonara/money.
// Supabase Atomic RPCs mirror this logic in SQL.

export {
  TradingError,
  DEFAULT_FEES,
  type FeeSchedule,
  type MarginCurrency,
  type PositionSide,
  type TradingErrorCode,
} from './shared';

export {
  computeOpenPosition,
  computePnl,
  computeCloseSettlement,
  isLiquidatable,
  type OpenPositionParams,
  type ComputedPosition,
  type ClosePositionParams,
  type PositionSettlement,
} from './futures';

export {
  computeSpotBuy,
  computeSpotSell,
  computeMajorSpotBuy,
  DEFAULT_SPOT_FEE,
  computeSpotLimitBuyPreview,
  computeSpotLimitSellPreview,
  isSpotLimitCrossed,
  isSpotStopEntryTriggered,
  type SpotOrderSide,
  type SpotQuoteParams,
  type SpotBuyParams,
  type SpotSellParams,
  type SpotBuyResult,
  type SpotSellResult,
  type MajorSpotBuyParams,
  type MajorSpotBuyResult,
} from './spot';

export {
  estimateStakingReward,
  computeAccruedReward,
  canUnstake,
  DEFAULT_STAKING_TERMS,
  type StakingTerm,
  type StakingTermConfig,
  type RewardEstimateParams,
  type RewardEstimate,
} from './staking';

export {
  TIER1_LAUNCH_ASSETS,
  TRADING_MARKETS,
  SPOT_MARKETS,
  futuresSymbolForBase,
  spotSymbolForBase,
  type Tier1LaunchAsset,
  type TradingMarketSymbol,
  type SpotMarketSymbol,
} from './markets';

export { isStopTriggered } from './stop-trigger';
export { computeFundingPayment } from './funding';
