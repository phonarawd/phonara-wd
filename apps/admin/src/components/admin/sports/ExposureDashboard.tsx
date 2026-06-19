import { useAdminSports, formatKrwGrouped } from "@/hooks/admin/useAdminSports";
import { AdminMetricCard } from "@/components/admin/primitives";
import { t } from "@/i18n";

// L1-15-P0 E3 — exposure aggregates via AdminMetricCard. mock/display-only.

export function ExposureDashboard() {
  const { exposure } = useAdminSports();

  return (
    <section
      aria-label={t("admin.sports.exposure.title")}
      className="grid gap-3 md:grid-cols-3"
    >
      <AdminMetricCard
        label={t("admin.sports.exposure.total")}
        value={formatKrwGrouped(exposure.total)}
        tone="primary"
        testId="exposure-total"
      />
      <AdminMetricCard
        label={t("admin.sports.exposure.max")}
        value={formatKrwGrouped(exposure.max)}
        testId="exposure-max"
      />
      <AdminMetricCard
        label={t("admin.sports.exposure.openBets")}
        value={exposure.openBets.toLocaleString("en-US")}
        testId="exposure-openbets"
      />
    </section>
  );
}
