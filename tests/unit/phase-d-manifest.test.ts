import { describe, expect, it } from 'vitest';
import {
  emptyPhaseDSteps,
  PhaseDManifestCollector,
  readPhaseRManifestSnapshot,
  type PhaseDStepName,
} from '../../scripts/lib/phase-d-manifest';

describe('phase-d-manifest', () => {
  it('emptyPhaseDSteps initializes operator and automated owners', () => {
    const steps = emptyPhaseDSteps();
    expect(steps.anonKeyRotate.owner).toBe('operator');
    expect(steps.phaseRPrerequisite.owner).toBe('automated');
    expect(steps.anonKeyRotate.status).toBe('skip');
  });

  it('prepReady true when automated steps pass and operator still pending', () => {
    const collector = new PhaseDManifestCollector();
    const automated: PhaseDStepName[] = [
      'phaseRPrerequisite',
      'remoteProdLayer',
      'securityAdvisor',
      'edgeFunctions',
      'opsHealth',
      'observabilityDr',
      'backupRehearsal',
      'killSwitchRehearsal',
      'loadSmoke',
    ];
    for (const name of automated) {
      collector.record(name, 'pass', 1, 'automated');
    }
    collector.markOperatorPending('anonKeyRotate', '§1');
    collector.markOperatorPending('prodSupabaseSeparation', '§3');
    collector.markOperatorPending('ciMigration', '§2');
    collector.markOperatorPending('legalCompliance', '§7');

    const manifest = collector.finalize();
    expect(manifest.prepReady).toBe(true);
    expect(manifest.launchReady).toBe(false);
  });

  it('launchReady true only when operator confirms all D gates', () => {
    const collector = new PhaseDManifestCollector();
    const all: PhaseDStepName[] = [
      'phaseRPrerequisite',
      'remoteProdLayer',
      'securityAdvisor',
      'edgeFunctions',
      'opsHealth',
      'observabilityDr',
      'backupRehearsal',
      'killSwitchRehearsal',
      'loadSmoke',
      'anonKeyRotate',
      'prodSupabaseSeparation',
      'ciMigration',
      'legalCompliance',
    ];
    for (const name of all) {
      collector.record(name, 'pass', 1, name === 'anonKeyRotate' ? 'operator' : 'automated');
    }
    const manifest = collector.finalize();
    expect(manifest.launchReady).toBe(true);
  });

  it('confirmOperatorStep records pass with evidence', () => {
    const collector = new PhaseDManifestCollector();
    collector.confirmOperatorStep('anonKeyRotate', 'dashboard-rotate-2026-06-30');
    expect(collector.finalize().steps.anonKeyRotate.status).toBe('pass');
    expect(collector.finalize().steps.anonKeyRotate.evidence).toContain('dashboard');
  });

  it('readPhaseRManifestSnapshot returns undefined for missing file', () => {
    expect(readPhaseRManifestSnapshot('gate-manifest/nonexistent-phase-r.json')).toBeUndefined();
  });

  it('records fail and sets prepReady false', async () => {
    const collector = new PhaseDManifestCollector();
    await expect(
      collector.recordRun('securityAdvisor', 'automated', async () => {
        throw new Error('advisor errors');
      }),
    ).rejects.toThrow('advisor errors');
    expect(collector.finalize().prepReady).toBe(false);
    expect(collector.finalize().steps.securityAdvisor.status).toBe('fail');
  });
});
