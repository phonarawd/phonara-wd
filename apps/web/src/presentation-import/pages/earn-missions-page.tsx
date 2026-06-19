/* Extracted from Lovable routes/earn.missions.tsx — Wave-1 ADAPT */
import { Card, CardContent } from "@/components/ui/card";
import {
  MissionChecklist,
  type MissionItem,
} from "@/components/earn/MissionChecklist";
import { MissionProgressHero } from "@/components/earn/MissionProgressHero";
import { Phase12MissionsFooter } from "@/components/earn/Phase12MissionsFooter";


// Phase 12-B v0.3.1 (A1) — 6-lane: A daily 2 + B growth 4 + C viral 5 + D weekly 5 + E tier 4 + F social 4
// id LOCK: {lane}-{camelCase}. A/B 6 baseline ids preserved.
export const EARN_STATIC_MISSIONS: MissionItem[] = [
    // A — daily (2)
    {
      id: "daily-todaySpin",
      titleKey: "mission.daily.todaySpin",
      rewardLabel: "+200P",
      progressLabel: "0 / 1",
      status: "claimable",
      lane: "daily",
    },
    {
      id: "daily-streak7",
      titleKey: "mission.daily.streak7",
      rewardLabel: "+5,000P",
      progressLabel: "3 / 7",
      status: "todo",
      lane: "daily",
    },
    // Wave 3R — daily quiz micro (no ad-watch / survey-ad per product policy)
    {
      id: "daily-quiz",
      titleKey: "mission.daily.quiz",
      rewardLabel: "+200P",
      progressLabel: "0 / 1",
      status: "claimable",
      lane: "daily",
    },
    // B — growth (4 full)
    {
      id: "growth-completeProfile",
      titleKey: "mission.growth.completeProfile",
      rewardLabel: "+500P",
      progressLabel: "0 / 1",
      status: "claimable",
      lane: "growth",
    },
    {
      id: "growth-firstGame",
      titleKey: "mission.growth.firstGame",
      rewardLabel: "+1,000P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "growth",
    },
    {
      id: "growth-firstDeposit",
      titleKey: "mission.growth.firstDeposit",
      rewardLabel: "+3,000P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "growth",
    },
    {
      id: "growth-kyc",
      titleKey: "mission.growth.kyc",
      rewardLabel: "+2,000P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "growth",
    },
    // C — viral (1 baseline + 4 preview = 5)
    {
      id: "viral-invite1",
      titleKey: "mission.viral.invite1",
      rewardLabel: "+10,000P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "viral",
      soon: true,
    },
    {
      id: "viral-invite3",
      titleKey: "mission.viral.invite3",
      rewardLabel: "+30,000P",
      progressLabel: "0 / 3",
      status: "todo",
      lane: "viral",
      soon: true,
    },
    {
      id: "viral-partnerHubVisit",
      titleKey: "mission.viral.partnerHubVisit",
      rewardLabel: "+500P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "viral",
      soon: true,
    },
    {
      id: "viral-shareLink",
      titleKey: "mission.viral.shareLink",
      rewardLabel: "+300P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "viral",
      soon: true,
    },
    {
      id: "viral-inviteWeekly",
      titleKey: "mission.viral.inviteWeekly",
      rewardLabel: "+2,000P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "viral",
      soon: true,
    },
    // D — weekly (1 baseline + 4 preview = 5)
    {
      id: "weekly-play5",
      titleKey: "mission.weekly.play5",
      rewardLabel: "+2,000P",
      progressLabel: "0 / 5",
      status: "todo",
      lane: "weekly",
      soon: true,
    },
    {
      id: "weekly-win3",
      titleKey: "mission.weekly.win3",
      rewardLabel: "+3,000P",
      progressLabel: "0 / 3",
      status: "todo",
      lane: "weekly",
      soon: true,
    },
    {
      id: "weekly-depositOnce",
      titleKey: "mission.weekly.depositOnce",
      rewardLabel: "+1,500P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "weekly",
      soon: true,
    },
    {
      id: "weekly-spinDaily",
      titleKey: "mission.weekly.spinDaily",
      rewardLabel: "+1,000P",
      progressLabel: "0 / 7",
      status: "todo",
      lane: "weekly",
      soon: true,
    },
    {
      id: "weekly-loginAll",
      titleKey: "mission.weekly.loginAll",
      rewardLabel: "+800P",
      progressLabel: "0 / 7",
      status: "todo",
      lane: "weekly",
      soon: true,
    },
    // E — tier (1 baseline + 3 preview = 4)
    {
      id: "tier-reachSilver",
      titleKey: "mission.tier.reachSilver",
      rewardLabel: "+5,000P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "tier",
      soon: true,
    },
    {
      id: "tier-reachGold",
      titleKey: "mission.tier.reachGold",
      rewardLabel: "+15,000P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "tier",
      soon: true,
    },
    {
      id: "tier-fomoStreak",
      titleKey: "mission.tier.fomoStreak",
      rewardLabel: "+10,000P",
      progressLabel: "0 / 30",
      status: "todo",
      lane: "tier",
      soon: true,
    },
    {
      id: "tier-keepStatus",
      titleKey: "mission.tier.keepStatus",
      rewardLabel: "+4,000P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "tier",
      soon: true,
    },
    // F — social (1 baseline + 3 preview = 4)
    {
      id: "social-followX",
      titleKey: "mission.social.followX",
      rewardLabel: "+300P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "social",
      soon: true,
    },
    {
      id: "social-joinTelegram",
      titleKey: "mission.social.joinTelegram",
      rewardLabel: "+300P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "social",
      soon: true,
    },
    {
      id: "social-shareWin",
      titleKey: "mission.social.shareWin",
      rewardLabel: "+500P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "social",
      soon: true,
    },
    {
      id: "social-joinDiscord",
      titleKey: "mission.social.joinDiscord",
      rewardLabel: "+300P",
      progressLabel: "0 / 1",
      status: "todo",
      lane: "social",
      soon: true,
    },
];

export type EarnMissionsPageProps = {
  items?: MissionItem[];
  onClaim?: (id: string) => void;
};

export function EarnMissionsPage({ items, onClaim }: EarnMissionsPageProps = {}) {
  const missions = items ?? EARN_STATIC_MISSIONS;

  return (
    <Card>
      <CardContent className="p-5">
        <MissionProgressHero />
        <MissionChecklist items={missions} onClaim={onClaim} />
        <Phase12MissionsFooter />
      </CardContent>
    </Card>
  );
}
