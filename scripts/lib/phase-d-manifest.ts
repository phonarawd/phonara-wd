/**
 * Phase D operator launch gate — machine report (prep only · AI never sets launchReady without operator confirm).
 * Output: gate-manifest/phase-d-manifest.json (CI artifact · never commit).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readGitMetadata } from './gate-manifest';

export type PhaseDStepStatus = 'pass' | 'fail' | 'skip' | 'operator_pending';

export type PhaseDStepName =
  | 'phaseRPrerequisite'
  | 'remoteProdLayer'
  | 'securityAdvisor'
  | 'edgeFunctions'
  | 'opsHealth'
  | 'observabilityDr'
  | 'backupRehearsal'
  | 'killSwitchRehearsal'
  | 'loadSmoke'
  | 'anonKeyRotate'
  | 'prodSupabaseSeparation'
  | 'ciMigration'
  | 'legalCompliance';

export type PhaseDStepOwner = 'automated' | 'operator';

export interface PhaseDStepResult {
  readonly status: PhaseDStepStatus;
  readonly durationMs: number;
  readonly owner: PhaseDStepOwner;
  readonly runbookSection?: string;
  readonly error?: string;
  readonly evidence?: string;
}

export interface PhaseRPrerequisiteSnapshot {
  readonly path: string;
  readonly releaseReady: boolean;
  readonly commitShort?: string;
}

export interface PhaseDGateManifest {
  readonly commit: string;
  readonly commitShort: string;
  readonly branch: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly totalDurationMs: number;
  /** true only when every step is pass and operator confirmed launch gates (never AI-only). */
  readonly launchReady: boolean;
  /** true when all automated prep steps pass (operator gates may still be pending). */
  readonly prepReady: boolean;
  readonly phaseRPrerequisite?: PhaseRPrerequisiteSnapshot;
  readonly steps: Record<PhaseDStepName, PhaseDStepResult>;
}

export const DEFAULT_PHASE_D_MANIFEST_PATH = join('gate-manifest', 'phase-d-manifest.json');

export const DEFAULT_PHASE_R_MANIFEST_PATH = join('gate-manifest', 'phase-r-manifest.json');

const STEP_NAMES: readonly PhaseDStepName[] = [
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

const OPERATOR_STEP_NAMES: readonly PhaseDStepName[] = [
  'anonKeyRotate',
  'prodSupabaseSeparation',
  'ciMigration',
  'legalCompliance',
];

const AUTOMATED_STEP_NAMES: readonly PhaseDStepName[] = STEP_NAMES.filter(
  (name) => !OPERATOR_STEP_NAMES.includes(name),
);

export function emptyPhaseDSteps(): Record<PhaseDStepName, PhaseDStepResult> {
  return Object.fromEntries(
    STEP_NAMES.map((name) => [
      name,
      {
        status: 'skip' as const,
        durationMs: 0,
        owner: (OPERATOR_STEP_NAMES.includes(name) ? 'operator' : 'automated') as PhaseDStepOwner,
      },
    ]),
  ) as Record<PhaseDStepName, PhaseDStepResult>;
}

export function readPhaseRManifestSnapshot(
  manifestPath = DEFAULT_PHASE_R_MANIFEST_PATH,
): PhaseRPrerequisiteSnapshot | undefined {
  const abs = join(process.cwd(), manifestPath);
  if (!existsSync(abs)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(abs, 'utf8')) as {
      releaseReady?: boolean;
      commitShort?: string;
    };
    return {
      path: manifestPath,
      releaseReady: raw.releaseReady === true,
      commitShort: raw.commitShort,
    };
  } catch {
    return undefined;
  }
}

export class PhaseDManifestCollector {
  private readonly startedAtMs = Date.now();
  private readonly startedAtIso = new Date().toISOString();
  private readonly steps: Record<PhaseDStepName, PhaseDStepResult> = emptyPhaseDSteps();
  private phaseRPrerequisite?: PhaseRPrerequisiteSnapshot;
  private operatorConfirmed = new Set<PhaseDStepName>();

  setPhaseRPrerequisite(snapshot: PhaseRPrerequisiteSnapshot | undefined): void {
    this.phaseRPrerequisite = snapshot;
  }

  confirmOperatorStep(name: PhaseDStepName, evidence?: string): void {
    this.operatorConfirmed.add(name);
    this.record(name, 'pass', 0, 'operator', evidence ?? 'operator-cli-confirm');
  }

  record(
    name: PhaseDStepName,
    status: PhaseDStepStatus,
    durationMs: number,
    owner: PhaseDStepOwner,
    evidence?: string,
    error?: string,
    runbookSection?: string,
  ): void {
    this.steps[name] = {
      status,
      durationMs,
      owner,
      ...(runbookSection ? { runbookSection } : {}),
      ...(evidence ? { evidence } : {}),
      ...(error ? { error } : {}),
    };
  }

  async recordRun(
    name: PhaseDStepName,
    owner: PhaseDStepOwner,
    run: () => Promise<void>,
    runbookSection?: string,
  ): Promise<void> {
    const started = Date.now();
    try {
      await run();
      this.record(name, 'pass', Date.now() - started, owner, undefined, undefined, runbookSection);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.record(name, 'fail', Date.now() - started, owner, undefined, message, runbookSection);
      throw error;
    }
  }

  recordSync(
    name: PhaseDStepName,
    owner: PhaseDStepOwner,
    run: () => void,
    runbookSection?: string,
  ): void {
    const started = Date.now();
    try {
      run();
      this.record(name, 'pass', Date.now() - started, owner, undefined, undefined, runbookSection);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.record(name, 'fail', Date.now() - started, owner, undefined, message, runbookSection);
      throw error;
    }
  }

  markOperatorPending(name: PhaseDStepName, runbookSection: string, hint?: string): void {
    this.record(name, 'operator_pending', 0, 'operator', hint, undefined, runbookSection);
  }

  finalize(): PhaseDGateManifest {
    const finishedAt = new Date().toISOString();
    const git = readGitMetadata();

    const automatedReady = AUTOMATED_STEP_NAMES.every((name) => {
      const step = this.steps[name];
      return step.status === 'pass' || step.status === 'skip';
    });

    const operatorReady = OPERATOR_STEP_NAMES.every((name) => this.steps[name].status === 'pass');

    return {
      ...git,
      startedAt: this.startedAtIso,
      finishedAt,
      totalDurationMs: Date.now() - this.startedAtMs,
      prepReady:
        automatedReady && !AUTOMATED_STEP_NAMES.some((name) => this.steps[name].status === 'fail'),
      launchReady:
        automatedReady &&
        operatorReady &&
        !STEP_NAMES.some((name) => this.steps[name].status === 'fail'),
      ...(this.phaseRPrerequisite ? { phaseRPrerequisite: this.phaseRPrerequisite } : {}),
      steps: { ...this.steps },
    };
  }

  writeManifest(manifest: PhaseDGateManifest, outputPath = DEFAULT_PHASE_D_MANIFEST_PATH): string {
    const abs = join(process.cwd(), outputPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return outputPath;
  }

  writeFinal(outputPath?: string): string {
    return this.writeManifest(this.finalize(), outputPath);
  }
}

export function printPhaseDSummary(manifest: PhaseDGateManifest): void {
  process.stdout.write('\n[phase-d-manifest] Operator launch gate report\n');
  process.stdout.write(`  commit: ${manifest.commitShort} (${manifest.branch})\n`);
  process.stdout.write(`  duration: ${Math.round(manifest.totalDurationMs / 1000)}s\n`);
  process.stdout.write(`  prepReady: ${manifest.prepReady} (automated checks)\n`);
  process.stdout.write(`  launchReady: ${manifest.launchReady} (operator confirm required)\n`);
  if (manifest.phaseRPrerequisite) {
    process.stdout.write(
      `  phaseR: ${manifest.phaseRPrerequisite.path} releaseReady=${manifest.phaseRPrerequisite.releaseReady}\n`,
    );
  }
  for (const name of STEP_NAMES) {
    const step = manifest.steps[name];
    const err = step.error ? ` — ${step.error}` : '';
    const ev = step.evidence ? ` · ${step.evidence}` : '';
    process.stdout.write(
      `  ${name} [${step.owner}]: ${step.status} (${step.durationMs}ms)${ev}${err}\n`,
    );
  }
}
