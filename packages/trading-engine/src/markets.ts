export const TIER1_LAUNCH_ASSETS = [
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'XRP',
  'ADA',
  'DOGE',
  'AVAX',
  'LINK',
  'DOT',
  'MATIC',
  'LTC',
  'UNI',
  'ATOM',
  'NEAR',
  'APT',
  'ARB',
  'OP',
  'INJ',
  'SUI',
] as const;

export type Tier1LaunchAsset = (typeof TIER1_LAUNCH_ASSETS)[number];

export function futuresSymbolForBase(base: string): string {
  return `${base}USDT-SIM`;
}

export function spotSymbolForBase(base: string): string {
  return `${base}_USDT`;
}

export const TRADING_MARKETS = [
  'PHONUSDT-PERP',
  ...TIER1_LAUNCH_ASSETS.map((base) => futuresSymbolForBase(base)),
] as const;

export type TradingMarketSymbol = (typeof TRADING_MARKETS)[number];

export const SPOT_MARKETS = [
  'PHON_USDT',
  ...TIER1_LAUNCH_ASSETS.map((base) => spotSymbolForBase(base)),
] as const;

export type SpotMarketSymbol = (typeof SPOT_MARKETS)[number];
