import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { BlackjackMove } from '@phonara/game-engine';

import {
  blackjackDealStepMs,
  blackjackRevealMs,
  CASINO_BLACKJACK_ACTIONS_HELP_KEY,
  CASINO_BLACKJACK_MOVES,
  decodeBlackjackCard,
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
  /** Live mid-round hands from progressive `public_state` (engine card ids 1–52). */
  livePlayerCards?: number[] | null;
  liveDealerCards?: number[] | null;
  livePlayerValue?: number | null;
  className?: string;
};

const MOVE_LABEL_KEYS: Record<BlackjackMove, string> = {
  hit: 'casino.action.hit',
  stand: 'casino.action.stand',
  double: 'casino.action.double',
  split: 'casino.action.split',
  insurance: 'casino.action.insurance',
};

type PlayingCardProps = {
  cardId?: number | null;
  faceDown?: boolean;
  flip?: boolean;
  testId?: string;
  dim?: boolean;
};

function PlayingCardFace({
  cardId,
  faceDown = false,
  flip = false,
  testId,
  dim,
}: PlayingCardProps) {
  const face = cardId != null && !faceDown ? decodeBlackjackCard(cardId) : null;

  return (
    <div
      className={cn(
        'border-line relative flex h-16 w-12 flex-col justify-between rounded-md border-2 bg-surface-raised p-1 text-[0.65rem] font-semibold leading-none shadow-sm md:h-20 md:w-14 md:text-xs',
        faceDown && 'bg-accent/15 border-accent/40',
        face?.color === 'red' && 'text-danger',
        face?.color === 'black' && 'text-foreground',
        dim && 'opacity-60',
        flip && 'ds-casino-card-flip',
      )}
      data-testid={testId}
      data-face={faceDown ? 'back' : face ? 'up' : 'empty'}
      data-card-id={face?.id}
      aria-hidden={faceDown || !face}
    >
      {faceDown ? (
        <span className="text-accent m-auto text-lg font-bold" aria-hidden="true">
          ◆
        </span>
      ) : face ? (
        <>
          <span className="flex flex-col items-start gap-0.5">
            <span className="tabular-nums">{face.rankLabel}</span>
            <span aria-hidden="true">{face.suitSymbol}</span>
          </span>
          <span className="self-end text-base md:text-lg" aria-hidden="true">
            {face.suitSymbol}
          </span>
        </>
      ) : (
        <span className="text-foreground-muted m-auto">—</span>
      )}
    </div>
  );
}

/**
 * Blackjack — felt table · real card faces · action queue (§23.2 · §23.8).
 * One-shot: PF-resolved / RPC hands via playOutcome. E23 liveMode: mid-round
 * hands from livePlayerCards/liveDealerCards props.
 *
 * Phase 1E — replaces UP/? placeholders with rank+suit faces (functional gap),
 * deal/flip pacing, shared casino reveal/pop/flash on settle.
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
      livePlayerCards = null,
      liveDealerCards = null,
      livePlayerValue = null,
      className,
    },
    ref,
  ) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedBlackjackOutcome | null>(null);
    const [revealStep, setRevealStep] = useState(0);
    /** How many dealer cards are face-up during settle reveal (0 = none yet). */
    const [dealerRevealCount, setDealerRevealCount] = useState(0);
    const [revealPulse, setRevealPulse] = useState(0);
    /** Hands staged during replay before settle() commits outcome. */
    const [pendingHands, setPendingHands] = useState<{
      player: number[];
      dealer: number[];
    } | null>(null);
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

    // Perf — navigating away mid-reveal must not leave dangling setTimeout.
    useEffect(() => clearTimer, [clearTimer]);

    const settle = useCallback(
      (parsed: ParsedBlackjackOutcome) => {
        clearTimer();
        setRevealStep(Math.max(1, actions.length));
        setDealerRevealCount(Math.max(parsed.dealerCards.length, 0));
        setOutcome(parsed);
        setPendingHands(null);
        setPhase('settled');
        setRevealPulse((n) => n + 1);
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
        setPendingHands({
          player: parsed.playerCards,
          dealer: parsed.dealerCards,
        });
        setDealerRevealCount(parsed.dealerCards.length > 0 ? 1 : 0);

        const hasHands = parsed.playerCards.length > 0 || parsed.dealerCards.length > 0;
        if (reducedMotion) {
          settle(parsed);
          return;
        }

        if (hasHands) {
          // Deal pacing: upcard already shown → flip hole → remaining dealer hits.
          const step = blackjackDealStepMs();
          const dealerTarget = Math.max(parsed.dealerCards.length, 1);
          let shown = 1;
          const tick = () => {
            shown += 1;
            setDealerRevealCount(Math.min(shown, dealerTarget));
            if (shown >= dealerTarget) {
              settle(parsed);
              return;
            }
            timerRef.current = setTimeout(tick, step);
          };
          timerRef.current = setTimeout(tick, step);
          return;
        }

        // Fallback: action-queue pacing when hands are absent (multiplier-only).
        if (actions.length === 0) {
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
          setDealerRevealCount(0);
          setPendingHands(null);
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
    const liveCardActive = liveMode && liveSessionActive && phase !== 'replaying' && !outcome;

    const playerCardsForRender =
      outcome && outcome.playerCards.length > 0
        ? outcome.playerCards
        : pendingHands && pendingHands.player.length > 0
          ? pendingHands.player
          : liveCardActive && livePlayerCards && livePlayerCards.length > 0
            ? livePlayerCards
            : [];

    const dealerCardsForRender =
      outcome && outcome.dealerCards.length > 0
        ? outcome.dealerCards
        : pendingHands && pendingHands.dealer.length > 0
          ? pendingHands.dealer
          : liveCardActive && liveDealerCards && liveDealerCards.length > 0
            ? liveDealerCards
            : [];

    const dealerFaceUpCount = (() => {
      if (phase === 'settled') return dealerCardsForRender.length;
      if (phase === 'replaying') {
        return Math.max(dealerRevealCount, dealerCardsForRender.length > 0 ? 1 : 0);
      }
      // Progressive already omits the hole until terminal.
      if (liveCardActive) return dealerCardsForRender.length;
      return 0;
    })();

    const playerValueLabel =
      outcome?.playerValue ?? (liveCardActive && livePlayerValue != null ? livePlayerValue : null);
    const dealerValueLabel =
      phase === 'settled' ||
      (phase === 'replaying' &&
        dealerCardsForRender.length > 0 &&
        dealerFaceUpCount >= dealerCardsForRender.length)
        ? (outcome?.dealerValue ?? null)
        : null;

    const showIdleSlots = playerCardsForRender.length === 0 && dealerCardsForRender.length === 0;

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-blackjack-stage"
        data-stage-phase={phase}
        data-live-mode={liveMode ? 'true' : 'false'}
        data-won={outcome ? (won ? 'true' : 'false') : undefined}
        data-action-count={actions.length}
        data-has-hands={
          playerCardsForRender.length > 0 || dealerCardsForRender.length > 0 ? 'true' : 'false'
        }
      >
        <CardBody className="flex min-h-[280px] flex-col items-center gap-4 p-4 md:min-h-[360px] md:p-6">
          <HelpTip
            label={t('casino.game.blackjack.name')}
            bodyKey={CASINO_BLACKJACK_ACTIONS_HELP_KEY}
          />

          <div
            className="border-line bg-success/10 flex w-full max-w-md flex-col items-center gap-4 rounded-xl border p-4"
            data-testid="casino-blackjack-felt"
          >
            <div className="flex flex-col items-center gap-2" data-testid="casino-blackjack-dealer">
              <span className="text-foreground-muted text-xs font-medium">
                {t('casino.stage.dealer')}
                {dealerValueLabel != null ? (
                  <span className="text-foreground ml-1 tabular-nums">({dealerValueLabel})</span>
                ) : null}
              </span>
              <div
                className="flex flex-wrap justify-center gap-1.5"
                data-testid="casino-blackjack-dealer-hand"
              >
                {showIdleSlots ? (
                  <>
                    <PlayingCardFace faceDown testId="casino-blackjack-dealer-upcard" />
                    <PlayingCardFace faceDown dim testId="casino-blackjack-dealer-hole" />
                  </>
                ) : (
                  dealerCardsForRender.map((id, i) => {
                    const faceDown = i >= dealerFaceUpCount;
                    const flip =
                      !reducedMotion &&
                      phase === 'replaying' &&
                      i === dealerFaceUpCount - 1 &&
                      i > 0;
                    return (
                      <PlayingCardFace
                        key={`d-${id}-${i}`}
                        cardId={id}
                        faceDown={faceDown}
                        flip={flip}
                        testId={
                          i === 0
                            ? 'casino-blackjack-dealer-upcard'
                            : i === 1
                              ? 'casino-blackjack-dealer-hole'
                              : `casino-blackjack-dealer-card-${i}`
                        }
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2" data-testid="casino-blackjack-player">
              <span className="text-foreground-muted text-xs font-medium">
                {t('casino.stage.player')}
                {playerValueLabel != null ? (
                  <span className="text-foreground ml-1 tabular-nums">({playerValueLabel})</span>
                ) : null}
              </span>
              <div
                className="flex flex-wrap justify-center gap-1.5"
                data-testid="casino-blackjack-player-hand"
              >
                {showIdleSlots ? (
                  <>
                    <PlayingCardFace testId="casino-blackjack-player-card-0" />
                    <PlayingCardFace testId="casino-blackjack-player-card-1" />
                  </>
                ) : (
                  playerCardsForRender.map((id, i) => (
                    <PlayingCardFace
                      key={`p-${id}-${i}`}
                      cardId={id}
                      flip={
                        !reducedMotion &&
                        (phase === 'replaying' || phase === 'settled') &&
                        i === playerCardsForRender.length - 1
                      }
                      testId={`casino-blackjack-player-card-${i}`}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {outcome ? (
            <span className="relative inline-flex items-baseline">
              {won && !reducedMotion ? (
                <span
                  key={`glow-${revealPulse}`}
                  aria-hidden="true"
                  data-testid="casino-blackjack-win-flash"
                  className="ds-casino-cashout-flash"
                />
              ) : null}
              <p
                key={`mult-${revealPulse}`}
                className={cn(
                  'm-0 text-xl font-semibold tabular-nums',
                  won ? 'text-success' : 'text-danger',
                  !reducedMotion && 'ds-casino-reveal-in',
                  won && !reducedMotion && 'ds-casino-number-pop',
                )}
                data-testid="casino-blackjack-mult"
              >
                {outcome.totalMultiplier.toFixed(2)}×
              </p>
            </span>
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
