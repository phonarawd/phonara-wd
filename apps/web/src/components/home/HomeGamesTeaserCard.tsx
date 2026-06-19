import { Link } from "@/shims/react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";

/**
 * Phase 12-F.2 · Home ??full-width Games teaser ??/games.
 * Sits OUTSIDE the bento grid (Casino bento ??/casino is inside).
 */
export function HomeGamesTeaserCard() {
  return (
    <Card data-hub-id="home-games">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {t("home.section.games.title")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("home.section.games.desc")}
          </p>
        </div>
        <Link
          to="/games"
          className="shrink-0 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-(--color-surface-elev)"
        >
          {t("home.section.games.cta")}
        </Link>
      </CardContent>
    </Card>
  );
}
