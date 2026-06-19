/**
 * Plinko · HUD — presence marquee + recent bets strip.
 */
import { BetHistoryStrip } from "../shared/BetHistoryStrip";
import { PresenceMarquee, useMockGhost } from "../shared/presence";
import type { ImportedGameSurfaceProps } from "../shared/types";

type Props = Pick<ImportedGameSurfaceProps<"plinko">, "recentBets">;

export function HUD(p: Props) {
  const ghosts = useMockGhost(5, 3500);
  return (
    <div className="grid gap-2">
      <PresenceMarquee ghosts={ghosts} />
      <BetHistoryStrip bets={p.recentBets} />
    </div>
  );
}
