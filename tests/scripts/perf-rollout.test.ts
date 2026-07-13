import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GateDiagnosisRecord } from '../../scripts/lib/gate-diagnosis-core';
import { perfArtifactsDir } from '../../scripts/lib/max-context-evidence';
import {
  assertDiagnosisBeforeTsserverTrial,
  buildPerfRolloutStepOrder,
  parseFromStepArg,
  parseIncludeTsserverTuningArg,
  runPerfRollout,
  type PerfRolloutStepId,
  type PerfRolloutStepRunner,
} from '../../scripts/lib/perf-rollout-core';

function baseDiagnosis(overrides: Partial<GateDiagnosisRecord> = {}): GateDiagnosisRecord {
  return {
    gate_status: 'pass',
    created_at: '2026-07-10T12:00:00.000Z',
    platform: 'win32',
    cursor_core_mb: 2374,
    extension_host_mb: 200,
    tsserver_mb: 100,
    claude_desktop_mb: 1170,
    claude_desktop_count: 9,
    ram_total_mb: 8192,
    ram_free_mb: 980,
    dominant_ram_consumer: 'cursor',
    high_reasons: ['cursor_core_mb', 'ram_free_mb'],
    severity: 'HIGH',
    orphan_repo_count: 0,
    orphan_drift: false,
    orphan_drift_missed_pids: [],
    max_context_status: 'pass',
    max_context: '6k',
    max_context_source: 'settings',
    max_context_evidence_path: null,
    med_reasons: [],
    low_reasons: [],
    argv_ok: true,
    ...overrides,
  };
}

function okRunner(message: string): PerfRolloutStepRunner {
  return () => ({ exit: 0, message });
}

describe('perf-rollout step order (v4.4)', () => {
  const perfDir = perfArtifactsDir();
  const diagnosisPass = 'diagnosis-pass.json';
  const remediationPass = 'remediation-pass.json';
  let evidencePath = '';
  let wroteArtifacts = false;

  function writeRemediationFixture(diagnosisRef: string, executed = false): void {
    writeFileSync(
      path.join(perfDir, remediationPass),
      `${JSON.stringify(
        {
          diagnosis_ref: diagnosisRef,
          remediation_executed: executed,
          dry_run: { orphan_pids: [], recommendations: ['stack:stop'] },
          executed_at: executed ? '2026-07-10T12:00:00.000Z' : null,
        },
        null,
        2,
      )}\n`,
    );
  }

  beforeEach(() => {
    mkdirSync(perfDir, { recursive: true });
    evidencePath = path.join(perfDir, `rollout-evidence-test-${Date.now()}.jsonl`);
  });

  afterEach(() => {
    if (!wroteArtifacts) return;
    for (const name of [diagnosisPass, remediationPass]) {
      const filePath = path.join(perfDir, name);
      if (existsSync(filePath)) rmSync(filePath);
    }
    if (existsSync(evidencePath)) rmSync(evidencePath);
  });

  it('parses --include-tsserver-tuning flag', () => {
    expect(parseIncludeTsserverTuningArg(['--include-tsserver-tuning'])).toBe(true);
    expect(parseIncludeTsserverTuningArg([])).toBe(false);
  });

  it('orders diagnosis → HIGH → infra → summary by default', () => {
    const steps = buildPerfRolloutStepOrder();
    expect(steps).toEqual([
      'gate-diagnosis',
      'gate-phase0',
      'high-remediation',
      'sync-excludes',
      'hygiene',
      'global-settings',
      'standby-test',
      'summary',
    ]);
    expect(steps.indexOf('gate-diagnosis')).toBeLessThan(steps.indexOf('high-remediation'));
    expect(steps.indexOf('high-remediation')).toBeLessThan(steps.indexOf('sync-excludes'));
    expect(steps.indexOf('global-settings')).toBeLessThan(steps.indexOf('summary'));
    expect(steps).not.toContain('argv-ab');
    expect(steps).not.toContain('settings-tsserver-trial');
    expect(steps).not.toContain('schedule-observe');
  });

  it('appends opt-in tsserver/argv steps only with --include-tsserver-tuning', () => {
    const steps = buildPerfRolloutStepOrder({ includeTsserverTuning: true });
    expect(steps).toEqual([
      'gate-diagnosis',
      'gate-phase0',
      'high-remediation',
      'sync-excludes',
      'hygiene',
      'global-settings',
      'standby-test',
      'argv-ab',
      'settings-tsserver-trial',
      'schedule-observe',
      'summary',
    ]);
    expect(steps.indexOf('standby-test')).toBeLessThan(steps.indexOf('argv-ab'));
    expect(steps.indexOf('schedule-observe')).toBeLessThan(steps.indexOf('summary'));
  });

  it('parses --from=<step> only for known rollout steps', () => {
    expect(parseFromStepArg(['--from=high-remediation'])).toBe('high-remediation');
    expect(parseFromStepArg(['--from=unknown-step'])).toBeNull();
  });

  it('stops rollout when gate-diagnosis returns exit 1 without summary', () => {
    const runners: Partial<Record<PerfRolloutStepId, PerfRolloutStepRunner>> = {
      'gate-diagnosis': () => ({ exit: 1, message: 'gate-diagnosis fail' }),
      summary: () => ({ exit: 0, message: 'should not run' }),
    };

    const result = runPerfRollout({
      argv: [],
      stepRunners: runners,
      evidencePath,
      skipEvidenceAppend: false,
    });

    expect(result.exit).toBe(1);
    expect(result.stopped_at).toBe('gate-diagnosis');
    expect(result.summary_line).toBeNull();
    expect(result.completed_steps).toEqual([]);
  });

  it('stops rollout when gate-diagnosis returns exit 2 (AMBIGUOUS) without summary', () => {
    const runners: Partial<Record<PerfRolloutStepId, PerfRolloutStepRunner>> = {
      'gate-diagnosis': () => ({ exit: 2, message: 'gate-diagnosis ambiguous' }),
      summary: () => ({ exit: 0, message: 'should not run' }),
    };

    const result = runPerfRollout({
      argv: [],
      stepRunners: runners,
      evidencePath,
    });

    expect(result.exit).toBe(2);
    expect(result.stopped_at).toBe('gate-diagnosis');
    expect(result.summary_line).toBeNull();
  });

  it('runs summary only after PASS diagnosis on full green path', () => {
    writeFileSync(
      path.join(perfDir, diagnosisPass),
      `${JSON.stringify(baseDiagnosis(), null, 2)}\n`,
    );
    writeRemediationFixture(diagnosisPass);
    wroteArtifacts = true;

    const runners: Partial<Record<PerfRolloutStepId, PerfRolloutStepRunner>> = {
      'gate-diagnosis': () => ({
        exit: 0,
        message: 'pass',
        diagnosisFilename: diagnosisPass,
      }),
      'gate-phase0': okRunner('phase0 pass'),
      'high-remediation': okRunner('dry-run'),
      'sync-excludes': okRunner('sync'),
      hygiene: okRunner('hygiene'),
      'global-settings': okRunner('global'),
      'standby-test': okRunner('standby'),
      summary: () => ({
        exit: 0,
        message:
          '[perf-summary] RAM free 980MB · Cursor core 2374MB · Claude desktop 1170MB (9 proc) · dominant=cursor · high=[cursor_core_mb,ram_free_mb] · remediation=dry-run',
      }),
    };

    const result = runPerfRollout({
      argv: [],
      stepRunners: runners,
      evidencePath,
    });

    expect(result.exit).toBe(0);
    expect(result.completed_steps.at(-1)).toBe('summary');
    expect(result.summary_line).toContain('[perf-summary]');
    expect(result.summary_line).toContain('remediation=dry-run');
    expect(result.completed_steps).not.toContain('argv-ab');
  });

  it('fails summary when remediation diagnosis_ref does not match PASS diagnosis', () => {
    writeFileSync(
      path.join(perfDir, diagnosisPass),
      `${JSON.stringify(baseDiagnosis(), null, 2)}\n`,
    );
    writeRemediationFixture('diagnosis-other.json');
    wroteArtifacts = true;

    const result = runPerfRollout({
      argv: ['--from=summary'],
      evidencePath,
      skipEvidenceAppend: true,
    });

    expect(result.exit).toBe(1);
    expect(result.stopped_at).toBe('summary');
    expect(result.message).toContain('remediation diagnosis_ref mismatch');
    expect(result.summary_line).toBeNull();
  });

  it('asserts gate-diagnosis evidence precedes settings-tsserver-trial when opt-in', () => {
    const bad = assertDiagnosisBeforeTsserverTrial(
      [
        { step: 'settings-tsserver-trial', ts: '2026-07-10T11:00:00.000Z' },
        { step: 'gate-diagnosis', ts: '2026-07-10T12:00:00.000Z' },
      ],
      true,
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.reason).toContain('must precede settings-tsserver-trial');
    }

    const missingDiagnosis = assertDiagnosisBeforeTsserverTrial(
      [{ step: 'settings-tsserver-trial', ts: '2026-07-10T12:00:00.000Z' }],
      true,
    );
    expect(missingDiagnosis.ok).toBe(false);
    if (!missingDiagnosis.ok) {
      expect(missingDiagnosis.reason).toContain('without gate-diagnosis evidence');
    }

    const good = assertDiagnosisBeforeTsserverTrial(
      [
        { step: 'gate-diagnosis', ts: '2026-07-10T11:00:00.000Z' },
        { step: 'settings-tsserver-trial', ts: '2026-07-10T12:00:00.000Z' },
      ],
      true,
    );
    expect(good.ok).toBe(true);

    const skipped = assertDiagnosisBeforeTsserverTrial([], false);
    expect(skipped.ok).toBe(true);
  });

  it('fails summary on opt-in rollout when evidence timestamps are out of order', () => {
    writeFileSync(
      path.join(perfDir, diagnosisPass),
      `${JSON.stringify(baseDiagnosis(), null, 2)}\n`,
    );
    writeRemediationFixture(diagnosisPass);
    writeFileSync(
      evidencePath,
      [
        JSON.stringify({ step: 'settings-tsserver-trial', ts: '2026-07-10T11:00:00.000Z' }),
        JSON.stringify({ step: 'gate-diagnosis', ts: '2026-07-10T12:00:00.000Z' }),
      ].join('\n') + '\n',
    );
    wroteArtifacts = true;

    const result = runPerfRollout({
      argv: ['--include-tsserver-tuning', '--from=summary'],
      evidencePath,
      skipEvidenceAppend: true,
    });

    expect(result.exit).toBe(1);
    expect(result.stopped_at).toBe('summary');
    expect(result.message).toContain('summary evidence assert failed');
    expect(result.message).toContain('must precede settings-tsserver-trial');
    expect(result.summary_line).toBeNull();
  });

  it('runs opt-in argv/tsserver/schedule steps only with include-tsserver-tuning', () => {
    writeFileSync(
      path.join(perfDir, diagnosisPass),
      `${JSON.stringify(baseDiagnosis(), null, 2)}\n`,
    );
    writeRemediationFixture(diagnosisPass);
    wroteArtifacts = true;

    const runners: Partial<Record<PerfRolloutStepId, PerfRolloutStepRunner>> = {
      'gate-diagnosis': () => ({
        exit: 0,
        message: 'pass',
        diagnosisFilename: diagnosisPass,
      }),
      'gate-phase0': okRunner('phase0 pass'),
      'high-remediation': okRunner('dry-run'),
      'sync-excludes': okRunner('sync'),
      hygiene: okRunner('hygiene'),
      'global-settings': okRunner('global'),
      'standby-test': okRunner('standby'),
      'argv-ab': okRunner('argv-ab applied'),
      'settings-tsserver-trial': okRunner('tsserver trial'),
      'schedule-observe': okRunner('schedule observe'),
      summary: () => ({
        exit: 0,
        message: '[perf-summary] opt-in path',
      }),
    };

    const result = runPerfRollout({
      argv: ['--include-tsserver-tuning'],
      stepRunners: runners,
      evidencePath,
    });

    expect(result.exit).toBe(0);
    expect(result.completed_steps).toEqual([
      'gate-diagnosis',
      'gate-phase0',
      'high-remediation',
      'sync-excludes',
      'hygiene',
      'global-settings',
      'standby-test',
      'argv-ab',
      'settings-tsserver-trial',
      'schedule-observe',
      'summary',
    ]);
  });
});
