import { t } from "@/i18n";
import { LiveActivityFeed, type ActivityItem } from "@/components/fomo/LiveActivityFeed";
import { LeaderboardSnapshot } from "@/components/fomo/LeaderboardSnapshot";
import { SeasonProgressBar } from "@/components/fomo/SeasonProgressBar";
import { SlotMeter } from "@/components/fomo/SlotMeter";
import { WheelOfFortune } from "@/components/fomo/WheelOfFortune";

/**
 * Phase 12-F v0.3 §Y - Home FOMO Full Mount section.
 * REUSE-first composition. JackpotMeter intentionally NOT mounted (12-A).
 * Display-only: Wheel is disabled, no real RPC.
 */
const FEED: ActivityItem[] = [
  { id: "f1", kind: "self",   text: t("earn.feed.attendance"),  at: t("earn.feed.time.now") },
  { id: "f2", kind: "notice", text: t("earn.feed.preLaunch"),   at: t("earn.feed.time.hourAgo") },
  { id: "f3", kind: "self",   text: t("earn.feed.referral"),    at: t("earn.feed.time.yesterday") },
  { id: "f4", kind: "self",   text: t("earn.feed.attendance"),  at: t("earn.feed.time.hourAgo") },
  { id: "f5", kind: "notice", text: t("earn.feed.preLaunch"),   at: t("earn.feed.time.yesterday") },
];

export function FomoFullSection() {
  return (
    <section
      data-testid="fomo-section"
      className="grid gap-4"
    >
      <SeasonProgressBar percent={62} daysLeft={9} />
      <div className="grid gap-4 md:grid-cols-2">
        <div data-testid="fomo-live-feed">
          <LiveActivityFeed items={FEED} className="max-h-72 overflow-y-auto" />
        </div>
        <LeaderboardSnapshot />
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div data-testid="fomo-slot" className="self-center">
          <SlotMeter filled={847} total={1000} />
        </div>
        <div data-testid="fomo-wheel" className="flex justify-center">
          <WheelOfFortune disabled />
        </div>
      </div>
    </section>
  );
}
