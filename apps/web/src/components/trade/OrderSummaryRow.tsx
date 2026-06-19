import { cn } from "@/lib/utils";

export interface OrderSummaryRowProps {
  availableBalanceDisplay: string;
  estFeeDisplay: string;
  estLiqPriceDisplay: string;
  marginDisplay?: string;
  className?: string;
}

/**
 * Display-only summary. All values arrive as strings; this component does NOT
 * compute, parse, or transform any monetary value.
 */
export function OrderSummaryRow({
  availableBalanceDisplay,
  estFeeDisplay,
  estLiqPriceDisplay,
  marginDisplay,
  className,
}: OrderSummaryRowProps) {
  return (
    <div
      className={cn(
        "grid gap-1.5 rounded-lg border border-border bg-(--color-surface) p-3 text-xs",
        className,
      )}
    >
      <Row k="가용 잔고" v={availableBalanceDisplay} />
      {marginDisplay && <Row k="필요 마진" v={marginDisplay} />}
      <Row k="예상 수수료" v={estFeeDisplay} />
      <Row k="예상 청산가" v={estLiqPriceDisplay} tone="down" />
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "up" | "down" }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span
        className={cn(
          "tabular-nums",
          tone === "up" && "text-(--color-up)",
          tone === "down" && "text-(--color-down)",
        )}
      >
        {v}
      </span>
    </div>
  );
}
