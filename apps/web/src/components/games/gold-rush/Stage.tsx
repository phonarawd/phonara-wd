/**
 * Gold Rush · Stage — 3 rows × 5 columns slot grid (gold-premium).
 *
 * SAME PHONARA contract as Mint Reels: engine returns ONLY
 * `{ totalMultiplier }`. NEVER read `bet.result.grid`. Reels are
 * deterministically derived from the public commitment hash + clientSeed
 * + nonce via `seedToGrid` (decorative — NOT engine truth).
 *
 * PERF: transform + opacity + filter only. NO rAF, NO getComputedStyle.
 * `will-change` is applied only on `p.busy` and dropped to `auto` on idle
 * to avoid GPU layer leak.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Pickaxe, Gem, Bomb, Coins, Crown, Star, Mountain, Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { FairnessSheet } from "../shared/FairnessSheet";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { seedToGrid } from "../shared/seedToGrid";
import type { ImportedGameSurfaceProps } from "../shared/types";

const SYMBOLS = [Pickaxe, Gem, Bomb, Coins, Crown, Star, Mountain, Skull] as const;
const COLS = 5;
const ROWS = 3;
const CELLS = ROWS * COLS;

type Props = Pick<
  ImportedGameSurfaceProps<"gold_rush">,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "busy"
  | "onClientSeedChange"
>;

function pickIdleGrid(): number[] {
  return Array.from({ length: ROWS * COLS }, (_, i) => (i * 5 + 1) % SYMBOLS.length);
}

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const result = p.bet?.result as { totalMultiplier?: string } | undefined;
  const tier = computeTier(result?.totalMultiplier);
  const [spinTick, setSpinTick] = useState(0);
  const reelsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (p.bet) setSpinTick((tk) => tk + 1);
  }, [p.bet]);

  // PERF: drop will-change to `auto` on idle so GPU layers don't leak.
  useEffect(() => {
    const el = reelsRef.current;
    if (!el) return;
    el.style.willChange = p.busy ? "transform, filter" : "auto";
  }, [p.busy]);

  // PHONARA hard contract: NEVER read `bet.result.grid`. Deterministic from
  // public commitment hash + client seed + spin nonce only (decorative).
  const grid = useMemo(() => {
    if (!p.commitment) return pickIdleGrid();
    return seedToGrid({
      serverSeedHash: p.commitment.server_seed_hash,
      clientSeed: p.clientSeed,
      nonce: spinTick,
      modulo: SYMBOLS.length,
      length: CELLS,
    });
  }, [p.commitment, p.clientSeed, spinTick]);

  return (
    <div
      data-testid="casino-stage"
      className="relative grid gap-4 overflow-hidden rounded-2xl border border-amber-400/35 ring-1 ring-yellow-200/15 bg-gradient-to-b from-amber-950/85 via-yellow-900/45 to-amber-950/65 p-4"
    >
      {/* Vignette + faint wood grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%), repeating-linear-gradient(90deg, rgba(120,53,15,0.08) 0px, rgba(120,53,15,0.08) 2px, transparent 2px, transparent 6px)",
        }}
      />
      {/* Top-light streak — premium plate gloss */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "linear-gradient(180deg, rgba(252,211,77,.10), transparent 60%)",
        }}
      />

      <div className="relative flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/90">
          Gold Rush · {p.selection.lines}L
        </div>
        <FairnessSheet
          gameCode={p.gameCode}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
        />
      </div>

      {/* Reels: 5 cols × 3 rows. PERF: transform/opacity/filter only. */}
      <div
        ref={reelsRef}
        className="relative rounded-xl border border-amber-500/30 bg-stone-950/55 p-3 shadow-[inset_0_0_30px_rgba(252,211,77,0.14)]"
      >
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: COLS }).map((_, col) => (
            <div key={col} className="grid gap-2">
              {Array.from({ length: ROWS }).map((_, row) => {
                const idx = row * COLS + col;
                const symIdx = grid[idx] ?? 0;
                const SymIcon = SYMBOLS[symIdx % SYMBOLS.length] ?? Pickaxe;
                const isWin = tier !== "none";
                // Last column = jackpot anticipation — slower stagger (≤900ms total).
                const delay = col === COLS - 1 ? col * 0.18 + row * 0.05 : col * 0.08 + row * 0.05;
                return (
                  <div
                    key={`${spinTick}-${row}-${col}`}
                    className={cn(
                      "grid aspect-square size-8 md:size-10 place-items-center rounded-lg border bg-gradient-to-br from-amber-900/55 to-stone-900/65",
                      "transition-[box-shadow,border-color] duration-200",
                      isWin
                        ? tier === "mega"
                          ? "border-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.6)]"
                          : "border-amber-400/60 shadow-[0_0_12px_rgba(252,191,36,0.4)]"
                        : "border-amber-500/25",
                    )}
                    style={{
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
                      animation:
                        reduced || !p.bet ? undefined : `goldDrop 0.5s ease-out ${delay}s both`,
                    }}
                  >
                    <SymIcon
                      className={cn(
                        "size-7 md:size-8",
                        isWin
                          ? tier === "mega"
                            ? "text-amber-300"
                            : "text-amber-200"
                          : "text-amber-100/70",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {tier !== "none" && result?.totalMultiplier && (
          <div
            className={cn(
              "relative mt-3 flex items-center justify-center gap-2 font-bold tabular-nums",
              tier === "mega" ? "text-2xl" : "text-xl",
            )}
          >
            {tier === "mega" && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(252,211,77,0.35), transparent 65%)",
                }}
              />
            )}
            {tier === "mega" && <Crown className="size-5 text-amber-300" aria-hidden />}
            <span className="text-amber-200/80 text-xs uppercase tracking-[0.2em]">
              {tier === "mega" ? t("games.goldrush.mega") : t("games.goldrush.win")}
            </span>
            <span className={cn(tier === "mega" ? "text-amber-300" : "text-amber-200")}>
              {result.totalMultiplier}×
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes goldDrop {
          0% { transform: translateY(-16px) scale(0.92); opacity: 0; filter: blur(3px); }
          70% { transform: translateY(3px) scale(1.04); opacity: 1; filter: blur(0); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function computeTier(mult: string | undefined): "none" | "win" | "mega" {
  if (!mult) return "none";
  const n = Number(mult);
  if (!Number.isFinite(n) || n < 1) return "none";
  if (n >= 5) return "mega";
  return "win";
}
