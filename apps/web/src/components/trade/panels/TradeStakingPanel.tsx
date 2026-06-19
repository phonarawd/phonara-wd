import { Link } from "@/shims/react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";

/**
 * L1-17 T17-4 ??TradeStakingPanel
 * Display-only staking pools. Stake CTA ??toast. No RPC, no wallet mutate.
 */

type Pool = {
  id: string;
  symbol: string;
  apr: string;
  termKey: string;
  minStake: string;
  capacity: string;
};

const POOLS: Pool[] = [
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
  {
    id: "usdt-90d",
    symbol: "USDT",
    apr: "9.85%",
    termKey: "trade.staking.term.90d",
    minStake: "100",
    capacity: "44%",
  },
  {
    id: "btc-180d",
    symbol: "BTC",
    apr: "3.10%",
    termKey: "trade.staking.term.180d",
    minStake: "0.001",
    capacity: "31%",
  },
];

export function TradeStakingPanel({ readOnly = false }: { readOnly?: boolean }) {
  return (
    <div
      data-testid="trade-panel-staking"
      className="mx-auto grid w-full max-w-[1600px] gap-3 p-3 md:p-4"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border bg-(--color-surface) px-4 py-3">
        <div className="grid gap-0.5">
          <h2 className="text-sm font-semibold">{t("trade.staking.hero.title")}</h2>
          <p className="text-[11px] text-muted-foreground">
            {t("trade.staking.hero.desc")}
          </p>
        </div>
        <span
          data-testid="trade-staking-display-only-label"
          className="rounded-full bg-(--color-warn)/15 px-2 py-0.5 text-[10px] font-semibold text-(--color-warn)"
        >
          {t("trade.orderbook.displayOnly")}
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {POOLS.map((p) => (
          <Card key={p.id} data-testid={`trade-staking-pool-${p.id}`}>
            <CardHeader className="py-2">
              <CardTitle className="flex items-baseline justify-between text-xs">
                <span>{p.symbol}</span>
                <span className="rounded bg-(--color-surface-elev) px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {t(p.termKey)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-xs">
              <div className="grid gap-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {t("trade.staking.apr")}
                </span>
                <span className="text-2xl font-bold tabular-nums text-(--color-up)">
                  {p.apr}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
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
              <button
                type="button"
                disabled={readOnly}
                className="mt-1 flex min-h-11 items-center justify-center rounded-md bg-(--color-primary) text-xs font-bold text-(--color-primary-foreground) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {readOnly ? t("trade.staking.openStaking") : t("trade.staking.stakeCta")}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link
        to="/earn"
        className="rounded-lg border border-border bg-(--color-surface) px-4 py-3 text-xs text-muted-foreground hover:bg-(--color-surface-elev)"
      >
        {t("trade.staking.earnLink")}
      </Link>
    </div>
  );
}
