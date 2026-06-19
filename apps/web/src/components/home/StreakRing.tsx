import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";

/**
 * Phase 12-F · Home FOMO v0.1 — StreakRing
 * Daily check-in streak ring + reward preview.
 * 12-F.2: `compact` prop for HomeHeroBar sticky usage (no label, just ring).
 */
export function StreakRing({ compact = false }: { compact?: boolean } = {}) {
  const current = 5;
  const total = 7;

  if (compact) {
    const circ = 2 * Math.PI * 18;
    const dash = (current / total) * circ;
    return (
      <div
        data-hub-id="home-streak-ring"
        className="relative h-12 w-12 shrink-0"
        title={t("home.hero.streakLabel")}
      >
        <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
          <circle cx="24" cy="24" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r="18"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[11px] font-bold tabular-nums">
            {current}/{total}
          </span>
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 36;
  const dash = (current / total) * circumference;
  return (
    <Card data-hub-id="home-streak-ring">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-base font-bold tabular-nums">
              {current}/{total}
            </span>
          </div>
        </div>
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold">{t("home.fomo.streak.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("home.fomo.streak.desc")}</p>
          <p className="text-[11px] font-medium text-primary">{t("home.fomo.streak.reward")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
