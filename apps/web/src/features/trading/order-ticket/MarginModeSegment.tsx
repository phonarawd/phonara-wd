import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { MarginMode } from "./order-ticket-types";

export type MarginModeSegmentProps = {
  value: MarginMode;
  onChange: (mode: MarginMode) => void;
  crossEnabled?: boolean;
  className?: string;
};

export function MarginModeSegment({
  value,
  onChange,
  crossEnabled = false,
  className,
}: MarginModeSegmentProps) {
  const items: { id: MarginMode; labelKey: string; disabled?: boolean; hintKey?: string }[] = [
    { id: "isolated", labelKey: "trade.order.margin.isolated" },
    {
      id: "cross",
      labelKey: crossEnabled ? "trade.order.margin.cross" : "trade.order.crossDisabled",
      disabled: !crossEnabled,
      hintKey: crossEnabled ? undefined : "trade.order.margin.crossHint",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-1", className)} role="group" aria-label={t("trade.order.marginMode")}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-active={value === item.id}
          disabled={item.disabled}
          title={item.hintKey ? t(item.hintKey) : undefined}
          onClick={() => !item.disabled && onChange(item.id)}
          className="min-h-9 rounded border border-border px-2 py-1 text-xs font-medium whitespace-nowrap data-[active=true]:bg-(--color-surface-elev) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  );
}
