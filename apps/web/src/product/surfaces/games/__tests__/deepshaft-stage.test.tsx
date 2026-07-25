/**
 * Deepshaft — Phase 1C functional QA + quantified motion polish + perf check
 * (phase1c-deepshaft / resume-phase1c-deepshaft).
 *
 * Covers what casino-games-batch-d-stages.test.tsx does not: win vs cave-in
 * motion token wiring (reveal-in / number-pop / cashout-flash), unmount cleanup
 * for the recursive descent setTimeout chain, and reduced-motion collapse.
 * Mirrors limbo-stage.test.tsx / hilo-stage.test.tsx for sibling games.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { DeepshaftStage } from '@/product/surfaces/games/deepshaft-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

const WIN_OUTCOME = {
  levels: [
    { depth: 1, outcome: 'gold' as const, levelMultiplier: 1.05 },
    { depth: 2, outcome: 'gold' as const, levelMultiplier: 1.12 },
    { depth: 3, outcome: 'gold' as const, levelMultiplier: 1.25 },
  ],
  reachedDepth: 3,
  caveIn: false,
  totalMultiplier: 2.45,
  won: true,
};

const CAVEIN_OUTCOME = {
  levels: [
    { depth: 1, outcome: 'gold' as const, levelMultiplier: 1.05 },
    { depth: 2, outcome: 'cavein' as const, levelMultiplier: 0 },
  ],
  reachedDepth: 1,
  caveIn: true,
  totalMultiplier: 0,
  won: false,
};

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  usePrefersReducedMotion.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DeepshaftStage functional QA — descend replay + settle (phase1c-deepshaft)', () => {
  it('shows risk/target and prepare copy before any bet', () => {
    wrap(<DeepshaftStage riskTier="standard" targetDepth={5} />);
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-deepshaft-target')).toHaveTextContent('5');
    expect(screen.getByTestId('casino-deepshaft-depth-label')).toHaveTextContent('0/15');
    expect(screen.queryByTestId('casino-deepshaft-status')).not.toBeInTheDocument();
  });

  it('a decisive win settles depth meter, status, and multiplier from the RPC result', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute('data-cave-in', 'false');
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute(
      'data-stage-phase',
      'settled',
    );
    expect(screen.getByTestId('casino-deepshaft-status')).toHaveTextContent('인양 성공');
    expect(screen.getByTestId('casino-deepshaft-mult')).toHaveTextContent('2.45×');
    expect(screen.getByTestId('casino-deepshaft-level-3')).toHaveAttribute('data-reached', 'true');
  });

  it('a cave-in settles with danger tone, cave-in flag, and 0.00× — no live dig mid-round', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="deep" targetDepth={8} />);
    await act(async () => {
      await handle.current?.playOutcome(CAVEIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute('data-cave-in', 'true');
    expect(screen.getByTestId('casino-deepshaft-status')).toHaveTextContent('붕괴');
    expect(screen.getByTestId('casino-deepshaft-mult')).toHaveTextContent('0.00×');
    // Single-shot by design — no live dig / cash-out controls on this stage.
    expect(screen.queryByTestId('casino-deepshaft-live-dig')).not.toBeInTheDocument();
    expect(screen.queryByTestId('casino-deepshaft-cashout')).not.toBeInTheDocument();
  });

  it('ignores a malformed RPC result instead of corrupting idle state', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="safe" targetDepth={4} />);
    await act(async () => {
      await handle.current?.playOutcome({ won: true, caveIn: false });
    });
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-deepshaft-stage')).not.toHaveAttribute('data-won');
    expect(screen.queryByTestId('casino-deepshaft-status')).not.toBeInTheDocument();
  });

  it('reset() clears a settled round back to idle for the next bet', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-deepshaft-stage')).not.toHaveAttribute('data-won');
    expect(screen.queryByTestId('casino-deepshaft-status')).not.toBeInTheDocument();
  });

  it('descent replay advances visible depth before settle (levels light up in order)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);
    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute(
      'data-stage-phase',
      'replaying',
    );
    await waitFor(() => {
      expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute(
        'data-stage-phase',
        'settled',
      );
    });
    expect(screen.getByTestId('casino-deepshaft-level-1')).toHaveAttribute('data-reached', 'true');
    expect(screen.getByTestId('casino-deepshaft-level-2')).toHaveAttribute('data-reached', 'true');
    expect(screen.getByTestId('casino-deepshaft-level-3')).toHaveAttribute('data-reached', 'true');
  });
});

describe('DeepshaftStage quantified motion polish — punchy win / calm cave-in (phase1c-deepshaft)', () => {
  it('a win gets reveal-in, number-pop, and cashout-flash together', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const mult = screen.getByTestId('casino-deepshaft-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-deepshaft-win-flash')).toBeInTheDocument();
    expect(screen.getByTestId('casino-deepshaft-status')).toHaveClass('ds-casino-reveal-in');
  });

  it('a cave-in gets only calm reveal-in — no pop, no glow (CASINO_UX_CANON: lose is respectful)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="deep" targetDepth={8} />);
    await act(async () => {
      await handle.current?.playOutcome(CAVEIN_OUTCOME);
    });
    const mult = screen.getByTestId('casino-deepshaft-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-deepshaft-win-flash')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-deepshaft-status')).toHaveClass('ds-casino-reveal-in');
  });

  it('reduced motion still shows the correct win but skips every animation class', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-deepshaft-stage')).toHaveAttribute('data-won', 'true');
    const mult = screen.getByTestId('casino-deepshaft-mult');
    expect(mult).toHaveTextContent('2.45×');
    expect(mult).not.toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-deepshaft-win-flash')).not.toBeInTheDocument();
  });

  it('a second consecutive win remounts pop/glow elements fresh instead of reusing a stale node', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const firstMult = screen.getByTestId('casino-deepshaft-mult');
    const firstFlash = screen.getByTestId('casino-deepshaft-win-flash');

    await act(async () => {
      await handle.current?.playOutcome({
        ...WIN_OUTCOME,
        totalMultiplier: 4.2,
      });
    });
    const secondMult = screen.getByTestId('casino-deepshaft-mult');
    const secondFlash = screen.getByTestId('casino-deepshaft-win-flash');

    expect(secondMult).not.toBe(firstMult);
    expect(secondFlash).not.toBe(firstFlash);
    expect(secondMult).toHaveTextContent('4.20×');
  });
});

describe('DeepshaftStage perf check — descent timer leak (phase1c-deepshaft)', () => {
  it('a rapid second playOutcome clears the previous pending descent timer', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    clearSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome(CAVEIN_OUTCOME);
    });
    expect(clearSpy).toHaveBeenCalled();
  });

  it('unmounting mid-descent clears the pending recursive timer (no leaked setTimeout past navigation)', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    clearSpy.mockClear();

    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('unmount mid-descent produces no console errors or warnings from a leaked tick setState', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    unmount();

    // deepshaftLevelStepMs(3) ≤ 140ms; 3 ticks + margin — if cleanup is missing,
    // setVisibleDepth/settle would fire on an unmounted component.
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('renders no console errors across consecutive settled rounds (win, cave-in, win)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    wrap(<DeepshaftStage ref={handle} riskTier="standard" targetDepth={3} />);

    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome(CAVEIN_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome({ ...WIN_OUTCOME, totalMultiplier: 3.1 });
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
