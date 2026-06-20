import { t } from "@/i18n";

const TIER_ROWS = [
  { key: "earn.survival.tier.row1", amount: "100,000" },
  { key: "earn.survival.tier.row2", amount: "1,000" },
  { key: "earn.survival.tier.row3", amount: "5" },
] as const;

export function SurvivalTierTable() {
  return (
    <details
      data-testid="survival-tier-table"
      className="rounded-lg border border-border bg-card/30"
    >
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-foreground">
        {t("earn.survival.tier.title")}
      </summary>
      <div className="border-t border-border px-3 py-2">
        <p className="mb-2 text-[10px] text-muted-foreground">{t("earn.survival.tier.disclaimer")}</p>
        <ul className="flex flex-col gap-1.5">
          {TIER_ROWS.map((row) => (
            <li key={row.key} className="flex justify-between text-sm tabular-nums">
              <span className="text-muted-foreground">{t(row.key, { amount: row.amount })}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

SurvivalTierTable.displayName = "SurvivalTierTable";
