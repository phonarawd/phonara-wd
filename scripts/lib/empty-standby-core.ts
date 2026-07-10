/**
 * Empty Standby List — opt-in RAM relief for 8GB PCs (v4.3.2 / §5-B).
 * Best-effort only: failures must never block cursor:work-end (exit 0).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const STANDBY_HANG_TIMEOUT_MS = 8_000;
export const EMPTY_STANDBY_ENV = 'PHONARA_EMPTY_STANDBY' as const;
export const EMPTY_STANDBY_EXE_ENV = 'PHONARA_EMPTY_STANDBY_EXE' as const;
/** Safer default — clears lowest-priority standby only (plan v3). */
export const EMPTY_STANDBY_ARG = 'priority0standbylist' as const;

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export type StandbyFailureReason =
  | 'disabled'
  | 'exe_missing'
  | 'permission_denied'
  | 'timed_out'
  | 'spawn_error'
  | 'nonzero_exit'
  | 'success';

export interface StandbySpawnOutcome {
  exitCode: number | null;
  error: NodeJS.ErrnoException | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  elapsed_ms: number;
}

export interface StandbyRunResult {
  attempted: boolean;
  /** true when skipped, succeeded, or failure was isolated (work-end safe). */
  ok: boolean;
  skipped: boolean;
  reason: StandbyFailureReason;
  elapsed_ms: number;
  exit_code: number | null;
  message: string;
}

export type StandbySpawnSync = (
  exePath: string,
  args: readonly string[],
  timeoutMs: number,
) => StandbySpawnOutcome;

export function emptyStandbyOptInEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env[EMPTY_STANDBY_ENV]?.trim();
  return raw === '1' || raw?.toLowerCase() === 'true';
}

export function defaultEmptyStandbyExeCandidates(
  env: NodeJS.ProcessEnv = process.env,
  homeDir: string = homedir(),
): string[] {
  const override = env[EMPTY_STANDBY_EXE_ENV]?.trim();
  const candidates = [
    override,
    path.join(REPO_ROOT, 'tools', 'EmptyStandbyList.exe'),
    path.join(homeDir, 'Desktop', 'EmptyStandbyList.exe'),
    path.join(homeDir, 'tools', 'EmptyStandbyList.exe'),
    path.join(
      env.LOCALAPPDATA ?? path.join(homeDir, 'AppData', 'Local'),
      'phonara',
      'tools',
      'EmptyStandbyList.exe',
    ),
  ];
  return candidates.filter((candidate): candidate is string => Boolean(candidate?.trim()));
}

export function resolveEmptyStandbyExePath(
  env: NodeJS.ProcessEnv = process.env,
  exists: (filePath: string) => boolean = existsSync,
): string | null {
  for (const candidate of defaultEmptyStandbyExeCandidates(env)) {
    if (exists(candidate)) return candidate;
  }
  return null;
}

export function defaultStandbySpawnSync(
  exePath: string,
  args: readonly string[],
  timeoutMs: number,
): StandbySpawnOutcome {
  const started = Date.now();
  const result = spawnSync(exePath, [...args], {
    stdio: 'ignore',
    timeout: timeoutMs,
    windowsHide: true,
  });
  return {
    exitCode: result.status,
    error: result.error ?? null,
    signal: result.signal,
    timedOut: Boolean(result.error && (result.error as NodeJS.ErrnoException).code === 'ETIMEDOUT'),
    elapsed_ms: Date.now() - started,
  };
}

export function classifyStandbySpawnOutcome(
  outcome: StandbySpawnOutcome,
  options?: { exeExists?: boolean },
): StandbyRunResult {
  if (options?.exeExists === false) {
    return {
      attempted: false,
      ok: true,
      skipped: true,
      reason: 'exe_missing',
      elapsed_ms: 0,
      exit_code: null,
      message: 'EmptyStandbyList.exe not found — standby skipped (opt-in)',
    };
  }

  if (outcome.timedOut || outcome.error?.code === 'ETIMEDOUT') {
    return {
      attempted: true,
      ok: true,
      skipped: false,
      reason: 'timed_out',
      elapsed_ms: outcome.elapsed_ms,
      exit_code: outcome.exitCode,
      message: `standby timed out after ${outcome.elapsed_ms}ms — isolated (work-end continues)`,
    };
  }

  if (outcome.error?.code === 'EACCES' || outcome.error?.code === 'EPERM') {
    return {
      attempted: true,
      ok: true,
      skipped: false,
      reason: 'permission_denied',
      elapsed_ms: outcome.elapsed_ms,
      exit_code: outcome.exitCode,
      message: 'standby permission denied — run as admin or skip (work-end continues)',
    };
  }

  if (outcome.error) {
    return {
      attempted: true,
      ok: true,
      skipped: false,
      reason: 'spawn_error',
      elapsed_ms: outcome.elapsed_ms,
      exit_code: outcome.exitCode,
      message: `standby spawn error (${outcome.error.code ?? 'unknown'}) — isolated`,
    };
  }

  if (outcome.exitCode !== 0) {
    return {
      attempted: true,
      ok: true,
      skipped: false,
      reason: 'nonzero_exit',
      elapsed_ms: outcome.elapsed_ms,
      exit_code: outcome.exitCode,
      message: `standby exit ${String(outcome.exitCode)} — isolated (work-end continues)`,
    };
  }

  return {
    attempted: true,
    ok: true,
    skipped: false,
    reason: 'success',
    elapsed_ms: outcome.elapsed_ms,
    exit_code: 0,
    message: `standby ${EMPTY_STANDBY_ARG} ok (${outcome.elapsed_ms}ms)`,
  };
}

export function runEmptyStandbyList(options?: {
  env?: NodeJS.ProcessEnv;
  spawnSync?: StandbySpawnSync;
  timeoutMs?: number;
  exists?: (filePath: string) => boolean;
  /** Test injection — defaults to `process.platform`. */
  platform?: NodeJS.Platform;
}): StandbyRunResult {
  const env = options?.env ?? process.env;
  if (!emptyStandbyOptInEnabled(env)) {
    return {
      attempted: false,
      ok: true,
      skipped: true,
      reason: 'disabled',
      elapsed_ms: 0,
      exit_code: null,
      message: `${EMPTY_STANDBY_ENV} not set — standby skipped`,
    };
  }

  const platform = options?.platform ?? process.platform;
  if (platform !== 'win32') {
    return {
      attempted: false,
      ok: true,
      skipped: true,
      reason: 'disabled',
      elapsed_ms: 0,
      exit_code: null,
      message: 'standby skipped — Windows only',
    };
  }

  const exePath = resolveEmptyStandbyExePath(env, options?.exists ?? existsSync);
  if (!exePath) {
    return classifyStandbySpawnOutcome(
      { exitCode: null, error: null, signal: null, timedOut: false, elapsed_ms: 0 },
      { exeExists: false },
    );
  }

  const spawn = options?.spawnSync ?? defaultStandbySpawnSync;
  const timeoutMs = options?.timeoutMs ?? STANDBY_HANG_TIMEOUT_MS;
  const outcome = spawn(exePath, [EMPTY_STANDBY_ARG], timeoutMs);
  return classifyStandbySpawnOutcome(outcome);
}

/** work-end hook — never throws; failures are isolated (exit 0 preserved). */
export function maybeRunEmptyStandby(options?: {
  env?: NodeJS.ProcessEnv;
  spawnSync?: StandbySpawnSync;
  quiet?: boolean;
}): StandbyRunResult {
  const result = runEmptyStandbyList({
    env: options?.env,
    spawnSync: options?.spawnSync,
  });
  if (!options?.quiet) {
    process.stdout.write(`[cursor:hygiene] ${result.message}\n`);
  }
  return result;
}

export const EMPTY_STANDBY_REPO_ROOT = REPO_ROOT;
