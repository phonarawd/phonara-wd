import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';
import type { MissionItem } from '@phonara/shared-types';

import { useAuth } from '@/contexts/auth-context';
import { EARN_STATIC_MISSIONS } from '@/data/earn-static-missions';
import {
  filterHomeMissionsForTab,
  HOME_MISSIONS_DEFAULT_TAB,
  isOnboardingOnlyClaimUiId,
  parseHomeMissionsHubSearch,
  resolveHomeMissionCtaRoute,
  resolveHomeMissionRepeatableRpc,
  resolveHomeMissionViralRpc,
  resolveHomeMissionsTabForMissionId,
  type HomeMissionsHubSearch,
  type HomeMissionsHubTabId,
} from '@/domain/home-missions-display-contract';
import {
  formatPhonRewardDisplay,
  mapMissionStatusToCardState,
  mergeE12MissionItems,
  resolveMissionClaimBlocked,
  resolveMissionUnavailableReasonKey,
  type MissionCardDisplayState,
} from '@/domain/viral-missions-display-contract';
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
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';
import {
  APP_INSTALL_MISSION_UI_ID,
  APP_INSTALL_MISSION_CTA_KEY,
  APP_INSTALL_MISSION_VERIFY_KEY,
} from '@/domain/app-install-mission-display-contract';
import { useAppInstallMissionAction } from '@/features/earn/use-app-install-mission-action';
import { useT } from '@/product/i18n';

export const homeMissionsPageKeys = {
  snapshot: (userId: string | null) => ['home-missions-snapshot', userId] as const,
};

type HomeMissionsSnapshot = {
  engineMissions: Array<{ mission: string; completed_at: string | null }>;
  welcomeClaimed: boolean;
};

async function fetchHomeMissionsSnapshot(userId: string): Promise<HomeMissionsSnapshot> {
  const [missionsRes, welcomeRes] = await Promise.all([
    supabase.from('missions').select('mission, completed_at').eq('user_id', userId),
    supabase.from('welcome_bonuses').select('user_id').eq('user_id', userId).maybeSingle(),
  ]);

  if (missionsRes.error) throw missionsRes.error;
  if (welcomeRes.error) throw welcomeRes.error;

  return {
    engineMissions: (missionsRes.data ?? []).map((row) => ({
      mission: row.mission,
      completed_at: row.completed_at,
    })),
    welcomeClaimed: Boolean(welcomeRes.data),
  };
}

export type HomeMissionCardView = {
  id: string;
  titleKey: MessageKey;
  rewardLabel: string;
  rewardPhon?: string;
  progressLabel: string;
  state: MissionCardDisplayState;
  claimBlocked: boolean;
  canClaim: boolean;
  unavailableReasonKey: MessageKey | null;
  ctaRoute: string | null;
  viralRpc: string | null;
  repeatableRpc: string | null;
  highlighted: boolean;
};

export type HomeMissionsPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  activeTab: HomeMissionsHubTabId;
  missionId?: string;
  missions: HomeMissionCardView[];
  completedCount: number;
  totalVisibleCount: number;
  claimingMission: string | null;
  setActiveTab: (tab: HomeMissionsHubTabId) => void;
  openMission: (missionId: string) => void;
  closeMission: () => void;
  claimMission: (missionId: string) => Promise<void>;
  appInstallAction: {
    canAct: boolean;
    busy: boolean;
    errorKey: MessageKey | null;
    ctaKey: MessageKey;
    recordOrInstall: () => Promise<void>;
  };
};

export function useHomeMissionsPageController(
  search: Record<string, unknown>,
): HomeMissionsPageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const hubSearch = parseHomeMissionsHubSearch(search);
  const { status: viralStatus, loading: viralLoading } = useViralMissionStatus();
  const { status: repeatableStatus, loading: repeatableLoading } =
    useRepeatableMissionStatus('all');
  const { claimViralMission, loading: viralClaimLoading } = useViralMissionClaim();
  const { claimMission: claimRepeatableMission, loading: repeatableClaimLoading } =
    useRepeatableMissionClaim();
  const appInstall = useAppInstallMissionAction();
  const [claimingMission, setClaimingMission] = useState<string | null>(null);
  const [actionError, setActionError] = useState<MessageKey | null>(null);

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: homeMissionsPageKeys.snapshot(userId),
    queryFn: () => fetchHomeMissionsSnapshot(userId!),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const mergedMissions: MissionItem[] = useMemo(() => {
    return mergeE12MissionItems({
      staticItems: EARN_STATIC_MISSIONS,
      engineMissions: snapshot?.engineMissions ?? [],
      viralRows: viralStatus?.missions ?? [],
      repeatableRows: repeatableStatus?.missions ?? [],
      streakDays: viralStatus?.streak_days,
      streakTargetDays: viralStatus?.streak_target_days,
    });
  }, [repeatableStatus?.missions, snapshot?.engineMissions, viralStatus]);

  const visibleMissions = useMemo(
    () => filterHomeMissionsForTab(mergedMissions, hubSearch.tab),
    [hubSearch.tab, mergedMissions],
  );

  const missions: HomeMissionCardView[] = useMemo(() => {
    return visibleMissions.map((mission) => {
      const state = mapMissionStatusToCardState(mission.status);
      const viralRpc = resolveHomeMissionViralRpc(mission.id);
      const repeatableRpc = resolveHomeMissionRepeatableRpc(mission.id);
      const claimBlocked =
        resolveMissionClaimBlocked({ authenticated: Boolean(userId), uiId: mission.id }) ||
        isOnboardingOnlyClaimUiId(mission.id);
      const unavailableReasonKey = resolveMissionUnavailableReasonKey({
        authenticated: Boolean(userId),
        uiId: mission.id,
      });
      const canClaim =
        state === 'reward_pending' &&
        !claimBlocked &&
        Boolean(viralRpc || repeatableRpc) &&
        !mission.soon &&
        mission.id !== APP_INSTALL_MISSION_UI_ID;

      return {
        id: mission.id,
        titleKey: mission.titleKey as MessageKey,
        rewardLabel: mission.rewardLabel,
        rewardPhon: mission.rewardPhon,
        progressLabel: mission.progressLabel,
        state,
        claimBlocked,
        canClaim,
        unavailableReasonKey,
        ctaRoute: state === 'in_progress' ? resolveHomeMissionCtaRoute(mission.id) : null,
        viralRpc,
        repeatableRpc,
        highlighted: hubSearch.missionId === mission.id,
      };
    });
  }, [hubSearch.missionId, userId, visibleMissions]);

  const completedCount = missions.filter((mission) => mission.state === 'completed').length;

  const updateSearch = useCallback(
    (next: HomeMissionsHubSearch) => {
      void navigate({
        to: '/home/missions',
        search: {
          tab: next.tab,
          ...(next.missionId ? { missionId: next.missionId } : {}),
        },
        replace: true,
      });
    },
    [navigate],
  );

  const setActiveTab = useCallback(
    (tab: HomeMissionsHubTabId) => {
      updateSearch({ tab, missionId: undefined });
    },
    [updateSearch],
  );

  const openMission = useCallback(
    (missionId: string) => {
      const tab = resolveHomeMissionsTabForMissionId(missionId) ?? hubSearch.tab;
      updateSearch({ tab, missionId });
    },
    [hubSearch.tab, updateSearch],
  );

  const closeMission = useCallback(() => {
    updateSearch({ tab: hubSearch.tab, missionId: undefined });
  }, [hubSearch.tab, updateSearch]);

  const claimMission = useCallback(
    async (missionId: string) => {
      if (!userId || viralClaimLoading || repeatableClaimLoading) return;
      if (isOnboardingOnlyClaimUiId(missionId)) return;

      const viralRpc = resolveHomeMissionViralRpc(missionId);
      const repeatableRpc = resolveHomeMissionRepeatableRpc(missionId);
      const rpc = viralRpc ?? repeatableRpc;
      if (!rpc) return;

      setClaimingMission(missionId);
      setActionError(null);
      try {
        const clientRequestId = `home-missions:${userId}:${rpc}:${Date.now()}`;
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
            queryClient.invalidateQueries({ queryKey: homeMissionsPageKeys.snapshot(userId) }),
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
    activeTab: hubSearch.tab,
    missionId: hubSearch.missionId,
    missions,
    completedCount,
    totalVisibleCount: missions.length,
    claimingMission,
    setActiveTab,
    openMission,
    closeMission,
    claimMission,
    appInstallAction: {
      canAct: appInstall.canAct,
      busy: appInstall.busy,
      errorKey: appInstall.errorKey,
      ctaKey: appInstall.canNativePrompt
        ? APP_INSTALL_MISSION_CTA_KEY
        : APP_INSTALL_MISSION_VERIFY_KEY,
      recordOrInstall: appInstall.recordOrInstall,
    },
  };
}

export { HOME_MISSIONS_DEFAULT_TAB, parseHomeMissionsHubSearch };
