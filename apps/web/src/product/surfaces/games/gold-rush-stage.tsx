import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  goldRushMeterEase,
  goldRushMeterFill,
  goldRushMeterMs,
  parseGoldRushOutcome,
  type ParsedGoldRushOutcome,
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

export type GoldRushStageProps = {
  lines: number;
  className?: string;
};

type GoldScene = {
  root: InstanceType<PixiModule['Container']>;
  paint: (w: number, h: number, fill: number, bonus: boolean) => void;
};

/** Display-only win tone — any positive RPC totalMultiplier is a feature win. */
function isGoldRushWinDisplay(totalMultiplier: number): boolean {
  return Number.isFinite(totalMultiplier) && totalMultiplier > 0;
}

function createGoldScene(pixi: PixiModule): GoldScene {
  const root = new pixi.Container();
  const cabinet = new pixi.Graphics();
  const meter = new pixi.Graphics();
  root.addChild(cabinet, meter);

  const paint = (w: number, h: number, fill: number, bonus: boolean) => {
    cabinet.clear();
    meter.clear();
    const pad = 20;
    cabinet.roundRect(pad, pad, w - pad * 2, h - pad * 2 - 40, 12);
    cabinet.fill({ color: 0x1a1408, alpha: 0.95 });
    cabinet.stroke({ width: 2, color: bonus ? 0xf5c542 : 0x8b6914, alpha: 0.9 });

    const cols = 5;
    const rows = 3;
    const innerPad = 28;
    const gap = 5;
    const cellW = (w - innerPad * 2 - gap * (cols - 1)) / cols;
    const cellH = (h - innerPad * 2 - 56 - gap * (rows - 1)) / rows;
    const golds = [0xb45309, 0xd97706, 0xf59e0b, 0xfbbf24, 0xfde68a];

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = innerPad + c * (cellW + gap);
        const y = innerPad + r * (cellH + gap);
        const idx = (c + r + Math.floor(fill * 5)) % golds.length;
        cabinet.roundRect(x, y, cellW, cellH, 4);
        cabinet.fill({ color: golds[idx] ?? 0xb45309, alpha: 0.35 + fill * 0.4 });
      }
    }

    const meterY = h - 36;
    const meterW = w - pad * 2;
    meter.roundRect(pad, meterY, meterW, 14, 7);
    meter.fill({ color: 0x292524, alpha: 1 });
    const fw = Math.max(0, meterW * Math.min(1, fill));
    if (fw > 0) {
      meter.roundRect(pad, meterY, fw, 14, 7);
      meter.fill({ color: bonus ? 0xfbbf24 : 0xd97706, alpha: 0.95 });
    }
  };

  return { root, paint };
}

/**
 * Gold Rush — Pixi cabinet + feature meter (§23.2 · §23.8 · CASINO_UX_CANON §7).
 * Meter fill derived from RPC totalMultiplier display only.
 *
 * Phase 1D polish — decelerating meter ease · shared
 * `ds-casino-reveal-in` / `number-pop` / `cashout-flash` on settle
 * (win >0 punchy · lose calm). Pixi tree disposal is owned by usePixiStage
 * (phase1d-0 Application-first) — controller clears JS refs only.
 */
export const GoldRushStage = forwardRef<CasinoStageHandle, GoldRushStageProps>(
  function GoldRushStage({ lines, className }, ref) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const hostRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<GoldScene | null>(null);
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedGoldRushOutcome | null>(null);
    const [meter, setMeter] = useState(0);
    /** Monotonic counter — key-remount restarts CSS reveal/pop/flash on each settle. */
    const [revealPulse, setRevealPulse] = useState(0);
    const rafRef = useRef<number | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const { ready } = usePixiStage(hostRef, (app, pixi) => {
      const scene = createGoldScene(pixi);
      sceneRef.current = scene;
      app.stage.addChild(scene.root);
      scene.paint(app.screen.width, app.screen.height, 0, false);
      return {
        onResize: (w, h) => scene.paint(w, h, 0, false),
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

    // Perf (Phase 1D) — navigating away mid-meter must not leave a dangling
    // rAF that calls setMeter/settle on an unmounted component.
    // Same pattern as Mint Reels / Plinko / Deepshaft.
    useEffect(() => clearRaf, [clearRaf]);

    const settle = useCallback(
      (parsed: ParsedGoldRushOutcome, fill: number) => {
        clearRaf();
        setMeter(fill);
        setOutcome(parsed);
        setPhase('settled');
        setRevealPulse((n) => n + 1);
        const bonus = fill >= 0.55;
        const scene = sceneRef.current;
        const host = hostRef.current;
        if (scene && host) {
          scene.paint(host.clientWidth || 320, host.clientHeight || 240, fill, bonus);
        }
        resolveRef.current?.();
        resolveRef.current = null;
      },
      [clearRaf],
    );

    const runMeter = useCallback(
      (parsed: ParsedGoldRushOutcome) => {
        clearRaf();
        setPhase('replaying');
        setOutcome(null);
        setMeter(0);
        const target = goldRushMeterFill(parsed.totalMultiplier);

        if (reducedMotion) {
          settle(parsed, target);
          return;
        }

        const duration = goldRushMeterMs();
        const start = performance.now();
        const tick = (now: number) => {
          const tNorm = Math.min(1, (now - start) / duration);
          const eased = goldRushMeterEase(tNorm);
          const fill = target * eased;
          setMeter(fill);
          const scene = sceneRef.current;
          const host = hostRef.current;
          if (scene && host) {
            scene.paint(host.clientWidth || 320, host.clientHeight || 240, fill, fill >= 0.55);
          }
          if (tNorm >= 1) {
            settle(parsed, target);
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
          const parsed = parseGoldRushOutcome(result);
          if (!parsed) return Promise.resolve();
          return new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            runMeter(parsed);
          });
        },
        reset() {
          clearRaf();
          resolveRef.current = null;
          setPhase('idle');
          setOutcome(null);
          setMeter(0);
          setRevealPulse(0);
          const scene = sceneRef.current;
          const host = hostRef.current;
          if (scene && host) {
            scene.paint(host.clientWidth || 320, host.clientHeight || 240, 0, false);
          }
        },
      }),
      [clearRaf, runMeter],
    );

    const won = outcome !== null && isGoldRushWinDisplay(outcome.totalMultiplier);
    const bonus = meter >= 0.55;
    const settled = phase === 'settled' && outcome !== null;

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-gold-rush-stage"
        data-stage-phase={phase}
        data-pixi-ready={ready ? 'true' : 'false'}
        data-won={outcome ? (won ? 'true' : 'false') : undefined}
        data-bonus={bonus ? 'true' : 'false'}
        data-lines={lines}
      >
        <CardBody className="flex flex-col gap-3 p-3 md:p-4">
          {/* Stage dominates first fold (CASINO_UX_CANON §7 — cabinet / reel window). */}
          <div
            ref={hostRef}
            className="bg-surface relative min-h-72 w-full overflow-hidden rounded-md md:min-h-96"
            data-testid="casino-gold-rush-canvas-host"
            aria-hidden
          />
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground-muted text-xs">{t('casino.stage.result')}</span>
              <span className="relative inline-flex items-baseline">
                {settled && won && !reducedMotion ? (
                  <span
                    key={`glow-${revealPulse}`}
                    aria-hidden="true"
                    data-testid="casino-gold-rush-win-flash"
                    className="ds-casino-cashout-flash"
                  />
                ) : null}
                <span
                  key={`value-${revealPulse}`}
                  className={cn(
                    'text-2xl font-semibold tabular-nums',
                    settled ? (won ? 'text-success' : 'text-danger') : 'text-foreground',
                    settled && !reducedMotion && 'ds-casino-reveal-in',
                    settled && won && !reducedMotion && 'ds-casino-number-pop',
                  )}
                  data-testid="casino-gold-rush-mult"
                >
                  {outcome ? `${outcome.totalMultiplier.toFixed(2)}×` : '—'}
                </span>
              </span>
            </div>
            <div
              className="bg-surface-raised h-2 w-28 overflow-hidden rounded-full"
              data-testid="casino-gold-rush-meter"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(meter * 100)}
            >
              <div
                className={cn('h-full rounded-full', bonus ? 'bg-warning' : 'bg-accent')}
                style={{ width: `${Math.round(meter * 100)}%` }}
              />
            </div>
          </div>
        </CardBody>
      </Card>
    );
  },
);
