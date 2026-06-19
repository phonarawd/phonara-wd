import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";
import { useEffect, useState } from "react";

/**
 * Phase 12-F · Home FOMO v0.1 — LimitedDropCard
 * Countdown + concurrent participants badge for limited drops. Mock-only.
 */
function formatHMS(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function LimitedDropCard() {
  const [remaining, setRemaining] = useState(2 * 3600 + 47 * 60 + 12);
  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card
      data-hub-id="home-limited-drop"
      className="border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-transparent"
    >
      <CardContent className="grid gap-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("home.fomo.drop.title")}</h3>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-500">
            {t("home.fomo.drop.badge")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t("home.fomo.drop.desc")}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-mono text-lg font-bold tabular-nums text-amber-500">
            {formatHMS(remaining)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t("home.fomo.drop.participants")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
