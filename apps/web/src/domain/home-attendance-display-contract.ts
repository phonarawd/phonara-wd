/**
 * `/home/attendance` — daily check-in · 7-day reward cycle · §13.10 RoutineCard step 1.
 * Money: `rpc_get_earn_hub_status` read + `rpc_claim_daily_reward` claim only — no client math.
 */

import type { MessageKey } from '@phonara/i18n';

import { EARN_PLAY_ROUTE, parseEarnHubRouletteSnapshot } from './earn-play-display-contract';
import { HOME_MISSIONS_ROUTE } from './home-missions-display-contract';
import { REFERRAL_INVITE_ROUTE } from './referral-hub-display-contract';
import { formatPhonRewardDisplay } from './viral-missions-display-contract';

/**
 * Re-exported for existing consumers (`use-home-attendance-page-controller.ts`,
 * `use-earn-home-page-controller.ts`). Owner moved to `earn-play-display-contract.ts`
 * 2026-07-15 to break a circular import (`home-attendance` <-> `earn-play`) that
 * caused a TDZ `ReferenceError` crash loop on the `/` landing route in dev.
 */
export { parseEarnHubRouletteSnapshot };

export const HOME_ATTENDANCE_ROUTE = '/home/attendance' as const;
export const DAILY_REWARD_CLAIM_RPC = 'rpc_claim_daily_reward' as const;

/** Engine default — display fallback when config RPC unavailable. */
export const DEFAULT_ATTENDANCE_CYCLE_PHON = [
  '1000',
  '1000',
  '1000',
  '1500',
  '2000',
  '2500',
  '5000',
] as const;

export type AttendanceCycleDayState = 'completed' | 'current' | 'upcoming';

export type AttendanceCycleDayView = {
  day: number;
  rewardLabel: string;
  state: AttendanceCycleDayState;
};

export type AttendanceHubSnapshot = {
  used: number;
  max: number;
  remaining: number;
  cycleDay: number;
  todayRewardPhon: string;
  resetsAt: string | null;
};

export type UserStreakSnapshot = {
  currentStreak: number;
  longestStreak: number;
  totalPhonEarned: string;
  lastClaimedDate: string | null;
};

export type DailyRewardClaimResult = {
  alreadyClaimed: boolean;
  phonAwarded: string;
  streakDay: number;
  cycleDay: number;
  nextDayPreview: string | null;
};

export type RoutineStepId = 'attendance' | 'roulette' | 'quiz' | 'share' | 'weekly';

export type RoutineStepDefinition = {
  id: RoutineStepId;
  labelKey: MessageKey;
  route: string;
  durationKey: MessageKey;
};

/** §13.10.4 — today's side-hustle routine (presentation order only). */
export const ROUTINE_STEP_DEFINITIONS: readonly RoutineStepDefinition[] = [
  {
    id: 'attendance',
    labelKey: 'earn.routine.step.attendance',
    route: HOME_ATTENDANCE_ROUTE,
    durationKey: 'earn.routine.duration.attendance',
  },
  {
    id: 'roulette',
    labelKey: 'earn.routine.step.roulette',
    route: EARN_PLAY_ROUTE,
    durationKey: 'earn.routine.duration.roulette',
  },
  {
    id: 'quiz',
    labelKey: 'earn.routine.step.quiz',
    route: `${HOME_MISSIONS_ROUTE}?tab=daily`,
    durationKey: 'earn.routine.duration.quiz',
  },
  {
    id: 'share',
    labelKey: 'earn.routine.step.share',
    route: REFERRAL_INVITE_ROUTE,
    durationKey: 'earn.routine.duration.share',
  },
  {
    id: 'weekly',
    labelKey: 'earn.routine.step.weekly',
    route: `${HOME_MISSIONS_ROUTE}?tab=weekly`,
    durationKey: 'earn.routine.duration.weekly',
  },
] as const;

export type RoutineStepView = RoutineStepDefinition & {
  done: boolean;
  current: boolean;
};

export function parseEarnHubAttendanceSnapshot(
  payload: Record<string, unknown> | null | undefined,
): AttendanceHubSnapshot | null {
  const attendance = payload?.['attendance'];
  if (!attendance || typeof attendance !== 'object') return null;
  const row = attendance as Record<string, unknown>;

  return {
    used: Number(row['used'] ?? 0),
    max: Number(row['max'] ?? 1),
    remaining: Number(row['remaining'] ?? 0),
    cycleDay: Number(row['cycle_day'] ?? 1),
    todayRewardPhon: String(row['next_reward_phon'] ?? '0'),
    resetsAt: row['resets_at'] != null ? String(row['resets_at']) : null,
  };
}

export function parseUserStreakRow(
  row: Record<string, unknown> | null | undefined,
): UserStreakSnapshot | null {
  if (!row) return null;
  return {
    currentStreak: Number(row['current_streak'] ?? 0),
    longestStreak: Number(row['longest_streak'] ?? 0),
    totalPhonEarned: String(row['total_phon_earned'] ?? '0'),
    lastClaimedDate: row['last_claimed_date'] != null ? String(row['last_claimed_date']) : null,
  };
}

export function parseAttendanceCycleFromRewardConfig(
  payload: Record<string, unknown> | null | undefined,
): readonly string[] {
  const raw = payload?.['attendance_cycle'];
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_ATTENDANCE_CYCLE_PHON;
  const values = raw
    .map((entry) => {
      const numeric = Number(entry);
      if (!Number.isFinite(numeric) || numeric <= 0) return null;
      return String(numeric);
    })
    .filter((value): value is string => Boolean(value));
  if (values.length === 0) return DEFAULT_ATTENDANCE_CYCLE_PHON;
  while (values.length < 7) {
    values.push(values[values.length - 1] ?? '1000');
  }
  return values.slice(0, 7);
}

export function parseDailyRewardClaimResult(
  payload: Record<string, unknown> | null | undefined,
): DailyRewardClaimResult | null {
  if (!payload) return null;
  return {
    alreadyClaimed: Boolean(payload['already_claimed']),
    phonAwarded: String(payload['phon_awarded'] ?? '0'),
    streakDay: Number(payload['streak_day'] ?? 0),
    cycleDay: Number(payload['cycle_day'] ?? 1),
    nextDayPreview:
      payload['next_day_preview'] != null ? String(payload['next_day_preview']) : null,
  };
}

export function buildAttendanceCycleDays(params: {
  cycleDay: number;
  claimedToday: boolean;
  rewards: readonly string[];
}): AttendanceCycleDayView[] {
  const cycleDay = Math.min(7, Math.max(1, params.cycleDay));
  const rewards = params.rewards.length >= 7 ? params.rewards : DEFAULT_ATTENDANCE_CYCLE_PHON;

  return Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    let state: AttendanceCycleDayState = 'upcoming';
    if (params.claimedToday) {
      state = day <= cycleDay ? 'completed' : 'upcoming';
    } else if (day < cycleDay) {
      state = 'completed';
    } else if (day === cycleDay) {
      state = 'current';
    }

    return {
      day,
      rewardLabel: formatPhonRewardDisplay(rewards[index] ?? '0'),
      state,
    };
  });
}

export function buildRoutineSteps(params: {
  attendanceRemaining: number;
  rouletteRemaining: number;
  quizDone: boolean;
  shareDone: boolean;
  weeklyDone: boolean;
}): RoutineStepView[] {
  const doneById: Record<RoutineStepId, boolean> = {
    attendance: params.attendanceRemaining <= 0,
    roulette: params.rouletteRemaining <= 0,
    quiz: params.quizDone,
    share: params.shareDone,
    weekly: params.weeklyDone,
  };

  const firstOpenIndex = ROUTINE_STEP_DEFINITIONS.findIndex((step) => !doneById[step.id]);

  return ROUTINE_STEP_DEFINITIONS.map((step, index) => ({
    ...step,
    done: doneById[step.id],
    current: !doneById[step.id] && index === firstOpenIndex,
  }));
}

export function resolveAttendanceClaimState(params: {
  claimedToday: boolean;
  remaining: number;
}): 'reward_pending' | 'completed' {
  if (params.claimedToday || params.remaining <= 0) return 'completed';
  return 'reward_pending';
}

export function resolveNextCycleDayNumber(cycleDay: number, claimedToday: boolean): number {
  const normalized = Math.min(7, Math.max(1, cycleDay));
  if (!claimedToday) return normalized;
  return normalized >= 7 ? 1 : normalized + 1;
}

export function resolveCycleRewardPhon(rewards: readonly string[], cycleDayNumber: number): string {
  const rewardsList = rewards.length >= 7 ? rewards : DEFAULT_ATTENDANCE_CYCLE_PHON;
  const index = Math.min(6, Math.max(0, cycleDayNumber - 1));
  return rewardsList[index] ?? '0';
}
