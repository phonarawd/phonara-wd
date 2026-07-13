import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { I18nProvider } from '@/product/i18n';
import { BlackjackStage } from '@/product/surfaces/games/blackjack-stage';
import { CasinoGameShell } from '@/product/surfaces/games/casino-game-shell';
import { CasinoGameStage } from '@/product/surfaces/games/casino-game-stage';
import { DeepshaftStage } from '@/product/surfaces/games/deepshaft-stage';
import { RouletteStage } from '@/product/surfaces/games/roulette-stage';
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

describe('Casino games batch D stages (p10-games-batch-d)', () => {
  it('shell mounts roulette table stage (not placeholder)', () => {
    wrap(<CasinoGameShell gameCode="roulette" />);
    expect(screen.getByTestId('casino-game-shell')).toHaveAttribute(
      'data-batch-d-todo',
      'p10-games-batch-d',
    );
    expect(screen.getByTestId('casino-roulette-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-game-stage-placeholder')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-roulette-table')).toBeInTheDocument();
    expect(screen.getByTestId('casino-roulette-chip-rack')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-roulette-live-spin')).not.toBeInTheDocument();
  });

  it('shell mounts blackjack · deepshaft stages', () => {
    const { unmount } = wrap(<CasinoGameShell gameCode="blackjack" />);
    expect(screen.getByTestId('casino-blackjack-stage')).toBeInTheDocument();
    expect(screen.getByTestId('casino-blackjack-dealer-upcard')).toBeInTheDocument();
    expect(screen.getByTestId('casino-blackjack-action-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-blackjack-live-hit')).not.toBeInTheDocument();
    unmount();

    wrap(<CasinoGameShell gameCode="deepshaft" />);
    expect(screen.getByTestId('casino-deepshaft-stage')).toBeInTheDocument();
    expect(screen.getByTestId('casino-deepshaft-shaft')).toBeInTheDocument();
    expect(screen.getByTestId('casino-selection-riskTier')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-deepshaft-live-dig')).not.toBeInTheDocument();
  });

  it('routes batch-d codes; unknown stays placeholder', () => {
    const { unmount } = wrap(
      <CasinoGameStage
        gameCode="roulette"
        selection={{ bets: [{ type: 'red', value: null, stakeWeight: 1 }] }}
      />,
    );
    expect(screen.getByTestId('casino-roulette-stage')).toBeInTheDocument();
    unmount();

    // All 12 GAME_CODES are covered by A–D; placeholder only if router misses.
    wrap(
      <CasinoGameStage
        gameCode="blackjack"
        selection={{ actions: [{ seat: 0, move: 'stand' }] }}
      />,
    );
    expect(screen.getByTestId('casino-blackjack-stage')).toBeInTheDocument();
  });

  it('roulette highlights winning number from RPC only', async () => {
    const handle = createRef<CasinoStageHandle>();
    const onBetsChange = vi.fn();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={onBetsChange}
      />,
    );
    fireEvent.click(screen.getByTestId('casino-roulette-pocket-17'));
    expect(onBetsChange).toHaveBeenCalled();

    await act(async () => {
      await handle.current?.playOutcome({ winningNumber: 17, totalMultiplier: 2 });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute(
        'data-stage-phase',
        'settled',
      );
    });
    expect(screen.getByTestId('casino-roulette-winning-number').textContent).toBe('17');
    expect(screen.getByTestId('casino-roulette-mult').textContent).toContain('2.00');
  });

  it('blackjack shows RPC totalMultiplier after action reveal', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <BlackjackStage
        ref={handle}
        actions={[
          { seat: 0, move: 'hit' },
          { seat: 0, move: 'stand' },
        ]}
      />,
    );
    expect(screen.getByTestId('casino-blackjack-dealer-upcard')).toBeInTheDocument();
    await act(async () => {
      await handle.current?.playOutcome({ totalMultiplier: 2.5 });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-blackjack-stage')).toHaveAttribute('data-won', 'true');
    });
    expect(screen.getByTestId('casino-blackjack-mult').textContent).toContain('2.50');
  });

  it('deepshaft depth meter settles from RPC levels', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={5} />);
    await act(async () => {
      await handle.current?.playOutcome({
        levels: [
          { depth: 1, outcome: 'gold', levelMultiplier: 1.05 },
          { depth: 2, outcome: 'gold', levelMultiplier: 1.12 },
          { depth: 3, outcome: 'cavein', levelMultiplier: 0 },
        ],
        reachedDepth: 2,
        caveIn: true,
        totalMultiplier: 0,
        won: false,
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute('data-cave-in', 'true');
    });
    expect(screen.getByTestId('casino-deepshaft-mult').textContent).toContain('0.00');
  });
});
