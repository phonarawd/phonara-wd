/**
 * GameBackLink ??shared "Back to games" link used by every game surface.
 *
 * Phase 4 v1.3 §0-0b. Solves the "trapped on game route" UX (no nav
 * affordance on `/casino/*` deep links or mobile pasted URLs).
 *
 * Lovable preview: mounted in all 10 `src/routes/casino.*.tsx` files
 * (mirror, since each preview route is its own page).
 *
 * PHONARA paste: this file lives under `components/games/shared/` and
 * is mounted ONCE in `apps/web/src/routes/casino.tsx`
 * (`CasinoPage` / `CasinoLovableSurface` shell). Do not mirror it into
 * the 10 preview routes there ??the shell wraps all games.
 *
 * testid `casino-game-back` is outside the 9-money testid set and is
 * intentionally excluded from `red:grep`.
 */
import { Link } from "@/shims/react-router-dom";
import { ArrowLeft } from "lucide-react";
import { t } from "@/i18n";

export function GameBackLink() {
  const label = t("casino.back_to_games");
  return (
    <Link
      to="/casino"
      data-testid="casino-game-back"
      aria-label={label}
      className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
