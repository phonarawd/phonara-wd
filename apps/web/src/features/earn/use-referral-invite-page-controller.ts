import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  buildReferralInviteUrl,
  parseEarnHubReferralSnapshot,
  type EarnHubReferralSnapshot,
  resolveReferralShareCode,
} from '@/domain/referral-hub-display-contract';
import {
  buildReferralSharePayload,
  canUseWebShare,
  isReferralShareAbortError,
  REFERRAL_WEB_SHARE_MISSION_RPC,
  resolveReferralShareMissionSnapshot,
  type ReferralShareMissionSnapshot,
} from '@/domain/referral-invite-display-contract';
import { formatPhonRewardDisplay } from '@/domain/viral-missions-display-contract';
import {
  useViralMissionClaim,
  useViralMissionStatus,
  viralMissionKeys,
} from '@/features/earn/use-viral-missions';
import { PRODUCTION_SITE_ORIGIN } from '@/lib/production-site-origin';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const referralInvitePageKeys = {
  snapshot: (userId: string | null) => ['referral-invite-snapshot', userId] as const,
};

type ReferralInviteSnapshot = {
  referralCode: string;
  inviteUrl: string;
  hubReferral: EarnHubReferralSnapshot | null;
  shareMission: ReferralShareMissionSnapshot;
};

async function fetchReferralInviteSnapshot(userId: string): Promise<ReferralInviteSnapshot> {
  const [profileRes, hubRes, viralRes] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', userId).maybeSingle(),
    supabase.rpc('rpc_get_earn_hub_status'),
    supabase.rpc('rpc_get_viral_mission_status'),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (hubRes.error) throw hubRes.error;
  if (viralRes.error) throw viralRes.error;

  const referralCode = resolveReferralShareCode(userId, profileRes.data?.username ?? null);
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : PRODUCTION_SITE_ORIGIN;
  const viralPayload = viralRes.data as {
    missions?: Array<{
      mission: string;
      used: number;
      max: number;
      remaining: number;
      reward_phon: string;
    }>;
  } | null;

  return {
    referralCode,
    inviteUrl: buildReferralInviteUrl(origin, referralCode),
    hubReferral: parseEarnHubReferralSnapshot(hubRes.data as Record<string, unknown>),
    shareMission: resolveReferralShareMissionSnapshot(viralPayload?.missions),
  };
}

export type ReferralInvitePageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  referralCode: string;
  inviteUrl: string;
  hubReferral: EarnHubReferralSnapshot | null;
  shareRewardLabel: string;
  shareQuotaLabel: string;
  webShareAvailable: boolean;
  shareBusy: boolean;
  claimBusy: boolean;
  canClaimShareReward: boolean;
  copyCode: () => Promise<void>;
  copyInviteLink: () => Promise<void>;
  shareInvite: () => Promise<void>;
  claimShareReward: () => Promise<void>;
};

export function useReferralInvitePageController(): ReferralInvitePageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { status: viralStatus, loading: viralLoading } = useViralMissionStatus();
  const { claimViralMission, loading: claimLoading } = useViralMissionClaim();
  const [shareBusy, setShareBusy] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [actionError, setActionError] = useState<MessageKey | null>(null);

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: referralInvitePageKeys.snapshot(userId),
    queryFn: () => fetchReferralInviteSnapshot(userId!),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const shareMission = useMemo(() => {
    if (viralStatus?.missions) {
      return resolveReferralShareMissionSnapshot(viralStatus.missions);
    }
    return (
      snapshot?.shareMission ?? {
        rewardPhon: null,
        used: 0,
        max: 0,
        remaining: 0,
        canClaim: false,
      }
    );
  }, [snapshot?.shareMission, viralStatus?.missions]);

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

  const claimShareReward = useCallback(async () => {
    if (!userId || claimLoading || claimBusy || !shareMission.canClaim) return;
    setClaimBusy(true);
    setActionError(null);
    try {
      const clientRequestId = `referral-invite:${userId}:${REFERRAL_WEB_SHARE_MISSION_RPC}:${Date.now()}`;
      const result = await claimViralMission(REFERRAL_WEB_SHARE_MISSION_RPC, clientRequestId);
      if (result?.ok) {
        productToast.show({
          zone: 'warm',
          key: 'earn.mission.claimed',
          values: { reward: formatPhonRewardDisplay(result.phon_awarded) },
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: referralInvitePageKeys.snapshot(userId) }),
          queryClient.invalidateQueries({ queryKey: viralMissionKeys.status(userId) }),
        ]);
      }
    } catch (err) {
      setActionError(translateError(err, 'earn.mission.claimFailed'));
    } finally {
      setClaimBusy(false);
    }
  }, [claimBusy, claimLoading, claimViralMission, queryClient, shareMission.canClaim, userId]);

  const shareInvite = useCallback(async () => {
    if (!snapshot?.inviteUrl || !snapshot.referralCode || shareBusy) return;
    setShareBusy(true);
    setActionError(null);

    const payload = buildReferralSharePayload({
      shareTitle: t('referral.share.title'),
      shareText: t('referral.shareText', { code: snapshot.referralCode, url: snapshot.inviteUrl }),
      inviteUrl: snapshot.inviteUrl,
    });

    try {
      if (canUseWebShare()) {
        await navigator.share(payload);
      } else {
        await copyToClipboard(snapshot.inviteUrl, 'referral.toast.linkCopied');
        return;
      }

      productToast.show({ zone: 'warm', key: 'referral.shared' });
      if (shareMission.canClaim) {
        await claimShareReward();
      }
    } catch (err) {
      if (isReferralShareAbortError(err)) return;
      setActionError('referral.toast.shareFailed');
    } finally {
      setShareBusy(false);
    }
  }, [
    claimShareReward,
    copyToClipboard,
    shareBusy,
    shareMission.canClaim,
    snapshot?.inviteUrl,
    snapshot?.referralCode,
    t,
  ]);

  const copyCode = useCallback(async () => {
    if (!snapshot?.referralCode) return;
    await copyToClipboard(snapshot.referralCode, 'referral.toast.codeCopied');
  }, [copyToClipboard, snapshot?.referralCode]);

  const copyInviteLink = useCallback(async () => {
    if (!snapshot?.inviteUrl) return;
    await copyToClipboard(snapshot.inviteUrl, 'referral.toast.linkCopied');
  }, [copyToClipboard, snapshot?.inviteUrl]);

  const queryError = snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null;

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  const hubReferral = snapshot?.hubReferral ?? null;

  return {
    t,
    loading: authLoading || snapshotLoading || viralLoading,
    error: actionError ?? queryError,
    referralCode: snapshot?.referralCode ?? '',
    inviteUrl: snapshot?.inviteUrl ?? '',
    hubReferral,
    shareRewardLabel: shareMission.rewardPhon
      ? formatPhonRewardDisplay(shareMission.rewardPhon)
      : '—',
    shareQuotaLabel: hubReferral
      ? t('earn.referral.shareUnlimited', {
          remaining: hubReferral.payoutTodayRemaining,
          max: hubReferral.payoutTodayMax,
          multiplier: hubReferral.perFriendBonusMultiplier,
        })
      : t('referral.invite.quotaFallback', {
          remaining: shareMission.remaining,
          max: shareMission.max,
        }),
    webShareAvailable: canUseWebShare(),
    shareBusy,
    claimBusy,
    canClaimShareReward: shareMission.canClaim,
    copyCode,
    copyInviteLink,
    shareInvite,
    claimShareReward,
  };
}
