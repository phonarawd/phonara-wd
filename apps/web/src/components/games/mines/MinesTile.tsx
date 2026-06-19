/**
 * Mines · MinesTile — pure presentation, outcome-leak SAFE.
 *
 * §0a invariant: this component receives ONLY a resolved `state` string,
 * NEVER the engine's `minePositions[]` array. Stage owns the closure that
 * reads `minePositions` and resolves per-tile state — untouched tiles
 * receive `state: "hidden"` regardless of whether they hide a mine, so
 * the mine layout cannot leak via DOM, attributes, classes, or React
 * fiber `memoizedProps`.
 *
 * Motion: CSS transform + opacity only. 3D flip ≤180ms via tokens; bust
 * shake ≤200ms; sparkle one-shot ≤300ms. Strips under `prefers-reduced-
 * motion: reduce` while keeping reveal state and final result visible.
 */
import { memo } from "react";
import { Bomb, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

export type MinesTileState =
  | "hidden"
  | "picked"
  | "revealed-gem"
  | "bust";

export interface MinesTileProps {
  index: number;
  state: MinesTileState;
  disabled: boolean;
  reduced: boolean;
  onToggle: (i: number) => void;
}

function MinesTileImpl({
  index,
  state,
  disabled,
  reduced,
  onToggle,
}: MinesTileProps) {
  const isFace =
    state === "revealed-gem" || state === "bust" || state === "picked";

  return (
    <button
      type="button"
      onClick={() => onToggle(index)}
      disabled={disabled}
      aria-label={`tile ${index + 1}`}
      data-tile-state={state}
      className={cn(
        // Outer cell — sized container, GPU-friendly transforms only.
        "relative aspect-square select-none rounded-md outline-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
        !reduced &&
          state === "hidden" &&
          "transition-transform duration-100 active:scale-[0.96]",
        !reduced && state === "bust" && "animate-tile-shake",
        "[perspective:600px]",
      )}
      style={{ contain: "layout paint" }}
    >
      <div
        className={cn(
          "relative h-full w-full rounded-md",
          "[transform-style:preserve-3d]",
          !reduced && "transition-transform duration-150 ease-out",
          isFace && !reduced && "[transform:rotateY(180deg)]",
        )}
      >
        {/* Back (hidden) face */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-md border [backface-visibility:hidden]",
            state === "hidden"
              ? "border-border bg-(--color-surface-elev) hover:border-(--color-primary)/40"
              : "border-border bg-(--color-surface-elev) opacity-70",
          )}
        />
        {/* Front (revealed) face */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 grid place-items-center rounded-md border [backface-visibility:hidden]",
            // Reduced motion fallback: skip the rotateY trick and just
            // show/hide the front face via opacity so the reveal still
            // happens functionally.
            reduced
              ? isFace
                ? "opacity-100"
                : "opacity-0"
              : "[transform:rotateY(180deg)]",
            state === "bust"
              ? "border-(--color-down) bg-(--color-down)/20"
              : state === "revealed-gem"
                ? "border-(--color-up) bg-(--color-up)/20"
                : "border-(--color-primary) bg-(--color-primary)/15 text-(--color-primary)",
          )}
        >
          {state === "bust" ? (
            <Bomb className="size-5 text-(--color-down)" />
          ) : state === "revealed-gem" || state === "picked" ? (
            <Gem className="size-5" />
          ) : null}
          {/* Win sparkle — opacity-only, one-shot. */}
          {state === "revealed-gem" && !reduced && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-md bg-(--color-up)/30 animate-tile-sparkle"
            />
          )}
        </div>
      </div>
    </button>
  );
}

export const MinesTile = memo(MinesTileImpl);
