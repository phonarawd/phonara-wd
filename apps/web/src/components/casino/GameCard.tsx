import { useRef } from "react";
import { Link } from "@/shims/react-router-dom";
import { Card } from "@/components/ui/card";
import { RTPChip } from "./RTPChip";
import { ProvablyFairBadge } from "./ProvablyFairBadge";
import { t } from "@/i18n";
import { useLiveCount } from "@/hooks/useLiveCount";
import { useInView } from "@/hooks/useInView";

/**
 * P1.1b ??GameCard (alive + poster)
 * Full-bleed CDN poster · live player count walks · gradient overlay for name.
 */
type Props = {
  to: string;
  name: string;
  rtp: number;
  live: number;
  poster?: string;
  tone?: string;
  provablyFair?: boolean;
};

export function GameCard({
  to,
  name,
  rtp,
  live,
  poster,
  tone = "from-primary/15 to-transparent",
  provablyFair = true,
}: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const inView = useInView(linkRef, { once: false, rootMargin: "200px" });
  const liveNow = useLiveCount(live, {
    minPct: 0.005,
    maxPct: 0.025,
    minIntervalMs: 1400,
    maxIntervalMs: 2800,
    drift: 0.1,
    active: inView,
  });

  return (
    <Link ref={linkRef} to={to} preload="intent" className="group block">
      <Card
        data-p1-id="casino-game-card"
        className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${tone} transition-all duration-[240ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--color-primary)_45%,transparent)] group-focus-visible:-translate-y-1`}
      >
        {poster && (
          <img
            src={poster}
            alt={name}
            width={768}
            height={576}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[420ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/55 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[240ms] group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 40%, color-mix(in oklab, var(--color-primary) 22%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <span className="block text-sm font-bold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {name}
          </span>
        </div>
        {provablyFair && (
          <div className="absolute left-2 top-2">
            <ProvablyFairBadge />
          </div>
        )}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">
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
        </div>
        <div className="absolute right-2 top-9">
          <RTPChip value={rtp} />
        </div>
      </Card>
    </Link>
  );
}
