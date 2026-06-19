import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";

// Wave 6.5 — Casino→Trade bridge (1 slice, static).
// Mirrors TradeGamesTeaserCard shape (Trade→Casino direction).
// Presentation-only. No state, no engine, no router context tricks.
export function CasinoToTradeTeaserCard() {
  return (
    <Card data-hub-id="casino-trade">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("casino.section.trade.title")}</p>
          <p className="text-xs text-muted-foreground">{t("casino.section.trade.desc")}</p>
        </div>
        <Link
          to="/trade"
          className="shrink-0 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-(--color-surface-elev)"
        >
          {t("casino.section.trade.cta")}
        </Link>
      </CardContent>
    </Card>
  );
}
