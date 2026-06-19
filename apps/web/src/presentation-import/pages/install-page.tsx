import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Smartphone, Zap, WifiOff, BellRing } from "lucide-react";
import { t } from "@/i18n";

export function ImportedPWAInstallPage() {
  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-3xl gap-5 p-4 md:p-6">
        <header className="grid gap-1">
          <h1 className="text-2xl font-medium">{t("pwa.install.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("pwa.install.subtitle")}</p>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Apple className="size-5 text-(--color-primary)" aria-hidden />
              <CardTitle className="text-base">{t("pwa.install.ios.title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Step n={1} text={t("pwa.install.ios.step1")} />
              <Step n={2} text={t("pwa.install.ios.step2")} />
              <Step n={3} text={t("pwa.install.ios.step3")} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Smartphone className="size-5 text-(--color-primary)" aria-hidden />
              <CardTitle className="text-base">{t("pwa.install.android.title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Step n={1} text={t("pwa.install.android.step1")} />
              <Step n={2} text={t("pwa.install.android.step2")} />
              <Step n={3} text={t("pwa.install.android.step3")} />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("pwa.install.benefits.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <Benefit icon={<Zap className="size-4" />} text={t("pwa.install.benefits.fast")} />
            <Benefit icon={<WifiOff className="size-4" />} text={t("pwa.install.benefits.offline")} />
            <Benefit icon={<BellRing className="size-4" />} text={t("pwa.install.benefits.push")} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-(--color-surface-elev) text-xs font-semibold tabular-nums">
        {n}
      </span>
      <span>{text}</span>
    </div>
  );
}

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-(--color-surface)/50 px-3 py-2">
      <span className="text-(--color-primary)" aria-hidden>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
