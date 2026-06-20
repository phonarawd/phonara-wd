/** Maps platform market keys → external display pair (never used for order routing). */
export function resolveExchangePair(marketSymbol: string): string | null {
  if (marketSymbol === 'PHONUSDT-PERP' || marketSymbol.startsWith('PHON')) return null;
  if (marketSymbol.endsWith('USDT-SIM')) {
    return `${marketSymbol.replace('USDT-SIM', '')}USDT`;
  }
  if (marketSymbol.endsWith('_USDT')) {
    return marketSymbol.replace('_', '');
  }
  return null;
}

export function stakingReferenceChartSymbol(referenceAsset: string): string {
  if (referenceAsset === 'PHON') return 'PHONUSDT-PERP';
  return `${referenceAsset}USDT-SIM`;
}
