import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { PAYOUT_TABLES } from '@phonara/game-engine';

import {
  normalizePlinkoRisk,
  normalizePlinkoRows,
  parsePlinkoOutcome,
  plinkoPathStepMs,
  type ParsedPlinkoOutcome,
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

export type PlinkoStageProps = {
  rows: number;
  risk: string;
  className?: string;
};

type PegScene = {
  root: InstanceType<PixiModule['Container']>;
  layout: (w: number, h: number, rows: number, risk: string, glowBucket: number | null) => void;
  setBall: (x: number, y: number, visible: boolean) => void;
};

function createPegScene(pixi: PixiModule): PegScene {
  const root = new pixi.Container();
  const pegs = new pixi.Graphics();
  const buckets = new pixi.Graphics();
  const glow = new pixi.Graphics();
  const ball = new pixi.Graphics();
  root.addChild(pegs, buckets, glow, ball);

  const layout = (w: number, h: number, rows: number, risk: string, glowBucket: number | null) => {
    pegs.clear();
    buckets.clear();
    glow.clear();
    const padX = 24;
    const padTop = 28;
    const padBottom = 48;
    const usableW = Math.max(80, w - padX * 2);
    const usableH = Math.max(80, h - padTop - padBottom);
    const rowGap = usableH / (rows + 1);
    const pegR = Math.max(2, Math.min(5, usableW / (rows * 6)));

    for (let r = 0; r < rows; r++) {
      const count = r + 1;
      const y = padTop + rowGap * (r + 0.5);
      for (let c = 0; c < count; c++) {
        const x = padX + (usableW * (c + 0.5)) / count;
        pegs.circle(x, y, pegR);
        pegs.fill({ color: 0x8b9cb3, alpha: 0.85 });
      }
    }

    const table =
      PAYOUT_TABLES[rows]?.[risk as 'low' | 'medium' | 'high'] ?? PAYOUT_TABLES[12]!.medium;
    const bucketCount = table.length;
    const bw = usableW / bucketCount;
    for (let i = 0; i < bucketCount; i++) {
      const x = padX + bw * i;
      const y = h - padBottom + 4;
      buckets.roundRect(x + 1, y, bw - 2, 28, 4);
      buckets.fill({ color: 0x1a2332, alpha: 0.9 });
      buckets.stroke({ width: 1, color: 0x3d4f66, alpha: 0.8 });
    }

    if (glowBucket !== null && glowBucket >= 0 && glowBucket < bucketCount) {
      const x = padX + bw * glowBucket;
      const y = h - padBottom + 4;
      glow.roundRect(x + 1, y, bw - 2, 28, 4);
      glow.fill({ color: 0x31e08a, alpha: 0.45 });
    }
  };

  const setBall = (x: number, y: number, visible: boolean) => {
    ball.clear();
    if (!visible) return;
    ball.circle(x, y, 7);
    ball.fill({ color: 0xf5c542, alpha: 1 });
  };

  return { root, layout, setBall };
}

/**
 * Plinko L1 — Pixi peg board + path replay from RPC (§23.2 · §23.8).
 * Ball path = result.path only — no client re-roll.
 */
export const PlinkoStage = forwardRef<CasinoStageHandle, PlinkoStageProps>(function PlinkoStage(
  { rows: rowsProp, risk: riskProp, className },
  ref,
) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<PegScene | null>(null);
  const [phase, setPhase] = useState<CasinoStagePhase>('idle');
  const [outcome, setOutcome] = useState<ParsedPlinkoOutcome | null>(null);
  const [pathIndex, setPathIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const rows = normalizePlinkoRows(rowsProp);
  const risk = normalizePlinkoRisk(riskProp);
  const table = PAYOUT_TABLES[rows]?.[risk] ?? PAYOUT_TABLES[12]!.medium;

  const { ready } = usePixiStage(hostRef, (app, pixi) => {
    const scene = createPegScene(pixi);
    sceneRef.current = scene;
    app.stage.addChild(scene.root);
    const paint = () => {
      scene.layout(app.screen.width, app.screen.height, rows, risk, null);
      scene.setBall(app.screen.width / 2, 20, false);
    };
    paint();
    return {
      onResize: () => paint(),
      destroy: () => {
        scene.root.destroy({ children: true });
        sceneRef.current = null;
      },
    };
  });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const ballAtStep = useCallback(
    (parsed: ParsedPlinkoOutcome, step: number, w: number, h: number) => {
      const padX = 24;
      const padTop = 28;
      const padBottom = 48;
      const usableW = Math.max(80, w - padX * 2);
      const usableH = Math.max(80, h - padTop - padBottom);
      const rowGap = usableH / (parsed.path.length + 1);
      let col = 0;
      for (let i = 0; i < step; i++) {
        col += parsed.path[i] ?? 0;
      }
      const row = Math.min(step, parsed.path.length);
      const count = Math.max(1, row);
      const x = padX + (usableW * (col + 0.5)) / count;
      const y = padTop + rowGap * (row + 0.35);
      return { x, y };
    },
    [],
  );

  const settle = useCallback(
    (parsed: ParsedPlinkoOutcome) => {
      clearTimer();
      setPathIndex(parsed.path.length);
      setOutcome(parsed);
      setPhase('settled');
      const scene = sceneRef.current;
      const host = hostRef.current;
      if (scene && host) {
        const w = host.clientWidth || 320;
        const h = host.clientHeight || 280;
        scene.layout(w, h, rows, risk, parsed.bucket);
        const end = ballAtStep(parsed, parsed.path.length, w, h);
        scene.setBall(end.x, end.y, true);
      }
      resolveRef.current?.();
      resolveRef.current = null;
    },
    [ballAtStep, clearTimer, risk, rows],
  );

  const runPath = useCallback(
    (parsed: ParsedPlinkoOutcome) => {
      clearTimer();
      setPhase('replaying');
      setOutcome(null);
      setPathIndex(0);

      if (reducedMotion || parsed.path.length === 0) {
        settle(parsed);
        return;
      }

      const stepMs = plinkoPathStepMs(parsed.path.length);
      let i = 0;
      const tick = () => {
        i += 1;
        setPathIndex(i);
        const scene = sceneRef.current;
        const host = hostRef.current;
        if (scene && host) {
          const w = host.clientWidth || 320;
          const h = host.clientHeight || 280;
          const pos = ballAtStep(parsed, i, w, h);
          scene.setBall(pos.x, pos.y, true);
        }
        if (i >= parsed.path.length) {
          settle(parsed);
          return;
        }
        timerRef.current = setTimeout(tick, stepMs);
      };
      timerRef.current = setTimeout(tick, stepMs);
    },
    [ballAtStep, clearTimer, reducedMotion, settle],
  );

  useImperativeHandle(
    ref,
    () => ({
      playOutcome(result) {
        const parsed = parsePlinkoOutcome(result);
        if (!parsed) return Promise.resolve();
        return new Promise<void>((resolve) => {
          resolveRef.current = resolve;
          runPath(parsed);
        });
      },
      reset() {
        clearTimer();
        resolveRef.current = null;
        setPhase('idle');
        setOutcome(null);
        setPathIndex(0);
        const scene = sceneRef.current;
        const host = hostRef.current;
        if (scene && host) {
          scene.layout(host.clientWidth || 320, host.clientHeight || 280, rows, risk, null);
          scene.setBall(0, 0, false);
        }
      },
    }),
    [clearTimer, risk, rows, runPath],
  );

  return (
    <Card
      variant="casino-play"
      className={cn(className)}
      data-testid="casino-plinko-stage"
      data-stage-phase={phase}
      data-pixi-ready={ready ? 'true' : 'false'}
      data-bucket={outcome?.bucket}
      data-path-index={pathIndex}
    >
      <CardBody className="flex flex-col gap-3 p-3 md:p-4">
        <div
          ref={hostRef}
          className="bg-surface relative min-h-[240px] w-full overflow-hidden rounded-md md:min-h-[320px]"
          data-testid="casino-plinko-canvas-host"
          aria-hidden
        />
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground-muted text-xs">{t('casino.stage.result')}</span>
            <span
              className="text-foreground text-2xl font-semibold tabular-nums"
              data-testid="casino-plinko-bucket-mult"
            >
              {outcome ? `${outcome.bucketMultiplier}×` : '—'}
            </span>
          </div>
          <div
            className="text-foreground-muted flex max-w-full gap-1 overflow-x-auto text-tiny tabular-nums"
            data-testid="casino-plinko-bucket-row"
          >
            {table.map((m, i) => (
              <span
                key={i}
                className={cn(
                  'min-w-8 rounded px-1 py-0.5 text-center',
                  outcome?.bucket === i && 'bg-success/20 text-success font-semibold',
                )}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
});
