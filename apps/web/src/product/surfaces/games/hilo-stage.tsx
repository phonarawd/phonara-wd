import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HILO_MAX_GUESSES, type HiLoGuess } from '@phonara/game-engine';

import {
  formatHiloRank,
  hiloFlipStepMs,
  parseHiloOutcome,
  parseHiloProgressiveOutcome,
  type ParsedHiloOutcome,
  type ParsedHiloProgressiveOutcome,
} from '@/domain/casino-games-batch-b-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Button } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import type {
  CasinoStageHandle,
  CasinoStagePhase,
} from '@/product/surfaces/games/casino-stage-types';

export type HiloStageProps = {
  startCard: number | null;
  guesses: HiLoGuess[];
  onGuessesChange?: (next: HiLoGuess[]) => void;
  selectionDisabled?: boolean;
  /** E23 progressive — per-card guess RPC. */
  liveMode?: boolean;
  liveSessionActive?: boolean;
  liveCashoutBusy?: boolean;
  /**
   * Full card history from the active live session's `public_state.cards`
   * (`CasinoGameShell` syncs this after every guess — see
   * `parseHiloProgressiveOutcome`). Distinct from `startCard`, which is only
   * ever the first card; this drives the hero card mid-session, before the
   * round has settled (so a real guess visibly updates the card, not just
   * the streak chip).
   */
  liveCards?: number[] | null;
  /** Current cumulative multiplier from the same live `public_state`, display-only (never recomputed). */
  liveMultiplier?: number | null;
  onLiveGuess?: (guess: HiLoGuess) => void;
  onLiveCashout?: () => void;
  className?: string;
};

/** Render-only union of the one-shot and live/progressive parse shapes — never invents a field either parser didn't already return. */
type HiloOutcomeView = {
  cards: number[];
  won: boolean;
  finalMultiplier: number;
  roundCount: number;
};

function asGuesses(raw: unknown): HiLoGuess[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((g): g is HiLoGuess => g === 'higher' || g === 'lower' || g === 'skip');
}

function toOutcomeView(parsed: ParsedHiloOutcome | ParsedHiloProgressiveOutcome): HiloOutcomeView {
  if ('rounds' in parsed) {
    const last = parsed.rounds.length > 0 ? parsed.rounds[parsed.rounds.length - 1] : null;
    return {
      cards: parsed.cards,
      won: parsed.won,
      finalMultiplier: last ? last.multiplier : 1,
      roundCount: parsed.rounds.length,
    };
  }
  return {
    cards: parsed.cards,
    won: parsed.won,
    finalMultiplier: parsed.multiplier,
    roundCount: parsed.guesses.length,
  };
}

/**
 * Hi-Lo L1 — card hero + HI/LO/SKIP thumbs + streak chip (§23.2 · §23.8).
 * One-shot: pre-bet guess queue. E23 liveMode: per-card progressive guess.
 *
 * Phase 1C functional QA fix — `playOutcome` previously only tried
 * `parseHiloOutcome` (the one-shot `{cards, rounds, won}` shape), so every
 * live/progressive settle (`public_state` shape `{cards, guesses,
 * multiplier, lastCorrect}`) silently failed to parse and the settle flip
 * never ran. Now falls back to `parseHiloProgressiveOutcome`. Mid-round
 * (still-active) live guesses update the hero card via `liveCards` — the
 * shared `applyProgressiveResult` in `CasinoGameShell` only calls
 * `playOutcome` at genuine settle (mirroring Mines/Blackjack), so a
 * still-active guess would otherwise leave the card static.
 *
 * Phase 1C motion polish — the existing `visibleCardIndex` tick swapped
 * text with zero animation (plan gap: "card flip is a text index swap
 * only"). Now key-remounts the hero card on every tick (oneshot replay,
 * live increment, or terminal settle) with the new `ds-casino-card-flip`
 * token (motion.css) — transform/opacity-only, numerically synced to
 * `hiloFlipStepMs()`. Multiplier text reuses the shared Phase 1B
 * `ds-casino-reveal-in`/`ds-casino-number-pop`/`ds-casino-cashout-flash`
 * tokens (win: reveal-in + number-pop + glow, "punchy"; loss: reveal-in
 * only, CASINO_UX_CANON "lose: calm · respectful") — same convention
 * Crash/Limbo/Dice/Mines already established.
 */
export const HiloStage = forwardRef<CasinoStageHandle, HiloStageProps>(function HiloStage(
  {
    startCard,
    guesses: guessesProp,
    onGuessesChange,
    selectionDisabled,
    liveMode = false,
    liveSessionActive = false,
    liveCashoutBusy = false,
    liveCards,
    liveMultiplier,
    onLiveGuess,
    onLiveCashout,
    className,
  },
  ref,
) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CasinoStagePhase>('idle');
  const [outcome, setOutcome] = useState<HiloOutcomeView | null>(null);
  const [replayCards, setReplayCards] = useState<number[] | null>(null);
  const [visibleCardIndex, setVisibleCardIndex] = useState(0);
  /** Monotonic counter — key-remount restarts the CSS card-flip/reveal-in on each new card or settle (§Motion), mirrors crash/limbo/dice/mines. */
  const [revealPulse, setRevealPulse] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);
  const liveCardsLenRef = useRef(0);

  const guesses = useMemo(() => asGuesses(guessesProp), [guessesProp]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Perf (Phase 1C) — a live guess right before navigating away must not
  // leave the recursive flip-tick `setTimeout` chain running against an
  // unmounted component (same leaked-timer class already fixed for
  // Limbo/Dice/Mines).
  useEffect(() => clearTimer, [clearTimer]);

  // Mid-round live update (Phase 1C functional QA) — `applyProgressiveResult`
  // only calls `playOutcome` at genuine settle (busted/cashed_out/expired),
  // so a still-active correct guess would otherwise never move the hero
  // card past whatever it last showed. `liveCards` grows by exactly one
  // entry per guess; a fresh terminal replay (`phase === 'replaying'`)
  // already owns this frame's animation, so skip to avoid a double-fire.
  useEffect(() => {
    if (!liveMode || !liveSessionActive) {
      liveCardsLenRef.current = 0;
      return;
    }
    const len = liveCards?.length ?? 0;
    if (len === 0 || len === liveCardsLenRef.current) return;
    liveCardsLenRef.current = len;
    if (phase === 'replaying') return;
    setRevealPulse((n) => n + 1);
  }, [liveCards, liveMode, liveSessionActive, phase]);

  const settle = useCallback(
    (view: HiloOutcomeView) => {
      clearTimer();
      setOutcome(view);
      setReplayCards(view.cards);
      setVisibleCardIndex(Math.max(0, view.cards.length - 1));
      setPhase('settled');
      setRevealPulse((n) => n + 1);
      resolveRef.current?.();
      resolveRef.current = null;
    },
    [clearTimer],
  );

  const runFlip = useCallback(
    (view: HiloOutcomeView) => {
      clearTimer();
      setPhase('replaying');
      setOutcome(null);
      setReplayCards(view.cards);
      setVisibleCardIndex(0);
      // A fresh round starting is itself a transition (idle/live -> replaying
      // card 0) even when card 0's value is unchanged (it is always
      // `startCard`) — without this, the first frame of a new flip would
      // reuse whatever `revealPulse` key was already on screen and silently
      // skip its own entrance animation.
      setRevealPulse((n) => n + 1);

      if (reducedMotion || view.cards.length <= 1) {
        settle(view);
        return;
      }

      const step = hiloFlipStepMs();
      let i = 0;
      const tick = () => {
        i += 1;
        setVisibleCardIndex(i);
        setRevealPulse((n) => n + 1);
        if (i >= view.cards.length - 1) {
          settle(view);
          return;
        }
        timerRef.current = setTimeout(tick, step);
      };
      timerRef.current = setTimeout(tick, step);
    },
    [clearTimer, reducedMotion, settle],
  );

  useImperativeHandle(
    ref,
    () => ({
      playOutcome(result) {
        const parsed = parseHiloOutcome(result) ?? parseHiloProgressiveOutcome(result);
        if (!parsed) return Promise.resolve();
        const view = toOutcomeView(parsed);
        return new Promise<void>((resolve) => {
          resolveRef.current = resolve;
          runFlip(view);
        });
      },
      reset() {
        clearTimer();
        resolveRef.current = null;
        setPhase('idle');
        setOutcome(null);
        setReplayCards(null);
        setVisibleCardIndex(0);
        setRevealPulse(0);
        liveCardsLenRef.current = 0;
      },
    }),
    [clearTimer, runFlip],
  );

  const appendGuess = (guess: HiLoGuess) => {
    if (liveMode && liveSessionActive && onLiveGuess) {
      if (selectionDisabled || phase === 'replaying') return;
      onLiveGuess(guess);
      return;
    }
    if (selectionDisabled || phase === 'replaying' || !onGuessesChange) return;
    if (guesses.length >= HILO_MAX_GUESSES) return;
    onGuessesChange([...guesses, guess]);
  };

  const undoGuess = () => {
    if (selectionDisabled || phase === 'replaying' || !onGuessesChange) return;
    if (guesses.length === 0) return;
    onGuessesChange(guesses.slice(0, -1));
  };

  const clearGuesses = () => {
    if (selectionDisabled || phase === 'replaying' || !onGuessesChange) return;
    onGuessesChange([]);
  };

  const liveCardActive = liveMode && liveSessionActive && phase !== 'replaying';

  const displayRank = (() => {
    if (replayCards && replayCards.length > 0) {
      const idx = Math.min(visibleCardIndex, replayCards.length - 1);
      return formatHiloRank(replayCards[idx]!);
    }
    if (liveCardActive && liveCards && liveCards.length > 0) {
      return formatHiloRank(liveCards[liveCards.length - 1]!);
    }
    if (startCard != null) return formatHiloRank(startCard);
    return '?';
  })();
  const streakLabel = t('games.hilo.stage.guessCount', { count: guesses.length });
  const won = outcome?.won === true;
  const settledOutcome = outcome && outcome.roundCount > 0 ? outcome : null;
  const liveMultiplierValue =
    !settledOutcome && liveCardActive && typeof liveMultiplier === 'number' ? liveMultiplier : null;

  return (
    <Card
      variant="casino-play"
      className={cn(className)}
      data-testid="casino-hilo-stage"
      data-stage-phase={phase}
      data-live-mode={liveMode ? 'true' : 'false'}
      data-won={outcome ? (won ? 'true' : 'false') : undefined}
      data-guess-count={guesses.length}
    >
      <CardBody className="flex min-h-[280px] flex-col items-center gap-4 p-4 md:min-h-[360px] md:p-6">
        <div
          className="bg-accent/10 text-accent rounded-full px-3 py-1 text-xs font-semibold"
          data-testid="casino-hilo-streak-chip"
        >
          {streakLabel}
        </div>

        <div
          key={`card-${revealPulse}`}
          className={cn(
            'border-line bg-surface-raised flex size-28 items-center justify-center rounded-xl border-2 text-5xl font-semibold tabular-nums md:size-36 md:text-6xl',
            outcome
              ? won
                ? 'border-success text-success'
                : 'border-danger text-danger'
              : 'text-foreground',
            !reducedMotion && 'ds-casino-card-flip',
          )}
          data-testid="casino-hilo-card-hero"
          aria-live="polite"
        >
          {displayRank}
        </div>

        {settledOutcome ? (
          <span className="relative inline-flex items-baseline">
            {won && !reducedMotion ? (
              <span
                key={`glow-${revealPulse}`}
                aria-hidden="true"
                data-testid="casino-hilo-win-flash"
                className="ds-casino-cashout-flash"
              />
            ) : null}
            <p
              key={`mult-${revealPulse}`}
              className={cn(
                'm-0 text-sm tabular-nums',
                won ? 'text-success' : 'text-danger',
                !reducedMotion && 'ds-casino-reveal-in',
                won && !reducedMotion && 'ds-casino-number-pop',
              )}
              data-testid="casino-hilo-round-mult"
            >
              {settledOutcome.finalMultiplier.toFixed(2)}×
            </p>
          </span>
        ) : liveMultiplierValue !== null ? (
          <p
            key={`live-mult-${revealPulse}`}
            className={cn(
              'text-foreground-muted m-0 text-sm tabular-nums',
              !reducedMotion && 'ds-casino-reveal-in',
            )}
            data-testid="casino-hilo-live-mult"
          >
            {t('games.hilo.stage.currentMult')}: {liveMultiplierValue.toFixed(2)}×
          </p>
        ) : (
          <p className="text-foreground-muted m-0 text-sm">{t('casino.stage.streak')}</p>
        )}

        <div className="flex w-full max-w-md flex-wrap justify-center gap-2">
          <button
            type="button"
            className="border-line bg-surface-raised text-foreground min-h-12 min-w-22 flex-1 rounded-md border px-3 text-sm font-semibold"
            data-testid="casino-hilo-guess-higher"
            disabled={
              selectionDisabled || phase === 'replaying' || guesses.length >= HILO_MAX_GUESSES
            }
            onClick={() => appendGuess('higher')}
          >
            {t('games.hilo.higher')}
          </button>
          <button
            type="button"
            className="border-line bg-surface-raised text-foreground min-h-12 min-w-22 flex-1 rounded-md border px-3 text-sm font-semibold"
            data-testid="casino-hilo-guess-lower"
            disabled={
              selectionDisabled || phase === 'replaying' || guesses.length >= HILO_MAX_GUESSES
            }
            onClick={() => appendGuess('lower')}
          >
            {t('games.hilo.lower')}
          </button>
          <button
            type="button"
            className="border-line bg-surface-raised text-foreground min-h-12 min-w-22 flex-1 rounded-md border px-3 text-sm font-semibold"
            data-testid="casino-hilo-guess-skip"
            disabled={
              selectionDisabled || phase === 'replaying' || guesses.length >= HILO_MAX_GUESSES
            }
            onClick={() => appendGuess('skip')}
          >
            {t('games.hilo.skip')}
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className="text-foreground-muted min-h-12 rounded-md px-3 text-sm"
            data-testid="casino-hilo-undo"
            disabled={selectionDisabled || phase === 'replaying' || guesses.length === 0}
            onClick={undoGuess}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="text-foreground-muted min-h-12 rounded-md px-3 text-sm"
            data-testid="casino-hilo-clear"
            disabled={selectionDisabled || phase === 'replaying' || guesses.length === 0}
            onClick={clearGuesses}
          >
            {t('games.hilo.stage.reset')}
          </button>
        </div>

        {guesses.length > 0 ? (
          <ol
            className="text-foreground-muted m-0 flex list-none flex-wrap justify-center gap-1 p-0 text-xs"
            data-testid="casino-hilo-guess-queue"
          >
            {guesses.map((g, i) => (
              <li
                key={`${g}-${i}`}
                className="border-line bg-surface-raised rounded-md border px-2 py-1"
              >
                {g === 'higher'
                  ? t('casino.option.higher')
                  : g === 'lower'
                    ? t('casino.option.lower')
                    : t('casino.option.skip')}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-foreground-muted m-0 text-sm">{t('games.hilo.guessPrompt')}</p>
        )}

        {liveMode && liveSessionActive && onLiveCashout ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={liveCashoutBusy || guesses.length === 0}
            onClick={onLiveCashout}
            data-testid="casino-hilo-live-cashout"
          >
            {t('casino.progressive.cashout')}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
});
