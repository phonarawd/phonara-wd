/**
 * CMS banners — Phase 1 E16 discovery contract (read path + kill-switch + ad-safe placement).
 * Banner copy and scheduling are engine/RPC only; this module defines route/surface ownership,
 * exposure when platform halt is active, and landing ad-compliance guardrails.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E16
 */

export const CMS_LIST_RPC = 'rpc_list_cms_content' as const;
export const CMS_ADMIN_LIST_RPC = 'rpc_admin_list_cms_content' as const;
export const CMS_ADMIN_UPSERT_RPC = 'rpc_admin_upsert_cms_content' as const;

export const CMS_BANNER_KIND = 'banner' as const;

export const CMS_BANNERS_HOME_ROUTE = '/home' as const;
export const CMS_BANNERS_LANDING_ROUTE = '/' as const;
export const CMS_BANNERS_ADMIN_ROUTE = '/admin/cms' as const;

/** RPC `p_surface` filter — must match `cms_content.surface` rows published by admin. */
export const CMS_BANNER_SURFACE_HOME = 'home' as const;
export const CMS_BANNER_SURFACE_LANDING = 'landing' as const;

/** Admin CMS desk promo filter surfaces (migration `20260627000001` — no `landing` row yet). */
export const CMS_ADMIN_PROMO_SURFACES = ['home', 'casino', 'earn', 'trade'] as const;

export type CmsBannerSurface = typeof CMS_BANNER_SURFACE_HOME | typeof CMS_BANNER_SURFACE_LANDING;

export type CmsBannerEngineBranch =
  | 'client_list_banners'
  | 'admin_list_content'
  | 'admin_upsert_content'
  | 'landing_surface_admin';

export type CmsBannerEngineStatus = 'exists' | 'partial' | 'missing';

export type CmsBannerExposureMode = 'live' | 'built_hidden' | 'defer_stub';

export type CmsBannerRpcRow = {
  id: string;
  content_key: string;
  kind: string;
  locale: string;
  surface: string | null;
  status: string;
  title: string;
  body: string | null;
  headline: string | null;
  cta_label: string | null;
  cta_href: string | null;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  published_at: string | null;
};

export type CmsBannerDisplayRow = {
  id: string;
  contentKey: string;
  surface: CmsBannerSurface | null;
  title: string;
  headline: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  priority: number;
};

export const CMS_BANNER_ENGINE_BRANCHES: Readonly<
  Record<
    CmsBannerEngineBranch,
    { engine: CmsBannerEngineStatus; rpc: string | null; moneyPath: boolean }
  >
> = {
  client_list_banners: { engine: 'exists', rpc: CMS_LIST_RPC, moneyPath: false },
  admin_list_content: { engine: 'exists', rpc: CMS_ADMIN_LIST_RPC, moneyPath: false },
  admin_upsert_content: { engine: 'exists', rpc: CMS_ADMIN_UPSERT_RPC, moneyPath: false },
  landing_surface_admin: { engine: 'partial', rpc: null, moneyPath: false },
};

export type CmsBannerSurfacePlacement = {
  route: typeof CMS_BANNERS_HOME_ROUTE | typeof CMS_BANNERS_LANDING_ROUTE;
  role: 'earn_hero_promo' | 'landing_hero_promo';
  surface: CmsBannerSurface;
  hook: 'useCmsBanners';
};

export const CMS_BANNER_PLACEMENT: Readonly<CmsBannerSurfacePlacement[]> = [
  {
    route: CMS_BANNERS_HOME_ROUTE,
    role: 'earn_hero_promo',
    surface: CMS_BANNER_SURFACE_HOME,
    hook: 'useCmsBanners',
  },
  {
    route: CMS_BANNERS_LANDING_ROUTE,
    role: 'landing_hero_promo',
    surface: CMS_BANNER_SURFACE_LANDING,
    hook: 'useCmsBanners',
  },
];

/** Phase 8 audit (2026-07-02): `/home` and `/` landing CMS wired via desk surfaces. */
export const CMS_BANNER_UI_WIRE_STATUS: Readonly<
  Record<(typeof CMS_BANNER_PLACEMENT)[number]['route'], 'unwired' | 'wired'>
> = {
  '/home': 'wired',
  '/': 'wired',
};

/** Operator copy guard — landing ad-safe (`COPYWRITING_CANON.md` · plan Landing section). */
export const CMS_LANDING_FORBIDDEN_COPY_PATTERNS: readonly RegExp[] = [
  /\b100\s*%\s*(profit|return)/iu,
  /\bguaranteed\s+(income|profit|return)/iu,
  /\bfree\s+money\b/iu,
  // Hangul ad-unsafe phrases (unicode escapes — check:i18n)
  /\uBB34\uC870\uAC74[\s\u3000]*(\uC218\uC775|\uB3C8)/u,
  /\uD655\uC815[\s\u3000]*(\uC218\uC775|\uBCF4\uC7A5)/u,
  /\b100\s*%\s*(\uC218\uC775|\uBCF4\uC7A5)/u,
];

export function resolveCmsSurfaceForRoute(pathname: string): CmsBannerSurface | null {
  if (pathname === CMS_BANNERS_LANDING_ROUTE) return CMS_BANNER_SURFACE_LANDING;
  if (pathname === CMS_BANNERS_HOME_ROUTE || pathname.startsWith('/home/')) {
    return CMS_BANNER_SURFACE_HOME;
  }
  return null;
}

export function resolveCmsBannerBranchExposure(
  branch: CmsBannerEngineBranch,
): CmsBannerExposureMode {
  const row = CMS_BANNER_ENGINE_BRANCHES[branch];
  if (row.engine === 'exists') return 'live';
  if (row.engine === 'partial') return 'defer_stub';
  return 'defer_stub';
}

/**
 * Promotional CMS banners hide when platform halt/readonly is active.
 * Operational kill-switch banners use `resolveShowKillSwitchBanner` separately.
 */
export function resolveCmsBannersVisible(params: {
  systemHalted: boolean;
  surface: CmsBannerSurface | null;
}): boolean {
  if (params.systemHalted) return false;
  return params.surface !== null;
}

export function mapRpcBannerRow(row: CmsBannerRpcRow): CmsBannerDisplayRow {
  return {
    id: row.id,
    contentKey: row.content_key,
    surface: isKnownCmsBannerSurface(row.surface) ? row.surface : null,
    title: row.title,
    headline: row.headline,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    priority: row.priority,
  };
}

export function isKnownCmsBannerSurface(
  surface: string | null | undefined,
): surface is CmsBannerSurface {
  return surface === CMS_BANNER_SURFACE_HOME || surface === CMS_BANNER_SURFACE_LANDING;
}

/** Sort order matches RPC (`priority DESC`, `published_at DESC`). */
export function sortCmsBannerRows(rows: readonly CmsBannerDisplayRow[]): CmsBannerDisplayRow[] {
  return [...rows].sort((a, b) => b.priority - a.priority);
}

/**
 * Landing-only ad-safe guard — blocks render when operator copy hits forbidden patterns.
 * Non-landing surfaces still rely on admin review; landing is stricter for ad compliance.
 */
export function isAdSafeCmsBannerCopy(
  row: Pick<CmsBannerDisplayRow, 'title' | 'headline' | 'ctaLabel'>,
  surface: CmsBannerSurface,
): boolean {
  if (surface !== CMS_BANNER_SURFACE_LANDING) return true;
  const blob = [row.title, row.headline ?? '', row.ctaLabel ?? ''].join(' ');
  return !CMS_LANDING_FORBIDDEN_COPY_PATTERNS.some((pattern) => pattern.test(blob));
}

export function filterVisibleCmsBanners(params: {
  rows: readonly CmsBannerDisplayRow[];
  surface: CmsBannerSurface;
  systemHalted: boolean;
}): CmsBannerDisplayRow[] {
  if (!resolveCmsBannersVisible({ systemHalted: params.systemHalted, surface: params.surface })) {
    return [];
  }
  return sortCmsBannerRows(params.rows).filter((row) => isAdSafeCmsBannerCopy(row, params.surface));
}

export function shouldDeferLandingCmsAdminWrite(): boolean {
  return !(CMS_ADMIN_PROMO_SURFACES as readonly string[]).includes(CMS_BANNER_SURFACE_LANDING);
}
