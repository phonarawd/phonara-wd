import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeCursorArgv } from './cursor-argv';
import { formatScheduleObserveStatusLine, schedulePerfObserveTasks } from './schedule-observe-core';
import { ensureObserveWindowStart, recordArgvAbObserveEntry } from './tsserver-observe-core';
import {
  applyColdStartUserSettings,
  mergeSettingsRecord,
  PHONARA_COLD_START_USER_SETTINGS,
  PHONARA_COLD_START_WORKSPACE_SETTINGS,
  cursorUserSettingsPath,
} from './cursor-cold-start-settings';
import {
  formatGateDiagnosisSummaryLine,
  parseAttestMaxContextArg,
  runGateDiagnosis,
} from './gate-diagnosis-core';
import { parseForceGatePhase0Arg, runGatePhase0 } from './gate-phase0-core';
import {
  findLatestDiagnosisFilename,
  findLatestRemediationFilename,
  parseConfirmHighRemediationArg,
  readDiagnosisByFilename,
  readRemediationByFilename,
  runHighRemediation,
} from './high-remediation-core';
import { perfArtifactsDir } from './max-context-evidence';
import { parseMigrationsLock } from './parse-migrations-lock';

export const PERF_ROLLOUT_BASE_STEP_IDS = [
  'gate-diagnosis',
  'gate-phase0',
  'high-remediation',
  'sync-excludes',
  'hygiene',
  'global-settings',
  'standby-test',
] as const;

export const PERF_ROLLOUT_OPT_IN_STEP_IDS = [
  'argv-ab',
  'settings-tsserver-trial',
  'schedule-observe',
] as const;

export const PERF_ROLLOUT_SUMMARY_STEP_ID = 'summary' as const;

export type PerfRolloutBaseStepId = (typeof PERF_ROLLOUT_BASE_STEP_IDS)[number];
export type PerfRolloutOptInStepId = (typeof PERF_ROLLOUT_OPT_IN_STEP_IDS)[number];
export type PerfRolloutStepId =
  | PerfRolloutBaseStepId
  | PerfRolloutOptInStepId
  | typeof PERF_ROLLOUT_SUMMARY_STEP_ID;

export interface RolloutEvidenceEntry {
  step: PerfRolloutStepId;
  ts: string;
}

export interface PerfRolloutRunResult {
  exit: 0 | 1 | 2;
  stopped_at: PerfRolloutStepId | null;
  completed_steps: PerfRolloutStepId[];
  summary_line: string | null;
  message: string;
}

export type PerfRolloutStepRunner = (context: PerfRolloutRunContext) => PerfRolloutStepOutcome;

export interface PerfRolloutRunContext {
  argv: readonly string[];
  includeTsserverTuning: boolean;
  confirmHighRemediation: boolean;
  diagnosisFilename: string | null;
  evidencePath: string;
}

export interface PerfRolloutStepOutcome {
  exit: 0 | 1 | 2;
  message: string;
  diagnosisFilename?: string | null;
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TSSERVER_SETTING_KEYS = new Set([
  'typescript.tsserver.maxTsServerMemory',
  'typescript.tsserver.useSeparateSyntaxServer',
]);

export function rolloutEvidencePath(): string {
  return path.join(perfArtifactsDir(), 'rollout-evidence.jsonl');
}

export function parseIncludeTsserverTuningArg(argv: readonly string[]): boolean {
  return argv.includes('--include-tsserver-tuning');
}

export function parseFromStepArg(argv: readonly string[]): PerfRolloutStepId | null {
  const match = argv.find((arg) => arg.startsWith('--from='));
  if (!match) return null;
  const value = match.slice('--from='.length).trim();
  const allKnown = new Set<PerfRolloutStepId>([
    ...PERF_ROLLOUT_BASE_STEP_IDS,
    ...PERF_ROLLOUT_OPT_IN_STEP_IDS,
    PERF_ROLLOUT_SUMMARY_STEP_ID,
  ]);
  return allKnown.has(value as PerfRolloutStepId) ? (value as PerfRolloutStepId) : null;
}

export function buildPerfRolloutStepOrder(options?: {
  includeTsserverTuning?: boolean;
}): PerfRolloutStepId[] {
  const includeTsserverTuning = options?.includeTsserverTuning ?? false;
  const steps: PerfRolloutStepId[] = [...PERF_ROLLOUT_BASE_STEP_IDS];
  if (includeTsserverTuning) {
    steps.push(...PERF_ROLLOUT_OPT_IN_STEP_IDS);
  }
  steps.push(PERF_ROLLOUT_SUMMARY_STEP_ID);
  return steps;
}

export function readRolloutEvidenceEntries(
  filePath: string = rolloutEvidencePath(),
): RolloutEvidenceEntry[] {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const entries: RolloutEvidenceEntry[] = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line) as RolloutEvidenceEntry);
    } catch {
      // skip malformed lines
    }
  }
  return entries;
}

export function appendRolloutEvidence(
  step: PerfRolloutStepId,
  createdAt: Date = new Date(),
  filePath: string = rolloutEvidencePath(),
): string {
  const dir = perfArtifactsDir();
  mkdirSync(dir, { recursive: true });
  const entry: RolloutEvidenceEntry = { step, ts: createdAt.toISOString() };
  appendFileSync(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
  return entry.ts;
}

export function evidenceTimestamp(
  step: PerfRolloutStepId,
  entries: readonly RolloutEvidenceEntry[],
): string | null {
  const matches = entries.filter((entry) => entry.step === step);
  return matches.length > 0 ? matches[matches.length - 1]!.ts : null;
}

export function assertDiagnosisBeforeTsserverTrial(
  entries: readonly RolloutEvidenceEntry[],
  includeTsserverTuning: boolean,
): { ok: true } | { ok: false; reason: string } {
  if (!includeTsserverTuning) return { ok: true };

  const diagnosisTs = evidenceTimestamp('gate-diagnosis', entries);
  const trialTs = evidenceTimestamp('settings-tsserver-trial', entries);
  if (!trialTs) return { ok: true };
  if (!diagnosisTs) {
    return {
      ok: false,
      reason: 'settings-tsserver-trial recorded without gate-diagnosis evidence',
    };
  }
  if (Date.parse(diagnosisTs) >= Date.parse(trialTs)) {
    return {
      ok: false,
      reason: `gate-diagnosis (${diagnosisTs}) must precede settings-tsserver-trial (${trialTs})`,
    };
  }
  return { ok: true };
}

function coldStartUserSettingsWithoutTsserver(): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(PHONARA_COLD_START_USER_SETTINGS).filter(
      ([key]) => !TSSERVER_SETTING_KEYS.has(key),
    ),
  );
}

function applyGlobalSettingsWithoutArgvOrTsserver(): { changed: number; path: string } {
  const patch = coldStartUserSettingsWithoutTsserver();
  const filePath = cursorUserSettingsPath();
  const current = existsSync(filePath)
    ? (JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>)
    : {};
  const { next, changed } = mergeSettingsRecord(current, patch);
  if (changed > 0) {
    writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  }

  let workspaceChanged = 0;
  const workspacePath = path.join(REPO_ROOT, '.vscode', 'settings.json');
  if (existsSync(workspacePath)) {
    const workspace = JSON.parse(readFileSync(workspacePath, 'utf8')) as Record<string, unknown>;
    const workspaceMerge = mergeSettingsRecord(workspace, PHONARA_COLD_START_WORKSPACE_SETTINGS);
    if (workspaceMerge.changed > 0) {
      writeFileSync(workspacePath, `${JSON.stringify(workspaceMerge.next, null, 2)}\n`, 'utf8');
      workspaceChanged = workspaceMerge.changed;
    }
  }

  return { changed: changed + workspaceChanged, path: filePath };
}

function applyTsserverTrialSettings(): { changed: number; path: string } {
  const patch = Object.fromEntries(
    Object.entries(PHONARA_COLD_START_USER_SETTINGS).filter(([key]) =>
      TSSERVER_SETTING_KEYS.has(key),
    ),
  );
  const filePath = cursorUserSettingsPath();
  if (!existsSync(filePath)) {
    applyColdStartUserSettings();
  }
  const current = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  const { next, changed } = mergeSettingsRecord(current, patch);
  if (changed > 0) {
    writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  }
  return { changed, path: filePath };
}

function execRepoScript(scriptRelativePath: string): void {
  const scriptPath = path.join(REPO_ROOT, scriptRelativePath);
  execSync(`tsx "${scriptPath}"`, { cwd: REPO_ROOT, stdio: 'inherit', timeout: 300_000 });
}

export const defaultPerfRolloutStepRunners: Record<PerfRolloutStepId, PerfRolloutStepRunner> = {
  'gate-diagnosis': (context) => {
    const result = runGateDiagnosis({
      attestMaxContext: parseAttestMaxContextArg([...context.argv]),
    });
    const diagnosisFilename = result.diagnosis_path ? path.basename(result.diagnosis_path) : null;
    return {
      exit: result.exit,
      message: `gate-diagnosis ${result.gate_status}`,
      diagnosisFilename,
    };
  },
  'gate-phase0': (context) => {
    const result = runGatePhase0({
      forceGatePhase0: parseForceGatePhase0Arg([...context.argv]),
      diagnosisFilename: context.diagnosisFilename,
    });
    return { exit: result.exit, message: result.message };
  },
  'high-remediation': (context) => {
    const result = runHighRemediation({
      confirmHighRemediation: context.confirmHighRemediation,
      diagnosisFilename: context.diagnosisFilename,
    });
    return { exit: result.exit, message: result.message };
  },
  'sync-excludes': () => {
    execRepoScript('scripts/sync-cursor-archival-excludes.ts');
    return { exit: 0, message: 'sync-excludes applied' };
  },
  hygiene: () => {
    execRepoScript('scripts/check-workspace-hygiene.ts');
    return { exit: 0, message: 'hygiene green' };
  },
  'global-settings': () => {
    const applied = applyGlobalSettingsWithoutArgvOrTsserver();
    return {
      exit: 0,
      message: `global-settings merged ${applied.changed} user key(s) (argv/tsserver excluded)`,
    };
  },
  'standby-test': () => {
    execRepoScript('scripts/cursor-standby-test.ts');
    return {
      exit: 0,
      message: 'standby-failure-cases green (exe_missing · permission_denied · 8s hang)',
    };
  },
  'argv-ab': () => {
    const result = mergeCursorArgv({ apply: true });
    const ts_at = new Date().toISOString();
    recordArgvAbObserveEntry(ts_at);
    const restartHint = result.applied ? ' · RESTART_CURSOR_REQUIRED (argv.json merged)' : '';
    return {
      exit: result.ok || result.applied ? 0 : 1,
      message: `argv-ab ${result.applied ? 'applied' : 'already ok'}${restartHint}`,
    };
  },
  'settings-tsserver-trial': () => {
    const applied = applyTsserverTrialSettings();
    const window = ensureObserveWindowStart();
    return {
      exit: 0,
      message: `settings-tsserver-trial merged ${applied.changed} tsserver key(s) · window=${window.windowStart}${window.started ? '' : ' (existing)'}`,
    };
  },
  'schedule-observe': () => {
    const scheduled = schedulePerfObserveTasks();
    return {
      exit: 0,
      message: formatScheduleObserveStatusLine(scheduled),
    };
  },
  summary: (context) => {
    const diagnosisRef =
      context.diagnosisFilename ?? findLatestDiagnosisFilename({ preferPass: true });
    if (!diagnosisRef) {
      return { exit: 1, message: 'summary blocked — no PASS diagnosis file' };
    }

    const diagnosis = readDiagnosisByFilename(diagnosisRef);
    if (!diagnosis || diagnosis.gate_status !== 'pass') {
      return { exit: 1, message: 'summary blocked — latest diagnosis is not PASS' };
    }

    const entries = readRolloutEvidenceEntries(context.evidencePath);
    const timestampAssert = assertDiagnosisBeforeTsserverTrial(
      entries,
      context.includeTsserverTuning,
    );
    if (!timestampAssert.ok) {
      return { exit: 1, message: `summary evidence assert failed — ${timestampAssert.reason}` };
    }

    const lock = parseMigrationsLock({ repoRoot: REPO_ROOT });
    if (
      lock.status === 'drift' ||
      lock.status === 'parse_error' ||
      lock.status === 'missing_lock'
    ) {
      return {
        exit: 1,
        message: `summary blocked — migrations lock ${lock.status}`,
      };
    }

    const remediationRef = findLatestRemediationFilename();
    if (!remediationRef) {
      return {
        exit: 1,
        message: 'summary blocked — no remediation file (run high-remediation first)',
      };
    }

    const remediation = readRemediationByFilename(remediationRef);
    if (!remediation) {
      return { exit: 1, message: `summary blocked — remediation unreadable: ${remediationRef}` };
    }

    if (remediation.diagnosis_ref !== diagnosisRef) {
      return {
        exit: 1,
        message: `summary blocked — remediation diagnosis_ref mismatch (${remediation.diagnosis_ref} vs ${diagnosisRef})`,
      };
    }

    const remediationMode = remediation.remediation_executed ? 'executed' : 'dry-run';
    return {
      exit: 0,
      message: `${formatGateDiagnosisSummaryLine(diagnosis)} · remediation=${remediationMode}`,
    };
  },
};

export function runPerfRollout(options?: {
  argv?: readonly string[];
  includeTsserverTuning?: boolean;
  fromStep?: PerfRolloutStepId | null;
  stepRunners?: Partial<Record<PerfRolloutStepId, PerfRolloutStepRunner>>;
  evidencePath?: string;
  skipEvidenceAppend?: boolean;
}): PerfRolloutRunResult {
  const argv = options?.argv ?? process.argv.slice(2);
  const includeTsserverTuning =
    options?.includeTsserverTuning ?? parseIncludeTsserverTuningArg(argv);
  const fromStep = options?.fromStep ?? parseFromStepArg(argv);
  const confirmHighRemediation = parseConfirmHighRemediationArg(argv);
  const evidencePath = options?.evidencePath ?? rolloutEvidencePath();
  const skipEvidenceAppend = options?.skipEvidenceAppend ?? false;

  const steps = buildPerfRolloutStepOrder({ includeTsserverTuning });
  const startIndex = fromStep ? Math.max(0, steps.indexOf(fromStep)) : 0;
  const runners = { ...defaultPerfRolloutStepRunners, ...options?.stepRunners };

  const context: PerfRolloutRunContext = {
    argv,
    includeTsserverTuning,
    confirmHighRemediation,
    diagnosisFilename: findLatestDiagnosisFilename({ preferPass: true }),
    evidencePath,
  };

  const completedSteps: PerfRolloutStepId[] = [];
  let summaryLine: string | null = null;

  for (let index = startIndex; index < steps.length; index += 1) {
    const stepId = steps[index]!;
    const runner = runners[stepId];
    if (!runner) {
      return {
        exit: 1,
        stopped_at: stepId,
        completed_steps: completedSteps,
        summary_line: null,
        message: `missing runner for step ${stepId}`,
      };
    }

    const outcome = runner(context);
    if (outcome.diagnosisFilename !== undefined) {
      context.diagnosisFilename = outcome.diagnosisFilename;
    }

    if (outcome.exit !== 0) {
      return {
        exit: outcome.exit,
        stopped_at: stepId,
        completed_steps: completedSteps,
        summary_line: null,
        message: outcome.message,
      };
    }

    if (!skipEvidenceAppend && stepId !== PERF_ROLLOUT_SUMMARY_STEP_ID) {
      appendRolloutEvidence(stepId, new Date(), evidencePath);
    }

    completedSteps.push(stepId);

    if (stepId === PERF_ROLLOUT_SUMMARY_STEP_ID) {
      summaryLine = outcome.message;
    }
  }

  return {
    exit: 0,
    stopped_at: null,
    completed_steps: completedSteps,
    summary_line: summaryLine,
    message: summaryLine ?? 'perf-rollout complete',
  };
}

export const PERF_ROLLOUT_REPO_ROOT = REPO_ROOT;
