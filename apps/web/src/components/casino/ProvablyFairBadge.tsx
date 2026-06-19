import { t } from "@/i18n";

/**
 * Phase 12-A · Casino Hub v0.1 — ProvablyFairBadge
 * Trust badge for Provably Fair games.
 */
export function ProvablyFairBadge({ className = "" }: { className?: string }) {
  return (
    <span
      data-hub-id="casino-pf"
      data-testid="casino-pf"
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500 ${className}`}
      title={`${t("casino.hub.pf.tooltip")} — ${t("casino.hub.pf.verify")}`}
    >
      <span className="h-1 w-1 rounded-full bg-emerald-500" />
      {t("casino.hub.pf.label")}
    </span>
  );
}
