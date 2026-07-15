import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';
import type { MissionItem } from '@phonara/shared-types';

import { useAuth } from '@/contexts/auth-context';
import { EARN_STATIC_MISSIONS } from '@/data/earn-static-missions';
import {
  buildReferralInviteUrl,
  maskReferredUserLabel,
  parseEarnHubReferralSnapshot,
  REFERRAL_HUB_VIRAL_MISSION_UI_IDS,
  type EarnHubReferralSnapshot,
  type ReferralHubReferralRow,
  resolveReferralShareCode,
  sumPaidReferralRewards,
} from '@/domain/referral-hub-display-contract';
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
import { PRODUCTION_SITE_ORIGIN } from '@/lib/production-site-origin';
import { callRpc } from '@/lib/rpc';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const referralPageKeys = {
  dashboard: (userId: string | null) => ['referral-dashboard', userId] as const,
};

type ReferralDashboardSnapshot = {
  username: string | null;
  referralCode: string;
  inviteUrl: string;
  hubReferral: EarnHubReferralSnapshot | null;
  totalPaidRewardsPhon: string;
  treeRows: ReferralHubReferralRow[];
  engineMissions: Array<{ mission: string; completed_at: string | null }>;
};

async function fetchReferralDashboard(userId: string): Promise<ReferralDashboardSnapshot> {
  const [profileRes, hubData, referralsRes, missionsRes] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', userId).maybeSingle(),
    callRpc('rpc_get_earn_hub_status'),
    supabase
      .from('referrals')
      .select('id, referred_id, referrer_phon, created_at, rewarded_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('missions')
      .select('mission, completed_at')
      .eq('user_id', userId)
      .eq('mission', 'invite_3_friends')
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (referralsRes.error) throw referralsRes.error;
  if (missionsRes.error) throw missionsRes.error;

  const referralCode = resolveReferralShareCode(userId, profileRes.data?.username ?? null);
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : PRODUCTION_SITE_ORIGIN;

  const treeRows: ReferralHubReferralRow[] = (referralsRes.data ?? []).map((row) => ({
    id: row.id,
    referredId: row.referred_id,
    state: row.rewarded_at ? 'paid' : 'pending',
    referrerPhon: row.referrer_phon,
    createdAt: row.created_at,
    rewardedAt: row.rewarded_at,
  }));

  return {
    username: profileRes.data?.username ?? null,
    referralCode,
    inviteUrl: buildReferralInviteUrl(origin, referralCode),
    hubReferral: parseEarnHubReferralSnapshot(hubData as Record<string, unknown>),
    totalPaidRewardsPhon: sumPaidReferralRewards(
      treeRows.map((row) => ({ state: row.state, referrerPhon: row.referrerPhon })),
    ),
    treeRows,
    engineMissions: missionsRes.data?.completed_at
      ? [{ mission: 'invite_3_friends', completed_at: missionsRes.data.completed_at }]
      : [],
  };
}

export type ReferralMissionCardView = {
  id: string;
  titleKey: MessageKey;
  rewardLabel: string;
  rewardPhon?: string;
  progressLabel: string;
  state: MissionCardDisplayState;
  claimBlocked: boolean;
  viralRpc: string | null;
};

export type ReferralPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  referralCode: string;
  inviteUrl: string;
  hubReferral: EarnHubReferralSnapshot | null;
  totalPaidRewardsLabel: string;
  treeRows: ReferralHubReferralRow[];
  missions: ReferralMissionCardView[];
  claimingMission: string | null;
  copyCode: () => Promise<void>;
  copyInviteLink: () => Promise<void>;
  claimMission: (viralRpc: string) => Promise<void>;
  maskReferredLabel: (referredId: string) => string;
};

export function useReferralPageController(): ReferralPageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { status: viralStatus, loading: viralLoading } = useViralMissionStatus();
  const { claimViralMission, loading: claimLoading } = useViralMissionClaim();
  const [claimingMission, setClaimingMission] = useState<string | null>(null);
  const [actionError, setActionError] = useState<MessageKey | null>(null);

  const {
    data: dashboard = null,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: referralPageKeys.dashboard(userId),
    queryFn: () => fetchReferralDashboard(userId!),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const staticReferralMissions = useMemo(() => {
    const byId = new Map(
      EARN_STATIC_MISSIONS.filter((item) =>
        (REFERRAL_HUB_VIRAL_MISSION_UI_IDS as readonly string[]).includes(item.id),
      ).map((item) => [item.id, item]),
    );
    return REFERRAL_HUB_VIRAL_MISSION_UI_IDS.map((id) => byId.get(id)).filter(
      (item): item is MissionItem => Boolean(item),
    );
  }, []);

  const mergedMissions: MissionItem[] = useMemo(() => {
    if (!viralStatus) return staticReferralMissions;
    return mergeE12MissionItems({
      staticItems: staticReferralMissions,
      engineMissions: dashboard?.engineMissions ?? [],
      viralRows: viralStatus.missions ?? [],
      repeatableRows: [],
      streakDays: viralStatus.streak_days,
      streakTargetDays: viralStatus.streak_target_days,
    });
  }, [dashboard?.engineMissions, staticReferralMissions, viralStatus]);

  const missions: ReferralMissionCardView[] = useMemo(() => {
    return mergedMissions.map((mission) => {
      const viralRpc =
        mission.id === 'viral-shareLink'
          ? 'share_referral_link'
          : mission.id === 'viral-invite3'
            ? 'invite_friend_signup'
            : mission.id === 'viral-inviteWeekly'
              ? 'viral_streak_share'
              : null;

      return {
        id: mission.id,
        titleKey: mission.titleKey as MessageKey,
        rewardLabel: mission.rewardLabel,
        rewardPhon: mission.rewardPhon,
        progressLabel: mission.progressLabel,
        state: mapMissionStatusToCardState(mission.status),
        claimBlocked: resolveMissionClaimBlocked({
          authenticated: Boolean(userId),
          uiId: mission.id,
        }),
        viralRpc,
      };
    });
  }, [mergedMissions, userId]);

  const copyToClipboard = useCallback(async (text: string, successKey: MessageKey) => {
    setActionError(null);
    try {
      if (!navigator.clipboard?.writeText) {
        setActionError('referral.toast.clipboardUnavailable');
        return;
      }
      await navigator.clipboard.writeText(text);
      productToast.show({ zone: 'warm', key: successKey });
    } catch {
      setActionError('referral.toast.clipboardUnavailable');
    }
  }, []);

  const copyCode = useCallback(async () => {
    if (!dashboard?.referralCode) return;
    await copyToClipboard(dashboard.referralCode, 'referral.toast.codeCopied');
  }, [copyToClipboard, dashboard?.referralCode]);

  const copyInviteLink = useCallback(async () => {
    if (!dashboard?.inviteUrl) return;
    await copyToClipboard(dashboard.inviteUrl, 'referral.toast.linkCopied');
  }, [copyToClipboard, dashboard?.inviteUrl]);

  const claimMission = useCallback(
    async (viralRpc: string) => {
      if (!userId || claimLoading) return;
      setClaimingMission(viralRpc);
      setActionError(null);
      try {
        const clientRequestId = `referral-hub:${userId}:${viralRpc}:${Date.now()}`;
        const result = await claimViralMission(viralRpc, clientRequestId);
        if (result?.ok) {
          productToast.show({
            zone: 'warm',
            key: 'earn.mission.claimed',
            values: { reward: formatPhonRewardDisplay(result.phon_awarded) },
          });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: referralPageKeys.dashboard(userId) }),
            queryClient.invalidateQueries({ queryKey: viralMissionKeys.status(userId) }),
          ]);
        }
      } catch (err) {
        setActionError(translateError(err, 'earn.mission.claimFailed'));
      } finally {
        setClaimingMission(null);
      }
    },
    [claimLoading, claimViralMission, queryClient, userId],
  );

  const queryError = dashboardError ? translateError(dashboardError, 'error.UNKNOWN') : null;

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  return {
    t,
    loading: authLoading || dashboardLoading || viralLoading,
    error: actionError ?? queryError,
    referralCode: dashboard?.referralCode ?? '',
    inviteUrl: dashboard?.inviteUrl ?? '',
    hubReferral: dashboard?.hubReferral ?? null,
    totalPaidRewardsLabel: dashboard
      ? formatPhonRewardDisplay(dashboard.totalPaidRewardsPhon)
      : '—',
    treeRows: dashboard?.treeRows ?? [],
    missions,
    claimingMission,
    copyCode,
    copyInviteLink,
    claimMission,
    maskReferredLabel: maskReferredUserLabel,
  };
}
