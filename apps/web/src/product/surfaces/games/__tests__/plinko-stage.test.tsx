/**
 * Plinko — Phase 1D functional QA + quantified motion polish + path-timer perf
 * (phase1d-plinko / resume-phase1d-plinko).
 *
 * Covers what casino-games-batch-c-stages.test.tsx does not: win vs ≤1× motion
 * token wiring (reveal-in / number-pop / cashout-flash), unmount cleanup for the
 * recursive path setTimeout chain, reduced-motion collapse, and phase1d-0
 * disposal confirmation (no premature scene.root.destroy).
 * Mirrors deepshaft-stage.test.tsx / limbo-stage.test.tsx for sibling games.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { PlinkoStage } from '@/product/surfaces/games/plinko-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

/** 8-row path · 3 rights → bucket 3 · mult >1× (punchy win). */
const WIN_OUTCOME = {
  path: [0, 1, 0, 1, 0, 0, 1, 0],
  bucket: 3,
  bucketMultiplier: '2.0',
};

/** Same path length · low mult ≤1× (calm settle). */
const LOSE_OUTCOME = {
  path: [0, 1, 0, 1, 0, 0, 1, 0],
  bucket: 3,
  bucketMultiplier: '0.9',
};

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

function readRepo(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  usePrefersReducedMotion.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PlinkoStage functional QA — drop path replay + settle (phase1d-plinko)', () => {
  it('shows dash result and idle phase before any bet', () => {
    wrap(<PlinkoStage rows={8} risk="low" />);
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-plinko-bucket-mult')).toHaveTextContent('—');
    expect(screen.getByTestId('casino-plinko-canvas-host')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-plinko-win-flash')).not.toBeInTheDocument();
  });

  it('a >1× bucket settles mult and won flag from the RPC result only', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute('data-stage-phase', 'settled');
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute('data-bucket', '3');
    expect(screen.getByTestId('casino-plinko-bucket-mult')).toHaveTextContent('2.0×');
  });

  it('a ≤1× bucket settles with data-won=false — no live drop mid-round', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-plinko-bucket-mult')).toHaveTextContent('0.9×');
    // Single-shot by design — no live drop / cash-out controls on this stage.
    expect(screen.queryByTestId('casino-plinko-live-drop')).not.toBeInTheDocument();
    expect(screen.queryByTestId('casino-plinko-cashout')).not.toBeInTheDocument();
  });

  it('ignores a malformed RPC result instead of corrupting idle state', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    await act(async () => {
      await handle.current?.playOutcome({ path: [1], bucket: 0, bucketMultiplier: '1' });
    });
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-plinko-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-plinko-bucket-mult')).toHaveTextContent('—');
  });

  it('reset() clears a settled round back to idle for the next bet', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-plinko-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-plinko-bucket-mult')).toHaveTextContent('—');
  });

  it('path replay advances through replaying before settle', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute(
      'data-stage-phase',
      'replaying',
    );
    // 8 steps × plinkoPathStepMs(8) ≤ 120ms ≈ 960ms + settle margin.
    await waitFor(
      () => {
        expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute(
          'data-stage-phase',
          'settled',
        );
      },
      { timeout: 3000 },
    );
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute('data-path-index', '8');
  });
});

describe('PlinkoStage quantified motion polish — punchy win / calm ≤1× (phase1d-plinko)', () => {
  it('a >1× settle gets reveal-in, number-pop, and cashout-flash together', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const mult = screen.getByTestId('casino-plinko-bucket-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-plinko-win-flash')).toBeInTheDocument();
  });

  it('a ≤1× settle gets only calm reveal-in — no pop, no glow (CASINO_UX_CANON: lose is respectful)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    const mult = screen.getByTestId('casino-plinko-bucket-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-plinko-win-flash')).not.toBeInTheDocument();
  });

  it('reduced motion still shows the correct win but skips every animation class', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-plinko-stage')).toHaveAttribute('data-won', 'true');
    const mult = screen.getByTestId('casino-plinko-bucket-mult');
    expect(mult).toHaveTextContent('2.0×');
    expect(mult).not.toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-plinko-win-flash')).not.toBeInTheDocument();
  });

  it('a second consecutive win remounts pop/glow elements fresh instead of reusing a stale node', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const firstMult = screen.getByTestId('casino-plinko-bucket-mult');
    const firstFlash = screen.getByTestId('casino-plinko-win-flash');

    await act(async () => {
      await handle.current?.playOutcome({
        ...WIN_OUTCOME,
        bucketMultiplier: '5.0',
      });
    });
    const secondMult = screen.getByTestId('casino-plinko-bucket-mult');
    const secondFlash = screen.getByTestId('casino-plinko-win-flash');

    expect(secondMult).not.toBe(firstMult);
    expect(secondFlash).not.toBe(firstFlash);
    expect(secondMult).toHaveTextContent('5.0×');
  });
});

describe('PlinkoStage perf check — path timer leak (phase1d-plinko)', () => {
  it('a rapid second playOutcome clears the previous pending path timer', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    clearSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(clearSpy).toHaveBeenCalled();
  });

  it('unmounting mid-path clears the pending recursive timer (no leaked setTimeout past navigation)', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    clearSpy.mockClear();

    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('unmount mid-path produces no console errors or warnings from a leaked tick setState', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    unmount();

    // plinkoPathStepMs(8) ≤ 120ms; 8 ticks + margin — if cleanup is missing,
    // setPathIndex/settle would fire on an unmounted component.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('renders no console errors across consecutive settled rounds (win, lose, win)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    wrap(<PlinkoStage ref={handle} rows={8} risk="low" />);

    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome({ ...WIN_OUTCOME, bucketMultiplier: '3.0' });
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('PlinkoStage phase1d-0 disposal confirmation (shared Pixi hook)', () => {
  it('does not call scene.root.destroy — Application-first teardown owns the tree', () => {
    const src = readRepo('apps/web/src/product/surfaces/games/plinko-stage.tsx');
    expect(src).not.toMatch(/scene\.root\.destroy\s*\(/);
    expect(src).toContain('sceneRef.current = null');
    expect(src).toContain('usePixiStage');
  });
});
