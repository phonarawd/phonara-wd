import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';
import type { MissionItem } from '@phonara/shared-types';

import { useAuth } from '@/contexts/auth-context';
import { EARN_STATIC_MISSIONS } from '@/data/earn-static-missions';
import {
  buildEarnHomeTierProgress,
  EARN_HOME_ENTRY_CARDS,
  EARN_HOME_HUB_MISSION_PREVIEW_IDS,
  formatEarnHomeCatalogRewardsLabel,
  parseEarnHubCooldownSnapshot,
  parseEarnHubLaunchSlotsSnapshot,
  parseEarnHubSeasonSnapshot,
  parseEarnHubWalletSnapshot,
  resolveEarnHomeNextAction,
  resolveEarnHomeProofModeFromEnv,
  resolveEarnHomeRewardTicketsIssuanceNoteKey,
  shouldEarnHomeShowRewardTicketsIssuanceNote,
  sumEarnHomeCatalogRewardsPhon,
  type EarnHomeEntryCardDefinition,
  type EarnHomeNextActionView,
  type EarnHubCooldownSnapshot,
  type EarnHubLaunchSlotsSnapshot,
  type EarnHubSeasonSnapshot,
  type EarnHubWalletSnapshot,
} from '@/domain/earn-home-display-contract';
import {
  parseEarnHubAttendanceSnapshot,
  parseEarnHubRouletteSnapshot,
} from '@/domain/home-attendance-display-contract';
import type { TierProgressView } from '@/domain/tier-me-display-contract';
import { EARN_HUB_STATUS_RPC } from '@/domain/unified-tier-display-contract';
import {
  formatPhonRewardDisplay,
  mapMissionStatusToCardState,
  mergeE12MissionItems,
  type MissionCardDisplayState,
} from '@/domain/viral-missions-display-contract';
import { useRepeatableMissionStatus } from '@/features/earn/use-repeatable-missions';
import { useViralMissionStatus } from '@/features/earn/use-viral-missions';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { useT } from '@/product/i18n';

export const earnHomePageKeys = {
  snapshot: (userId: string | null, proofMode: string) =>
    ['earn-home-snapshot', userId, proofMode] as const,
};

type EarnHomeHubSnapshot = {
  hubPayload: Record<string, unknown>;
  engineMissions: Array<{ mission: string; completed_at: string | null }>;
};

async function fetchEarnHomeHubSnapshot(userId: string): Promise<EarnHomeHubSnapshot> {
  const [hubRes, missionsRes] = await Promise.all([
    supabase.rpc(EARN_HUB_STATUS_RPC),
    supabase.from('missions').select('mission, completed_at').eq('user_id', userId),
  ]);

  if (hubRes.error) throw hubRes.error;
  if (missionsRes.error) throw missionsRes.error;

  return {
    hubPayload: (hubRes.data ?? {}) as Record<string, unknown>,
    engineMissions: (missionsRes.data ?? []).map((row) => ({
      mission: row.mission,
      completed_at: row.completed_at,
    })),
  };
}

export type EarnHomeMissionPreviewView = {
  id: string;
  titleKey: MessageKey;
  rewardLabel: string;
  rewardPhon?: string;
  progressLabel: string;
  state: MissionCardDisplayState;
  route: string;
};

export type EarnHomePageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  tierProgress: TierProgressView | null;
  catalogRewardsLabel: string;
  wallet: EarnHubWalletSnapshot | null;
  season: EarnHubSeasonSnapshot | null;
  launchSlots: EarnHubLaunchSlotsSnapshot | null;
  cooldown: EarnHubCooldownSnapshot;
  missionsInProgress: number;
  attendanceRewardLabel: string;
  rouletteRemaining: number;
  rouletteMax: number;
  goldenEarthRemaining: number;
  nextAction: EarnHomeNextActionView;
  missionPreviews: EarnHomeMissionPreviewView[];
  entryCards: readonly EarnHomeEntryCardDefinition[];
  useAmbientTicker: boolean;
  rewardTicketsIssuanceNoteKey: ReturnType<
    typeof resolveEarnHomeRewardTicketsIssuanceNoteKey
  > | null;
};

export function useEarnHomePageController(): EarnHomePageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const proofMode = resolveEarnHomeProofModeFromEnv();
  const { status: viralStatus, loading: viralLoading } = useViralMissionStatus();
  const { status: repeatableStatus, loading: repeatableLoading } =
    useRepeatableMissionStatus('all');

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: earnHomePageKeys.snapshot(userId, proofMode),
    queryFn: () => fetchEarnHomeHubSnapshot(userId!),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const hubPayload = snapshot?.hubPayload ?? null;
  const attendance = parseEarnHubAttendanceSnapshot(hubPayload);
  const roulette = parseEarnHubRouletteSnapshot(hubPayload);
  const tierProgress = buildEarnHomeTierProgress(hubPayload);
  const wallet = parseEarnHubWalletSnapshot(hubPayload);
  const season = parseEarnHubSeasonSnapshot(hubPayload);
  const launchSlots = parseEarnHubLaunchSlotsSnapshot(hubPayload);
  const cooldown = parseEarnHubCooldownSnapshot(hubPayload);

  const goldenEarthRemaining = useMemo(() => {
    const limits = hubPayload?.['limits_today'];
    if (!Array.isArray(limits)) return 0;
    const row = limits.find(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        (entry as Record<string, unknown>)['action'] === 'golden_earth_tap',
    ) as Record<string, unknown> | undefined;
    return Number(row?.['remaining'] ?? 0);
  }, [hubPayload]);

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

  const missionPreviews: EarnHomeMissionPreviewView[] = useMemo(() => {
    return EARN_HOME_HUB_MISSION_PREVIEW_IDS.map((id) => {
      const mission = mergedMissions.find((row) => row.id === id);
      if (!mission) {
        const fallback = EARN_STATIC_MISSIONS.find((row) => row.id === id);
        return {
          id,
          titleKey: (fallback?.titleKey ?? 'earn.home.entry.missions.title') as MessageKey,
          rewardLabel: fallback?.rewardLabel ?? '—',
          rewardPhon: undefined,
          progressLabel: fallback?.progressLabel ?? '0 / 1',
          state: 'in_progress' as const,
          route: '/home/missions',
        };
      }

      return {
        id: mission.id,
        titleKey: mission.titleKey as MessageKey,
        rewardLabel: mission.rewardLabel,
        rewardPhon: mission.rewardPhon,
        progressLabel: mission.progressLabel,
        state: mapMissionStatusToCardState(mission.status),
        route: '/home/missions',
      };
    });
  }, [mergedMissions]);

  const missionsInProgress = useMemo(
    () =>
      mergedMissions.filter(
        (mission) => mapMissionStatusToCardState(mission.status) === 'in_progress',
      ).length,
    [mergedMissions],
  );

  const claimableMission = useMemo(() => {
    return mergedMissions.find(
      (mission) => mapMissionStatusToCardState(mission.status) === 'reward_pending',
    );
  }, [mergedMissions]);

  const nextAction = useMemo(
    () =>
      resolveEarnHomeNextAction({
        attendanceRemaining: attendance?.remaining ?? 0,
        rouletteRemaining: roulette?.remaining ?? 0,
        claimableMissionId: claimableMission?.id ?? null,
        claimableMissionTitleKey: (claimableMission?.titleKey as MessageKey) ?? null,
      }),
    [attendance?.remaining, claimableMission, roulette?.remaining],
  );

  const catalogRewardsLabel = formatEarnHomeCatalogRewardsLabel(sumEarnHomeCatalogRewardsPhon());

  const attendanceRewardLabel = attendance
    ? formatPhonRewardDisplay(attendance.todayRewardPhon)
    : '+0P';

  const queryError = snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null;

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  return {
    t,
    loading: authLoading || snapshotLoading || viralLoading || repeatableLoading,
    error: queryError,
    tierProgress,
    catalogRewardsLabel,
    wallet,
    season,
    launchSlots,
    cooldown,
    missionsInProgress,
    attendanceRewardLabel,
    rouletteRemaining: roulette?.remaining ?? 0,
    rouletteMax: roulette?.max ?? 1,
    goldenEarthRemaining,
    nextAction,
    missionPreviews,
    entryCards: EARN_HOME_ENTRY_CARDS,
    useAmbientTicker: proofMode !== 'live',
    rewardTicketsIssuanceNoteKey: shouldEarnHomeShowRewardTicketsIssuanceNote()
      ? resolveEarnHomeRewardTicketsIssuanceNoteKey()
      : null,
  };
}
