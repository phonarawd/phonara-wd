import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { DeepshaftRiskTier } from '@phonara/game-engine';

import {
  CASINO_DEEPSHAFT_DEPTH_HELP_KEY,
  CASINO_DEEPSHAFT_MAX_DEPTH,
  deepshaftLevelStepMs,
  normalizeDeepshaftRiskTier,
  normalizeDeepshaftTargetDepth,
  parseDeepshaftOutcome,
  type ParsedDeepshaftOutcome,
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

export type DeepshaftStageProps = {
  riskTier: DeepshaftRiskTier | string;
  targetDepth: number;
  className?: string;
};

/**
 * Deepshaft L1 — vertical shaft · depth meter · CSS descent (§23.2 · §23.8).
 * Levels replay RPC result only — no live dig/cash-out mid-round.
 *
 * Phase 1C motion polish — reuses shared casino reveal/pop/flash tokens
 * (motion.css). Win: reveal-in + number-pop + glow ("punchy"). Cave-in/loss:
 * reveal-in only — CASINO_UX_CANON "lose: calm · respectful". Engine outcomes
 * are always (won && !caveIn) or (!won && caveIn); the status label therefore
 * keys off `won` alone (no dead `!caveIn && !won` cavein fallback).
 */
export const DeepshaftStage = forwardRef<CasinoStageHandle, DeepshaftStageProps>(
  function DeepshaftStage({ riskTier: riskRaw, targetDepth: depthRaw, className }, ref) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedDeepshaftOutcome | null>(null);
    const [visibleDepth, setVisibleDepth] = useState(0);
    /** Monotonic counter — key-remount restarts CSS reveal/pop/flash on each settle. */
    const [revealPulse, setRevealPulse] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const riskTier = normalizeDeepshaftRiskTier(riskRaw);
    const targetDepth = normalizeDeepshaftTargetDepth(depthRaw);

    const clearTimer = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    // Perf (Phase 1C) — navigating away mid-descent must not leave a dangling
    // setTimeout that calls setVisibleDepth/settle on an unmounted component.
    // Same pattern as Limbo/Dice/Mines/Hilo.
    useEffect(() => clearTimer, [clearTimer]);

    const settle = useCallback(
      (parsed: ParsedDeepshaftOutcome) => {
        clearTimer();
        setVisibleDepth(parsed.reachedDepth + (parsed.caveIn ? 1 : 0));
        setOutcome(parsed);
        setPhase('settled');
        setRevealPulse((n) => n + 1);
        resolveRef.current?.();
        resolveRef.current = null;
      },
      [clearTimer],
    );

    const runDescent = useCallback(
      (parsed: ParsedDeepshaftOutcome) => {
        clearTimer();
        setPhase('replaying');
        setOutcome(null);
        setVisibleDepth(0);

        if (reducedMotion || parsed.levels.length === 0) {
          settle(parsed);
          return;
        }

        const step = deepshaftLevelStepMs(parsed.levels.length);
        let i = 0;
        const tick = () => {
          const level = parsed.levels[i];
          if (!level) {
            settle(parsed);
            return;
          }
          setVisibleDepth(level.depth);
          i += 1;
          if (i >= parsed.levels.length) {
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
          const parsed = parseDeepshaftOutcome(result);
          if (!parsed) return Promise.resolve();
          return new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            runDescent(parsed);
          });
        },
        reset() {
          clearTimer();
          resolveRef.current = null;
          setPhase('idle');
          setOutcome(null);
          setVisibleDepth(0);
          setRevealPulse(0);
        },
      }),
      [clearTimer, runDescent],
    );

    const riskLabel =
      riskTier === 'safe'
        ? t('games.deepshaft.safe')
        : riskTier === 'deep'
          ? t('games.deepshaft.deep')
          : t('games.deepshaft.standard');

    const won = outcome?.won === true;
    const settled = phase === 'settled' && outcome !== null;
    const meterPct = Math.min(
      100,
      Math.round(
        (Math.max(visibleDepth, outcome?.reachedDepth ?? 0) / CASINO_DEEPSHAFT_MAX_DEPTH) * 100,
      ),
    );

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-deepshaft-stage"
        data-stage-phase={phase}
        data-won={outcome ? (won ? 'true' : 'false') : undefined}
        data-cave-in={outcome ? (outcome.caveIn ? 'true' : 'false') : undefined}
      >
        <CardBody className="flex min-h-70 flex-col items-center gap-4 p-4 md:min-h-90 md:p-6">
          <div className="flex w-full max-w-sm flex-wrap items-center justify-between gap-2">
            <HelpTip label={t('games.deepshaft.depth')} bodyKey={CASINO_DEEPSHAFT_DEPTH_HELP_KEY} />
            <p
              className="text-foreground-muted m-0 text-xs tabular-nums"
              data-testid="casino-deepshaft-target"
            >
              {riskLabel} · {t('games.deepshaft.target')} {targetDepth}
            </p>
          </div>

          <div
            className="border-line bg-surface-raised relative flex h-64 w-20 flex-col-reverse overflow-hidden rounded-md border md:h-80"
            data-testid="casino-deepshaft-shaft"
            aria-label={t('games.deepshaft.depth')}
          >
            {Array.from({ length: CASINO_DEEPSHAFT_MAX_DEPTH }, (_, i) => {
              const depth = i + 1;
              const level = outcome?.levels.find((l) => l.depth === depth);
              const reached =
                visibleDepth >= depth || (outcome !== null && outcome.reachedDepth >= depth);
              const isCave =
                level?.outcome === 'cavein' ||
                (outcome?.caveIn === true &&
                  depth === outcome.reachedDepth + 1 &&
                  visibleDepth >= depth);
              const isTarget = depth === targetDepth;
              return (
                <div
                  key={depth}
                  className={cn(
                    'border-line/40 flex min-h-0 flex-1 items-center justify-center border-t text-tiny tabular-nums',
                    reached && !isCave && 'bg-accent/25 text-accent',
                    isCave && 'bg-danger/40 text-danger',
                    !reached && 'text-foreground-muted',
                    isTarget && 'ring-1 ring-inset ring-accent/60',
                  )}
                  data-testid={`casino-deepshaft-level-${depth}`}
                  data-reached={reached ? 'true' : 'false'}
                >
                  {depth}
                </div>
              );
            })}
          </div>

          <div className="flex w-full max-w-sm flex-col gap-1">
            <div
              className="bg-surface-raised h-2 w-full overflow-hidden rounded-full"
              data-testid="casino-deepshaft-meter"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-200',
                  outcome?.caveIn ? 'bg-danger' : 'bg-accent',
                )}
                style={{ width: `${meterPct}%` }}
                data-testid="casino-deepshaft-meter-fill"
              />
            </div>
            <p
              className="text-foreground-muted m-0 text-center text-xs tabular-nums"
              data-testid="casino-deepshaft-depth-label"
            >
              {t('games.deepshaft.depth')} {visibleDepth || outcome?.reachedDepth || 0}/
              {CASINO_DEEPSHAFT_MAX_DEPTH}
            </p>
          </div>

          {outcome ? (
            <div className="flex flex-col items-center gap-1">
              <p
                key={`status-${revealPulse}`}
                className={cn(
                  'm-0 text-lg font-semibold',
                  won ? 'text-success' : 'text-danger',
                  settled && !reducedMotion && 'ds-casino-reveal-in',
                )}
                data-testid="casino-deepshaft-status"
              >
                {won ? t('games.deepshaft.win') : t('games.deepshaft.cavein')}
              </p>
              <span className="relative inline-flex items-baseline">
                {settled && won && !reducedMotion ? (
                  <span
                    key={`glow-${revealPulse}`}
                    aria-hidden="true"
                    data-testid="casino-deepshaft-win-flash"
                    className="ds-casino-cashout-flash"
                  />
                ) : null}
                <p
                  key={`value-${revealPulse}`}
                  className={cn(
                    'text-foreground m-0 text-xl font-semibold tabular-nums',
                    settled && !reducedMotion && 'ds-casino-reveal-in',
                    settled && won && !reducedMotion && 'ds-casino-number-pop',
                  )}
                  data-testid="casino-deepshaft-mult"
                >
                  {outcome.totalMultiplier.toFixed(2)}×
                </p>
              </span>
            </div>
          ) : (
            <p className="text-foreground-muted m-0 text-sm">{t('games.deepshaft.prepare')}</p>
          )}
        </CardBody>
      </Card>
    );
  },
);
