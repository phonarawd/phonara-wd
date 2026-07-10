/**
 * Windows Task Scheduler lifecycle for PHONARA perf observe/finalize tasks.
 * Query-first · idempotent delete · locale-independent (exit codes only).
 * deleteAllPerfObserveTasks is state-agnostic — never reads rollout-state.json.
 */
import { spawnSyncSafe } from './spawn-safe';

export const TASK_PERF_OBSERVE = 'PHONARA-cursor-tsserver-observe' as const;
export const TASK_PERF_FINALIZE_ONESHOT = 'PHONARA-cursor-tsserver-finalize' as const;

export const PERF_OBSERVE_TASK_NAMES = [TASK_PERF_OBSERVE, TASK_PERF_FINALIZE_ONESHOT] as const;

export type PerfObserveTaskName = (typeof PERF_OBSERVE_TASK_NAMES)[number];

export type SchtasksCommandResult = {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
};

export type SchtasksExec = {
  query: (taskName: string) => SchtasksCommandResult;
  delete: (taskName: string) => SchtasksCommandResult;
};

export type DeleteScheduledTaskResult = {
  ok: true;
  taskName: string;
  /** Query reported the task absent — Delete was not invoked. */
  skipped: boolean;
  /** Delete ran and removed the task (or race-not-found treated as removed). */
  deleted: boolean;
};

export type DeleteAllPerfObserveTasksResult = {
  ok: true;
  deleted: PerfObserveTaskName[];
  skipped: PerfObserveTaskName[];
};

export type VerifyScheduleCleanResult = {
  clean: boolean;
  observe_exists: boolean;
  finalize_oneshot_exists: boolean;
};

/** schtasks /Query and /Delete both use exit 1 when the task is missing (locale-independent). */
export function isSchtasksNotFoundExit(exitCode: number | null): boolean {
  return exitCode === 1;
}

function runSchtasks(args: string[]): SchtasksCommandResult {
  const result = spawnSyncSafe('schtasks', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30_000,
  });
  return { exitCode: result.status, signal: result.signal };
}

export const defaultSchtasksExec: SchtasksExec = {
  query: (taskName) => runSchtasks(['/Query', '/TN', taskName, '/FO', 'LIST']),
  delete: (taskName) => runSchtasks(['/Delete', '/TN', taskName, '/F']),
};

/** Query-first existence check — exit 0 means the task is registered. */
export function scheduledTaskExists(
  taskName: string,
  exec: SchtasksExec = defaultSchtasksExec,
): boolean {
  if (process.platform !== 'win32') return false;
  return exec.query(taskName).exitCode === 0;
}

/**
 * Idempotent delete — Query first; skip Delete when absent.
 * Delete failures throw using exit code only (no stderr locale parsing).
 */
export function deleteScheduledTask(
  taskName: string,
  exec: SchtasksExec = defaultSchtasksExec,
): DeleteScheduledTaskResult {
  if (process.platform !== 'win32') {
    return { ok: true, taskName, skipped: true, deleted: false };
  }

  if (!scheduledTaskExists(taskName, exec)) {
    return { ok: true, taskName, skipped: true, deleted: false };
  }

  const result = exec.delete(taskName);
  if (result.exitCode === 0) {
    return { ok: true, taskName, skipped: false, deleted: true };
  }
  if (isSchtasksNotFoundExit(result.exitCode)) {
    return { ok: true, taskName, skipped: false, deleted: true };
  }

  throw new Error(`schtasks /Delete failed for ${taskName} (exit ${String(result.exitCode)})`);
}

/** Removes observe + finalize one-shot tasks — rollout state is never consulted. */
export function deleteAllPerfObserveTasks(
  exec: SchtasksExec = defaultSchtasksExec,
): DeleteAllPerfObserveTasksResult {
  const deleted: PerfObserveTaskName[] = [];
  const skipped: PerfObserveTaskName[] = [];

  for (const taskName of PERF_OBSERVE_TASK_NAMES) {
    const outcome = deleteScheduledTask(taskName, exec);
    if (outcome.skipped) {
      skipped.push(taskName);
    } else if (outcome.deleted) {
      deleted.push(taskName);
    }
  }

  return { ok: true, deleted, skipped };
}

/** Query-only schedule hygiene check — no rollout-state dependency. */
export function verifyScheduleClean(
  exec: SchtasksExec = defaultSchtasksExec,
): VerifyScheduleCleanResult {
  const observe_exists = scheduledTaskExists(TASK_PERF_OBSERVE, exec);
  const finalize_oneshot_exists = scheduledTaskExists(TASK_PERF_FINALIZE_ONESHOT, exec);
  return {
    clean: !observe_exists && !finalize_oneshot_exists,
    observe_exists,
    finalize_oneshot_exists,
  };
}
