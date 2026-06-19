import { Outlet } from '@tanstack/react-router';
import { toast } from 'sonner';
import { PresentationRoot } from '../presentation-root';
import { ImportedEarnPage } from '../pages/earn-page';
import { EarnHomePage } from '../pages/earn-home-page';
import { EarnMissionsPage } from '../pages/earn-missions-page';
import { useEarnPageController } from '../../features/earn/use-earn-page-controller';
import { useViralMissionClaim } from '../../features/earn/use-viral-missions';
import { useT } from '../../lib/i18n';

const VIRAL_UI_TO_RPC: Record<string, string> = {
  'viral-shareLink': 'share_referral_link',
  'viral-invite3': 'invite_friend_signup',
  'viral-partnerHubVisit': 'affiliate_content_post',
  'viral-inviteWeekly': 'viral_streak_share',
};

function EarnLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center" aria-busy="true" data-testid="earn-loading">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

/** L2 Wave C — /earn layout + nested index/missions routes. */
export function EarnLayoutLovableSurface() {
  const { authLoading, layoutProps } = useEarnPageController();

  if (authLoading) {
    return (
      <PresentationRoot>
        <EarnLoading />
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      <ImportedEarnPage {...layoutProps} />
    </PresentationRoot>
  );
}

export function EarnHomeLovableSurface() {
  const { homeLoading, homeProps } = useEarnPageController();

  if (homeLoading) {
    return <EarnLoading />;
  }

  return <EarnHomePage {...homeProps} />;
}

export function EarnMissionsLovableSurface() {
  const t = useT();
  const { missionsLoading, missionItems } = useEarnPageController();
  const { claimViralMission } = useViralMissionClaim();

  const handleClaim = (id: string) => {
    const mission = VIRAL_UI_TO_RPC[id];
    if (!mission) {
      toast.error(t('earn.mission.claimUnavailable'));
      return;
    }
    void claimViralMission(mission).then((claimed) => {
      if (claimed?.ok) {
        toast.success(t('earn.mission.claimed', { reward: claimed.phon_awarded }));
      } else {
        toast.error(t('earn.mission.claimFailed'));
      }
    });
  };

  if (missionsLoading) {
    return <EarnLoading />;
  }

  return <EarnMissionsPage items={missionItems} onClaim={handleClaim} />;
}

/** @deprecated Use EarnLayoutLovableSurface — kept for barrel compatibility. */
export function EarnLovableSurface() {
  return (
    <>
      <EarnLayoutLovableSurface />
      <Outlet />
    </>
  );
}
