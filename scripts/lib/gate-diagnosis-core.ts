import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditCursorArgv } from './cursor-argv';
import { sumClaudeDesktopRssMb, type WinProcessRow } from './claude-desktop-processes';
import {
  collectE2ePortPids,
  detectOrphanListingDrift,
  isE2eToolCommandLine,
  listOrphanRepoDevProcesses,
} from './cursor-dev-processes';
import { dominantRamConsumer } from './dominant-ram-consumer';
import {
  isEvidenceValid,
  maxContextEvidencePath,
  perfArtifactsDir,
  readMaxContextEvidence,
  readMaxContextFromSettings,
  resolveMaxContextStatus,
  writeMaxContextEvidence,
  type MaxContextEvidence,
  type MaxContextStatus,
  type MaxContextValue,
} from './max-context-evidence';

export type GateDiagnosisStatus = 'pass' | 'fail' | 'ambiguous';

export type HighReasonKey =
  | 'cursor_core_mb'
  | 'claude_desktop_mb'
  | 'ram_free_mb'
  | 'orphan_drift'
  | 'orphan_repo_count';

export type SeverityLevel = 'HIGH' | 'MED' | 'LOW' | 'none';

export interface RuntimeProcessSnapshot {
  cursor_core_mb: number;
  extension_host_mb: number;
  tsserver_mb: number;
  claude_desktop_mb: number;
  claude_desktop_count: number;
  ram_total_mb: number;
  ram_free_mb: number;
}

export interface GateDiagnosisRecord {
  gate_status: GateDiagnosisStatus;
  created_at: string;
  platform: NodeJS.Platform;
  cursor_core_mb: number;
  extension_host_mb: number;
  tsserver_mb: number;
  claude_desktop_mb: number;
  claude_desktop_count: number;
  ram_total_mb: number;
  ram_free_mb: number;
  dominant_ram_consumer: ReturnType<typeof dominantRamConsumer>;
  high_reasons: HighReasonKey[];
  severity: SeverityLevel;
  orphan_repo_count: number;
  orphan_drift: boolean;
  orphan_drift_missed_pids: number[];
  max_context_status: MaxContextStatus;
  max_context: MaxContextValue;
  max_context_source: 'settings' | 'evidence' | 'attest' | 'none';
  max_context_evidence_path: string | null;
  med_reasons: string[];
  low_reasons: string[];
  argv_ok: boolean;
}

export interface GateDiagnosisRunResult {
  exit: 0 | 1 | 2;
  gate_status: GateDiagnosisStatus;
  diagnosis: GateDiagnosisRecord | null;
  diagnosis_path: string | null;
  summary_line: string | null;
}

export const HIGH_CURSOR_CORE_MB = 1800;
export const HIGH_CLAUDE_DESKTOP_MB = 1000;
export const HIGH_RAM_FREE_MB = 1024;
export const MED_TSSERVER_MB = 400;

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function diagnosisFilename(createdAt: Date): string {
  const iso = createdAt.toISOString().replace(/:/g, '-');
  return `diagnosis-${iso}.json`;
}

function emptyRuntimeSnapshot(): RuntimeProcessSnapshot {
  return {
    cursor_core_mb: 0,
    extension_host_mb: 0,
    tsserver_mb: 0,
    claude_desktop_mb: 0,
    claude_desktop_count: 0,
    ram_total_mb: 0,
    ram_free_mb: 0,
  };
}

function readWindowsRuntimeSnapshot(): RuntimeProcessSnapshot {
  const ps1 = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'cursor-gate-diagnosis-stats.ps1',
  );
  try {
    const raw = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000,
    }).trim();
    if (!raw) return emptyRuntimeSnapshot();
    const parsed = JSON.parse(raw) as RuntimeProcessSnapshot;
    return {
      cursor_core_mb: Number(parsed.cursor_core_mb ?? 0),
      extension_host_mb: Number(parsed.extension_host_mb ?? 0),
      tsserver_mb: Number(parsed.tsserver_mb ?? 0),
      claude_desktop_mb: Number(parsed.claude_desktop_mb ?? 0),
      claude_desktop_count: Number(parsed.claude_desktop_count ?? 0),
      ram_total_mb: Number(parsed.ram_total_mb ?? 0),
      ram_free_mb: Number(parsed.ram_free_mb ?? 0),
    };
  } catch {
    return emptyRuntimeSnapshot();
  }
}

function listE2eToolPidsOnPorts(): number[] {
  const e2ePortPids = collectE2ePortPids();
  if (process.platform !== 'win32' || e2ePortPids.size === 0) return [...e2ePortPids];

  const ps = [
    '$rows = @()',
    "foreach ($name in @('node.exe','bun.exe')) {",
    '  Get-CimInstance Win32_Process -Filter ("Name=\'" + $name + "\'")',
    "  | Where-Object { $_.CommandLine -match 'playwright|vitest|test:e2e|run-e2e' }",
    '  | ForEach-Object { $rows += $_.ProcessId }',
    '}',
    '[int[]]($rows | Select-Object -Unique)',
    '| ConvertTo-Json -Compress',
  ].join('; ');

  try {
    const raw = execSync(`powershell -NoProfile -Command "${ps}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000,
    }).trim();
    if (!raw) return [...e2ePortPids];
    const parsed = JSON.parse(raw) as number | number[];
    const fromScan = Array.isArray(parsed) ? parsed : [parsed];
    return [...new Set([...e2ePortPids, ...fromScan.filter((pid) => Number.isFinite(pid))])];
  } catch {
    return [...e2ePortPids];
  }
}

export function buildHighReasons(input: {
  cursor_core_mb: number;
  claude_desktop_mb: number;
  ram_free_mb: number;
  orphan_drift: boolean;
  orphan_repo_count: number;
}): HighReasonKey[] {
  const reasons: HighReasonKey[] = [];
  if (input.cursor_core_mb >= HIGH_CURSOR_CORE_MB) reasons.push('cursor_core_mb');
  if (input.claude_desktop_mb >= HIGH_CLAUDE_DESKTOP_MB) reasons.push('claude_desktop_mb');
  if (input.ram_free_mb > 0 && input.ram_free_mb < HIGH_RAM_FREE_MB) reasons.push('ram_free_mb');
  if (input.orphan_drift) reasons.push('orphan_drift');
  if (input.orphan_repo_count > 0) reasons.push('orphan_repo_count');
  return reasons;
}

export function classifySeverity(
  highReasons: readonly HighReasonKey[],
  tsserverMb: number,
): SeverityLevel {
  if (highReasons.length > 0) return 'HIGH';
  if (tsserverMb >= MED_TSSERVER_MB) return 'MED';
  return 'none';
}

export function formatGateDiagnosisSummaryLine(
  diagnosis: Pick<
    GateDiagnosisRecord,
    | 'ram_free_mb'
    | 'cursor_core_mb'
    | 'claude_desktop_mb'
    | 'claude_desktop_count'
    | 'dominant_ram_consumer'
    | 'high_reasons'
  >,
): string {
  const high = diagnosis.high_reasons.length > 0 ? `[${diagnosis.high_reasons.join(',')}]` : '[]';
  return (
    `[perf-summary] RAM free ${diagnosis.ram_free_mb}MB · Cursor core ${diagnosis.cursor_core_mb}MB · ` +
    `Claude desktop ${diagnosis.claude_desktop_mb}MB (${diagnosis.claude_desktop_count} proc) · ` +
    `dominant=${diagnosis.dominant_ram_consumer} · high=${high}`
  );
}

function collectOrphanDrift(): {
  orphan_repo_count: number;
  orphan_drift: boolean;
  orphan_drift_missed_pids: number[];
} {
  const orphans = listOrphanRepoDevProcesses();
  const e2eToolPids = listE2eToolPidsOnPorts().filter((pid) => {
    if (process.platform !== 'win32') return true;
    try {
      const raw = execSync(
        `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\").CommandLine"`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5_000 },
      ).trim();
      return isE2eToolCommandLine(raw);
    } catch {
      return false;
    }
  });

  const drift = detectOrphanListingDrift(
    orphans.length,
    e2eToolPids,
    new Set(orphans.map((orphan) => orphan.pid)),
  );

  return {
    orphan_repo_count: orphans.length,
    orphan_drift: drift.drift_detected,
    orphan_drift_missed_pids: drift.missed_pids,
  };
}

function buildDiagnosisRecord(
  runtime: RuntimeProcessSnapshot,
  maxContext: ReturnType<typeof resolveMaxContextStatus>,
  gateStatus: GateDiagnosisStatus,
  createdAt: Date,
): GateDiagnosisRecord {
  const orphan = collectOrphanDrift();
  const dominant = dominantRamConsumer(runtime.cursor_core_mb, runtime.claude_desktop_mb);
  const highReasons = buildHighReasons({
    cursor_core_mb: runtime.cursor_core_mb,
    claude_desktop_mb: runtime.claude_desktop_mb,
    ram_free_mb: runtime.ram_free_mb,
    orphan_drift: orphan.orphan_drift,
    orphan_repo_count: orphan.orphan_repo_count,
  });
  const medReasons =
    runtime.tsserver_mb >= MED_TSSERVER_MB ? [`tsserver_mb>=${MED_TSSERVER_MB}`] : [];
  const argvAudit = auditCursorArgv();
  const lowReasons = argvAudit.ok ? [] : ['argv_render_drift'];

  let severity = classifySeverity(highReasons, runtime.tsserver_mb);
  if (severity === 'none' && medReasons.length > 0) severity = 'MED';
  if (severity === 'none' && lowReasons.length > 0) severity = 'LOW';

  const evidencePath = maxContextEvidencePath();
  return {
    gate_status: gateStatus,
    created_at: createdAt.toISOString(),
    platform: process.platform,
    cursor_core_mb: runtime.cursor_core_mb,
    extension_host_mb: runtime.extension_host_mb,
    tsserver_mb: runtime.tsserver_mb,
    claude_desktop_mb: runtime.claude_desktop_mb,
    claude_desktop_count: runtime.claude_desktop_count,
    ram_total_mb: runtime.ram_total_mb,
    ram_free_mb: runtime.ram_free_mb,
    dominant_ram_consumer: dominant,
    high_reasons: highReasons,
    severity,
    orphan_repo_count: orphan.orphan_repo_count,
    orphan_drift: orphan.orphan_drift,
    orphan_drift_missed_pids: orphan.orphan_drift_missed_pids,
    max_context_status: maxContext.status,
    max_context: maxContext.max_context,
    max_context_source: maxContext.source,
    max_context_evidence_path: existsSync(evidencePath) ? evidencePath : null,
    med_reasons: medReasons,
    low_reasons: lowReasons,
    argv_ok: argvAudit.ok,
  };
}

function writeDiagnosisFile(record: GateDiagnosisRecord, createdAt: Date): string {
  const dir = perfArtifactsDir();
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, diagnosisFilename(createdAt));
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return filePath;
}

export function runGateDiagnosis(options?: {
  attestMaxContext?: MaxContextValue | null;
}): GateDiagnosisRunResult {
  const createdAt = new Date();
  const runtime =
    process.platform === 'win32' ? readWindowsRuntimeSnapshot() : emptyRuntimeSnapshot();

  if (process.platform !== 'win32') {
    const claudeStats = sumClaudeDesktopRssMb([] as WinProcessRow[]);
    runtime.claude_desktop_mb = claudeStats.mb;
    runtime.claude_desktop_count = claudeStats.count;
  }

  const maxContext = resolveMaxContextStatus({
    attestMaxContext: options?.attestMaxContext ?? null,
  });

  if (
    options?.attestMaxContext === '6k' &&
    maxContext.status === 'pass' &&
    maxContext.source === 'attest'
  ) {
    writeMaxContextEvidence({
      max_context: '6k',
      verified_at: createdAt.toISOString(),
      method: 'cli-attest',
      ttl_days: 7,
    } satisfies MaxContextEvidence);
  }

  if (maxContext.status === 'fail') {
    return {
      exit: 1,
      gate_status: 'fail',
      diagnosis: null,
      diagnosis_path: null,
      summary_line: null,
    };
  }

  const gateStatus: GateDiagnosisStatus = maxContext.status === 'pass' ? 'pass' : 'ambiguous';
  const diagnosis = buildDiagnosisRecord(runtime, maxContext, gateStatus, createdAt);
  const diagnosisPath = writeDiagnosisFile(diagnosis, createdAt);
  const summaryLine = formatGateDiagnosisSummaryLine(diagnosis);

  return {
    exit: gateStatus === 'pass' ? 0 : 2,
    gate_status: gateStatus,
    diagnosis,
    diagnosis_path: diagnosisPath,
    summary_line: summaryLine,
  };
}

export function parseAttestMaxContextArg(argv: readonly string[]): MaxContextValue | null {
  const match = argv.find((arg) => arg.startsWith('--attest-max-context='));
  if (!match) return null;
  const value = match.slice('--attest-max-context='.length).trim().toLowerCase();
  return value === '6k' ? '6k' : null;
}

/** For tests — settings/evidence resolution without side effects. */
export function inspectMaxContextForTests(): {
  settings: MaxContextValue | null;
  evidence: MaxContextEvidence | null;
  evidence_valid: boolean;
} {
  const evidence = readMaxContextEvidence();
  return {
    settings: readMaxContextFromSettings(),
    evidence,
    evidence_valid: evidence ? isEvidenceValid(evidence) : false,
  };
}

export const GATE_DIAGNOSIS_REPO_ROOT = REPO_ROOT;
