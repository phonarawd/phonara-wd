import { t } from "@/i18n";

export type LeverageControlProps = {
  leverage: string;
  onLeverageChange: (value: string) => void;
  maxLeverage: number;
  compact?: boolean;
};

export function LeverageControl({
  leverage,
  onLeverageChange,
  maxLeverage,
  compact = false,
}: LeverageControlProps) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] text-muted-foreground">
        {t("trade.leverageWith", { value: leverage })}
      </span>
      <input
        type="range"
        min={1}
        max={maxLeverage}
        value={Number(leverage)}
        onChange={(e) => onLeverageChange(e.target.value)}
        className={compact ? "w-full accent-(--color-primary)" : "w-full"}
      />
    </label>
  );
}
