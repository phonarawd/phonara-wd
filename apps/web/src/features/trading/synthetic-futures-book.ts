/** Display-only synthetic futures order book rows — not engine oracle prices. */
export type SyntheticBookRow = { priceDisplay: string; sizeDisplay: string };

export const SYNTHETIC_FUTURES_ASK_ROWS: readonly SyntheticBookRow[] = [
  { priceDisplay: '63549.2', sizeDisplay: '0.100' },
  { priceDisplay: '63549.7', sizeDisplay: '0.150' },
  { priceDisplay: '63550.2', sizeDisplay: '0.200' },
  { priceDisplay: '63550.7', sizeDisplay: '0.250' },
  { priceDisplay: '63551.2', sizeDisplay: '0.300' },
  { priceDisplay: '63551.7', sizeDisplay: '0.350' },
  { priceDisplay: '63552.2', sizeDisplay: '0.400' },
  { priceDisplay: '63552.7', sizeDisplay: '0.450' },
  { priceDisplay: '63553.2', sizeDisplay: '0.500' },
  { priceDisplay: '63553.7', sizeDisplay: '0.550' },
  { priceDisplay: '63554.2', sizeDisplay: '0.600' },
  { priceDisplay: '63554.7', sizeDisplay: '0.650' },
];

export const SYNTHETIC_FUTURES_BID_ROWS: readonly SyntheticBookRow[] = [
  { priceDisplay: '63548.2', sizeDisplay: '0.100' },
  { priceDisplay: '63547.7', sizeDisplay: '0.150' },
  { priceDisplay: '63547.2', sizeDisplay: '0.200' },
  { priceDisplay: '63546.7', sizeDisplay: '0.250' },
  { priceDisplay: '63546.2', sizeDisplay: '0.300' },
  { priceDisplay: '63545.7', sizeDisplay: '0.350' },
  { priceDisplay: '63545.2', sizeDisplay: '0.400' },
  { priceDisplay: '63544.7', sizeDisplay: '0.450' },
  { priceDisplay: '63544.2', sizeDisplay: '0.500' },
  { priceDisplay: '63543.7', sizeDisplay: '0.550' },
  { priceDisplay: '63543.2', sizeDisplay: '0.600' },
  { priceDisplay: '63542.7', sizeDisplay: '0.650' },
];
