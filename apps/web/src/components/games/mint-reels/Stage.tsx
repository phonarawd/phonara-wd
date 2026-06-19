/**
 * Mint Reels · Stage — 3 rows × 5 columns slot grid + fairness.
 *
 * PHONARA engine returns ONLY `{ totalMultiplier }` — there is NO
 * `bet.result.grid`. Stage MUST NOT read `bet.result.grid`. Instead:
 *  - Animate reels using `seedToGrid(server_seed_hash, clientSeed, nonce)`
 *    (UI-only deterministic — see shared/seedToGrid.ts).
 *  - Use `bet.result.totalMultiplier` for win-tier styling only.
 *  - Idle grid when no commitment exists (pre-spin static pattern).
 */
import { useEffect, useMemo, useState } from "react";
import { Gem, Sparkles, Star, Crown, Leaf, Diamond, Coins, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { FairnessSheet } from "../shared/FairnessSheet";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { seedToGrid } from "../shared/seedToGrid";
import type { ImportedGameSurfaceProps } from "../shared/types";

const SYMBOLS = [Leaf, Sparkles, Diamond, Star, Gem, Crown, Coins, Zap] as const;
const COLS = 5;
const ROWS = 3;
const CELLS = ROWS * COLS;

type Props = Pick<
  ImportedGameSurfaceProps<"mint_reels">,
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
  // Deterministic idle pattern — not RNG-derived.
  return Array.from({ length: CELLS }, (_, i) => (i * 3) % SYMBOLS.length);
}

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const result = p.bet?.result as { totalMultiplier?: string } | undefined;
  const tier = computeTier(result?.totalMultiplier);
  const [spinTick, setSpinTick] = useState(0);

  // When a new settled bet arrives, bump spinTick so columns re-animate
  // AND `seedToGrid` reroll uses a fresh nonce.
  useEffect(() => {
    if (p.bet) setSpinTick((t) => t + 1);
  }, [p.bet]);

  // PHONARA hard contract: NEVER read `bet.result.grid`. Visual reels are
  // derived deterministically from the public commitment hash + client seed
  // + spin nonce. Settlement (`totalMultiplier`) remains the only source of
  // truth for win/loss styling.
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
      className="relative grid gap-4 overflow-hidden rounded-2xl border border-teal-300/35 ring-1 ring-emerald-200/15 bg-gradient-to-b from-emerald-950/80 via-teal-900/40 to-emerald-950/60 p-4"
    >
      {/* Holographic shimmer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(94,234,212,0.25), transparent 50%), radial-gradient(circle at 70% 80%, rgba(167,139,250,0.18), transparent 55%)",
        }}
      />
      {/* Top-light streak — premium plate gloss */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "linear-gradient(180deg, rgba(167,243,208,.08), transparent 60%)",
        }}
      />

      <div className="relative flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-teal-300/80">
          Mint Reels · {p.selection.lines}L
        </div>
        <FairnessSheet
          gameCode={p.gameCode}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
        />
      </div>

      {/* Reels: 5 columns × 3 rows.
          PERF: transform + opacity + filter only. NO rAF, NO getComputedStyle. */}
      <div className="relative rounded-xl border border-teal-400/25 bg-emerald-950/30 p-3 shadow-[inset_0_0_30px_rgba(94,234,212,0.15)]">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: COLS }).map((_, col) => (
            <div
              key={col}
              className="grid gap-2"
              style={{
                animation: reduced
                  ? undefined
                  : p.busy
                    ? `slotBlur 0.45s ease-out`
                    : undefined,
                animationDelay: `${col * 0.08}s`,
                // S2: will-change ONLY during spin; idle → 'auto' to drop GPU layer
                willChange: p.busy && !reduced ? "transform, filter" : "auto",
              }}
            >
              {Array.from({ length: ROWS }).map((_, row) => {
                const idx = row * COLS + col;
                const symIdx = grid[idx] ?? 0;
                const SymIcon = SYMBOLS[symIdx % SYMBOLS.length] ?? Leaf;
                const isWin = tier !== "none";
                return (
                  <div
                    key={`${spinTick}-${row}-${col}`}
                    className={cn(
                      "grid aspect-square size-8 md:size-10 place-items-center rounded-lg border bg-gradient-to-br from-emerald-900/60 to-teal-900/40 transition-[box-shadow,border-color] duration-200",
                      isWin
                        ? tier === "mega"
                          ? "border-amber-300/80 shadow-[0_0_20px_rgba(252,211,77,0.5)]"
                          : "border-teal-300/60 shadow-[0_0_12px_rgba(94,234,212,0.4)]"
                        : "border-teal-500/20",
                    )}
                    style={{
                      boxShadow: isWin
                        ? undefined
                        : "inset 0 1px 0 rgba(255,255,255,0.04)",
                      animation:
                        reduced || !p.bet
                          ? undefined
                          : `slotPop 0.4s ease-out ${col * 0.08 + row * 0.05}s both`,
                    }}
                  >
                    <SymIcon
                      className={cn(
                        "size-5 md:size-6",
                        isWin
                          ? tier === "mega"
                            ? "text-amber-300"
                            : "text-teal-300"
                          : "text-teal-100/80",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Win banner — layered punch on MEGA */}
        {tier !== "none" && result?.totalMultiplier && (
          <div className="relative mt-3 flex items-center justify-center gap-2 font-bold tabular-nums">
            {tier === "mega" && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle, rgba(252,211,77,.25), transparent 60%)",
                }}
              />
            )}
            {tier === "mega" && (
              <Trophy className="relative size-5 text-amber-300" />
            )}
            <span className="relative text-teal-200/70 text-sm">
              {tier === "mega"
                ? t("games.mintreels.mega")
                : t("games.mintreels.win")}
            </span>
            <span
              className={cn(
                "relative",
                tier === "mega"
                  ? "text-amber-200 text-2xl"
                  : "text-teal-300 text-xl",
              )}
            >
              {result.totalMultiplier}×
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slotPop {
          0% { transform: translateY(-12px) scale(0.96); opacity: 0; }
          60% { transform: translateY(2px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes slotBlur {
          0% { filter: blur(0); }
          50% { filter: blur(3px); }
          100% { filter: blur(0); }
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
