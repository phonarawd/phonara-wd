import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  isAdminKrwProofPending,
  isAdminKrwProofViewable,
} from '@/domain/admin-krw-proof-review-display-contract';
import {
  useAdminWalletDesk,
  formatAmountString,
  type AdminDepositReconRow,
  type DepositMethod,
  type DepositProofStatus,
  type DepositStatus,
} from '@/hooks/admin/useAdminWalletDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/product/primitives/dialog';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { cn } from '@/product/primitives/lib/cn';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

type MethodTab = 'all' | DepositMethod;

type DepositActionKind = 'matchKrw' | 'matchCrypto' | 'approveGiftcard' | 'flag' | 'approveProof';

interface DepositActionTarget {
  kind: DepositActionKind;
  id: string;
  titleKey: MessageKey;
  confirmKey: MessageKey;
  destructive?: boolean;
  summary: string;
}

const METHOD_FILTER_KEYS: Record<DepositMethod, MessageKey> = {
  krw: 'admin.wallet.depositRecon.filter.method.krw',
  crypto: 'admin.wallet.depositRecon.filter.method.crypto',
  giftcard: 'admin.wallet.depositRecon.filter.method.giftcard',
};

const MATCH_ACTION_KEYS: Record<
  DepositMethod,
  { action: MessageKey; dialog: MessageKey; kind: DepositActionKind }
> = {
  krw: {
    action: 'admin.deposits.action.matchKrw',
    dialog: 'admin.deposits.dialog.matchKrw',
    kind: 'matchKrw',
  },
  crypto: {
    action: 'admin.deposits.action.matchCrypto',
    dialog: 'admin.deposits.dialog.matchCrypto',
    kind: 'matchCrypto',
  },
  giftcard: {
    action: 'admin.deposits.action.approveGiftcard',
    dialog: 'admin.deposits.dialog.approveGiftcard',
    kind: 'approveGiftcard',
  },
};

const PROOF_STATUS_LABEL_KEYS: Record<DepositProofStatus, MessageKey> = {
  none: 'admin.deposits.proofStatus.none',
  pending: 'admin.deposits.proofStatus.pending',
  approved: 'admin.deposits.proofStatus.approved',
  rejected: 'admin.deposits.proofStatus.rejected',
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

function depositCurrency(method: DepositMethod): string {
  return method === 'crypto' ? 'USDT' : 'KRW';
}

function depositStatusState(status: DepositStatus): MoneyStatusState {
  if (status === 'confirming' || status === 'pending_review') return 'reviewing';
  if (status === 'complete') return 'settled';
  if (status === 'failed') return 'failed';
  return 'pending';
}

function proofStatusState(status: DepositProofStatus): MoneyStatusState {
  if (status === 'pending') return 'reviewing';
  if (status === 'approved') return 'settled';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function isActionableDeposit(status: DepositStatus): boolean {
  return status === 'pending' || status === 'confirming' || status === 'pending_review';
}

function pendingDeposits(rows: AdminDepositReconRow[]): AdminDepositReconRow[] {
  return rows.filter((row) => isActionableDeposit(row.status));
}

/** Admin deposit recon desk (`/deposits`) — match/flag + E10 KRW proof review (§29.2). */
export function AdminDepositsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    deposits,
    filteredDeposits,
    depositFilters,
    setDepositFilters,
    matchDeposit,
    flagDeposit,
    reviewKrwDepositProof,
    getKrwDepositProofUrl,
  } = useAdminWalletDesk();

  const [methodTab, setMethodTab] = useState<MethodTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [actionTarget, setActionTarget] = useState<DepositActionTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false);
  const [proofPreviewLoading, setProofPreviewLoading] = useState(false);

  const pendingRows = useMemo(() => pendingDeposits(deposits), [deposits]);
  const pendingProofCount = useMemo(
    () => pendingRows.filter((row) => isAdminKrwProofPending(row.proofStatus)).length,
    [pendingRows],
  );

  const methodCounts = useMemo(() => {
    const counts: Record<MethodTab, number> = {
      all: pendingRows.length,
      krw: 0,
      crypto: 0,
      giftcard: 0,
    };
    for (const row of pendingRows) {
      counts[row.method] += 1;
    }
    return counts;
  }, [pendingRows]);

  const visibleRows = useMemo(() => {
    const base = filteredDeposits.filter((row) => isActionableDeposit(row.status));
    if (methodTab === 'all') return base;
    return base.filter((row) => row.method === methodTab);
  }, [filteredDeposits, methodTab]);

  const openAction = (target: DepositActionTarget) => {
    setActionTarget(target);
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!actionTarget) return false;
    setActionLoading(true);
    try {
      if (actionTarget.kind === 'flag') {
        return await flagDeposit(actionTarget.id, reason);
      }
      if (actionTarget.kind === 'approveProof') {
        return await reviewKrwDepositProof(actionTarget.id, 'approved', reason);
      }
      return await matchDeposit(actionTarget.id, reason);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewProof = async (row: AdminDepositReconRow) => {
    if (!row.proofPath) return;
    setProofPreviewLoading(true);
    setProofPreviewOpen(true);
    try {
      const url = await getKrwDepositProofUrl(row.proofPath);
      setProofPreviewUrl(url);
    } finally {
      setProofPreviewLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 600);
  };

  const formatRowSummary = (row: AdminDepositReconRow) =>
    `${row.userId} · ${formatAmountString(row.amount, depositCurrency(row.method))} · ${t(METHOD_FILTER_KEYS[row.method])}`;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.deposits')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {pendingRows.length > 0
              ? t('admin.deposits.summary.pending', { count: pendingRows.length })
              : t('admin.overview.empty.title')}
          </p>
          {pendingProofCount > 0 ? (
            <p className="text-foreground-muted m-0 text-sm">
              {t('admin.deposits.summary.proofPending', { count: pendingProofCount })}
            </p>
          ) : null}
          <p className="text-foreground-muted m-0 text-sm">{t('admin.deposits.description')}</p>
        </div>
        <Button
          variant="outline"
          size="md"
          loading={refreshing}
          onClick={handleRefresh}
          className="shrink-0"
        >
          <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
          {t('admin.overview.action.refresh')}
        </Button>
      </section>

      <HowItWorks
        persistenceId="admin-deposits"
        titleKey="admin.help.deposits.title"
        stepKeys={[
          'admin.help.deposits.step1',
          'admin.help.deposits.step2',
          'admin.help.deposits.step3',
        ]}
      />

      <section aria-labelledby="admin-deposits-metrics-heading">
        <h3 id="admin-deposits-metrics-heading" className="sr-only">
          {t('admin.nav.deposits')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label={t('admin.deposits.filter.all')}
            value={String(methodCounts.all)}
            emphasis={methodCounts.all > 0}
          />
          <MetricCard
            label={t('admin.wallet.depositRecon.filter.method.krw')}
            value={String(methodCounts.krw)}
            emphasis={methodCounts.krw > 0}
          />
          <MetricCard
            label={t('admin.wallet.depositRecon.filter.method.crypto')}
            value={String(methodCounts.crypto)}
            emphasis={methodCounts.crypto > 0}
          />
          <MetricCard
            label={t('admin.wallet.depositRecon.filter.method.giftcard')}
            value={String(methodCounts.giftcard)}
            emphasis={methodCounts.giftcard > 0}
          />
        </div>
      </section>

      {pendingRows.length === 0 ? (
        <EmptyState
          title={t('admin.overview.empty.title')}
          description={t('admin.wallet.depositRecon.empty')}
          actionLabel={t('admin.deposits.empty.cta')}
          onAction={() => {
            goTo('/queues');
          }}
        />
      ) : (
        <Tabs value={methodTab} onValueChange={(value: string) => setMethodTab(value as MethodTab)}>
          <TabsList className="w-full flex-wrap justify-start">
            <TabsTrigger value="all">
              {t('admin.deposits.filter.all')} ({methodCounts.all})
            </TabsTrigger>
            <TabsTrigger value="krw">
              {t('admin.wallet.depositRecon.filter.method.krw')} ({methodCounts.krw})
            </TabsTrigger>
            <TabsTrigger value="crypto">
              {t('admin.wallet.depositRecon.filter.method.crypto')} ({methodCounts.crypto})
            </TabsTrigger>
            <TabsTrigger value="giftcard">
              {t('admin.wallet.depositRecon.filter.method.giftcard')} ({methodCounts.giftcard})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={methodTab}>
            <section className="space-y-3">
              <Input
                value={depositFilters.search}
                onChange={(event) =>
                  setDepositFilters((prev) => ({ ...prev, search: event.target.value }))
                }
                placeholder={t('admin.wallet.depositRecon.filter.search.placeholder')}
                aria-label={t('admin.wallet.depositRecon.filter.search.placeholder')}
                className="max-w-md"
              />

              <AdminTable
                columns={[
                  {
                    id: 'details',
                    header: t('admin.queues.col.details'),
                    cell: ({ row }) => row.userId,
                    meta: { className: 'text-foreground-muted tabular-nums' },
                  },
                  {
                    id: 'amount',
                    header: t('admin.queues.col.amount'),
                    cell: ({ row }) => formatAmountString(row.amount, depositCurrency(row.method)),
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'method',
                    header: t('admin.deposits.col.method'),
                    cell: ({ row }) => t(METHOD_FILTER_KEYS[row.method]),
                    meta: { className: 'text-foreground-muted' },
                  },
                  {
                    id: 'reference',
                    header: t('admin.wallet.depositRecon.col.reference'),
                    cell: ({ row }) => row.reference ?? '—',
                    meta: { className: 'text-foreground-muted max-w-48 truncate' },
                  },
                  {
                    id: 'proof',
                    header: t('admin.deposits.col.proof'),
                    cell: ({ row }) => {
                      if (row.method !== 'krw') return '—';
                      const status = row.proofStatus ?? 'none';
                      if (status === 'none') {
                        return (
                          <span className="text-foreground-muted">
                            {t(PROOF_STATUS_LABEL_KEYS.none)}
                          </span>
                        );
                      }
                      return <StatusBadge state={proofStatusState(status)} />;
                    },
                  },
                  {
                    id: 'status',
                    header: t('admin.queues.col.status'),
                    cell: ({ row }) => <StatusBadge state={depositStatusState(row.status)} />,
                  },
                  {
                    id: 'created',
                    header: t('admin.queues.col.created'),
                    cell: ({ row }) => formatWhen(row.createdAt, locale),
                    meta: { className: 'text-foreground-muted tabular-nums' },
                  },
                ]}
                rows={visibleRows}
                getRowId={(row) => row.id}
                minWidth={860}
                empty={
                  <EmptyState
                    title={t('admin.overview.empty.title')}
                    description={t('admin.wallet.depositRecon.empty')}
                    actionLabel={t('admin.deposits.empty.cta')}
                    onAction={() => {
                      goTo('/queues');
                    }}
                  />
                }
                rowActionsHeader={t('admin.queues.col.action')}
                rowActions={(row) => {
                  const matchConfig = MATCH_ACTION_KEYS[row.method];
                  const canViewProof = isAdminKrwProofViewable(row.proofStatus, row.proofPath);
                  const canReviewProof = isAdminKrwProofPending(row.proofStatus);
                  return (
                    <>
                      {canViewProof ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={proofPreviewLoading}
                          onClick={() => {
                            void handleViewProof(row);
                          }}
                        >
                          {t('admin.deposits.action.viewProof')}
                        </Button>
                      ) : null}
                      {canReviewProof ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            openAction({
                              kind: 'approveProof',
                              id: row.id,
                              titleKey: 'admin.deposits.dialog.approveProof',
                              confirmKey: 'admin.deposits.action.approveProof',
                              summary: [
                                formatRowSummary(row),
                                t('admin.deposits.proof.noCreditNotice'),
                              ].join('\n'),
                            })
                          }
                        >
                          {t('admin.deposits.action.approveProof')}
                        </Button>
                      ) : null}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          openAction({
                            kind: matchConfig.kind,
                            id: row.id,
                            titleKey: matchConfig.dialog,
                            confirmKey: matchConfig.action,
                            summary: formatRowSummary(row),
                          })
                        }
                      >
                        {t(matchConfig.action)}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openAction({
                            kind: 'flag',
                            id: row.id,
                            titleKey: 'admin.deposits.dialog.flag',
                            confirmKey: 'admin.deposits.action.flag',
                            destructive: true,
                            summary: formatRowSummary(row),
                          })
                        }
                      >
                        {t('admin.deposits.action.flag')}
                      </Button>
                    </>
                  );
                }}
              />
            </section>
          </TabsContent>
        </Tabs>
      )}

      <AdminQueueActionDialog
        open={actionTarget !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setActionTarget(null);
        }}
        titleKey={actionTarget?.titleKey ?? 'admin.deposits.dialog.flag'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.deposits.action.flag'}
        destructive={actionTarget?.destructive}
        loading={actionLoading}
        summary={
          actionTarget ? (
            <p className="m-0 whitespace-pre-line">{actionTarget.summary}</p>
          ) : undefined
        }
        onSubmit={handleActionSubmit}
      />

      <Dialog
        open={proofPreviewOpen}
        onOpenChange={(open: boolean) => {
          setProofPreviewOpen(open);
          if (!open) setProofPreviewUrl(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.deposits.dialog.viewProof')}</DialogTitle>
            <DialogDescription>{t('admin.deposits.proof.previewHelp')}</DialogDescription>
          </DialogHeader>
          {proofPreviewLoading ? (
            <p className="text-foreground-muted m-0 text-sm">{t('admin.deposits.proof.loading')}</p>
          ) : proofPreviewUrl ? (
            <img
              src={proofPreviewUrl}
              alt={t('admin.deposits.action.viewProof')}
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          ) : (
            <p className="text-foreground-muted m-0 text-sm">{t('admin.deposits.proof.missing')}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <Card className={emphasis ? 'border-warning/40' : undefined}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="tabular-nums text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
