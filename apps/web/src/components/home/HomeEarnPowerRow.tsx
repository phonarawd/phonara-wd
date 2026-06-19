import { Link } from "@/shims/react-router-dom";
import { CalendarCheck, Target, RotateCw, Gift, UserPlus } from "lucide-react";
import { t } from "@/i18n";

const CARDS = [
  { id: "checkin", to: "/earn/missions", Icon: CalendarCheck, labelKey: "home.earn.power.checkin.label", rewardKey: "home.earn.power.checkin.reward", accent: "from-(--color-primary)/20 to-transparent" },
  { id: "mission", to: "/earn/missions", Icon: Target, labelKey: "home.earn.power.mission.label", rewardKey: "home.earn.power.mission.reward", accent: "from-emerald-500/20 to-transparent" },
  { id: "wheel", to: "/earn", hash: "wheel", Icon: RotateCw, labelKey: "home.earn.power.wheel.label", rewardKey: "home.earn.power.wheel.reward", accent: "from-(--color-warn)/20 to-transparent" },
  { id: "drop", to: "/earn/missions", Icon: Gift, labelKey: "home.earn.power.drop.label", rewardKey: "home.earn.power.drop.reward", accent: "from-pink-500/20 to-transparent" },
  { id: "invite", to: "/referral", Icon: UserPlus, labelKey: "home.earn.power.invite.label", rewardKey: "home.earn.power.invite.reward", accent: "from-sky-500/20 to-transparent" },
] as const;

export function HomeEarnPowerRow() {
  return (
    <section
      data-hub-id="home-earn-power"
      data-testid="home-earn-power"
      aria-label={t("home.earn.power.title")}
      className="flex min-w-0 max-w-full flex-col gap-2"
    >
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">
          {t("home.earn.power.title")}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {t("home.earn.power.subtitle")}
        </span>
      </div>
      <div className="-mx-3 flex min-w-0 max-w-full snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-1 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CARDS.map((card) => (
          <Link
            key={card.id}
            to={card.to}
            hash={"hash" in card ? card.hash : undefined}
            data-testid="home-earn-card"
            data-earn-id={card.id}
            className={`group relative flex h-24 w-40 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br ${card.accent} bg-card/70 p-3 transition hover:border-(--color-primary)/40 hover:shadow-[var(--shadow-soft)]`}
          >
            <div className="flex items-center justify-between">
              <card.Icon className="size-5 text-foreground/80" aria-hidden />
              <span className="rounded-full bg-(--color-primary)/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-(--color-primary)">
                {t(card.rewardKey)}
              </span>
            </div>
            <p className="text-sm font-semibold leading-tight text-foreground">
              {t(card.labelKey)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
