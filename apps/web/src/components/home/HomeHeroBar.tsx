import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";
import { StreakRing } from "./StreakRing";
import { OnlineCountBadge } from "@/components/fomo/OnlineCountBadge";

/**
 * Phase 12-F.2 - Home Bento - sticky compact hero.
 * Balance / today earned / Streak 5/7 in one row. Mobile-first.
 * §Y: OnlineCountBadge inline (data-testid="fomo-online").
 */
export function HomeHeroBar() {
  return (
    <Card
      data-hub-id="home-welcome"
      className="sticky top-2 z-10 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-[var(--shadow-soft)]"
    >
      <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-4">
        <div className="min-w-0 grid gap-1">
          <div className="flex items-baseline gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("home.hero.balance")}
              </p>
              <p className="truncate font-mono text-xl font-bold tabular-nums">
                ₩1,284,500
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("home.hero.todayEarned")}
              </p>
              <p className="truncate font-mono text-sm font-semibold tabular-nums text-primary">
                +12,400P
              </p>
            </div>
          </div>
          <OnlineCountBadge count={3214} className="mt-0.5 w-fit" />
        </div>
        <StreakRing compact />
      </CardContent>
    </Card>
  );
}

