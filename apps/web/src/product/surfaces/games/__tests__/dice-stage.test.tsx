/**
 * Dice — Phase 1B functional QA + quantified motion polish + perf check (phase1b-dice).
 * Covers what casino-games-batch-a-stages.test.tsx does not: the roll marker moving
 * in sync with the settled number (previously invisible until settle, never
 * animated at all), win-only pop/glow reveal (motion.css's own comment already
 * names Dice as an intended consumer of the Limbo/Crash shared tokens, never
 * wired up before this), malformed-RPC defensiveness, and rAF-leak prevention on
 * unmount. Mirrors limbo-stage.test.tsx's functional-QA/motion-polish/perf-check
 * structure for its sibling "instant" game, and crash-stage.test.tsx's
 * rAF-avoidance convention: DiceStage's animated (non-reduced-motion) path drives
 * a real-duration `requestAnimationFrame` loop, and jsdom does not fire rAF
 * reliably (confirmed by crash-stage.test.tsx's own comment: hangs to the vitest
 * timeout). Tests that need the animated path's *end state* (the win-only
 * reveal-in/pop/glow classes) use `stubRafToSkipToEnd()` below — a deterministic
 * one-shot rAF mock — instead of awaiting a real animation; tests that only need
 * the *scheduling* side ("perf check") spy on requestAnimationFrame without ever
 * awaiting `playOutcome()` to resolution.
 */
import { act, render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { diceMultiplier, diceWinProbability } from '@phonara/game-engine';

import { I18nProvider } from '@/product/i18n';
import { DICE_ROLL_REVEAL_MS, DiceStage } from '@/product/surfaces/games/dice-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => true),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

/**
 * Replaces `requestAnimationFrame` with a mock that invokes the callback
 * synchronously using a timestamp far past any DiceStage animation's `start`.
 * The tick's own `Math.min(1, (now-start)/duration)` clamp then resolves the
 * whole roll-settle wobble in one step — deterministic, instant, and immune to
 * jsdom's unreliable real rAF firing (see file header). Only meaningful
 * combined with `usePrefersReducedMotion.mockReturnValue(false)`.
 */
function stubRafToSkipToEnd() {
  return vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(performance.now() + DICE_ROLL_REVEAL_MS + 1000);
    return 0;
  });
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  // Reduced motion by default (unlike limbo/crash-stage.test.tsx's `false`
  // default) — DiceStage's ENTIRE settle path (not just an optional prop-driven
  // side path, cf. Crash's live cash-out) runs through the same rAF-driven
  // `runReplay` as Crash's curve, so nearly every test below calls and awaits
  // `playOutcome()`. Defaulting to reduced motion keeps that safe by default;
  // the "perf check" describe block below explicitly flips this to `false` and
  // never awaits `playOutcome()` to resolution.
  usePrefersReducedMotion.mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DiceStage functional QA — target/direction + bet result render (phase1b-dice)', () => {
  it('shows the win-chance/multiplier preview (engine formula display) and an empty roll before any bet', () => {
    wrap(<DiceStage target="50.00" direction="over" />);
    const expectedChance = (diceWinProbability(50, 'over') * 100).toFixed(2);
    const expectedMult = diceMultiplier(50, 'over').toFixed(2);
    expect(screen.getByTestId('casino-dice-win-chance')).toHaveTextContent(`${expectedChance}%`);
    expect(screen.getByTestId('casino-dice-payout-mult')).toHaveTextContent(`${expectedMult}×`);
    expect(screen.getByTestId('casino-dice-roll')).toHaveTextContent('—');
    expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-dice-stage')).not.toHaveAttribute('data-won');
    expect(screen.queryByTestId('casino-dice-roll-marker')).not.toBeInTheDocument();
  });

  it('re-renders the preview immediately when target/direction changes — proves roll-under/over is wired through', () => {
    const expectedOverAt90 = (diceWinProbability(90, 'over') * 100).toFixed(2);
    const expectedUnderAt90 = (diceWinProbability(90, 'under') * 100).toFixed(2);
    // Sanity: the two directions must actually differ at this target, or the
    // assertions below would trivially pass even with a broken/no-op toggle.
    expect(expectedOverAt90).not.toBe(expectedUnderAt90);

    const { rerender } = wrap(<DiceStage target="50.00" direction="over" />);
    rerender(
      <I18nProvider>
        <DiceStage target="90.00" direction="over" />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-dice-win-chance')).toHaveTextContent(`${expectedOverAt90}%`);

    rerender(
      <I18nProvider>
        <DiceStage target="90.00" direction="under" />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-dice-win-chance')).toHaveTextContent(`${expectedUnderAt90}%`);
  });

  it('an "over" win renders the RPC roll, success tone, won=true, and a visible marker', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);
    await act(async () => {
      await handle.current?.playOutcome({ roll: 72.5, won: true });
    });
    expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-stage-phase', 'settled');
    expect(screen.getByTestId('casino-dice-roll')).toHaveTextContent('72.50');
    expect(screen.getByTestId('casino-dice-roll')).toHaveClass('text-success');
    expect(screen.getByTestId('casino-dice-roll-marker')).toBeInTheDocument();
    expect(screen.getByTestId('casino-dice-roll-marker')).toHaveClass('bg-success');
  });

  it('an "under" loss renders cleanly — correct roll, danger tone, won=false (roll-under path)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="under" />);
    await act(async () => {
      await handle.current?.playOutcome({ roll: 72.5, won: false });
    });
    expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-dice-roll')).toHaveTextContent('72.50');
    expect(screen.getByTestId('casino-dice-roll')).toHaveClass('text-danger');
    expect(screen.getByTestId('casino-dice-roll-marker')).toHaveClass('bg-danger');
  });

  it('ignores a malformed RPC result instead of crashing or corrupting the displayed state', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);
    await act(async () => {
      // Missing `roll` — parseDiceOutcome returns null.
      await handle.current?.playOutcome({ won: true });
    });
    expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-dice-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-dice-roll')).toHaveTextContent('—');
    expect(screen.queryByTestId('casino-dice-roll-marker')).not.toBeInTheDocument();
  });

  it('reset() clears the settled result and marker back to idle for the next round', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);
    await act(async () => {
      await handle.current?.playOutcome({ roll: 72.5, won: true });
    });
    expect(screen.getByTestId('casino-dice-roll')).toHaveTextContent('72.50');

    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-dice-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-dice-roll')).toHaveTextContent('—');
    expect(screen.queryByTestId('casino-dice-roll-marker')).not.toBeInTheDocument();
  });
});

describe('DiceStage quantified motion polish — marker moves in sync with the number (phase1b-dice)', () => {
  it('a win gets the reveal-in entrance, number-pop, and glow flash on BOTH the number and the marker', async () => {
    usePrefersReducedMotion.mockReturnValue(false);
    stubRafToSkipToEnd();
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);
    await act(async () => {
      await handle.current?.playOutcome({ roll: 80, won: true });
    });
    const value = screen.getByTestId('casino-dice-roll');
    expect(value).toHaveClass('ds-casino-reveal-in');
    expect(value).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-dice-win-flash')).toBeInTheDocument();
    expect(screen.getByTestId('casino-dice-roll-marker')).toHaveClass('ds-casino-number-pop');
  });

  it('a loss gets no pop, no glow — reads exactly as clean as CASINO_UX_CANON requires (lose: calm, respectful)', async () => {
    usePrefersReducedMotion.mockReturnValue(false);
    stubRafToSkipToEnd();
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);
    await act(async () => {
      await handle.current?.playOutcome({ roll: 20, won: false });
    });
    const value = screen.getByTestId('casino-dice-roll');
    expect(value).toHaveClass('ds-casino-reveal-in');
    expect(value).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-dice-win-flash')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-dice-roll-marker')).not.toHaveClass('ds-casino-number-pop');
  });

  it('the marker moves to the exact settled roll position via `transform`, never `left`/`top` (0 layout shift contract)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);
    await act(async () => {
      await handle.current?.playOutcome({ roll: 33.5, won: true });
    });
    const bar = screen.getByTestId('casino-dice-probability-bar');
    const marker = screen.getByTestId('casino-dice-roll-marker');
    // The marker's positioned wrapper is the dot's grandparent (dot -> inner
    // centering anchor -> wrapper) — a pure positioning primitive with no
    // testid of its own, located structurally rather than invented a new one.
    const wrapperEl = marker.parentElement?.parentElement as HTMLElement;
    expect(wrapperEl.parentElement).toBe(bar);
    expect(wrapperEl.style.transform).toBe('translateX(33.5%)');
    expect(wrapperEl.style.left).toBe('');
    expect(wrapperEl.style.top).toBe('');
  });

  it('reduced motion still shows the correct won result and marker position, but skips every animation class', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);
    await act(async () => {
      await handle.current?.playOutcome({ roll: 61.2, won: true });
    });
    expect(screen.getByTestId('casino-dice-stage')).toHaveAttribute('data-won', 'true');
    const value = screen.getByTestId('casino-dice-roll');
    expect(value).toHaveTextContent('61.20');
    expect(value).not.toHaveClass('ds-casino-reveal-in');
    expect(value).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-dice-win-flash')).not.toBeInTheDocument();
    const marker = screen.getByTestId('casino-dice-roll-marker');
    expect(marker).not.toHaveClass('ds-casino-number-pop');
    const wrapperEl = marker.parentElement?.parentElement as HTMLElement;
    expect(wrapperEl.style.transform).toBe('translateX(61.2%)');
  });

  it('a second consecutive win remounts the pop/glow elements fresh instead of reusing a stale animation node', async () => {
    usePrefersReducedMotion.mockReturnValue(false);
    stubRafToSkipToEnd();
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);
    await act(async () => {
      await handle.current?.playOutcome({ roll: 60, won: true });
    });
    const firstValue = screen.getByTestId('casino-dice-roll');
    const firstMarker = screen.getByTestId('casino-dice-roll-marker');
    const firstFlash = screen.getByTestId('casino-dice-win-flash');

    await act(async () => {
      await handle.current?.playOutcome({ roll: 88, won: true });
    });
    const secondValue = screen.getByTestId('casino-dice-roll');
    const secondMarker = screen.getByTestId('casino-dice-roll-marker');
    const secondFlash = screen.getByTestId('casino-dice-win-flash');

    expect(secondValue).not.toBe(firstValue);
    expect(secondMarker).not.toBe(firstMarker);
    expect(secondFlash).not.toBe(firstFlash);
    expect(secondValue).toHaveTextContent('88.00');
  });

  it('the reveal duration constant stays inside the quantified 200-500ms Result-reveal band', () => {
    expect(DICE_ROLL_REVEAL_MS).toBeGreaterThanOrEqual(200);
    expect(DICE_ROLL_REVEAL_MS).toBeLessThanOrEqual(500);
  });
});

describe('DiceStage perf check (phase1b-dice)', () => {
  it('a rapid second playOutcome cancels the previous in-flight roll animation instead of leaking it', () => {
    usePrefersReducedMotion.mockReturnValue(false);
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);

    act(() => {
      void handle.current?.playOutcome({ roll: 10, won: false });
    });
    cancelSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome({ roll: 90, won: true });
    });
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('unmounting while the roll animation is still in flight cancels it (no leaked rAF, no setState-after-unmount)', () => {
    usePrefersReducedMotion.mockReturnValue(false);
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<DiceStage ref={handle} target="50.00" direction="over" />);

    act(() => {
      void handle.current?.playOutcome({ roll: 10, won: false });
    });
    cancelSpy.mockClear();

    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('schedules the roll animation via requestAnimationFrame when motion is not reduced (animated path really runs)', () => {
    usePrefersReducedMotion.mockReturnValue(false);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);

    act(() => {
      // Never awaited — jsdom does not fire rAF reliably (file header comment).
      // The global `afterEach(cleanup)` (vitest.web.setup.ts) unmounts this
      // component, which exercises the new cancelRaf-on-unmount effect and
      // prevents this orphaned animation from leaking into later tests.
      void handle.current?.playOutcome({ roll: 45, won: true });
    });
    expect(rafSpy).toHaveBeenCalled();
  });

  it('renders no console errors or warnings across several consecutive settled rounds (win, loss, win)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    wrap(<DiceStage ref={handle} target="50.00" direction="over" />);

    await act(async () => {
      await handle.current?.playOutcome({ roll: 80, won: true });
    });
    await act(async () => {
      await handle.current?.playOutcome({ roll: 20, won: false });
    });
    await act(async () => {
      await handle.current?.playOutcome({ roll: 95, won: true });
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
