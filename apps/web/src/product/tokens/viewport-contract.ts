/**
 * Phase R 4-tier viewport contract (§3.0).
 *
 * Smoke test widths (390 / 768 / 1024 / 2560) are the mandatory gate checklist.
 * Tailwind breakpoints (base / sm / md / lg / xl) map to the 5 layout tiers — do not conflate.
 */

/** Mandatory multi-viewport smoke widths — page todo gate checklist. */
export const VIEWPORT_SMOKE_WIDTHS = [390, 768, 1024, 2560] as const;

export type ViewportSmokeWidth = (typeof VIEWPORT_SMOKE_WIDTHS)[number];

/** CSS custom property breakpoints — keep in sync with `layout.css`. */
export const VIEWPORT_BREAKPOINTS = {
  mobileNarrow: 320,
  mobile: 390,
  mobilePlus: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultra: 1920,
  superwide: 2560,
} as const;

export type ViewportBreakpointKey = keyof typeof VIEWPORT_BREAKPOINTS;

/**
 * Layout tiers for shell density (4-tier smoke ↔ 5 Tailwind rows).
 * `mobilePlus` shares mobile shell chrome; spacing/type scale steps up at `sm:`.
 */
export const VIEWPORT_TIERS = ['mobile', 'mobilePlus', 'tablet', 'desktop', 'ultra'] as const;

export type ViewportTier = (typeof VIEWPORT_TIERS)[number];

const TIER_MAX_WIDTH: Record<ViewportTier, number> = {
  mobile: VIEWPORT_BREAKPOINTS.mobilePlus - 1,
  mobilePlus: VIEWPORT_BREAKPOINTS.tablet - 1,
  tablet: VIEWPORT_BREAKPOINTS.desktop - 1,
  desktop: VIEWPORT_BREAKPOINTS.ultra - 1,
  ultra: Number.POSITIVE_INFINITY,
};

/** Shell max content width token value (px) — mirrors `--ds-content-max`. */
export const CONTENT_SHELL_MAX_PX = 1680;

/** Minimum trade/sports panel column width (px) — mirrors `--ds-panel-min`. */
export const PANEL_MIN_PX = 280;

export function isViewportSmokeWidth(width: number): width is ViewportSmokeWidth {
  return (VIEWPORT_SMOKE_WIDTHS as readonly number[]).includes(width);
}

export function resolveViewportTier(width: number): ViewportTier {
  if (width < VIEWPORT_BREAKPOINTS.mobilePlus) return 'mobile';
  if (width < VIEWPORT_BREAKPOINTS.tablet) return 'mobilePlus';
  if (width < VIEWPORT_BREAKPOINTS.desktop) return 'tablet';
  if (width < VIEWPORT_BREAKPOINTS.ultra) return 'desktop';
  return 'ultra';
}

export function tierMaxWidth(tier: ViewportTier): number {
  return TIER_MAX_WIDTH[tier];
}

export function isAtLeastBreakpoint(width: number, key: ViewportBreakpointKey): boolean {
  return width >= VIEWPORT_BREAKPOINTS[key];
}

export function prefersContentShellCap(width: number): boolean {
  return width >= VIEWPORT_BREAKPOINTS.ultra;
}
