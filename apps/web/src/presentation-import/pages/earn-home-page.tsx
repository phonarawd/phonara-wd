/* Extracted from Lovable routes/earn.index.tsx — Wave-1 ADAPT */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";
import { DailyCheckIn } from "@/components/earn/DailyCheckIn";
import { RewardWalletCard } from "@/components/earn/RewardWalletCard";
import { SpinTicketStrip } from "@/components/earn/SpinTicketStrip";
import { ReferralQuickCard } from "@/components/earn/ReferralQuickCard";
import { WheelOfFortune } from "@/components/fomo/WheelOfFortune";
import { LiveActivityFeed } from "@/components/fomo/LiveActivityFeed";
import { SeasonProgressBar } from "@/components/fomo/SeasonProgressBar";
import { SlotMeter } from "@/components/fomo/SlotMeter";
import { GateBanner } from "@/components/ui/gate-banner";
import { EarnPayoutTicker } from "@/components/social/EarnPayoutTicker";
import { VelocityBridgeSheet } from "@/components/earn/VelocityBridgeSheet";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { EarnHomeViewProps } from "../../features/earn/use-earn-page-controller";

const STATIC_DEFAULTS = {
  days: [
    { label: t("earn.attendance.day", { n: 1 }), rewardLabel: "+1,000P", claimed: true },
    { label: t("earn.attendance.day", { n: 2 }), rewardLabel: "+1,000P", claimed: true },
    { label: t("earn.attendance.day", { n: 3 }), rewardLabel: "+1,000P", claimed: true },
    { label: t("earn.attendance.day", { n: 4 }), rewardLabel: "+1,500P", today: true },
    { label: t("earn.attendance.day", { n: 5 }), rewardLabel: "+2,000P" },
    { label: t("earn.attendance.day", { n: 6 }), rewardLabel: "+2,500P" },
    { label: t("earn.attendance.day", { n: 7 }), rewardLabel: "+5,000P" },
  ],
  streakLabel: t("earn.attendance.streakActive", { n: 3 }),
  todayRewardLabel: "+1,500P",
  pointsDisplay: "12,400P",
  referralCode: "—",
  inviteUrl: "",
  referralProgressLabel: t("earn.referral.progress", { done: 0, total: 5 }),
  ticketsDisplay: "3",
};

export type EarnHomePageProps = Partial<EarnHomeViewProps>;

export function EarnHomePage(props: EarnHomePageProps = {}) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [bridgeOpen, setBridgeOpen] = useState(false);

  const days = props.days ?? STATIC_DEFAULTS.days;
  const streakLabel = props.streakLabel ?? STATIC_DEFAULTS.streakLabel;
  const todayRewardLabel = props.todayRewardLabel ?? STATIC_DEFAULTS.todayRewardLabel;
  const pointsDisplay = props.pointsDisplay ?? STATIC_DEFAULTS.pointsDisplay;
  const referralCode = props.referralCode ?? STATIC_DEFAULTS.referralCode;
  const inviteUrl = props.inviteUrl ?? STATIC_DEFAULTS.inviteUrl;
  const referralProgressLabel = props.referralProgressLabel ?? STATIC_DEFAULTS.referralProgressLabel;
  const ticketsDisplay = props.ticketsDisplay ?? STATIC_DEFAULTS.ticketsDisplay;
  const wheelDisabled = props.wheelDisabled ?? false;

  return (
    <>
      <SeasonProgressBar percent={62} daysLeft={9} />

      <DailyCheckIn
        days={days}
        streakLabel={streakLabel}
        todayRewardLabel={todayRewardLabel}
        onClaim={props.onClaimDaily}
      />

      <RewardWalletCard
        pointsDisplay={pointsDisplay}
        usdtConvertibleDisplay="≈ 8.20 USDT"
        discountTicketsDisplay="×2"
        freeTradeTicketsDisplay="×1"
      />

      <div data-testid="fomo-slot">
        <SlotMeter filled={847} total={1000} />
      </div>

      <SpinTicketStrip
        ticketsDisplay={ticketsDisplay}
        onSpin={() => {
          wheelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          toast(t("earn.toast.wheelMove"));
        }}
      />

      <div id="wheel" data-testid="fomo-wheel">
        <Card ref={wheelRef}>
          <CardHeader>
            <CardTitle className="text-base">{t("earn.wheel.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <WheelOfFortune
              disabled={wheelDisabled}
              onEngineSpin={props.onWheelSpin}
              onSpinEnd={(r) => {
                if (r.won) setBridgeOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <VelocityBridgeSheet
        open={bridgeOpen}
        onOpenChange={setBridgeOpen}
        source="wheel"
      />

      <ReferralQuickCard
        code={referralCode}
        inviteUrl={inviteUrl}
        progressLabel={referralProgressLabel}
        rewardLabel={t("earn.referral.reward")}
      />

      <GateBanner kind="cooldown" />

      <div data-testid="fomo-live-feed">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("earn.activity.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LiveActivityFeed
              items={[
                {
                  id: "1",
                  kind: "self",
                  text: t("earn.feed.attendance"),
                  at: t("earn.feed.time.now"),
                },
                {
                  id: "2",
                  kind: "notice",
                  text: t("earn.feed.preLaunch"),
                  at: t("earn.feed.time.hourAgo"),
                },
                {
                  id: "3",
                  kind: "self",
                  text: t("earn.feed.referral"),
                  at: t("earn.feed.time.yesterday"),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <EarnPayoutTicker />
    </>
  );
}
