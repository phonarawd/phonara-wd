import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";
import { useLiveTickerFeed } from "@/hooks/useLiveTickerFeed";
import { useLiveCount } from "@/hooks/useLiveCount";
import { LIVE_WIN_FEED, formatFeedAmount } from "@/data/casino-feed";

/**
 * P1.1a — LiveWinTicker (alive)
 * 60-entry pool · rotating no-dup window · animated enter · live online counter header.
 */
export function LiveWinTicker() {
  const { items, tick } = useLiveTickerFeed(LIVE_WIN_FEED, 3, 1800);
  const online = useLiveCount(1_247_330, {
    minPct: 0.0005,
    maxPct: 0.0025,
    minIntervalMs: 1400,
    maxIntervalMs: 2400,
    drift: 0.2,
  });

  return (
    <Card data-p1-id="casino-live-ticker" data-hub-id="casino-ticker">
      <CardContent className="grid gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              {t("casino.ticker.title")}
            </h3>
          </div>
          <span className="font-mono text-[10px] font-medium text-muted-foreground tabular-nums">
            {t("casino.live.onlineCount", {
              count: online.toLocaleString("en-US"),
            })}
          </span>
        </div>
        <ul className="grid gap-1">
          {items.map((w, idx) => (
            <li
              key={`${tick}-${idx}-${w.user}`}
              className="flex animate-fomo-pulse items-center justify-between text-xs"
            >
              <span className="truncate text-muted-foreground">
                <span className="font-medium text-foreground">{w.user}</span>
                {" \u00B7 "}
                {w.game}
              </span>
              <span className="font-mono font-semibold text-emerald-500">
                {formatFeedAmount(w)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
