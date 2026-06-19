import { Link } from "@/shims/react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";

export function TradeReferralTeaserCard() {
  return (
    <Card data-hub-id="trade-referral">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("trade.section.referral.title")}</p>
          <p className="text-xs text-muted-foreground">{t("trade.section.referral.desc")}</p>
        </div>
        <Link
          to="/referral"
          className="shrink-0 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-(--color-surface-elev)"
        >
          {t("trade.section.referral.cta")}
        </Link>
      </CardContent>
    </Card>
  );
}
