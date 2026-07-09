/** §25.9 brand context matrix — Quad Stream Core · asset paths · wordmark rules. */

export const BRAND_ASSETS = {
  hero3d: '/brand/logo.svg',
  flat: '/brand/logo-flat.svg',
  /** Phase 4 geometric recall shape — hero-adjacent · memory test variant. */
  shape: '/brand/concepts-v2/concept-c-phon-convergence.svg',
  /** Purple monochrome — chrome mask · favicon · 16–32px. */
  mono: '/brand/logo-mono.svg',
  /** Full-color simplified — PWA/maskable/splash raster on dark bg. */
  raster: '/brand/splash-mark.svg',
  splashBoot: '/brand/splash-mark.svg',
  wordmark: '/brand/wordmark.svg',
  lockup: '/brand/logo-lockup.svg',
  ogCard: '/og-card.png',
} as const;

/** Core resonance purple — chrome mono · dark accent fallback. */
export const BRAND_CORE = '#7B6FE8' as const;

/** Light-surface ink for wordmark (contrast vs #ffffff ≈ 16:1). */
export const BRAND_INK = '#1A1D26' as const;

/** Dark-surface wordmark (contrast vs #0d0f14 ≈ 17:1). */
export const BRAND_INK_DARK = '#F0F2F5' as const;

/** Quad-stream axis colors — hero/OG only. */
export const BRAND_AXIS_COLORS = {
  earn: '#2EC4A0',
  trading: '#4B8FE8',
  sports: '#E07A52',
  casino: '#D456A0',
} as const;

/** Wordmark — lowercase phonara · Pretendard Medium · +0.04em. */
export const BRAND_WORDMARK = {
  fontFamily: 'Pretendard, system-ui, -apple-system, Segoe UI, sans-serif',
  fontWeight: 500,
  letterSpacingEm: 0.04,
  casing: 'lowercase' as const,
  display: 'phonara',
} as const;

/** Flat monochrome mark — AppShell chrome (logged-in). */
export const BRAND_CHROME_MARK_PX = 20 as const;

/** Flat monochrome mark — auth entry surfaces. */
export const BRAND_AUTH_MARK_PX = 24 as const;

/** Paths where sculpted 3D / full-color logo is allowed (hero · splash · OG). */
export const BRAND_HERO_3D_ALLOWLIST = new Set([
  BRAND_ASSETS.hero3d,
  BRAND_ASSETS.shape,
  BRAND_ASSETS.raster,
  BRAND_ASSETS.ogCard,
]);

/** Chrome/auth must never reference the 3D canonical SVG. */
export function isChromeBrandAsset(path: string): boolean {
  return (
    path === BRAND_ASSETS.flat ||
    path === BRAND_ASSETS.mono ||
    path === BRAND_ASSETS.splashBoot ||
    path === BRAND_ASSETS.raster
  );
}
