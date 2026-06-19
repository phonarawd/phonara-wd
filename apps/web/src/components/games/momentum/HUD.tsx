/** Momentum · HUD. */
import { BetHistoryStrip } from "@/games/shared/BetHistoryStrip";
import type { MomentumSurfaceProps } from "./types";

type Props = Pick<MomentumSurfaceProps, "recentBets">;

export function HUD(p: Props) {
  return (
    <div data-testid="casino-hud">
      <BetHistoryStrip bets={p.recentBets} />
    </div>
  );
}
