// display-only · payout/balance 0 · post-paste engine SOT
// string in → string out · number/float 0 · no @phonara/money · no decimal.js npm
// BigInt long-multiply · half-up round to 2 decimals.

function parseDecimal(s: string): { mantissa: bigint; scale: number } {
  const trimmed = s.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { mantissa: 0n, scale: 0 };
  }
  const neg = trimmed.startsWith('-');
  const body = neg ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart = ''] = body.split('.');
  const digits = `${intPart}${fracPart}`.replace(/^0+(?=\d)/, '');
  const m = BigInt(digits.length === 0 ? '0' : digits);
  return { mantissa: neg ? -m : m, scale: fracPart.length };
}

function formatTwoDp(mantissa: bigint, scale: number): string {
  // Round half-up to 2 decimal places.
  const neg = mantissa < 0n;
  let abs = neg ? -mantissa : mantissa;
  if (scale > 2) {
    const diff = scale - 2;
    const divisor = 10n ** BigInt(diff);
    const halfDivisor = divisor / 2n;
    const rem = abs % divisor;
    abs = abs / divisor;
    if (rem >= halfDivisor) abs += 1n;
    // normalized to 2 decimal places below
  } else if (scale < 2) {
    abs = abs * 10n ** BigInt(2 - scale);
  }
  const str = abs.toString().padStart(3, '0');
  const intLen = str.length - 2;
  const out = `${str.slice(0, intLen)}.${str.slice(intLen)}`;
  return neg ? `-${out}` : out;
}

export function displayOddsMultiply(odds: string[]): string {
  if (odds.length === 0) return '0.00';
  let mantissa = 1n;
  let scale = 0;
  for (const o of odds) {
    const p = parseDecimal(o);
    if (p.mantissa === 0n) return '0.00';
    mantissa = mantissa * p.mantissa;
    scale += p.scale;
  }
  return formatTwoDp(mantissa, scale);
}

// S7 — display-only · tick/cashout shared · BigInt long-add (signed)
export function addDecimalStrings(a: string, b: string): string {
  const pa = parseDecimal(a);
  const pb = parseDecimal(b);
  // align scales
  const maxScale = Math.max(pa.scale, pb.scale);
  const ma = pa.mantissa * 10n ** BigInt(maxScale - pa.scale);
  const mb = pb.mantissa * 10n ** BigInt(maxScale - pb.scale);
  return formatTwoDp(ma + mb, maxScale);
}

// S2/F22 — Cashout preview · stake × (current / placed) × margin
// display-only · payout commit 0 · BigInt divide with scale=6 intermediate.
export function displayCashoutPreview(
  stake: string,
  placedCombined: string,
  currentCombined: string,
  margin = '0.92',
): string {
  const ps = parseDecimal(stake);
  const pp = parseDecimal(placedCombined);
  const pc = parseDecimal(currentCombined);
  const pm = parseDecimal(margin);
  if (ps.mantissa === 0n || pp.mantissa <= 0n || pc.mantissa <= 0n || pm.mantissa <= 0n) {
    return '0.00';
  }
  // ratio = current / placed at scale=6 → mantissa_r = pc.mantissa * 10^(6 + pp.scale - pc.scale) / pp.mantissa
  const ratioScale = 6;
  const numer = pc.mantissa * 10n ** BigInt(ratioScale + pp.scale - pc.scale);
  const ratioMantissa = numer / pp.mantissa;
  // multiply: stake × ratio × margin
  const m1 = ps.mantissa * ratioMantissa;
  const s1 = ps.scale + ratioScale;
  const m2 = m1 * pm.mantissa;
  const s2 = s1 + pm.scale;
  return formatTwoDp(m2, s2);
}
