/**
 * tsserver observe JSONL — source env · inObservationWindow (JSONL/OS/safe) · prune-manual.
 * v4.3.2 SOT — gate-phase0/perf-rollout/finalize must import this module only.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { perfArtifactsDir } from './max-context-evidence';
import { scheduledTaskExists, TASK_PERF_OBSERVE } from './schtasks-lifecycle';

export const OBSERVE_SOURCE_ENV = 'PHONARA_TSSERVER_OBSERVE_SOURCE' as const;
export const TSSERVER_OBSERVE_JSONL = 'tsserver-observe.jsonl' as const;
export const TSSERVER_OBSERVE_JSONL_BAK = 'tsserver-observe.jsonl.bak' as const;
export const ROLLOUT_STATE_JSON = 'rollout-state.json' as const;

export const OBSERVE_SOURCES = ['manual', 'scheduled', 'argv-ab'] as const;
export type ObserveSource = (typeof OBSERVE_SOURCES)[number];

export const MANUAL_MAX_ROWS = 200;
export const FULL_RENAME_MAX_BYTES = 512 * 1024;
/** Recent scheduled sample implies an active observation window (v4.3.2). */
export const SCHEDULED_RECENT_DAYS = 4;
export const TRIAL_WINDOW_DAYS = 3;

export interface TsserverObserveEntry {
  source: ObserveSource;
  ts_at: string;
  tsserver_mb?: number;
  ram_free_mb?: number;
  cursor_core_mb?: number;
}

export interface RolloutState {
  observe_window_start?: string;
  finalize_completed_at?: string;
}

export type InObservationWindowReason =
  | 'jsonl-scheduled-recent'
  | 'os-scheduled-task'
  | 'state-active-window'
  | 'safe-fallback-state-missing'
  | 'safe-fallback-state-corrupt'
  | 'inactive';

export interface InObservationWindowResult {
  active: boolean;
  reason: InObservationWindowReason;
}

export interface ObserveJsonlCounts {
  manual: number;
  scheduled: number;
  'argv-ab': number;
  total: number;
  bytes: number;
}

export type PruneManualAction = 'noop' | 'prune-manual' | 'full-rename';

export interface PruneManualResult {
  action: PruneManualAction;
  in_observation_window: boolean;
  removed_manual_rows: number;
  kept_scheduled_rows: number;
  kept_argv_ab_rows: number;
  message: string;
}

export interface ObservationWindowContext {
  entries?: readonly TsserverObserveEntry[];
  observeTaskExists?: boolean;
  rolloutState?: RolloutState | null;
  rolloutStateStatus?: 'present' | 'missing' | 'corrupt';
  now?: Date;
  fileBytes?: number;
}

/** Default manual — scheduled only when PHONARA_TSSERVER_OBSERVE_SOURCE=scheduled. */
export function resolveObserveSource(env: NodeJS.ProcessEnv = process.env): ObserveSource {
  const raw = env[OBSERVE_SOURCE_ENV]?.trim().toLowerCase();
  if (raw === 'scheduled') return 'scheduled';
  if (raw === 'argv-ab' || raw === 'argv_ab') return 'argv-ab';
  return 'manual';
}

export function tsserverObserveJsonlPath(repoRoot?: string): string {
  const root = repoRoot ?? perfArtifactsDir();
  return path.join(root, TSSERVER_OBSERVE_JSONL);
}

export function rolloutStatePath(repoRoot?: string): string {
  const root = repoRoot ?? perfArtifactsDir();
  return path.join(root, ROLLOUT_STATE_JSON);
}

export function parseObserveJsonlLines(text: string): TsserverObserveEntry[] {
  const entries: TsserverObserveEntry[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as Partial<TsserverObserveEntry>;
      if (!parsed.source || !OBSERVE_SOURCES.includes(parsed.source as ObserveSource)) continue;
      if (typeof parsed.ts_at !== 'string' || !Number.isFinite(Date.parse(parsed.ts_at))) continue;
      entries.push({
        source: parsed.source as ObserveSource,
        ts_at: parsed.ts_at,
        tsserver_mb: typeof parsed.tsserver_mb === 'number' ? parsed.tsserver_mb : undefined,
        ram_free_mb: typeof parsed.ram_free_mb === 'number' ? parsed.ram_free_mb : undefined,
        cursor_core_mb:
          typeof parsed.cursor_core_mb === 'number' ? parsed.cursor_core_mb : undefined,
      });
    } catch {
      // skip malformed lines
    }
  }
  return entries;
}

export function readObserveJsonlEntries(
  filePath: string = tsserverObserveJsonlPath(),
): TsserverObserveEntry[] {
  if (!existsSync(filePath)) return [];
  return parseObserveJsonlLines(readFileSync(filePath, 'utf8'));
}

export function writeObserveJsonlEntries(
  entries: readonly TsserverObserveEntry[],
  filePath: string = tsserverObserveJsonlPath(),
): void {
  const dir = path.dirname(filePath);
  mkdirSync(dir, { recursive: true });
  const body =
    entries.length > 0 ? `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n` : '';
  writeFileSync(filePath, body, 'utf8');
}

export function appendObserveJsonlEntry(
  entry: TsserverObserveEntry,
  filePath: string = tsserverObserveJsonlPath(),
): void {
  const dir = path.dirname(filePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(entry)}\n`, { append: true, encoding: 'utf8' });
}

export function readRolloutState(filePath: string = rolloutStatePath()): {
  state: RolloutState | null;
  status: 'present' | 'missing' | 'corrupt';
} {
  if (!existsSync(filePath)) {
    return { state: null, status: 'missing' };
  }
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as RolloutState;
    return { state: parsed, status: 'present' };
  } catch {
    return { state: null, status: 'corrupt' };
  }
}

export function writeRolloutState(
  state: RolloutState,
  filePath: string = rolloutStatePath(),
): void {
  const dir = path.dirname(filePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

/** Opens or preserves an active tsserver trial window (observe_window_start). */
export function ensureObserveWindowStart(
  windowStart: string = new Date().toISOString(),
  filePath: string = rolloutStatePath(),
): { started: boolean; windowStart: string } {
  const rollout = readRolloutState(filePath);
  if (
    rollout.status === 'present' &&
    rollout.state?.observe_window_start &&
    !rollout.state.finalize_completed_at
  ) {
    return { started: false, windowStart: rollout.state.observe_window_start };
  }

  const next: RolloutState = {
    ...(rollout.state ?? {}),
    observe_window_start: windowStart,
    finalize_completed_at: undefined,
  };
  writeRolloutState(next, filePath);
  return { started: true, windowStart };
}

/** Records argv-ab opt-in rollout in observe JSONL. */
export function recordArgvAbObserveEntry(
  ts_at: string = new Date().toISOString(),
  filePath: string = tsserverObserveJsonlPath(),
): void {
  appendObserveJsonlEntry({ source: 'argv-ab', ts_at }, filePath);
}

export function hasRecentScheduledEntry(
  entries: readonly TsserverObserveEntry[],
  now: Date = new Date(),
  recentDays: number = SCHEDULED_RECENT_DAYS,
): boolean {
  return entries.some(
    (entry) => entry.source === 'scheduled' && ageDaysAt(entry.ts_at, now) <= recentDays,
  );
}

function ageDaysAt(iso: string, now: Date): number {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - parsed) / (24 * 60 * 60 * 1000);
}

export function isStateWindowActive(state: RolloutState | null | undefined): boolean {
  if (!state?.observe_window_start) return false;
  if (state.finalize_completed_at) return false;
  return Number.isFinite(Date.parse(state.observe_window_start));
}

/**
 * JSONL scheduled + OS task first; state is auxiliary; missing/corrupt state → safe fallback.
 */
export function inObservationWindow(
  context: ObservationWindowContext = {},
): InObservationWindowResult {
  const now = context.now ?? new Date();
  const entries = context.entries ?? [];
  const observeTaskExists =
    context.observeTaskExists ??
    (process.platform === 'win32' ? scheduledTaskExists(TASK_PERF_OBSERVE) : false);

  if (hasRecentScheduledEntry(entries, now)) {
    return { active: true, reason: 'jsonl-scheduled-recent' };
  }
  if (observeTaskExists) {
    return { active: true, reason: 'os-scheduled-task' };
  }

  const rollout = context.rolloutStateStatus
    ? { state: context.rolloutState ?? null, status: context.rolloutStateStatus }
    : readRolloutState();

  if (isStateWindowActive(rollout.state)) {
    return { active: true, reason: 'state-active-window' };
  }

  if (rollout.status === 'missing') {
    return { active: true, reason: 'safe-fallback-state-missing' };
  }
  if (rollout.status === 'corrupt') {
    return { active: true, reason: 'safe-fallback-state-corrupt' };
  }

  return { active: false, reason: 'inactive' };
}

export function allowsFullFileRename(context: ObservationWindowContext = {}): boolean {
  return !inObservationWindow(context).active;
}

export function countObserveEntriesBySource(
  entries: readonly TsserverObserveEntry[],
): Omit<ObserveJsonlCounts, 'bytes'> {
  const counts = { manual: 0, scheduled: 0, 'argv-ab': 0, total: entries.length };
  for (const entry of entries) {
    counts[entry.source] += 1;
  }
  return counts;
}

export function summarizeObserveJsonl(
  entries: readonly TsserverObserveEntry[],
  fileBytes = 0,
): ObserveJsonlCounts {
  return { ...countObserveEntriesBySource(entries), bytes: fileBytes };
}

function pruneExcessManualRows(
  entries: readonly TsserverObserveEntry[],
  maxManualRows: number,
): { next: TsserverObserveEntry[]; removed: number } {
  const manualEntries = entries.filter((entry) => entry.source === 'manual');
  const protectedEntries = entries.filter((entry) => entry.source !== 'manual');
  if (manualEntries.length <= maxManualRows) {
    return { next: [...entries], removed: 0 };
  }

  const keepManual = manualEntries.slice(manualEntries.length - maxManualRows);
  const removed = manualEntries.length - keepManual.length;
  const next = [...protectedEntries, ...keepManual].sort(
    (a, b) => Date.parse(a.ts_at) - Date.parse(b.ts_at),
  );
  return { next, removed };
}

function shouldPruneManual(manualCount: number): boolean {
  return manualCount > MANUAL_MAX_ROWS;
}

function shouldFullRenameOutsideWindow(manualCount: number, fileBytes: number): boolean {
  return manualCount > MANUAL_MAX_ROWS || fileBytes > FULL_RENAME_MAX_BYTES;
}

/**
 * prune-manual — inside observation window only manual rows are removed; scheduled/argv-ab stay.
 * Outside window, optional full rename when manual>200 OR file>512KB.
 */
export function pruneManualObserveJsonl(
  context: ObservationWindowContext = {},
  filePath: string = tsserverObserveJsonlPath(),
): PruneManualResult {
  const entries = context.entries ?? readObserveJsonlEntries(filePath);
  const fileBytes = context.fileBytes ?? (existsSync(filePath) ? statSync(filePath).size : 0);
  const counts = countObserveEntriesBySource(entries);
  const window = inObservationWindow({ ...context, entries, fileBytes });

  if (window.active) {
    if (!shouldPruneManual(counts.manual)) {
      return {
        action: 'noop',
        in_observation_window: true,
        removed_manual_rows: 0,
        kept_scheduled_rows: counts.scheduled,
        kept_argv_ab_rows: counts['argv-ab'],
        message: `observation window active (${window.reason}) — manual ${counts.manual}/${MANUAL_MAX_ROWS}, no prune needed`,
      };
    }

    const { next, removed } = pruneExcessManualRows(entries, MANUAL_MAX_ROWS);
    writeObserveJsonlEntries(next, filePath);
    return {
      action: 'prune-manual',
      in_observation_window: true,
      removed_manual_rows: removed,
      kept_scheduled_rows: countObserveEntriesBySource(next).scheduled,
      kept_argv_ab_rows: countObserveEntriesBySource(next)['argv-ab'],
      message: `observation window active (${window.reason}) — pruned ${removed} manual row(s); scheduled/argv-ab preserved`,
    };
  }

  if (shouldFullRenameOutsideWindow(counts.manual, fileBytes) && allowsFullFileRename(context)) {
    const bakPath = `${filePath}.bak`;
    if (existsSync(filePath)) {
      if (existsSync(bakPath)) {
        writeFileSync(bakPath, readFileSync(filePath, 'utf8'), 'utf8');
      } else {
        renameSync(filePath, bakPath);
      }
      writeObserveJsonlEntries([], filePath);
    }
    return {
      action: 'full-rename',
      in_observation_window: false,
      removed_manual_rows: counts.manual,
      kept_scheduled_rows: 0,
      kept_argv_ab_rows: 0,
      message: `observation window inactive — rotated full JSONL to ${path.basename(bakPath)}`,
    };
  }

  if (shouldPruneManual(counts.manual)) {
    const { next, removed } = pruneExcessManualRows(entries, MANUAL_MAX_ROWS);
    writeObserveJsonlEntries(next, filePath);
    return {
      action: 'prune-manual',
      in_observation_window: false,
      removed_manual_rows: removed,
      kept_scheduled_rows: countObserveEntriesBySource(next).scheduled,
      kept_argv_ab_rows: countObserveEntriesBySource(next)['argv-ab'],
      message: `observation window inactive — pruned ${removed} manual row(s) without full rename`,
    };
  }

  return {
    action: 'noop',
    in_observation_window: false,
    removed_manual_rows: 0,
    kept_scheduled_rows: counts.scheduled,
    kept_argv_ab_rows: counts['argv-ab'],
    message: 'no prune needed',
  };
}

/** Finalize aggregates scheduled samples only (manual/argv-ab excluded). */
export function filterScheduledFinalizeEntries(
  entries: readonly TsserverObserveEntry[],
  windowStartIso: string,
): TsserverObserveEntry[] {
  const windowStart = Date.parse(windowStartIso);
  if (!Number.isFinite(windowStart)) return [];
  return entries.filter(
    (entry) => entry.source === 'scheduled' && Date.parse(entry.ts_at) >= windowStart,
  );
}

export function formatObserveJsonlSummaryLine(counts: ObserveJsonlCounts): string {
  const kb = (counts.bytes / 1024).toFixed(1);
  return `[tsserver-observe] manual=${counts.manual} scheduled=${counts.scheduled} argv-ab=${counts['argv-ab']} · ${kb}KB`;
}
