import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AdminAuditTrail } from "@/components/admin/primitives";
import { t } from "@/i18n";
import { useAdminCmsDeskMock } from "@/hooks/admin/useAdminCmsDeskMock";
import { CmsPagesQueue } from "./CmsPagesQueue";
import { CmsPromosQueue } from "./CmsPromosQueue";

// L1-15-G · Admin CMS Desk Hub. Tabs (mobile) · stack (desktop).
// Storage: phonara-admin-cms-* only · runtime i18n catalog 0-touch.

type Tab = "pages" | "promos";

export function CmsDeskHub() {
  const desk = useAdminCmsDeskMock();
  const [tab, setTab] = useState<Tab>("pages");

  const segmented = (
    <div
      role="tablist"
      aria-label={t("admin.cms.section.tabs")}
      className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 md:hidden"
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "pages"}
        onClick={() => setTab("pages")}
        data-testid="cms-tab-pages"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "pages"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.cms.section.pages")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "promos"}
        onClick={() => setTab("promos")}
        data-testid="cms-tab-promos"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "promos"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.cms.section.promos")}
      </button>
    </div>
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">{t("admin.cms.title")}</h1>
          <Badge
            variant="outline"
            className="border-(--color-primary)/40 text-[10px] uppercase tracking-wider"
            data-testid="mock-chip"
          >
            {t("admin.primitive.mock")}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {t("admin.cms.subtitle.boundary")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">{t("admin.cms.subtitle")}</p>

      {segmented}

      <div className={tab === "pages" ? "" : "hidden md:block"}>
        <CmsPagesQueue desk={desk} />
      </div>

      <div className={tab === "promos" ? "" : "hidden md:block"}>
        <CmsPromosQueue desk={desk} />
      </div>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.cms.audit.title")}
        </h3>
        <AdminAuditTrail
          events={desk.audit}
          emptyLabel={t("admin.cms.audit.empty")}
        />
      </div>
    </div>
  );
}
