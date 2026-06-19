import { AdminAuditHub } from "@/components/admin/audit/AdminAuditHub";
import { t } from "@/i18n";

// L1-15-I I5 — Audit page wired to AdminAuditHub (merged read-only feed).
export function ImportedAdminAuditPage() {
  return (
    <div data-testid="audit-page" className="min-w-0">
      <header className="mb-4">
        <h1 className="text-2xl font-medium">{t("admin.audit.title")}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("admin.audit.subtitle")}
        </p>
      </header>
      <AdminAuditHub />
    </div>
  );
}
