import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  buildReferralInviteUrl,
  resolveReferralShareCode,
} from '@/domain/referral-hub-display-contract';
import {
  buildShareEarningsSharePayload,
  canShareImageFiles,
  canUseWebShare,
  isReferralShareAbortError,
  REFERRAL_WEB_SHARE_MISSION_RPC,
  renderShareEarningsCanvasBlob,
  resolveReferralShareMissionFromRows,
  resolveShareEarningsCardView,
  resolveShareEarningsStreakMissionSnapshot,
  SHARE_EARNINGS_STREAK_MISSION_RPC,
  type ShareEarningsCanvasLabels,
  type ShareEarningsCardView,
} from '@/domain/share-earnings-display-contract';
import { formatPhonRewardDisplay } from '@/domain/viral-missions-display-contract';
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

export const shareEarningsPageKeys = {
  snapshot: (userId: string | null) => ['share-earnings-snapshot', userId] as const,
};

type ShareEarningsSnapshot = {
  referralCode: string;
  inviteUrl: string;
  card: ShareEarningsCardView;
};

async function fetchShareEarningsSnapshot(userId: string): Promise<ShareEarningsSnapshot> {
  const [profileRes, hubData, goldenEarthData] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', userId).maybeSingle(),
    callRpc('rpc_get_earn_hub_status'),
    callRpc('rpc_get_golden_earth_status'),
  ]);

  if (profileRes.error) throw profileRes.error;

  const hubPayload = (hubData ?? {}) as Record<string, unknown>;
  const goldenPayload = (goldenEarthData ?? {}) as Record<string, unknown>;
  const card = resolveShareEarningsCardView(hubPayload, goldenPayload);
  if (!card) throw new Error('SHARE_EARNINGS_CARD_MISSING');

  const referralCode = resolveReferralShareCode(userId, profileRes.data?.username ?? null);
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : PRODUCTION_SITE_ORIGIN;

  return {
    referralCode,
    inviteUrl: buildReferralInviteUrl(origin, referralCode),
    card,
  };
}

export type ShareEarningsPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  card: ShareEarningsCardView | null;
  referralCode: string;
  inviteUrl: string;
  shareRewardLabel: string;
  streakRewardLabel: string;
  streakProgressLabel: string;
  webShareAvailable: boolean;
  shareBusy: boolean;
  claimBusy: boolean;
  canClaimShareReward: boolean;
  canClaimStreakReward: boolean;
  previewUrl: string | null;
  shareEarnings: () => Promise<void>;
  downloadPng: () => Promise<void>;
  claimShareReward: () => Promise<void>;
  claimStreakReward: () => Promise<void>;
  copyInviteLink: () => Promise<void>;
};

export function useShareEarningsPageController(): ShareEarningsPageControllerView {
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
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: shareEarningsPageKeys.snapshot(userId),
    queryFn: () => fetchShareEarningsSnapshot(userId!),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const shareMission = useMemo(() => {
    return resolveReferralShareMissionFromRows(viralStatus?.missions);
  }, [viralStatus?.missions]);

  const streakMission = useMemo(() => {
    const streakDays = snapshot?.card.today.loginStreak ?? 0;
    return resolveShareEarningsStreakMissionSnapshot(viralStatus?.missions, streakDays);
  }, [snapshot?.card.today.loginStreak, viralStatus?.missions]);

  const buildCanvasLabels = useCallback((): ShareEarningsCanvasLabels | null => {
    if (!snapshot?.card) return null;
    const { card } = snapshot;
    const streakLine =
      card.today.loginStreak > 0
        ? t('share.earnings.card.streakLine', { days: card.today.loginStreak })
        : null;

    return {
      headline: t('share.earnings.card.headline'),
      todayLabel: t('share.earnings.card.todayLabel'),
      tierLabel: t('share.earnings.card.tierLabel'),
      tierName: t(card.tierLabelKey),
      earningsDisplay: card.earningsLabel,
      streakLine,
      footer: t('share.earnings.card.footer'),
      disclosure: t('share.earnings.card.disclosure'),
    };
  }, [snapshot?.card, t]);

  const ensurePreviewUrl = useCallback(async (): Promise<string | null> => {
    const labels = buildCanvasLabels();
    if (!labels) return null;

    const blob = await renderShareEarningsCanvasBlob(labels);
    if (!blob) return null;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    return url;
  }, [buildCanvasLabels]);

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
      const clientRequestId = `share-earnings:${userId}:${REFERRAL_WEB_SHARE_MISSION_RPC}:${Date.now()}`;
      const result = await claimViralMission(REFERRAL_WEB_SHARE_MISSION_RPC, clientRequestId);
      if (result?.ok) {
        productToast.show({
          zone: 'warm',
          key: 'earn.mission.claimed',
          values: { reward: formatPhonRewardDisplay(result.phon_awarded) },
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: shareEarningsPageKeys.snapshot(userId) }),
          queryClient.invalidateQueries({ queryKey: viralMissionKeys.status(userId) }),
        ]);
      }
    } catch (err) {
      setActionError(translateError(err, 'earn.mission.claimFailed'));
    } finally {
      setClaimBusy(false);
    }
  }, [claimBusy, claimLoading, claimViralMission, queryClient, shareMission.canClaim, userId]);

  const claimStreakReward = useCallback(async () => {
    if (!userId || claimLoading || claimBusy || !streakMission.canClaim) return;
    setClaimBusy(true);
    setActionError(null);
    try {
      const clientRequestId = `share-earnings:${userId}:${SHARE_EARNINGS_STREAK_MISSION_RPC}:${Date.now()}`;
      const result = await claimViralMission(SHARE_EARNINGS_STREAK_MISSION_RPC, clientRequestId);
      if (result?.ok) {
        productToast.show({
          zone: 'warm',
          key: 'earn.mission.claimed',
          values: { reward: formatPhonRewardDisplay(result.phon_awarded) },
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: shareEarningsPageKeys.snapshot(userId) }),
          queryClient.invalidateQueries({ queryKey: viralMissionKeys.status(userId) }),
        ]);
      }
    } catch (err) {
      setActionError(translateError(err, 'earn.mission.claimFailed'));
    } finally {
      setClaimBusy(false);
    }
  }, [claimBusy, claimLoading, claimViralMission, queryClient, streakMission.canClaim, userId]);

  const shareEarnings = useCallback(async () => {
    if (!snapshot?.inviteUrl || !snapshot.referralCode || shareBusy) return;
    setShareBusy(true);
    setActionError(null);

    const payload = buildShareEarningsSharePayload({
      shareTitle: t('share.earnings.shareTitle'),
      shareText: t('share.earnings.shareText', {
        tier: t(snapshot.card.tierLabelKey),
        earnings: snapshot.card.earningsLabel,
        code: snapshot.referralCode,
        url: snapshot.inviteUrl,
      }),
      inviteUrl: snapshot.inviteUrl,
    });

    try {
      const labels = buildCanvasLabels();
      const blob = labels ? await renderShareEarningsCanvasBlob(labels) : null;

      if (canUseWebShare() && blob) {
        const file = new File([blob], 'phonara-earnings.png', { type: 'image/png' });
        if (canShareImageFiles([file])) {
          await navigator.share({ ...payload, files: [file] });
        } else {
          await navigator.share(payload);
        }
      } else if (canUseWebShare()) {
        await navigator.share(payload);
      } else {
        await copyToClipboard(snapshot.inviteUrl, 'referral.toast.linkCopied');
        return;
      }

      productToast.show({ zone: 'warm', key: 'share.earnings.toast.shared' });
      void ensurePreviewUrl();
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
    buildCanvasLabels,
    claimShareReward,
    copyToClipboard,
    ensurePreviewUrl,
    shareBusy,
    shareMission.canClaim,
    snapshot?.card.earningsLabel,
    snapshot?.card.tierLabelKey,
    snapshot?.inviteUrl,
    snapshot?.referralCode,
    t,
  ]);

  const downloadPng = useCallback(async () => {
    setActionError(null);
    const labels = buildCanvasLabels();
    if (!labels) return;

    const blob = await renderShareEarningsCanvasBlob(labels);
    if (!blob) {
      setActionError('share.earnings.toast.pngFailed');
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'phonara-earnings.png';
    anchor.click();
    URL.revokeObjectURL(url);
    productToast.show({ zone: 'warm', key: 'share.earnings.toast.pngReady' });
    void ensurePreviewUrl();
  }, [buildCanvasLabels, ensurePreviewUrl]);

  const copyInviteLink = useCallback(async () => {
    if (!snapshot?.inviteUrl) return;
    await copyToClipboard(snapshot.inviteUrl, 'referral.toast.linkCopied');
  }, [copyToClipboard, snapshot?.inviteUrl]);

  const queryError = snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null;

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  return {
    t,
    loading: authLoading || snapshotLoading || viralLoading,
    error: actionError ?? queryError,
    card: snapshot?.card ?? null,
    referralCode: snapshot?.referralCode ?? '',
    inviteUrl: snapshot?.inviteUrl ?? '',
    shareRewardLabel: shareMission.rewardPhon
      ? formatPhonRewardDisplay(shareMission.rewardPhon)
      : '—',
    streakRewardLabel: streakMission.rewardPhon
      ? formatPhonRewardDisplay(streakMission.rewardPhon)
      : '—',
    streakProgressLabel: t('share.earnings.streakProgress', {
      current: streakMission.streakDays,
      target: streakMission.streakTargetDays,
    }),
    webShareAvailable: canUseWebShare(),
    shareBusy,
    claimBusy,
    canClaimShareReward: shareMission.canClaim,
    canClaimStreakReward: streakMission.canClaim,
    previewUrl,
    shareEarnings,
    downloadPng,
    claimShareReward,
    claimStreakReward,
    copyInviteLink,
  };
}
