/** Deepshaft · HUD. */
import { BetHistoryStrip } from "../shared/BetHistoryStrip";
import type { ImportedGameSurfaceProps } from "../shared/types";

type Props = Pick<ImportedGameSurfaceProps<"deepshaft">, "recentBets">;

export function HUD(p: Props) {
  return (
    <div data-testid="casino-hud">
      <BetHistoryStrip bets={p.recentBets} />
    </div>
  );
}
