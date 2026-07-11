import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';

import {
  momentumComboMs,
  parseMomentumOutcome,
  type ParsedMomentumOutcome,
} from '@/domain/casino-games-batch-c-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Card, CardBody } from '@/product/primitives/card';
import type {
  CasinoStageHandle,
  CasinoStagePhase,
} from '@/product/surfaces/games/casino-stage-types';
import { usePixiStage, type PixiModule } from '@/product/surfaces/games/use-pixi-stage';

export type MomentumStageProps = {
  comboBefore: number;
  cashOut: boolean;
  className?: string;
};

type MomentumScene = {
  root: InstanceType<PixiModule['Container']>;
  paint: (w: number, h: number, combo: number, flashOn: boolean, broke: boolean) => void;
};

function createMomentumScene(pixi: PixiModule): MomentumScene {
  const root = new pixi.Container();
  const stack = new pixi.Graphics();
  const flash = new pixi.Graphics();
  root.addChild(stack, flash);

  const paint = (w: number, h: number, combo: number, flashOn: boolean, broke: boolean) => {
    stack.clear();
    flash.clear();
    const max = 15;
    const pad = 24;
    const barH = Math.max(8, (h - pad * 2 - (max - 1) * 4) / max);
    const barW = w - pad * 2;

    for (let i = 0; i < max; i++) {
      const y = h - pad - (i + 1) * (barH + 4);
      const active = i < combo;
      stack.roundRect(pad, y, barW, barH, 3);
      stack.fill({
        color: broke ? 0x64748b : active ? 0x22d3ee : 0x1e293b,
        alpha: active ? 0.85 : 0.45,
      });
    }

    if (flashOn) {
      flash.rect(0, 0, w, h);
      flash.fill({ color: broke ? 0xef4444 : 0x22d3ee, alpha: 0.18 });
    }
  };

  return { root, paint };
}

/**
 * Momentum L1 — Pixi combo meter stack (§23.2 · §23.8).
 * cashOut is pre-bet param display — no live escape during replay.
 */
export const MomentumStage = forwardRef<CasinoStageHandle, MomentumStageProps>(
  function MomentumStage({ comboBefore, cashOut, className }, ref) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const hostRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<MomentumScene | null>(null);
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedMomentumOutcome | null>(null);
    const [displayCombo, setDisplayCombo] = useState(comboBefore);
    const rafRef = useRef<number | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const { ready } = usePixiStage(hostRef, (app, pixi) => {
      const scene = createMomentumScene(pixi);
      sceneRef.current = scene;
      app.stage.addChild(scene.root);
      scene.paint(app.screen.width, app.screen.height, comboBefore, false, false);
      return {
        onResize: (w, h) => scene.paint(w, h, comboBefore, false, false),
        destroy: () => {
          scene.root.destroy({ children: true });
          sceneRef.current = null;
        },
      };
    });

    const clearRaf = useCallback(() => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }, []);

    const settle = useCallback(
      (parsed: ParsedMomentumOutcome) => {
        clearRaf();
        const combo = parsed.cashedOut ? 0 : parsed.comboAfter;
        setDisplayCombo(combo);
        setOutcome(parsed);
        setPhase('settled');
        const broke = !parsed.won && !parsed.cashedOut;
        const scene = sceneRef.current;
        const host = hostRef.current;
        if (scene && host) {
          scene.paint(host.clientWidth || 320, host.clientHeight || 240, combo, true, broke);
        }
        resolveRef.current?.();
        resolveRef.current = null;
      },
      [clearRaf],
    );

    const runCombo = useCallback(
      (parsed: ParsedMomentumOutcome) => {
        clearRaf();
        setPhase('replaying');
        setOutcome(null);
        setDisplayCombo(parsed.comboBefore);

        if (reducedMotion) {
          settle(parsed);
          return;
        }

        const from = parsed.comboBefore;
        const to = parsed.cashedOut ? 0 : parsed.comboAfter;
        const broke = !parsed.won && !parsed.cashedOut;
        const duration = momentumComboMs();
        const start = performance.now();

        const tick = (now: number) => {
          const tNorm = Math.min(1, (now - start) / duration);
          const combo = Math.round(from + (to - from) * tNorm);
          setDisplayCombo(combo);
          const scene = sceneRef.current;
          const host = hostRef.current;
          if (scene && host) {
            scene.paint(
              host.clientWidth || 320,
              host.clientHeight || 240,
              combo,
              tNorm > 0.7,
              broke,
            );
          }
          if (tNorm >= 1) {
            settle(parsed);
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
          const parsed = parseMomentumOutcome(result);
          if (!parsed) return Promise.resolve();
          return new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            runCombo(parsed);
          });
        },
        reset() {
          clearRaf();
          resolveRef.current = null;
          setPhase('idle');
          setOutcome(null);
          setDisplayCombo(comboBefore);
          const scene = sceneRef.current;
          const host = hostRef.current;
          if (scene && host) {
            scene.paint(
              host.clientWidth || 320,
              host.clientHeight || 240,
              comboBefore,
              false,
              false,
            );
          }
        },
      }),
      [clearRaf, comboBefore, runCombo],
    );

    const overlayMult = outcome
      ? outcome.cashedOut
        ? outcome.totalMultiplier
        : outcome.comboMultiplier
      : null;

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-momentum-stage"
        data-stage-phase={phase}
        data-pixi-ready={ready ? 'true' : 'false'}
        data-won={outcome ? (outcome.won ? 'true' : 'false') : undefined}
        data-cashed-out={outcome ? (outcome.cashedOut ? 'true' : 'false') : undefined}
        data-combo={displayCombo}
        data-prebet-cashout={cashOut ? 'true' : 'false'}
      >
        <CardBody className="flex flex-col gap-3 p-3 md:p-4">
          <div
            ref={hostRef}
            className="bg-surface relative min-h-[220px] w-full overflow-hidden rounded-md md:min-h-[300px]"
            data-testid="casino-momentum-canvas-host"
            aria-hidden
          />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground-muted text-xs">{t('casino.field.comboBefore')}</span>
              <span
                className="text-foreground text-2xl font-semibold tabular-nums"
                data-testid="casino-momentum-combo"
              >
                {displayCombo}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-foreground-muted text-xs">{t('casino.stage.result')}</span>
              <span
                className={cn(
                  'text-xl font-semibold tabular-nums',
                  outcome?.won ? 'text-success' : 'text-foreground',
                )}
                data-testid="casino-momentum-mult"
              >
                {overlayMult !== null ? `${overlayMult.toFixed(2)}×` : '—'}
              </span>
            </div>
            {outcome && !outcome.cashedOut ? (
              <span
                className="text-foreground-muted text-xs tabular-nums"
                data-testid="casino-momentum-roll"
              >
                {t('casino.stage.roll')}: {outcome.roll.toFixed(2)}
              </span>
            ) : null}
          </div>
          {/* §23.2.1 — no live mid-round cash-out */}
        </CardBody>
      </Card>
    );
  },
);
