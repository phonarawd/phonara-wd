/**
 * Phase R gate machine report — authoritative release evidence (no hand-edited YAML).
 * Output: gate-manifest/phase-r-manifest.json (CI artifact · never commit).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSyncSafe } from './spawn-safe';

export type GateStatus = 'pass' | 'fail' | 'skip';

export type ManifestGateName = 'typecheck' | 'lint' | 'sql' | 'advisor' | 'e2e' | 'visual' | 'pwa';

export interface GateResult {
  readonly status: GateStatus;
  readonly durationMs: number;
  readonly error?: string;
}

export interface PhaseRGateManifest {
  readonly commit: string;
  readonly commitShort: string;
  readonly branch: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly totalDurationMs: number;
  /** true when every gate is pass (skip allowed only for explicitly optional remote steps). */
  readonly releaseReady: boolean;
  readonly gates: Record<ManifestGateName, GateResult>;
}

export const DEFAULT_MANIFEST_PATH = join('gate-manifest', 'phase-r-manifest.json');

const GATE_NAMES: readonly ManifestGateName[] = [
  'typecheck',
  'lint',
  'sql',
  'advisor',
  'e2e',
  'visual',
  'pwa',
];

export function emptyGateResults(): Record<ManifestGateName, GateResult> {
  return Object.fromEntries(
    GATE_NAMES.map((name) => [name, { status: 'skip' as const, durationMs: 0 }]),
  ) as Record<ManifestGateName, GateResult>;
}

export function readGitMetadata(): { commit: string; commitShort: string; branch: string } {
  const commit = runGit(['rev-parse', 'HEAD']);
  const commitShort = runGit(['rev-parse', '--short=7', 'HEAD']);
  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  return { commit, commitShort, branch };
}

function runGit(args: string[]): string {
  const result = spawnSyncSafe('git', args, { cwd: process.cwd(), encoding: 'utf8' });
  if (result.status !== 0) {
    return 'unknown';
  }
  return result.stdout.trim() || 'unknown';
}

export class GateManifestCollector {
  private readonly startedAtMs = Date.now();
  private readonly startedAtIso = new Date().toISOString();
  private readonly gates: Record<ManifestGateName, GateResult> = emptyGateResults();

  record(name: ManifestGateName, status: GateStatus, durationMs: number, error?: string): void {
    this.gates[name] = { status, durationMs, ...(error ? { error } : {}) };
  }

  async recordRun(name: ManifestGateName, run: () => Promise<void>): Promise<void> {
    const started = Date.now();
    try {
      await run();
      this.record(name, 'pass', Date.now() - started);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.record(name, 'fail', Date.now() - started, message);
      throw error;
    }
  }

  recordSync(name: ManifestGateName, run: () => void): void {
    const started = Date.now();
    try {
      run();
      this.record(name, 'pass', Date.now() - started);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.record(name, 'fail', Date.now() - started, message);
      throw error;
    }
  }

  getGate(name: ManifestGateName): GateResult {
    return this.gates[name];
  }

  finalize(options?: { allowAdvisorSkip?: boolean; allowSkip?: boolean }): PhaseRGateManifest {
    const finishedAt = new Date().toISOString();
    const git = readGitMetadata();
    const releaseReady = options?.allowSkip
      ? !GATE_NAMES.some((name) => this.gates[name].status === 'fail')
      : GATE_NAMES.every((name) => {
          const gate = this.gates[name];
          if (gate.status === 'pass') return true;
          if (gate.status === 'skip' && name === 'advisor' && options?.allowAdvisorSkip)
            return true;
          return false;
        });

    return {
      ...git,
      startedAt: this.startedAtIso,
      finishedAt,
      totalDurationMs: Date.now() - this.startedAtMs,
      releaseReady,
      gates: { ...this.gates },
    };
  }

  writeManifest(manifest: PhaseRGateManifest, outputPath = DEFAULT_MANIFEST_PATH): string {
    const abs = join(process.cwd(), outputPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return outputPath;
  }

  writeFinal(options?: {
    allowAdvisorSkip?: boolean;
    allowSkip?: boolean;
    outputPath?: string;
  }): string {
    const manifest = this.finalize(options);
    return this.writeManifest(manifest, options?.outputPath);
  }

  hasRecorded(name: ManifestGateName): boolean {
    return this.gates[name].status !== 'skip';
  }
}

export function printManifestSummary(manifest: PhaseRGateManifest): void {
  process.stdout.write('\n[gate-manifest] Phase R report\n');
  process.stdout.write(`  commit: ${manifest.commitShort} (${manifest.branch})\n`);
  process.stdout.write(`  duration: ${Math.round(manifest.totalDurationMs / 1000)}s\n`);
  process.stdout.write(`  releaseReady: ${manifest.releaseReady}\n`);
  for (const name of GATE_NAMES) {
    const gate = manifest.gates[name];
    const err = gate.error ? ` — ${gate.error}` : '';
    process.stdout.write(`  ${name}: ${gate.status} (${gate.durationMs}ms)${err}\n`);
  }
}
