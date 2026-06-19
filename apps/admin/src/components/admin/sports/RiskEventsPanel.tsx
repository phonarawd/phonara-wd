import { Badge } from "@/components/ui/badge";
import { useAdminSports, type RiskSeverity } from "@/hooks/admin/useAdminSports";
import { relativeTime } from "@/lib/admin-time";
import { t } from "@/i18n";

// L1-15-A A-5 — risk events list + tier banner (display-only).

const SEV_VARIANT: Record<RiskSeverity, "default" | "secondary" | "destructive"> =
  {
    info: "secondary",
    warn: "default",
    crit: "destructive",
  };

export function RiskEventsPanel() {
  const { risk, tier } = useAdminSports();

  return (
    <section
      aria-label={t("admin.sports.risk.title")}
      className="grid gap-3"
    >
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("admin.sports.risk.tierBanner")}
          </div>
          <Badge
            variant={
              tier === "A" ? "default" : tier === "B" ? "secondary" : "destructive"
            }
            className="font-mono"
          >
            {t(`admin.sports.risk.tier.${tier}`)}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("admin.sports.risk.tierDesc")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-4 py-2">
          <h3 className="text-sm font-semibold">
            {t("admin.sports.risk.eventsTitle")}
          </h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("admin.sports.risk.eventsSubtitle")}
          </span>
        </header>
        {risk.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("admin.sports.risk.empty")}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {risk.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={SEV_VARIANT[r.severity]} className="uppercase">
                    {t(`admin.sports.risk.severity.${r.severity}`)}
                  </Badge>
                  <span className="text-sm">{t(r.labelKey)}</span>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {relativeTime(r.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
