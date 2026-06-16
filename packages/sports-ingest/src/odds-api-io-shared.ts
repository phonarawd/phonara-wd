import type { VendorMarketRow, VendorOutcomeRow } from './normalizer';
import type { OddsApiIoMarket } from './odds-api-io';

export function mapIoMarketKey(name: string, line?: number): string | null {
  const normalized = name.trim().toLowerCase();
  if (normalized === 'ml' || normalized === 'moneyline' || normalized === '1x2') {
    return 'match_1x2';
  }
  if (normalized === 'over/under' || normalized === 'totals' || normalized === 'total') {
    if (line === 2.5) return 'totals_2_5';
    if (line !== undefined) return `totals_${String(line).replace('.', '_')}`;
    return 'totals';
  }
  return null;
}

export function buildMarketsFromIo(ioMarkets: readonly OddsApiIoMarket[]): {
  vendorMarkets: VendorMarketRow[];
} {
  const vendorMarkets: VendorMarketRow[] = [];

  for (const market of ioMarkets) {
    const firstOdds = market.odds[0];
    if (!firstOdds) continue;

    const line = firstOdds.hdp ?? firstOdds.max;
    const marketKey = mapIoMarketKey(market.name, line);
    if (!marketKey) continue;

    const outcomes: VendorOutcomeRow[] = [];

    if (marketKey === 'match_1x2') {
      if (firstOdds.home) outcomes.push({ id: 'home', name: 'Home', price: firstOdds.home });
      if (firstOdds.draw) outcomes.push({ id: 'draw', name: 'Draw', price: firstOdds.draw });
      if (firstOdds.away) outcomes.push({ id: 'away', name: 'Away', price: firstOdds.away });
    } else if (marketKey.startsWith('totals')) {
      const totalsLine = line ?? 2.5;
      if (firstOdds.over) {
        outcomes.push({ id: 'over', name: 'Over', price: firstOdds.over, point: totalsLine });
      }
      if (firstOdds.under) {
        outcomes.push({ id: 'under', name: 'Under', price: firstOdds.under, point: totalsLine });
      }
    }

    if (outcomes.length === 0) continue;
    vendorMarkets.push({ key: marketKey, outcomes });
  }

  return { vendorMarkets };
}
