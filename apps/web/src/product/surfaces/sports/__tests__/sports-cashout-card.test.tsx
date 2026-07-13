import { createElement, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { SportsCashoutCard } from '@/product/surfaces/sports/sports-cashout-card';

const usePreviewMock = vi.hoisted(() => vi.fn());
const useCashoutMock = vi.hoisted(() => vi.fn());
const usePartialPreviewMock = vi.hoisted(() => vi.fn());
const usePartialCashoutMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn(() => ({ session: { user: { id: 'u1' } } })));

vi.mock('@/features/sports/use-sports-betting', () => ({
  usePreviewSportsCashout: (...args: unknown[]) => usePreviewMock(...args),
  useCashoutSportsBet: (...args: unknown[]) => useCashoutMock(...args),
  usePreviewSportsPartialCashout: (...args: unknown[]) => usePartialPreviewMock(...args),
  usePartialCashoutSportsBet: (...args: unknown[]) => usePartialCashoutMock(...args),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: vi.fn() },
}));

function wrap(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, createElement(I18nProvider, null, node));
}

describe('SportsCashoutCard (E22 full + partial cashout UI)', () => {
  beforeEach(() => {
    usePreviewMock.mockReset();
    useCashoutMock.mockReset();
    usePartialPreviewMock.mockReset();
    usePartialCashoutMock.mockReset();
    useCashoutMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    usePartialCashoutMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    usePartialPreviewMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
    });
  });

  it('hides when sportsCashout gate is false', () => {
    usePreviewMock.mockReturnValue({ data: undefined, isLoading: false, isFetching: false });
    render(
      wrap(
        createElement(SportsCashoutCard, {
          betId: 'bet-1',
          betStatus: 'pending',
          currency: 'USDT',
          sportsCashoutGate: false,
          t: (key: string) => key,
        }),
      ),
    );
    expect(screen.queryByTestId('sports-cashout-card')).toBeNull();
  });

  it('renders preview + CTA when gate live and pending', () => {
    usePreviewMock.mockReturnValue({
      data: { cashout_amount: '9.500000', currency: 'USDT' },
      isLoading: false,
      isFetching: false,
    });
    render(
      wrap(
        createElement(SportsCashoutCard, {
          betId: 'bet-1',
          betStatus: 'pending',
          currency: 'USDT',
          sportsCashoutGate: true,
          sportsParityLive: false,
          t: (key: string) => key,
        }),
      ),
    );
    expect(screen.getByTestId('sports-cashout-card')).toBeTruthy();
    expect(screen.getByTestId('sports-cashout-cta')).toBeTruthy();
    expect(screen.queryByTestId('sports-partial-cashout-header')).toBeNull();
  });

  it('renders partial cashout header when sportsParityLive and stake set', () => {
    usePreviewMock.mockReturnValue({
      data: { cashout_amount: '10.000000', currency: 'USDT' },
      isLoading: false,
      isFetching: false,
    });
    usePartialPreviewMock.mockReturnValue({
      data: { cashout_amount: '5.000000', currency: 'USDT', stake_portion: '5.000000' },
      isLoading: false,
      isFetching: false,
    });
    render(
      wrap(
        createElement(SportsCashoutCard, {
          betId: 'bet-1',
          betStatus: 'pending',
          stake: '10.000000',
          currency: 'USDT',
          sportsCashoutGate: true,
          sportsParityLive: true,
          t: (key: string) => key,
        }),
      ),
    );
    expect(screen.getByTestId('sports-partial-cashout-header')).toBeTruthy();
    expect(screen.getByTestId('sports-partial-cashout-cta')).toBeTruthy();
    expect(screen.getByTestId('sports-partial-cashout-percent-50')).toBeTruthy();
  });
});
