import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { I18nProvider } from '@/product/i18n';
import { CasinoGameShell } from '@/product/surfaces/games/casino-game-shell';
import { CasinoGameStage } from '@/product/surfaces/games/casino-game-stage';
import { HiloStage } from '@/product/surfaces/games/hilo-stage';
import { MinesStage } from '@/product/surfaces/games/mines-stage';
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

vi.mock('@/features/casino/use-live-crash', () => ({
  useLiveCrashCurrent: () => ({ data: { round: null }, isLoading: false }),
  useLiveCrashPlaceBet: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLiveCrashCashout: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/features/casino/use-progressive-round', () => ({
  useProgressiveStart: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useProgressiveStep: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useProgressiveCashout: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

describe('Casino games batch B stages (p10-games-batch-b)', () => {
  it('shell mounts mines stage + grid a11y (not placeholder)', () => {
    wrap(<CasinoGameShell gameCode="mines" />);
    expect(screen.getByTestId('casino-game-shell')).toHaveAttribute(
      'data-batch-b-todo',
      'p10-games-batch-b',
    );
    expect(screen.getByTestId('casino-mines-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-game-stage-placeholder')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-mines-grid')).toBeInTheDocument();
    expect(screen.getByTestId('casino-mines-cell-0')).toHaveClass('min-h-12');
    expect(screen.getByTestId('casino-selection-mineCount')).toBeInTheDocument();
    // Default oneshot — progressive cash-out hidden until live session
    expect(screen.queryByTestId('casino-mines-live-cashout')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-play-mode')).toBeInTheDocument();
  });

  it('mines liveMode shows mid-round cash-out when session active', () => {
    wrap(
      <MinesStage
        mineCount={3}
        revealedCells={[0]}
        liveMode
        liveSessionActive
        onLiveCashout={() => undefined}
      />,
    );
    expect(screen.getByTestId('casino-mines-live-cashout')).toBeInTheDocument();
  });

  it('shell mounts hilo stage with HI/LO thumbs 48px+', () => {
    wrap(<CasinoGameShell gameCode="hilo" />);
    expect(screen.getByTestId('casino-hilo-stage')).toBeInTheDocument();
    expect(screen.getByTestId('casino-hilo-card-hero')).toBeInTheDocument();
    expect(screen.getByTestId('casino-hilo-streak-chip')).toBeInTheDocument();
    expect(screen.getByTestId('casino-hilo-guess-higher')).toHaveClass('min-h-12');
    expect(screen.getByTestId('casino-hilo-guess-lower')).toHaveClass('min-h-12');
    expect(screen.queryByTestId('casino-game-stage-placeholder')).not.toBeInTheDocument();
  });

  it('routes mines and hilo; roulette stays placeholder', () => {
    const { unmount } = wrap(
      <CasinoGameStage gameCode="mines" selection={{ mineCount: 3, revealedCells: [0, 1] }} />,
    );
    expect(screen.getByTestId('casino-mines-stage')).toBeInTheDocument();
    unmount();

    wrap(<CasinoGameStage gameCode="hilo" selection={{ startCard: 7, guesses: ['higher'] }} />);
    expect(screen.getByTestId('casino-hilo-stage')).toBeInTheDocument();
    expect(screen.getByTestId('casino-hilo-card-hero').textContent).toBe('7');
  });

  it('mines cascade settles from RPC only', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0, 1, 2]} />);
    await act(async () => {
      await handle.current?.playOutcome({
        minePositions: [6, 8, 10],
        hitMine: false,
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute(
        'data-stage-phase',
        'settled',
      );
    });
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-mines-cell-0')).toHaveAttribute('data-cell-visual', 'safe');
  });

  it('mines hitMine marks revealed mine tile from RPC', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0, 6]} />);
    await act(async () => {
      await handle.current?.playOutcome({
        minePositions: [6, 0, 4],
        hitMine: true,
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-hit-mine', 'true');
    });
    expect(screen.getByTestId('casino-mines-cell-0')).toHaveAttribute('data-cell-visual', 'mine');
  });

  it('hilo flips cards from RPC and shows streak queue', async () => {
    const onGuessesChange = vi.fn();
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <HiloStage
        ref={handle}
        startCard={7}
        guesses={['higher']}
        onGuessesChange={onGuessesChange}
      />,
    );
    expect(screen.getByTestId('casino-hilo-guess-queue')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('casino-hilo-guess-lower'));
    expect(onGuessesChange).toHaveBeenCalledWith(['higher', 'lower']);

    await act(async () => {
      await handle.current?.playOutcome({
        cards: [7, 3],
        rounds: [{ card: 7, guess: 'higher', correct: false, multiplier: 0 }],
        won: false,
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-won', 'false');
    });
    expect(screen.getByTestId('casino-hilo-card-hero').textContent).toBe('3');
  });
});
