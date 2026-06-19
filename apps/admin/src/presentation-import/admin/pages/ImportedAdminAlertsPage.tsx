import { AdminAlertsHub } from "@/components/admin/alerts/AdminAlertsHub";
import { t } from "@/i18n";

// L1-15-I I6 — Alerts page wired to AdminAlertsHub (6 elements + 3 metrics).
export function ImportedAdminAlertsPage() {
  return (
    <div data-testid="admin-alerts-page">
      <header className="mb-4">
        <h1 className="text-2xl font-medium">{t("admin.alerts.title")}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("admin.alerts.subtitle")}
        </p>
      </header>
      <AdminAlertsHub />
    </div>
  );
}
