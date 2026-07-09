import { describe, expect, it } from 'vitest';
import {
  emptyGateResults,
  GateManifestCollector,
  type ManifestGateName,
} from '../../scripts/lib/gate-manifest';

describe('gate-manifest', () => {
  it('emptyGateResults initializes all gates as skip', () => {
    const gates = emptyGateResults();
    const names: ManifestGateName[] = [
      'typecheck',
      'lint',
      'sql',
      'advisor',
      'e2e',
      'visual',
      'pwa',
    ];
    for (const name of names) {
      expect(gates[name].status).toBe('skip');
      expect(gates[name].durationMs).toBe(0);
    }
  });

  it('finalize requires all gates pass for Phase R releaseReady', () => {
    const collector = new GateManifestCollector();
    const names: ManifestGateName[] = [
      'typecheck',
      'lint',
      'sql',
      'advisor',
      'e2e',
      'visual',
      'pwa',
    ];
    for (const name of names) {
      collector.record(name, 'pass', 10);
    }
    const manifest = collector.finalize();
    expect(manifest.releaseReady).toBe(true);
    expect(manifest.gates.typecheck.status).toBe('pass');
    expect(manifest.totalDurationMs).toBeGreaterThanOrEqual(0);
    expect(manifest.commit).toBeTruthy();
    expect(manifest.startedAt).toMatch(/^\d{4}-/);
  });

  it('allowSkip treats skip gates as OK for check:full scope', () => {
    const collector = new GateManifestCollector();
    collector.record('sql', 'pass', 100);
    collector.record('advisor', 'pass', 50);
    collector.record('e2e', 'pass', 1000);
    collector.record('pwa', 'pass', 20);
    const manifest = collector.finalize({ allowSkip: true });
    expect(manifest.releaseReady).toBe(true);
    expect(manifest.gates.typecheck.status).toBe('skip');
  });

  it('records fail status and error message', async () => {
    const collector = new GateManifestCollector();
    await expect(
      collector.recordRun('lint', async () => {
        throw new Error('lint broke');
      }),
    ).rejects.toThrow('lint broke');
    expect(collector.getGate('lint').status).toBe('fail');
    expect(collector.getGate('lint').error).toContain('lint broke');
    expect(collector.finalize().releaseReady).toBe(false);
  });
});
