import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AdminAuditTrail } from "@/components/admin/primitives";
import { t } from "@/i18n";
import { useAdminEarnDesk } from "@/hooks/admin/useAdminEarnDesk";
import { EarnAgentsQueue } from "./EarnAgentsQueue";
import { EarnSettlementsQueue } from "./EarnSettlementsQueue";

// L1-15-F · Admin Earn/Referral Desk Hub.
// Tabs (mobile) · vertical stack (desktop). Shared audit trail.
// Storage: phonara-admin-earn-* only · cross-desk byte-equal.

type Tab = "agents" | "settlements";

export function EarnDeskHub() {
  const desk = useAdminEarnDesk();
  const [tab, setTab] = useState<Tab>("agents");

  const segmented = (
    <div
      role="tablist"
      aria-label={t("admin.earn.section.tabs")}
      className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 md:hidden"
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "agents"}
        onClick={() => setTab("agents")}
        data-testid="earn-tab-agents"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "agents"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.earn.section.agents")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "settlements"}
        onClick={() => setTab("settlements")}
        data-testid="earn-tab-settlements"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "settlements"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.earn.section.settlements")}
      </button>
    </div>
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">{t("admin.earn.title")}</h1>
          <Badge
            variant="outline"
            className="border-(--color-primary)/40 text-[10px] uppercase tracking-wider"
            data-testid="mock-chip"
          >
            {t("admin.primitive.mock")}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {t("admin.earn.subtitle.boundary")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("admin.earn.subtitle")}
      </p>

      {segmented}

      <div className={tab === "agents" ? "" : "hidden md:block"}>
        <EarnAgentsQueue desk={desk} />
      </div>

      <div className={tab === "settlements" ? "" : "hidden md:block"}>
        <EarnSettlementsQueue desk={desk} />
      </div>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.earn.audit.title")}
        </h3>
        <AdminAuditTrail
          events={desk.audit}
          emptyLabel={t("admin.earn.audit.empty")}
        />
      </div>
    </div>
  );
}
