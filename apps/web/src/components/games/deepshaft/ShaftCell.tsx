/**
 * Deepshaft · ShaftCell — per-floor view.
 *
 * LAW 4 FULL quarantine: this component receives ONLY a resolved
 * `state` string ("hidden" | "revealed-gold" | "revealed-cavein") plus
 * the integer depth label and an optional levelMultiplier display
 * string (revealed-gold only). The full `levels[]` array never crosses
 * this prop boundary. Hidden cells render a neutral stone tile — no
 * "gold" or "cavein" token appears in DOM, className, data-*, or
 * props.
 *
 * G#10 motion: pickaxe-strike on any reveal, gold sparkle overlay
 * gated to revealed-gold, dust burst + short shake gated to
 * revealed-cavein. Keyframes (`dsStrike`/`dsSparkle`/`dsDust`/`dsShake`)
 * live in Stage's scoped <style> block — NO touch to styles.css.
 * Reduced motion strips strike/sparkle/dust/shake; final state + text
 * + numbers survive.
 */
import { cn } from "@/lib/utils";
import { Sparkles, Mountain } from "lucide-react";

export type ShaftCellState =
  | "hidden"
  | "revealed-gold"
  | "revealed-cavein";

interface Props {
  depth: number;
  state: ShaftCellState;
  /** Display only when state === "revealed-gold". */
  levelMultiplier?: string;
  /** Animation delay (seconds). Caller passes 0 when reduced motion. */
  delaySec: number;
  /** Reduced motion — render at final state, opacity 1. */
  reduced: boolean;
}

export function ShaftCell({
  depth,
  state,
  levelMultiplier,
  delaySec,
  reduced,
}: Props) {
  // Resolve a single visual tone per state. Hidden = neutral stone.
  const tone =
    state === "revealed-gold"
      ? "border-amber-400/60 bg-gradient-to-br from-amber-800/55 to-stone-900/70 shadow-[0_0_18px_rgba(252,211,77,0.35)]"
      : state === "revealed-cavein"
        ? "border-rose-500/55 bg-gradient-to-br from-rose-950/70 to-stone-900/80"
        : "border-stone-600/40 bg-gradient-to-br from-stone-800/70 to-stone-950/70";

  // Compose entry + strike (+ shake on cavein). Reduced motion → undefined.
  // Sparkle and dust overlays are rendered conditionally below — they are
  // outcome-gated by the resolved `state` literal, so hidden cells never
  // receive them.
  const animation = reduced
    ? undefined
    : state === "hidden"
      ? undefined
      : state === "revealed-cavein"
        ? `deepshaftReveal 360ms ease-out ${delaySec}s both, dsStrike 180ms ease-out ${delaySec}s both, dsShake 200ms ease-out ${delaySec + 0.18}s both`
        : `deepshaftReveal 360ms ease-out ${delaySec}s both, dsStrike 180ms ease-out ${delaySec}s both`;

  return (
    <div
      data-testid="deepshaft-cell"
      data-state={state}
      data-depth={depth}
      className={cn(
        "relative grid grid-cols-[28px_1fr_auto] items-center gap-2 overflow-hidden rounded-md border px-2 py-2",
        "transition-[box-shadow,border-color] duration-200",
        tone,
      )}
      style={{
        opacity: reduced ? 1 : state === "hidden" ? 0.92 : 1,
        animation,
      }}
    >
      {/* Gold sparkle — opacity-only flash. Gated to revealed-gold. */}
      {state === "revealed-gold" && !reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(252,211,77,0.55), transparent 55%)",
            animation: `dsSparkle 260ms ease-out ${delaySec + 0.05}s both`,
          }}
        />
      )}
      {/* Dust + rubble burst — gated to revealed-cavein. Freezes (forwards). */}
      {state === "revealed-cavein" && !reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(190,140,110,0.45), transparent 60%)",
            animation: `dsDust 200ms ease-out ${delaySec + 0.04}s both`,
          }}
        />
      )}
      <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 tabular-nums">
        {String(depth).padStart(2, "0")}
      </span>
      <span className="text-[11px] uppercase tracking-[0.18em] text-stone-300">
        {state === "revealed-gold" ? (
          <span className="inline-flex items-center gap-1 text-amber-200">
            <Sparkles aria-hidden className="size-3" />
            ore
          </span>
        ) : state === "revealed-cavein" ? (
          <span className="inline-flex items-center gap-1 text-rose-300">
            <Mountain aria-hidden className="size-3" />
            collapse
          </span>
        ) : (
          <span className="text-stone-500">stone</span>
        )}
      </span>
      <span className="font-mono text-xs tabular-nums text-amber-200">
        {state === "revealed-gold" && levelMultiplier
          ? `${levelMultiplier}×`
          : "\u00A0"}
      </span>
    </div>
  );
}
