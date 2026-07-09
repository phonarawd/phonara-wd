/** Decimal string rate from Upbit ticker JSON — no JS number arithmetic on rates. */
const DECIMAL_RATE_RE = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function normalizeDecimalRate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!DECIMAL_RATE_RE.test(trimmed)) return null;
  if (trimmed === '0' || /^0\.0+$/.test(trimmed)) return null;
  const [intPart, frac = ''] = trimmed.split('.');
  const frac6 = (frac + '000000').slice(0, 6);
  return `${intPart}.${frac6}`;
}

/** Parse trade_price from raw JSON text without Number/toFixed on rate values. */
export function parseUpbitTradePriceFromJson(text: string): string {
  const strMatch = text.match(/"trade_price"\s*:\s*"([0-9]+(?:\.[0-9]+)?)"/);
  if (strMatch?.[1]) {
    const rate = normalizeDecimalRate(strMatch[1]);
    if (rate) return rate;
  }

  const numMatch = text.match(/"trade_price"\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
  if (numMatch?.[1]) {
    const rate = normalizeDecimalRate(numMatch[1]);
    if (rate) return rate;
  }

  throw new Error('invalid_upbit_price');
}
