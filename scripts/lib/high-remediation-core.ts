import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listOrphanRepoDevProcesses } from './cursor-dev-processes';
import { DOMINANT_MIN_MB } from './dominant-ram-consumer';
import {
  HIGH_CLAUDE_DESKTOP_MB,
  HIGH_CURSOR_CORE_MB,
  HIGH_RAM_FREE_MB,
  type GateDiagnosisRecord,
} from './gate-diagnosis-core';
import { perfArtifactsDir } from './max-context-evidence';

export const WARN_RAM_FREE_MB = 1228;

export type HighRemediationRecommendation =
  | 'cursor:emergency-reset'
  | 'cursor:purge'
  | 'cursor:env-doctor'
  | 'cursor:new-chat'
  | 'cursor:background-agents-off'
  | 'cursor:max-context-verify-6k'
  | 'cursor:extension-audit'
  | 'claude-desktop:quit-and-restart'
  | 'claude-desktop:close-unused-workspaces'
  | 'stack:stop'
  | 'docker:stop'
  | 'chrome:close';

export interface HighRemediationOrphanPid {
  pid: number;
  commandLine: string;
}

export interface HighRemediationDryRun {
  orphan_pids: HighRemediationOrphanPid[];
  recommendations: HighRemediationRecommendation[];
}

export interface HighRemediationRecord {
  diagnosis_ref: string;
  remediation_executed: boolean;
  dry_run: HighRemediationDryRun;
  executed_at: string | null;
  commands?: string[];
}

export interface HighRemediationRunResult {
  exit: 0 | 1;
  remediation_path: string | null;
  record: HighRemediationRecord | null;
  message: string;
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function remediationFilename(createdAt: Date): string {
  const iso = createdAt.toISOString().replace(/:/g, '-');
  return `remediation-${iso}.json`;
}

export function parseConfirmHighRemediationArg(argv: readonly string[]): boolean {
  return argv.includes('--confirm-high-remediation');
}

export function listDiagnosisFilenames(): string[] {
  const dir = perfArtifactsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.startsWith('diagnosis-') && name.endsWith('.json'))
    .sort();
}

export function readDiagnosisByFilename(filename: string): GateDiagnosisRecord | null {
  const filePath = path.join(perfArtifactsDir(), filename);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as GateDiagnosisRecord;
  } catch {
    return null;
  }
}

export function listRemediationFilenames(): string[] {
  const dir = perfArtifactsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.startsWith('remediation-') && name.endsWith('.json'))
    .sort();
}

export function findLatestRemediationFilename(): string | null {
  const filenames = listRemediationFilenames();
  return filenames[filenames.length - 1] ?? null;
}

export function readRemediationByFilename(filename: string): HighRemediationRecord | null {
  const filePath = path.join(perfArtifactsDir(), filename);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as HighRemediationRecord;
  } catch {
    return null;
  }
}

export function findLatestDiagnosisFilename(options?: { preferPass?: boolean }): string | null {
  const preferPass = options?.preferPass ?? true;
  const filenames = listDiagnosisFilenames();
  if (filenames.length === 0) return null;

  if (preferPass) {
    for (let index = filenames.length - 1; index >= 0; index -= 1) {
      const record = readDiagnosisByFilename(filenames[index]!);
      if (record?.gate_status === 'pass') return filenames[index]!;
    }
  }

  return filenames[filenames.length - 1] ?? null;
}

export function collectOrphanDryRunInfo(): HighRemediationOrphanPid[] {
  return listOrphanRepoDevProcesses().map((orphan) => ({
    pid: orphan.pid,
    commandLine: orphan.commandLine,
  }));
}

export function buildHighRemediationRecommendations(
  diagnosis: GateDiagnosisRecord,
): HighRemediationRecommendation[] {
  const recommendations = new Set<HighRemediationRecommendation>();
  const { dominant_ram_consumer: dominant } = diagnosis;

  if (diagnosis.orphan_drift || diagnosis.orphan_repo_count > 0) {
    recommendations.add('cursor:emergency-reset');
  }

  if (diagnosis.ram_free_mb > 0 && diagnosis.ram_free_mb < WARN_RAM_FREE_MB) {
    recommendations.add('stack:stop');
    recommendations.add('docker:stop');
    recommendations.add('chrome:close');
  }

  if (dominant === 'cursor') {
    if (diagnosis.cursor_core_mb >= HIGH_CURSOR_CORE_MB) {
      recommendations.add('cursor:new-chat');
      recommendations.add('cursor:background-agents-off');
      recommendations.add('cursor:max-context-verify-6k');
    } else if (diagnosis.cursor_core_mb >= DOMINANT_MIN_MB) {
      recommendations.add('cursor:new-chat');
      recommendations.add('cursor:background-agents-off');
      recommendations.add('cursor:extension-audit');
    }
  } else if (dominant === 'claude') {
    if (diagnosis.claude_desktop_mb >= HIGH_CLAUDE_DESKTOP_MB) {
      recommendations.add('claude-desktop:quit-and-restart');
      recommendations.add('claude-desktop:close-unused-workspaces');
    } else if (diagnosis.claude_desktop_mb >= DOMINANT_MIN_MB) {
      recommendations.add('claude-desktop:close-unused-workspaces');
    }
  } else if (dominant === 'mixed') {
    recommendations.add('claude-desktop:quit-and-restart');
    recommendations.add('cursor:new-chat');
    recommendations.add('cursor:background-agents-off');
  } else if (
    diagnosis.ram_free_mb > 0 &&
    diagnosis.ram_free_mb < HIGH_RAM_FREE_MB &&
    dominant === 'none'
  ) {
    recommendations.add('cursor:env-doctor');
    recommendations.add('docker:stop');
    recommendations.add('chrome:close');
  }

  if (diagnosis.max_context === '200k') {
    recommendations.add('cursor:max-context-verify-6k');
  }

  return [...recommendations];
}

function writeRemediationFile(record: HighRemediationRecord, createdAt: Date): string {
  const dir = perfArtifactsDir();
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, remediationFilename(createdAt));
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return filePath;
}

export type EmergencyResetExecutor = () => void;

export function defaultEmergencyResetExecutor(): void {
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'cursor-emergency-reset.ts');
  execSync(`tsx "${scriptPath}"`, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    timeout: 120_000,
  });
}

export function runHighRemediation(options?: {
  confirmHighRemediation?: boolean;
  diagnosisFilename?: string | null;
  executeEmergencyReset?: EmergencyResetExecutor;
}): HighRemediationRunResult {
  const confirm = options?.confirmHighRemediation ?? false;
  const diagnosisRef =
    options?.diagnosisFilename ?? findLatestDiagnosisFilename({ preferPass: true });

  if (!diagnosisRef) {
    return {
      exit: 1,
      remediation_path: null,
      record: null,
      message: 'no diagnosis file found — run cursor:gate-diagnosis first',
    };
  }

  const diagnosis = readDiagnosisByFilename(diagnosisRef);
  if (!diagnosis) {
    return {
      exit: 1,
      remediation_path: null,
      record: null,
      message: `diagnosis unreadable: ${diagnosisRef}`,
    };
  }

  const createdAt = new Date();
  const dryRun: HighRemediationDryRun = {
    orphan_pids: collectOrphanDryRunInfo(),
    recommendations: buildHighRemediationRecommendations(diagnosis),
  };

  const record: HighRemediationRecord = {
    diagnosis_ref: diagnosisRef,
    remediation_executed: false,
    dry_run: dryRun,
    executed_at: null,
  };

  if (confirm) {
    const executor = options?.executeEmergencyReset ?? defaultEmergencyResetExecutor;
    executor();
    record.remediation_executed = true;
    record.executed_at = createdAt.toISOString();
    record.commands = ['cursor:emergency-reset'];
  }

  const remediationPath = writeRemediationFile(record, createdAt);

  const mode = confirm ? 'executed' : 'dry-run';
  const orphanSummary =
    dryRun.orphan_pids.length > 0
      ? `${dryRun.orphan_pids.length} orphan PID(s)`
      : '0 orphan PID(s)';

  return {
    exit: 0,
    remediation_path: remediationPath,
    record,
    message: `[high-remediation] ${mode} · ${orphanSummary} · recommendations=${JSON.stringify(dryRun.recommendations)}`,
  };
}

export const HIGH_REMEDIATION_REPO_ROOT = REPO_ROOT;
