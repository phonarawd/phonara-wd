import { toFixed } from '@phonara/money';
import { type Decimal, dec, fmt6, assertPositive, TradingError } from './shared';

// ─── Spot market: PHON/USDT ──────────────────────────────────────────────────
// Convention: price = USDT per 1 PHON.
// Buy:  spend USDT  → receive PHON
// Sell: spend PHON  → receive USDT
// Fee is charged on the OUTPUT asset.

export interface SpotQuoteParams {
  /** USDT per 1 PHON */
  readonly price: string;
  /** fee rate on output, decimal string e.g. "0.001" = 0.1% */
  readonly feeRate: string;
}

export interface SpotBuyParams extends SpotQuoteParams {
  /** USDT the user spends */
  readonly usdtSpent: string;
}

export interface SpotSellParams extends SpotQuoteParams {
  /** PHON the user sells */
  readonly phonSold: string;
}

export interface SpotBuyResult {
  readonly usdtSpent: string;
  readonly price: string;
  /** PHON before fee */
  readonly grossPhon: string;
  /** fee in PHON */
  readonly feePhon: string;
  /** PHON credited to wallet after fee */
  readonly netPhon: string;
}

export interface SpotSellResult {
  readonly phonSold: string;
  readonly price: string;
  /** USDT before fee */
  readonly grossUsdt: string;
  /** fee in USDT */
  readonly feeUsdt: string;
  /** USDT credited to wallet after fee */
  readonly netUsdt: string;
}

const DEFAULT_SPOT_FEE = '0.001';

function validate(price: Decimal, feeRate: Decimal): void {
  assertPositive(price, 'price', 'INVALID_PRICE');
  if (feeRate.isNegative() || feeRate.greaterThanOrEqualTo(1)) {
    throw new TradingError('feeRate must be in [0, 1)', 'INVALID_AMOUNT');
  }
}

/** Market buy: spend USDT, receive PHON (fee deducted from PHON). */
export function computeSpotBuy(params: SpotBuyParams): SpotBuyResult {
  const price = dec(params.price, 'price');
  const feeRate = dec(params.feeRate || DEFAULT_SPOT_FEE, 'feeRate');
  const usdt = dec(params.usdtSpent, 'usdtSpent');
  assertPositive(usdt, 'usdtSpent', 'INVALID_AMOUNT');
  validate(price, feeRate);

  const grossPhon = usdt.div(price);
  const feePhon = grossPhon.mul(feeRate);
  const netPhon = grossPhon.minus(feePhon);

  return {
    usdtSpent: toFixed(usdt, 'USDT'),
    price: price.toFixed(),
    grossPhon: toFixed(grossPhon, 'PHON'),
    feePhon: toFixed(feePhon, 'PHON'),
    netPhon: toFixed(netPhon, 'PHON'),
  };
}

/** Market sell: spend PHON, receive USDT (fee deducted from USDT). */
export function computeSpotSell(params: SpotSellParams): SpotSellResult {
  const price = dec(params.price, 'price');
  const feeRate = dec(params.feeRate || DEFAULT_SPOT_FEE, 'feeRate');
  const phon = dec(params.phonSold, 'phonSold');
  assertPositive(phon, 'phonSold', 'INVALID_AMOUNT');
  validate(price, feeRate);

  const grossUsdt = phon.mul(price);
  const feeUsdt = grossUsdt.mul(feeRate);
  const netUsdt = grossUsdt.minus(feeUsdt);

  return {
    phonSold: toFixed(phon, 'PHON'),
    price: price.toFixed(),
    grossUsdt: toFixed(grossUsdt, 'USDT'),
    feeUsdt: toFixed(feeUsdt, 'USDT'),
    netUsdt: toFixed(netUsdt, 'USDT'),
  };
}

/**
 * Tier-1 major spot buy preview: spend stake currency, receive base asset qty.
 * Fee is deducted from the base asset received (same convention as computeSpotBuy).
 * Preview-only — authoritative settlement remains SQL/RPC.
 */
export interface MajorSpotBuyParams extends SpotQuoteParams {
  readonly stakeCurrency: 'USDT' | 'PHON';
  readonly stakeAmount: string;
  /** USDT per 1 PHON when stakeCurrency is PHON */
  readonly phonUsdtPrice?: string;
}

export interface MajorSpotBuyResult {
  readonly stakeCurrency: 'USDT' | 'PHON';
  readonly stakeSpent: string;
  readonly price: string;
  readonly grossBase: string;
  readonly feeBase: string;
  readonly netBase: string;
}

export function computeMajorSpotBuy(params: MajorSpotBuyParams): MajorSpotBuyResult {
  const price = dec(params.price, 'price');
  const feeRate = dec(params.feeRate || DEFAULT_SPOT_FEE, 'feeRate');
  const stake = dec(params.stakeAmount, 'stakeAmount');
  assertPositive(stake, 'stakeAmount', 'INVALID_AMOUNT');
  validate(price, feeRate);

  const usdtSpent =
    params.stakeCurrency === 'USDT'
      ? stake
      : stake.mul(dec(params.phonUsdtPrice ?? '0', 'phonUsdtPrice'));

  const grossBase = usdtSpent.div(price);
  const feeBase = grossBase.mul(feeRate);
  const netBase = grossBase.minus(feeBase);

  return {
    stakeCurrency: params.stakeCurrency,
    stakeSpent: toFixed(stake, params.stakeCurrency),
    price: fmt6(price),
    grossBase: fmt6(grossBase),
    feeBase: fmt6(feeBase),
    netBase: fmt6(netBase),
  };
}

export { DEFAULT_SPOT_FEE };

export type SpotOrderSide = 'buy' | 'sell';

/** Limit buy preview at a fixed limit price (stake USDT → base received). */
export function computeSpotLimitBuyPreview(params: SpotBuyParams): SpotBuyResult {
  return computeSpotBuy(params);
}

/** Limit sell preview at a fixed limit price (base sold → USDT received). */
export function computeSpotLimitSellPreview(params: SpotSellParams): SpotSellResult {
  return computeSpotSell(params);
}

/** Mirrors `_spot_order_limit_crossed` in SQL (buy ≤ limit · sell ≥ limit). */
export function isSpotLimitCrossed(
  side: SpotOrderSide,
  markPrice: string,
  limitPrice: string,
): boolean {
  const mark = dec(markPrice, 'markPrice');
  const limit = dec(limitPrice, 'limitPrice');
  if (side === 'buy') return mark.lessThanOrEqualTo(limit);
  return mark.greaterThanOrEqualTo(limit);
}

/** Mirrors `_spot_order_stop_entry_triggered` in SQL (buy ≥ stop · sell ≤ stop). */
export function isSpotStopEntryTriggered(
  side: SpotOrderSide,
  markPrice: string,
  stopPrice: string,
): boolean {
  const mark = dec(markPrice, 'markPrice');
  const stop = dec(stopPrice, 'stopPrice');
  if (side === 'buy') return mark.greaterThanOrEqualTo(stop);
  return mark.lessThanOrEqualTo(stop);
}
