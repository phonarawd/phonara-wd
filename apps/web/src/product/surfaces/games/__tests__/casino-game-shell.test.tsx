import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

import { I18nProvider } from '@/product/i18n';
import { CasinoGameShell } from '@/product/surfaces/games/casino-game-shell';
import { WinTierOverlay } from '@/product/surfaces/games/win-tier-overlay';
import { BetModeTabs } from '@/product/surfaces/games/bet-mode-tabs';

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => ({
    wallet: {
      usdt_available: '125.500000',
      phon_available: '1000.000000',
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    session: { user: { id: '00000000-0000-4000-8000-000000000001' } },
    loading: false,
  }),
}));

vi.mock('@/features/casino/use-casino-round', () => ({
  useCasinoRoundPipeline: () => ({
    commitment: null,
    bet: null,
    verificationEvidence: null,
    settledResult: null,
    confirmOpen: false,
    busy: false,
    errorKey: null,
    toastKey: null,
    prepareRound: vi.fn(),
    submitBet: vi.fn(),
    requestBet: vi.fn(),
    autoBet: vi.fn(),
    openBetConfirm: vi.fn(),
    cancelBetConfirm: vi.fn(),
    resetRoundState: vi.fn(),
  }),
}));

vi.mock('@/features/casino/use-casino-fiat-hint', () => ({
  useCasinoFiatHint: () => ({
    targetFiat: 'KRW',
    sessionLocked: false,
    lockedAt: null,
    hintFor: () => ({
      displayOnly: true,
      formattedHint: '',
      targetFiat: 'OFF',
      asOf: '',
      stale: false,
      disabled: true,
      sourceCurrency: 'USDT',
    }),
    lockSession: vi.fn(),
    unlockSession: vi.fn(),
    showDisclaimer: false,
  }),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => false,
}));

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  };
});

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>{ui}</I18nProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('CasinoGameShell (p10-casino-replay-and-infra)', () => {
  it('renders shell chrome with USDT/PHON toggle, AutoBet tabs, and PF strip', () => {
    wrap(<CasinoGameShell gameCode="crash" />);

    expect(screen.getByTestId('casino-game-shell')).toHaveAttribute(
      'data-owner-todo',
      'p10-casino-replay-and-infra',
    );
    expect(screen.getByTestId('casino-game-shell')).toHaveAttribute(
      'data-fiat-hint-todo',
      'p10-casino-fiat-hint-session-lock',
    );
    expect(screen.getByTestId('casino-game-shell')).toHaveAttribute(
      'data-casino-fiat-session-locked',
      'false',
    );
    expect(screen.getByTestId('casino-game-shell')).toHaveAttribute(
      'data-stake-currency-exposure',
      'live',
    );
    expect(screen.getByTestId('casino-stake-currency')).toBeInTheDocument();
    expect(screen.getByTestId('casino-stake-currency-usdt')).toBeInTheDocument();
    expect(screen.getByTestId('casino-stake-currency-phon')).toBeInTheDocument();
    expect(screen.getByTestId('casino-bet-mode-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('casino-pf-strip')).toBeInTheDocument();
    expect(screen.getByTestId('casino-game-stage-placeholder')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('casino-bet-mode-auto'));
    expect(screen.getByTestId('casino-auto-bet-panel')).toBeInTheDocument();
    expect(screen.getByTestId('casino-auto-start')).toBeInTheDocument();
  });
});

describe('WinTierOverlay (p10-casino-replay-and-infra)', () => {
  it('shows Skip for big tier and calls onSkip', () => {
    const onSkip = vi.fn();
    wrap(
      <WinTierOverlay tier="big" payout="250" multiplier="25.00" currency="USDT" onSkip={onSkip} />,
    );
    expect(screen.getByTestId('casino-win-tier-overlay')).toHaveAttribute('data-win-tier', 'big');
    fireEvent.click(screen.getByTestId('casino-win-tier-skip'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('hides overlay for small tier', () => {
    wrap(
      <WinTierOverlay
        tier="small"
        payout="12"
        multiplier="1.20"
        currency="USDT"
        onSkip={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('casino-win-tier-overlay')).not.toBeInTheDocument();
  });
});

describe('BetModeTabs', () => {
  it('switches manual/auto equally', () => {
    const onChange = vi.fn();
    wrap(<BetModeTabs mode="manual" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('casino-bet-mode-auto'));
    expect(onChange).toHaveBeenCalledWith('auto');
  });
});
