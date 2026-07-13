import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';
import type { MissionItem } from '@phonara/shared-types';

import { useAuth } from '@/contexts/auth-context';
import { EARN_STATIC_MISSIONS } from '@/data/earn-static-missions';
import {
  filterCuratedReferralMissionItems,
  HOME_MISSIONS_REFERRAL_ENGINE_ONE_SHOT,
  HOME_MISSIONS_REFERRAL_UI_IDS,
} from '@/domain/home-missions-referral-display-contract';
import {
  resolveHomeMissionCtaRoute,
  resolveHomeMissionRepeatableRpc,
  resolveHomeMissionViralRpc,
} from '@/domain/home-missions-display-contract';
import {
  parseEarnHubReferralSnapshot,
  REFERRAL_HUB_ROUTE,
  type EarnHubReferralSnapshot,
} from '@/domain/referral-hub-display-contract';
import {
  formatPhonRewardDisplay,
  mapMissionStatusToCardState,
  mergeE12MissionItems,
  resolveMissionClaimBlocked,
  type MissionCardDisplayState,
} from '@/domain/viral-missions-display-contract';
import { normalizeEarnVipTier, type EarnVipTier } from '@/domain/unified-tier-display-contract';
import {
  useRepeatableMissionClaim,
  useRepeatableMissionStatus,
  repeatableMissionKeys,
} from '@/features/earn/use-repeatable-missions';
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

export const homeMissionsReferralPageKeys = {
  snapshot: (userId: string | null) => ['home-missions-referral-snapshot', userId] as const,
};

type HomeMissionsReferralSnapshot = {
  hubReferral: EarnHubReferralSnapshot | null;
  earnTier: EarnVipTier;
  engineMissions: Array<{ mission: string; completed_at: string | null }>;
};

async function fetchHomeMissionsReferralSnapshot(
  userId: string,
): Promise<HomeMissionsReferralSnapshot> {
  const [hubData, missionsRes] = await Promise.all([
    callRpc('rpc_get_earn_hub_status'),
    supabase
      .from('missions')
      .select('mission, completed_at')
      .eq('user_id', userId)
      .eq('mission', HOME_MISSIONS_REFERRAL_ENGINE_ONE_SHOT)
      .maybeSingle(),
  ]);

  if (missionsRes.error) throw missionsRes.error;

  const hubPayload = hubData as Record<string, unknown>;

  return {
    hubReferral: parseEarnHubReferralSnapshot(hubPayload),
    earnTier: normalizeEarnVipTier(
      typeof hubPayload?.['tier'] === 'string' ? hubPayload['tier'] : null,
    ),
    engineMissions: missionsRes.data?.completed_at
      ? [
          {
            mission: HOME_MISSIONS_REFERRAL_ENGINE_ONE_SHOT,
            completed_at: missionsRes.data.completed_at,
          },
        ]
      : [],
  };
}

export type HomeMissionsReferralCardView = {
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
  repeatableRpc: string | null;
};

export type HomeMissionsReferralPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  hubReferral: EarnHubReferralSnapshot | null;
  earnTier: EarnVipTier;
  referralHubRoute: string;
  missions: HomeMissionsReferralCardView[];
  completedCount: number;
  totalVisibleCount: number;
  claimingMission: string | null;
  claimMission: (missionId: string) => Promise<void>;
};

export function useHomeMissionsReferralPageController(): HomeMissionsReferralPageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { status: viralStatus, loading: viralLoading } = useViralMissionStatus();
  const { status: repeatableStatus, loading: repeatableLoading } =
    useRepeatableMissionStatus('all');
  const { claimViralMission, loading: viralClaimLoading } = useViralMissionClaim();
  const { claimMission: claimRepeatableMission, loading: repeatableClaimLoading } =
    useRepeatableMissionClaim();
  const [claimingMission, setClaimingMission] = useState<string | null>(null);
  const [actionError, setActionError] = useState<MessageKey | null>(null);

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: homeMissionsReferralPageKeys.snapshot(userId),
    queryFn: () => fetchHomeMissionsReferralSnapshot(userId!),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const staticReferralMissions = useMemo(() => {
    const byId = new Map(
      EARN_STATIC_MISSIONS.filter((item) =>
        (HOME_MISSIONS_REFERRAL_UI_IDS as readonly string[]).includes(item.id),
      ).map((item) => [item.id, item]),
    );
    return HOME_MISSIONS_REFERRAL_UI_IDS.map((id) => byId.get(id)).filter(
      (item): item is MissionItem => Boolean(item),
    );
  }, []);

  const mergedMissions: MissionItem[] = useMemo(() => {
    if (!viralStatus && !repeatableStatus) return staticReferralMissions;
    return filterCuratedReferralMissionItems(
      mergeE12MissionItems({
        staticItems: staticReferralMissions,
        engineMissions: snapshot?.engineMissions ?? [],
        viralRows: viralStatus?.missions ?? [],
        repeatableRows: repeatableStatus?.missions ?? [],
        streakDays: viralStatus?.streak_days,
        streakTargetDays: viralStatus?.streak_target_days,
      }),
    );
  }, [repeatableStatus, snapshot?.engineMissions, staticReferralMissions, viralStatus]);

  const missions: HomeMissionsReferralCardView[] = useMemo(() => {
    return mergedMissions.map((mission) => {
      const state = mapMissionStatusToCardState(mission.status);
      const viralRpc = resolveHomeMissionViralRpc(mission.id);
      const repeatableRpc = resolveHomeMissionRepeatableRpc(mission.id);
      const claimBlocked = resolveMissionClaimBlocked({
        authenticated: Boolean(userId),
        uiId: mission.id,
      });
      const canClaim =
        state === 'reward_pending' &&
        !claimBlocked &&
        Boolean(viralRpc || repeatableRpc) &&
        !mission.soon;

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
        repeatableRpc,
      };
    });
  }, [mergedMissions, userId]);

  const completedCount = missions.filter((mission) => mission.state === 'completed').length;

  const claimMission = useCallback(
    async (missionId: string) => {
      if (!userId || viralClaimLoading || repeatableClaimLoading) return;
      const viralRpc = resolveHomeMissionViralRpc(missionId);
      const repeatableRpc = resolveHomeMissionRepeatableRpc(missionId);
      const rpc = viralRpc ?? repeatableRpc;
      if (!rpc) return;

      setClaimingMission(missionId);
      setActionError(null);
      try {
        const clientRequestId = `home-missions-referral:${userId}:${rpc}:${Date.now()}`;
        const result = viralRpc
          ? await claimViralMission(viralRpc, clientRequestId)
          : await claimRepeatableMission(repeatableRpc!, clientRequestId);
        if (result?.ok) {
          productToast.show({
            zone: 'warm',
            key: 'earn.mission.claimed',
            values: { reward: formatPhonRewardDisplay(result.phon_awarded) },
          });
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: homeMissionsReferralPageKeys.snapshot(userId),
            }),
            queryClient.invalidateQueries({ queryKey: viralMissionKeys.status(userId) }),
            queryClient.invalidateQueries({
              queryKey: repeatableMissionKeys.status(userId, 'all'),
            }),
          ]);
        }
      } catch (err) {
        setActionError(translateError(err, 'earn.mission.claimFailed'));
      } finally {
        setClaimingMission(null);
      }
    },
    [
      claimRepeatableMission,
      claimViralMission,
      queryClient,
      repeatableClaimLoading,
      userId,
      viralClaimLoading,
    ],
  );

  const queryError = snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null;

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  return {
    t,
    loading: authLoading || snapshotLoading || viralLoading || repeatableLoading,
    error: actionError ?? queryError,
    hubReferral: snapshot?.hubReferral ?? null,
    earnTier: snapshot?.earnTier ?? 'bronze',
    referralHubRoute: REFERRAL_HUB_ROUTE,
    missions,
    completedCount,
    totalVisibleCount: missions.length,
    claimingMission,
    claimMission,
  };
}
