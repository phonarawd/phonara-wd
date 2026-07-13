import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';
import type { MissionItem } from '@phonara/shared-types';

import { useAuth } from '@/contexts/auth-context';
import { EARN_STATIC_MISSIONS } from '@/data/earn-static-missions';
import {
  filterCuratedInviteMissionItems,
  HOME_MISSIONS_INVITE_ENGINE_ONE_SHOT,
  HOME_MISSIONS_INVITE_UI_IDS,
} from '@/domain/home-missions-invite-display-contract';
import {
  resolveHomeMissionCtaRoute,
  resolveHomeMissionViralRpc,
} from '@/domain/home-missions-display-contract';
import {
  parseEarnHubReferralSnapshot,
  type EarnHubReferralSnapshot,
} from '@/domain/referral-hub-display-contract';
import { REFERRAL_INVITE_ROUTE } from '@/domain/referral-invite-display-contract';
import {
  formatPhonRewardDisplay,
  mapMissionStatusToCardState,
  mergeE12MissionItems,
  resolveMissionClaimBlocked,
  type MissionCardDisplayState,
} from '@/domain/viral-missions-display-contract';
import {
  useViralMissionClaim,
  useViralMissionStatus,
  viralMissionKeys,
} from '@/features/earn/use-viral-missions';
import { callRpc } from '@/lib/rpc';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const homeMissionsInvitePageKeys = {
  snapshot: (userId: string | null) => ['home-missions-invite-snapshot', userId] as const,
};

type HomeMissionsInviteSnapshot = {
  hubReferral: EarnHubReferralSnapshot | null;
  engineMissions: Array<{ mission: string; completed_at: string | null }>;
};

async function fetchHomeMissionsInviteSnapshot(
  userId: string,
): Promise<HomeMissionsInviteSnapshot> {
  const [hubData, missionsRes] = await Promise.all([
    callRpc('rpc_get_earn_hub_status'),
    supabase
      .from('missions')
      .select('mission, completed_at')
      .eq('user_id', userId)
      .eq('mission', HOME_MISSIONS_INVITE_ENGINE_ONE_SHOT)
      .maybeSingle(),
  ]);

  if (missionsRes.error) throw missionsRes.error;

  return {
    hubReferral: parseEarnHubReferralSnapshot(hubData as Record<string, unknown>),
    engineMissions: missionsRes.data?.completed_at
      ? [
          {
            mission: HOME_MISSIONS_INVITE_ENGINE_ONE_SHOT,
            completed_at: missionsRes.data.completed_at,
          },
        ]
      : [],
  };
}

export type HomeMissionsInviteCardView = {
  id: string;
  titleKey: MessageKey;
  rewardLabel: string;
  rewardPhon?: string;
  progressLabel: string;
  state: MissionCardDisplayState;
  claimBlocked: boolean;
  canClaim: boolean;
  ctaRoute: string | null;
  viralRpc: string | null;
};

export type HomeMissionsInvitePageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  hubReferral: EarnHubReferralSnapshot | null;
  inviteShareRoute: string;
  missions: HomeMissionsInviteCardView[];
  completedCount: number;
  totalVisibleCount: number;
  claimingMission: string | null;
  claimMission: (missionId: string) => Promise<void>;
};

export function useHomeMissionsInvitePageController(): HomeMissionsInvitePageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { status: viralStatus, loading: viralLoading } = useViralMissionStatus();
  const { claimViralMission, loading: viralClaimLoading } = useViralMissionClaim();
  const [claimingMission, setClaimingMission] = useState<string | null>(null);
  const [actionError, setActionError] = useState<MessageKey | null>(null);

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: homeMissionsInvitePageKeys.snapshot(userId),
    queryFn: () => fetchHomeMissionsInviteSnapshot(userId!),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const staticInviteMissions = useMemo(() => {
    const byId = new Map(
      EARN_STATIC_MISSIONS.filter((item) =>
        (HOME_MISSIONS_INVITE_UI_IDS as readonly string[]).includes(item.id),
      ).map((item) => [item.id, item]),
    );
    return HOME_MISSIONS_INVITE_UI_IDS.map((id) => byId.get(id)).filter(
      (item): item is MissionItem => Boolean(item),
    );
  }, []);

  const mergedMissions: MissionItem[] = useMemo(() => {
    if (!viralStatus) return staticInviteMissions;
    return filterCuratedInviteMissionItems(
      mergeE12MissionItems({
        staticItems: staticInviteMissions,
        engineMissions: snapshot?.engineMissions ?? [],
        viralRows: viralStatus.missions ?? [],
        repeatableRows: [],
        streakDays: viralStatus.streak_days,
        streakTargetDays: viralStatus.streak_target_days,
      }),
    );
  }, [snapshot?.engineMissions, staticInviteMissions, viralStatus]);

  const missions: HomeMissionsInviteCardView[] = useMemo(() => {
    return mergedMissions.map((mission) => {
      const state = mapMissionStatusToCardState(mission.status);
      const viralRpc = resolveHomeMissionViralRpc(mission.id);
      const claimBlocked = resolveMissionClaimBlocked({
        authenticated: Boolean(userId),
        uiId: mission.id,
      });
      const canClaim =
        state === 'reward_pending' && !claimBlocked && Boolean(viralRpc) && !mission.soon;

      return {
        id: mission.id,
        titleKey: mission.titleKey as MessageKey,
        rewardLabel: mission.rewardLabel,
        rewardPhon: mission.rewardPhon,
        progressLabel: mission.progressLabel,
        state,
        claimBlocked,
        canClaim,
        ctaRoute: state === 'in_progress' ? resolveHomeMissionCtaRoute(mission.id) : null,
        viralRpc,
      };
    });
  }, [mergedMissions, userId]);

  const completedCount = missions.filter((mission) => mission.state === 'completed').length;

  const claimMission = useCallback(
    async (missionId: string) => {
      if (!userId || viralClaimLoading) return;
      const viralRpc = resolveHomeMissionViralRpc(missionId);
      if (!viralRpc) return;

      setClaimingMission(missionId);
      setActionError(null);
      try {
        const clientRequestId = `home-missions-invite:${userId}:${viralRpc}:${Date.now()}`;
        const result = await claimViralMission(viralRpc, clientRequestId);
        if (result?.ok) {
          productToast.show({
            zone: 'warm',
            key: 'earn.mission.claimed',
            values: { reward: formatPhonRewardDisplay(result.phon_awarded) },
          });
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: homeMissionsInvitePageKeys.snapshot(userId),
            }),
            queryClient.invalidateQueries({ queryKey: viralMissionKeys.status(userId) }),
          ]);
        }
      } catch (err) {
        setActionError(translateError(err, 'earn.mission.claimFailed'));
      } finally {
        setClaimingMission(null);
      }
    },
    [claimViralMission, queryClient, userId, viralClaimLoading],
  );

  const queryError = snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null;

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  return {
    t,
    loading: authLoading || snapshotLoading || viralLoading,
    error: actionError ?? queryError,
    hubReferral: snapshot?.hubReferral ?? null,
    inviteShareRoute: REFERRAL_INVITE_ROUTE,
    missions,
    completedCount,
    totalVisibleCount: missions.length,
    claimingMission,
    claimMission,
  };
}
