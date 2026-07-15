import { afterEach, describe, expect, it } from 'vitest';
import {
  deleteAllPerfObserveTasks,
  deleteScheduledTask,
  isSchtasksNotFoundExit,
  PERF_OBSERVE_TASK_NAMES,
  scheduledTaskExists,
  TASK_PERF_FINALIZE_ONESHOT,
  TASK_PERF_OBSERVE,
  type SchtasksExec,
  verifyScheduleClean,
} from '../../scripts/lib/schtasks-lifecycle';

function mockExec(input: {
  query?: Record<string, number>;
  delete?: Record<string, number>;
  deleteCalls?: string[];
  queryCalls?: string[];
}): SchtasksExec {
  const deleteCalls: string[] = input.deleteCalls ?? [];
  const queryCalls: string[] = input.queryCalls ?? [];

  return {
    query: (taskName) => {
      queryCalls.push(taskName);
      const exitCode = input.query?.[taskName] ?? 1;
      return { exitCode, signal: null };
    },
    delete: (taskName) => {
      deleteCalls.push(taskName);
      const exitCode = input.delete?.[taskName] ?? 0;
      return { exitCode, signal: null };
    },
  };
}

describe('schtasks-lifecycle (Query-first · v4.3.2)', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('treats schtasks exit 1 as not-found', () => {
    expect(isSchtasksNotFoundExit(1)).toBe(true);
    expect(isSchtasksNotFoundExit(0)).toBe(false);
    expect(isSchtasksNotFoundExit(2)).toBe(false);
  });

  it('scheduledTaskExists uses Query exit 0 only', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const exec = mockExec({
      query: { [TASK_PERF_OBSERVE]: 0, [TASK_PERF_FINALIZE_ONESHOT]: 1 },
    });

    expect(scheduledTaskExists(TASK_PERF_OBSERVE, exec)).toBe(true);
    expect(scheduledTaskExists(TASK_PERF_FINALIZE_ONESHOT, exec)).toBe(false);
  });

  it('deleteScheduledTask skips Delete when Query reports absent (idempotent)', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const deleteCalls: string[] = [];
    const exec = mockExec({
      query: { [TASK_PERF_OBSERVE]: 1 },
      deleteCalls,
    });

    const result = deleteScheduledTask(TASK_PERF_OBSERVE, exec);
    expect(result).toEqual({
      ok: true,
      taskName: TASK_PERF_OBSERVE,
      skipped: true,
      deleted: false,
    });
    expect(deleteCalls).toEqual([]);
  });

  it('deleteScheduledTask deletes when Query reports present', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const deleteCalls: string[] = [];
    const exec = mockExec({
      query: { [TASK_PERF_OBSERVE]: 0 },
      delete: { [TASK_PERF_OBSERVE]: 0 },
      deleteCalls,
    });

    const result = deleteScheduledTask(TASK_PERF_OBSERVE, exec);
    expect(result.deleted).toBe(true);
    expect(result.skipped).toBe(false);
    expect(deleteCalls).toEqual([TASK_PERF_OBSERVE]);
  });

  it('swallows Delete not-found exit without parsing stderr (race after Query)', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const exec = mockExec({
      query: { [TASK_PERF_OBSERVE]: 0 },
      delete: { [TASK_PERF_OBSERVE]: 1 },
    });

    const result = deleteScheduledTask(TASK_PERF_OBSERVE, exec);
    expect(result.deleted).toBe(true);
    expect(result.skipped).toBe(false);
  });

  it('throws on Delete failure using exit code only', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const exec = mockExec({
      query: { [TASK_PERF_OBSERVE]: 0 },
      delete: { [TASK_PERF_OBSERVE]: 5 },
    });

    expect(() => deleteScheduledTask(TASK_PERF_OBSERVE, exec)).toThrow(/exit 5/);
  });

  it('deleteAllPerfObserveTasks queries both tasks without rollout state', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const queryCalls: string[] = [];
    const deleteCalls: string[] = [];
    const exec = mockExec({
      query: {
        [TASK_PERF_OBSERVE]: 0,
        [TASK_PERF_FINALIZE_ONESHOT]: 0,
      },
      delete: {
        [TASK_PERF_OBSERVE]: 0,
        [TASK_PERF_FINALIZE_ONESHOT]: 0,
      },
      queryCalls,
      deleteCalls,
    });

    const result = deleteAllPerfObserveTasks(exec);
    expect(result.deleted).toEqual([...PERF_OBSERVE_TASK_NAMES]);
    expect(result.skipped).toEqual([]);
    expect(queryCalls).toEqual([...PERF_OBSERVE_TASK_NAMES]);
    expect(deleteCalls).toEqual([...PERF_OBSERVE_TASK_NAMES]);
  });

  it('deleteAllPerfObserveTasks is no-op when both tasks absent', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const deleteCalls: string[] = [];
    const exec = mockExec({
      query: {
        [TASK_PERF_OBSERVE]: 1,
        [TASK_PERF_FINALIZE_ONESHOT]: 1,
      },
      deleteCalls,
    });

    const result = deleteAllPerfObserveTasks(exec);
    expect(result.deleted).toEqual([]);
    expect(result.skipped).toEqual([...PERF_OBSERVE_TASK_NAMES]);
    expect(deleteCalls).toEqual([]);
  });

  it('deleteAllPerfObserveTasks deletes oneshot via Query even when observe is absent', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const deleteCalls: string[] = [];
    const exec = mockExec({
      query: {
        [TASK_PERF_OBSERVE]: 1,
        [TASK_PERF_FINALIZE_ONESHOT]: 0,
      },
      delete: {
        [TASK_PERF_FINALIZE_ONESHOT]: 0,
      },
      deleteCalls,
    });

    const result = deleteAllPerfObserveTasks(exec);
    expect(result.deleted).toEqual([TASK_PERF_FINALIZE_ONESHOT]);
    expect(result.skipped).toEqual([TASK_PERF_OBSERVE]);
    expect(deleteCalls).toEqual([TASK_PERF_FINALIZE_ONESHOT]);
  });

  it('verifyScheduleClean uses Query-only checks', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const exec = mockExec({
      query: {
        [TASK_PERF_OBSERVE]: 1,
        [TASK_PERF_FINALIZE_ONESHOT]: 1,
      },
    });

    expect(verifyScheduleClean(exec)).toEqual({
      clean: true,
      observe_exists: false,
      finalize_oneshot_exists: false,
    });
  });

  it('non-Windows platform skips schtasks and returns idempotent skip', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const deleteCalls: string[] = [];
    const exec = mockExec({ deleteCalls });

    const single = deleteScheduledTask(TASK_PERF_OBSERVE, exec);
    expect(single.skipped).toBe(true);

    const all = deleteAllPerfObserveTasks(exec);
    expect(all.skipped).toEqual([...PERF_OBSERVE_TASK_NAMES]);
    expect(deleteCalls).toEqual([]);
  });
});
