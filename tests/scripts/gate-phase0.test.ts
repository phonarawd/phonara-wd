import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertDiagnosisPrerequisite,
  evaluateActiveWorkSsotHeuristic,
  parseForceGatePhase0Arg,
  runGatePhase0,
} from '../../scripts/lib/gate-phase0-core';
import type { GateDiagnosisRecord } from '../../scripts/lib/gate-diagnosis-core';
import { perfArtifactsDir } from '../../scripts/lib/max-context-evidence';
import { parseMigrationsLock } from '../../scripts/lib/parse-migrations-lock';

function baseDiagnosis(overrides: Partial<GateDiagnosisRecord> = {}): GateDiagnosisRecord {
  return {
    gate_status: 'pass',
    created_at: '2026-07-10T12:00:00.000Z',
    platform: 'win32',
    cursor_core_mb: 500,
    extension_host_mb: 200,
    tsserver_mb: 100,
    claude_desktop_mb: 500,
    claude_desktop_count: 2,
    ram_total_mb: 8192,
    ram_free_mb: 2000,
    dominant_ram_consumer: 'none',
    high_reasons: [],
    severity: 'none',
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

describe('gate-phase0 diagnosis failsafe', () => {
  const perfDir = perfArtifactsDir();
  const diagnosisPass = 'diagnosis-pass.json';
  const diagnosisAmbiguous = 'diagnosis-ambiguous.json';
  let wroteDiagnosis = false;

  beforeEach(() => {
    mkdirSync(perfDir, { recursive: true });
  });

  afterEach(() => {
    if (wroteDiagnosis) {
      for (const name of [diagnosisPass, diagnosisAmbiguous]) {
        const filePath = path.join(perfDir, name);
        if (existsSync(filePath)) rmSync(filePath);
      }
    }
  });

  it('parses --force-gate-phase0 flag', () => {
    expect(parseForceGatePhase0Arg(['--force-gate-phase0'])).toBe(true);
    expect(parseForceGatePhase0Arg([])).toBe(false);
  });

  it('blocks when no diagnosis file exists', () => {
    const prereq = assertDiagnosisPrerequisite({ diagnosisFilename: 'missing.json' });
    expect(prereq.ok).toBe(false);
    if (!prereq.ok) expect(prereq.reason).toBe('DIAGNOSIS_NOT_PASS');

    const result = runGatePhase0({ diagnosisFilename: 'missing.json' });
    expect(result.exit).toBe(1);
    expect(result.reason).toBe('DIAGNOSIS_NOT_PASS');
    expect(result.diagnosis_ref).toBeNull();
  });

  it('blocks when latest diagnosis is ambiguous only', () => {
    writeFileSync(
      path.join(perfDir, diagnosisAmbiguous),
      `${JSON.stringify(baseDiagnosis({ gate_status: 'ambiguous', max_context_status: 'ambiguous' }), null, 2)}\n`,
    );
    wroteDiagnosis = true;

    const result = runGatePhase0({ diagnosisFilename: diagnosisAmbiguous });
    expect(result.exit).toBe(1);
    expect(result.reason).toBe('DIAGNOSIS_NOT_PASS');
  });

  it('requires PASS diagnosis before lock/SSOT checks', () => {
    writeFileSync(
      path.join(perfDir, diagnosisPass),
      `${JSON.stringify(baseDiagnosis(), null, 2)}\n`,
    );
    wroteDiagnosis = true;

    const result = runGatePhase0({ diagnosisFilename: diagnosisPass });
    expect(result.diagnosis_ref).toBe(diagnosisPass);
    expect([0, 2]).toContain(result.exit);
    expect(result.lock_ok).toBe(true);
  });

  it('uses parseMigrationsLock for force and normal paths', () => {
    writeFileSync(
      path.join(perfDir, diagnosisPass),
      `${JSON.stringify(baseDiagnosis(), null, 2)}\n`,
    );
    wroteDiagnosis = true;

    const lock = parseMigrationsLock();
    expect(lock.status).toBe('ok');

    const forced = runGatePhase0({
      diagnosisFilename: diagnosisPass,
      forceGatePhase0: true,
    });
    expect(forced.lock_ok).toBe(true);
    if (forced.exit === 0) {
      expect(forced.ssot_forced).toBe(true);
    } else {
      expect(forced.reason).toBe('SSOT_MISSING_CANNOT_FORCE');
    }
  });

  it('rejects --force-gate-phase0 when SSOT file is missing in isolated repo', () => {
    writeFileSync(
      path.join(perfDir, diagnosisPass),
      `${JSON.stringify(baseDiagnosis(), null, 2)}\n`,
    );
    wroteDiagnosis = true;

    const tmpRoot = path.join(perfDir, 'tmp-no-ssot');
    mkdirSync(path.join(tmpRoot, 'supabase', 'migrations'), { recursive: true });
    writeFileSync(
      path.join(tmpRoot, 'supabase', 'migrations.lock.json'),
      `${JSON.stringify({ algorithm: 'sha256', migrations: {} }, null, 2)}\n`,
    );

    const result = runGatePhase0({
      diagnosisFilename: diagnosisPass,
      forceGatePhase0: true,
      repoRoot: tmpRoot,
    });

    expect(result.exit).toBe(1);
    expect(result.reason).toBe('SSOT_MISSING_CANNOT_FORCE');
    expect(result.lock_ok).toBe(true);
  });

  it('evaluates ACTIVE_WORK_SSOT heuristic on real repo', () => {
    const ssot = evaluateActiveWorkSsotHeuristic();
    expect(ssot.status).toBe('ok');
  });
});
