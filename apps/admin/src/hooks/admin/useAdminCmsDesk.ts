import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminAuditEvent } from '@/shared-types';
import { supabase } from '../../lib/supabase';
import type {
  AdminCmsPageRow,
  AdminCmsPromoRow,
  PageFilters,
  PageLocale,
  PageStatus,
  PromoFilters,
  PromoStatus,
  PromoSurface,
  UseAdminCmsDesk,
} from './useAdminCmsDeskMock';

export type {
  AdminCmsPageRow,
  AdminCmsPromoRow,
  PageFilters,
  PageLocale,
  PageStatus,
  PromoFilters,
  PromoStatus,
  PromoSurface,
  UseAdminCmsDesk,
} from './useAdminCmsDeskMock';

const MIN_REASON = 4;
const PAGE_LOCALES: PageLocale[] = ['ko', 'en'];
const PAGE_STATUSES: PageStatus[] = ['draft', 'published', 'archived'];
const PROMO_SURFACES: PromoSurface[] = ['home', 'casino', 'earn', 'trade'];
const PROMO_STATUSES: PromoStatus[] = ['draft', 'scheduled', 'live', 'ended'];

type CmsEngineRow = {
  id: string;
  content_key: string;
  kind: string;
  locale: string;
  surface: string | null;
  status: string;
  title: string;
  body: string | null;
  headline: string | null;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  published_at: string | null;
};

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

function mapPageStatus(status: string): PageStatus {
  if (status === 'published') return 'published';
  if (status === 'archived') return 'archived';
  return 'draft';
}

function mapPromoStatus(row: CmsEngineRow): PromoStatus {
  const now = Date.now();
  if (row.status === 'archived') return 'ended';
  if (row.status === 'draft') return 'draft';
  if (row.status === 'scheduled') return 'scheduled';
  if (row.ends_at && Date.parse(row.ends_at) <= now) return 'ended';
  if (row.starts_at && Date.parse(row.starts_at) > now) return 'scheduled';
  return 'live';
}

function mapPageRow(row: CmsEngineRow): AdminCmsPageRow {
  return {
    id: row.id,
    pageKey: row.content_key,
    locale: row.locale as PageLocale,
    status: mapPageStatus(row.status),
    titleKey: row.title,
    updatedAt: row.published_at ?? row.starts_at ?? new Date(0).toISOString(),
    updatedByKey: 'admin.cms.pages.actor.engine',
  };
}

function mapPromoRow(row: CmsEngineRow): AdminCmsPromoRow {
  return {
    id: row.id,
    promoKey: row.content_key,
    surface: (row.surface ?? 'home') as PromoSurface,
    status: mapPromoStatus(row),
    startsAt: row.starts_at ?? new Date(0).toISOString(),
    endsAt: row.ends_at ?? new Date(0).toISOString(),
    headlineKey: row.headline ?? row.title,
    priority: String(row.priority),
  };
}

async function listEngineRows(): Promise<CmsEngineRow[]> {
  const { data, error } = await (
    supabase as {
      rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
    }
  ).rpc('rpc_admin_list_cms_content', {});
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((raw) => ({
    id: String(raw['id'] ?? ''),
    content_key: String(raw['content_key'] ?? ''),
    kind: String(raw['kind'] ?? ''),
    locale: String(raw['locale'] ?? 'ko'),
    surface: raw['surface'] != null ? String(raw['surface']) : null,
    status: String(raw['status'] ?? 'draft'),
    title: String(raw['title'] ?? ''),
    body: raw['body'] != null ? String(raw['body']) : null,
    headline: raw['headline'] != null ? String(raw['headline']) : null,
    priority: Number(raw['priority'] ?? 0),
    starts_at: raw['starts_at'] != null ? String(raw['starts_at']) : null,
    ends_at: raw['ends_at'] != null ? String(raw['ends_at']) : null,
    published_at: raw['published_at'] != null ? String(raw['published_at']) : null,
  }));
}

async function upsertEngineRow(
  row: CmsEngineRow,
  patch: Partial<Pick<CmsEngineRow, 'status' | 'starts_at' | 'ends_at'>>,
): Promise<boolean> {
  const { error } = await (
    supabase as {
      rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
    }
  ).rpc('rpc_admin_upsert_cms_content', {
    p_payload: {
      id: row.id,
      content_key: row.content_key,
      kind: row.kind,
      locale: row.locale,
      surface: row.surface,
      status: patch.status ?? row.status,
      title: row.title,
      body: row.body,
      headline: row.headline,
      priority: row.priority,
      starts_at: patch.starts_at ?? row.starts_at,
      ends_at: patch.ends_at ?? row.ends_at,
    },
  });
  return !error;
}

/** Engine-backed CMS desk — `rpc_admin_list_cms_content` / `rpc_admin_upsert_cms_content`. */
export function useAdminCmsDesk(): UseAdminCmsDesk {
  const qc = useQueryClient();
  const [pageFilters, setPageFilters] = useState<PageFilters>({
    search: '',
    locale: 'all',
    status: 'all',
  });
  const [promoFilters, setPromoFilters] = useState<PromoFilters>({
    search: '',
    surface: 'all',
    status: 'all',
  });
  const [audit, setAudit] = useState<AdminAuditEvent[]>([]);

  const { data: engineRows = [] } = useQuery({
    queryKey: ['admin-cms-content'],
    queryFn: listEngineRows,
    staleTime: 5_000,
  });

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin-cms-content'] });
  }, [qc]);

  const pages = useMemo(
    () => engineRows.filter((r) => r.kind === 'page').map(mapPageRow),
    [engineRows],
  );
  const promos = useMemo(
    () => engineRows.filter((r) => r.kind === 'promo' || r.kind === 'banner').map(mapPromoRow),
    [engineRows],
  );

  const filteredPages = useMemo(() => filterPages(pages, pageFilters), [pages, pageFilters]);
  const filteredPromos = useMemo(() => filterPromos(promos, promoFilters), [promos, promoFilters]);

  const findEngineRow = useCallback(
    (id: string) => engineRows.find((r) => r.id === id),
    [engineRows],
  );

  const appendAudit = useCallback((event: AdminAuditEvent) => {
    setAudit((prev) => [event, ...prev].slice(0, 100));
  }, []);

  const publishPage = useCallback(
    (id: string): boolean => {
      const row = findEngineRow(id);
      if (!row || row.kind !== 'page') return false;
      void (async () => {
        const ok = await upsertEngineRow(row, { status: 'published' });
        if (!ok) return;
        appendAudit({
          id: `${row.content_key}-publish-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: 'admin.cms.pages.audit.publish',
          subject: row.content_key,
          reason: '',
        });
        await invalidate();
      })();
      return true;
    },
    [appendAudit, findEngineRow, invalidate],
  );

  const archivePage = useCallback(
    (id: string, reason: string): boolean => {
      if (reason.trim().length < MIN_REASON) return false;
      const row = findEngineRow(id);
      if (!row || row.kind !== 'page') return false;
      void (async () => {
        const ok = await upsertEngineRow(row, { status: 'archived' });
        if (!ok) return;
        appendAudit({
          id: `${row.content_key}-archive-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: 'admin.cms.pages.audit.archive',
          subject: row.content_key,
          reason: reason.trim(),
        });
        await invalidate();
      })();
      return true;
    },
    [appendAudit, findEngineRow, invalidate],
  );

  const restorePageDraft = useCallback(
    (id: string, reason: string): boolean => {
      if (reason.trim().length < MIN_REASON) return false;
      const row = findEngineRow(id);
      if (!row || row.kind !== 'page') return false;
      void (async () => {
        const ok = await upsertEngineRow(row, { status: 'draft' });
        if (!ok) return;
        appendAudit({
          id: `${row.content_key}-restore-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: 'admin.cms.pages.audit.restore',
          subject: row.content_key,
          reason: reason.trim(),
        });
        await invalidate();
      })();
      return true;
    },
    [appendAudit, findEngineRow, invalidate],
  );

  const bulkPublishPages = useCallback(
    (ids: string[]): boolean => {
      let any = false;
      for (const id of ids) if (publishPage(id)) any = true;
      return any;
    },
    [publishPage],
  );

  const bulkArchivePages = useCallback(
    (ids: string[], reason: string): boolean => {
      if (reason.trim().length < MIN_REASON) return false;
      let any = false;
      for (const id of ids) if (archivePage(id, reason)) any = true;
      return any;
    },
    [archivePage],
  );

  const activatePromo = useCallback(
    (id: string): boolean => {
      const row = findEngineRow(id);
      if (!row || (row.kind !== 'promo' && row.kind !== 'banner')) return false;
      void (async () => {
        const ok = await upsertEngineRow(row, {
          status: 'published',
          starts_at: new Date().toISOString(),
        });
        if (!ok) return;
        appendAudit({
          id: `${row.content_key}-activate-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: 'admin.cms.promos.audit.activate',
          subject: row.content_key,
          reason: '',
        });
        await invalidate();
      })();
      return true;
    },
    [appendAudit, findEngineRow, invalidate],
  );

  const endPromoEarly = useCallback(
    (id: string, reason: string): boolean => {
      if (reason.trim().length < MIN_REASON) return false;
      const row = findEngineRow(id);
      if (!row || (row.kind !== 'promo' && row.kind !== 'banner')) return false;
      void (async () => {
        const ok = await upsertEngineRow(row, {
          status: 'archived',
          ends_at: new Date().toISOString(),
        });
        if (!ok) return;
        appendAudit({
          id: `${row.content_key}-end-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: 'admin.cms.promos.audit.end',
          subject: row.content_key,
          reason: reason.trim(),
        });
        await invalidate();
      })();
      return true;
    },
    [appendAudit, findEngineRow, invalidate],
  );

  const bulkActivatePromos = useCallback(
    (ids: string[]): boolean => {
      let any = false;
      for (const id of ids) if (activatePromo(id)) any = true;
      return any;
    },
    [activatePromo],
  );

  const bulkEndPromos = useCallback(
    (ids: string[], reason: string): boolean => {
      if (reason.trim().length < MIN_REASON) return false;
      let any = false;
      for (const id of ids) if (endPromoEarly(id, reason)) any = true;
      return any;
    },
    [endPromoEarly],
  );

  return {
    pages,
    filteredPages,
    pageFilters,
    setPageFilters,
    publishPage,
    archivePage,
    restorePageDraft,
    bulkPublishPages,
    bulkArchivePages,
    pageLocales: PAGE_LOCALES,
    pageStatuses: PAGE_STATUSES,
    promos,
    filteredPromos,
    promoFilters,
    setPromoFilters,
    activatePromo,
    endPromoEarly,
    bulkActivatePromos,
    bulkEndPromos,
    promoSurfaces: PROMO_SURFACES,
    promoStatuses: PROMO_STATUSES,
    audit,
    resetForTest: () => undefined,
  };
}
