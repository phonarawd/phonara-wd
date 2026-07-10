import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import { useAdminAuditDesk } from '@/hooks/admin/useAdminAuditDesk';
import type { AuditDomain, AuditFilters } from '@/hooks/admin/useAdminAuditAlertsMock';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';

type DatePreset = AuditFilters['datePreset'];

const DATE_PRESETS: DatePreset[] = ['all', '1h', '24h', '7d'];

const DATE_PRESET_KEYS: Record<DatePreset, MessageKey> = {
  all: 'admin.audit.feed.preset.all',
  '1h': 'admin.audit.feed.preset.1h',
  '24h': 'admin.audit.feed.preset.24h',
  '7d': 'admin.audit.feed.preset.7d',
};

const DOMAIN_KEYS: Record<AuditDomain, MessageKey> = {
  wallet: 'admin.audit.domain.wallet',
  compliance: 'admin.audit.domain.compliance',
  users: 'admin.audit.domain.users',
  sports: 'admin.audit.domain.sports',
  system: 'admin.audit.domain.system',
};

function formatWhen(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function toggleDomain(list: AuditDomain[], value: AuditDomain): AuditDomain[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function formatActionLabel(actionKey: string, t: ReturnType<typeof useT>): string {
  if (actionKey.startsWith('admin.')) {
    return t(actionKey as MessageKey);
  }
  return t('admin.audit.action.recorded');
}

/** Admin audit log desk (`/audit`) — read-only feed via `useAuditLogs` (§29.2 R0). */
export function AdminAuditPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    auditFeed,
    filteredAuditFeed,
    auditFilters,
    setAuditFilters,
    refreshAuditFeed,
    auditDomains,
    isLoading,
    isError,
    isFetching,
  } = useAdminAuditDesk();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedRow = useMemo(
    () => filteredAuditFeed.find((row) => row.id === selectedId) ?? null,
    [filteredAuditFeed, selectedId],
  );

  const clearFilters = () => {
    setAuditFilters({ search: '', domains: [], datePreset: 'all' });
    setSelectedId(null);
  };
  const auditColumns = [
    {
      id: 'at',
      header: t('admin.audit.feed.col.at'),
      cell: ({ row }: { row: (typeof filteredAuditFeed)[number] }) => formatWhen(row.at, locale),
      meta: { className: 'text-foreground-muted tabular-nums' },
    },
    {
      id: 'domain',
      header: t('admin.audit.feed.col.domain'),
      cell: ({ row }: { row: (typeof filteredAuditFeed)[number] }) => t(DOMAIN_KEYS[row.domain]),
    },
    {
      id: 'action',
      header: t('admin.audit.feed.col.action'),
      cell: ({ row }: { row: (typeof filteredAuditFeed)[number] }) =>
        formatActionLabel(row.actionKey, t),
    },
    {
      id: 'actor',
      header: t('admin.audit.feed.col.actor'),
      cell: ({ row }: { row: (typeof filteredAuditFeed)[number] }) => t(row.actorKey as MessageKey),
      meta: { className: 'text-foreground-muted' },
    },
    {
      id: 'subject',
      header: t('admin.audit.feed.col.subject'),
      cell: ({ row }: { row: (typeof filteredAuditFeed)[number] }) => row.subject ?? '—',
      meta: { className: 'text-foreground-muted' },
    },
    {
      id: 'reason',
      header: t('admin.audit.feed.col.reason'),
      cell: ({ row }: { row: (typeof filteredAuditFeed)[number] }) => row.reason || '—',
      meta: { className: 'text-foreground-muted' },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.audit')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {auditFeed.length > 0
              ? t('admin.audit.summary', { count: String(auditFeed.length) })
              : t('admin.audit.subtitle')}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.audit.description')}</p>
        </div>
        <Button
          variant="outline"
          size="md"
          loading={isFetching}
          onClick={refreshAuditFeed}
          className="shrink-0"
        >
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} aria-hidden />
          {t('admin.audit.feed.refresh')}
        </Button>
      </section>

      <HowItWorks
        persistenceId="admin-audit"
        titleKey="admin.help.audit.title"
        stepKeys={['admin.help.audit.step1', 'admin.help.audit.step2', 'admin.help.audit.step3']}
      />

      {isError ? (
        <Card className="border-danger/40">
          <CardHeader>
            <CardTitle className="text-base">{t('admin.audit.error.title')}</CardTitle>
            <CardDescription>{t('admin.audit.error.desc')}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {isLoading ? (
        <AdminTable columns={auditColumns} rows={[]} loading loadingRowCount={6} minWidth={960} />
      ) : auditFeed.length === 0 ? (
        <EmptyState
          title={t('admin.audit.empty.title')}
          description={t('admin.audit.empty.desc')}
          actionLabel={t('admin.audit.empty.cta')}
          onAction={() => {
            goTo('/');
          }}
        />
      ) : (
        <>
          <section className="space-y-4" aria-labelledby="admin-audit-feed-heading">
            <div>
              <h3
                id="admin-audit-feed-heading"
                className="text-foreground m-0 text-lg font-semibold"
              >
                {t('admin.audit.feed.title')}
              </h3>
              <p className="text-foreground-muted m-0 text-sm">{t('admin.audit.feed.subtitle')}</p>
            </div>

            <div className="flex flex-col gap-3">
              <Input
                value={auditFilters.search}
                onChange={(event) =>
                  setAuditFilters((prev) => ({ ...prev, search: event.target.value }))
                }
                placeholder={t('admin.audit.feed.search.placeholder')}
                aria-label={t('admin.audit.feed.search.placeholder')}
                className="max-w-md"
              />

              <div className="flex flex-wrap gap-2">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant={auditFilters.datePreset === preset ? 'primary' : 'outline'}
                    onClick={() => setAuditFilters((prev) => ({ ...prev, datePreset: preset }))}
                  >
                    {t(DATE_PRESET_KEYS[preset])}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {auditDomains.map((domain) => (
                  <Button
                    key={domain}
                    size="sm"
                    variant={auditFilters.domains.includes(domain) ? 'primary' : 'outline'}
                    onClick={() =>
                      setAuditFilters((prev) => ({
                        ...prev,
                        domains: toggleDomain(prev.domains, domain),
                      }))
                    }
                  >
                    {t(DOMAIN_KEYS[domain])}
                  </Button>
                ))}
              </div>
            </div>

            <AdminTable
              columns={auditColumns}
              rows={filteredAuditFeed}
              getRowId={(row) => row.id}
              minWidth={960}
              empty={
                <EmptyState
                  title={t('admin.audit.feed.empty')}
                  description={t('admin.audit.empty.desc')}
                  actionLabel={t('admin.audit.clearFilters')}
                  onAction={clearFilters}
                />
              }
              onRowClick={(row) => setSelectedId((current) => (current === row.id ? null : row.id))}
              getRowClassName={(row) =>
                cn('align-top', row.id === selectedId && 'bg-surface-raised')
              }
            />
          </section>

          {selectedRow ? (
            <Card aria-labelledby="admin-audit-detail-heading">
              <CardHeader className="gap-2">
                <CardTitle id="admin-audit-detail-heading" className="text-base">
                  {t('admin.audit.feed.detail.title')}
                </CardTitle>
                <CardDescription>
                  {formatWhen(selectedRow.at, locale)} · {t(DOMAIN_KEYS[selectedRow.domain])}
                </CardDescription>
              </CardHeader>
              <CardHeader className="gap-1 pt-0">
                <CardDescription>{t('admin.audit.feed.col.action')}</CardDescription>
                <CardTitle className="text-base font-medium">
                  {formatActionLabel(selectedRow.actionKey, t)}
                </CardTitle>
                <CardDescription className="pt-2">
                  {t('admin.audit.feed.detail.reason')}
                </CardDescription>
                <CardTitle className="text-base font-normal">
                  {selectedRow.reason?.trim()
                    ? selectedRow.reason
                    : t('admin.audit.feed.detail.noReason')}
                </CardTitle>
              </CardHeader>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
