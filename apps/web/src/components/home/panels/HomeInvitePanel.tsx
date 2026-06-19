import { HomeReferralTeaserCard } from "../HomeReferralTeaserCard";
import { ReferralShareCard } from "../ReferralShareCard";

export function HomeInvitePanel() {
  return (
    <div className="flex flex-col gap-3" data-hub-id="home-invite">
      <HomeReferralTeaserCard />
      <ReferralShareCard />
    </div>
  );
}
