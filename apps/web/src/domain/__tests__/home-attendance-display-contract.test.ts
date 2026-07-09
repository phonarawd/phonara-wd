import { describe, expect, it } from 'vitest';

import {
  buildAttendanceCycleDays,
  buildRoutineSteps,
  DEFAULT_ATTENDANCE_CYCLE_PHON,
  HOME_ATTENDANCE_ROUTE,
  parseDailyRewardClaimResult,
  parseEarnHubAttendanceSnapshot,
  resolveAttendanceClaimState,
  resolveCycleRewardPhon,
  resolveNextCycleDayNumber,
} from '../home-attendance-display-contract';

describe('home-attendance-display-contract', () => {
  it('locks canonical route and ENGINE:exists claim RPC', () => {
    expect(HOME_ATTENDANCE_ROUTE).toBe('/home/attendance');
  });

  it('parses earn hub attendance snapshot', () => {
    expect(
      parseEarnHubAttendanceSnapshot({
        attendance: {
          used: 0,
          max: 1,
          remaining: 1,
          cycle_day: 3,
          next_reward_phon: '1000.000000',
          resets_at: '2026-07-06T15:00:00.000Z',
        },
      }),
    ).toEqual({
      used: 0,
      max: 1,
      remaining: 1,
      cycleDay: 3,
      todayRewardPhon: '1000.000000',
      resetsAt: '2026-07-06T15:00:00.000Z',
    });
  });

  it('builds 7-day cycle states before and after claim', () => {
    const pending = buildAttendanceCycleDays({
      cycleDay: 3,
      claimedToday: false,
      rewards: DEFAULT_ATTENDANCE_CYCLE_PHON,
    });
    expect(pending.map((day) => day.state)).toEqual([
      'completed',
      'completed',
      'current',
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);

    const claimed = buildAttendanceCycleDays({
      cycleDay: 3,
      claimedToday: true,
      rewards: DEFAULT_ATTENDANCE_CYCLE_PHON,
    });
    expect(claimed.map((day) => day.state)).toEqual([
      'completed',
      'completed',
      'completed',
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
  });

  it('parses claim response without client reward math', () => {
    expect(
      parseDailyRewardClaimResult({
        already_claimed: false,
        phon_awarded: '1500.000000',
        streak_day: 4,
        cycle_day: 4,
        next_day_preview: '2000.000000',
      }),
    ).toEqual({
      alreadyClaimed: false,
      phonAwarded: '1500.000000',
      streakDay: 4,
      cycleDay: 4,
      nextDayPreview: '2000.000000',
    });
  });

  it('resolves claim state and next cycle reward from hub read', () => {
    expect(resolveAttendanceClaimState({ claimedToday: false, remaining: 1 })).toBe(
      'reward_pending',
    );
    expect(resolveAttendanceClaimState({ claimedToday: true, remaining: 0 })).toBe('completed');
    expect(resolveNextCycleDayNumber(7, true)).toBe(1);
    expect(resolveCycleRewardPhon(DEFAULT_ATTENDANCE_CYCLE_PHON, 7)).toBe('5000');
  });

  it('builds routine steps with attendance first and done flags from hub reads', () => {
    const steps = buildRoutineSteps({
      attendanceRemaining: 0,
      rouletteRemaining: 1,
      quizDone: false,
      shareDone: false,
      weeklyDone: false,
    });
    expect(steps[0]?.id).toBe('attendance');
    expect(steps[0]?.done).toBe(true);
    expect(steps[1]?.current).toBe(true);
  });
});
