import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { BlackjackMove } from '@phonara/game-engine';

import {
  blackjackRevealMs,
  CASINO_BLACKJACK_ACTIONS_HELP_KEY,
  CASINO_BLACKJACK_MOVES,
  normalizeBlackjackActions,
  parseBlackjackOutcome,
  type ParsedBlackjackOutcome,
} from '@/domain/casino-games-batch-d-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Card, CardBody } from '@/product/primitives/card';
import { HelpTip } from '@/product/primitives/help-tip';
import type {
  CasinoStageHandle,
  CasinoStagePhase,
} from '@/product/surfaces/games/casino-stage-types';

export type BlackjackAction = { seat: number; move: BlackjackMove };

export type BlackjackStageProps = {
  actions: BlackjackAction[];
  onActionsChange?: (next: BlackjackAction[]) => void;
  selectionDisabled?: boolean;
  /** E23 progressive — live hit/stand/double RPC. */
  liveMode?: boolean;
  liveSessionActive?: boolean;
  onLiveMove?: (move: BlackjackMove) => void;
  className?: string;
};

const MOVE_LABEL_KEYS: Record<BlackjackMove, string> = {
  hit: 'casino.action.hit',
  stand: 'casino.action.stand',
  double: 'casino.action.double',
  split: 'casino.action.split',
  insurance: 'casino.action.insurance',
};

/**
 * Blackjack L1 — felt table · dealer slot always visible · action queue (§23.2 · §23.8).
 * One-shot: pre-commit action queue. E23 liveMode: hit/stand/double RPC round-trips.
 */
export const BlackjackStage = forwardRef<CasinoStageHandle, BlackjackStageProps>(
  function BlackjackStage(
    {
      actions: actionsProp,
      onActionsChange,
      selectionDisabled,
      liveMode = false,
      liveSessionActive = false,
      onLiveMove,
      className,
    },
    ref,
  ) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedBlackjackOutcome | null>(null);
    const [revealStep, setRevealStep] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const actions = useMemo(() => normalizeBlackjackActions(actionsProp), [actionsProp]);
    const locked = selectionDisabled || phase === 'replaying' || !onActionsChange;

    const clearTimer = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    const settle = useCallback(
      (parsed: ParsedBlackjackOutcome) => {
        clearTimer();
        setRevealStep(Math.max(1, actions.length));
        setOutcome(parsed);
        setPhase('settled');
        resolveRef.current?.();
        resolveRef.current = null;
      },
      [actions.length, clearTimer],
    );

    const runReveal = useCallback(
      (parsed: ParsedBlackjackOutcome) => {
        clearTimer();
        setPhase('replaying');
        setOutcome(null);
        setRevealStep(0);

        if (reducedMotion || actions.length === 0) {
          settle(parsed);
          return;
        }

        const step = blackjackRevealMs() / Math.max(1, actions.length);
        let i = 0;
        const tick = () => {
          i += 1;
          setRevealStep(i);
          if (i >= actions.length) {
            settle(parsed);
            return;
          }
          timerRef.current = setTimeout(tick, step);
        };
        timerRef.current = setTimeout(tick, step);
      },
      [actions.length, clearTimer, reducedMotion, settle],
    );

    useImperativeHandle(
      ref,
      () => ({
        playOutcome(result) {
          const parsed = parseBlackjackOutcome(result);
          if (!parsed) return Promise.resolve();
          return new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            runReveal(parsed);
          });
        },
        reset() {
          clearTimer();
          resolveRef.current = null;
          setPhase('idle');
          setOutcome(null);
          setRevealStep(0);
        },
      }),
      [clearTimer, runReveal],
    );

    const appendMove = (move: BlackjackMove) => {
      if (liveMode && liveSessionActive && onLiveMove) {
        if (selectionDisabled || phase === 'replaying') return;
        onLiveMove(move);
        return;
      }
      if (locked) return;
      if (actions.length >= 12) return;
      onActionsChange?.([...actions, { seat: 0, move }]);
    };

    const resetActions = () => {
      if (locked) return;
      onActionsChange?.([{ seat: 0, move: 'stand' }]);
    };

    const clearActions = () => {
      if (locked) return;
      onActionsChange?.([]);
    };

    const won = outcome !== null && outcome.totalMultiplier > 0;
    const dealerRevealed = phase === 'settled' || phase === 'replaying';

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-blackjack-stage"
        data-stage-phase={phase}
        data-live-mode={liveMode ? 'true' : 'false'}
        data-won={outcome ? (won ? 'true' : 'false') : undefined}
        data-action-count={actions.length}
      >
        <CardBody className="flex min-h-[280px] flex-col items-center gap-4 p-4 md:min-h-[360px] md:p-6">
          <HelpTip
            label={t('casino.game.blackjack.name')}
            bodyKey={CASINO_BLACKJACK_ACTIONS_HELP_KEY}
          />

          <div
            className="border-line bg-success/10 flex w-full max-w-md flex-col items-center gap-2 rounded-xl border p-4"
            data-testid="casino-blackjack-felt"
          >
            <div className="flex flex-col items-center gap-2" data-testid="casino-blackjack-dealer">
              <span className="text-foreground-muted text-xs font-medium">
                {t('casino.stage.dealer')}
              </span>
              <div
                className={cn(
                  'border-line bg-surface-raised flex h-16 w-12 items-center justify-center rounded-md border-2 text-lg font-semibold',
                  dealerRevealed ? 'border-accent text-accent' : 'text-foreground-muted',
                )}
                data-testid="casino-blackjack-dealer-upcard"
                aria-live="polite"
              >
                {dealerRevealed ? (outcome ? 'UP' : '…') : '?'}
              </div>
            </div>

            <div
              className="mt-4 flex flex-col items-center gap-2"
              data-testid="casino-blackjack-player"
            >
              <span className="text-foreground-muted text-xs font-medium">
                {t('casino.stage.player')}
              </span>
              <div
                className={cn(
                  'border-line bg-surface-raised flex h-16 w-12 items-center justify-center rounded-md border-2 text-lg font-semibold',
                  outcome
                    ? won
                      ? 'border-success text-success'
                      : 'border-danger text-danger'
                    : 'text-foreground',
                )}
                data-testid="casino-blackjack-player-hand"
              >
                {outcome ? (won ? t('games.blackjack.win') : t('games.blackjack.loss')) : '—'}
              </div>
            </div>
          </div>

          {outcome ? (
            <p
              className="text-foreground m-0 text-xl font-semibold tabular-nums"
              data-testid="casino-blackjack-mult"
            >
              {outcome.totalMultiplier.toFixed(2)}×
            </p>
          ) : (
            <p className="text-foreground-muted m-0 text-sm">{t('casino.game.blackjack.idle')}</p>
          )}

          <div
            className="grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-3"
            data-testid="casino-blackjack-action-bar"
          >
            {CASINO_BLACKJACK_MOVES.map((move) => (
              <button
                key={move}
                type="button"
                className="border-line bg-surface-raised text-foreground min-h-12 rounded-md border px-3 text-sm font-semibold"
                data-testid={
                  liveMode && liveSessionActive && move === 'hit'
                    ? 'casino-blackjack-live-hit'
                    : `casino-blackjack-action-${move}`
                }
                disabled={
                  liveMode && liveSessionActive
                    ? selectionDisabled ||
                      phase === 'replaying' ||
                      move === 'split' ||
                      move === 'insurance'
                    : locked || actions.length >= 12
                }
                onClick={() => appendMove(move)}
              >
                {t(MOVE_LABEL_KEYS[move] as 'casino.action.hit')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="text-foreground-muted min-h-12 rounded-md px-3 text-sm"
              data-testid="casino-blackjack-reset"
              disabled={locked}
              onClick={resetActions}
            >
              {t('casino.blackjack.action.reset')}
            </button>
            <button
              type="button"
              className="text-foreground-muted min-h-12 rounded-md px-3 text-sm"
              data-testid="casino-blackjack-clear"
              disabled={locked || actions.length === 0}
              onClick={clearActions}
            >
              {t('common.cancel')}
            </button>
          </div>

          {actions.length > 0 ? (
            <ol
              className="text-foreground-muted m-0 flex list-none flex-wrap justify-center gap-1 p-0 text-xs"
              data-testid="casino-blackjack-action-queue"
            >
              {actions.map((a, i) => (
                <li
                  key={`${a.move}-${i}`}
                  className={cn(
                    'border-line bg-surface-raised rounded-md border px-2 py-1',
                    revealStep > i && 'border-accent text-accent',
                  )}
                >
                  {t(MOVE_LABEL_KEYS[a.move] as 'casino.action.hit')}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-foreground-muted m-0 text-sm">
              {t('casino.blackjack.hint.pre_commit')}
            </p>
          )}
        </CardBody>
      </Card>
    );
  },
);
