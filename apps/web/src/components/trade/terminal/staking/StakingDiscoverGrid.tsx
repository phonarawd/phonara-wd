import { useMemo, useState } from "react";
import { Link } from "@/shims/react-router-dom";
import { t } from "@/i18n";
import { useStakingPools, usePrices, type StakingPool } from "@/hooks/use-trading";
import { ExchangeLiveChart } from "@/features/trading/display-chart/exchange-live-chart";
import { stakingReferenceChartSymbol } from "@/features/trading/display-chart/resolve-exchange-symbol";
import { formatOraclePriceDisplay } from "@/features/trading/format-oracle-price-display";

type DisplayPool = {
  id: string;
  symbol: string;
  apr: string;
  termKey: string;
  minStake: string;
  capacity: string;
};

const FALLBACK_POOLS: DisplayPool[] = [
  {
    id: "phon-flex",
    symbol: "PHON",
    apr: "8.40%",
    termKey: "trade.staking.term.flex",
    minStake: "10",
    capacity: "62%",
  },
  {
    id: "phon-30d",
    symbol: "PHON",
    apr: "14.20%",
    termKey: "trade.staking.term.30d",
    minStake: "50",
    capacity: "78%",
  },
];

function termKeyForPool(pool: StakingPool): string {
  switch (pool.term) {
    case "days_30":
      return "trade.staking.term.30d";
    case "days_90":
      return "trade.staking.term.90d";
    default:
      return "trade.staking.term.flex";
  }
}

function mapDbPool(pool: StakingPool): DisplayPool {
  const aprPct = (Number(pool.estimated_apr) * 100).toFixed(2);
  return {
    id: pool.id,
    symbol: pool.reference_asset ?? pool.stake_currency,
    apr: `${aprPct}%`,
    termKey: termKeyForPool(pool),
    minStake: pool.stake_currency === "USDT" ? "10" : "50",
    capacity: "—",
  };
}

export function StakingDiscoverGrid({ readOnly = false }: { readOnly?: boolean }) {
  const dbPools = useStakingPools();
  const { prices } = usePrices();
  const [chartRef, setChartRef] = useState("BTC");
  const chartMarketSymbol = stakingReferenceChartSymbol(chartRef);
  const oracleRaw = prices[chartMarketSymbol] ?? prices[`${chartRef}USDT-SIM`] ?? null;
  const oracleMarkDisplay = useMemo(() => {
    if (!oracleRaw) return "—";
    return formatOraclePriceDisplay(oracleRaw, oracleRaw);
  }, [oracleRaw]);
  const pools = useMemo(() => {
    if (readOnly || dbPools.length === 0) return FALLBACK_POOLS;
    return dbPools.slice(0, 24).map(mapDbPool);
  }, [dbPools, readOnly]);

  return (
    <div
      data-testid="trade-panel-staking"
      className="trade-terminal mx-auto grid w-full max-w-[1600px] gap-0"
    >
      <header className="trade-terminal__ticker flex flex-wrap items-baseline justify-between gap-2">
        <div className="grid gap-0.5">
          <h2 className="text-sm font-semibold">{t("trade.staking.hero.title")}</h2>
          <p className="text-[11px] text-muted-foreground">{t("trade.staking.hero.desc")}</p>
        </div>
        {readOnly ? (
          <span
            data-testid="trade-staking-display-only-label"
            className="rounded-full bg-(--color-warn)/15 px-2 py-0.5 text-[10px] font-semibold text-(--color-warn)"
          >
            {t("trade.orderbook.displayOnly")}
          </span>
        ) : null}
      </header>

      <div className="trade-terminal__panel border-x border-border">
        <ExchangeLiveChart
          marketSymbol={chartMarketSymbol}
          oraclePrice={oracleMarkDisplay}
          oraclePriceRaw={oracleRaw ?? undefined}
          pricePrecision={2}
          compact
          heightClass="min-h-[200px]"
        />
      </div>

      <div className="grid gap-0 border border-border sm:grid-cols-2 lg:grid-cols-4">
        {pools.map((p) => (
          <article
            key={p.id}
            data-testid={`trade-staking-pool-${p.id}`}
            className="trade-terminal__panel border-b border-r border-border p-3"
            onMouseEnter={() => setChartRef(p.symbol)}
          >
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold">{p.symbol}</span>
              <span className="rounded bg-(--color-surface-elev) px-2 py-0.5 text-[10px] text-muted-foreground">
                {t(p.termKey)}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">{t("trade.staking.apr")}</div>
            <div className="text-2xl font-bold tabular-nums text-(--color-up)">{p.apr}</div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
              <div>
                <div className="text-[10px]">{t("trade.staking.minStake")}</div>
                <div className="tabular-nums text-foreground">
                  {p.minStake} {p.symbol}
                </div>
              </div>
              <div>
                <div className="text-[10px]">{t("trade.staking.capacity")}</div>
                <div className="tabular-nums text-foreground">{p.capacity}</div>
              </div>
            </div>
            {readOnly ? (
              <span className="mt-3 flex min-h-11 items-center justify-center rounded-md bg-(--color-surface-elev) text-xs font-semibold text-muted-foreground">
                {t("trade.staking.openStaking")}
              </span>
            ) : (
              <Link
                to="/staking"
                className="mt-3 flex min-h-11 items-center justify-center rounded-md bg-(--color-primary) text-xs font-bold text-(--color-primary-foreground) hover:opacity-90"
              >
                {t("trade.staking.stakeCta")}
              </Link>
            )}
          </article>
        ))}
      </div>

      <Link
        to="/earn"
        className="border border-t-0 border-border px-4 py-3 text-xs text-muted-foreground hover:bg-(--color-surface-elev)"
      >
        {t("trade.staking.earnLink")}
      </Link>
    </div>
  );
}
