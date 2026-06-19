import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n";

export type ImportedPartnerPageProps = {
  gated?: boolean;
  partnerLink?: string;
  commissionTotal?: string;
  commissionPending?: string;
  commissionPaid?: string;
  commissionRate?: string;
  commissionMtd?: string;
  downlineCount?: string;
  downlineLevel?: string;
  onCopyLink?: () => void;
};

export function ImportedPartnerPage({
  gated = true,
  partnerLink = "",
  commissionTotal = "—",
  commissionPending = "—",
  commissionPaid = "—",
  commissionRate = "—",
  commissionMtd = "—",
  downlineCount = "0",
  downlineLevel = "1",
  onCopyLink,
}: ImportedPartnerPageProps) {
  if (gated) {
    return (
      <AppShell density="app">
        <div className="mx-auto grid max-w-lg gap-4 p-4 py-16 text-center md:p-6">
          <h1 className="text-2xl font-medium">{t("referral.partner.gate.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("referral.partner.gate.message")}</p>
          <Button asChild className="mx-auto w-full max-w-xs">
            <Link to="/account">{t("referral.partner.gate.cta")}</Link>
          </Button>
          <p className="text-xs text-muted-foreground">{t("referral.partner.noindex.note")}</p>
        </div>
      </AppShell>
    );
  }

  const handleCopy = () => {
    if (onCopyLink) {
      onCopyLink();
      return;
    }
    if (partnerLink) {
      void navigator.clipboard?.writeText(partnerLink).then(
        () => toast.success(t("referral.partner.share.copy")),
        () => toast.error(t("common.error.generic")),
      );
    }
  };

  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-4xl gap-4 p-4 md:p-6">
        <header className="grid gap-2">
          <Badge variant="outline" className="w-fit">
            {t("referral.partner.hero.badge")}
          </Badge>
          <h1 className="text-2xl font-medium">{t("referral.partner.hero.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("referral.partner.hero.subtitle")}</p>
          <p className="text-xs text-muted-foreground">{t("referral.partner.noindex.note")}</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4 text-(--color-primary)" aria-hidden />
              {t("referral.partner.commission.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label={t("referral.partner.commission.total")} value={commissionTotal} />
            <Stat label={t("referral.partner.commission.pending")} value={commissionPending} />
            <Stat label={t("referral.partner.commission.paid")} value={commissionPaid} />
            <Stat label={t("referral.partner.commission.rate")} value={commissionRate} />
            <Stat label={t("referral.partner.commission.mtd")} value={commissionMtd} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-(--color-primary)" aria-hidden />
              {t("referral.partner.downline.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("referral.partner.downline.level")}</span>
              <span className="font-medium tabular-nums">{downlineLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("referral.partner.downline.count")}</span>
              <span className="font-medium tabular-nums">{downlineCount}</span>
            </div>
            {downlineCount === "0" && (
              <p className="text-muted-foreground">{t("referral.partner.downline.empty")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("referral.partner.share.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-xs text-muted-foreground">{t("referral.partner.share.link.label")}</div>
            <div className="flex gap-2">
              <code className="flex-1 truncate rounded-md border border-border bg-(--color-surface) px-3 py-2 text-xs tabular-nums">
                {partnerLink || "—"}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopy} aria-label={t("referral.partner.share.copy")}>
                <Copy className="size-4" />
              </Button>
            </div>
            <Button variant="secondary" size="sm" className="w-fit" onClick={handleCopy}>
              {t("referral.partner.share.button")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-(--color-surface)/50 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-medium tabular-nums">{value}</div>
    </div>
  );
}
