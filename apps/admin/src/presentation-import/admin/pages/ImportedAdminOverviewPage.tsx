import { Link } from "@tanstack/react-router";
import { AdminMetricCard } from "@/components/admin/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  findHealthCheck,
  useAdminOverview,
  type HealthStatus,
  type OpsHealthCheck,
} from "@/hooks/admin/useAdminOverview";
import { getOpsHealthCheckDesc, getOpsHealthCheckLabel } from "@/lib/ops-health-present";
import { t } from "@/i18n";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusVariant(status: HealthStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "critical") return "destructive";
  if (status === "warning") return "secondary";
  return "default";
}

function statusLabel(status: HealthStatus): string {
  if (status === "critical") return t("admin.overview.status.critical");
  if (status === "warning") return t("admin.overview.status.warning");
  return t("admin.overview.status.ok");
}

function worstStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  return "ok";
}

function HealthCard(props: {
  title: string;
  check: OpsHealthCheck | undefined;
  testId: string;
  className?: string;
}) {
  const status = props.check?.status ?? "warning";
  return (
    <Card className={`p-4 ${props.className ?? ""}`} data-testid={props.testId}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{props.title}</h3>
        <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {props.check ? getOpsHealthCheckDesc(props.check.id) : null}
      </p>
      <p className="mt-2 text-xs text-muted-foreground/80">
        {props.check?.summary ?? t("admin.overview.noObservedAt")}
      </p>
      {props.check?.observedAt ? (
        <p className="mt-2 text-xs tabular-nums text-muted-foreground">
          {t("admin.overview.observedAt")}: {formatDateTime(props.check.observedAt)}
        </p>
      ) : null}
    </Card>
  );
}

function CombinedHealthCard(props: {
  title: string;
  checks: Array<OpsHealthCheck | undefined>;
  testId: string;
}) {
  const status = worstStatus(props.checks.map((c) => c?.status ?? "warning"));
  return (
    <Card className="p-4" data-testid={props.testId}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{props.title}</h3>
        <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
      </div>
      <div className="mt-3 grid gap-3">
        {props.checks.map((check, index) => (
          <div
            key={check?.id ?? `missing-${index}`}
            className="rounded-lg border border-border bg-muted/20 p-3"
          >
            {check ? (
              <>
                <p className="text-sm font-medium">{getOpsHealthCheckLabel(check.id)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {getOpsHealthCheckDesc(check.id)}
                </p>
                {check.summary ? (
                  <p className="mt-1.5 text-[11px] text-muted-foreground/75">{check.summary}</p>
                ) : null}
              </>
            ) : (
              <p className="text-xs font-medium text-muted-foreground">
                {t("admin.overview.noObservedAt")}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ImportedAdminOverviewPage() {
  const {
    health,
    isLoading,
    isFetching,
    error,
    unresolvedAlerts,
    fallbackConfig,
    refreshAll,
  } = useAdminOverview();

  const checks = health?.checks ?? [];
  const okCount = checks.filter((c) => c.status === "ok").length;
  const warnCount = checks.filter((c) => c.status === "warning").length;
  const critCount = checks.filter((c) => c.status === "critical").length;

  return (
    <div data-testid="overview-page">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium">{t("admin.overview.title")}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {health?.lastUpdatedAt
                ? `${t("admin.overview.lastUpdated")}: ${formatDateTime(health.lastUpdatedAt)}`
                : t("admin.overview.subtitle")}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void refreshAll()}
            disabled={isFetching}
            data-testid="ops-health-refresh"
          >
            {t("admin.overview.refresh")}
          </Button>
        </header>

        {!isLoading && !error ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <AdminMetricCard
              label={t("admin.overview.status.ok")}
              value={String(okCount)}
              tone="primary"
            />
            <AdminMetricCard
              label={t("admin.overview.status.warning")}
              value={String(warnCount)}
            />
            <AdminMetricCard
              label={t("admin.overview.status.critical")}
              value={String(critCount)}
              tone="default"
            />
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground" aria-busy="true">
            …
          </p>
        ) : null}

        {!isLoading && error ? (
          <Card className="p-4" data-testid="ops-health-error">
            <p className="text-sm font-medium">{t("admin.overview.healthUnavailable.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("admin.overview.healthUnavailable.description")}
            </p>
            <div className="mt-3 text-xs text-muted-foreground" data-testid="ops-health-fallback">
              <p>
                {t("admin.overview.fallback.systemHalt", {
                  value: fallbackConfig?.["system_halt"] ?? "unknown",
                })}
              </p>
              <p>
                {t("admin.overview.fallback.systemReadonly", {
                  value: fallbackConfig?.["system_readonly"] ?? "unknown",
                })}
              </p>
            </div>
          </Card>
        ) : null}

        {!isLoading && !error && unresolvedAlerts > 0 ? (
          <Card
            className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            data-testid="ops-alerts-cta"
          >
            <div>
              <p className="text-sm font-medium">{t("admin.overview.alertsBanner.title")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("admin.overview.alertsBanner.description", { count: unresolvedAlerts })}
              </p>
            </div>
            <Link to="/alerts" data-testid="ops-alerts-cta-link">
              <Button size="sm">{t("admin.overview.alertsBanner.cta")}</Button>
            </Link>
          </Card>
        ) : null}

        {!isLoading && !error ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.overview.section.health")}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <HealthCard
                title={t("admin.overview.card.systemMode")}
                check={findHealthCheck(checks, "system_mode")}
                testId="ops-card-system-mode"
              />
              <HealthCard
                title={t("admin.overview.card.reconciliation")}
                check={findHealthCheck(checks, "reconciliation_latest")}
                testId="ops-card-reconciliation"
              />
              <CombinedHealthCard
                title={t("admin.overview.card.cronLiquidation")}
                checks={[
                  findHealthCheck(checks, "cron_liquidation_liveness"),
                  findHealthCheck(checks, "liquidation_recent_error"),
                ]}
                testId="ops-card-cron-liquidation"
              />
              <HealthCard
                title={t("admin.overview.card.treasuryFreshness")}
                check={findHealthCheck(checks, "treasury_freshness")}
                testId="ops-card-treasury"
              />
              <CombinedHealthCard
                title={t("admin.overview.card.riskSignals")}
                checks={[
                  findHealthCheck(checks, "hash_chain_integrity"),
                  findHealthCheck(checks, "pending_exceptions"),
                  findHealthCheck(checks, "treasury_solvency"),
                ]}
                testId="ops-card-risk-signals"
              />
              <HealthCard
                title={t("admin.overview.card.operatorActions")}
                check={findHealthCheck(checks, "operator_high_risk_actions")}
                testId="ops-card-operator-actions"
                className="md:col-span-2 xl:col-span-1"
              />
            </div>
          </section>
        ) : null}
      </div>
  );
}
