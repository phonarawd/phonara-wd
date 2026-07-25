import { useCallback } from 'react';
import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';

// L1-15-G · Admin CMS Desk mock SOT.
// Two domains: Pages (draft/publish/archive) + Promos (banner schedule).
// Persist under `phonara-admin-cms-*` only. Cross-desk storage 0-touch.
// Runtime i18n catalog (ko.ts/en.ts) mutate 0 — display strings only.
// String-only display fields · no float math · no remote backend calls.

const MIN_REASON = 4;

export type PageLocale = 'ko' | 'en';
export type PageStatus = 'draft' | 'published' | 'archived';
export type PromoSurface = 'home' | 'casino' | 'earn' | 'trade';
export type PromoStatus = 'draft' | 'scheduled' | 'live' | 'ended';

export interface AdminCmsPageRow {
  id: string;
  pageKey: string;
  locale: PageLocale;
  status: PageStatus;
  titleKey: string;
  updatedAt: string;
  updatedByKey: string;
  lastChangedAt?: string;
}

export interface AdminCmsPromoRow {
  id: string;
  promoKey: string;
  surface: PromoSurface;
  status: PromoStatus;
  startsAt: string;
  endsAt: string;
  headlineKey: string;
  priority: string;
  lastChangedAt?: string;
}

export interface PageFilters {
  search: string;
  locale: PageLocale | 'all';
  status: PageStatus | 'all';
}

export interface PromoFilters {
  search: string;
  surface: PromoSurface | 'all';
  status: PromoStatus | 'all';
}

// --- SEED -------------------------------------------------------------------

const SEED_PAGES: AdminCmsPageRow[] = [
  {
    id: 'pg_01',
    pageKey: 'home.hero',
    locale: 'ko',
    status: 'published',
    titleKey: 'admin.cms.pages.seed.home.hero',
    updatedAt: '2026-06-10T09:00:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.editorial',
  },
  {
    id: 'pg_02',
    pageKey: 'home.hero',
    locale: 'en',
    status: 'published',
    titleKey: 'admin.cms.pages.seed.home.hero',
    updatedAt: '2026-06-10T09:05:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.editorial',
  },
  {
    id: 'pg_03',
    pageKey: 'casino.promo.weekly',
    locale: 'ko',
    status: 'published',
    titleKey: 'admin.cms.pages.seed.casino.weekly',
    updatedAt: '2026-06-12T10:00:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.marketing',
  },
  {
    id: 'pg_04',
    pageKey: 'earn.faq',
    locale: 'en',
    status: 'published',
    titleKey: 'admin.cms.pages.seed.earn.faq',
    updatedAt: '2026-06-08T14:00:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.support',
  },
  {
    id: 'pg_05',
    pageKey: 'trade.howto',
    locale: 'ko',
    status: 'draft',
    titleKey: 'admin.cms.pages.seed.trade.howto',
    updatedAt: '2026-06-15T11:00:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.editorial',
  },
  {
    id: 'pg_06',
    pageKey: 'trade.howto',
    locale: 'en',
    status: 'draft',
    titleKey: 'admin.cms.pages.seed.trade.howto',
    updatedAt: '2026-06-15T11:10:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.editorial',
  },
  {
    id: 'pg_07',
    pageKey: 'earn.referralTerms',
    locale: 'ko',
    status: 'draft',
    titleKey: 'admin.cms.pages.seed.earn.referralTerms',
    updatedAt: '2026-06-14T08:30:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.legal',
  },
  {
    id: 'pg_08',
    pageKey: 'responsible-gaming.intro',
    locale: 'en',
    status: 'archived',
    titleKey: 'admin.cms.pages.seed.rg.intro',
    updatedAt: '2026-04-22T16:00:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.legal',
  },
  {
    id: 'pg_09',
    pageKey: 'promo.spring2025',
    locale: 'ko',
    status: 'archived',
    titleKey: 'admin.cms.pages.seed.promo.spring',
    updatedAt: '2025-05-30T09:00:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.marketing',
  },
  {
    id: 'pg_10',
    pageKey: 'casino.tournaments.intro',
    locale: 'en',
    status: 'published',
    titleKey: 'admin.cms.pages.seed.casino.tournaments',
    updatedAt: '2026-06-13T12:00:00.000Z',
    updatedByKey: 'admin.cms.pages.actor.marketing',
  },
];

const SEED_PROMOS: AdminCmsPromoRow[] = [
  {
    id: 'pr_01',
    promoKey: 'home.banner.summer',
    surface: 'home',
    status: 'live',
    startsAt: '2026-06-01T00:00:00.000Z',
    endsAt: '2026-06-30T23:59:00.000Z',
    headlineKey: 'admin.cms.promos.seed.home.summer',
    priority: '10',
  },
  {
    id: 'pr_02',
    promoKey: 'casino.strip.weekly',
    surface: 'casino',
    status: 'live',
    startsAt: '2026-06-10T00:00:00.000Z',
    endsAt: '2026-06-17T00:00:00.000Z',
    headlineKey: 'admin.cms.promos.seed.casino.weekly',
    priority: '20',
  },
  {
    id: 'pr_03',
    promoKey: 'earn.mission.spotlight',
    surface: 'earn',
    status: 'scheduled',
    startsAt: '2026-06-20T00:00:00.000Z',
    endsAt: '2026-07-04T23:59:00.000Z',
    headlineKey: 'admin.cms.promos.seed.earn.spotlight',
    priority: '30',
  },
  {
    id: 'pr_04',
    promoKey: 'trade.fee.zero',
    surface: 'trade',
    status: 'scheduled',
    startsAt: '2026-07-01T00:00:00.000Z',
    endsAt: '2026-07-15T23:59:00.000Z',
    headlineKey: 'admin.cms.promos.seed.trade.zero',
    priority: '40',
  },
  {
    id: 'pr_05',
    promoKey: 'home.banner.welcome',
    surface: 'home',
    status: 'draft',
    startsAt: '2026-08-01T00:00:00.000Z',
    endsAt: '2026-08-31T23:59:00.000Z',
    headlineKey: 'admin.cms.promos.seed.home.welcome',
    priority: '50',
  },
  {
    id: 'pr_06',
    promoKey: 'casino.strip.crashweek',
    surface: 'casino',
    status: 'draft',
    startsAt: '2026-09-01T00:00:00.000Z',
    endsAt: '2026-09-07T23:59:00.000Z',
    headlineKey: 'admin.cms.promos.seed.casino.crashweek',
    priority: '60',
  },
  {
    id: 'pr_07',
    promoKey: 'home.banner.spring',
    surface: 'home',
    status: 'ended',
    startsAt: '2026-03-01T00:00:00.000Z',
    endsAt: '2026-03-31T23:59:00.000Z',
    headlineKey: 'admin.cms.promos.seed.home.spring',
    priority: '70',
  },
  {
    id: 'pr_08',
    promoKey: 'earn.streak.may',
    surface: 'earn',
    status: 'ended',
    startsAt: '2026-05-01T00:00:00.000Z',
    endsAt: '2026-05-31T23:59:00.000Z',
    headlineKey: 'admin.cms.promos.seed.earn.streak',
    priority: '80',
  },
];

// --- filters ---------------------------------------------------------------

function filterPages(rows: AdminCmsPageRow[], f: PageFilters): AdminCmsPageRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.locale !== 'all' && r.locale !== f.locale) return false;
    if (f.status !== 'all' && r.status !== f.status) return false;
    if (!q) return true;
    return r.pageKey.toLowerCase().includes(q) || r.titleKey.toLowerCase().includes(q);
  });
}

function filterPromos(rows: AdminCmsPromoRow[], f: PromoFilters): AdminCmsPromoRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.surface !== 'all' && r.surface !== f.surface) return false;
    if (f.status !== 'all' && r.status !== f.status) return false;
    if (!q) return true;
    return r.promoKey.toLowerCase().includes(q) || r.headlineKey.toLowerCase().includes(q);
  });
}

// --- hook factories --------------------------------------------------------

const usePagesMock = createAdminMockHook<AdminCmsPageRow, PageFilters>({
  storageKey: 'phonara-admin-cms-pages-v1',
  seedRows: SEED_PAGES,
  seedFilters: { search: '', locale: 'all', status: 'all' },
  filterFn: filterPages,
  auditCap: 100,
});

const usePromosMock = createAdminMockHook<AdminCmsPromoRow, PromoFilters>({
  storageKey: 'phonara-admin-cms-promos-v1',
  seedRows: SEED_PROMOS,
  seedFilters: { search: '', surface: 'all', status: 'all' },
  filterFn: filterPromos,
  auditCap: 100,
});

const PAGE_LOCALES: PageLocale[] = ['ko', 'en'];
const PAGE_STATUSES: PageStatus[] = ['draft', 'published', 'archived'];
const PROMO_SURFACES: PromoSurface[] = ['home', 'casino', 'earn', 'trade'];
const PROMO_STATUSES: PromoStatus[] = ['draft', 'scheduled', 'live', 'ended'];

export interface UseAdminCmsDesk {
  // pages
  pages: AdminCmsPageRow[];
  filteredPages: AdminCmsPageRow[];
  pageFilters: PageFilters;
  setPageFilters: (f: PageFilters | ((p: PageFilters) => PageFilters)) => void;
  publishPage: (id: string, reason: string) => Promise<boolean>;
  archivePage: (id: string, reason: string) => Promise<boolean>;
  restorePageDraft: (id: string, reason: string) => Promise<boolean>;
  bulkPublishPages: (ids: string[], reason: string) => Promise<boolean>;
  bulkArchivePages: (ids: string[], reason: string) => Promise<boolean>;
  pageLocales: PageLocale[];
  pageStatuses: PageStatus[];

  // promos
  promos: AdminCmsPromoRow[];
  filteredPromos: AdminCmsPromoRow[];
  promoFilters: PromoFilters;
  setPromoFilters: (f: PromoFilters | ((p: PromoFilters) => PromoFilters)) => void;
  activatePromo: (id: string, reason: string) => Promise<boolean>;
  endPromoEarly: (id: string, reason: string) => Promise<boolean>;
  bulkActivatePromos: (ids: string[], reason: string) => Promise<boolean>;
  bulkEndPromos: (ids: string[], reason: string) => Promise<boolean>;
  promoSurfaces: PromoSurface[];
  promoStatuses: PromoStatus[];

  // shared
  audit: AdminAuditEvent[];
  refresh: () => Promise<void>;
  resetForTest: () => void;
}

const nowIso = () => new Date().toISOString();
const validReason = (r: string | undefined) =>
  typeof r === 'string' && r.trim().length >= MIN_REASON;

export function useAdminCmsDeskMock(): UseAdminCmsDesk {
  const pg = usePagesMock();
  const pr = usePromosMock();

  const publishPage = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = pg.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status !== 'draft') return false;
      const at = nowIso();
      pg.patchRow(
        id,
        (r) => r.id,
        (r) => ({
          ...r,
          status: 'published',
          updatedAt: at,
          lastChangedAt: at,
        }),
      );
      pg.appendAudit({
        id: `${row.pageKey}-publish-${row.locale}-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.cms.pages.audit.publish',
        subject: row.pageKey,
        reason: reason.trim(),
      });
      return true;
    },
    [pg],
  );

  const archivePage = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = pg.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status === 'archived') return false;
      const at = nowIso();
      pg.patchRow(
        id,
        (r) => r.id,
        (r) => ({
          ...r,
          status: 'archived',
          updatedAt: at,
          lastChangedAt: at,
        }),
      );
      pg.appendAudit({
        id: `${row.pageKey}-archive-${row.locale}-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.cms.pages.audit.archive',
        subject: row.pageKey,
        reason: reason.trim(),
      });
      return true;
    },
    [pg],
  );

  const restorePageDraft = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = pg.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status !== 'archived') return false;
      const at = nowIso();
      pg.patchRow(
        id,
        (r) => r.id,
        (r) => ({
          ...r,
          status: 'draft',
          updatedAt: at,
          lastChangedAt: at,
        }),
      );
      pg.appendAudit({
        id: `${row.pageKey}-restore-${row.locale}-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.cms.pages.audit.restore',
        subject: row.pageKey,
        reason: reason.trim(),
      });
      return true;
    },
    [pg],
  );

  const bulkPublishPages = useCallback(
    async (ids: string[], reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        if (await publishPage(id, reason)) any = true;
      }
      return any;
    },
    [publishPage],
  );

  const bulkArchivePages = useCallback(
    async (ids: string[], reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        if (await archivePage(id, reason)) any = true;
      }
      return any;
    },
    [archivePage],
  );

  const activatePromo = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = pr.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status !== 'draft' && row.status !== 'scheduled') return false;
      const at = nowIso();
      pr.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'live', lastChangedAt: at }),
      );
      pr.appendAudit({
        id: `${row.promoKey}-activate-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.cms.promos.audit.activate',
        subject: row.promoKey,
        reason: reason.trim(),
      });
      return true;
    },
    [pr],
  );

  const endPromoEarly = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = pr.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status !== 'live') return false;
      const at = nowIso();
      pr.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'ended', lastChangedAt: at, endsAt: at }),
      );
      pr.appendAudit({
        id: `${row.promoKey}-end-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.cms.promos.audit.end',
        subject: row.promoKey,
        reason: reason.trim(),
      });
      return true;
    },
    [pr],
  );

  const bulkActivatePromos = useCallback(
    async (ids: string[], reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        if (await activatePromo(id, reason)) any = true;
      }
      return any;
    },
    [activatePromo],
  );

  const bulkEndPromos = useCallback(
    async (ids: string[], reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        if (await endPromoEarly(id, reason)) any = true;
      }
      return any;
    },
    [endPromoEarly],
  );

  const audit: AdminAuditEvent[] = [...pg.audit, ...pr.audit].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
  );

  const resetForTest = useCallback(() => {
    pg.resetForTest();
    pr.resetForTest();
  }, [pg, pr]);

  return {
    pages: pg.allRows,
    filteredPages: pg.rows,
    pageFilters: pg.filters,
    setPageFilters: pg.setFilters,
    publishPage,
    archivePage,
    restorePageDraft,
    bulkPublishPages,
    bulkArchivePages,
    pageLocales: PAGE_LOCALES,
    pageStatuses: PAGE_STATUSES,

    promos: pr.allRows,
    filteredPromos: pr.rows,
    promoFilters: pr.filters,
    setPromoFilters: pr.setFilters,
    activatePromo,
    endPromoEarly,
    bulkActivatePromos,
    bulkEndPromos,
    promoSurfaces: PROMO_SURFACES,
    promoStatuses: PROMO_STATUSES,

    audit,
    refresh: async () => undefined,
    resetForTest,
  };
}
