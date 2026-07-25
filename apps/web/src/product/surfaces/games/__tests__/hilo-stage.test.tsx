/**
 * Hilo — Phase 1C functional QA + quantified motion polish + perf check (phase1c-hilo).
 * Covers what casino-games-batch-b-stages.test.tsx does not: the E23 live/progressive
 * settle shape mismatch (`playOutcome` previously only tried the one-shot
 * `{cards, rounds, won}` parser and silently no-op'd on the live `{cards, guesses,
 * multiplier, lastCorrect}` shape — see `parseHiloProgressiveOutcome` doc), the
 * mid-round live card/streak update (a correct guess previously left the hero card
 * static because `CasinoGameShell.applyProgressiveResult` only calls `playOutcome`
 * at genuine settle, mirroring Mines/Blackjack), the new `ds-casino-card-flip`
 * token (real flip, not a text-index swap), and the flip-tick timer leak on unmount.
 * Mirrors mines-stage.test.tsx's functional-QA/motion-polish/perf-check structure
 * for its sibling grid/reveal game. Hilo's flip is a recursive real `setTimeout`
 * chain at a fixed 280ms/card (`hiloFlipStepMs()`), so — like mines-stage.test.tsx —
 * animated-path tests just `await` the real delay rather than needing a rAF stub.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { HiloStage } from '@/product/surfaces/games/hilo-stage';
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

function guessCount(): string | null {
  return screen.getByTestId('casino-hilo-stage').getAttribute('data-guess-count');
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  usePrefersReducedMotion.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HiloStage functional QA — hi/lo/skip, live cash-out, card flip (phase1c-hilo)', () => {
  it('renders idle with no guesses, a blank card, and no cash-out control', () => {
    wrap(<HiloStage startCard={null} guesses={[]} />);
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('?');
    expect(guessCount()).toBe('0');
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.queryByTestId('casino-hilo-live-cashout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('casino-hilo-guess-queue')).not.toBeInTheDocument();
  });

  it('shows the start card once assigned, before any guess', () => {
    wrap(<HiloStage startCard={7} guesses={[]} />);
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('7');
  });

  it('hi/lo/skip — appending and undoing a pre-bet guess responds immediately (not a dead control)', () => {
    const onGuessesChange = vi.fn();
    const { rerender } = wrap(
      <HiloStage startCard={7} guesses={[]} onGuessesChange={onGuessesChange} />,
    );
    fireEvent.click(screen.getByTestId('casino-hilo-guess-higher'));
    expect(onGuessesChange).toHaveBeenCalledWith(['higher']);

    onGuessesChange.mockClear();
    rerender(
      <I18nProvider>
        <HiloStage startCard={7} guesses={['higher']} onGuessesChange={onGuessesChange} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByTestId('casino-hilo-guess-skip'));
    expect(onGuessesChange).toHaveBeenCalledWith(['higher', 'skip']);

    onGuessesChange.mockClear();
    fireEvent.click(screen.getByTestId('casino-hilo-undo'));
    expect(onGuessesChange).toHaveBeenCalledWith([]);

    onGuessesChange.mockClear();
    rerender(
      <I18nProvider>
        <HiloStage startCard={7} guesses={['higher', 'lower']} onGuessesChange={onGuessesChange} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByTestId('casino-hilo-clear'));
    expect(onGuessesChange).toHaveBeenCalledWith([]);
  });

  it('a decisive oneshot multi-guess round flips through every card and settles won=true', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={['higher', 'higher']} />);
    await act(async () => {
      await handle.current?.playOutcome({
        cards: [7, 9, 11],
        rounds: [
          { card: 7, guess: 'higher', correct: true, multiplier: 1.48 },
          { card: 9, guess: 'higher', correct: true, multiplier: 2.19 },
        ],
        won: true,
      });
    });
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('J');
    expect(screen.getByTestId('casino-hilo-round-mult')).toHaveTextContent('2.19×');
  });

  it('a losing oneshot round settles on the busting card with won=false', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={['higher']} />);
    await act(async () => {
      await handle.current?.playOutcome({
        cards: [7, 3],
        rounds: [{ card: 7, guess: 'higher', correct: false, multiplier: 0 }],
        won: false,
      });
    });
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('3');
    expect(screen.getByTestId('casino-hilo-round-mult')).toHaveTextContent('0.00×');
  });

  it('live mode — hi/lo/skip route through onLiveGuess, not the local pre-bet queue', () => {
    const onLiveGuess = vi.fn();
    const onGuessesChange = vi.fn();
    wrap(
      <HiloStage
        startCard={null}
        guesses={[]}
        liveMode
        liveSessionActive
        liveCards={[7]}
        onLiveGuess={onLiveGuess}
        onLiveCashout={vi.fn()}
        onGuessesChange={onGuessesChange}
      />,
    );
    fireEvent.click(screen.getByTestId('casino-hilo-guess-lower'));
    expect(onLiveGuess).toHaveBeenCalledWith('lower');
    fireEvent.click(screen.getByTestId('casino-hilo-guess-skip'));
    expect(onLiveGuess).toHaveBeenCalledWith('skip');
    expect(onGuessesChange).not.toHaveBeenCalled();
  });

  it('live mode — a correct guess updates the hero card and streak immediately even though the round stays active (not a dead control)', () => {
    // Fixed 2026-07-15 (Phase 1C functional QA, P0) — CasinoGameShell only
    // calls stageRef.playOutcome() at genuine settle; a still-active guess
    // must update the card via the `liveCards`/`guesses` props instead, or
    // the click silently does nothing visible.
    const { rerender } = wrap(
      <HiloStage
        startCard={null}
        guesses={[]}
        liveMode
        liveSessionActive
        liveCards={[7]}
        onLiveGuess={vi.fn()}
        onLiveCashout={vi.fn()}
      />,
    );
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('7');
    expect(guessCount()).toBe('0');

    rerender(
      <I18nProvider>
        <HiloStage
          startCard={null}
          guesses={['higher']}
          liveMode
          liveSessionActive
          liveCards={[7, 9]}
          liveMultiplier={1.48}
          onLiveGuess={vi.fn()}
          onLiveCashout={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('9');
    expect(guessCount()).toBe('1');
    expect(screen.getByTestId('casino-hilo-live-mult')).toHaveTextContent('1.48×');
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-stage-phase', 'idle');
  });

  it('live cash-out — hidden without an active session, disabled at 0 guesses, enabled after a guess', () => {
    const onLiveCashout = vi.fn();
    const { rerender } = wrap(
      <HiloStage
        startCard={null}
        guesses={[]}
        liveMode
        liveSessionActive={false}
        onLiveGuess={vi.fn()}
        onLiveCashout={onLiveCashout}
      />,
    );
    expect(screen.queryByTestId('casino-hilo-live-cashout')).not.toBeInTheDocument();

    rerender(
      <I18nProvider>
        <HiloStage
          startCard={null}
          guesses={[]}
          liveMode
          liveSessionActive
          liveCards={[7]}
          onLiveGuess={vi.fn()}
          onLiveCashout={onLiveCashout}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-hilo-live-cashout')).toBeDisabled();

    rerender(
      <I18nProvider>
        <HiloStage
          startCard={null}
          guesses={['higher']}
          liveMode
          liveSessionActive
          liveCards={[7, 9]}
          onLiveGuess={vi.fn()}
          onLiveCashout={onLiveCashout}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-hilo-live-cashout')).toBeEnabled();
    fireEvent.click(screen.getByTestId('casino-hilo-live-cashout'));
    expect(onLiveCashout).toHaveBeenCalledTimes(1);
  });

  it('live cash-out settle (via playOutcome) renders the RPC-confirmed multiplier as a clean win', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <HiloStage
        ref={handle}
        startCard={null}
        guesses={['higher']}
        liveMode
        liveSessionActive
        liveCards={[7, 9]}
        onLiveGuess={vi.fn()}
        onLiveCashout={vi.fn()}
      />,
    );
    await act(async () => {
      // rpc_progressive_cashout shape — public_state merged with cashedOut:true.
      await handle.current?.playOutcome({
        cards: [7, 9],
        guesses: ['higher'],
        multiplier: '1.480000',
        lastCorrect: true,
        cashedOut: true,
      });
    });
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('9');
    expect(screen.getByTestId('casino-hilo-round-mult')).toHaveTextContent('1.48×');
    // Win-flash/reveal-in class presence (motion, not function) is covered by
    // the dedicated "winning settle adds the number-pop and glow flash" test
    // below — reduced motion is mocked true here for a fast functional check.
  });

  it('live bust — a wrong guess settles on the losing card, calm styling, no cash-out control once the session clears', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    const { rerender } = wrap(
      <HiloStage
        ref={handle}
        startCard={null}
        guesses={['higher']}
        liveMode
        liveSessionActive
        liveCards={[7, 9]}
        onLiveGuess={vi.fn()}
        onLiveCashout={vi.fn()}
      />,
    );
    await act(async () => {
      // rpc_progressive_step busted shape — multiplier forced to 0, lastCorrect:false.
      await handle.current?.playOutcome({
        cards: [7, 9, 4],
        guesses: ['higher', 'higher'],
        multiplier: '0.000000',
        lastCorrect: false,
      });
    });
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('4');
    expect(screen.getByTestId('casino-hilo-round-mult')).toHaveTextContent('0.00×');
    expect(screen.queryByTestId('casino-hilo-win-flash')).not.toBeInTheDocument();

    // Session cleared — CasinoGameShell drives liveSessionActive from real
    // progressiveSession state; the isolated stage test simulates the
    // resulting prop change (shell round-trip covered in casino-game-shell.test.tsx).
    rerender(
      <I18nProvider>
        <HiloStage
          ref={handle}
          startCard={null}
          guesses={['higher', 'higher']}
          liveMode
          liveSessionActive={false}
          onLiveGuess={vi.fn()}
          onLiveCashout={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.queryByTestId('casino-hilo-live-cashout')).not.toBeInTheDocument();
  });

  it('a malformed RPC result (neither one-shot nor progressive shape) is ignored — no crash, no phase change, control stays responsive', async () => {
    const onGuessesChange = vi.fn();
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={[]} onGuessesChange={onGuessesChange} />);
    await act(async () => {
      await handle.current?.playOutcome({ cards: [0] });
    });
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-hilo-stage')).not.toHaveAttribute('data-won');
    fireEvent.click(screen.getByTestId('casino-hilo-guess-higher'));
    expect(onGuessesChange).toHaveBeenCalledWith(['higher']);
  });

  it('reset() clears the settled outcome back to idle for the next round', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={['higher']} />);
    await act(async () => {
      await handle.current?.playOutcome({
        cards: [7, 9],
        rounds: [{ card: 7, guess: 'higher', correct: true, multiplier: 1.48 }],
        won: true,
      });
    });
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-stage-phase', 'settled');
    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-hilo-stage')).not.toHaveAttribute('data-won');
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('7');
  });
});

describe('HiloStage quantified motion polish — real card-flip + suspense beat + win-only pop (phase1c-hilo)', () => {
  it('a fresh multi-card flip remounts the hero card with the card-flip class on every tick (real flip, not a static text swap)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={[]} />);
    // The class itself is present from first mount whenever motion is
    // enabled (mirrors mines-stage's `ds-casino-reveal-in` on
    // `casino-mines-cashout-mult`, present from its own first render too) —
    // the flip *restarts* via the key-remount below, not via the class
    // being conditionally added/removed.
    const heroIdle = screen.getByTestId('casino-hilo-card-hero');
    expect(heroIdle).toHaveClass('ds-casino-card-flip');

    act(() => {
      void handle.current?.playOutcome({
        cards: [7, 9, 4],
        rounds: [
          { card: 7, guess: 'higher', correct: true, multiplier: 1.48 },
          { card: 9, guess: 'higher', correct: false, multiplier: 0 },
        ],
        won: false,
      });
    });

    // First frame — card 0 ("7") already flips: starting a fresh round is
    // itself a state transition, not just a value change.
    await waitFor(() => {
      expect(screen.getByTestId('casino-hilo-card-hero')).toHaveClass('ds-casino-card-flip');
    });
    const heroTick0 = screen.getByTestId('casino-hilo-card-hero');
    expect(heroTick0).toHaveTextContent('7');

    // hiloFlipStepMs() === 280ms — wait past the first tick; the card
    // advances to a genuinely new DOM node (key-remount), not an in-place
    // text mutation.
    await new Promise((resolve) => setTimeout(resolve, 340));
    const heroTick1 = screen.getByTestId('casino-hilo-card-hero');
    expect(heroTick1).toHaveTextContent('9');
    expect(heroTick1).not.toBe(heroTick0);
    expect(heroTick1).toHaveClass('ds-casino-card-flip');

    await waitFor(() => {
      expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute(
        'data-stage-phase',
        'settled',
      );
    });
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('4');
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-won', 'false');
  });

  it('a live guess pulses the card-flip class on the hero card without entering phase=replaying', () => {
    const { rerender } = wrap(
      <HiloStage
        startCard={null}
        guesses={[]}
        liveMode
        liveSessionActive
        liveCards={[7]}
        onLiveGuess={vi.fn()}
        onLiveCashout={vi.fn()}
      />,
    );
    rerender(
      <I18nProvider>
        <HiloStage
          startCard={null}
          guesses={['higher']}
          liveMode
          liveSessionActive
          liveCards={[7, 9]}
          onLiveGuess={vi.fn()}
          onLiveCashout={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveClass('ds-casino-card-flip');
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('9');
    expect(screen.getByTestId('casino-hilo-stage')).toHaveAttribute('data-stage-phase', 'idle');
  });

  it('reduced motion skips the card-flip class on a live guess update', () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const { rerender } = wrap(
      <HiloStage
        startCard={null}
        guesses={[]}
        liveMode
        liveSessionActive
        liveCards={[7]}
        onLiveGuess={vi.fn()}
        onLiveCashout={vi.fn()}
      />,
    );
    rerender(
      <I18nProvider>
        <HiloStage
          startCard={null}
          guesses={['higher']}
          liveMode
          liveSessionActive
          liveCards={[7, 9]}
          onLiveGuess={vi.fn()}
          onLiveCashout={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-hilo-card-hero')).not.toHaveClass('ds-casino-card-flip');
    expect(screen.getByTestId('casino-hilo-card-hero')).toHaveTextContent('9');
  });

  it('a winning settle adds the number-pop and glow flash on top of the reveal-in (punchy — CASINO_UX_CANON)', async () => {
    // Real (non-reduced) motion — the 2-card result needs exactly one
    // 280ms flip tick (hiloFlipStepMs()) before settle() fires.
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={['higher']} />);
    await act(async () => {
      await handle.current?.playOutcome({
        cards: [7, 9],
        rounds: [{ card: 7, guess: 'higher', correct: true, multiplier: 1.48 }],
        won: true,
      });
    });
    const mult = screen.getByTestId('casino-hilo-round-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).toHaveClass('ds-casino-number-pop');
    expect(mult).toHaveClass('text-success');
    expect(screen.getByTestId('casino-hilo-win-flash')).toBeInTheDocument();
  });

  it('a losing settle stays calm — reveal-in only, no pop, no glow (CASINO_UX_CANON: lose is respectful)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={['higher']} />);
    await act(async () => {
      await handle.current?.playOutcome({
        cards: [7, 3],
        rounds: [{ card: 7, guess: 'higher', correct: false, multiplier: 0 }],
        won: false,
      });
    });
    const mult = screen.getByTestId('casino-hilo-round-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(mult).toHaveClass('text-danger');
    expect(screen.queryByTestId('casino-hilo-win-flash')).not.toBeInTheDocument();
  });

  it('reduced motion collapses a multi-card flip to instant — no card-flip, no reveal-in, no pop, no glow, correct final value', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={['higher', 'higher']} />);
    await act(async () => {
      await handle.current?.playOutcome({
        cards: [7, 9, 11],
        rounds: [
          { card: 7, guess: 'higher', correct: true, multiplier: 1.48 },
          { card: 9, guess: 'higher', correct: true, multiplier: 2.19 },
        ],
        won: true,
      });
    });
    const hero = screen.getByTestId('casino-hilo-card-hero');
    expect(hero).toHaveTextContent('J');
    expect(hero).not.toHaveClass('ds-casino-card-flip');
    const mult = screen.getByTestId('casino-hilo-round-mult');
    expect(mult).toHaveTextContent('2.19×');
    expect(mult).not.toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-hilo-win-flash')).not.toBeInTheDocument();
  });

  it('shows the live current-multiplier line during an active session and swaps to the settled line once the round ends', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    const { rerender } = wrap(
      <HiloStage
        ref={handle}
        startCard={null}
        guesses={[]}
        liveMode
        liveSessionActive
        liveCards={[7]}
        onLiveGuess={vi.fn()}
        onLiveCashout={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('casino-hilo-live-mult')).not.toBeInTheDocument();

    rerender(
      <I18nProvider>
        <HiloStage
          ref={handle}
          startCard={null}
          guesses={['higher']}
          liveMode
          liveSessionActive
          liveCards={[7, 9]}
          liveMultiplier={1.48}
          onLiveGuess={vi.fn()}
          onLiveCashout={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-hilo-live-mult')).toHaveTextContent('1.48×');
    expect(screen.queryByTestId('casino-hilo-round-mult')).not.toBeInTheDocument();

    await act(async () => {
      await handle.current?.playOutcome({
        cards: [7, 9],
        guesses: ['higher'],
        multiplier: '1.480000',
        lastCorrect: true,
        cashedOut: true,
      });
    });
    expect(screen.queryByTestId('casino-hilo-live-mult')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-hilo-round-mult')).toHaveTextContent('1.48×');
  });
});

describe('HiloStage perf check (phase1c-hilo)', () => {
  it('starting a new flip clears the previous flip-tick timer instead of leaking it', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={['higher', 'higher']} />);

    act(() => {
      void handle.current?.playOutcome({
        cards: [7, 9, 11],
        rounds: [
          { card: 7, guess: 'higher', correct: true, multiplier: 1.48 },
          { card: 9, guess: 'higher', correct: true, multiplier: 2.19 },
        ],
        won: true,
      });
    });
    clearSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome({
        cards: [7, 3],
        rounds: [{ card: 7, guess: 'higher', correct: false, multiplier: 0 }],
        won: false,
      });
    });
    expect(clearSpy).toHaveBeenCalled();
  });

  it('unmounting mid-flip clears the pending recursive timer instead of leaking it', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(
      <HiloStage ref={handle} startCard={7} guesses={['higher', 'higher']} />,
    );

    act(() => {
      void handle.current?.playOutcome({
        cards: [7, 9, 11],
        rounds: [
          { card: 7, guess: 'higher', correct: true, multiplier: 1.48 },
          { card: 9, guess: 'higher', correct: true, multiplier: 2.19 },
        ],
        won: true,
      });
    });
    clearSpy.mockClear();

    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('a live bust immediately followed by unmount produces no console errors or warnings from a leaked flip-tick timer', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(
      <HiloStage
        ref={handle}
        startCard={null}
        guesses={['higher']}
        liveMode
        liveSessionActive
        liveCards={[7, 9]}
        onLiveGuess={vi.fn()}
        onLiveCashout={vi.fn()}
      />,
    );

    act(() => {
      void handle.current?.playOutcome({
        cards: [7, 9, 4],
        guesses: ['higher', 'higher'],
        multiplier: '0.000000',
        lastCorrect: false,
      });
    });
    unmount();

    // If the flip-tick recursive setTimeout chain were not cancelled on
    // unmount, the still-pending tick would fire during this real wait and
    // call setState on the now-unmounted component — React logs that as a
    // console.error. Waiting past the full flip duration (2 ticks * 280ms
    // ceiling) proves the leak is actually closed, not just that the spy was
    // called once at unmount time.
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('drives every reveal/pop/glow/card-flip effect through CSS classes only — no inline style', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<HiloStage ref={handle} startCard={7} guesses={['higher']} />);
    await act(async () => {
      await handle.current?.playOutcome({
        cards: [7, 9],
        rounds: [{ card: 7, guess: 'higher', correct: true, multiplier: 1.48 }],
        won: true,
      });
    });
    expect(screen.getByTestId('casino-hilo-round-mult')).not.toHaveAttribute('style');
    expect(screen.getByTestId('casino-hilo-win-flash')).not.toHaveAttribute('style');
    expect(screen.getByTestId('casino-hilo-card-hero')).not.toHaveAttribute('style');
  });
});
