/**
 * schedule-observe — Windows Task Scheduler for tsserver trial (opt-in perf-rollout only).
 * Query-first idempotent create · daily observe + one-shot finalize after TRIAL_WINDOW_DAYS.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBunExe, spawnSyncSafe } from './spawn-safe';
import {
  scheduledTaskExists,
  TASK_PERF_FINALIZE_ONESHOT,
  TASK_PERF_OBSERVE,
  type SchtasksExec,
} from './schtasks-lifecycle';
import {
  ensureObserveWindowStart,
  TRIAL_WINDOW_DAYS,
  type RolloutState,
} from './tsserver-observe-core';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const OBSERVE_DAILY_START_TIME = '09:00' as const;
export const FINALIZE_ONESHOT_TIME = '10:00' as const;

export type SchtasksCreateExec = SchtasksExec & {
  create: (args: string[]) => { exitCode: number | null; signal: NodeJS.Signals | null };
};

export type SchedulePerfObserveTasksResult = {
  ok: true;
  platform: NodeJS.Platform;
  skipped: boolean;
  observe_task: { name: string; created: boolean; skipped: boolean };
  finalize_task: { name: string; created: boolean; skipped: boolean };
  window_start: string;
  finalize_run_at: string;
  message: string;
};

export function perfRolloutRepoRoot(): string {
  return REPO_ROOT;
}

export function formatSchtasksDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/** Local wall-clock HH:mm for schtasks /ST. */
export function formatSchtasksTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function computeFinalizeRunAt(
  windowStart: Date = new Date(),
  trialDays: number = TRIAL_WINDOW_DAYS,
): Date {
  const runAt = new Date(windowStart);
  runAt.setDate(runAt.getDate() + trialDays);
  const [hours, minutes] = FINALIZE_ONESHOT_TIME.split(':').map((part) =>
    Number.parseInt(part, 10),
  );
  runAt.setHours(hours ?? 10, minutes ?? 0, 0, 0);
  return runAt;
}

function escapePowerShellLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

export function buildObserveTaskRun(
  repoRoot: string = REPO_ROOT,
  bunExe: string = resolveBunExe(),
): string {
  const root = escapePowerShellLiteral(repoRoot);
  const bun = escapePowerShellLiteral(bunExe);
  return (
    `powershell.exe -NoProfile -WindowStyle Hidden -Command ` +
    `"Set-Location -LiteralPath '${root}'; ` +
    `$env:PHONARA_TSSERVER_OBSERVE_SOURCE='scheduled'; ` +
    `& '${bun}' run cursor:tsserver-observe"`
  );
}

export function buildFinalizeTaskRun(
  repoRoot: string = REPO_ROOT,
  bunExe: string = resolveBunExe(),
): string {
  const root = escapePowerShellLiteral(repoRoot);
  const bun = escapePowerShellLiteral(bunExe);
  return (
    `powershell.exe -NoProfile -WindowStyle Hidden -Command ` +
    `"Set-Location -LiteralPath '${root}'; ` +
    `& '${bun}' run cursor:tsserver-observe:finalize"`
  );
}

function runSchtasksCreate(args: string[]): {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
} {
  const result = spawnSyncSafe('schtasks', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30_000,
  });
  return { exitCode: result.status, signal: result.signal };
}

export const defaultSchtasksCreateExec: SchtasksCreateExec = {
  query: (taskName) => {
    const result = spawnSyncSafe('schtasks', ['/Query', '/TN', taskName, '/FO', 'LIST'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
    });
    return { exitCode: result.status, signal: result.signal };
  },
  delete: (taskName) => {
    const result = spawnSyncSafe('schtasks', ['/Delete', '/TN', taskName, '/F'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
    });
    return { exitCode: result.status, signal: result.signal };
  },
  create: runSchtasksCreate,
};

export function createScheduledTaskIdempotent(
  taskName: string,
  createArgs: string[],
  exec: SchtasksCreateExec = defaultSchtasksCreateExec,
): { created: boolean; skipped: boolean } {
  if (process.platform !== 'win32') {
    return { created: false, skipped: true };
  }

  if (scheduledTaskExists(taskName, exec)) {
    return { created: false, skipped: true };
  }

  const result = exec.create(createArgs);
  if (result.exitCode === 0) {
    return { created: true, skipped: false };
  }

  if (scheduledTaskExists(taskName, exec)) {
    return { created: false, skipped: true };
  }

  throw new Error(`schtasks /Create failed for ${taskName} (exit ${String(result.exitCode)})`);
}

export function schedulePerfObserveTasks(options?: {
  now?: Date;
  repoRoot?: string;
  bunExe?: string;
  exec?: SchtasksCreateExec;
  rolloutStatePath?: string;
  ensureWindow?: (
    windowStart: string,
    filePath?: string,
  ) => { started: boolean; windowStart: string };
}): SchedulePerfObserveTasksResult {
  const now = options?.now ?? new Date();
  const repoRoot = options?.repoRoot ?? REPO_ROOT;
  const bunExe = options?.bunExe ?? resolveBunExe();
  const exec = options?.exec ?? defaultSchtasksCreateExec;
  const ensureWindow = options?.ensureWindow ?? ensureObserveWindowStart;
  const window = ensureWindow(now.toISOString(), options?.rolloutStatePath);
  const finalizeRunAt = computeFinalizeRunAt(new Date(window.windowStart));

  if (process.platform !== 'win32') {
    return {
      ok: true,
      platform: process.platform,
      skipped: true,
      observe_task: { name: TASK_PERF_OBSERVE, created: false, skipped: true },
      finalize_task: { name: TASK_PERF_FINALIZE_ONESHOT, created: false, skipped: true },
      window_start: window.windowStart,
      finalize_run_at: finalizeRunAt.toISOString(),
      message: 'schedule-observe skipped — schtasks requires win32',
    };
  }

  const observeRun = buildObserveTaskRun(repoRoot, bunExe);
  const observeOutcome = createScheduledTaskIdempotent(
    TASK_PERF_OBSERVE,
    [
      '/Create',
      '/TN',
      TASK_PERF_OBSERVE,
      '/TR',
      observeRun,
      '/SC',
      'DAILY',
      '/ST',
      OBSERVE_DAILY_START_TIME,
      '/F',
    ],
    exec,
  );

  const finalizeRun = buildFinalizeTaskRun(repoRoot, bunExe);
  const finalizeOutcome = createScheduledTaskIdempotent(
    TASK_PERF_FINALIZE_ONESHOT,
    [
      '/Create',
      '/TN',
      TASK_PERF_FINALIZE_ONESHOT,
      '/TR',
      finalizeRun,
      '/SC',
      'ONCE',
      '/ST',
      formatSchtasksTime(finalizeRunAt),
      '/SD',
      formatSchtasksDate(finalizeRunAt),
      '/F',
    ],
    exec,
  );

  const parts: string[] = [];
  if (observeOutcome.created) parts.push('observe daily task created');
  else if (observeOutcome.skipped) parts.push('observe task already registered');
  if (finalizeOutcome.created)
    parts.push(
      `finalize one-shot scheduled ${formatSchtasksDate(finalizeRunAt)} ${formatSchtasksTime(finalizeRunAt)}`,
    );
  else if (finalizeOutcome.skipped) parts.push('finalize one-shot already registered');

  return {
    ok: true,
    platform: process.platform,
    skipped: observeOutcome.skipped && finalizeOutcome.skipped,
    observe_task: { name: TASK_PERF_OBSERVE, ...observeOutcome },
    finalize_task: { name: TASK_PERF_FINALIZE_ONESHOT, ...finalizeOutcome },
    window_start: window.windowStart,
    finalize_run_at: finalizeRunAt.toISOString(),
    message: parts.join(' · '),
  };
}

export function formatScheduleObserveStatusLine(result: SchedulePerfObserveTasksResult): string {
  return `[schedule-observe] window=${result.window_start} · finalize=${result.finalize_run_at} · ${result.message}`;
}

export type { RolloutState };
