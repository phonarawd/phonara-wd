import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RouletteBetType } from '@phonara/game-engine';

import {
  CASINO_ROULETTE_BET_MAP_HELP_KEY,
  CASINO_ROULETTE_CHIP_WEIGHTS,
  CASINO_ROULETTE_OUTSIDE_TYPES,
  normalizeRouletteLegs,
  parseRouletteOutcome,
  roulettePocketColor,
  rouletteSectorHighlightMs,
  rouletteTotalWeight,
  upsertRouletteLeg,
  type CasinoRouletteLeg,
  type ParsedRouletteOutcome,
} from '@/domain/casino-games-batch-d-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Card, CardBody } from '@/product/primitives/card';
import { HelpTip } from '@/product/primitives/help-tip';
import type { CasinoStageHandle, CasinoStagePhase } from '@/product/surfaces/games/casino-stage-types';

export type RouletteStageProps = {
  bets: CasinoRouletteLeg[];
  onBetsChange?: (next: CasinoRouletteLeg[]) => void;
  selectionDisabled?: boolean;
  className?: string;
};

const STRAIGHT_GRID: number[][] = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const OUTSIDE_LABEL_KEYS: Record<(typeof CASINO_ROULETTE_OUTSIDE_TYPES)[number], string> = {
  red: 'games.roulette.outside.red',
  black: 'games.roulette.outside.black',
  even: 'games.roulette.outside.even',
  odd: 'games.roulette.outside.odd',
  low: 'games.roulette.outside.low',
  high: 'games.roulette.outside.high',
  dozen1: 'games.roulette.outside.dozen1',
  dozen2: 'games.roulette.outside.dozen2',
  dozen3: 'games.roulette.outside.dozen3',
  column1: 'games.roulette.outside.column1',
  column2: 'games.roulette.outside.column2',
  column3: 'games.roulette.outside.column3',
};

/**
 * Roulette L1 — SVG/DOM table · chip rack · bet map · repeat last (§23.2 · §23.8).
 * Sector highlight replays RPC winningNumber only — no fake mid-spin state.
 */
export const RouletteStage = forwardRef<CasinoStageHandle, RouletteStageProps>(
  function RouletteStage({ bets: betsProp, onBetsChange, selectionDisabled, className }, ref) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedRouletteOutcome | null>(null);
    const [chipWeight, setChipWeight] = useState<(typeof CASINO_ROULETTE_CHIP_WEIGHTS)[number]>(1);
    const [highlight, setHighlight] = useState<number | null>(null);
    const lastBetsRef = useRef<CasinoRouletteLeg[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const bets = useMemo(() => normalizeRouletteLegs(betsProp), [betsProp]);
    const totalWeight = rouletteTotalWeight(bets);
    const locked = selectionDisabled || phase === 'replaying' || !onBetsChange;

    const clearTimer = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    const settle = useCallback(
      (parsed: ParsedRouletteOutcome) => {
        clearTimer();
        setHighlight(parsed.winningNumber);
        setOutcome(parsed);
        setPhase('settled');
        resolveRef.current?.();
        resolveRef.current = null;
      },
      [clearTimer],
    );

    const runReplay = useCallback(
      (parsed: ParsedRouletteOutcome) => {
        clearTimer();
        setPhase('replaying');
        setOutcome(null);
        setHighlight(null);
        if (reducedMotion) {
          settle(parsed);
          return;
        }
        setHighlight(parsed.winningNumber);
        timerRef.current = setTimeout(() => settle(parsed), rouletteSectorHighlightMs());
      },
      [clearTimer, reducedMotion, settle],
    );

    useImperativeHandle(
      ref,
      () => ({
        playOutcome(result) {
          const parsed = parseRouletteOutcome(result);
          if (!parsed) return Promise.resolve();
          if (bets.length > 0) lastBetsRef.current = bets;
          return new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            runReplay(parsed);
          });
        },
        reset() {
          clearTimer();
          resolveRef.current = null;
          setPhase('idle');
          setOutcome(null);
          setHighlight(null);
        },
      }),
      [bets, clearTimer, runReplay],
    );

    const placeLeg = (type: RouletteBetType, value: number | null) => {
      if (locked) return;
      onBetsChange?.(upsertRouletteLeg(bets, { type, value, stakeWeight: chipWeight }));
    };

    const clearBets = () => {
      if (locked) return;
      onBetsChange?.([]);
    };

    const doubleBets = () => {
      if (locked || bets.length === 0) return;
      onBetsChange?.(bets.map((leg) => ({ ...leg, stakeWeight: leg.stakeWeight * 2 })));
    };

    const repeatLast = () => {
      if (locked || lastBetsRef.current.length === 0) return;
      onBetsChange?.(lastBetsRef.current.map((leg) => ({ ...leg })));
    };

    const weightOn = (type: RouletteBetType, value: number | null) =>
      bets
        .filter((l) => l.type === type && l.value === value)
        .reduce((s, l) => s + l.stakeWeight, 0);

    const won = outcome !== null && outcome.totalMultiplier > 0;

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-roulette-stage"
        data-stage-phase={phase}
        data-won={outcome ? (won ? 'true' : 'false') : undefined}
        data-bet-count={bets.length}
      >
        <CardBody className="flex min-h-[280px] flex-col gap-3 p-3 md:min-h-[360px] md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <HelpTip
              label={t('casino.game.roulette.bets')}
              bodyKey={CASINO_ROULETTE_BET_MAP_HELP_KEY}
            />
            <p
              className="text-foreground-muted m-0 text-xs tabular-nums"
              data-testid="casino-roulette-total-weight"
            >
              {t('games.roulette.totalWeight')}: {totalWeight}
            </p>
          </div>

          <div
            className="flex flex-wrap gap-2"
            data-testid="casino-roulette-chip-rack"
            role="group"
            aria-label={t('casino.game.roulette.bets')}
          >
            {CASINO_ROULETTE_CHIP_WEIGHTS.map((w) => (
              <button
                key={w}
                type="button"
                className={cn(
                  'border-line min-h-12 min-w-12 rounded-full border text-sm font-semibold tabular-nums',
                  chipWeight === w
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-surface-raised text-foreground',
                )}
                data-testid={`casino-roulette-chip-${w}`}
                disabled={locked}
                onClick={() => setChipWeight(w)}
              >
                {w}
              </button>
            ))}
          </div>

          <div
            className="overflow-x-auto"
            data-testid="casino-roulette-table"
          >
            <div className="inline-flex min-w-[320px] flex-col gap-1">
              <button
                type="button"
                className={cn(
                  'min-h-12 rounded-md border text-sm font-semibold tabular-nums',
                  highlight === 0
                    ? 'border-accent bg-accent/20 text-accent ring-2 ring-accent'
                    : 'border-success/40 bg-success/15 text-success',
                  weightOn('straight', 0) > 0 && 'outline outline-foreground/40',
                )}
                data-testid="casino-roulette-pocket-0"
                aria-label={t('games.roulette.board.pocketAria', { number: 0 })}
                disabled={locked}
                onClick={() => placeLeg('straight', 0)}
              >
                0{weightOn('straight', 0) > 0 ? ` · ${weightOn('straight', 0)}` : ''}
              </button>

              <div className="grid grid-cols-12 gap-0.5">
                {STRAIGHT_GRID.flat().map((n) => {
                  const color = roulettePocketColor(n);
                  const active = highlight === n;
                  const w = weightOn('straight', n);
                  return (
                    <button
                      key={n}
                      type="button"
                      className={cn(
                        'min-h-12 rounded-sm border text-xs font-semibold tabular-nums md:text-sm',
                        color === 'red' && 'border-danger/50 bg-danger/20 text-danger',
                        color === 'black' && 'border-line bg-surface-raised text-foreground',
                        active && 'ring-2 ring-accent',
                        w > 0 && 'outline outline-foreground/40',
                      )}
                      data-testid={`casino-roulette-pocket-${n}`}
                      aria-label={t('games.roulette.board.pocketAria', { number: n })}
                      disabled={locked}
                      onClick={() => placeLeg('straight', n)}
                    >
                      {n}
                      {w > 0 ? `·${w}` : ''}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
                {CASINO_ROULETTE_OUTSIDE_TYPES.map((type) => {
                  const w = weightOn(type, null);
                  return (
                    <button
                      key={type}
                      type="button"
                      className={cn(
                        'border-line bg-surface-raised text-foreground min-h-12 rounded-md border px-2 text-xs font-semibold',
                        w > 0 && 'outline outline-accent',
                      )}
                      data-testid={`casino-roulette-outside-${type}`}
                      disabled={locked}
                      onClick={() => placeLeg(type, null)}
                    >
                      {t(OUTSIDE_LABEL_KEYS[type] as 'games.roulette.outside.red')}
                      {w > 0 ? ` · ${w}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="border-line bg-surface-raised text-foreground min-h-12 rounded-md border px-3 text-sm"
              data-testid="casino-roulette-repeat"
              disabled={locked || lastBetsRef.current.length === 0}
              onClick={repeatLast}
            >
              {t('games.roulette.board.repeat')}
            </button>
            <button
              type="button"
              className="border-line bg-surface-raised text-foreground min-h-12 rounded-md border px-3 text-sm"
              data-testid="casino-roulette-double"
              disabled={locked || bets.length === 0}
              onClick={doubleBets}
            >
              {t('games.roulette.board.double')}
            </button>
            <button
              type="button"
              className="text-foreground-muted min-h-12 rounded-md px-3 text-sm"
              data-testid="casino-roulette-clear"
              disabled={locked || bets.length === 0}
              onClick={clearBets}
            >
              {t('games.roulette.board.clear')}
            </button>
          </div>

          {outcome ? (
            <div className="flex flex-col items-center gap-1">
              <p
                className={cn(
                  'm-0 text-2xl font-semibold tabular-nums',
                  won ? 'text-success' : 'text-danger',
                )}
                data-testid="casino-roulette-winning-number"
              >
                {outcome.winningNumber}
              </p>
              <p
                className="text-foreground-muted m-0 text-sm tabular-nums"
                data-testid="casino-roulette-mult"
              >
                {outcome.totalMultiplier.toFixed(2)}×
              </p>
            </div>
          ) : (
            <p className="text-foreground-muted m-0 text-center text-sm">
              {bets.length === 0
                ? t('games.roulette.emptyBets')
                : t('casino.game.roulette.idle')}
            </p>
          )}
        </CardBody>
      </Card>
    );
  },
);
