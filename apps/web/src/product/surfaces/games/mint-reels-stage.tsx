import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';

import {
  mintReelsSpinMs,
  parseMintReelsOutcome,
  type ParsedMintReelsOutcome,
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

export type MintReelsStageProps = {
  lines: number;
  className?: string;
};

type ReelScene = {
  root: InstanceType<PixiModule['Container']>;
  paint: (w: number, h: number, spinT: number, scanLine: number | null) => void;
};

function createReelScene(pixi: PixiModule): ReelScene {
  const root = new pixi.Container();
  const reels = new pixi.Graphics();
  const scan = new pixi.Graphics();
  root.addChild(reels, scan);

  const paint = (w: number, h: number, spinT: number, scanLine: number | null) => {
    reels.clear();
    scan.clear();
    const cols = 5;
    const rows = 3;
    const pad = 16;
    const gap = 6;
    const cellW = (w - pad * 2 - gap * (cols - 1)) / cols;
    const cellH = (h - pad * 2 - gap * (rows - 1)) / rows;
    const symbols = [0x4ade80, 0x38bdf8, 0xfbbf24, 0xf472b6, 0xa78bfa, 0xfb7185, 0x94a3b8];

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = pad + c * (cellW + gap);
        const y = pad + r * (cellH + gap);
        const offset = Math.floor(spinT * 7 + c * 3 + r) % symbols.length;
        reels.roundRect(x, y, cellW, cellH, 6);
        reels.fill({ color: symbols[offset] ?? 0x64748b, alpha: 0.55 });
        reels.stroke({ width: 1, color: 0x1e293b, alpha: 0.6 });
      }
    }

    if (scanLine !== null && scanLine >= 0 && scanLine < rows) {
      const y = pad + scanLine * (cellH + gap);
      scan.roundRect(pad, y, w - pad * 2, cellH, 6);
      scan.fill({ color: 0x31e08a, alpha: 0.28 });
      scan.stroke({ width: 2, color: 0x31e08a, alpha: 0.9 });
    }
  };

  return { root, paint };
}

/**
 * Mint Reels L1 — Pixi reel window + payline scan (§23.2 · §23.8).
 * Symbols are cosmetic rhythm only — payout = RPC totalMultiplier 1:1.
 */
export const MintReelsStage = forwardRef<CasinoStageHandle, MintReelsStageProps>(
  function MintReelsStage({ lines, className }, ref) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const hostRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<ReelScene | null>(null);
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedMintReelsOutcome | null>(null);
    const [scanLine, setScanLine] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const { ready } = usePixiStage(hostRef, (app, pixi) => {
      const scene = createReelScene(pixi);
      sceneRef.current = scene;
      app.stage.addChild(scene.root);
      scene.paint(app.screen.width, app.screen.height, 0, null);
      return {
        onResize: (w, h) => scene.paint(w, h, 0, null),
        destroy: () => {
          scene.root.destroy({ children: true });
          sceneRef.current = null;
        },
      };
    });

    const clearTimers = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }, []);

    const settle = useCallback(
      (parsed: ParsedMintReelsOutcome) => {
        clearTimers();
        setOutcome(parsed);
        setPhase('settled');
        setScanLine(parsed.totalMultiplier > 0 ? 1 : null);
        const scene = sceneRef.current;
        const host = hostRef.current;
        if (scene && host) {
          scene.paint(
            host.clientWidth || 320,
            host.clientHeight || 240,
            0,
            parsed.totalMultiplier > 0 ? 1 : null,
          );
        }
        resolveRef.current?.();
        resolveRef.current = null;
      },
      [clearTimers],
    );

    const runSpin = useCallback(
      (parsed: ParsedMintReelsOutcome) => {
        clearTimers();
        setPhase('replaying');
        setOutcome(null);
        setScanLine(null);

        if (reducedMotion) {
          settle(parsed);
          return;
        }

        const duration = mintReelsSpinMs();
        const start = performance.now();
        const tick = (now: number) => {
          const tNorm = Math.min(1, (now - start) / duration);
          const scene = sceneRef.current;
          const host = hostRef.current;
          if (scene && host) {
            scene.paint(host.clientWidth || 320, host.clientHeight || 240, tNorm * 12, null);
          }
          if (tNorm >= 1) {
            // Payline scan rows 0→2
            let line = 0;
            const scan = () => {
              setScanLine(line);
              const s = sceneRef.current;
              const h = hostRef.current;
              if (s && h) {
                s.paint(h.clientWidth || 320, h.clientHeight || 240, 0, line);
              }
              line += 1;
              if (line > 2) {
                settle(parsed);
                return;
              }
              timerRef.current = setTimeout(scan, 120);
            };
            timerRef.current = setTimeout(scan, 80);
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      },
      [clearTimers, reducedMotion, settle],
    );

    useImperativeHandle(
      ref,
      () => ({
        playOutcome(result) {
          const parsed = parseMintReelsOutcome(result);
          if (!parsed) return Promise.resolve();
          return new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            runSpin(parsed);
          });
        },
        reset() {
          clearTimers();
          resolveRef.current = null;
          setPhase('idle');
          setOutcome(null);
          setScanLine(null);
          const scene = sceneRef.current;
          const host = hostRef.current;
          if (scene && host) {
            scene.paint(host.clientWidth || 320, host.clientHeight || 240, 0, null);
          }
        },
      }),
      [clearTimers, runSpin],
    );

    const won = outcome !== null && outcome.totalMultiplier > 0;

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-mint-reels-stage"
        data-stage-phase={phase}
        data-pixi-ready={ready ? 'true' : 'false'}
        data-won={outcome ? (won ? 'true' : 'false') : undefined}
        data-scan-line={scanLine ?? undefined}
        data-lines={lines}
      >
        <CardBody className="flex flex-col gap-3 p-3 md:p-4">
          <div
            ref={hostRef}
            className="bg-surface relative min-h-[200px] w-full overflow-hidden rounded-md md:min-h-[280px]"
            data-testid="casino-mint-reels-canvas-host"
            aria-hidden
          />
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground-muted text-xs">{t('casino.stage.result')}</span>
              <span
                className={cn(
                  'text-2xl font-semibold tabular-nums',
                  won ? 'text-success' : 'text-foreground',
                )}
                data-testid="casino-mint-reels-mult"
              >
                {outcome ? `${outcome.totalMultiplier.toFixed(2)}×` : '—'}
              </span>
            </div>
            <span
              className="text-foreground-muted text-xs tabular-nums"
              data-testid="casino-mint-reels-lines"
            >
              {lines}
            </span>
          </div>
        </CardBody>
      </Card>
    );
  },
);
