export type ChartTheme = {
  textMuted: string;
  line: string;
  marketUp: string;
  marketDown: string;
  accent: string;
  background: string;
  fontFamily: string;
};

/**
 * Dark-theme rgb fallbacks — LWC cannot parse oklch/light-dark (§25.4).
 * primitive-allow: chart-adapter-rgb-fallback · owner trade/chart · M-15 signed exception
 */
const CHART_RGB_FALLBACKS = {
  textMuted: 'rgb(163, 163, 175)',
  line: 'rgb(67, 67, 76)',
  marketUp: 'rgb(77, 195, 135)',
  marketDown: 'rgb(230, 82, 82)',
  accent: 'rgb(31, 224, 138)',
} as const;

/**
 * Canvas 2D `ctx.font` never resolves `var(...)` — same probe pattern as
 * `readToken`, but for `font-family` (§25.4). Fallback mirrors the start of
 * `--ds-font-sans` (`fonts.css`), not the full cascade.
 */
const CHART_FONT_FALLBACK = "'Pretendard Variable', -apple-system, system-ui, sans-serif";

/** Canvas normalizes oklch/light-dark to rgb — same trick browsers use internally. */
function toChartRgb(color: string): string {
  if (/^rgba?\(/i.test(color) || /^#[0-9a-f]{3,8}$/i.test(color)) return color;
  if (!/oklch|light-dark|color-mix|lab\(|lch\(/i.test(color)) return color;
  if (typeof document === 'undefined') return color;

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return color;

    // primitive-allow: canvas-color-probe · owner trade/chart · LWC token normalize
    ctx.fillStyle = '#000000';
    ctx.fillStyle = color;
    const normalized = ctx.fillStyle;
    if (normalized && /^rgba?\(/i.test(normalized)) return normalized;
  } catch {
    /* jsdom / unsupported color syntax */
  }

  return color;
}

/** Resolve `--ds-*` tokens to rgb/rgba for Lightweight Charts. */
function readToken(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;

  const probe = document.createElement('span');
  probe.style.setProperty('color', `var(${name})`);
  probe.style.setProperty('position', 'absolute');
  probe.style.setProperty('visibility', 'hidden');
  probe.style.setProperty('pointer-events', 'none');
  document.documentElement.appendChild(probe);
  const resolved = getComputedStyle(probe).color.trim();
  probe.remove();

  const raw = resolved || fallback;
  if (/^rgba?\(/i.test(raw) || /^#[0-9a-f]{3,8}$/i.test(raw)) return raw;

  const rgb = toChartRgb(raw);
  return /^rgba?\(/i.test(rgb) || /^#[0-9a-f]{3,8}$/i.test(rgb) ? rgb : fallback;
}

/** Resolve `--ds-font-sans` to a concrete `font-family` string for Canvas 2D. */
function readFontFamily(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;

  const probe = document.createElement('span');
  probe.style.setProperty('font-family', `var(${name})`);
  probe.style.setProperty('position', 'absolute');
  probe.style.setProperty('visibility', 'hidden');
  probe.style.setProperty('pointer-events', 'none');
  document.documentElement.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily.trim();
  probe.remove();

  // Unresolved custom property (e.g. no CSS loaded in a test env) — the
  // engine may pass the literal `var(...)` through instead of evaluating it.
  if (!resolved || /var\(/i.test(resolved)) return fallback;
  return resolved;
}

/** Map `--ds-*` tokens to Lightweight Charts options (§25.4). */
export function readChartTheme(): ChartTheme {
  return {
    textMuted: readToken('--ds-foreground-muted', CHART_RGB_FALLBACKS.textMuted),
    line: readToken('--ds-line', CHART_RGB_FALLBACKS.line),
    marketUp: readToken('--ds-market-up', CHART_RGB_FALLBACKS.marketUp),
    marketDown: readToken('--ds-market-down', CHART_RGB_FALLBACKS.marketDown),
    accent: readToken('--ds-accent', CHART_RGB_FALLBACKS.accent),
    background: 'transparent',
    fontFamily: readFontFamily('--ds-font-sans', CHART_FONT_FALLBACK),
  };
}

export function chartLayoutOptions(theme: ChartTheme) {
  return {
    background: { color: theme.background },
    textColor: theme.textMuted,
    fontFamily: theme.fontFamily,
    attributionLogo: true as const,
  };
}

export function chartGridOptions(theme: ChartTheme) {
  return {
    vertLines: { color: theme.line },
    horzLines: { color: theme.line },
  };
}

export function candleSeriesOptions(theme: ChartTheme) {
  return {
    upColor: theme.marketUp,
    downColor: theme.marketDown,
    wickUpColor: theme.marketUp,
    wickDownColor: theme.marketDown,
    borderVisible: false as const,
  };
}

export function lineSeriesOptions(color: string) {
  return {
    color,
    lineWidth: 2 as const,
    crosshairMarkerVisible: true,
    priceLineVisible: false,
    lastValueVisible: false,
  };
}

export function indicatorSeriesOptions(color: string) {
  return {
    color,
    lineWidth: 1 as const,
    crosshairMarkerVisible: false,
    priceLineVisible: false,
    lastValueVisible: false,
  };
}
