/**
 * Advisory WCAG contrast spot-check for `--ds-*` OKLCH tokens (P3-E).
 * Parses `light-dark(oklch(...), oklch(...))` branches from colors.css.
 */

export type OklchTriplet = { l: number; c: number; h: number };

const OKLCH_RE = /oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)/g;

function srgbChannel(x: number): number {
  const clamped = Math.min(1, Math.max(0, x));
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function oklabToLinearSrgb(l: number, a: number, b: number): [number, number, number] {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  return [
    +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

export function oklchToSrgb({ l, c, h }: OklchTriplet): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const [lr, lg, lb] = oklabToLinearSrgb(l, a, b);
  return [srgbChannel(lr), srgbChannel(lg), srgbChannel(lb)];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const linear = [r, g, b].map((channel) => {
    const c = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return c;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

export function contrastRatio(fgTriplet: OklchTriplet, bgTriplet: OklchTriplet): number {
  const [fr, fgG, fb] = oklchToSrgb(fgTriplet);
  const [br, bgG, bb] = oklchToSrgb(bgTriplet);
  const l1 = relativeLuminance(fr, fgG, fb);
  const l2 = relativeLuminance(br, bgG, bb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function parseOklchTriplet(raw: string): OklchTriplet | null {
  const match = /oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)/.exec(raw);
  if (!match) return null;
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

export function parseLightDarkOklch(
  value: string,
): { light: OklchTriplet; dark: OklchTriplet } | null {
  const matches = [...value.matchAll(OKLCH_RE)].map((m) => ({
    l: Number(m[1]),
    c: Number(m[2]),
    h: Number(m[3]),
  }));
  if (matches.length < 2) return null;
  return { light: matches[0]!, dark: matches[1]! };
}

export function parseCssVarOklchMap(
  css: string,
): Map<string, { light: OklchTriplet; dark: OklchTriplet }> {
  const map = new Map<string, { light: OklchTriplet; dark: OklchTriplet }>();
  const varRe = /(--ds-[a-z0-9-]+):\s*([^;]+);/g;
  for (const match of css.matchAll(varRe)) {
    const name = match[1]!;
    const parsed = parseLightDarkOklch(match[2]!);
    if (parsed) map.set(name, parsed);
  }
  return map;
}
