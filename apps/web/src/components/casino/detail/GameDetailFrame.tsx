import { lazy, memo, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { RTPChip } from "@/components/casino/RTPChip";
import { ProvablyFairBadge } from "@/components/casino/ProvablyFairBadge";
import { useLiveCount } from "@/hooks/useLiveCount";
import { useInView } from "@/hooks/useInView";
import { usePageVisible } from "@/hooks/usePageVisible";
import { useIsMobile } from "@/hooks/use-mobile";
import { IntersectionMount } from "./IntersectionMount";
import { MobileGameFrame } from "./MobileGameFrame";
import {
  getGameMeta,
  type CasinoGameId,
  type Volatility,
} from "@/data/casino-game-meta";
import { t } from "@/i18n";

/**
 * P1.5-B — GameDetailFrame (Apex, Butter-Smooth)
 *
 * Hard budget: GPU-only transforms, CSS containment, content-visibility:auto
 * for off-screen sections, lazy mount for the side rail, `prefers-reduced-motion`
 * honored, framer-motion import 0. The game engine surface is NO-TOUCH.
 */

type Props = {
  gameId: CasinoGameId;
  children: React.ReactNode;
  /** When true, hide the right rail on desktop so the game surface gets full width. */
  wide?: boolean;
};

const SidePanels = lazy(() =>
  import("./GameSidePanels").then((m) => ({
    default: function Bundle({ gameId }: { gameId: CasinoGameId }) {
      return (
        <div className="grid gap-3">
          <m.LiveWinTheater gameId={gameId} />
          <m.HotMultiplierStrip gameId={gameId} />
          <m.TopWin24hCard gameId={gameId} />
        </div>
      );
    },
  })),
);

const SidePanelsWide = lazy(() =>
  import("./GameSidePanels").then((m) => ({
    default: function Wide({ gameId }: { gameId: CasinoGameId }) {
      return (
        <div className="grid gap-3 lg:grid-cols-3">
          <m.LiveWinTheater gameId={gameId} />
          <m.HotMultiplierStrip gameId={gameId} />
          <m.TopWin24hCard gameId={gameId} />
        </div>
      );
    },
  })),
);

const InfoTriad = lazy(() =>
  import("./GameSidePanels").then((m) => ({
    default: function Triad({ gameId }: { gameId: CasinoGameId }) {
      return (
        <div className="grid gap-3 lg:grid-cols-3">
          <m.HowToPlayCard gameId={gameId} />
          <m.FairnessCard />
          <m.TopWin24hCard gameId={gameId} />
        </div>
      );
    },
  })),
);

const PairedRail = lazy(() =>
  import("./GameSidePanels").then((m) => ({ default: m.PairedGamesRail })),
);

export function GameDetailFrame({ gameId, children, wide = false }: Props) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <MobileGameFrame gameId={gameId}>{children}</MobileGameFrame>;
  }
  const meta = getGameMeta(gameId);
  return (
    <div className="grid gap-6">
      <GameHeroStage gameId={gameId} />

      {wide ? (
        <>
          <div data-p13-id="casino-game-surface" className="min-w-0">
            {children}
          </div>
          <IntersectionMount minHeight={260} fallback={<RailSkeleton h={260} />}>
            <SidePanelsWide gameId={gameId} />
          </IntersectionMount>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div data-p13-id="casino-game-surface" className="min-w-0">
            {children}
          </div>
          <IntersectionMount minHeight={520} fallback={<RailSkeleton />}>
            <SidePanels gameId={gameId} />
          </IntersectionMount>
        </div>
      )}

      <GameStatsStrip gameId={gameId} />

      <IntersectionMount minHeight={220} fallback={<RailSkeleton h={220} />}>
        <InfoTriad gameId={gameId} />
      </IntersectionMount>

      <IntersectionMount minHeight={260} fallback={<RailSkeleton h={260} />}>
        <PairedRail gameId={gameId} />
      </IntersectionMount>

      <p className="text-[11px] text-muted-foreground/70">
        {t("casino.detail.disclaimer")}
      </p>
      <span className="sr-only">{meta.nameAscii}</span>
    </div>
  );
}

function RailSkeleton({ h = 520 }: { h?: number }) {
  return (
    <div
      aria-hidden
      className="animate-pulse rounded-xl bg-muted/30"
      style={{ height: h }}
    />
  );
}

/* ───────────────────── Hero Stage ───────────────────── */

const GameHeroStage = memo(function GameHeroStage({
  gameId,
}: {
  gameId: CasinoGameId;
}) {
  const meta = getGameMeta(gameId);
  const rootRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: false, rootMargin: "200px" });
  const visible = usePageVisible();
  const liveActive = inView && visible;
  const liveNow = useLiveCount(meta.liveSeed, {
    minPct: 0.005,
    maxPct: 0.022,
    minIntervalMs: 1500,
    maxIntervalMs: 2900,
    drift: 0.12,
    active: liveActive,
  });

  // RAF-coalesced pointer tilt — GPU only.
  useEffect(() => {
    const el = posterRef.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    let nx = 0;
    let ny = 0;
    const apply = () => {
      raf = 0;
      el.style.transform = `perspective(900px) rotateX(${ny}deg) rotateY(${nx}deg)`;
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      nx = px * 6;
      ny = -py * 6;
      if (!raf) raf = window.requestAnimationFrame(apply);
    };
    const onLeave = () => {
      nx = 0;
      ny = 0;
      if (!raf) raf = window.requestAnimationFrame(apply);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Card
      ref={rootRef}
      data-p13-id="casino-game-hero"
      className={`relative overflow-hidden bg-gradient-to-br ${meta.tone} [contain:layout_paint_style]`}
    >
      {/* Blurred background using same poster — no extra fetch */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 [filter:blur(40px)_saturate(140%)] [will-change:filter]"
        style={{
          backgroundImage: `url(${meta.poster})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative grid min-w-0 gap-4 p-4 md:grid-cols-[200px_1fr] md:items-center md:gap-5 md:p-5">
        <div
          ref={posterRef}
          className="relative aspect-[4/3] w-full max-w-full overflow-hidden rounded-xl ring-1 ring-border/40 transition-transform duration-200 ease-out [will-change:transform] sm:max-w-[280px] md:max-w-none"
          style={{
            boxShadow: `0 24px 64px -24px ${meta.accentHex}66`,
          }}
        >
          <img
            src={meta.poster}
            alt={t(meta.nameKey)}
            width={768}
            height={576}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent"
          />
          <div className="absolute left-2 top-2">
            <ProvablyFairBadge />
          </div>
        </div>

        <div className="grid min-w-0 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span
                key={liveNow}
                className="inline-block animate-fade-in font-mono tabular-nums"
              >
                {liveNow.toLocaleString("en-US")}
              </span>
              <span className="text-muted-foreground">
                {t("casino.card.playing")}
              </span>
            </span>
            <VolatilityBadge level={meta.volatility} />
            <RTPChip value={meta.rtp} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t(meta.nameKey)}
          </h1>

          <dl className="grid grid-cols-2 gap-2 text-[12px] sm:max-w-md">
            <Stat label={t("casino.detail.minBet")} value={meta.minBet} />
            <Stat label={t("casino.detail.maxBet")} value={meta.maxBet} />
          </dl>
        </div>
      </div>
    </Card>
  );
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 px-3 py-2 ring-1 ring-border/40 backdrop-blur">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-mono text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function VolatilityBadge({ level }: { level: Volatility }) {
  const tone =
    level === "low"
      ? "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30"
      : level === "medium"
        ? "bg-sky-500/15 text-sky-600 ring-sky-500/30"
        : level === "high"
          ? "bg-amber-500/15 text-amber-600 ring-amber-500/30"
          : "bg-rose-500/15 text-rose-600 ring-rose-500/30";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}
    >
      {t(`casino.detail.volatility.${level}`)}
    </span>
  );
}

/* ───────────────────── 24h Stats Strip ───────────────────── */

const GameStatsStrip = memo(function GameStatsStrip({
  gameId,
}: {
  gameId: CasinoGameId;
}) {
  const meta = getGameMeta(gameId);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, rootMargin: "100px" });
  const visible = usePageVisible();
  const enabled = inView && visible;

  const bets = useCountUp(meta.bets24h, enabled);
  const maxWin = useCountUp(meta.maxWin24hKrw, enabled);
  const avg = useCountUp(Math.round(meta.avgMultiplier * 100), enabled);

  return (
    <div
      ref={rootRef}
      data-p13-id="casino-game-stats"
      className="grid grid-cols-3 gap-3 [contain:layout_paint_style]"
    >
      <StatTile
        label={t("casino.detail.stats.bets24h")}
        value={bets.toLocaleString("en-US")}
      />
      <StatTile
        label={t("casino.detail.stats.maxWin24h")}
        value={`\u20A9${maxWin.toLocaleString("en-US")}`}
        accent
      />
      <StatTile
        label={t("casino.detail.stats.avgMultiplier")}
        value={`×${(avg / 100).toFixed(2)}`}
      />
    </div>
  );
});

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={`grid gap-1 p-3 sm:p-4 ${
        accent ? "bg-primary/5 ring-1 ring-primary/20" : ""
      }`}
    >
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-base font-semibold tabular-nums sm:text-lg">
        {value}
      </span>
    </Card>
  );
}

function useCountUp(target: number, active: boolean) {
  const [v, setV] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setV(target);
      return;
    }
    let raf = 0;
    const duration = 900;
    startRef.current = null;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [target, active]);
  return v;
}
