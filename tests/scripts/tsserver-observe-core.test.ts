import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { perfArtifactsDir } from '../../scripts/lib/max-context-evidence';
import {
  allowsFullFileRename,
  appendObserveJsonlEntry,
  filterScheduledFinalizeEntries,
  inObservationWindow,
  MANUAL_MAX_ROWS,
  pruneManualObserveJsonl,
  readObserveJsonlEntries,
  resolveObserveSource,
  summarizeObserveJsonl,
  type TsserverObserveEntry,
} from '../../scripts/lib/tsserver-observe-core';

function entry(source: TsserverObserveEntry['source'], ts_at: string): TsserverObserveEntry {
  return { source, ts_at };
}

function manualRows(
  count: number,
  startMs = Date.parse('2026-07-01T00:00:00.000Z'),
): TsserverObserveEntry[] {
  return Array.from({ length: count }, (_, index) =>
    entry('manual', new Date(startMs + index * 1000).toISOString()),
  );
}

describe('tsserver-observe-core (v4.3.2)', () => {
  const perfDir = perfArtifactsDir();
  let jsonlPath = '';

  beforeEach(() => {
    mkdirSync(perfDir, { recursive: true });
    jsonlPath = path.join(perfDir, `tsserver-observe-test-${Date.now()}.jsonl`);
  });

  afterEach(() => {
    if (existsSync(jsonlPath)) rmSync(jsonlPath);
    const bakPath = `${jsonlPath}.bak`;
    if (existsSync(bakPath)) rmSync(bakPath);
  });

  it('resolveObserveSource defaults to manual without env', () => {
    expect(resolveObserveSource({})).toBe('manual');
    expect(resolveObserveSource({ PHONARA_TSSERVER_OBSERVE_SOURCE: 'scheduled' })).toBe(
      'scheduled',
    );
    expect(resolveObserveSource({ PHONARA_TSSERVER_OBSERVE_SOURCE: 'argv-ab' })).toBe('argv-ab');
    expect(resolveObserveSource({ PHONARA_TSSERVER_OBSERVE_SOURCE: 'argv_ab' })).toBe('argv-ab');
    expect(resolveObserveSource({ PHONARA_TSSERVER_OBSERVE_SOURCE: 'manual' })).toBe('manual');
  });

  it('inObservationWindow is true for recent scheduled JSONL rows', () => {
    const now = new Date('2026-07-10T12:00:00.000Z');
    const result = inObservationWindow({
      entries: [entry('scheduled', '2026-07-09T12:00:00.000Z')],
      observeTaskExists: false,
      rolloutStateStatus: 'missing',
      now,
    });
    expect(result.active).toBe(true);
    expect(result.reason).toBe('jsonl-scheduled-recent');
  });

  it('inObservationWindow is true when observe scheduled task exists', () => {
    const result = inObservationWindow({
      entries: [],
      observeTaskExists: true,
      rolloutStateStatus: 'present',
      rolloutState: {},
    });
    expect(result.active).toBe(true);
    expect(result.reason).toBe('os-scheduled-task');
  });

  it('inObservationWindow uses safe fallback when rollout state is missing', () => {
    const result = inObservationWindow({
      entries: [],
      observeTaskExists: false,
      rolloutStateStatus: 'missing',
    });
    expect(result.active).toBe(true);
    expect(result.reason).toBe('safe-fallback-state-missing');
  });

  it('inObservationWindow is false only when all signals are inactive and state is present', () => {
    const now = new Date('2026-07-10T12:00:00.000Z');
    const result = inObservationWindow({
      entries: [entry('manual', '2026-07-01T12:00:00.000Z')],
      observeTaskExists: false,
      rolloutStateStatus: 'present',
      rolloutState: { finalize_completed_at: '2026-07-08T00:00:00.000Z' },
      now,
    });
    expect(result.active).toBe(false);
    expect(result.reason).toBe('inactive');
    expect(
      allowsFullFileRename({
        entries: [entry('manual', '2026-07-01T12:00:00.000Z')],
        observeTaskExists: false,
        rolloutStateStatus: 'present',
        rolloutState: { finalize_completed_at: '2026-07-08T00:00:00.000Z' },
        now,
      }),
    ).toBe(true);
  });

  it('prune-manual inside observation window removes only excess manual rows', () => {
    const now = new Date('2026-07-10T12:00:00.000Z');
    const scheduled = entry('scheduled', '2026-07-09T12:00:00.000Z');
    const argv = entry('argv-ab', '2026-07-09T13:00:00.000Z');
    const manual = manualRows(MANUAL_MAX_ROWS + 5);
    writeFileSync(
      jsonlPath,
      [...manual, scheduled, argv].map((row) => JSON.stringify(row)).join('\n') + '\n',
      'utf8',
    );

    const result = pruneManualObserveJsonl(
      {
        observeTaskExists: false,
        rolloutStateStatus: 'missing',
        now,
      },
      jsonlPath,
    );

    expect(result.action).toBe('prune-manual');
    expect(result.in_observation_window).toBe(true);
    expect(result.removed_manual_rows).toBe(5);
    expect(result.kept_scheduled_rows).toBe(1);
    expect(result.kept_argv_ab_rows).toBe(1);

    const persisted = readFileSync(jsonlPath, 'utf8');
    expect(persisted).toContain('"source":"scheduled"');
    expect(persisted).toContain('"source":"argv-ab"');
    expect((persisted.match(/"source":"manual"/g) ?? []).length).toBe(MANUAL_MAX_ROWS);
  });

  it('state missing with scheduled JSONL forbids full rename during prune-manual', () => {
    const now = new Date('2026-07-10T12:00:00.000Z');
    const rows = [
      entry('scheduled', '2026-07-09T12:00:00.000Z'),
      ...manualRows(MANUAL_MAX_ROWS + 1),
    ];
    writeFileSync(jsonlPath, rows.map((row) => JSON.stringify(row)).join('\n') + '\n', 'utf8');

    const result = pruneManualObserveJsonl(
      {
        observeTaskExists: false,
        rolloutStateStatus: 'missing',
        now,
      },
      jsonlPath,
    );

    expect(result.action).toBe('prune-manual');
    expect(result.action).not.toBe('full-rename');
    expect(existsSync(`${jsonlPath}.bak`)).toBe(false);
    expect(readFileSync(jsonlPath, 'utf8')).toContain('"source":"scheduled"');
  });

  it('outside observation window allows full rename when thresholds are exceeded', () => {
    const now = new Date('2026-07-10T12:00:00.000Z');
    const rows = manualRows(MANUAL_MAX_ROWS + 1);
    writeFileSync(jsonlPath, rows.map((row) => JSON.stringify(row)).join('\n') + '\n', 'utf8');

    const result = pruneManualObserveJsonl(
      {
        entries: rows,
        observeTaskExists: false,
        rolloutStateStatus: 'present',
        rolloutState: { finalize_completed_at: '2026-07-08T00:00:00.000Z' },
        now,
      },
      jsonlPath,
    );

    expect(result.action).toBe('full-rename');
    expect(existsSync(`${jsonlPath}.bak`)).toBe(true);
    expect(readFileSync(jsonlPath, 'utf8')).toBe('');
  });

  it('filterScheduledFinalizeEntries excludes manual and argv-ab rows', () => {
    const entries = [
      entry('manual', '2026-07-10T12:00:00.000Z'),
      entry('argv-ab', '2026-07-10T12:05:00.000Z'),
      entry('scheduled', '2026-07-10T11:00:00.000Z'),
      entry('scheduled', '2026-07-10T12:10:00.000Z'),
    ];
    const filtered = filterScheduledFinalizeEntries(entries, '2026-07-10T12:00:00.000Z');
    expect(filtered).toEqual([entry('scheduled', '2026-07-10T12:10:00.000Z')]);
  });

  it('appendObserveJsonlEntry writes manual rows by default contract', () => {
    appendObserveJsonlEntry(
      { source: 'manual', ts_at: '2026-07-10T12:00:00.000Z', tsserver_mb: 100 },
      jsonlPath,
    );
    const entries = readObserveJsonlEntries(jsonlPath);
    const summary = summarizeObserveJsonl(entries, readFileSync(jsonlPath, 'utf8').length);
    expect(summary.manual).toBe(1);
    expect(summary.scheduled).toBe(0);
  });
});
