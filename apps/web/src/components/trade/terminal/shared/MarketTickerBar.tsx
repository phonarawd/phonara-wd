import { ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export type MarketTickerBarProps = {
  baseLabel: string;
  pairLabel: string;
  markets: { symbol: string; display_name?: string | null }[];
  selectedSymbol: string;
  onMarketChange: (symbol: string) => void;
  marketsLoading?: boolean;
  /** Exchange live feed — display reference (Last). */
  lastPriceDisplay: string;
  lastPriceToneClass: string;
  /** Server oracle mark — settlement / order fill reference. */
  markPriceDisplay: string;
  markPriceUnavailable?: boolean;
  showPerp?: boolean;
  change24Display?: string;
  change24Tone?: "up" | "down";
  high24Display?: string;
  low24Display?: string;
  vol24Display?: string;
  fundingDisplay?: string;
  fundingToneClass?: string;
  openInterestDisplay?: string;
  trailing?: React.ReactNode;
};

export function MarketTickerBar({
  baseLabel,
  pairLabel,
  markets,
  selectedSymbol,
  onMarketChange,
  marketsLoading,
  lastPriceDisplay,
  lastPriceToneClass,
  markPriceDisplay,
  markPriceUnavailable = false,
  showPerp = true,
  change24Display = "+0.00%",
  change24Tone = "up",
  high24Display = "—",
  low24Display = "—",
  vol24Display = "—",
  fundingDisplay = "0.00%",
  fundingToneClass = "text-muted-foreground",
  openInterestDisplay,
  trailing,
}: MarketTickerBarProps) {
  const changeTone =
    change24Tone === "up" ? "text-(--color-up)" : "text-(--color-down)";

  return (
    <div className="trade-terminal__ticker sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <span className="rounded bg-(--color-surface-elev) px-2 py-0.5 text-[11px] font-medium text-[#F7931A]">
            {baseLabel}
          </span>
          <label className="sr-only" htmlFor="trade-terminal-market">
            {t("trade.markets.pick")}
          </label>
          <select
            id="trade-terminal-market"
            value={selectedSymbol}
            disabled={marketsLoading || markets.length === 0}
            onChange={(e) => onMarketChange(e.target.value)}
            className="cursor-pointer bg-transparent text-sm font-semibold outline-none"
          >
            {markets.map((m) => (
              <option key={m.symbol} value={m.symbol}>
                {m.display_name ?? m.symbol}
              </option>
            ))}
          </select>
          {showPerp ? (
            <span className="text-[10px] text-muted-foreground">{t("trade.perp")}</span>
          ) : null}
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
          <button
            type="button"
            aria-label={t("trade.favorite")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Star className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3 md:gap-4">
          <PriceBlock
            label={t("trade.chart.livePrice")}
            value={lastPriceDisplay}
            toneClass={lastPriceToneClass}
            title={t("trade.chart.displayFeedDisclosure")}
          />
          <PriceBlock
            label={t("trade.oracleSettlementPrice")}
            value={markPriceDisplay}
            toneClass={markPriceUnavailable ? "text-muted-foreground" : lastPriceToneClass}
            title={t("trade.chart.oracleLineDescription")}
            emphasize={markPriceUnavailable}
          />
        </div>

        <TickerStat label={t("trade.change24")} value={change24Display} toneClass={changeTone} />
        <TickerStat label={t("trade.high24")} value={high24Display} />
        <TickerStat label={t("trade.low24")} value={low24Display} />
        <TickerStat label={t("trade.vol24")} value={vol24Display} />
        <TickerStat label={t("trade.funding")} value={fundingDisplay} toneClass={fundingToneClass} />
        {openInterestDisplay ? (
          <TickerStat label={t("trade.openInterest")} value={openInterestDisplay} />
        ) : null}

        {trailing ? <div className="ml-auto flex items-center gap-2">{trailing}</div> : null}
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground lg:hidden">{pairLabel}</div>
    </div>
  );
}

function PriceBlock({
  label,
  value,
  toneClass,
  title,
  emphasize,
}: {
  label: string;
  value: string;
  toneClass: string;
  title?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-col" title={title}>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-base font-semibold tabular-nums md:text-lg",
          toneClass,
          emphasize && "opacity-70",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TickerStat({
  label,
  value,
  toneClass,
}: {
  label: string;
  value: string;
  toneClass?: string;
}) {
  return (
    <div className="hidden sm:block">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn("tabular-nums", toneClass)}>{value}</div>
    </div>
  );
}
