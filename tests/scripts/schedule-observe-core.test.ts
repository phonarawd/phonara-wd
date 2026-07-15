import { afterEach, describe, expect, it } from 'vitest';
import {
  buildFinalizeTaskRun,
  buildObserveTaskRun,
  computeFinalizeRunAt,
  createScheduledTaskIdempotent,
  formatSchtasksDate,
  formatSchtasksTime,
  schedulePerfObserveTasks,
  type SchtasksCreateExec,
} from '../../scripts/lib/schedule-observe-core';
import {
  TASK_PERF_FINALIZE_ONESHOT,
  TASK_PERF_OBSERVE,
} from '../../scripts/lib/schtasks-lifecycle';
import { TRIAL_WINDOW_DAYS } from '../../scripts/lib/tsserver-observe-core';

function mockCreateExec(input: {
  query?: Record<string, number>;
  create?: Record<string, number>;
  createCalls?: string[][];
  queryCalls?: string[];
}): SchtasksCreateExec {
  const createCalls: string[][] = input.createCalls ?? [];
  const queryCalls: string[] = input.queryCalls ?? [];

  return {
    query: (taskName) => {
      queryCalls.push(taskName);
      return { exitCode: input.query?.[taskName] ?? 1, signal: null };
    },
    delete: () => ({ exitCode: 0, signal: null }),
    create: (args) => {
      createCalls.push(args);
      const taskName = args[args.indexOf('/TN') + 1] ?? 'unknown';
      return { exitCode: input.create?.[taskName] ?? 0, signal: null };
    },
  };
}

describe('schedule-observe-core (opt-in perf-rollout)', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('computeFinalizeRunAt adds TRIAL_WINDOW_DAYS at finalize time', () => {
    const windowStart = new Date('2026-07-10T08:30:00.000Z');
    const runAt = computeFinalizeRunAt(windowStart);
    expect(runAt.getDate()).toBe(windowStart.getDate() + TRIAL_WINDOW_DAYS);
    expect(formatSchtasksTime(runAt)).toBe('10:00');
  });

  it('buildObserveTaskRun sets scheduled observe source env', () => {
    const command = buildObserveTaskRun('C:\\repo', 'C:\\bun.exe');
    expect(command).toContain("PHONARA_TSSERVER_OBSERVE_SOURCE='scheduled'");
    expect(command).toContain('cursor:tsserver-observe');
  });

  it('buildFinalizeTaskRun targets observe finalize script', () => {
    const command = buildFinalizeTaskRun('C:\\repo', 'C:\\bun.exe');
    expect(command).toContain('cursor:tsserver-observe:finalize');
  });

  it('createScheduledTaskIdempotent skips create when Query reports present', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const createCalls: string[][] = [];
    const exec = mockCreateExec({
      query: { [TASK_PERF_OBSERVE]: 0 },
      createCalls,
    });

    const result = createScheduledTaskIdempotent(
      TASK_PERF_OBSERVE,
      ['/Create', '/TN', TASK_PERF_OBSERVE, '/F'],
      exec,
    );

    expect(result).toEqual({ created: false, skipped: true });
    expect(createCalls).toEqual([]);
  });

  it('schedulePerfObserveTasks creates observe daily and finalize one-shot on win32', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const createCalls: string[][] = [];
    const exec = mockCreateExec({
      query: {
        [TASK_PERF_OBSERVE]: 1,
        [TASK_PERF_FINALIZE_ONESHOT]: 1,
      },
      createCalls,
    });

    const now = new Date('2026-07-10T12:00:00.000Z');
    const result = schedulePerfObserveTasks({
      now,
      repoRoot: 'C:\\phonara-gb',
      bunExe: 'C:\\bun.exe',
      exec,
      ensureWindow: () => ({ started: true, windowStart: now.toISOString() }),
    });

    expect(result.skipped).toBe(false);
    expect(result.observe_task.created).toBe(true);
    expect(result.finalize_task.created).toBe(true);
    expect(createCalls).toHaveLength(2);

    const observeArgs = createCalls[0] ?? [];
    expect(observeArgs).toContain('/SC');
    expect(observeArgs[observeArgs.indexOf('/SC') + 1]).toBe('DAILY');

    const finalizeArgs = createCalls[1] ?? [];
    expect(finalizeArgs[finalizeArgs.indexOf('/SC') + 1]).toBe('ONCE');
    expect(finalizeArgs).toContain(formatSchtasksDate(computeFinalizeRunAt(now)));
  });

  it('schedulePerfObserveTasks skips schtasks on non-win32', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const result = schedulePerfObserveTasks({
      ensureWindow: () => ({ started: true, windowStart: '2026-07-10T12:00:00.000Z' }),
    });
    expect(result.skipped).toBe(true);
    expect(result.message).toContain('win32');
  });
});
