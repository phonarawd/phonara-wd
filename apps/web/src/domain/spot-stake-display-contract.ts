/**
 * §13.1.1 — Spot stake_currency per pair (buy=quote · sell=base qty · engine rule).
 * Display-only helpers — authoritative settlement remains SQL/RPC.
 */

export type SpotStakeSide = 'buy' | 'sell';

export type SpotPairParts = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
};

export type SpotWalletBalances = {
  phonAvail: string;
  usdtAvail: string;
};

export const P9_TRADE_SPOT_PAIR_WIRE_TODO = 'p9-trade-spot-pair-wire' as const;

export function parseSpotPairSymbol(symbol: string): SpotPairParts {
  const [baseAsset = 'PHON', quoteAsset = 'USDT'] = symbol.split('_');
  return { symbol, baseAsset, quoteAsset };
}

/** Buy spends quote on *_USDT pairs; PHON_USDT engine rejects non-USDT buy stake. */
export function resolveSpotBuyStakeCurrency(symbol: string): 'USDT' | 'PHON' {
  const { baseAsset, quoteAsset } = parseSpotPairSymbol(symbol);
  if (baseAsset === 'PHON' && quoteAsset === 'USDT') {
    return 'USDT';
  }
  return quoteAsset === 'USDT' ? 'USDT' : 'USDT';
}

/** Sell input is base qty; RPC stake_currency is receive currency (quote default). */
export function resolveSpotSellReceiveCurrency(symbol: string): 'USDT' | 'PHON' {
  const { baseAsset, quoteAsset } = parseSpotPairSymbol(symbol);
  if (baseAsset === 'PHON' && quoteAsset === 'USDT') {
    return 'USDT';
  }
  return quoteAsset === 'USDT' ? 'USDT' : 'USDT';
}

export function resolveSpotSellAmountAsset(symbol: string): string {
  return parseSpotPairSymbol(symbol).baseAsset;
}

/** Major *_USDT pairs allow PHON buy stake; PHON_USDT is USDT-only per engine. */
export function canSelectSpotPhonBuyStake(symbol: string): boolean {
  const { baseAsset, quoteAsset } = parseSpotPairSymbol(symbol);
  return quoteAsset === 'USDT' && !(baseAsset === 'PHON' && quoteAsset === 'USDT');
}

export function resolveSpotAvailableBalance(
  side: SpotStakeSide,
  symbol: string,
  wallet: SpotWalletBalances,
  baseHoldingQty: string,
  buyStakeCurrencyOverride?: 'USDT' | 'PHON',
): { amount: string; currency: string } {
  const { baseAsset } = parseSpotPairSymbol(symbol);
  if (side === 'buy') {
    const stakeCurrency = buyStakeCurrencyOverride ?? resolveSpotBuyStakeCurrency(symbol);
    return {
      amount: stakeCurrency === 'USDT' ? wallet.usdtAvail : wallet.phonAvail,
      currency: stakeCurrency,
    };
  }
  if (baseAsset === 'PHON') {
    return { amount: wallet.phonAvail, currency: baseAsset };
  }
  return { amount: baseHoldingQty, currency: baseAsset };
}

export function resolveSpotBuyReceiveAsset(symbol: string): string {
  return parseSpotPairSymbol(symbol).baseAsset;
}

/** Minimal open-order row shape for spot-desk whitelist filtering (display-only). */
export type SpotDeskOpenOrderRow = {
  market: string;
};

/**
 * Spot desk open orders — whitelist by known spot symbols only (§12.19 · A1).
 * Suffix blacklist is forbidden: futures symbols are disjoint from spot_markets catalog.
 */
export function filterSpotDeskOpenOrders<T extends SpotDeskOpenOrderRow>(
  orders: readonly T[],
  spotSymbols: ReadonlySet<string>,
): T[] {
  return orders.filter((order) => spotSymbols.has(order.market));
}

export function readSpotTradeReceivedAmount(
  side: SpotStakeSide,
  symbol: string,
  result: Record<string, unknown>,
): { amount: string; currency: string } {
  const { baseAsset, quoteAsset } = parseSpotPairSymbol(symbol);
  if (side === 'buy') {
    const amount = String(
      result['base_received'] ?? result['phon_received'] ?? result['net_phon'] ?? '0',
    );
    return { amount, currency: baseAsset };
  }
  const receiveCurrency = resolveSpotSellReceiveCurrency(symbol);
  const amount = String(
    result['stake_received'] ??
      result['usdt_received'] ??
      (receiveCurrency === 'USDT' ? result['net_usdt'] : result['net_phon']) ??
      '0',
  );
  return { amount, currency: receiveCurrency === 'USDT' ? quoteAsset : receiveCurrency };
}
