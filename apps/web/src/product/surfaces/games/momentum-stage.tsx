import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  momentumComboEase,
  momentumComboMs,
  momentumComboResetEase,
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

/** Escalating cyan stack — higher lit bars run hotter (display only). */
const COMBO_ACTIVE = [0x0e7490, 0x0891b2, 0x06b6d4, 0x22d3ee, 0x67e8f9] as const;

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
    const lit = Math.max(0, Math.min(max, Math.round(combo)));

    for (let i = 0; i < max; i++) {
      const y = h - pad - (i + 1) * (barH + 4);
      const active = i < lit;
      stack.roundRect(pad, y, barW, barH, 3);
      if (broke) {
        stack.fill({ color: 0x64748b, alpha: active ? 0.55 : 0.35 });
      } else if (active) {
        const tone = COMBO_ACTIVE[Math.min(COMBO_ACTIVE.length - 1, Math.floor((i / max) * COMBO_ACTIVE.length))];
        stack.fill({ color: tone ?? 0x22d3ee, alpha: 0.55 + (i / max) * 0.4 });
      } else {
        stack.fill({ color: 0x1e293b, alpha: 0.45 });
      }
    }

    if (flashOn) {
      flash.rect(0, 0, w, h);
      flash.fill({ color: broke ? 0xef4444 : 0x22d3ee, alpha: 0.18 });
    }
  };

  return { root, paint };
}

/**
 * Momentum — Pixi combo meter stack (§23.2 · §23.8 · CASINO_UX_CANON §7).
 * cashOut is pre-bet param display — no live escape during replay.
 *
 * Phase 1D polish — escalating build ease · clear reset ease · shared
 * `ds-casino-reveal-in` / `number-pop` / `cashout-flash` on settle
 * (win/cashed-out punchy · broke calm). Pixi tree disposal is owned by
 * usePixiStage (phase1d-0 Application-first) — controller clears JS refs only.
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
    /** Monotonic counter — key-remount restarts CSS reveal/pop/flash on each settle. */
    const [revealPulse, setRevealPulse] = useState(0);
    const rafRef = useRef<number | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const { ready } = usePixiStage(hostRef, (app, pixi) => {
      const scene = createMomentumScene(pixi);
      sceneRef.current = scene;
      app.stage.addChild(scene.root);
      scene.paint(app.screen.width, app.screen.height, comboBefore, false, false);
      return {
        onResize: (w, h) => scene.paint(w, h, comboBefore, false, false),
        // Pixi tree disposal is owned by usePixiStage (Application-first + texture/context flags).
        destroy: () => {
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

    // Perf (Phase 1D) — navigating away mid-combo must not leave a dangling
    // rAF that calls setDisplayCombo/settle on an unmounted component.
    // Same pattern as Gold Rush / Mint Reels / Plinko.
    useEffect(() => clearRaf, [clearRaf]);

    const settle = useCallback(
      (parsed: ParsedMomentumOutcome) => {
        clearRaf();
        const combo = parsed.cashedOut ? 0 : parsed.comboAfter;
        setDisplayCombo(combo);
        setOutcome(parsed);
        setPhase('settled');
        setRevealPulse((n) => n + 1);
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
        const resetting = to < from;
        const duration = momentumComboMs();
        const start = performance.now();

        const tick = (now: number) => {
          const tNorm = Math.min(1, (now - start) / duration);
          const eased = resetting ? momentumComboResetEase(tNorm) : momentumComboEase(tNorm);
          const combo = Math.round(from + (to - from) * eased);
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
          setRevealPulse(0);
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

    const settled = phase === 'settled' && outcome !== null;
    const punchy = settled && (outcome.won || outcome.cashedOut);
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
          {/* Stage dominates first fold (CASINO_UX_CANON §7 — combo meter). */}
          <div
            ref={hostRef}
            className="bg-surface relative min-h-72 w-full overflow-hidden rounded-md md:min-h-96"
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
              <span className="relative inline-flex items-baseline justify-end">
                {punchy && !reducedMotion ? (
                  <span
                    key={`glow-${revealPulse}`}
                    aria-hidden="true"
                    data-testid="casino-momentum-win-flash"
                    className="ds-casino-cashout-flash"
                  />
                ) : null}
                <span
                  key={`value-${revealPulse}`}
                  className={cn(
                    'text-xl font-semibold tabular-nums',
                    settled
                      ? punchy
                        ? 'text-success'
                        : 'text-danger'
                      : 'text-foreground',
                    settled && !reducedMotion && 'ds-casino-reveal-in',
                    punchy && !reducedMotion && 'ds-casino-number-pop',
                  )}
                  data-testid="casino-momentum-mult"
                >
                  {overlayMult !== null ? `${overlayMult.toFixed(2)}×` : '—'}
                </span>
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
