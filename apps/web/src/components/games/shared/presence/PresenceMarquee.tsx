/**
 * PresenceMarquee — auto-scrolling LIVE chip strip.
 *
 * Replaces the older `overflow-x-auto` ghost row across game HUDs
 * (mines/crash/plinko/dice/limbo/blackjack/roulette). Content is
 * duplicated once and animated `translateX(-50%)` so the loop is
 * seamless. Hover/focus pauses the animation; reduced-motion users
 * see a static strip via the global media query in `styles.css`.
 *
 * `data-testid="casino-presence-ghost"` is preserved for parity with
 * existing optional/non-money E2E selectors.
 */
import type { GhostPlayer } from "./useMockGhost";

export interface PresenceMarqueeProps {
  ghosts: GhostPlayer[];
  /** Render a small pulsing dot before the LIVE label (Crash style). */
  withDot?: boolean;
  /** Optional data-game-id passthrough for per-game E2E hooks. */
  dataGameId?: string;
}

function Track({ ghosts, withDot, ariaHidden }: {
  ghosts: GhostPlayer[];
  withDot?: boolean;
  ariaHidden?: boolean;
}) {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-2 pr-2"
    >
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {withDot ? (
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-skin-danger" />
        ) : null}
        LIVE
      </span>
      {ghosts.map((g) => (
        <span
          key={g.id}
          className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono tabular-nums ${
            g.win
              ? "bg-(--color-up)/15 text-(--color-up)"
              : "bg-(--color-down)/15 text-(--color-down)"
          }`}
        >
          {g.alias} {g.multiplier}×
        </span>
      ))}
    </div>
  );
}

export function PresenceMarquee({ ghosts, withDot, dataGameId }: PresenceMarqueeProps) {
  return (
    <div
      data-testid="casino-presence-ghost"
      data-game-id={dataGameId}
      className="group overflow-hidden rounded-xl border border-border bg-(--color-surface)/40 px-3 py-1.5 text-[11px] [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
    >
      <div className="flex w-max items-center gap-2 animate-presence-marquee group-hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
        <Track ghosts={ghosts} withDot={withDot} />
        <Track ghosts={ghosts} withDot={withDot} ariaHidden />
      </div>
    </div>
  );
}
