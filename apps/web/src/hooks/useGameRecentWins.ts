import { useMemo } from "react";
import { LIVE_WIN_FEED, type LiveWin } from "@/data/casino-feed";
import { useLiveTickerFeed } from "./useLiveTickerFeed";

/**
 * P1.3 — Filtered live-win feed for a single game.
 *
 * Wraps `useLiveTickerFeed` with a stable, game-scoped pool derived from
 * LIVE_WIN_FEED. If the game has fewer than `visibleCount` entries in the
 * seed feed, fills the tail with deterministic synthetic wins so the panel
 * never collapses below `visibleCount`. SSR safe.
 */
export function useGameRecentWins(
  feedName: string,
  visibleCount = 8,
  intervalMs = 5500,
) {
  const pool = useMemo<readonly LiveWin[]>(() => {
    const matched = LIVE_WIN_FEED.filter((w) => w.game === feedName);
    if (matched.length >= visibleCount) return matched;

    // Pad deterministically by recycling other-game wins re-tagged to this game.
    const padded: LiveWin[] = [...matched];
    let i = 0;
    while (padded.length < Math.max(visibleCount + 2, 10)) {
      const donor = LIVE_WIN_FEED[(i * 7) % LIVE_WIN_FEED.length];
      if (!donor) break;
      padded.push({
        game: feedName,
        user: donor.user,
        currency: donor.currency,
        amount: donor.amount,
      });
      i++;
    }
    return padded;
  }, [feedName, visibleCount]);

  return useLiveTickerFeed(pool, visibleCount, intervalMs);
}
