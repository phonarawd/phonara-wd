import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  buildAttendanceCycleDays,
  buildRoutineSteps,
  DEFAULT_ATTENDANCE_CYCLE_PHON,
  DAILY_REWARD_CLAIM_RPC,
  parseDailyRewardClaimResult,
  parseEarnHubAttendanceSnapshot,
  parseEarnHubRouletteSnapshot,
  parseUserStreakRow,
  resolveAttendanceClaimState,
  resolveCycleRewardPhon,
  resolveNextCycleDayNumber,
  type AttendanceCycleDayView,
  type AttendanceHubSnapshot,
  type RoutineStepView,
  type UserStreakSnapshot,
} from '@/domain/home-attendance-display-contract';
import { EARN_HUB_STATUS_RPC } from '@/domain/unified-tier-display-contract';
import { formatPhonRewardDisplay } from '@/domain/viral-missions-display-contract';
import { walletKeys } from '@/hooks/use-wallet';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const homeAttendancePageKeys = {
  snapshot: (userId: string | null) => ['home-attendance-snapshot', userId] as const,
};

type RepeatableMissionRow = {
  mission: string;
  claimable: boolean;
  claimed: boolean;
  progress: number;
  target: number;
};

type ViralMissionRow = {
  mission: string;
  remaining: number;
};

type HomeAttendanceSnapshot = {
  hubPayload: Record<string, unknown>;
  streak: UserStreakSnapshot | null;
  repeatableMissions: RepeatableMissionRow[];
  viralMissions: ViralMissionRow[];
};

async function fetchHomeAttendanceSnapshot(userId: string): Promise<HomeAttendanceSnapshot> {
  const [hubRes, streakRes, repeatableRes, viralRes] = await Promise.all([
    supabase.rpc(EARN_HUB_STATUS_RPC),
    supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, total_phon_earned, last_claimed_date')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.rpc('rpc_get_repeatable_mission_status', { p_lane: 'all' }),
    supabase.rpc('rpc_get_viral_mission_status'),
  ]);

  if (hubRes.error) throw hubRes.error;
  if (streakRes.error) throw streakRes.error;
  if (repeatableRes.error) throw repeatableRes.error;
  if (viralRes.error) throw viralRes.error;

  const repeatablePayload = (repeatableRes.data ?? {}) as Record<string, unknown>;
  const viralPayload = (viralRes.data ?? {}) as Record<string, unknown>;

  return {
    hubPayload: (hubRes.data ?? {}) as Record<string, unknown>,
    streak: parseUserStreakRow((streakRes.data ?? null) as Record<string, unknown> | null),
    repeatableMissions: Array.isArray(repeatablePayload['missions'])
      ? (repeatablePayload['missions'] as RepeatableMissionRow[])
      : [],
    viralMissions: Array.isArray(viralPayload['missions'])
      ? (viralPayload['missions'] as ViralMissionRow[])
      : [],
  };
}

function findRepeatable(
  missions: RepeatableMissionRow[],
  missionId: string,
): RepeatableMissionRow | null {
  return missions.find((row) => row.mission === missionId) ?? null;
}

function findViral(missions: ViralMissionRow[], missionId: string): ViralMissionRow | null {
  return missions.find((row) => row.mission === missionId) ?? null;
}

export type HomeAttendancePageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  attendance: AttendanceHubSnapshot | null;
  streak: UserStreakSnapshot | null;
  cycleDays: AttendanceCycleDayView[];
  routineSteps: RoutineStepView[];
  todayRewardLabel: string;
  nextRewardLabel: string;
  totalEarnedLabel: string;
  claimState: 'reward_pending' | 'completed';
  claiming: boolean;
  showStreakMilestone: boolean;
  claimAttendance: () => Promise<void>;
};

export function useHomeAttendancePageController(): HomeAttendancePageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const [claiming, setClaiming] = useState(false);
  const [actionError, setActionError] = useState<MessageKey | null>(null);
  const [showStreakMilestone, setShowStreakMilestone] = useState(false);

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: homeAttendancePageKeys.snapshot(userId),
    queryFn: () => fetchHomeAttendanceSnapshot(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const attendance = useMemo(
    () => parseEarnHubAttendanceSnapshot(snapshot?.hubPayload),
    [snapshot?.hubPayload],
  );
  const roulette = useMemo(
    () => parseEarnHubRouletteSnapshot(snapshot?.hubPayload),
    [snapshot?.hubPayload],
  );

  const claimedToday = (attendance?.remaining ?? 1) <= 0;
  const claimState = resolveAttendanceClaimState({
    claimedToday,
    remaining: attendance?.remaining ?? 0,
  });

  const cycleDays = useMemo(
    () =>
      buildAttendanceCycleDays({
        cycleDay: attendance?.cycleDay ?? 1,
        claimedToday,
        rewards: DEFAULT_ATTENDANCE_CYCLE_PHON,
      }),
    [attendance?.cycleDay, claimedToday],
  );

  const routineSteps = useMemo(() => {
    const dailyQuiz = findRepeatable(snapshot?.repeatableMissions ?? [], 'daily_quiz');
    const weeklyPlay = findRepeatable(snapshot?.repeatableMissions ?? [], 'weekly_play_5');
    const shareMission = findViral(snapshot?.viralMissions ?? [], 'share_referral_link');

    return buildRoutineSteps({
      attendanceRemaining: attendance?.remaining ?? 1,
      rouletteRemaining: roulette?.remaining ?? 1,
      quizDone: dailyQuiz
        ? dailyQuiz.claimed || (!dailyQuiz.claimable && dailyQuiz.progress >= dailyQuiz.target)
        : false,
      shareDone: shareMission ? shareMission.remaining <= 0 : false,
      weeklyDone: weeklyPlay
        ? weeklyPlay.claimed || weeklyPlay.progress >= weeklyPlay.target
        : false,
    });
  }, [
    attendance?.remaining,
    roulette?.remaining,
    snapshot?.repeatableMissions,
    snapshot?.viralMissions,
  ]);

  const todayRewardLabel = formatPhonRewardDisplay(attendance?.todayRewardPhon ?? '0');
  const nextRewardLabel = formatPhonRewardDisplay(
    resolveCycleRewardPhon(
      DEFAULT_ATTENDANCE_CYCLE_PHON,
      resolveNextCycleDayNumber(attendance?.cycleDay ?? 1, claimedToday),
    ),
  );
  const totalEarnedLabel = formatPhonRewardDisplay(snapshot?.streak?.totalPhonEarned ?? '0');

  const claimAttendance = useCallback(async () => {
    if (!userId || claiming || claimState === 'completed') return;
    setClaiming(true);
    setActionError(null);
    try {
      const { data, error } = await supabase.rpc(DAILY_REWARD_CLAIM_RPC);
      if (error) throw error;
      const result = parseDailyRewardClaimResult((data ?? {}) as Record<string, unknown>);
      if (!result) throw new Error('INVALID_CLAIM_RESPONSE');

      const rewardLabel = formatPhonRewardDisplay(result.phonAwarded);
      productToast.show({
        zone: 'warm',
        key: result.alreadyClaimed ? 'earn.attendance.done' : 'earn.attendance.claimedToast',
        values: { reward: rewardLabel },
      });

      if (!result.alreadyClaimed && result.streakDay === 7) {
        setShowStreakMilestone(true);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: homeAttendancePageKeys.snapshot(userId) }),
        queryClient.invalidateQueries({ queryKey: ['earn-hub-status', userId] }),
        queryClient.invalidateQueries({ queryKey: walletKeys.all(userId) }),
      ]);
    } catch (err) {
      setActionError(translateError(err, 'earn.mission.claimFailed'));
    } finally {
      setClaiming(false);
    }
  }, [claimState, claiming, queryClient, userId]);

  const queryError = snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null;

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  return {
    t,
    loading: authLoading || snapshotLoading,
    error: actionError ?? queryError,
    attendance,
    streak: snapshot?.streak ?? null,
    cycleDays,
    routineSteps,
    todayRewardLabel,
    nextRewardLabel,
    totalEarnedLabel,
    claimState,
    claiming,
    showStreakMilestone,
    claimAttendance,
  };
}
