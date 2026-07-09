import { describe, expect, it } from 'vitest';
import {
  CMS_BANNER_ENGINE_BRANCHES,
  CMS_BANNER_PLACEMENT,
  CMS_BANNER_SURFACE_HOME,
  CMS_BANNER_SURFACE_LANDING,
  CMS_BANNER_UI_WIRE_STATUS,
  CMS_BANNERS_HOME_ROUTE,
  CMS_BANNERS_LANDING_ROUTE,
  CMS_LIST_RPC,
  filterVisibleCmsBanners,
  isAdSafeCmsBannerCopy,
  mapRpcBannerRow,
  resolveCmsBannerBranchExposure,
  resolveCmsBannersVisible,
  resolveCmsSurfaceForRoute,
  shouldDeferLandingCmsAdminWrite,
  sortCmsBannerRows,
} from '../cms-banners-display-contract';

describe('cms-banners-display-contract', () => {
  it('locks E16 placement to /home and / landing only', () => {
    expect(CMS_BANNER_PLACEMENT).toHaveLength(2);
    const routes = CMS_BANNER_PLACEMENT.map((row) => row.route);
    expect(routes).toContain(CMS_BANNERS_HOME_ROUTE);
    expect(routes).toContain(CMS_BANNERS_LANDING_ROUTE);
    expect(CMS_BANNER_PLACEMENT.find((row) => row.route === '/home')?.surface).toBe(
      CMS_BANNER_SURFACE_HOME,
    );
    expect(CMS_BANNER_PLACEMENT.find((row) => row.route === '/')?.surface).toBe(
      CMS_BANNER_SURFACE_LANDING,
    );
  });

  it('documents EXISTS read RPC (Phase 1 audit)', () => {
    expect(CMS_BANNER_ENGINE_BRANCHES.client_list_banners).toEqual({
      engine: 'exists',
      rpc: CMS_LIST_RPC,
      moneyPath: false,
    });
    expect(CMS_BANNER_ENGINE_BRANCHES.admin_upsert_content.engine).toBe('exists');
    expect(CMS_BANNER_ENGINE_BRANCHES.landing_surface_admin.engine).toBe('partial');
  });

  it('maps pathname to CMS surface filter', () => {
    expect(resolveCmsSurfaceForRoute('/')).toBe(CMS_BANNER_SURFACE_LANDING);
    expect(resolveCmsSurfaceForRoute('/home')).toBe(CMS_BANNER_SURFACE_HOME);
    expect(resolveCmsSurfaceForRoute('/home/missions')).toBe(CMS_BANNER_SURFACE_HOME);
    expect(resolveCmsSurfaceForRoute('/wallet')).toBeNull();
  });

  it('hides promotional banners when system halt is active', () => {
    expect(
      resolveCmsBannersVisible({
        systemHalted: true,
        surface: CMS_BANNER_SURFACE_HOME,
      }),
    ).toBe(false);
    expect(
      resolveCmsBannersVisible({
        systemHalted: false,
        surface: CMS_BANNER_SURFACE_HOME,
      }),
    ).toBe(true);
    expect(
      filterVisibleCmsBanners({
        rows: [
          {
            id: '1',
            contentKey: 'home.banner.test',
            surface: CMS_BANNER_SURFACE_HOME,
            title: 'Promo',
            headline: null,
            ctaLabel: null,
            ctaHref: null,
            priority: 1,
          },
        ],
        surface: CMS_BANNER_SURFACE_HOME,
        systemHalted: true,
      }),
    ).toEqual([]);
  });

  it('blocks landing ad-unsafe copy patterns', () => {
    expect(
      isAdSafeCmsBannerCopy(
        { title: 'Earn rewards', headline: 'Join missions', ctaLabel: 'Sign up' },
        CMS_BANNER_SURFACE_LANDING,
      ),
    ).toBe(true);
    expect(
      isAdSafeCmsBannerCopy(
        { title: '100% profit guaranteed', headline: null, ctaLabel: 'Get free money' },
        CMS_BANNER_SURFACE_LANDING,
      ),
    ).toBe(false);
    expect(
      isAdSafeCmsBannerCopy(
        { title: '100% profit guaranteed', headline: null, ctaLabel: null },
        CMS_BANNER_SURFACE_HOME,
      ),
    ).toBe(true);
  });

  it('sorts banners by priority descending', () => {
    const sorted = sortCmsBannerRows([
      {
        id: 'a',
        contentKey: 'a',
        surface: CMS_BANNER_SURFACE_HOME,
        title: 'Low',
        headline: null,
        ctaLabel: null,
        ctaHref: null,
        priority: 1,
      },
      {
        id: 'b',
        contentKey: 'b',
        surface: CMS_BANNER_SURFACE_HOME,
        title: 'High',
        headline: null,
        ctaLabel: null,
        ctaHref: null,
        priority: 10,
      },
    ]);
    expect(sorted[0]?.contentKey).toBe('b');
  });

  it('maps RPC snake_case rows to display shape', () => {
    expect(
      mapRpcBannerRow({
        id: 'uuid',
        content_key: 'home.banner.welcome',
        kind: 'banner',
        locale: 'ko',
        surface: 'home',
        status: 'published',
        title: 'Welcome',
        body: null,
        headline: 'Start earning',
        cta_label: 'Go',
        cta_href: '/signup',
        priority: 5,
        starts_at: null,
        ends_at: null,
        published_at: '2026-06-01T00:00:00.000Z',
      }),
    ).toEqual({
      id: 'uuid',
      contentKey: 'home.banner.welcome',
      surface: CMS_BANNER_SURFACE_HOME,
      title: 'Welcome',
      headline: 'Start earning',
      ctaLabel: 'Go',
      ctaHref: '/signup',
      priority: 5,
    });
  });

  it('defers landing admin surface until PromoSurface includes landing', () => {
    expect(shouldDeferLandingCmsAdminWrite()).toBe(true);
    expect(resolveCmsBannerBranchExposure('landing_surface_admin')).toBe('defer_stub');
  });

  it('records Phase 8 wired UI on /home and / landing', () => {
    expect(CMS_BANNER_UI_WIRE_STATUS['/home']).toBe('wired');
    expect(CMS_BANNER_UI_WIRE_STATUS['/']).toBe('wired');
  });
});
