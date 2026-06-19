/**
 * Plinko · Stage — Pixi v8 board + multiplier strip + fairness sheet.
 *
 * L1-06 v0.1 — DOM/Matter renderer replaced by {@link PlinkoBoard} (Pixi).
 * Props/state contract, server-truth `bucket` consumption, 3구간 feel
 * routing, multiplier strip DOM, and Controls 0-touch are all preserved.
 *
 * Phase 3 result schema (PHONARA `packages/game-engine/src/games/plinko.ts`):
 *   { path: number[]; bucket: number; bucketMultiplier: string }
 *
 * Win/Loss/Neutral 3구간 (plinko-checkpoint §Win/Loss · UNCHANGED):
 *   - Number(bucketMultiplier) >= 1.01 → win  · juice + CelebrateOverlay
 *   - 1.0 ≤ mult < 1.01                → neutral · tier 'none' · no shake
 *   - Number(bucketMultiplier) < 1     → loss · screenShake
 *
 * Server `bucket` remains the source of truth; the Pixi integrator only
 * biases the cosmetic ball path toward the target X so the visible
 * landing agrees with the payout. Client never recomputes payout (F3).
 * jsdom/WebGL absence is tolerated via try/catch around Pixi init (F12) —
 * Stage falls back to a static board and tests that count the .flex-1
 * multiplier strip continue to pass.
 */
import { useEffect, useRef, useState } from "react";
import { FairnessSheet } from "../shared/FairnessSheet";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { useSound } from "../shared/hooks/useSound";
import { celebrationTier, CelebrateOverlay } from "../shared/celebrate";
import { screenShake } from "../shared/feel/screenShake";
import { juice } from "../shared/feel/juice";
import { cn } from "@/lib/utils";
import { PlinkoBoard } from "./pixi/PlinkoBoard";
import "../shared/motion-tokens.css";
import type { ImportedGameSurfaceProps, PlinkoSelection } from "../shared/types";

type Props = Pick<
  ImportedGameSurfaceProps<"plinko">,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "onClientSeedChange"
>;

// Display-only multipliers per (rows, risk). Server payout is authoritative.
const MULT_TABLE: Record<PlinkoSelection["risk"], Record<8 | 12 | 16, number[]>> = {
  low: {
    8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.3, 1.1, 1.0, 0.5, 0.3, 0.5, 1.0, 1.1, 1.3, 1.4, 2, 9, 16],
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110],
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const { play } = useSound();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<PlinkoBoard | null>(null);
  const [resultBin, setResultBin] = useState<number | null>(null);

  const sel = p.selection;
  const mults = MULT_TABLE[sel.risk][sel.rows];

  // PHONARA Plinko engine result: { path, bucket, bucketMultiplier: string }.
  // bucketMultiplier 문자열 보존 (SQL parity), 비교만 Number(...).
  const r = (p.bet?.result ?? {}) as {
    path?: number[];
    bucket?: number;
    bucketMultiplier?: string;
  };
  const multStr = r.bucketMultiplier ?? "0";
  const mult = Number(multStr);
  const isWin = mult >= 1.01;
  const tier = isWin ? celebrationTier(mult) : "none";

  // E2E (Playwright): skip Pixi/WebGL ticker — casino.spec keeps the page open
  // during long RPC sections; a 60fps ticker + Docker on low-spec PCs freezes the run.
  const skipPixiForE2e =
    import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1' ||
    (typeof navigator !== 'undefined' && navigator.webdriver === true);
  // Vitest/jsdom: skip Pixi ticker (no WebGL; avoids unhandled render errors after unmount).
  const skipPixiForTests =
    import.meta.env['VITEST'] === true || import.meta.env['VITEST'] === 'true';
  const skipPixi = skipPixiForE2e || skipPixiForTests;

  // Mount Pixi board. jsdom/WebGL-less env → silent fallback (F12).
  useEffect(() => {
    if (skipPixi) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    let cancelled = false;
    const board = new PlinkoBoard(canvas, container, {
      rows: sel.rows,
      risk: sel.risk,
      reduced,
    });
    boardRef.current = board;
    board.init().catch(() => {
      // WebGL unavailable (jsdom/headless). Static fallback — drop()
      // still resolves onLand via the no-app branch in PlinkoBoard.
    });
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (!cancelled) board.resize();
          })
        : null;
    if (ro) ro.observe(container);
    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      board.destroy();
      boardRef.current = null;
    };
    // Rows/risk changes are handled by the next effect via rebuild().
  }, [skipPixi]);

  useEffect(() => {
    boardRef.current?.rebuild({ rows: sel.rows, risk: sel.risk, reduced });
  }, [sel.rows, sel.risk, reduced]);

  // Drop ball when a new bet result arrives — server `bucket` is the truth.
  // Also fires win/loss/neutral feel effects per 3구간 routing (UNCHANGED).
  // Guard: only fire once per bet object (rows/risk change must NOT re-drop).
  const lastBetRef = useRef<typeof p.bet>(null);
  useEffect(() => {
    if (!p.bet || p.bet === lastBetRef.current) return;
    const targetBin = r.bucket;
    if (targetBin === undefined) return;
    lastBetRef.current = p.bet;
    setResultBin(null);
    boardRef.current?.drop({
      targetBucket: targetBin,
      onLand: (bin) => {
        setResultBin(bin);
        play((mults[bin] ?? 0) >= 1 ? "win" : "lose");
      },
    });
    // 3구간: win → juice, loss(mult < 1) → screenShake, neutral(1.0 ≤ mult < 1.01) → no-op.
    if (isWin) {
      juice(badgeRef.current, { reduced });
    } else if (mult < 1) {
      screenShake(stageRef.current, { reduced });
    }
     
  }, [p.bet, reduced]);

  return (
    <div
      ref={stageRef}
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-(--color-surface-elev) to-(--color-surface)"
    >
      <div className="absolute right-3 top-3 z-10">
        <FairnessSheet
          gameCode={p.gameCode}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
        />
      </div>
      <div
        ref={badgeRef}
        className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-(--color-surface)/70 px-2 py-1 font-mono text-xs tabular-nums backdrop-blur-sm"
        aria-live="polite"
      >
        {multStr}×
      </div>
      <div ref={containerRef} className="plinko-shimmer-host relative block aspect-[5/4] w-full">
        <canvas ref={canvasRef} className="relative z-[1] block h-full w-full" />
      </div>
      <div className="flex gap-0.5 px-2 pb-3">
        {mults.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-sm py-1 text-center text-[9px] font-bold tabular-nums",
              resultBin === i
                ? m >= 1
                  ? "bg-(--color-up) text-black"
                  : "bg-(--color-down) text-white"
                : m >= 5
                  ? "bg-(--color-gold)/30 text-(--color-gold)"
                  : m >= 1
                    ? "bg-(--color-primary)/20 text-(--color-primary)"
                    : "bg-(--color-surface) text-muted-foreground",
            )}
          >
            {m}×
          </div>
        ))}
      </div>
      <CelebrateOverlay tier={tier} multiplier={multStr} reduced={reduced} />
    </div>
  );
}
