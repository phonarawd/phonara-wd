/** Mint Reels · HUD — BetHistoryStrip 얇은 래퍼. */
import { BetHistoryStrip } from "../shared/BetHistoryStrip";
import type { ImportedGameSurfaceProps } from "../shared/types";

type Props = Pick<ImportedGameSurfaceProps<"mint_reels">, "recentBets">;

export function HUD(p: Props) {
  return (
    <div data-testid="casino-hud">
      <BetHistoryStrip bets={p.recentBets} />
    </div>
  );
}
