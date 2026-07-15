import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactElement, type ReactNode } from 'react';

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

type MockManualBet = {
  bet_id: string;
  status: string;
  payout: string;
  result: Record<string, unknown>;
};

// Real (not vi.fn-static) commitment/bet state — needed for the phase1b-limbo
// manual-bet click-through test below, which must observe the shell's own
// `useEffect` reacting to `pipeline.bet` changing (a static mock object can
// never change, so that effect would never fire). Existing tests never call
// prepareRound/requestBet, so commitment/bet stay at their initial null —
// byte-for-byte the same behavior as the previous static mock for them.
const casinoRoundMock = vi.hoisted(() => ({
  nextBet: null as MockManualBet | null,
}));

vi.mock('@/features/casino/use-casino-round', () => ({
  useCasinoRoundPipeline: () => {
    const [commitment, setCommitment] = useState<{
      round_id: string;
      server_seed_hash: string;
    } | null>(null);
    const [bet, setBet] = useState<MockManualBet | null>(null);
    return {
      commitment,
      bet,
      verificationEvidence: null,
      settledResult: null,
      confirmOpen: false,
      busy: false,
      errorKey: null,
      toastKey: null,
      prepareRound: async () => {
        const round = { round_id: 'round-1', server_seed_hash: 'hash-abc' };
        setCommitment(round);
        return round;
      },
      submitBet: vi.fn(),
      requestBet: async () => {
        if (casinoRoundMock.nextBet) setBet(casinoRoundMock.nextBet);
        return 'placed' as const;
      },
      autoBet: vi.fn(),
      openBetConfirm: vi.fn(),
      cancelBetConfirm: vi.fn(),
      resetRoundState: vi.fn(),
    };
  },
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

type MockLiveCrashRound = { status: string; current_multiplier: string | null };

const liveCrashMock = vi.hoisted(() => ({
  round: null as MockLiveCrashRound | null,
  placeMutateAsync: vi.fn(),
  cashoutMutateAsync: vi.fn(),
}));

vi.mock('@/features/casino/use-live-crash', () => ({
  useLiveCrashCurrent: () => ({ data: { round: liveCrashMock.round }, isLoading: false }),
  useLiveCrashPlaceBet: () => ({ mutateAsync: liveCrashMock.placeMutateAsync, isPending: false }),
  useLiveCrashCashout: () => ({ mutateAsync: liveCrashMock.cashoutMutateAsync, isPending: false }),
}));

// Real, per-test-controllable mutateAsync mocks (not static vi.fn()) — needed
// for the phase1c-mines live click-through tests below, which must drive a
// real start -> step -> step/cashout sequence and assert on each RPC's
// resolved shape, mirroring the liveCrashMock pattern above.
const progressiveMock = vi.hoisted(() => ({
  startMutateAsync: vi.fn(),
  stepMutateAsync: vi.fn(),
  cashoutMutateAsync: vi.fn(),
}));

vi.mock('@/features/casino/use-progressive-round', () => ({
  useProgressiveStart: () => ({ mutateAsync: progressiveMock.startMutateAsync, isPending: false }),
  useProgressiveStep: () => ({ mutateAsync: progressiveMock.stepMutateAsync, isPending: false }),
  useProgressiveCashout: () => ({
    mutateAsync: progressiveMock.cashoutMutateAsync,
    isPending: false,
  }),
}));

// vi.fn (not a plain arrow) so the phase1b-dice describe block below can
// locally override this to `true` — DiceStage's settle path is rAF-driven
// (like Crash's curve), and jsdom does not fire `requestAnimationFrame`
// reliably (see crash-stage.test.tsx / dice-stage.test.tsx), so a click-through
// test that waits for Dice to actually settle needs reduced motion to resolve
// synchronously. Default stays `false` — byte-for-byte the same behavior as
// the previous plain-arrow mock for every other test in this file.
const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

vi.mock('@/features/casino/use-casino-gpu-tier', () => ({
  useCasinoGpuTier: () => 'standard',
}));

vi.mock('@/features/casino/use-casino-connection-status', () => ({
  useCasinoConnectionStatus: () => ({ status: 'subscribed', connected: true, disconnected: false }),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: ReactNode;
      to: string;
      className?: string;
      'data-testid'?: string;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
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
  liveCrashMock.round = null;
  liveCrashMock.placeMutateAsync.mockReset();
  liveCrashMock.cashoutMutateAsync.mockReset();
  casinoRoundMock.nextBet = null;
  usePrefersReducedMotion.mockReturnValue(false);
  progressiveMock.startMutateAsync.mockReset();
  progressiveMock.stepMutateAsync.mockReset();
  progressiveMock.cashoutMutateAsync.mockReset();
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
    expect(screen.getByTestId('casino-game-shell')).toHaveAttribute('data-gpu-tier', 'standard');
    expect(screen.getByTestId('casino-stake-currency')).toBeInTheDocument();
    expect(screen.getByTestId('casino-stake-currency-usdt')).toBeInTheDocument();
    expect(screen.getByTestId('casino-stake-currency-phon')).toBeInTheDocument();
    expect(screen.getByTestId('casino-bet-mode-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('casino-trust-strip')).toBeInTheDocument();
    expect(screen.getByTestId('casino-rtp-badge')).toBeInTheDocument();
    expect(screen.getByTestId('casino-rtp-value')).toHaveTextContent('99.00%');
    expect(screen.getByTestId('casino-connection-status')).toHaveAttribute(
      'data-connection-status',
      'subscribed',
    );
    expect(screen.getByTestId('casino-pf-strip')).toBeInTheDocument();
    expect(screen.getByTestId('casino-pf-verify-link')).toHaveAttribute('href', '/casino/fairness');
    expect(screen.getByTestId('casino-crash-stage')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('casino-bet-mode-auto'));
    expect(screen.getByTestId('casino-auto-bet-panel')).toBeInTheDocument();
    expect(screen.getByTestId('casino-auto-start')).toBeInTheDocument();
  });

  // phase1b-crash functional QA — end-to-end click-through: live bet -> mid-flight
  // cash-out -> RPC-confirmed flash. Proves the shell/router/stage wiring, not just
  // CrashStage in isolation (see crash-stage.test.tsx for the isolated component matrix).
  it('live crash: places a bet, cashes out mid-flight, and shows the RPC-confirmed flash', async () => {
    liveCrashMock.round = { status: 'flying', current_multiplier: '1.35' };
    liveCrashMock.placeMutateAsync.mockResolvedValue({
      bet_id: 'live-bet-1',
      round_id: 'round-1',
      status: 'pending',
      stake: '10',
      currency: 'USDT',
      auto_cashout: '2.00',
    });
    liveCrashMock.cashoutMutateAsync.mockResolvedValue({
      bet_id: 'live-bet-1',
      round_id: 'round-1',
      status: 'won',
      stake: '10',
      currency: 'USDT',
      auto_cashout: '2.00',
      payout: '25',
    });

    wrap(<CasinoGameShell gameCode="crash" />);

    fireEvent.click(screen.getByTestId('casino-play-mode-live'));
    // No active bet yet — control must stay hidden even though the round is flying.
    expect(screen.queryByTestId('casino-crash-live-cashout')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('casino-live-place-bet'));
    await waitFor(() => expect(liveCrashMock.placeMutateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      expect(screen.getByTestId('casino-crash-live-cashout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('casino-crash-live-cashout'));
    await waitFor(() => expect(liveCrashMock.cashoutMutateAsync).toHaveBeenCalledTimes(1));
    expect(liveCrashMock.cashoutMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ betId: 'live-bet-1' }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId('casino-crash-live-cashout')).not.toBeInTheDocument();
    });
    // The flash-triggering effect fires one commit after the settle state lands —
    // assert inside waitFor rather than immediately after the prior wait resolves.
    await waitFor(() => {
      expect(screen.getByTestId('casino-crash-multiplier')).toHaveTextContent('2.50×');
    });
    expect(screen.getByTestId('casino-crash-cashout-flash')).toBeInTheDocument();
    expect(screen.getByTestId('casino-crash-live-cashout-label')).toHaveTextContent('2.50×');
  });
});

// phase1b-limbo functional QA — end-to-end click-through: target set -> prepare
// hash -> place bet -> RPC result renders. Proves the shell/selection-field/stage
// wiring, not just LimboStage in isolation (see limbo-stage.test.tsx for the
// isolated motion-polish + perf matrix).
describe('Limbo manual bet click-through (phase1b-limbo)', () => {
  it('setting the target, preparing the hash, and placing the bet renders the RPC result end-to-end', async () => {
    casinoRoundMock.nextBet = {
      bet_id: 'limbo-bet-1',
      status: 'won',
      payout: '30',
      result: { resultMultiplier: 4.25, won: true },
    };

    wrap(<CasinoGameShell gameCode="limbo" />);

    expect(screen.getByTestId('casino-limbo-stage')).toBeInTheDocument();
    const targetInput = screen.getByTestId('casino-selection-target');
    expect(targetInput).toHaveValue('2.00');
    expect(screen.getByTestId('casino-limbo-target')).toHaveTextContent('2.00×');

    // Target set — a control that visibly responds, not just accepts input.
    fireEvent.change(targetInput, { target: { value: '3.00' } });
    expect(targetInput).toHaveValue('3.00');
    expect(screen.getByTestId('casino-limbo-target')).toHaveTextContent('3.00×');

    // Place Bet stays disabled until a hash commitment exists (no dead click).
    expect(screen.getByTestId('casino-place-bet')).toBeDisabled();
    fireEvent.click(screen.getByTestId('casino-prepare-hash'));
    await waitFor(() => expect(screen.getByTestId('casino-place-bet')).toBeEnabled());

    fireEvent.click(screen.getByTestId('casino-place-bet'));

    await waitFor(() => {
      expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-won', 'true');
    });
    expect(screen.getByTestId('casino-limbo-result')).toHaveTextContent('4.25×');
  });

  it('a losing bet still renders cleanly end-to-end (target unmet does not silently disappear)', async () => {
    casinoRoundMock.nextBet = {
      bet_id: 'limbo-bet-2',
      status: 'lost',
      payout: '0',
      result: { resultMultiplier: 1.42, won: false },
    };

    wrap(<CasinoGameShell gameCode="limbo" />);

    fireEvent.click(screen.getByTestId('casino-prepare-hash'));
    await waitFor(() => expect(screen.getByTestId('casino-place-bet')).toBeEnabled());
    fireEvent.click(screen.getByTestId('casino-place-bet'));

    await waitFor(() => {
      expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-won', 'false');
    });
    expect(screen.getByTestId('casino-limbo-result')).toHaveTextContent('1.42×');
    expect(screen.getByTestId('casino-limbo-result')).toHaveClass('text-danger');
  });
});

// phase1b-dice functional QA — end-to-end click-through: target set -> direction
// toggle (roll-under/over) -> prepare hash -> place bet -> RPC roll result
// renders. Proves the shell/selection-field/stage wiring, not just DiceStage in
// isolation (see dice-stage.test.tsx for the isolated motion-polish + perf matrix).
describe('Dice manual bet click-through (phase1b-dice)', () => {
  beforeEach(() => {
    // DiceStage's settle path is rAF-driven (like Crash's curve) and jsdom does
    // not fire requestAnimationFrame reliably — reduced motion makes settle
    // synchronous so `waitFor` below resolves against a real DOM update rather
    // than an animation frame that never arrives.
    usePrefersReducedMotion.mockReturnValue(true);
  });

  it('setting the target, switching direction, preparing the hash, and placing the bet renders the RPC roll result end-to-end', async () => {
    casinoRoundMock.nextBet = {
      bet_id: 'dice-bet-1',
      status: 'won',
      payout: '19.80',
      result: { roll: 72.5, won: true },
    };

    wrap(<CasinoGameShell gameCode="dice" />);

    expect(screen.getByTestId('casino-dice-stage')).toBeInTheDocument();
    const targetInput = screen.getByTestId('casino-selection-target');
    const directionSelect = screen.getByTestId('casino-selection-direction');
    expect(targetInput).toHaveValue('50.00');
    expect(directionSelect).toHaveValue('over');

    // Target set + direction re-selected — controls that visibly respond, not
    // just accept input (roll-under/over is a <select>, not a hidden field).
    fireEvent.change(targetInput, { target: { value: '60.00' } });
    expect(targetInput).toHaveValue('60.00');
    fireEvent.change(directionSelect, { target: { value: 'over' } });
    expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-direction', 'over');

    // Place Bet stays disabled until a hash commitment exists (no dead click).
    expect(screen.getByTestId('casino-place-bet')).toBeDisabled();
    fireEvent.click(screen.getByTestId('casino-prepare-hash'));
    await waitFor(() => expect(screen.getByTestId('casino-place-bet')).toBeEnabled());

    fireEvent.click(screen.getByTestId('casino-place-bet'));

    await waitFor(() => {
      expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-won', 'true');
    });
    expect(screen.getByTestId('casino-dice-roll')).toHaveTextContent('72.50');
    expect(screen.getByTestId('casino-dice-roll-marker')).toBeInTheDocument();
  });

  it('switching direction to Under and placing a losing bet still renders cleanly end-to-end (roll-under path)', async () => {
    casinoRoundMock.nextBet = {
      bet_id: 'dice-bet-2',
      status: 'lost',
      payout: '0',
      result: { roll: 72.5, won: false },
    };

    wrap(<CasinoGameShell gameCode="dice" />);

    const directionSelect = screen.getByTestId('casino-selection-direction');
    fireEvent.change(directionSelect, { target: { value: 'under' } });
    expect(directionSelect).toHaveValue('under');
    expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-direction', 'under');

    fireEvent.click(screen.getByTestId('casino-prepare-hash'));
    await waitFor(() => expect(screen.getByTestId('casino-place-bet')).toBeEnabled());
    fireEvent.click(screen.getByTestId('casino-place-bet'));

    await waitFor(() => {
      expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-won', 'false');
    });
    expect(screen.getByTestId('casino-dice-roll')).toHaveTextContent('72.50');
    expect(screen.getByTestId('casino-dice-roll')).toHaveClass('text-danger');
  });
});

// phase1c-mines functional QA — end-to-end click-through: live session start
// -> per-cell reveal -> mid-round cash-out / mine hit. Proves the shell/stage
// wiring for the exact live/progressive race this session found and fixed
// (see ParsedMinesOutcome.revealedCells doc + mines-stage.test.tsx), not just
// MinesStage in isolation. Mirrors the live crash click-through above and
// limbo/dice's manual-bet click-through structure for its sibling game.
describe('Mines live click-through (phase1c-mines)', () => {
  function mineSession(overrides: {
    status?: string;
    revealedCells: number[];
    hitMine: boolean;
    minePositions?: number[];
    payout?: string;
  }) {
    return {
      session_id: 'mines-sess-1',
      game: 'mines' as const,
      status: overrides.status ?? 'active',
      currency: 'USDT',
      stake: '10',
      current_multiplier: '1.000000',
      public_state: {
        mineCount: 3,
        revealedCells: overrides.revealedCells,
        hitMine: overrides.hitMine,
        ...(overrides.minePositions ? { minePositions: overrides.minePositions } : {}),
      },
      ...(overrides.payout !== undefined ? { payout: overrides.payout } : {}),
    };
  }

  it('starting a live session clears the oneshot pre-filled tiles instead of leaking a stale "3 picked" display', async () => {
    progressiveMock.startMutateAsync.mockResolvedValue(
      mineSession({ revealedCells: [], hitMine: false }),
    );
    wrap(<CasinoGameShell gameCode="mines" />);

    // Oneshot default selection (game-config.ts) pre-fills cells 0,1,2.
    expect(screen.getByTestId('casino-mines-cell-0')).toHaveAttribute('data-cell-visual', 'picked');
    expect(screen.getByTestId('casino-mines-picked-count')).toHaveTextContent('3/22');

    fireEvent.click(screen.getByTestId('casino-play-mode-live'));
    fireEvent.click(screen.getByTestId('casino-live-place-bet'));
    await waitFor(() => expect(progressiveMock.startMutateAsync).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(screen.getByTestId('casino-mines-picked-count')).toHaveTextContent('0/22');
    });
    expect(screen.getByTestId('casino-mines-cell-0')).toHaveAttribute('data-cell-visual', 'idle');
    expect(screen.getByTestId('casino-mines-cell-1')).toHaveAttribute('data-cell-visual', 'idle');
    expect(screen.getByTestId('casino-mines-cell-2')).toHaveAttribute('data-cell-visual', 'idle');
  });

  it('grid reveal — clicking tiles mid-round steps the live session and shows each as server-confirmed safe', async () => {
    progressiveMock.startMutateAsync.mockResolvedValue(
      mineSession({ revealedCells: [], hitMine: false }),
    );
    progressiveMock.stepMutateAsync.mockResolvedValue(
      mineSession({ revealedCells: [5], hitMine: false }),
    );
    wrap(<CasinoGameShell gameCode="mines" />);

    fireEvent.click(screen.getByTestId('casino-play-mode-live'));
    fireEvent.click(screen.getByTestId('casino-live-place-bet'));
    await waitFor(() => expect(progressiveMock.startMutateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId('casino-mines-cell-5')).toHaveAttribute('data-cell-visual', 'idle'),
    );

    fireEvent.click(screen.getByTestId('casino-mines-cell-5'));
    await waitFor(() => expect(progressiveMock.stepMutateAsync).toHaveBeenCalledTimes(1));
    expect(progressiveMock.stepMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'mines-sess-1',
        action: { cell: 5 },
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('casino-mines-cell-5')).toHaveAttribute('data-cell-visual', 'safe');
    });
    // minesMultiplier(mineCount=3, revealCount=1) = 1.12 — client-preview ladder,
    // same shared engine formula the server settles with (not a client invent).
    expect(screen.getByTestId('casino-mines-cashout-mult')).toHaveTextContent('1.12×');
  });

  it('live cash-out — settles mid-round with the RPC-confirmed payout and hides the cash-out control', async () => {
    progressiveMock.startMutateAsync.mockResolvedValue(
      mineSession({ revealedCells: [], hitMine: false }),
    );
    progressiveMock.stepMutateAsync.mockResolvedValue(
      mineSession({ revealedCells: [5], hitMine: false }),
    );
    progressiveMock.cashoutMutateAsync.mockResolvedValue(
      mineSession({
        status: 'cashed_out',
        revealedCells: [5],
        hitMine: false,
        minePositions: [9, 14, 20],
        payout: '11.20',
      }),
    );
    wrap(<CasinoGameShell gameCode="mines" />);

    fireEvent.click(screen.getByTestId('casino-play-mode-live'));
    fireEvent.click(screen.getByTestId('casino-live-place-bet'));
    await waitFor(() => expect(progressiveMock.startMutateAsync).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByTestId('casino-mines-cell-5'));
    await waitFor(() => {
      expect(screen.getByTestId('casino-mines-cell-5')).toHaveAttribute('data-cell-visual', 'safe');
    });

    fireEvent.click(screen.getByTestId('casino-mines-live-cashout'));
    await waitFor(() => expect(progressiveMock.cashoutMutateAsync).toHaveBeenCalledTimes(1));
    expect(progressiveMock.cashoutMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'mines-sess-1' }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId('casino-mines-live-cashout')).not.toBeInTheDocument();
    });
    // The cash-out control disappears as soon as progressiveSession clears
    // (fast); the stage's own cascade settle is a separate, slightly slower
    // async completion (non-reduced-motion real setTimeout tick) — wait for
    // it explicitly rather than assuming it already landed.
    await waitFor(() => {
      expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-won', 'true');
    });
    expect(screen.getByTestId('casino-mines-cell-5')).toHaveAttribute('data-cell-visual', 'safe');
  });

  it('mine hit — the exact clicked tile that busted the session renders "mine" (not the dim disclosed-mine state), and the cash-out control is hidden', async () => {
    progressiveMock.startMutateAsync.mockResolvedValue(
      mineSession({ revealedCells: [], hitMine: false }),
    );
    progressiveMock.stepMutateAsync
      .mockResolvedValueOnce(mineSession({ revealedCells: [5], hitMine: false }))
      .mockResolvedValueOnce(
        mineSession({
          status: 'busted',
          revealedCells: [5, 9],
          hitMine: true,
          minePositions: [9, 14, 20],
        }),
      );
    wrap(<CasinoGameShell gameCode="mines" />);

    fireEvent.click(screen.getByTestId('casino-play-mode-live'));
    fireEvent.click(screen.getByTestId('casino-live-place-bet'));
    await waitFor(() => expect(progressiveMock.startMutateAsync).toHaveBeenCalledTimes(1));

    // First reveal — safe.
    fireEvent.click(screen.getByTestId('casino-mines-cell-5'));
    await waitFor(() => {
      expect(screen.getByTestId('casino-mines-cell-5')).toHaveAttribute('data-cell-visual', 'safe');
    });

    // Second reveal — hits a mine. This click's own React update to
    // `selection.revealedCells` and the shell's `playOutcome(session.public_state)`
    // call land in the same synchronous continuation (see
    // CasinoGameShell.handleLiveRevealCell) — exactly the one-tick-stale race
    // ParsedMinesOutcome.revealedCells exists to close.
    fireEvent.click(screen.getByTestId('casino-mines-cell-9'));
    await waitFor(() => {
      expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-hit-mine', 'true');
    });
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-mines-cell-9')).toHaveAttribute('data-cell-visual', 'mine');
    expect(screen.getByTestId('casino-mines-cell-5')).toHaveAttribute('data-cell-visual', 'safe');
    expect(screen.getByTestId('casino-mines-cell-14')).toHaveAttribute(
      'data-cell-visual',
      'hidden-mine',
    );
    expect(screen.queryByTestId('casino-mines-live-cashout')).not.toBeInTheDocument();
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
