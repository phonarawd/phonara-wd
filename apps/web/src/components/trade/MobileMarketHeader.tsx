import { cn } from "@/lib/utils";
import { ChevronDown, Star } from "lucide-react";

export interface MobileMarketHeaderProps {
  symbol: string;
  lastPriceDisplay: string;
  changePctDisplay: string;
  changeDir: "up" | "down" | "flat";
  high24Display: string;
  low24Display: string;
  vol24Display: string;
  fundingDisplay: string;
  className?: string;
}

export function MobileMarketHeader({
  symbol,
  lastPriceDisplay,
  changePctDisplay,
  changeDir,
  high24Display,
  low24Display,
  vol24Display,
  fundingDisplay,
  className,
}: MobileMarketHeaderProps) {
  const tone =
    changeDir === "up"
      ? "text-(--color-up)"
      : changeDir === "down"
        ? "text-(--color-down)"
        : "text-foreground";
  return (
    <div className={cn("rounded-lg border border-border bg-(--color-surface) p-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex min-h-12 items-center gap-2 rounded-md px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
        >
          <span className="rounded bg-(--color-surface-elev) px-2 py-0.5 text-[11px] font-medium text-[#F7931A]">
            BTC
          </span>
          <span className="text-sm font-semibold">{symbol}</span>
          <span className="text-[10px] text-muted-foreground">무기한</span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="즐겨찾기"
          className="grid size-12 place-items-center text-muted-foreground hover:text-foreground"
        >
          <Star className="size-4" />
        </button>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className={cn("text-2xl font-semibold tabular-nums", tone)}>{lastPriceDisplay}</div>
        <div className={cn("pb-1 text-sm font-medium tabular-nums", tone)}>{changePctDisplay}</div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
        <Stat label="24h 고가" value={high24Display} />
        <Stat label="24h 저가" value={low24Display} />
        <Stat label="24h 거래량" value={vol24Display} />
        <Stat label="펀딩" value={fundingDisplay} tone="up" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tabular-nums text-foreground",
          tone === "up" && "text-(--color-up)",
          tone === "down" && "text-(--color-down)",
        )}
      >
        {value}
      </div>
    </div>
  );
}
