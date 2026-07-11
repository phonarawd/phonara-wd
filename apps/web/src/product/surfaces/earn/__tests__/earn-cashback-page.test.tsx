import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EarnCashbackPageControllerView } from '@/features/earn/use-earn-cashback-page-controller';
import { I18nProvider } from '@/product/i18n';
import { EarnCashbackPage } from '@/product/surfaces/earn/earn-cashback-page';

const useEarnCashbackPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-earn-cashback-page-controller', () => ({
  useEarnCashbackPageController: useEarnCashbackPageControllerMock,
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
  overrides: Partial<EarnCashbackPageControllerView> = {},
): EarnCashbackPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    currentTier: 'gold',
    currentCashbackKey: 'tier.guide.rows.gold.cashback',
    rows: [
      {
        tier: 'gold',
        tierLabelKey: 'earn.tier.gold',
        thresholdKey: 'tier.guide.rows.gold.threshold',
        cashbackKey: 'tier.guide.rows.gold.cashback',
        cashbackLabelKey: 'tier.guide.rows.gold.cashback',
        withdrawKey: 'tier.guide.rows.gold.withdraw',
        bonusKey: 'tier.guide.rows.gold.bonus',
        supportKey: 'tier.guide.rows.gold.support',
        current: true,
      },
    ],
    ...overrides,
  };
}

function renderPage(engine: EarnCashbackPageControllerView = makeEngine()) {
  useEarnCashbackPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <EarnCashbackPage />
    </I18nProvider>,
  );
}

describe('EarnCashbackPage', () => {
  beforeEach(() => {
    useEarnCashbackPageControllerMock.mockReset();
  });

  it('renders current cashback rate and matrix', () => {
    renderPage();
    expect(screen.getByTestId('earn-cashback-page')).toBeTruthy();
    expect(screen.getByTestId('earn-cashback-current-rate').textContent).toContain(
      'tier.guide.rows.gold.cashback',
    );
    expect(screen.getByTestId('earn-cashback-row-gold')).toHaveAttribute('data-current', 'true');
  });
});
