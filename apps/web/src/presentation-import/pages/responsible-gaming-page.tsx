import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Shield } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useT } from "@/lib/i18n";
import type { RgPageViewProps } from "../../features/responsible-gaming/use-rg-page-controller";

type ImportedResponsibleGamingPageProps = {
  rg?: RgPageViewProps;
};

export function ImportedResponsibleGamingPage({ rg }: ImportedResponsibleGamingPageProps = {}) {
  const t = useT();

  return (
    <AppShell bare>
      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16" data-testid="responsible-gaming-page">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> {t("legal.common.back")}
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-(--color-warn)/15 text-(--color-warn)">
            <AlertTriangle className="size-5" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("rg.title")}</h1>
        </div>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">{t("rg.description")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("rg.hero.note")}</p>

        <div className="mt-10 grid gap-4">
          <RiskCard title={t("legal.risk.card.trade.title")} body={t("legal.risk.card.trade.body")} />
          <RiskCard title={t("legal.risk.card.game.title")} body={t("legal.risk.card.game.body")} />
          <RiskCard title={t("legal.risk.card.tech.title")} body={t("legal.risk.card.tech.body")} />
        </div>

        {rg ? (
          <>
            <Card className="mt-10">
              <CardHeader>
                <CardTitle className="text-lg">{t("rg.limits.title")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm text-muted-foreground">{t("rg.limits.help")}</p>
                <div className="grid gap-2">
                  <Label htmlFor="rg-deposit-limit-input">{t("rg.limits.depositKrw")}</Label>
                  <Input
                    id="rg-deposit-limit-input"
                    inputMode="decimal"
                    value={rg.depositLimit}
                    onChange={(e) => rg.onDepositLimitChange(e.target.value)}
                    data-testid="rg-deposit-limit-input"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rg-loss-limit-input">{t("rg.limits.lossGameUsdt")}</Label>
                  <Input
                    id="rg-loss-limit-input"
                    inputMode="decimal"
                    value={rg.lossLimit}
                    onChange={(e) => rg.onLossLimitChange(e.target.value)}
                    data-testid="rg-loss-limit-input"
                  />
                </div>
                <Button
                  disabled={rg.busy}
                  data-testid="rg-save-limits"
                  onClick={rg.onSaveLimits}
                >
                  {t("rg.limits.save")}
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4 border-(--color-down)/30">
              <CardHeader>
                <CardTitle className="text-lg">{t("rg.selfExclusion.title")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm text-muted-foreground">{t("rg.selfExclusion.description")}</p>
                <p className="text-sm font-medium text-(--color-down)">{t("rg.selfExclusion.warning")}</p>
                <div className="grid gap-2">
                  <Label htmlFor="rg-exclusion-days-input">{t("rg.selfExclusion.daysLabel")}</Label>
                  <Input
                    id="rg-exclusion-days-input"
                    type="number"
                    min={1}
                    value={rg.exclusionDays}
                    onChange={(e) => rg.onExclusionDaysChange(e.target.value)}
                    data-testid="rg-exclusion-days-input"
                  />
                </div>
                <Button
                  variant="destructive"
                  disabled={rg.busy}
                  data-testid="rg-self-exclusion-start"
                  onClick={rg.onSelfExclusionStart}
                >
                  {t("rg.selfExclusion.start")}
                </Button>
              </CardContent>
            </Card>

            <AlertDialog open={rg.confirmOpen} onOpenChange={(open) => !open && rg.onCancelSelfExclusion()}>
              <AlertDialogContent data-testid="rg-self-exclusion-confirm">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("rg.selfExclusion.confirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("rg.selfExclusion.confirmDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="rg-self-exclusion-confirm-cancel" onClick={rg.onCancelSelfExclusion}>
                    {t("common.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-testid="rg-self-exclusion-confirm-confirm"
                    disabled={rg.busy}
                    onClick={rg.onConfirmSelfExclusion}
                  >
                    {t("rg.selfExclusion.confirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <div className="mt-10 rounded-2xl border border-(--color-primary)/30 bg-(--color-primary)/5 p-6">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-(--color-primary)" />
              <h2 className="text-lg font-semibold">{t("legal.risk.rg.title")}</h2>
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>{t("legal.risk.rg.item.limit")}</li>
              <li>{t("legal.risk.rg.item.exclude")}</li>
              <li>{t("legal.risk.rg.item.cooldown")}</li>
              <li>{t("legal.risk.rg.item.support")}</li>
            </ul>
          </div>
        )}
      </article>
      <SiteFooter />
    </AppShell>
  );
}

function RiskCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-(--color-surface) p-5">
      <div className="text-base font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
