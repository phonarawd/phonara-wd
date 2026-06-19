import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AdminAuditTrail } from "@/components/admin/primitives";
import { t } from "@/i18n";
import { useAdminAccessDeskMock } from "@/hooks/admin/useAdminAccessDeskMock";
import { RbacRolesQueue } from "./RbacRolesQueue";
import { SavedFiltersQueue } from "./SavedFiltersQueue";

// L1-15-J · J4 — Settings hub. Tabs (mobile) · stack (desktop).
// Storage: phonara-admin-rbac-v1 + phonara-admin-filters-v1 only.

type Tab = "rbac" | "filters";

export function AccessSettingsHub() {
  const desk = useAdminAccessDeskMock();
  const [tab, setTab] = useState<Tab>("rbac");

  const segmented = (
    <div
      role="tablist"
      aria-label={t("admin.access.section.tabs")}
      className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 md:hidden"
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "rbac"}
        onClick={() => setTab("rbac")}
        data-testid="access-tab-rbac"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "rbac"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.access.section.rbac")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "filters"}
        onClick={() => setTab("filters")}
        data-testid="access-tab-filters"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "filters"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.access.section.filters")}
      </button>
    </div>
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">{t("admin.settings.title")}</h1>
          <Badge
            variant="outline"
            className="border-(--color-primary)/40 text-[10px] uppercase tracking-wider"
            data-testid="mock-chip"
          >
            {t("admin.primitive.mock")}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {t("admin.access.subtitle.boundary")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("admin.settings.subtitle")}
      </p>

      {segmented}

      <div className={tab === "rbac" ? "" : "hidden md:block"}>
        <RbacRolesQueue desk={desk} />
      </div>

      <div className={tab === "filters" ? "" : "hidden md:block"}>
        <SavedFiltersQueue desk={desk} />
      </div>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.access.audit.title")}
        </h3>
        <AdminAuditTrail
          events={desk.audit}
          emptyLabel={t("admin.access.audit.empty")}
        />
      </div>
    </div>
  );
}
