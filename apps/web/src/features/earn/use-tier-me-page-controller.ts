import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { parseEarnHubReferralSnapshot } from '@/domain/referral-hub-display-contract';
import {
  buildTierDecayPanelView,
  buildTierProgressView,
  parseEarnHubLimitsToday,
  parseEarnHubTierSnapshot,
  TIER_KEEP_STATUS_RPC,
  TIER_KEEP_STATUS_UI_ID,
  type EarnHubLimitTodayRow,
  type TierDecayPanelView,
  type TierProgressView,
} from '@/domain/tier-me-display-contract';
import { isTierKeepStatusClaimEngineLive } from '@/domain/dead-controls-display-contract';
import {
  formatPhonRewardDisplay,
  resolveMissionClaimBlocked,
  resolveMissionUnavailableReasonKey,
  resolveRepeatableMissionCardState,
  type MissionCardDisplayState,
} from '@/domain/viral-missions-display-contract';
import {
  useRepeatableMissionClaim,
  useRepeatableMissionStatus,
  repeatableMissionKeys,
} from '@/features/earn/use-repeatable-missions';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const tierMePageKeys = {
  snapshot: (userId: string | null) => ['tier-me-snapshot', userId] as const,
};

type TierMeSnapshot = {
  hubPayload: Record<string, unknown>;
  tierProgress: TierProgressView;
  limitsToday: EarnHubLimitTodayRow[];
  qualifiedReferrals: number;
  totalInvited: number;
};

async function fetchTierMeSnapshot(): Promise<TierMeSnapshot> {
  const { data, error } = await supabase.rpc('rpc_get_earn_hub_status');
  if (error) throw error;

  const hubPayload = (data ?? {}) as Record<string, unknown>;
  const tierSnapshot = parseEarnHubTierSnapshot(hubPayload);
  if (!tierSnapshot) {
    throw new Error('TIER_SNAPSHOT_MISSING');
  }

  const referral = parseEarnHubReferralSnapshot(hubPayload);

  return {
    hubPayload,
    tierProgress: buildTierProgressView(tierSnapshot),
    limitsToday: parseEarnHubLimitsToday(hubPayload),
    qualifiedReferrals: referral?.qualifiedTotal ?? 0,
    totalInvited: referral?.totalInvited ?? 0,
  };
}

export type TierKeepMissionView = {
  state: MissionCardDisplayState;
  rewardLabel: string;
  rewardPhon?: string;
  progressLabel: string;
  canClaim: boolean;
  claimBlocked: boolean;
  unavailableReasonKey: MessageKey | null;
};

export type TierMePageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  tierProgress: TierProgressView | null;
  limitsToday: EarnHubLimitTodayRow[];
  decayPanel: TierDecayPanelView;
  keepMission: TierKeepMissionView | null;
  qualifiedReferrals: number;
  totalInvited: number;
  claimingKeepMission: boolean;
  claimKeepMission: () => Promise<void>;
};

export function useTierMePageController(): TierMePageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { status: repeatableStatus, loading: repeatableLoading } =
    useRepeatableMissionStatus('tier');
  const { claimMission: claimRepeatableMission, loading: repeatableClaimLoading } =
    useRepeatableMissionClaim();
  const [actionError, setActionError] = useState<MessageKey | null>(null);

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: tierMePageKeys.snapshot(userId),
    queryFn: () => fetchTierMeSnapshot(),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const decayPanel = useMemo(
    () => buildTierDecayPanelView(snapshot?.tierProgress.tier ?? 'bronze'),
    [snapshot?.tierProgress.tier],
  );

  const keepMission = useMemo((): TierKeepMissionView | null => {
    if (!decayPanel.eligible) return null;
    const unavailableReasonKey = resolveMissionUnavailableReasonKey({
      authenticated: Boolean(userId),
      uiId: TIER_KEEP_STATUS_UI_ID,
    });
    const row = repeatableStatus?.missions.find(
      (mission) => mission.mission === TIER_KEEP_STATUS_RPC,
    );
    if (!row) {
      return {
        state: 'in_progress',
        rewardLabel: '+4,000P',
        rewardPhon: '4000.000000',
        progressLabel: '0 / 1',
        canClaim: false,
        claimBlocked: true,
        unavailableReasonKey,
      };
    }

    const tierKeepBlocked = !isTierKeepStatusClaimEngineLive();
    const state = tierKeepBlocked ? 'in_progress' : resolveRepeatableMissionCardState(row);
    const claimBlocked =
      tierKeepBlocked ||
      resolveMissionClaimBlocked({
        authenticated: Boolean(userId),
        uiId: TIER_KEEP_STATUS_UI_ID,
      });

    return {
      state,
      rewardLabel: formatPhonRewardDisplay(row.reward_phon),
      rewardPhon: row.reward_phon,
      progressLabel: tierKeepBlocked ? `0 / ${row.target}` : `${row.progress} / ${row.target}`,
      canClaim: state === 'reward_pending' && !claimBlocked,
      claimBlocked,
      unavailableReasonKey,
    };
  }, [decayPanel.eligible, repeatableStatus?.missions, userId]);

  const claimKeepMission = useCallback(async () => {
    if (!userId || !keepMission?.canClaim || repeatableClaimLoading) return;

    setActionError(null);
    try {
      const clientRequestId = `tier-me:${userId}:${TIER_KEEP_STATUS_RPC}:${Date.now()}`;
      const result = await claimRepeatableMission(TIER_KEEP_STATUS_RPC, clientRequestId);
      if (result?.ok) {
        productToast.show({
          zone: 'warm',
          key: 'earn.mission.claimed',
          values: { reward: formatPhonRewardDisplay(result.phon_awarded) },
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: tierMePageKeys.snapshot(userId) }),
          queryClient.invalidateQueries({
            queryKey: repeatableMissionKeys.status(userId, 'tier'),
          }),
        ]);
      }
    } catch (err) {
      setActionError(translateError(err, 'earn.mission.claimFailed'));
    }
  }, [claimRepeatableMission, keepMission?.canClaim, queryClient, repeatableClaimLoading, userId]);

  const queryError = snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null;

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  return {
    t,
    loading: authLoading || snapshotLoading || repeatableLoading,
    error: actionError ?? queryError,
    tierProgress: snapshot?.tierProgress ?? null,
    limitsToday: snapshot?.limitsToday ?? [],
    decayPanel,
    keepMission,
    qualifiedReferrals: snapshot?.qualifiedReferrals ?? 0,
    totalInvited: snapshot?.totalInvited ?? 0,
    claimingKeepMission: repeatableClaimLoading,
    claimKeepMission,
  };
}
