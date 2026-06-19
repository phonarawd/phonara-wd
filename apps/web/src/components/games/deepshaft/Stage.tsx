/**
 * Deepshaft · Stage — vertical copper-stone mine shaft.
 *
 * PHONARA contract (consume-only):
 *   selection: { riskTier, targetDepth }
 *   result:    { levels[], reachedDepth, caveIn, totalMultiplier, won }
 *
 * Engine-vs-mock branch:
 *   const engineLevels = bet?.result?.levels;
 *   const replayLevels = engineLevels ?? mockLevels(selection, hash);
 *   // settle banner ALWAYS reads totalMultiplier/won/caveIn from
 *   // bet.result — never from levels[] / never from mockLevels.
 *
 * LAW 4 FULL: replayLevels lives in this closure. <ShaftCell />
 * receives only resolved `"hidden" | "revealed-gold" | "revealed-cavein"`
 * strings. Hidden cells carry no `gold`/`cavein` token anywhere.
 *
 * G#10 polish:
 *   - per-cell pickaxe-strike (≤180ms), gold sparkle (≤260ms),
 *     dust + short shake (≤200ms) on cavein. Keyframes live in this
 *     scoped <style> block — NO touch to styles.css.
 *   - running multiplier readout (last-gold-seen; never totalMultiplier).
 *   - depth-darkening amber overlay driven by revealIndex/depthCount.
 *   - sound via shared useSound (default muted): tick/win/lose.
 *
 * PERF: transform + opacity + filter only. NO rAF, NO getComputedStyle.
 * Timers cleared on unmount and on selection/bet change re-entry.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Pickaxe } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { FairnessSheet } from "../shared/FairnessSheet";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { useSound } from "../shared/hooks/useSound";
import type {
  DeepshaftLevel,
  DeepshaftResult,
  ImportedGameSurfaceProps,
} from "../shared/types";
import { mockLevels } from "./mockLevels";
import { ShaftCell, type ShaftCellState } from "./ShaftCell";

const MAX_DEPTH = 15;
const REVEAL_STEP_MS = 60; // 60ms/cell, capped ≤900ms total.
const REVEAL_CAP_MS = 900;

type Props = Pick<
  ImportedGameSurfaceProps<"deepshaft">,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "busy"
  | "onClientSeedChange"
>;

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const { play } = useSound();

  // Settle banner — ENGINE TRUTH ONLY. Never from levels[] / mockLevels.
  const settle = (p.bet?.result ?? {}) as Partial<DeepshaftResult>;
  const settleMult = settle.totalMultiplier;
  const settleWon = settle.won;
  const settleCaveIn = settle.caveIn;
  const settleReached = settle.reachedDepth ?? 0;

  // Engine-vs-mock branch — DECORATIVE only.
  const engineLevels = settle.levels as DeepshaftLevel[] | undefined;
  const replayLevels = useMemo<DeepshaftLevel[]>(
    () =>
      engineLevels ?? mockLevels(p.selection, p.commitment?.server_seed_hash),
    [engineLevels, p.selection, p.commitment?.server_seed_hash],
  );

  // Progressive reveal — setTimeout cascade, cap ≤900ms.
  // Bet present → animate from 0 to replayLevels.length.
  // Idle → all cells hidden.
  const settled = Boolean(p.bet);
  const [revealIndex, setRevealIndex] = useState(0);
  const timersRef = useRef<number[]>([]);
  const tickedRef = useRef(0);
  const settledFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    // Clear any pending timers on every re-entry (selection / bet change).
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];

    if (!settled) {
      setRevealIndex(0);
      tickedRef.current = 0;
      return;
    }

    // Reduced motion: jump directly to final.
    if (reduced) {
      setRevealIndex(replayLevels.length);
      return;
    }

    setRevealIndex(0);
    tickedRef.current = 0;
    const total = replayLevels.length;
    const cap = Math.min(REVEAL_CAP_MS, total * REVEAL_STEP_MS);
    const step = total > 0 ? cap / total : REVEAL_STEP_MS;
    for (let i = 0; i < total; i++) {
      const id = window.setTimeout(() => setRevealIndex(i + 1), step * (i + 1));
      timersRef.current.push(id);
    }

    return () => {
      // PERF: clearTimeout on unmount AND on dep re-entry — no orphan timers.
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, [settled, reduced, replayLevels]);

  // Throttled tick — one play() per newly revealed cell.
  // Natural throttle: cascade step is ≥60ms (cap 900ms / 15 = 60ms).
  useEffect(() => {
    if (!settled) return;
    if (revealIndex <= tickedRef.current) return;
    tickedRef.current = revealIndex;
    play("tick");
  }, [settled, revealIndex, play]);

  // Settle sound — exactly once per distinct bet, AFTER cascade ends.
  useEffect(() => {
    if (!settled) {
      settledFingerprintRef.current = null;
      return;
    }
    const fp =
      p.bet?.bet_id ??
      (typeof settleMult === "string"
        ? `${settleMult}|${settleReached}|${String(settleCaveIn)}`
        : null);
    if (!fp || settledFingerprintRef.current === fp) return;
    if (revealIndex < replayLevels.length) return;
    settledFingerprintRef.current = fp;
    play(settleWon === true ? "win" : "lose");
  }, [
    settled,
    revealIndex,
    replayLevels.length,
    p.bet?.bet_id,
    settleMult,
    settleReached,
    settleCaveIn,
    settleWon,
    play,
  ]);

  // Per-cell resolved state. NEVER pass replayLevels itself.
  // While idle (!settled) every cell is hidden regardless of replayLevels.
  function resolveState(depthIdx: number): ShaftCellState {
    if (!settled) return "hidden";
    if (depthIdx >= revealIndex) return "hidden";
    const lvl = replayLevels[depthIdx];
    if (!lvl) return "hidden";
    return lvl.kind === "gold" ? "revealed-gold" : "revealed-cavein";
  }

  function resolveMultiplier(depthIdx: number): string | undefined {
    if (!settled || depthIdx >= revealIndex) return undefined;
    const lvl = replayLevels[depthIdx];
    if (!lvl || lvl.kind !== "gold") return undefined;
    return lvl.levelMultiplier;
  }

  // Running multiplier — last GOLD level revealed so far.
  //   - revealIndex===0 → undefined (no out-of-bounds access).
  //   - on cave-in the last gold value persists (does NOT collapse to 0).
  // NEVER displays totalMultiplier; that lives in the settle banner only.
  const runningMult = useMemo<string | undefined>(() => {
    if (!settled) return undefined;
    const upTo = Math.min(revealIndex, replayLevels.length);
    for (let i = upTo - 1; i >= 0; i--) {
      const lvl = replayLevels[i];
      if (lvl && lvl.kind === "gold" && lvl.levelMultiplier) {
        return lvl.levelMultiplier;
      }
    }
    return undefined;
  }, [settled, revealIndex, replayLevels]);

  // Engine truth tier for banner. settleMult string → numeric.
  const settleMultNum = settleMult ? Number(settleMult) : undefined;
  const showWinBanner = settled && settleWon === true && settleMultNum && settleMultNum >= 1;
  const showCaveBanner = settled && settleCaveIn === true;

  // Visible depth count — selection.targetDepth (1..15).
  const depthCount = Math.max(1, Math.min(MAX_DEPTH, Math.floor(p.selection.targetDepth)));

  // Depth-darken progress — pure CSS opacity, no rAF.
  const darkenProgress = settled && depthCount > 0
    ? Math.min(1, revealIndex / depthCount)
    : 0;

  return (
    <div
      data-testid="casino-stage"
      data-game="deepshaft"
      className="relative grid gap-4 overflow-hidden rounded-2xl border border-amber-700/40 ring-1 ring-stone-300/5 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 p-4"
    >
      {/* Copper double-rim ambient wash + faint vertical grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(180,83,9,0.18), transparent 55%), repeating-linear-gradient(180deg, rgba(120,53,15,0.06) 0px, rgba(120,53,15,0.06) 2px, transparent 2px, transparent 8px)",
        }}
      />
      {/* Depth darken + amber glow intensifies with reveal progress. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: darkenProgress,
          background:
            "radial-gradient(ellipse at center bottom, rgba(252,211,77,0.22), transparent 60%), linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.38) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-amber-300/90">
          <Pickaxe aria-hidden className="size-3.5" />
          Deepshaft · {p.selection.riskTier} · {t("games.deepshaft.depth")} {depthCount}
        </div>
        <FairnessSheet
          gameCode={p.gameCode}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
        />
      </div>

      {/* Running multiplier — levelMultiplier ONLY, never totalMultiplier. */}
      <div
        data-testid="deepshaft-running-mult"
        className="relative flex items-baseline justify-between rounded-lg border border-amber-700/30 bg-stone-950/60 px-3 py-1.5"
      >
        <span className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
          {t("games.deepshaft.depth")} · {Math.min(revealIndex, depthCount)} / {depthCount}
        </span>
        <span
          className={cn(
            "font-mono text-lg font-bold tabular-nums transition-colors duration-200",
            runningMult ? "text-amber-200" : "text-stone-500",
          )}
        >
          {runningMult ? `${runningMult}×` : "—"}
        </span>
      </div>

      {/* Shaft: vertical ladder spine + per-depth cells. PERF: transform/opacity/filter only. */}
      <div className="relative rounded-xl border border-amber-700/35 bg-stone-950/70 p-3 shadow-[inset_0_0_30px_rgba(120,53,15,0.18)]">
        {/* Ladder spine — center vertical rail (decorative). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-3 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-amber-600/30 via-amber-500/15 to-stone-500/10"
        />
        <div className="grid gap-1.5">
          {Array.from({ length: depthCount }).map((_, i) => {
            const state = resolveState(i);
            const mult = resolveMultiplier(i);
            const cap = Math.min(REVEAL_CAP_MS, depthCount * REVEAL_STEP_MS);
            const step = depthCount > 0 ? cap / depthCount : REVEAL_STEP_MS;
            const delaySec = (step * i) / 1000;
            return (
              <ShaftCell
                key={i}
                depth={i + 1}
                state={state}
                levelMultiplier={mult}
                delaySec={delaySec}
                reduced={reduced}
              />
            );
          })}
        </div>

        {/* Settle banner — engine truth only. */}
        {showWinBanner && (
          <div
            data-testid="deepshaft-banner-win"
            className={cn(
              "relative mt-3 flex items-center justify-center gap-2 font-bold tabular-nums",
              "text-xl",
            )}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(252,211,77,0.28), transparent 65%)",
              }}
            />
            <span className="text-xs uppercase tracking-[0.2em] text-amber-200/80">
              {t("games.deepshaft.win")}
            </span>
            <span className="text-amber-200">{settleMult}×</span>
          </div>
        )}
        {showCaveBanner && (
          <div
            data-testid="deepshaft-banner-cavein"
            className="relative mt-3 flex items-center justify-center gap-2 font-bold text-rose-300 tabular-nums"
          >
            <span className="text-xs uppercase tracking-[0.2em]">
              {t("games.deepshaft.cavein")}
            </span>
            <span className="text-rose-200">@ {settleReached}</span>
          </div>
        )}
      </div>

      {/* Scoped keyframes — NO touch to styles.css. */}
      <style>{`
        @keyframes deepshaftReveal {
          0% { transform: translateY(-4px) scale(0.97); opacity: 0; filter: blur(2px); }
          80% { transform: translateY(1px) scale(1.01); opacity: 1; filter: blur(0); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes dsStrike {
          0% { transform: translateY(-3px) scale(1.045); }
          60% { transform: translateY(1px) scale(0.995); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes dsSparkle {
          0% { opacity: 0; }
          25% { opacity: 0.95; }
          100% { opacity: 0; }
        }
        @keyframes dsDust {
          0% { opacity: 0; transform: translateY(-2px) scale(0.6); }
          40% { opacity: 0.9; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(3px) scale(1.15); }
        }
        @keyframes dsShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1.5px); }
          80% { transform: translateX(1.5px); }
        }
      `}</style>
    </div>
  );
}
