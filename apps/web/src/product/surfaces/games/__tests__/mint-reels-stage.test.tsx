/**
 * Mint Reels — Phase 1D functional QA + quantified motion polish + spin/timer perf
 * (phase1d-mint-reels / resume-phase1d-mint-reels).
 *
 * Covers what casino-games-batch-c-stages.test.tsx does not: win vs lose motion
 * token wiring (reveal-in / number-pop / cashout-flash), unmount cleanup for the
 * rAF spin + recursive payline setTimeout chain, reduced-motion collapse, and
 * phase1d-0 disposal confirmation (no premature scene.root.destroy).
 * Mirrors plinko-stage.test.tsx for the sibling Pixi game.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { MintReelsStage } from '@/product/surfaces/games/mint-reels-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

/** Positive totalMultiplier — punchy win celebration. */
const WIN_OUTCOME = { totalMultiplier: 2.5 };

/** Zero totalMultiplier — calm settle (no line win). */
const LOSE_OUTCOME = { totalMultiplier: 0 };

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

function readRepo(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  usePrefersReducedMotion.mockReturnValue(false);

  // jsdom rAF does not reliably drain a 900ms spin; advance performance.now
  // per frame so playOutcome settles without a real-time wait.
  let now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    now += 100;
    return setTimeout(() => cb(now), 0) as unknown as number;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MintReelsStage functional QA — spin + payline settle (phase1d-mint-reels)', () => {
  it('shows dash result and idle phase before any bet', () => {
    wrap(<MintReelsStage lines={20} />);
    expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-mint-reels-mult')).toHaveTextContent('—');
    expect(screen.getByTestId('casino-mint-reels-canvas-host')).toBeInTheDocument();
    expect(screen.getByTestId('casino-mint-reels-lines')).toHaveTextContent('20');
    expect(screen.queryByTestId('casino-mint-reels-win-flash')).not.toBeInTheDocument();
  });

  it('a >0× settle shows mult and won flag from the RPC result only', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute(
      'data-stage-phase',
      'settled',
    );
    expect(screen.getByTestId('casino-mint-reels-mult')).toHaveTextContent('2.50×');
  });

  it('a 0× settle sets data-won=false — no live cash-out (single-shot by design)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-mint-reels-mult')).toHaveTextContent('0.00×');
    expect(screen.queryByTestId('casino-mint-reels-cashout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('casino-mint-reels-live-spin')).not.toBeInTheDocument();
  });

  it('ignores a malformed RPC result instead of corrupting idle state', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);
    await act(async () => {
      await handle.current?.playOutcome({ totalMultiplier: -1 });
    });
    expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-mint-reels-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-mint-reels-mult')).toHaveTextContent('—');
  });

  it('reset() clears a settled round back to idle for the next bet', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-mint-reels-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-mint-reels-mult')).toHaveTextContent('—');
  });

  it('spin advances through replaying before settle (payline sweep)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);
    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute(
      'data-stage-phase',
      'replaying',
    );
    // mintReelsSpinMs 900 + payline scan ~440 + settle margin.
    await waitFor(
      () => {
        expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute(
          'data-stage-phase',
          'settled',
        );
      },
      { timeout: 4000 },
    );
    expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute('data-won', 'true');
  });
});

describe('MintReelsStage quantified motion polish — punchy win / calm lose (phase1d-mint-reels)', () => {
  it('a >0× settle gets reveal-in, number-pop, and cashout-flash together', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const mult = screen.getByTestId('casino-mint-reels-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-mint-reels-win-flash')).toBeInTheDocument();
  });

  it('a 0× settle gets only calm reveal-in — no pop, no glow (CASINO_UX_CANON: lose is respectful)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    const mult = screen.getByTestId('casino-mint-reels-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-mint-reels-win-flash')).not.toBeInTheDocument();
  });

  it('reduced motion still shows the correct win but skips every animation class', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-mint-reels-stage')).toHaveAttribute('data-won', 'true');
    const mult = screen.getByTestId('casino-mint-reels-mult');
    expect(mult).toHaveTextContent('2.50×');
    expect(mult).not.toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-mint-reels-win-flash')).not.toBeInTheDocument();
  });

  it('a second consecutive win remounts pop/glow elements fresh instead of reusing a stale node', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    // Motion classes are skipped under reduced-motion — remount keys still change.
    const firstMult = screen.getByTestId('casino-mint-reels-mult');

    await act(async () => {
      await handle.current?.playOutcome({ totalMultiplier: 5 });
    });
    const secondMult = screen.getByTestId('casino-mint-reels-mult');

    expect(secondMult).not.toBe(firstMult);
    expect(secondMult).toHaveTextContent('5.00×');
  });
});

describe('MintReelsStage perf check — spin/payline timer leak (phase1d-mint-reels)', () => {
  it('a rapid second playOutcome clears the previous pending timers', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    clearSpy.mockClear();
    cancelSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(clearSpy.mock.calls.length + cancelSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('unmounting mid-spin clears pending rAF / setTimeout (no leak past navigation)', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<MintReelsStage ref={handle} lines={20} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    clearSpy.mockClear();
    cancelSpy.mockClear();

    unmount();
    expect(clearSpy.mock.calls.length + cancelSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('unmount mid-spin produces no console errors or warnings from a leaked tick setState', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<MintReelsStage ref={handle} lines={20} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    unmount();

    // spin 900ms + payline ~440ms — if cleanup is missing, setScanLine/settle
    // would fire on an unmounted component.
    await new Promise((resolve) => setTimeout(resolve, 1600));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('renders no console errors across consecutive settled rounds (win, lose, win)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MintReelsStage ref={handle} lines={20} />);

    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome({ totalMultiplier: 3 });
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('MintReelsStage phase1d-0 disposal confirmation (shared Pixi hook)', () => {
  it('does not call scene.root.destroy — Application-first teardown owns the tree', () => {
    const src = readRepo('apps/web/src/product/surfaces/games/mint-reels-stage.tsx');
    expect(src).not.toMatch(/scene\.root\.destroy\s*\(/);
    expect(src).toContain('sceneRef.current = null');
    expect(src).toContain('usePixiStage');
    expect(src).toContain('mintReelsSpinEase');
  });
});
