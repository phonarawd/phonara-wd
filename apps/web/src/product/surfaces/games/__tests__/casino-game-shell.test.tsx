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

vi.mock('@/features/casino/use-progressive-round', () => ({
  useProgressiveStart: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useProgressiveStep: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useProgressiveCashout: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => false,
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
    expect(screen.getByTestId('casino-pf-verify-link')).toHaveAttribute(
      'href',
      '/casino/fairness',
    );
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
