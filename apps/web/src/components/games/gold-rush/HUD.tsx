/** Gold Rush · HUD. */
import { BetHistoryStrip } from "../shared/BetHistoryStrip";
import type { ImportedGameSurfaceProps } from "../shared/types";

type Props = Pick<ImportedGameSurfaceProps<"gold_rush">, "recentBets">;

export function HUD(p: Props) {
  return (
    <div data-testid="casino-hud">
      <BetHistoryStrip bets={p.recentBets} />
    </div>
  );
}
