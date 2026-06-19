import { t } from "@/i18n";
import { useReducedMotionGuard } from "@/games/shared/hooks/useReducedMotionGuard";

/**
 * L1-07 Phase 7 viral v0.1 — Live winners ticker (density upgrade).
 * Dual-lane parallax marquee · tabular-nums · TOP highlight · online chip ·
 * edge mask · prefers-reduced-motion fallback. Mock data only.
 */
type Win = { user: string; amount: number };

const LANE_A: Win[] = [
  { user: "yuna**", amount: 128400 },
  { user: "minho*", amount: 1000 },
  { user: "kj***", amount: 10000 },
  { user: "park**", amount: 42100 },
  { user: "soo***", amount: 5500 },
  { user: "han**", amount: 3200 },
  { user: "choi*", amount: 87600 },
  { user: "lee***", amount: 1000 },
];

const LANE_B: Win[] = [
  { user: "rey**", amount: 24500 },
  { user: "doh***", amount: 6700 },
  { user: "nara*", amount: 53200 },
  { user: "kim**", amount: 1800 },
  { user: "vera*", amount: 19900 },
  { user: "jay***", amount: 2400 },
  { user: "moon*", amount: 71500 },
  { user: "an***", amount: 9100 },
];

// Wave 1.2 dedup: ONLINE_COUNT removed from this marquee — topbar OnlinePulse
// is the single SOT for online-count display. LIVE label + winners stay.
const numberFmt = new Intl.NumberFormat("en-US");
const fmt = (n: number) => `+${numberFmt.format(n)}P`;

function topIndex(rows: Win[]) {
  let idx = 0;
  for (let i = 1; i < rows.length; i++) {
    const candidate = rows[i];
    const current = rows[idx];
    if (candidate && current && candidate.amount > current.amount) idx = i;
  }
  return idx;
}

function Lane({
  rows,
  duration,
  reverse,
  highlightTop,
}: {
  rows: Win[];
  duration: number;
  reverse?: boolean;
  highlightTop?: boolean;
}) {
  const items = [...rows, ...rows];
  const topIdx = highlightTop ? topIndex(rows) : -1;
  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div
        className="flex gap-6 whitespace-nowrap text-xs"
        style={{
          animation: `marquee-x ${duration}s linear infinite${reverse ? " reverse" : ""}`,
        }}
      >
        {items.map((w, i) => {
          const isTop = highlightTop && i % rows.length === topIdx;
          return (
            <span key={i} className="inline-flex shrink-0 items-center gap-1.5">
              {isTop && (
                <span className="rounded-sm bg-gold/20 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-gold">
                  {t("home.marquee.top")}
                </span>
              )}
              <span className="text-muted-foreground">{w.user}</span>
              <span
                className={`font-semibold tabular-nums ${
                  isTop ? "text-gold" : "text-foreground"
                }`}
              >
                {fmt(w.amount)}
              </span>
              <span className="ml-3 text-border">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StaticLane({ rows, highlightTop }: { rows: Win[]; highlightTop?: boolean }) {
  const topIdx = highlightTop ? topIndex(rows) : -1;
  return (
    <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1 overflow-hidden text-xs">
      {rows.slice(0, 6).map((w, i) => {
        const isTop = highlightTop && i === topIdx;
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {isTop && (
              <span className="rounded-sm bg-gold/20 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-gold">
                {t("home.marquee.top")}
              </span>
            )}
            <span className="text-muted-foreground">{w.user}</span>
            <span
              className={`font-semibold tabular-nums ${
                isTop ? "text-gold" : "text-foreground"
              }`}
            >
              {fmt(w.amount)}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function LiveWinMarquee() {
  const reduced = useReducedMotionGuard();
  return (
    <div
      data-hub-id="home-live-feed"
      data-testid="live-winners-ticker"
      className="relative overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {t("home.marquee.title")}
        </span>
        {/* Wave 1.2 dedup: online-count chip removed (topbar OnlinePulse SOT). */}
        {reduced ? (
          <StaticLane rows={LANE_A} highlightTop />
        ) : (
          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <Lane rows={LANE_A} duration={24} highlightTop />
            <Lane rows={LANE_B} duration={30} reverse />
          </div>
        )}
      </div>
      <style>{`
        @keyframes marquee-x {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
