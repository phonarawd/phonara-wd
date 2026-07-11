import { act, render, screen, waitFor } from '@testing-library/react';
import { createRef, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { I18nProvider } from '@/product/i18n';
import { CasinoGameShell } from '@/product/surfaces/games/casino-game-shell';
import { CasinoGameStage } from '@/product/surfaces/games/casino-game-stage';
import { GoldRushStage } from '@/product/surfaces/games/gold-rush-stage';
import { MintReelsStage } from '@/product/surfaces/games/mint-reels-stage';
import { MomentumStage } from '@/product/surfaces/games/momentum-stage';
import { PlinkoStage } from '@/product/surfaces/games/plinko-stage';
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

vi.mock('@/product/surfaces/games/use-pixi-stage', () => ({
  usePixiStage: () => ({ ready: false, appRef: { current: null } }),
}));

vi.mock('pixi.js', () => {
  class Graphics {
    clear() {
      return this;
    }
    circle() {
      return this;
    }
    roundRect() {
      return this;
    }
    rect() {
      return this;
    }
    fill() {
      return this;
    }
    stroke() {
      return this;
    }
  }
  class Container {
    addChild() {
      return this;
    }
    destroy() {}
  }
  return { Graphics, Container, Application: class {} };
});

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

describe('Casino games batch C stages (p10-games-batch-c)', () => {
  it('shell mounts plinko Pixi stage (not placeholder)', () => {
    wrap(<CasinoGameShell gameCode="plinko" />);
    expect(screen.getByTestId('casino-game-shell')).toHaveAttribute(
      'data-batch-c-todo',
      'p10-games-batch-c',
    );
    expect(screen.getByTestId('casino-plinko-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-game-stage-placeholder')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-plinko-canvas-host')).toBeInTheDocument();
    expect(screen.getByTestId('casino-selection-rows')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-plinko-live-drop')).not.toBeInTheDocument();
  });

  it('shell mounts mint_reels · gold_rush · momentum stages', () => {
    const { unmount } = wrap(<CasinoGameShell gameCode="mint_reels" />);
    expect(screen.getByTestId('casino-mint-reels-stage')).toBeInTheDocument();
    unmount();

    const { unmount: u2 } = wrap(<CasinoGameShell gameCode="gold_rush" />);
    expect(screen.getByTestId('casino-gold-rush-stage')).toBeInTheDocument();
    expect(screen.getByTestId('casino-gold-rush-meter')).toBeInTheDocument();
    u2();

    wrap(<CasinoGameShell gameCode="momentum" />);
    expect(screen.getByTestId('casino-momentum-stage')).toBeInTheDocument();
    expect(screen.getByTestId('casino-selection-cashOut')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-momentum-live-cashout')).not.toBeInTheDocument();
  });

  it('routes batch-c codes; batch-d codes are outside batch-c', () => {
    const { unmount } = wrap(
      <CasinoGameStage gameCode="plinko" selection={{ rows: 12, risk: 'medium' }} />,
    );
    expect(screen.getByTestId('casino-plinko-stage')).toBeInTheDocument();
    unmount();

    wrap(<CasinoGameStage gameCode="roulette" selection={{ bets: [] }} />);
    // Batch D owns roulette — not a batch-C Pixi stage.
    expect(screen.queryByTestId('casino-plinko-stage')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-roulette-stage')).toBeInTheDocument();
  });

  it('plinko settles bucket mult from RPC path only', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    await act(async () => {
      await handle.current?.playOutcome({
        path: [0, 1, 0, 1, 0, 0, 1, 0],
        bucket: 3,
        bucketMultiplier: '0.9',
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute(
        'data-stage-phase',
        'settled',
      );
    });
    expect(screen.getByTestId('casino-plinko-bucket-mult').textContent).toContain('0.9');
  });

  it('mint_reels shows RPC totalMultiplier after spin', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);
    await act(async () => {
      await handle.current?.playOutcome({ totalMultiplier: 2.5 });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute('data-won', 'true');
    });
    expect(screen.getByTestId('casino-mint-reels-mult').textContent).toContain('2.50');
  });

  it('gold_rush meter fills from RPC totalMultiplier', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome({ totalMultiplier: 12 });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute(
        'data-stage-phase',
        'settled',
      );
    });
    expect(screen.getByTestId('casino-gold-rush-mult').textContent).toContain('12.00');
  });

  it('momentum combo meter settles from RPC', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);
    await act(async () => {
      await handle.current?.playOutcome({
        won: true,
        roll: 70,
        comboBefore: 2,
        comboAfter: 3,
        comboMultiplier: 4.5,
        cashedOut: false,
        totalMultiplier: 0,
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute('data-won', 'true');
    });
    expect(screen.getByTestId('casino-momentum-combo').textContent).toBe('3');
    expect(screen.getByTestId('casino-momentum-mult').textContent).toContain('4.50');
  });
});
