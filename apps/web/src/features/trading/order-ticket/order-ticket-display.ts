import { computeMajorSpotBuy, computeSpotBuy, computeSpotSell } from '@phonara/trading-engine';

import { parseSpotPairSymbol } from '@/domain/spot-stake-display-contract';
import { isPositiveAmount } from '@/lib/money-display';

import {
  BALANCE_PERCENT_PRESETS,
  computeActiveBalancePercent,
  type BalancePercentPreset,
} from './apply-balance-percent';

export { BALANCE_PERCENT_PRESETS, type BalancePercentPreset };

export type SpotTicketEstimates = {
  netReceive: string;
  receiveCurrency: string;
  estFee: string;
  feeCurrency: string;
};

export type SpotTicketEstimateInput = {
  side: 'buy' | 'sell';
  /** Market symbol e.g. PHON_USDT · BTC_USDT */
  symbol: string;
  price: string;
  amount: string;
  feeRate: string;
  buyStakeCurrency?: 'USDT' | 'PHON';
  /** PHON/USDT mark when buying majors with PHON stake */
  phonUsdtPrice?: string;
};

function isPhonUsdtPair(symbol: string): boolean {
  const { baseAsset, quoteAsset } = parseSpotPairSymbol(symbol);
  return baseAsset === 'PHON' && quoteAsset === 'USDT';
}

/** Spot ticket preview — engine formulas only (display · §22.2.4 · P2-1 market-aware). */
export function resolveSpotTicketEstimates(
  input: SpotTicketEstimateInput,
): SpotTicketEstimates | null {
  const { side, symbol, price, amount, feeRate, buyStakeCurrency = 'USDT', phonUsdtPrice } = input;

  try {
    if (!isPositiveAmount(price) || !isPositiveAmount(amount)) return null;

    const { baseAsset } = parseSpotPairSymbol(symbol);

    if (side === 'buy') {
      if (buyStakeCurrency === 'PHON' && !isPhonUsdtPair(symbol)) {
        const result = computeMajorSpotBuy({
          price,
          feeRate,
          stakeCurrency: 'PHON',
          stakeAmount: amount,
          phonUsdtPrice,
        });
        return {
          netReceive: result.netBase,
          receiveCurrency: baseAsset,
          estFee: result.feeBase,
          feeCurrency: baseAsset,
        };
      }

      const result = computeSpotBuy({ price, feeRate, usdtSpent: amount });
      return {
        netReceive: result.netPhon,
        receiveCurrency: isPhonUsdtPair(symbol) ? 'PHON' : baseAsset,
        estFee: result.feePhon,
        feeCurrency: isPhonUsdtPair(symbol) ? 'PHON' : baseAsset,
      };
    }

    const result = computeSpotSell({ price, feeRate, phonSold: amount });
    return {
      netReceive: result.netUsdt,
      receiveCurrency: 'USDT',
      estFee: result.feeUsdt,
      feeCurrency: 'USDT',
    };
  } catch {
    return null;
  }
}

export function isBalancePercentPresetActive(
  avail: string,
  amount: string,
  preset: BalancePercentPreset,
): boolean {
  return computeActiveBalancePercent(avail, amount) === preset;
}
