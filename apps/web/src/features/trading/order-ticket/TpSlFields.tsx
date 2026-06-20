import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export type TpSlFieldsProps = {
  tpEnabled: boolean;
  onTpToggle: (enabled: boolean) => void;
  tpPrice: string;
  onTpPriceChange: (value: string) => void;
  slEnabled: boolean;
  onSlToggle: (enabled: boolean) => void;
  slPrice: string;
  onSlPriceChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function TpSlFields({
  tpEnabled,
  onTpToggle,
  tpPrice,
  onTpPriceChange,
  slEnabled,
  onSlToggle,
  slPrice,
  onSlPriceChange,
  disabled = false,
  className,
}: TpSlFieldsProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label className="flex items-center gap-2 text-[11px]">
        <input
          type="checkbox"
          checked={tpEnabled}
          disabled={disabled}
          onChange={(e) => onTpToggle(e.target.checked)}
          className="size-4 rounded border-border"
        />
        <span>{t("trade.order.tpEnable")}</span>
      </label>
      {tpEnabled ? (
        <input
          inputMode="decimal"
          value={tpPrice}
          disabled={disabled}
          onChange={(e) => onTpPriceChange(e.target.value)}
          placeholder={t("trade.order.tp")}
          className="h-10 rounded border border-border bg-(--color-surface) px-2 tabular-nums disabled:opacity-60"
        />
      ) : null}
      <label className="flex items-center gap-2 text-[11px]">
        <input
          type="checkbox"
          checked={slEnabled}
          disabled={disabled}
          onChange={(e) => onSlToggle(e.target.checked)}
          className="size-4 rounded border-border"
        />
        <span>{t("trade.order.slEnable")}</span>
      </label>
      {slEnabled ? (
        <input
          inputMode="decimal"
          value={slPrice}
          disabled={disabled}
          onChange={(e) => onSlPriceChange(e.target.value)}
          placeholder={t("trade.order.sl")}
          className="h-10 rounded border border-border bg-(--color-surface) px-2 tabular-nums disabled:opacity-60"
        />
      ) : null}
    </div>
  );
}
