import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RouletteBetType } from '@phonara/game-engine';

import {
  CASINO_ROULETTE_BET_MAP_HELP_KEY,
  CASINO_ROULETTE_CHIP_WEIGHTS,
  CASINO_ROULETTE_EUROPEAN_ORDER,
  CASINO_ROULETTE_OUTSIDE_TYPES,
  CASINO_ROULETTE_SECTOR_DEG,
  normalizeRouletteLegs,
  parseRouletteOutcome,
  roulettePocketColor,
  rouletteSpinEase,
  rouletteSpinMs,
  rouletteTotalWeight,
  rouletteWheelAngleForNumber,
  upsertRouletteLeg,
  type CasinoRouletteLeg,
  type ParsedRouletteOutcome,
} from '@/domain/casino-games-batch-d-display-contract';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Card, CardBody } from '@/product/primitives/card';
import { HelpTip } from '@/product/primitives/help-tip';
import type {
  CasinoStageHandle,
  CasinoStagePhase,
} from '@/product/surfaces/games/casino-stage-types';

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

type BetMode = 'straight' | 'split';

function legKey(type: RouletteBetType, value: number | null): string {
  return `${type}:${value ?? 'x'}`;
}

function buildWheelConic(): string {
  const stops = CASINO_ROULETTE_EUROPEAN_ORDER.map((n, i) => {
    const color =
      n === 0
        ? 'var(--ds-success)'
        : roulettePocketColor(n) === 'red'
          ? 'var(--ds-danger)'
          : 'var(--ds-surface-raised)';
    const start = i * CASINO_ROULETTE_SECTOR_DEG;
    const end = (i + 1) * CASINO_ROULETTE_SECTOR_DEG;
    return `${color} ${start}deg ${end}deg`;
  });
  // Offset so sector 0 is centered under the top pointer.
  return `conic-gradient(from -${CASINO_ROULETTE_SECTOR_DEG / 2}deg, ${stops.join(', ')})`;
}

/**
 * Roulette — SVG/DOM table · chip rack · bet map · wheel/ball spin (§23.2 · §23.8).
 * Wheel/ball replay RPC winningNumber only — no fake mid-spin inventing.
 *
 * Phase 1E polish — decelerating rAF wheel (transform-only), chip-drop micro
 * feedback, shared casino reveal/pop/flash on settle. Win: punchy. Lose: calm
 * reveal-in only (CASINO_UX_CANON).
 */
export const RouletteStage = forwardRef<CasinoStageHandle, RouletteStageProps>(
  function RouletteStage({ bets: betsProp, onBetsChange, selectionDisabled, className }, ref) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedRouletteOutcome | null>(null);
    const [chipWeight, setChipWeight] = useState<(typeof CASINO_ROULETTE_CHIP_WEIGHTS)[number]>(1);
    const [highlight, setHighlight] = useState<number | null>(null);
    const [wheelDeg, setWheelDeg] = useState(0);
    const [ballDeg, setBallDeg] = useState(0);
    const [betMode, setBetMode] = useState<BetMode>('straight');
    const [splitPending, setSplitPending] = useState<number | null>(null);
    /** Monotonic — key-remount restarts CSS reveal/pop/flash on each settle. */
    const [revealPulse, setRevealPulse] = useState(0);
    /** Per-pocket chip-drop remount key. */
    const [chipPulse, setChipPulse] = useState<Record<string, number>>({});
    const lastBetsRef = useRef<CasinoRouletteLeg[]>([]);
    const wheelBaseRef = useRef(0);
    const ballBaseRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const bets = useMemo(() => normalizeRouletteLegs(betsProp), [betsProp]);
    const totalWeight = rouletteTotalWeight(bets);
    const locked = selectionDisabled || phase === 'replaying' || !onBetsChange;
    const wheelConic = useMemo(() => buildWheelConic(), []);

    const clearRaf = useCallback(() => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }, []);

    // Perf (Phase 1E) — navigating away mid-spin must not leave a dangling rAF
    // that calls setWheelDeg/settle on an unmounted component.
    useEffect(() => clearRaf, [clearRaf]);

    const pulseChip = useCallback((type: RouletteBetType, value: number | null) => {
      if (reducedMotion) return;
      const key = legKey(type, value);
      setChipPulse((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
    }, [reducedMotion]);

    const settle = useCallback(
      (parsed: ParsedRouletteOutcome, finalWheel: number, finalBall: number) => {
        clearRaf();
        setWheelDeg(finalWheel);
        setBallDeg(finalBall);
        wheelBaseRef.current = finalWheel;
        ballBaseRef.current = finalBall;
        setHighlight(parsed.winningNumber);
        setOutcome(parsed);
        setPhase('settled');
        setRevealPulse((n) => n + 1);
        resolveRef.current?.();
        resolveRef.current = null;
      },
      [clearRaf],
    );

    const runSpin = useCallback(
      (parsed: ParsedRouletteOutcome) => {
        clearRaf();
        setPhase('replaying');
        setOutcome(null);
        setHighlight(null);

        const targetPocket = rouletteWheelAngleForNumber(parsed.winningNumber);
        const startWheel = wheelBaseRef.current;
        // Land pocket under pointer: rotate so target ends at 0 (top).
        const endWheel =
          startWheel +
          360 * 5 +
          ((360 - targetPocket - (startWheel % 360) + 360) % 360);
        const startBall = ballBaseRef.current;
        const endBall = startBall - 360 * 7 - targetPocket;

        if (reducedMotion) {
          settle(parsed, endWheel, endBall);
          return;
        }

        const duration = rouletteSpinMs();
        const start = performance.now();
        const tick = (now: number) => {
          const tNorm = Math.min(1, (now - start) / duration);
          const eased = rouletteSpinEase(tNorm);
          setWheelDeg(startWheel + (endWheel - startWheel) * eased);
          setBallDeg(startBall + (endBall - startBall) * eased);
          if (tNorm >= 1) {
            settle(parsed, endWheel, endBall);
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      },
      [clearRaf, reducedMotion, settle],
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
            runSpin(parsed);
          });
        },
        reset() {
          clearRaf();
          resolveRef.current = null;
          setPhase('idle');
          setOutcome(null);
          setHighlight(null);
          setSplitPending(null);
          setRevealPulse(0);
        },
      }),
      [bets, clearRaf, runSpin],
    );

    const placeLeg = (type: RouletteBetType, value: number | null) => {
      if (locked) return;
      onBetsChange?.(upsertRouletteLeg(bets, { type, value, stakeWeight: chipWeight }));
      pulseChip(type, value);
    };

    const placePocket = (n: number) => {
      if (locked) return;
      if (betMode === 'straight') {
        placeLeg('straight', n);
        return;
      }
      // Split: engine encodes consecutive integers (value, value+1).
      if (splitPending === null) {
        setSplitPending(n);
        return;
      }
      const a = splitPending;
      const b = n;
      setSplitPending(null);
      if (a === b) {
        placeLeg('straight', a);
        return;
      }
      if (Math.abs(a - b) !== 1) {
        setSplitPending(b);
        return;
      }
      placeLeg('split', Math.min(a, b));
    };

    const clearBets = () => {
      if (locked) return;
      onBetsChange?.([]);
      setSplitPending(null);
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
    const settled = phase === 'settled' && outcome !== null;

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-roulette-stage"
        data-stage-phase={phase}
        data-won={outcome ? (won ? 'true' : 'false') : undefined}
        data-bet-count={bets.length}
        data-bet-mode={betMode}
        data-perf-contract="transform-opacity-only"
      >
        <CardBody className="flex min-h-72 flex-col gap-3 p-3 md:min-h-96 md:p-5">
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

          {/* Wheel — single rotating disc + ball orbit (transform-only, ≥55fps contract). */}
          <div
            className="relative mx-auto size-36 shrink-0 md:size-44"
            data-testid="casino-roulette-wheel"
            aria-hidden="true"
          >
            <div
              className="border-line absolute inset-0 rounded-full border-2 shadow-inner"
              data-testid="casino-roulette-wheel-disc"
              style={{
                background: wheelConic,
                transform: `rotate(${wheelDeg}deg)`,
                willChange: phase === 'replaying' ? 'transform' : undefined,
              }}
            />
            <div className="bg-surface pointer-events-none absolute inset-[18%] rounded-full border border-line" />
            <div
              className="pointer-events-none absolute inset-0"
              data-testid="casino-roulette-ball"
              style={{
                transform: `rotate(${ballDeg}deg)`,
                willChange: phase === 'replaying' ? 'transform' : undefined,
              }}
            >
              <span className="bg-foreground absolute top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full shadow" />
            </div>
            <div className="bg-accent absolute top-0 left-1/2 z-10 h-3 w-0 -translate-x-1/2 border-x-4 border-t-8 border-x-transparent border-t-accent" />
            {highlight !== null ? (
              <p
                className="text-foreground absolute inset-0 z-10 m-0 flex items-center justify-center text-xl font-semibold tabular-nums"
                data-testid="casino-roulette-wheel-center"
              >
                {highlight}
              </p>
            ) : null}
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
            className="flex flex-wrap gap-2"
            data-testid="casino-roulette-bet-mode"
            role="group"
            aria-label={t('games.roulette.board.betModeLabel')}
          >
            <Button
              type="button"
              size="sm"
              variant={betMode === 'straight' ? 'primary' : 'outline'}
              data-testid="casino-roulette-mode-straight"
              disabled={locked}
              onClick={() => {
                setBetMode('straight');
                setSplitPending(null);
              }}
            >
              {t('games.roulette.board.betTypeStraight')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={betMode === 'split' ? 'primary' : 'outline'}
              data-testid="casino-roulette-mode-split"
              disabled={locked}
              onClick={() => setBetMode('split')}
            >
              {t('games.roulette.board.betTypeSplit')}
            </Button>
          </div>
          {betMode === 'split' ? (
            <p
              className="text-foreground-muted m-0 text-xs"
              data-testid="casino-roulette-split-hint"
            >
              {splitPending === null
                ? t('games.roulette.board.splitHint')
                : t('games.roulette.board.splitPending')}
            </p>
          ) : null}

          <div className="overflow-x-auto" data-testid="casino-roulette-table">
            <div className="inline-flex min-w-[320px] flex-col gap-1">
              <button
                key={`pocket-0-${chipPulse[legKey('straight', 0)] ?? 0}`}
                type="button"
                className={cn(
                  'min-h-12 rounded-md border text-sm font-semibold tabular-nums',
                  highlight === 0
                    ? 'border-accent bg-accent/20 text-accent ring-2 ring-accent'
                    : 'border-success/40 bg-success/15 text-success',
                  weightOn('straight', 0) > 0 && 'outline outline-foreground/40',
                  (chipPulse[legKey('straight', 0)] ?? 0) > 0 &&
                    !reducedMotion &&
                    'ds-casino-chip-drop',
                  splitPending === 0 && 'ring-2 ring-accent/70',
                )}
                data-testid="casino-roulette-pocket-0"
                aria-label={t('games.roulette.board.pocketAria', { number: 0 })}
                disabled={locked}
                onClick={() => placePocket(0)}
              >
                0{weightOn('straight', 0) > 0 ? ` · ${weightOn('straight', 0)}` : ''}
              </button>

              <div className="grid grid-cols-12 gap-0.5">
                {STRAIGHT_GRID.flat().map((n) => {
                  const color = roulettePocketColor(n);
                  const active = highlight === n;
                  const w = weightOn('straight', n);
                  const pulse = chipPulse[legKey('straight', n)] ?? 0;
                  return (
                    <button
                      key={`pocket-${n}-${pulse}`}
                      type="button"
                      className={cn(
                        'min-h-12 rounded-sm border text-xs font-semibold tabular-nums md:text-sm',
                        color === 'red' && 'border-danger/50 bg-danger/20 text-danger',
                        color === 'black' && 'border-line bg-surface-raised text-foreground',
                        active && 'ring-2 ring-accent',
                        w > 0 && 'outline outline-foreground/40',
                        pulse > 0 && !reducedMotion && 'ds-casino-chip-drop',
                        splitPending === n && 'ring-2 ring-accent/70',
                      )}
                      data-testid={`casino-roulette-pocket-${n}`}
                      aria-label={t('games.roulette.board.pocketAria', { number: n })}
                      disabled={locked}
                      onClick={() => placePocket(n)}
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
                  const pulse = chipPulse[legKey(type, null)] ?? 0;
                  return (
                    <button
                      key={`${type}-${pulse}`}
                      type="button"
                      className={cn(
                        'border-line bg-surface-raised text-foreground min-h-12 rounded-md border px-2 text-xs font-semibold',
                        w > 0 && 'outline outline-accent',
                        pulse > 0 && !reducedMotion && 'ds-casino-chip-drop',
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
              <span className="relative inline-flex items-baseline">
                {settled && won && !reducedMotion ? (
                  <span
                    key={`glow-${revealPulse}`}
                    aria-hidden="true"
                    data-testid="casino-roulette-win-flash"
                    className="ds-casino-cashout-flash"
                  />
                ) : null}
                <p
                  key={`num-${revealPulse}`}
                  className={cn(
                    'm-0 text-2xl font-semibold tabular-nums',
                    won ? 'text-success' : 'text-danger',
                    settled && !reducedMotion && 'ds-casino-reveal-in',
                    settled && won && !reducedMotion && 'ds-casino-number-pop',
                  )}
                  data-testid="casino-roulette-winning-number"
                >
                  {outcome.winningNumber}
                </p>
              </span>
              <p
                key={`mult-${revealPulse}`}
                className={cn(
                  'text-foreground-muted m-0 text-sm tabular-nums',
                  settled && !reducedMotion && 'ds-casino-reveal-in',
                  settled && won && !reducedMotion && 'ds-casino-number-pop',
                )}
                data-testid="casino-roulette-mult"
              >
                {outcome.totalMultiplier.toFixed(2)}×
              </p>
            </div>
          ) : (
            <p className="text-foreground-muted m-0 text-center text-sm">
              {phase === 'replaying'
                ? t('games.roulette.spin')
                : bets.length === 0
                  ? t('games.roulette.emptyBets')
                  : t('casino.game.roulette.idle')}
            </p>
          )}
        </CardBody>
      </Card>
    );
  },
);
