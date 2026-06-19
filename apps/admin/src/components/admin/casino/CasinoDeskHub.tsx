import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AdminAuditTrail } from "@/components/admin/primitives";
import { t } from "@/i18n";
import { useAdminCasinoDeskMock } from "@/hooks/admin/useAdminCasinoDeskMock";
import { CasinoCatalogQueue } from "./CasinoCatalogQueue";
import { CasinoRtpReviewQueue } from "./CasinoRtpReviewQueue";

// L1-15-E · Admin Casino Desk Hub.
// Tabs (mobile) · vertical stack (desktop). Single shared audit trail.
// Storage: phonara-admin-casino-* only · operations storage byte-equal.

type Tab = "catalog" | "rtp";

export function CasinoDeskHub() {
  const desk = useAdminCasinoDeskMock();
  const [tab, setTab] = useState<Tab>("catalog");

  const segmented = (
    <div
      role="tablist"
      aria-label={t("admin.casino.section.tabs")}
      className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 md:hidden"
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "catalog"}
        onClick={() => setTab("catalog")}
        data-testid="casino-tab-catalog"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "catalog"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.casino.section.catalog")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "rtp"}
        onClick={() => setTab("rtp")}
        data-testid="casino-tab-rtp"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "rtp"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.casino.section.rtp")}
      </button>
    </div>
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">{t("admin.casino.title")}</h1>
          <Badge
            variant="outline"
            className="border-(--color-primary)/40 text-[10px] uppercase tracking-wider"
            data-testid="mock-chip"
          >
            {t("admin.primitive.mock")}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {t("admin.casino.subtitle.boundary")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("admin.casino.subtitle")}
      </p>

      {segmented}

      <div className={tab === "catalog" ? "" : "hidden md:block"}>
        <CasinoCatalogQueue desk={desk} />
      </div>

      <div className={tab === "rtp" ? "" : "hidden md:block"}>
        <CasinoRtpReviewQueue desk={desk} />
      </div>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.casino.audit.title")}
        </h3>
        <AdminAuditTrail
          events={desk.audit}
          emptyLabel={t("admin.casino.audit.empty")}
        />
      </div>
    </div>
  );
}
