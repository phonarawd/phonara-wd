import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TierBenefitsPageControllerView } from '@/features/earn/use-tier-benefits-page-controller';
import { I18nProvider } from '@/product/i18n';
import { TierBenefitsPage } from '@/product/surfaces/tier/tier-benefits-page';

const useTierBenefitsPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-tier-benefits-page-controller', () => ({
  useTierBenefitsPageController: useTierBenefitsPageControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function makeEngine(
  overrides: Partial<TierBenefitsPageControllerView> = {},
): TierBenefitsPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    currentTier: 'silver',
    tierSnapshot: { tier: 'silver', xp: 42000, nextTierXp: 100000 },
    narrativeSteps: [
      {
        id: 'missions',
        titleKey: 'tier.benefits.narrative.missions.title',
        bodyKey: 'tier.benefits.narrative.missions.body',
        route: '/home/missions',
      },
      {
        id: 'wallet',
        titleKey: 'tier.benefits.narrative.wallet.title',
        bodyKey: 'tier.benefits.narrative.wallet.body',
        route: '/wallet',
      },
      {
        id: 'referral',
        titleKey: 'tier.benefits.narrative.referral.title',
        bodyKey: 'tier.benefits.narrative.referral.body',
        route: '/referral',
      },
    ],
    benefitRows: [
      {
        tier: 'bronze',
        tierLabelKey: 'earn.tier.bronze',
        thresholdKey: 'tier.guide.rows.bronze.threshold',
        cashbackKey: 'tier.guide.rows.bronze.cashback',
        withdrawKey: 'tier.guide.rows.bronze.withdraw',
        bonusKey: 'tier.guide.rows.bronze.bonus',
        supportKey: 'tier.guide.rows.bronze.support',
        current: false,
      },
      {
        tier: 'silver',
        tierLabelKey: 'earn.tier.silver',
        thresholdKey: 'tier.guide.rows.silver.threshold',
        cashbackKey: 'tier.guide.rows.silver.cashback',
        withdrawKey: 'tier.guide.rows.silver.withdraw',
        bonusKey: 'tier.guide.rows.silver.bonus',
        supportKey: 'tier.guide.rows.silver.support',
        current: true,
      },
    ],
    visibleColumns: [
      { id: 'threshold', engine: 'exists', labelKey: 'tier.guide.table.threshold' },
      { id: 'cashback', engine: 'exists', labelKey: 'tier.guide.table.cashback' },
      { id: 'withdraw', engine: 'exists', labelKey: 'tier.guide.table.withdraw' },
      { id: 'bonus', engine: 'exists', labelKey: 'tier.guide.table.bonus' },
      { id: 'support', engine: 'exists', labelKey: 'tier.guide.table.support' },
    ],
    decayPolicies: [
      {
        tier: 'silver',
        tierLabelKey: 'earn.tier.silver',
        conditionKey: 'tier.guide.decay.silver.condition',
        maintenanceWindowDays: 45,
      },
    ],
    ...overrides,
  };
}

function renderPage(engine: TierBenefitsPageControllerView = makeEngine()) {
  useTierBenefitsPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <TierBenefitsPage />
    </I18nProvider>,
  );
}

describe('TierBenefitsPage', () => {
  beforeEach(() => {
    useTierBenefitsPageControllerMock.mockReset();
  });

  it('renders loading skeleton', () => {
    renderPage(makeEngine({ loading: true }));
    expect(screen.getByTestId('tier-benefits-loading')).toBeInTheDocument();
  });

  it('renders narrative, matrix, decay policy, and me link', () => {
    renderPage();
    expect(screen.getByTestId('tier-benefits-page')).toBeInTheDocument();
    expect(screen.getByTestId('tier-benefits-narrative')).toBeInTheDocument();
    expect(screen.getByTestId('tier-benefits-narrative-rpc')).toBeInTheDocument();
    expect(screen.getByTestId('tier-benefits-narrative-step-missions')).toHaveAttribute(
      'href',
      '/home/missions',
    );
    expect(screen.getByTestId('tier-benefits-narrative-step-wallet')).toHaveAttribute(
      'href',
      '/wallet',
    );
    expect(screen.getByTestId('tier-benefits-narrative-step-referral')).toHaveAttribute(
      'href',
      '/referral',
    );
    expect(screen.getByTestId('tier-benefits-matrix')).toBeInTheDocument();
    expect(screen.getByTestId('tier-benefits-decay')).toBeInTheDocument();
    expect(screen.getByTestId('tier-benefits-faq')).toBeInTheDocument();
    expect(screen.getByTestId('tier-benefits-current-badge')).toBeInTheDocument();
    expect(screen.getByTestId('tier-benefits-row-silver')).toBeInTheDocument();
    expect(screen.getByTestId('tier-benefits-me-link')).toHaveAttribute('href', '/tier/me');
  });
});
