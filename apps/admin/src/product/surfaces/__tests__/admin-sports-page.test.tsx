import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminSportsPage } from '@/product/surfaces/admin-sports-page';

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock('@/hooks/admin/useAdminSports', () => ({
  formatKrwGrouped: (value: string) => `₩${value}`,
  useAdminSports: () => ({
    featureEnabled: true,
    fixtures: [
      {
        id: 'fx-001',
        league: 'EPL',
        home: 'Arsenal',
        away: 'Chelsea',
        kickoff: '2026-07-04T12:00:00.000Z',
        unsettledMarkets: 3,
        exposure: '120000',
        status: 'ft',
      },
    ],
    suspended: [],
    risk: [
      {
        id: 're-1',
        severity: 'warn',
        labelKey: 'admin.sports.risk.event.exposureSpike',
        at: '2026-07-04T11:00:00.000Z',
      },
    ],
    exposure: { total: '250000', max: '5000000', openBets: 12 },
    tier: 'B',
    setFeatureEnabled: vi.fn(),
    suspendMarket: vi.fn(),
    unsuspendMarket: vi.fn(),
    settleFixtureQuorum: vi.fn(async () => true),
    voidFixtureMarket: vi.fn(async () => true),
    setSportsRiskTier: vi.fn(async () => true),
    resetForTest: vi.fn(),
  }),
}));

describe('AdminSportsPage', () => {
  it('renders unsettled queue and §29.2 settle, suspend, void actions without gap controls', () => {
    render(
      <I18nProvider>
        <AdminSportsPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText(/미정산 fixture 1건|1 unsettled fixtures/i)).toBeTruthy();

    const fixtureRow = screen.getByText('Arsenal vs Chelsea').closest('tr');
    expect(fixtureRow).toBeTruthy();
    expect(
      within(fixtureRow!).getByRole('button', { name: /스코어 정산|Settle scores/i }),
    ).toBeTruthy();
    expect(
      within(fixtureRow!).getByRole('button', { name: /마켓 중단|Suspend market/i }),
    ).toBeTruthy();
    expect(within(fixtureRow!).getByRole('button', { name: /베팅 무효|Void bets/i })).toBeTruthy();

    expect(screen.getByRole('tab', { name: /리스크 \(1\)|Risk \(1\)/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /운영|Ops/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /위험 등급 설정|Set risk tier/i })).toBeTruthy();

    expect(
      screen.queryByRole('button', {
        name: /수동 승급|Manual tier|미션 저장|Save mission|제재 해제|Clear sanctions/i,
      }),
    ).toBeNull();
  });
});
