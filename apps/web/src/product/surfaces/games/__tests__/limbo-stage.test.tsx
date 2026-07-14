/**
 * Limbo — Phase 1B functional QA + quantified motion polish + perf check (phase1b-limbo).
 * Covers what casino-games-batch-a-stages.test.tsx does not: near-miss/loss "reads
 * clean" behavior, win-only pop/glow reveal, malformed-RPC defensiveness, and
 * timer-leak prevention. Mirrors crash-stage.test.tsx's role for its sibling game.
 */
import { act, render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { LimboStage } from '@/product/surfaces/games/limbo-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

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

describe('LimboStage functional QA — target set + bet result render (phase1b-limbo)', () => {
  it('shows the target multiplier and an empty result before any bet', () => {
    wrap(<LimboStage target="2.00" />);
    expect(screen.getByTestId('casino-limbo-target')).toHaveTextContent('2.00×');
    expect(screen.getByTestId('casino-limbo-result')).toHaveTextContent('—');
    expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-limbo-stage')).not.toHaveAttribute('data-won');
  });

  it('re-renders the target immediately when the pre-bet selection field changes', () => {
    const { rerender } = wrap(<LimboStage target="2.00" />);
    expect(screen.getByTestId('casino-limbo-target')).toHaveTextContent('2.00×');
    rerender(
      <I18nProvider>
        <LimboStage target="5.50" />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-limbo-target')).toHaveTextContent('5.50×');
  });

  it('a decisive win renders the RPC result, correct tone, and won=true', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="3.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 4.25, won: true });
    });
    expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-stage-phase', 'settled');
    expect(screen.getByTestId('casino-limbo-result')).toHaveTextContent('4.25×');
    expect(screen.getByTestId('casino-limbo-result')).toHaveClass('text-success');
  });

  it('a near-miss loss (1.99x vs a 2.00x target) still settles cleanly — correct value, danger tone, won=false', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 1.99, won: false });
    });
    expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-limbo-result')).toHaveTextContent('1.99×');
    expect(screen.getByTestId('casino-limbo-result')).toHaveClass('text-danger');
    // Reads clean — no win-only pop/glow leaking onto a loss, near-miss or not.
    expect(screen.getByTestId('casino-limbo-result')).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-limbo-win-flash')).not.toBeInTheDocument();
  });

  it('a distant loss (1.05x vs a 5.00x target — all Limbo results are >= 1.00x by design) reads exactly as clean as a near-miss — no extra alarm state', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="5.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 1.05, won: false });
    });
    expect(screen.getByTestId('casino-limbo-result')).toHaveClass('text-danger');
    expect(screen.getByTestId('casino-limbo-result')).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-limbo-win-flash')).not.toBeInTheDocument();
  });

  it('ignores a malformed RPC result instead of crashing or corrupting the displayed state (control responds safely, not silently wrong)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    await act(async () => {
      // Missing resultMultiplier — parseLimboOutcome returns null.
      await handle.current?.playOutcome({ won: true });
    });
    expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-limbo-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-limbo-result')).toHaveTextContent('—');
  });

  it('reset() clears the settled result back to idle for the next round', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 4.25, won: true });
    });
    expect(screen.getByTestId('casino-limbo-result')).toHaveTextContent('4.25×');
    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-limbo-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-limbo-result')).toHaveTextContent('—');
  });
});

describe('LimboStage quantified motion polish — punchy win / calm loss (phase1b-limbo)', () => {
  it('a win gets the reveal-in entrance, the number-pop, and the glow flash together', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 3.1, won: true });
    });
    const value = screen.getByTestId('casino-limbo-result');
    expect(value).toHaveClass('ds-casino-reveal-in');
    expect(value).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-limbo-win-flash')).toBeInTheDocument();
  });

  it('a loss gets only the calm reveal-in entrance — no pop, no glow (CASINO_UX_CANON: lose is respectful)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 1.2, won: false });
    });
    const value = screen.getByTestId('casino-limbo-result');
    expect(value).toHaveClass('ds-casino-reveal-in');
    expect(value).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-limbo-win-flash')).not.toBeInTheDocument();
  });

  it('reduced motion still shows the correct won result but skips every animation class (instant collapse)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 3.1, won: true });
    });
    expect(screen.getByTestId('casino-limbo-stage')).toHaveAttribute('data-won', 'true');
    const value = screen.getByTestId('casino-limbo-result');
    expect(value).toHaveTextContent('3.10×');
    expect(value).not.toHaveClass('ds-casino-reveal-in');
    expect(value).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-limbo-win-flash')).not.toBeInTheDocument();
  });

  it('a second consecutive win remounts the pop/glow elements fresh instead of reusing a stale animation node', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 3.1, won: true });
    });
    const firstValue = screen.getByTestId('casino-limbo-result');
    const firstFlash = screen.getByTestId('casino-limbo-win-flash');

    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 6.4, won: true });
    });
    const secondValue = screen.getByTestId('casino-limbo-result');
    const secondFlash = screen.getByTestId('casino-limbo-win-flash');

    expect(secondValue).not.toBe(firstValue);
    expect(secondFlash).not.toBe(firstFlash);
    expect(secondValue).toHaveTextContent('6.40×');
  });

  it('the reveal hold resolves within the quantified 200-500ms Result-reveal band, not instantly and not indefinitely', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    const start = Date.now();
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 3.1, won: true });
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(300);
    expect(elapsed).toBeLessThan(1000);
  });

  it('reduced motion resolves the promise immediately (no artificial hold)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    const start = Date.now();
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 3.1, won: true });
    });
    expect(Date.now() - start).toBeLessThan(50);
  });
});

describe('LimboStage perf check (phase1b-limbo)', () => {
  it('a rapid second playOutcome clears the previous pending reveal timer instead of leaking it', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);

    act(() => {
      void handle.current?.playOutcome({ resultMultiplier: 3, won: true });
    });
    clearSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome({ resultMultiplier: 1.5, won: false });
    });
    expect(clearSpy).toHaveBeenCalled();
  });

  it('unmounting while a reveal-hold timer is still pending clears it (no leaked timer past navigation)', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<LimboStage ref={handle} target="2.00" />);

    act(() => {
      void handle.current?.playOutcome({ resultMultiplier: 3, won: true });
    });
    clearSpy.mockClear();

    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('renders no console errors or warnings across several consecutive rounds (win, loss, win)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);

    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 3.1, won: true });
    });
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 1.1, won: false });
    });
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 9.9, won: true });
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('drives every reveal/pop/glow effect through CSS classes only — no inline style, so there is nothing here for jsdom-vs-real-browser drift to hide', async () => {
    // motion.css's own keyframes (verified by direct read, not a jsdom
    // getComputedStyle probe — vitest.config.ts's web project has no css:true,
    // so a jsdom style assertion here would false-positive green per the
    // Phase 0A correction) already animate transform/opacity only. This test
    // instead locks down LimboStage's own contract: it must never reach for an
    // inline `style` object to drive the reveal, which would be a second,
    // untracked animation path outside the shared casino motion budget.
    const handle = createRef<CasinoStageHandle>();
    wrap(<LimboStage ref={handle} target="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({ resultMultiplier: 3.1, won: true });
    });
    expect(screen.getByTestId('casino-limbo-result')).not.toHaveAttribute('style');
    expect(screen.getByTestId('casino-limbo-win-flash')).not.toHaveAttribute('style');
    expect(screen.getByTestId('casino-limbo-result-flash')).not.toHaveAttribute('style');
  });
});
