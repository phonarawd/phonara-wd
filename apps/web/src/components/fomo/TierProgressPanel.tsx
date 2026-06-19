import { Crown, Gem, Medal, Shield, Sparkles, Check } from "lucide-react";
import { Link } from "@/shims/react-router-dom";
import { t } from "@/i18n";

/**
 * 12-C v0.3 ??TierProgressPanel
 * 5-step loyalty ladder (Bronze ??Silver ??Gold ??Platinum ??Diamond).
 * Display-only mock. Current tier glow + XP progress to next.
 */

type TierId = "bronze" | "silver" | "gold" | "platinum" | "diamond";

const TIERS: ReadonlyArray<{
  id: TierId;
  Icon: typeof Crown;
  dot: string;
  ring: string;
}> = [
  { id: "bronze",   Icon: Medal,    dot: "bg-amber-700",   ring: "ring-amber-700/40" },
  { id: "silver",   Icon: Shield,   dot: "bg-zinc-300",    ring: "ring-zinc-300/40" },
  { id: "gold",     Icon: Crown,    dot: "bg-amber-400",   ring: "ring-amber-400/50" },
  { id: "platinum", Icon: Sparkles, dot: "bg-sky-300",     ring: "ring-sky-300/40" },
  { id: "diamond",  Icon: Gem,      dot: "bg-cyan-300",    ring: "ring-cyan-300/40" },
];

const CURRENT: TierId = "gold";
const XP_NOW = 12_400;
const XP_NEXT = 18_000;

export function TierProgressPanel() {
  const currentIdx = TIERS.findIndex((tier) => tier.id === CURRENT);
  const pct = Math.min(100, Math.round((XP_NOW / XP_NEXT) * 100));
  const nextTier = TIERS[currentIdx + 1] ?? TIERS[currentIdx] ?? TIERS[0]!;

  return (
    <section
      data-testid="fomo-tier-panel"
      aria-label={t("fomo.tier.currentBadge")}
      className="grid gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("fomo.tier.currentBadge")}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-(--color-warn)/15 px-2 py-0.5 text-[11px] font-semibold text-(--color-warn)">
          <Crown className="size-3" aria-hidden />
          {t(`fomo.tier.${CURRENT}.name`)}
        </span>
      </div>

      <ol
        className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-5 md:gap-3 md:overflow-visible"
        aria-label={t("fomo.tier.progressLabel")}
      >
        {TIERS.map((tier, idx) => {
          const completed = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = tier.Icon;
          return (
            <li
              key={tier.id}
              {...(isCurrent
                ? { "data-testid": "fomo-tier-current" }
                : { "data-testid": "fomo-tier-step" })}
              className={`relative grid min-h-12 min-w-[22%] snap-start place-items-center gap-1 rounded-xl border border-border/50 bg-background/40 px-2 py-2.5 transition-all md:min-w-0 ${
                isCurrent
                  ? `ring-2 ${tier.ring} shadow-[0_0_28px_-4px_color-mix(in_oklab,var(--color-warn)_50%,transparent)]`
                  : completed
                    ? "opacity-95"
                    : "opacity-50"
              }`}
            >
              <span
                className={`relative grid size-8 place-items-center rounded-full ${tier.dot}/20`}
              >
                <Icon
                  className={`size-4 ${isCurrent ? "text-(--color-warn)" : completed ? "text-emerald-400" : "text-muted-foreground"} ${isCurrent ? "animate-pulse motion-reduce:animate-none" : ""}`}
                  aria-hidden
                />
                {completed && (
                  <Check
                    className="absolute -right-1 -top-1 size-3 rounded-full bg-emerald-500 p-0.5 text-background"
                    aria-hidden
                  />
                )}
              </span>
              <span className="text-[11px] font-semibold tracking-tight">
                {t(`fomo.tier.${tier.id}.name`)}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            {t("fomo.tier.progressLabel")} ·{" "}
            <span className="font-medium text-foreground">
              {t(`fomo.tier.${nextTier.id}.name`)}
            </span>
          </span>
          <span className="font-mono font-semibold tabular-nums">
            {XP_NOW.toLocaleString("en-US")} / {XP_NEXT.toLocaleString("en-US")}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted/60"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-(--color-warn) to-amber-300 transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <Link
        to="/tier"
        data-testid="fomo-tier-guide-cta"
        className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 text-[11px] font-semibold text-foreground/90 transition-colors hover:bg-(--color-warn)/10 hover:text-(--color-warn)"
      >
        {t("tier.guide.title")}
      </Link>
    </section>
  );
}
