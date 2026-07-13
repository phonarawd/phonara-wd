import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EarnPlayPageControllerView } from '@/features/earn/use-earn-play-page-controller';
import { I18nProvider } from '@/product/i18n';
import { EarnPlayPage } from '@/product/surfaces/earn/earn-play-page';

const useEarnPlayPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-earn-play-page-controller', () => ({
  useEarnPlayPageController: useEarnPlayPageControllerMock,
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
  overrides: Partial<EarnPlayPageControllerView> = {},
): EarnPlayPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    quota: { remaining: 1, used: 0, max: 1 },
    lastSpin: null,
    spinBlocked: false,
    spinning: false,
    quotaLabel: '1/1',
    spinRoulette: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: EarnPlayPageControllerView = makeEngine()) {
  useEarnPlayPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <EarnPlayPage />
    </I18nProvider>,
  );
}

describe('EarnPlayPage', () => {
  beforeEach(() => {
    useEarnPlayPageControllerMock.mockReset();
  });

  it('renders free roulette spin CTA', () => {
    const spinRoulette = vi.fn();
    renderPage(makeEngine({ spinRoulette }));
    expect(screen.getByTestId('earn-play-page')).toBeTruthy();
    fireEvent.click(screen.getByTestId('earn-play-spin'));
    expect(spinRoulette).toHaveBeenCalledTimes(1);
  });
});
