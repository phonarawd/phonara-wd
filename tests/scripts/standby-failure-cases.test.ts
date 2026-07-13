import { describe, expect, it } from 'vitest';
import {
  STANDBY_HANG_TIMEOUT_MS,
  classifyStandbySpawnOutcome,
  emptyStandbyOptInEnabled,
  maybeRunEmptyStandby,
  resolveEmptyStandbyExePath,
  runEmptyStandbyList,
  type StandbySpawnOutcome,
  type StandbySpawnSync,
} from '../../scripts/lib/empty-standby-core';

function outcome(partial: Partial<StandbySpawnOutcome>): StandbySpawnOutcome {
  return {
    exitCode: null,
    error: null,
    signal: null,
    timedOut: false,
    elapsed_ms: 0,
    ...partial,
  };
}

describe('standby-failure-cases (§5-B · 8s hang)', () => {
  it('exports 8s hang timeout SOT', () => {
    expect(STANDBY_HANG_TIMEOUT_MS).toBe(8_000);
  });

  it('case 1 — exe_missing: opt-in on but exe absent → skipped · work-end safe', () => {
    const result = runEmptyStandbyList({
      env: { PHONARA_EMPTY_STANDBY: '1' },
      platform: 'win32',
      exists: () => false,
      spawnSync: () => {
        throw new Error('spawn must not run when exe is missing');
      },
    });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('exe_missing');
    expect(result.attempted).toBe(false);
  });

  it('case 2 — permission_denied: EACCES → isolated · work-end safe', () => {
    const spawn: StandbySpawnSync = () =>
      outcome({
        error: Object.assign(new Error('access denied'), {
          code: 'EACCES',
        }) as NodeJS.ErrnoException,
        elapsed_ms: 12,
      });

    const result = runEmptyStandbyList({
      env: {
        PHONARA_EMPTY_STANDBY: '1',
        PHONARA_EMPTY_STANDBY_EXE: 'C:\\tools\\EmptyStandbyList.exe',
      },
      platform: 'win32',
      exists: (filePath) => filePath.endsWith('EmptyStandbyList.exe'),
      spawnSync: spawn,
    });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe('permission_denied');
    expect(result.attempted).toBe(true);
  });

  it('case 3 — hang: ETIMEDOUT at 8s budget → killed/isolated · work-end safe', () => {
    const spawn: StandbySpawnSync = (_exe, _args, timeoutMs) => {
      expect(timeoutMs).toBe(STANDBY_HANG_TIMEOUT_MS);
      return outcome({
        timedOut: true,
        error: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) as NodeJS.ErrnoException,
        elapsed_ms: STANDBY_HANG_TIMEOUT_MS,
      });
    };

    const result = runEmptyStandbyList({
      env: {
        PHONARA_EMPTY_STANDBY: '1',
        PHONARA_EMPTY_STANDBY_EXE: 'C:\\tools\\EmptyStandbyList.exe',
      },
      platform: 'win32',
      exists: () => true,
      spawnSync: spawn,
    });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe('timed_out');
    expect(result.elapsed_ms).toBe(STANDBY_HANG_TIMEOUT_MS);
  });

  it('classifyStandbySpawnOutcome maps ETIMEDOUT without timedOut flag', () => {
    const classified = classifyStandbySpawnOutcome(
      outcome({
        error: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) as NodeJS.ErrnoException,
        elapsed_ms: 8_000,
      }),
    );
    expect(classified.reason).toBe('timed_out');
    expect(classified.ok).toBe(true);
  });

  it('opt-in disabled by default', () => {
    expect(emptyStandbyOptInEnabled({})).toBe(false);
    expect(emptyStandbyOptInEnabled({ PHONARA_EMPTY_STANDBY: '0' })).toBe(false);
    expect(emptyStandbyOptInEnabled({ PHONARA_EMPTY_STANDBY: '1' })).toBe(true);
  });

  it('resolveEmptyStandbyExePath honors PHONARA_EMPTY_STANDBY_EXE override', () => {
    const custom = 'D:\\opt\\EmptyStandbyList.exe';
    const resolved = resolveEmptyStandbyExePath(
      { PHONARA_EMPTY_STANDBY_EXE: custom },
      (filePath) => filePath === custom,
    );
    expect(resolved).toBe(custom);
  });

  it('maybeRunEmptyStandby never throws on failure cases', () => {
    expect(() =>
      maybeRunEmptyStandby({
        env: { PHONARA_EMPTY_STANDBY: '1' },
        spawnSync: () =>
          outcome({
            error: Object.assign(new Error('access denied'), {
              code: 'EPERM',
            }) as NodeJS.ErrnoException,
          }),
        quiet: true,
      }),
    ).not.toThrow();
  });
});
