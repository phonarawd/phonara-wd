import { t } from "@/i18n";

/**
 * Phase 12-A · Casino Hub v0.1 — RTPChip
 */
export function RTPChip({ value }: { value: number }) {
  return (
    <span
      data-hub-id="casino-rtp"
      className="rounded-full border border-foreground/15 bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums"
      title={t("casino.hub.rtp.tooltip")}
    >
      {t("casino.hub.rtp.label")} {value.toFixed(1)}%
    </span>
  );
}
