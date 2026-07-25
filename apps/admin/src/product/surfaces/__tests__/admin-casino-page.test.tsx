import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/product/i18n';
import { AdminCasinoPage } from '@/product/surfaces/admin-casino-page';

const ackRtpReview = vi.fn(async () => true);
const resolveRtpReview = vi.fn(async () => true);

vi.mock('@/hooks/admin/useAdminCasinoDesk', () => ({
  useAdminCasinoDesk: () => ({
    filteredCatalog: [
      {
        id: 'game-1',
        labelKey: 'admin.casino.catalog.game.crash',
        status: 'live',
        rtpConfigured: '99',
        bets24h: '4',
      },
    ],
    filteredRtpReviews: [
      {
        id: 'rtp-1',
        labelKey: 'admin.casino.catalog.game.crash',
        status: 'open',
        driftPct: '1.2',
        sampleSize: '100',
      },
    ],
    setGameStatus: vi.fn(() => true),
    ackRtpReview,
    resolveRtpReview,
    refresh: vi.fn(async () => undefined),
  }),
}));

/** Keep both tab panels mounted so RTP row actions are queryable in jsdom. */
vi.mock('@/product/primitives/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children, ...props }: { children: React.ReactNode; 'aria-label'?: string }) => (
    <div role="tablist" aria-label={props['aria-label']}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button type="button" role="tab">
      {children}
      <span className="sr-only">{value}</span>
    </button>
  ),
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('AdminCasinoPage', () => {
  it('renders catalog tab and game status control', () => {
    render(
      <I18nProvider>
        <AdminCasinoPage />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('button', { name: /정비|Maintenance/i })).toBeTruthy();
  });

  it('opens RTP ack confirm dialog instead of fire-and-forget click', () => {
    render(
      <I18nProvider>
        <AdminCasinoPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /확인|Ack/i }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(ackRtpReview).not.toHaveBeenCalled();
  });
});
