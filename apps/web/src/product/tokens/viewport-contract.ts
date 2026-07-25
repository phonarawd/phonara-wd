/**
 * Phase R 4-tier viewport contract (§3.0).
 *
 * Smoke test widths (390 / 768 / 1024 / 2560) are the mandatory gate checklist.
 * Tailwind breakpoints (base / sm / md / lg / xl) map to the 5 layout tiers — do not conflate.
 */

/** Mandatory multi-viewport smoke widths — page todo gate checklist. */
export const VIEWPORT_SMOKE_WIDTHS = [390, 768, 1024, 2560] as const;

export type ViewportSmokeWidth = (typeof VIEWPORT_SMOKE_WIDTHS)[number];

/**
 * Ultrawide evidence widths (40"+ / 3440–5120) — letterbox proof only.
 * NEVER merge into `VIEWPORT_SMOKE_WIDTHS` (4-tier DoD + trade-ultra contract stay pinned).
 * CDP: `PHONARA_AUDIT_ULTRAWIDE=1` → `visual-audit-capture-cdp.ts` ultrawide pass.
 */
export const ULTRAWIDE_SMOKE_WIDTHS = [3440, 3840, 5120] as const;

export type UltrawideSmokeWidth = (typeof ULTRAWIDE_SMOKE_WIDTHS)[number];

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

export function isUltrawideSmokeWidth(width: number): width is UltrawideSmokeWidth {
  return (ULTRAWIDE_SMOKE_WIDTHS as readonly number[]).includes(width);
}

/**
 * Letterbox engages when the viewport is wider than `--ds-content-max` (1680).
 * Ultrawide smoke widths (3440/3840/5120) must all satisfy this.
 */
export function expectsContentShellLetterbox(width: number): boolean {
  return width > CONTENT_SHELL_MAX_PX;
}

/**
 * Pure letterbox gate for CDP/unit harnesses — content column must stay capped
 * and leave horizontal gutters when the viewport exceeds `--ds-content-max`.
 */
export function isContentShellLetterboxOk(input: {
  viewportWidth: number;
  columnWidth: number;
  columnLeft: number;
  contentMaxPx?: number;
}): boolean {
  const contentMax = input.contentMaxPx ?? CONTENT_SHELL_MAX_PX;
  if (input.viewportWidth <= contentMax) return false;
  if (input.columnWidth > contentMax + 0.5) return false;
  // Centered column: left gutter must be positive once the viewport exceeds the cap.
  if (input.columnLeft < 1) return false;
  return true;
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
