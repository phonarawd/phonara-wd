import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { AdminLayout } from '../components/admin-layout';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminSection } from '../components/admin-section';
import { useT } from '../lib/i18n';
import { useAuditLogs } from '../hooks/use-audit-logs';
import { Card, EmptyState, Skeleton } from '@phonara/ui';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: AuditPage,
});

function AuditPage() {
  const t = useT();
  const { data: logs = [], isLoading } = useAuditLogs();

  return (
    <AdminLayout>
      <div data-testid="audit-page">
        <AdminPageHeader
          title={t('admin.audit.title')}
          description={t('admin.audit.description')}
        />

        {isLoading && (
          <Card elevation="raised" className="mt-6 p-5" aria-busy="true">
            <div className="grid gap-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </Card>
        )}

        {!isLoading && logs.length === 0 && (
          <EmptyState className="mt-6" data-testid="audit-empty" title={t('admin.audit.empty')} />
        )}

        {!isLoading && logs.length > 0 && (
          <AdminSection title={t('admin.audit.section.entries')} className="mt-6">
            <Card elevation="raised" className="admin-panel-card overflow-hidden p-0">
              <div className="admin-data-surface border-0">
                <table className="w-full text-sm" data-testid="audit-table">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/60">
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        {t('admin.audit.col.time')}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        {t('admin.audit.col.action')}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        {t('admin.audit.col.reason')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="bg-surface transition-colors hover:bg-surface-2/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-fg">{log.action}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-muted">
                          {typeof log.payload === 'object' && log.payload !== null
                            ? ((log.payload as Record<string, unknown>)['reason'] as string) ?? '—'
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </AdminSection>
        )}
      </div>
    </AdminLayout>
  );
}
