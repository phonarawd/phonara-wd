import { memo, useRef } from "react";
import { Link } from "@/shims/react-router-dom";
import { Card } from "@/components/ui/card";
import { GameCard } from "@/components/casino/GameCard";
import { useGameRecentWins } from "@/hooks/useGameRecentWins";
import { useHotMultipliers } from "@/hooks/useHotMultipliers";
import { useInView } from "@/hooks/useInView";
import { usePageVisible } from "@/hooks/usePageVisible";
import { getGameMeta, type CasinoGameId } from "@/data/casino-game-meta";
import { formatFeedAmount } from "@/data/casino-feed";
import { t } from "@/i18n";

/* ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ Live Win Theater ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ */

export const LiveWinTheater = memo(function LiveWinTheater({
  gameId,
}: {
  gameId: CasinoGameId;
}) {
  const meta = getGameMeta(gameId);
  const ref = useRef<HTMLDivElement>(null);
  const { items, tick } = useGameRecentWins(meta.feedName, 7, 5500);
  return (
    <Card
      ref={ref}
      data-p15-id="live-win-theater"
      className="grid gap-3 p-4 [contain:layout_paint_style]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {t("casino.detail.theater.title")}
        </h2>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {t("common.label.live")}
        </span>
      </div>
      <ul key={tick} className="grid gap-1.5">
        {items.map((w, idx) => (
          <li
            key={`${w.user}-${idx}`}
            className="slide-down-fade flex items-center justify-between rounded-lg bg-background/40 px-3 py-2 text-[12px] ring-1 ring-border/30 [will-change:transform,opacity]"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <span className="truncate font-mono text-muted-foreground">
              {w.user}
            </span>
            <span className="font-mono font-semibold tabular-nums text-emerald-500">
              +{formatFeedAmount(w)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
});

/* ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ Hot Multipliers ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ */

export const HotMultiplierStrip = memo(function HotMultiplierStrip({
  gameId,
}: {
  gameId: CasinoGameId;
}) {
  const meta = getGameMeta(gameId);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, rootMargin: "200px" });
  const visible = usePageVisible();
  const items = useHotMultipliers(meta.liveSeed, 6, inView && visible);
  return (
    <Card
      ref={ref}
      data-p15-id="hot-multipliers"
      className="grid gap-2 p-4 [contain:layout_paint_style]"
    >
      <h2 className="text-sm font-semibold">
        {t("casino.detail.hot.title")}
      </h2>
      <ul className="grid grid-cols-3 gap-1.5">
        {items.map((m, idx) => (
          <li
            key={`${m.user}-${idx}`}
            className="rounded-md bg-background/50 p-2 text-center ring-1 ring-border/30"
          >
            <div
              className={`font-mono text-sm font-bold tabular-nums ${
                m.value >= 10
                  ? "text-amber-500"
                  : m.value >= 2
                    ? "text-emerald-500"
                    : "text-muted-foreground"
              }`}
            >
              Ã—{m.value.toFixed(m.value >= 10 ? 1 : 2)}
            </div>
            <div className="truncate text-[10px] text-muted-foreground">
              {m.user}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
});

/* ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ Top Win 24h ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ */

export const TopWin24hCard = memo(function TopWin24hCard({
  gameId,
}: {
  gameId: CasinoGameId;
}) {
  const meta = getGameMeta(gameId);
  const w = meta.topWin24h;
  return (
    <Card
      data-p15-id="top-win-24h"
      className="grid gap-2 p-4 [contain:layout_paint_style]"
      style={{
        background: `linear-gradient(135deg, ${meta.accentHex}1f, transparent 60%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {t("casino.detail.topWin.title")}
        </h2>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          24h
        </span>
      </div>
      <div className="grid gap-0.5">
        <div className="font-mono text-2xl font-extrabold tabular-nums">
          {`\u20A9${w.amountKrw.toLocaleString("en-US")}`}
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-mono text-muted-foreground">{w.user}</span>
          <span className="font-mono font-semibold tabular-nums text-emerald-500">
            Ã—{w.multiplier.toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
});

/* ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ How To Play ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ */

export const HowToPlayCard = memo(function HowToPlayCard({
  gameId,
}: {
  gameId: CasinoGameId;
}) {
  const meta = getGameMeta(gameId);
  return (
    <Card
      data-p15-id="how-to-play"
      className="grid gap-2 p-4 [contain:layout_paint_style]"
    >
      <h2 className="text-sm font-semibold">
        {t("casino.detail.howToPlay.title")}
      </h2>
      <ol className="grid gap-1.5 text-[12px] text-muted-foreground">
        {meta.howToPlayKeys.map((k, i) => (
          <li key={k} className="flex gap-2">
            <span className="font-mono font-semibold text-primary">
              {i + 1}.
            </span>
            <span>{t(k)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
});

/* ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ Fairness ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ */

export const FairnessCard = memo(function FairnessCard() {
  return (
    <Card
      data-p15-id="fairness"
      className="grid gap-2 p-4 [contain:layout_paint_style]"
    >
      <h2 className="text-sm font-semibold">
        {t("casino.detail.fairness.title")}
      </h2>
      <p className="text-[12px] text-muted-foreground">
        {t("casino.detail.fairness.body")}
      </p>
      <Link
        to="/casino/fairness"
        className="text-[12px] font-medium text-primary hover:underline"
      >
        {t("casino.detail.fairness.cta")}
      </Link>
    </Card>
  );
});

/* ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ Paired Games Rail ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€ */

export const PairedGamesRail = memo(function PairedGamesRail({
  gameId,
}: {
  gameId: CasinoGameId;
}) {
  const meta = getGameMeta(gameId);
  return (
    <Card
      data-p15-id="paired-rail"
      className="grid gap-3 p-4 [contain:layout_paint_style]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {t("casino.detail.paired.title")}
        </h2>
        <Link to="/casino" className="text-[11px] text-primary hover:underline">
          {t("common.cta.more")}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {meta.paired.map((pid) => {
          const p = getGameMeta(pid);
          return (
            <GameCard
              key={pid}
              to={p.to}
              name={t(p.nameKey)}
              rtp={p.rtp}
              live={p.liveSeed}
              poster={p.poster}
              tone={p.tone}
            />
          );
        })}
      </div>
    </Card>
  );
});
