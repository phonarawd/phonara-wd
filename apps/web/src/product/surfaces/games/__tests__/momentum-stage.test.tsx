/**
 * Momentum — Phase 1D functional QA + quantified motion polish + combo rAF perf
 * (phase1d-momentum / resume-phase1d-momentum).
 *
 * Covers what casino-games-batch-c-stages.test.tsx does not: win vs broke motion
 * token wiring (reveal-in / number-pop / cashout-flash), unmount cleanup for the
 * combo-meter rAF, reduced-motion collapse, cash-out settle, and phase1d-0
 * disposal confirmation (no premature scene.root.destroy).
 * Mirrors gold-rush-stage.test.tsx for the sibling Pixi stage.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { MomentumStage } from '@/product/surfaces/games/momentum-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

/** Combo build win — punchy settle. */
const WIN_OUTCOME = {
  won: true,
  roll: 70,
  comboBefore: 2,
  comboAfter: 3,
  comboMultiplier: 4.5,
  cashedOut: false,
  totalMultiplier: 0,
};

/** Broke / lose — calm settle (no pop/glow). */
const LOSE_OUTCOME = {
  won: false,
  roll: 20,
  comboBefore: 4,
  comboAfter: 0,
  comboMultiplier: 0,
  cashedOut: false,
  totalMultiplier: 0,
};

/** Pre-bet cash-out settle — punchy (escaped with totalMultiplier). */
const CASHOUT_OUTCOME = {
  won: false,
  roll: 0,
  comboBefore: 5,
  comboAfter: 0,
  comboMultiplier: 0,
  cashedOut: true,
  totalMultiplier: 8.25,
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

  // jsdom rAF does not reliably drain an 850ms combo; advance performance.now
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

describe('MomentumStage functional QA — combo meter settle (phase1d-momentum)', () => {
  it('shows dash result and idle phase before any bet', () => {
    wrap(<MomentumStage comboBefore={0} cashOut={false} />);
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-momentum-mult')).toHaveTextContent('—');
    expect(screen.getByTestId('casino-momentum-canvas-host')).toBeInTheDocument();
    expect(screen.getByTestId('casino-momentum-combo')).toHaveTextContent('0');
    expect(screen.queryByTestId('casino-momentum-win-flash')).not.toBeInTheDocument();
  });

  it('a win settle shows combo mult and won flag from the RPC result only', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute(
      'data-stage-phase',
      'settled',
    );
    expect(screen.getByTestId('casino-momentum-combo')).toHaveTextContent('3');
    expect(screen.getByTestId('casino-momentum-mult')).toHaveTextContent('4.50×');
    expect(screen.getByTestId('casino-momentum-roll')).toBeInTheDocument();
  });

  it('a broke settle sets data-won=false — no live cash-out control (single-shot)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={4} cashOut={false} />);
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute(
      'data-cashed-out',
      'false',
    );
    expect(screen.getByTestId('casino-momentum-combo')).toHaveTextContent('0');
    expect(screen.queryByTestId('casino-momentum-live-cashout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('casino-momentum-cashout')).not.toBeInTheDocument();
  });

  it('a cash-out settle shows totalMultiplier and clears combo (pre-bet param only)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={5} cashOut={true} />);
    await act(async () => {
      await handle.current?.playOutcome(CASHOUT_OUTCOME);
    });
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute(
      'data-cashed-out',
      'true',
    );
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute(
      'data-prebet-cashout',
      'true',
    );
    expect(screen.getByTestId('casino-momentum-combo')).toHaveTextContent('0');
    expect(screen.getByTestId('casino-momentum-mult')).toHaveTextContent('8.25×');
    expect(screen.queryByTestId('casino-momentum-roll')).not.toBeInTheDocument();
  });

  it('ignores a malformed RPC result instead of corrupting idle state', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={1} cashOut={false} />);
    await act(async () => {
      await handle.current?.playOutcome({ won: true });
    });
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-momentum-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-momentum-mult')).toHaveTextContent('—');
  });

  it('reset() clears a settled round back to idle for the next bet', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
    expect(screen.getByTestId('casino-momentum-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-momentum-mult')).toHaveTextContent('—');
    expect(screen.getByTestId('casino-momentum-combo')).toHaveTextContent('2');
  });

  it('combo advances through replaying before settle', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);
    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute(
      'data-stage-phase',
      'replaying',
    );
    // momentumComboMs 850 + settle margin.
    await waitFor(
      () => {
        expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute(
          'data-stage-phase',
          'settled',
        );
      },
      { timeout: 4000 },
    );
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute('data-won', 'true');
  });
});

describe('MomentumStage quantified motion polish — punchy win / calm broke (phase1d-momentum)', () => {
  it('a win settle gets reveal-in, number-pop, and cashout-flash together', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const mult = screen.getByTestId('casino-momentum-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-momentum-win-flash')).toBeInTheDocument();
  });

  it('a broke settle gets only calm reveal-in — no pop, no glow (CASINO_UX_CANON: lose is respectful)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={4} cashOut={false} />);
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    const mult = screen.getByTestId('casino-momentum-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-momentum-win-flash')).not.toBeInTheDocument();
  });

  it('a cash-out settle gets punchy pop/glow (escaped stake feels earned)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={5} cashOut={true} />);
    await act(async () => {
      await handle.current?.playOutcome(CASHOUT_OUTCOME);
    });
    const mult = screen.getByTestId('casino-momentum-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-momentum-win-flash')).toBeInTheDocument();
  });

  it('reduced motion still shows the correct win but skips every animation class', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-momentum-stage')).toHaveAttribute('data-won', 'true');
    const mult = screen.getByTestId('casino-momentum-mult');
    expect(mult).toHaveTextContent('4.50×');
    expect(mult).not.toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-momentum-win-flash')).not.toBeInTheDocument();
  });

  it('a second consecutive win remounts pop/glow elements fresh instead of reusing a stale node', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const firstMult = screen.getByTestId('casino-momentum-mult');

    await act(async () => {
      await handle.current?.playOutcome({
        ...WIN_OUTCOME,
        comboBefore: 3,
        comboAfter: 4,
        comboMultiplier: 6,
      });
    });
    const secondMult = screen.getByTestId('casino-momentum-mult');

    expect(secondMult).not.toBe(firstMult);
    expect(secondMult).toHaveTextContent('6.00×');
  });
});

describe('MomentumStage perf check — combo rAF leak (phase1d-momentum)', () => {
  it('a rapid second playOutcome clears the previous pending rAF', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    cancelSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('unmounting mid-combo clears pending rAF (no leak past navigation)', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    cancelSpy.mockClear();

    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('unmount mid-combo produces no console errors or warnings from a leaked tick setState', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    unmount();

    // momentumComboMs 850 — if cleanup is missing, setDisplayCombo/settle would fire
    // on an unmounted component.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('renders no console errors across consecutive settled rounds (win, broke, cash-out)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MomentumStage ref={handle} comboBefore={2} cashOut={false} />);

    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome(CASHOUT_OUTCOME);
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('MomentumStage phase1d-0 disposal confirmation (shared Pixi hook)', () => {
  it('does not call scene.root.destroy — Application-first teardown owns the tree', () => {
    const src = readRepo('apps/web/src/product/surfaces/games/momentum-stage.tsx');
    expect(src).not.toMatch(/scene\.root\.destroy\s*\(/);
    expect(src).toContain('sceneRef.current = null');
    expect(src).toContain('usePixiStage');
    expect(src).toContain('momentumComboEase');
    expect(src).toContain('momentumComboResetEase');
  });
});
