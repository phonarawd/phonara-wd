/**
 * Roulette · Stage — European single-zero wheel.
 *
 * Phase 4 v1 RED LOCK v1 FINAL+ — PHONARA `packages/game-engine/src/games/roulette.ts` 1:1:
 *   { winningNumber: number /* [0,36] *\/, totalMultiplier: number }
 *
 * WIN/LOSE truth: `Number(result.totalMultiplier) > 0` only (string·number 둘 다 수용).
 * Stage는 `bets[]` × winningNumber 재계산 금지 — engine truth.
 *
 * Feel rules (handoff §4 roulette 행 신규 — GREEN §E 반영 요청):
 *   won && Number(totalMultiplier) >= 1.01 → juice + CelebrateOverlay(tier)
 *   !won                                    → screenShake + lose sound
 *   idle (winningNumber === undefined)      → no-op
 *
 * Reduced-motion guard: wheel spin transform 제거, fade-only.
 */
import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { FairnessSheet } from "../shared/FairnessSheet";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { useSound } from "../shared/hooks/useSound";
import { celebrationTier, CelebrateOverlay } from "../shared/celebrate";
import { screenShake } from "../shared/feel/screenShake";
import { juice } from "../shared/feel/juice";
import type { ImportedGameSurfaceProps } from "../shared/types";

const POCKET_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

type Props = Pick<
  ImportedGameSurfaceProps<"roulette">,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "busy"
  | "onClientSeedChange"
>;

function pocketColor(n: number): string {
  if (n === 0) return "#16a34a";
  return RED.has(n) ? "#dc2626" : "#0a0a0a";
}

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const { play } = useSound();
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const result = p.bet?.result as
    | { winningNumber?: number; totalMultiplier?: number | string }
    | undefined;
  const winning = result?.winningNumber;
  const rawMult = result?.totalMultiplier;
  // Truth gate — string/number 둘 다 수용 (adapter normalize 회귀 가드).
  const settleMult = rawMult != null ? Number(rawMult) : 0;
  const won = rawMult != null ? settleMult > 0 : null;

  const isWin = won === true && settleMult >= 1.01;
  const tier = isWin ? celebrationTier(settleMult) : "none";

  // Feel 2지 — engine truth only (`Number(totalMultiplier) > 0`).
  useEffect(() => {
    if (!p.bet || winning === undefined) return; // idle guard
    if (won && settleMult >= 1.01) {
      juice(badgeRef.current, { reduced });
      play("win");
    } else if (won === false) {
      screenShake(stageRef.current, { reduced });
      play("lose");
    }
     
  }, [p.bet, reduced]);

  // Wheel rotation aligns winning pocket to 12 o'clock; reduced-motion → no transform.
  const targetRotation = useMemo(() => {
    if (winning === undefined) return 0;
    const idx = POCKET_ORDER.indexOf(winning);
    if (idx === -1) return 0;
    const seg = 360 / POCKET_ORDER.length;
    return 5 * 360 + 360 - (idx * seg + seg / 2);
  }, [winning]);

  const svgStyle = reduced
    ? { transition: "opacity 0.2s linear" }
    : {
        transition:
          winning !== undefined
            ? "transform 3.2s cubic-bezier(0.15,0.9,0.2,1)"
            : "none",
        transform: `rotate(${targetRotation}deg)`,
      };

  return (
    <div
      ref={stageRef}
      data-testid="casino-stage"
      data-game-id="roulette-stage"
      className="relative grid gap-4 overflow-hidden rounded-2xl border border-amber-900/40 bg-gradient-to-b from-stone-950 via-stone-900 to-(--color-surface) p-4"
    >
      <div className="relative flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/80">
          European Roulette
        </div>
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
        className="relative mx-auto grid place-items-center"
        style={{ maxWidth: "min(90vw, 320px)" }}
      >
        <svg
          data-testid="roulette-wheel-svg"
          viewBox="-110 -110 220 220"
          className="size-72 lg:size-80"
          style={svgStyle}
        >
          <defs>
            <radialGradient id="roulette-rim" cx="50%" cy="50%" r="50%">
              <stop offset="80%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#fbbf24" />
            </radialGradient>
          </defs>
          <circle r="105" fill="url(#roulette-rim)" />
          <circle r="98" fill="#451a03" />
          {POCKET_ORDER.map((n, i) => {
            const seg = 360 / POCKET_ORDER.length;
            const start = (i * seg - 90) * (Math.PI / 180);
            const end = ((i + 1) * seg - 90) * (Math.PI / 180);
            const r = 95;
            const x1 = Math.cos(start) * r;
            const y1 = Math.sin(start) * r;
            const x2 = Math.cos(end) * r;
            const y2 = Math.sin(end) * r;
            const d = `M0,0 L${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2} Z`;
            const mid = ((i + 0.5) * seg - 90) * (Math.PI / 180);
            const tx = Math.cos(mid) * 82;
            const ty = Math.sin(mid) * 82;
            const isWinPocket =
              winning !== undefined && won === true && n === winning;
            return (
              <g key={n}>
                <path
                  d={d}
                  fill={pocketColor(n)}
                  stroke="#1c1917"
                  strokeWidth="0.5"
                  style={
                    isWinPocket
                      ? { filter: "drop-shadow(0 0 6px #fbbf24)" }
                      : undefined
                  }
                />
                <text
                  x={tx}
                  y={ty}
                  fill="white"
                  fontSize="9"
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  paintOrder="stroke"
                  stroke="#000"
                  strokeWidth="0.6"
                  transform={`rotate(${(i + 0.5) * seg} ${tx} ${ty})`}
                >
                  {n}
                </text>
              </g>
            );
          })}
          <circle r="98" fill="none" stroke="#fbbf24" strokeWidth="1.2" />
          <circle r="30" fill="#92400e" />
          <circle r="24" fill="#451a03" />
          <circle r="12" fill="#fbbf24" />
          <circle r="4" fill="#fef3c7" opacity="0.6" />
        </svg>

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            top: "-2px",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "18px solid #fbbf24",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
          }}
        />
      </div>

      {winning !== undefined && (
        <div
          className={cn(
            "relative grid place-items-center rounded-lg border py-2 text-sm font-bold tabular-nums",
            won
              ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-300",
          )}
        >
          <span>
            {winning} · {won ? `${settleMult.toFixed(2)}×` : "LOSE"}
          </span>
        </div>
      )}

      <CelebrateOverlay
        tier={tier}
        multiplier={settleMult.toFixed(2)}
        reduced={reduced}
      />
    </div>
  );
}
