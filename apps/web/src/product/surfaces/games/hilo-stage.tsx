import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { HILO_MAX_GUESSES, type HiLoGuess } from '@phonara/game-engine';

import {
  formatHiloRank,
  hiloFlipStepMs,
  parseHiloOutcome,
  type ParsedHiloOutcome,
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
  onLiveGuess?: (guess: HiLoGuess) => void;
  onLiveCashout?: () => void;
  className?: string;
};

function asGuesses(raw: unknown): HiLoGuess[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((g): g is HiLoGuess => g === 'higher' || g === 'lower' || g === 'skip');
}

/**
 * Hi-Lo L1 — card hero + HI/LO/SKIP thumbs + streak chip (§23.2 · §23.8).
 * One-shot: pre-bet guess queue. E23 liveMode: per-card progressive guess.
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
    onLiveGuess,
    onLiveCashout,
    className,
  },
  ref,
) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CasinoStagePhase>('idle');
  const [outcome, setOutcome] = useState<ParsedHiloOutcome | null>(null);
  const [replayCards, setReplayCards] = useState<number[] | null>(null);
  const [visibleCardIndex, setVisibleCardIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const guesses = useMemo(() => asGuesses(guessesProp), [guessesProp]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const settle = useCallback(
    (parsed: ParsedHiloOutcome) => {
      clearTimer();
      setOutcome(parsed);
      setReplayCards(parsed.cards);
      setVisibleCardIndex(Math.max(0, parsed.cards.length - 1));
      setPhase('settled');
      resolveRef.current?.();
      resolveRef.current = null;
    },
    [clearTimer],
  );

  const runFlip = useCallback(
    (parsed: ParsedHiloOutcome) => {
      clearTimer();
      setPhase('replaying');
      setOutcome(null);
      setReplayCards(parsed.cards);
      setVisibleCardIndex(0);

      if (reducedMotion || parsed.cards.length <= 1) {
        settle(parsed);
        return;
      }

      const step = hiloFlipStepMs();
      let i = 0;
      const tick = () => {
        i += 1;
        setVisibleCardIndex(i);
        if (i >= parsed.cards.length - 1) {
          settle(parsed);
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
        const parsed = parseHiloOutcome(result);
        if (!parsed) return Promise.resolve();
        return new Promise<void>((resolve) => {
          resolveRef.current = resolve;
          runFlip(parsed);
        });
      },
      reset() {
        clearTimer();
        resolveRef.current = null;
        setPhase('idle');
        setOutcome(null);
        setReplayCards(null);
        setVisibleCardIndex(0);
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

  const displayRank = (() => {
    if (replayCards && replayCards.length > 0) {
      const idx = Math.min(visibleCardIndex, replayCards.length - 1);
      return formatHiloRank(replayCards[idx]!);
    }
    if (startCard != null) return formatHiloRank(startCard);
    return '?';
  })();
  const streakLabel = t('games.hilo.stage.guessCount', { count: guesses.length });
  const won = outcome?.won === true;
  const lastRound =
    outcome && outcome.rounds.length > 0 ? outcome.rounds[outcome.rounds.length - 1] : null;

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
          className={cn(
            'border-line bg-surface-raised flex size-28 items-center justify-center rounded-xl border-2 text-5xl font-semibold tabular-nums md:size-36 md:text-6xl',
            outcome
              ? won
                ? 'border-success text-success'
                : 'border-danger text-danger'
              : 'text-foreground',
          )}
          data-testid="casino-hilo-card-hero"
          aria-live="polite"
        >
          {displayRank}
        </div>

        {lastRound ? (
          <p
            className="text-foreground-muted m-0 text-sm tabular-nums"
            data-testid="casino-hilo-round-mult"
          >
            {lastRound.multiplier.toFixed(2)}×
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
