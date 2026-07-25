/**
 * Gold Rush — Phase 1D functional QA + quantified motion polish + meter rAF perf
 * (phase1d-gold-rush / resume-phase1d-gold-rush).
 *
 * Covers what casino-games-batch-c-stages.test.tsx does not: win vs lose motion
 * token wiring (reveal-in / number-pop / cashout-flash), unmount cleanup for the
 * feature-meter rAF, reduced-motion collapse, and phase1d-0 disposal confirmation
 * (no premature scene.root.destroy).
 * Mirrors mint-reels-stage.test.tsx for the sibling Pixi slot.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { GoldRushStage } from '@/product/surfaces/games/gold-rush-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

/** Positive totalMultiplier — punchy win + feature meter fill. */
const WIN_OUTCOME = { totalMultiplier: 12 };

/** Zero totalMultiplier — calm settle (no feature win). */
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

  // jsdom rAF does not reliably drain a 1100ms meter; advance performance.now
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

describe('GoldRushStage functional QA — feature meter settle (phase1d-gold-rush)', () => {
  it('shows dash result and idle phase before any bet', () => {
    wrap(<GoldRushStage lines={10} />);
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-gold-rush-mult')).toHaveTextContent('—');
    expect(screen.getByTestId('casino-gold-rush-canvas-host')).toBeInTheDocument();
    expect(screen.getByTestId('casino-gold-rush-meter')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-gold-rush-win-flash')).not.toBeInTheDocument();
  });

  it('a >0× settle shows mult and won flag from the RPC result only', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute(
      'data-stage-phase',
      'settled',
    );
    expect(screen.getByTestId('casino-gold-rush-mult')).toHaveTextContent('12.00×');
    // totalMultiplier 12 → meter fill ≥0.55 → bonus attribute.
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute('data-bonus', 'true');
  });

  it('a 0× settle sets data-won=false — no live cash-out (single-shot by design)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-gold-rush-mult')).toHaveTextContent('0.00×');
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute('data-bonus', 'false');
    expect(screen.queryByTestId('casino-gold-rush-cashout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('casino-gold-rush-live-spin')).not.toBeInTheDocument();
  });

  it('ignores a malformed RPC result instead of corrupting idle state', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome({ totalMultiplier: -1 });
    });
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-gold-rush-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-gold-rush-mult')).toHaveTextContent('—');
  });

  it('reset() clears a settled round back to idle for the next bet', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-gold-rush-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-gold-rush-mult')).toHaveTextContent('—');
  });

  it('meter advances through replaying before settle', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute(
      'data-stage-phase',
      'replaying',
    );
    // goldRushMeterMs 1100 + settle margin.
    await waitFor(
      () => {
        expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute(
          'data-stage-phase',
          'settled',
        );
      },
      { timeout: 4000 },
    );
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute('data-won', 'true');
  });
});

describe('GoldRushStage quantified motion polish — punchy win / calm lose (phase1d-gold-rush)', () => {
  it('a >0× settle gets reveal-in, number-pop, and cashout-flash together', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const mult = screen.getByTestId('casino-gold-rush-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-gold-rush-win-flash')).toBeInTheDocument();
  });

  it('a 0× settle gets only calm reveal-in — no pop, no glow (CASINO_UX_CANON: lose is respectful)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    const mult = screen.getByTestId('casino-gold-rush-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-gold-rush-win-flash')).not.toBeInTheDocument();
  });

  it('reduced motion still shows the correct win but skips every animation class', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-gold-rush-stage')).toHaveAttribute('data-won', 'true');
    const mult = screen.getByTestId('casino-gold-rush-mult');
    expect(mult).toHaveTextContent('12.00×');
    expect(mult).not.toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-gold-rush-win-flash')).not.toBeInTheDocument();
  });

  it('a second consecutive win remounts pop/glow elements fresh instead of reusing a stale node', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    // Motion classes are skipped under reduced-motion — remount keys still change.
    const firstMult = screen.getByTestId('casino-gold-rush-mult');

    await act(async () => {
      await handle.current?.playOutcome({ totalMultiplier: 5 });
    });
    const secondMult = screen.getByTestId('casino-gold-rush-mult');

    expect(secondMult).not.toBe(firstMult);
    expect(secondMult).toHaveTextContent('5.00×');
  });
});

describe('GoldRushStage perf check — meter rAF leak (phase1d-gold-rush)', () => {
  it('a rapid second playOutcome clears the previous pending rAF', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    cancelSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('unmounting mid-meter clears pending rAF (no leak past navigation)', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<GoldRushStage ref={handle} lines={10} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    cancelSpy.mockClear();

    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('unmount mid-meter produces no console errors or warnings from a leaked tick setState', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<GoldRushStage ref={handle} lines={10} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    unmount();

    // goldRushMeterMs 1100 — if cleanup is missing, setMeter/settle would fire
    // on an unmounted component.
    await new Promise((resolve) => setTimeout(resolve, 1600));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('renders no console errors across consecutive settled rounds (win, lose, win)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    wrap(<GoldRushStage ref={handle} lines={10} />);

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

describe('GoldRushStage phase1d-0 disposal confirmation (shared Pixi hook)', () => {
  it('does not call scene.root.destroy — Application-first teardown owns the tree', () => {
    const src = readRepo('apps/web/src/product/surfaces/games/gold-rush-stage.tsx');
    expect(src).not.toMatch(/scene\.root\.destroy\s*\(/);
    expect(src).toContain('sceneRef.current = null');
    expect(src).toContain('usePixiStage');
    expect(src).toContain('goldRushMeterEase');
  });
});
