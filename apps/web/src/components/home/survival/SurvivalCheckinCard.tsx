import { Link } from "@/shims/react-router-dom";
import { t } from "@/i18n";
import { useSurvivalWindow, type SurvivalPhase } from "@/hooks/useSurvivalWindow";
import { useSurvivalCheckin } from "@/hooks/useSurvivalCheckin";
import { useScriptedParticipantCount } from "@/hooks/useScriptedParticipantCount";
import { SurvivalWindowStatus } from "./SurvivalWindowStatus";
import { SurvivalParticipantCounter } from "./SurvivalParticipantCounter";
import { SurvivalRankReveal } from "./SurvivalRankReveal";
import { SurvivalTierTable } from "./SurvivalTierTable";
import { SurvivalFriendRanking } from "./SurvivalFriendRanking";

export type SurvivalCheckinCardProps = {
  className?: string;
  /** DEV/vitest only — production uses real KST clock FSM */
  forcePhase?: SurvivalPhase;
};

export function SurvivalCheckinCard({ className, forcePhase }: SurvivalCheckinCardProps) {
  const window = useSurvivalWindow({}, forcePhase);
  const { count, bumpTick, bump } = useScriptedParticipantCount();
  const { checkedInToday, scriptedRank, tierBand, onCheckIn } = useSurvivalCheckin({
    phase: window.phase,
    onParticipantBump: bump,
  });

  const ctaDisabled = window.phase !== "open";
  const ctaLabel =
    window.phase === "before"
      ? t("earn.survival.cta.wait")
      : window.phase === "closed"
        ? t("earn.survival.cta.closed")
        : checkedInToday
          ? t("earn.survival.cta.closed")
          : t("earn.survival.cta.checkIn");

  return (
    <section
      data-testid="survival-checkin-card"
      data-hub-id="home-survival"
      className={
        "relative isolate overflow-hidden rounded-xl border border-border p-4 md:p-5 " +
        (className ?? "")
      }
      style={{
        backgroundImage:
          "radial-gradient(60% 80% at 85% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%)",
      }}
    >
      <p className="mb-2 text-[10px] font-medium text-muted-foreground">{t("earn.survival.mockNotice")}</p>

      <div className="mb-2 flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-(--color-primary)">
          {t("earn.survival.eyebrow")}
        </span>
        <h2 className="text-lg font-bold text-foreground">{t("earn.survival.headline")}</h2>
        <p className="text-xs text-muted-foreground">{t("earn.survival.subline")}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(200px,280px)]">
        <div className="flex min-w-0 flex-col gap-3">
          <SurvivalWindowStatus window={window} />
          <SurvivalParticipantCounter count={count} bumpTick={bumpTick} />

          <button
            type="button"
            data-testid="survival-checkin-cta"
            aria-label={t("earn.survival.cta.aria")}
            disabled={ctaDisabled || checkedInToday}
            aria-disabled={ctaDisabled || checkedInToday}
            onClick={onCheckIn}
            className={
              "min-h-12 w-full rounded-xl px-4 py-3 text-base font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) " +
              (ctaDisabled || checkedInToday
                ? "cursor-not-allowed border border-border bg-muted/30 text-muted-foreground"
                : "border border-(--color-primary)/40 bg-primary text-primary-foreground shadow-[var(--shadow-glow-cta)] active:scale-[0.98]")
            }
          >
            {ctaLabel}
          </button>

          <SurvivalRankReveal rank={scriptedRank} tierBand={tierBand} />
          <SurvivalTierTable />

          <Link
            to="/earn/missions"
            className="inline-block text-xs font-semibold text-(--color-primary) underline-offset-2 hover:underline"
          >
            {t("earn.survival.link.earn")}
          </Link>
        </div>

        <SurvivalFriendRanking userRank={scriptedRank} />
      </div>
    </section>
  );
}

SurvivalCheckinCard.displayName = "SurvivalCheckinCard";
