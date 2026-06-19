import { Link, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { fmtPoint } from "@/lib/format";
import { t } from "@/i18n";
import type { EarnLayoutViewProps } from "../../features/earn/use-earn-page-controller";

const STATIC_DEFAULTS = {
  todayPointsDisplay: fmtPoint(1500),
  totalPointsDisplay: fmtPoint(12_400),
};

export type ImportedEarnPageProps = Partial<EarnLayoutViewProps>;

export function ImportedEarnPage(props: ImportedEarnPageProps = {}) {
  const todayPointsDisplay = props.todayPointsDisplay ?? STATIC_DEFAULTS.todayPointsDisplay;
  const totalPointsDisplay = props.totalPointsDisplay ?? STATIC_DEFAULTS.totalPointsDisplay;

  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-2xl gap-4 p-4 md:p-6">
        <header>
          <div className="text-sm text-muted-foreground">{t("earn.subtitle")}</div>
          <h1 className="text-2xl font-medium">{t("earn.title")}</h1>
        </header>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="text-xs text-muted-foreground">
                {t("earn.points.today")}
              </div>
              <div className="text-2xl font-medium tabular-nums text-(--color-primary)">
                {todayPointsDisplay}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {t("earn.points.total")}
              </div>
              <div className="text-2xl font-medium tabular-nums">
                {totalPointsDisplay}
              </div>
            </div>
          </CardContent>
        </Card>

        <nav className="sticky top-14 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6">
          <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-card p-1">
            <Link
              to="/earn"
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "rounded px-3 py-2 text-center text-sm font-medium bg-(--color-surface-elev) text-foreground",
              }}
              inactiveProps={{
                className:
                  "rounded px-3 py-2 text-center text-sm font-medium text-muted-foreground hover:text-foreground",
              }}
            >
              {t("earn.tab.home")}
            </Link>
            <Link
              to="/earn/missions"
              activeProps={{
                className:
                  "rounded px-3 py-2 text-center text-sm font-medium bg-(--color-surface-elev) text-foreground",
              }}
              inactiveProps={{
                className:
                  "rounded px-3 py-2 text-center text-sm font-medium text-muted-foreground hover:text-foreground",
              }}
            >
              {t("earn.tab.missions")}
            </Link>
          </div>
        </nav>

        <Outlet />
      </div>
    </AppShell>
  );
}
