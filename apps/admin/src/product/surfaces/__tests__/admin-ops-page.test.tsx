import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminOpsPage } from '@/product/surfaces/admin-ops-page';

vi.mock('@/hooks/admin/useAdminOperations', () => ({
  useAdminOperations: () => ({
    health: [
      {
        id: 'oh_cron_liq',
        checkKey: 'cron_liquidation_liveness',
        category: 'cron',
        status: 'ok',
        summary: 'Liquidation cron ran on schedule',
        lastRunAt: '2026-07-04T09:14:00.000Z',
        lastSuccessfulAt: '2026-07-04T09:14:00.000Z',
        observedAt: '2026-07-04T09:14:12.000Z',
      },
      {
        id: 'oh_queue_wd',
        checkKey: 'queue_withdraw_lag',
        category: 'queue',
        status: 'critical',
        summary: 'Withdraw queue lag above threshold',
        lastRunAt: '2026-07-04T09:13:30.000Z',
        observedAt: '2026-07-04T09:14:00.000Z',
        lagSeconds: '182',
      },
    ],
    filteredHealth: [
      {
        id: 'oh_cron_liq',
        checkKey: 'cron_liquidation_liveness',
        category: 'cron',
        status: 'ok',
        summary: 'Liquidation cron ran on schedule',
        lastRunAt: '2026-07-04T09:14:00.000Z',
        lastSuccessfulAt: '2026-07-04T09:14:00.000Z',
        observedAt: '2026-07-04T09:14:12.000Z',
      },
      {
        id: 'oh_queue_wd',
        checkKey: 'queue_withdraw_lag',
        category: 'queue',
        status: 'critical',
        summary: 'Withdraw queue lag above threshold',
        lastRunAt: '2026-07-04T09:13:30.000Z',
        observedAt: '2026-07-04T09:14:00.000Z',
        lagSeconds: '182',
      },
    ],
    healthFilters: { search: '', status: 'all', category: 'all' },
    setHealthFilters: vi.fn(),
    refreshHealth: vi.fn(),
    healthCategories: ['cron', 'queue', 'budget', 'infra'],
    tradeMarkets: [
      {
        symbol: 'PHON_USDT',
        isHalted: false,
        haltReason: null,
        haltedAt: null,
        oraclePrice: '0.010000',
        spotIsActive: true,
        futuresIsActive: null,
      },
      {
        symbol: 'PHONUSDT-PERP',
        isHalted: true,
        haltReason: 'admin:oracle spike review',
        haltedAt: '2026-07-04T08:00:00.000Z',
        oraclePrice: '0.010000',
        spotIsActive: null,
        futuresIsActive: false,
      },
    ],
    confirmHaltTradeMarket: vi.fn(async () => true),
    confirmResumeTradeMarket: vi.fn(async () => true),
  }),
}));

vi.mock('@/hooks/admin/useAdminAuditAlerts', () => ({
  useAdminAuditAlerts: () => ({
    alerts: [
      {
        id: 'alert-1',
        dedupeKey: 'queue_withdraw_lag',
        sourceCheckId: 'queue_withdraw_lag',
        severity: 'critical',
        status: 'open',
        summary: 'Withdraw queue lag above threshold',
        runbookKey: 'ops.queue',
        firstSeenAt: '2026-07-04T09:00:00.000Z',
        lastSeenAt: '2026-07-04T09:13:30.000Z',
        occurrenceCount: 3,
      },
    ],
  }),
}));

function renderOps() {
  return render(
    <I18nProvider>
      <AdminOpsPage />
    </I18nProvider>,
  );
}

describe('AdminOpsPage', () => {
  it('renders §29.2 read-only system health and alert list (no Temporal actions)', () => {
    renderOps();

    expect(screen.getByRole('heading', { level: 2, name: '서비스 ON/OFF' })).toBeInTheDocument();
    expect(screen.getByText(/주의 필요 항목 2건/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument();
    expect(screen.getByText('cron_liquidation_liveness')).toBeInTheDocument();
    expect(screen.getByText('PHON_USDT')).toBeInTheDocument();
    expect(screen.getByText('PHONUSDT-PERP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '거래 재개' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '거래 중지' })).toBeInTheDocument();
    expect(screen.getAllByText('Withdraw queue lag above threshold').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: '알림 확인' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '알림 해결' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Temporal/i)).not.toBeInTheDocument();
  });
});
