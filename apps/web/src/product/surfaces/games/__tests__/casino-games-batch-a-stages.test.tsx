import { act, render, screen, waitFor } from '@testing-library/react';
import { createRef, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { I18nProvider } from '@/product/i18n';
import { CasinoGameShell } from '@/product/surfaces/games/casino-game-shell';
import { CasinoGameStage } from '@/product/surfaces/games/casino-game-stage';
import { CrashStage } from '@/product/surfaces/games/crash-stage';
import { DiceStage } from '@/product/surfaces/games/dice-stage';
import { LimboStage } from '@/product/surfaces/games/limbo-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

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
  usePrefersReducedMotion: () => true,
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

describe('Casino games batch A stages (p10-games-batch-a)', () => {
  it('shell mounts crash stage + selection fields (not placeholder)', () => {
    wrap(<CasinoGameShell gameCode="crash" />);
    expect(screen.getByTestId('casino-game-shell')).toHaveAttribute(
      'data-batch-a-todo',
      'p10-games-batch-a',
    );
    expect(screen.getByTestId('casino-crash-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-game-stage-placeholder')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-game-selection-fields')).toBeInTheDocument();
    expect(screen.getByTestId('casino-selection-autoCashout')).toBeInTheDocument();
    // §23.2.1 — no live mid-round cash-out control
    expect(screen.queryByTestId('casino-crash-live-cashout')).not.toBeInTheDocument();
  });

  it('routes limbo and dice stages', () => {
    const { unmount } = wrap(
      <CasinoGameStage gameCode="limbo" selection={{ target: '2.00' }} />,
    );
    expect(screen.getByTestId('casino-limbo-stage')).toBeInTheDocument();
    unmount();

    wrap(
      <CasinoGameStage gameCode="dice" selection={{ target: '50.00', direction: 'over' }} />,
    );
    expect(screen.getByTestId('casino-dice-stage')).toBeInTheDocument();
    expect(screen.getByTestId('casino-dice-win-chance')).toBeInTheDocument();
  });

  it('keeps batch-d games on stage placeholder', () => {
    wrap(<CasinoGameStage gameCode="roulette" selection={{}} />);
    expect(screen.getByTestId('casino-game-stage-placeholder')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-crash-stage')).not.toBeInTheDocument();
  });

  it('crash playOutcome settles cashed-out replay from RPC only', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<CrashStage ref={handle} autoCashout="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({
        crashMultiplier: 5,
        cashedOut: true,
        cashoutMultiplier: 2,
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-crash-stage')).toHaveAttribute(
        'data-stage-phase',
        'settled',
      );
    });
    expect(screen.getByTestId('casino-crash-stage')).toHaveAttribute('data-cashed-out', 'true');
    expect(screen.getByTestId('casino-crash-outcome-label')).toBeInTheDocument();
  });

  it('limbo flashes result vs target from RPC', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="3.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 4.25, won: true });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-won', 'true');
    });
    expect(screen.getByTestId('casino-limbo-result').textContent).toContain('4.25');
  });

  it('dice highlights roll on probability bar from RPC', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);
    expect(screen.getByTestId('casino-dice-payout-mult').textContent).toMatch(/×$/);
    await act(async () => {
      await handle.current?.playOutcome({ roll: 72.5, won: true });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-won', 'true');
    });
    expect(screen.getByTestId('casino-dice-roll').textContent).toContain('72.50');
    expect(screen.getByTestId('casino-dice-roll-marker')).toBeInTheDocument();
  });
});
