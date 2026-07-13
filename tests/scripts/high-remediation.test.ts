import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildHighRemediationRecommendations,
  parseConfirmHighRemediationArg,
  readDiagnosisByFilename,
  runHighRemediation,
  type HighRemediationRecommendation,
} from '../../scripts/lib/high-remediation-core';
import type { GateDiagnosisRecord } from '../../scripts/lib/gate-diagnosis-core';
import { perfArtifactsDir } from '../../scripts/lib/max-context-evidence';

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

describe('high-remediation dry-run contract', () => {
  const perfDir = perfArtifactsDir();
  let wroteDiagnosis = false;

  beforeEach(() => {
    mkdirSync(perfDir, { recursive: true });
  });

  afterEach(() => {
    if (wroteDiagnosis) {
      for (const name of ['diagnosis-test.json']) {
        const filePath = path.join(perfDir, name);
        if (existsSync(filePath)) rmSync(filePath);
      }
    }
    for (const entry of ['remediation-2026-07-10T12-00-00.000Z.json']) {
      const filePath = path.join(perfDir, entry);
      if (existsSync(filePath)) rmSync(filePath);
    }
  });

  it('parses --confirm-high-remediation flag', () => {
    expect(parseConfirmHighRemediationArg(['--confirm-high-remediation'])).toBe(true);
    expect(parseConfirmHighRemediationArg([])).toBe(false);
  });

  it('builds claude-dominant HIGH recommendations', () => {
    const recs = buildHighRemediationRecommendations(
      baseDiagnosis({
        claude_desktop_mb: 1170,
        dominant_ram_consumer: 'claude',
        high_reasons: ['claude_desktop_mb'],
        severity: 'HIGH',
      }),
    );
    expect(recs).toContain('claude-desktop:quit-and-restart');
    expect(recs).toContain('claude-desktop:close-unused-workspaces');
    expect(recs).not.toContain('cursor:purge');
  });

  it('builds cursor-dominant fallback recommendations for 800–1799MB', () => {
    const recs = buildHighRemediationRecommendations(
      baseDiagnosis({
        cursor_core_mb: 1200,
        dominant_ram_consumer: 'cursor',
      }),
    );
    expect(recs).toEqual([
      'cursor:new-chat',
      'cursor:background-agents-off',
      'cursor:extension-audit',
    ] satisfies HighRemediationRecommendation[]);
  });

  it('defaults to dry-run and does not execute emergency-reset', () => {
    writeFileSync(
      path.join(perfDir, 'diagnosis-test.json'),
      `${JSON.stringify(baseDiagnosis({ orphan_repo_count: 1, severity: 'HIGH' }), null, 2)}\n`,
    );
    wroteDiagnosis = true;

    const executor = vi.fn();
    const result = runHighRemediation({
      confirmHighRemediation: false,
      diagnosisFilename: 'diagnosis-test.json',
      executeEmergencyReset: executor,
    });

    expect(result.exit).toBe(0);
    expect(result.record?.remediation_executed).toBe(false);
    expect(result.record?.executed_at).toBeNull();
    expect(result.record?.commands).toBeUndefined();
    expect(executor).not.toHaveBeenCalled();
    expect(result.message).toContain('dry-run');
  });

  it('runs emergency-reset only when --confirm-high-remediation', () => {
    writeFileSync(
      path.join(perfDir, 'diagnosis-test.json'),
      `${JSON.stringify(baseDiagnosis({ orphan_repo_count: 2, severity: 'HIGH' }), null, 2)}\n`,
    );
    wroteDiagnosis = true;

    const executor = vi.fn();
    const result = runHighRemediation({
      confirmHighRemediation: true,
      diagnosisFilename: 'diagnosis-test.json',
      executeEmergencyReset: executor,
    });

    expect(result.exit).toBe(0);
    expect(result.record?.remediation_executed).toBe(true);
    expect(result.record?.commands).toEqual(['cursor:emergency-reset']);
    expect(result.record?.commands).not.toContain('cursor:purge');
    expect(executor).toHaveBeenCalledTimes(1);
  });

  it('reads diagnosis by filename', () => {
    writeFileSync(
      path.join(perfDir, 'diagnosis-test.json'),
      `${JSON.stringify(baseDiagnosis(), null, 2)}\n`,
    );
    wroteDiagnosis = true;
    expect(readDiagnosisByFilename('diagnosis-test.json')?.gate_status).toBe('pass');
  });
});
