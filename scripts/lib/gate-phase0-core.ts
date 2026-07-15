import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findLatestDiagnosisFilename, readDiagnosisByFilename } from './high-remediation-core';
import { parseMigrationsLock } from './parse-migrations-lock';

export type GatePhase0Status = 'pass' | 'fail' | 'ambiguous';

export type GatePhase0FailReason =
  | 'DIAGNOSIS_MISSING'
  | 'DIAGNOSIS_NOT_PASS'
  | 'LOCK_DRIFT'
  | 'LOCK_PARSE_ERROR'
  | 'LOCK_MISSING'
  | 'SSOT_AMBIGUOUS'
  | 'SSOT_MISSING_CANNOT_FORCE';

export interface GatePhase0RunResult {
  exit: 0 | 1 | 2;
  gate_status: GatePhase0Status;
  diagnosis_ref: string | null;
  lock_ok: boolean;
  ssot_forced: boolean;
  message: string;
  reason: GatePhase0FailReason | null;
  ssot_ambiguous_reasons: string[];
}

export const ACTIVE_WORK_SSOT_REL = 'docs/SSOT/ACTIVE_WORK_SSOT.md';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function parseForceGatePhase0Arg(argv: readonly string[]): boolean {
  return argv.includes('--force-gate-phase0');
}

export function activeWorkSsotPath(repoRoot: string = REPO_ROOT): string {
  return path.join(repoRoot, ACTIVE_WORK_SSOT_REL);
}

export type SsotHeuristicResult =
  | { status: 'ok' }
  | { status: 'missing' }
  | { status: 'ambiguous'; reasons: string[] };

/** Secondary heuristic — lock parity from parseMigrationsLock() is always primary. */
export function evaluateActiveWorkSsotHeuristic(repoRoot: string = REPO_ROOT): SsotHeuristicResult {
  const ssotPath = activeWorkSsotPath(repoRoot);
  if (!existsSync(ssotPath)) {
    return { status: 'missing' };
  }

  let text: string;
  try {
    text = readFileSync(ssotPath, 'utf8');
  } catch {
    return { status: 'ambiguous', reasons: ['ACTIVE_WORK_SSOT unreadable'] };
  }

  const reasons: string[] = [];

  const engineClosed = /\|\s*\*\*Engine Apex\*\*[\s\S]*?\|\s*`\[x\]\s*FULLY CLOSED`/i.test(text);
  const demolitionDone = /\|\s*\*\*Phase D Demolition\*\*[\s\S]*?\|\s*`\[x\]\s*DONE`/i.test(text);

  if (!engineClosed) {
    if (/\|\s*\*\*Engine Apex\*\*/i.test(text)) {
      reasons.push('Engine Apex not clearly [x] FULLY CLOSED');
    } else {
      reasons.push('Engine Apex row not found in ACTIVE_WORK_SSOT');
    }
  }

  if (!demolitionDone) {
    if (/\|\s*\*\*Phase D Demolition\*\*/i.test(text)) {
      reasons.push('Phase D Demolition not clearly [x] DONE');
    } else {
      reasons.push('Phase D Demolition row not found in ACTIVE_WORK_SSOT');
    }
  }

  if (reasons.length > 0) {
    return { status: 'ambiguous', reasons };
  }

  return { status: 'ok' };
}

export function assertDiagnosisPrerequisite(options?: {
  diagnosisFilename?: string | null;
}):
  | { ok: true; diagnosis_ref: string }
  | { ok: false; reason: 'DIAGNOSIS_MISSING' | 'DIAGNOSIS_NOT_PASS' } {
  const diagnosisRef =
    options?.diagnosisFilename ?? findLatestDiagnosisFilename({ preferPass: true });

  if (!diagnosisRef) {
    return { ok: false, reason: 'DIAGNOSIS_MISSING' };
  }

  const diagnosis = readDiagnosisByFilename(diagnosisRef);
  if (!diagnosis || diagnosis.gate_status !== 'pass') {
    return { ok: false, reason: 'DIAGNOSIS_NOT_PASS' };
  }

  return { ok: true, diagnosis_ref: diagnosisRef };
}

export function runGatePhase0(options?: {
  forceGatePhase0?: boolean;
  diagnosisFilename?: string | null;
  repoRoot?: string;
}): GatePhase0RunResult {
  const repoRoot = options?.repoRoot ?? REPO_ROOT;
  const force = options?.forceGatePhase0 ?? false;

  const diagnosisGate = assertDiagnosisPrerequisite({
    diagnosisFilename: options?.diagnosisFilename,
  });

  if (!diagnosisGate.ok) {
    const reason = diagnosisGate.reason;
    const message =
      reason === 'DIAGNOSIS_MISSING'
        ? 'no PASS diagnosis file — run bun run cursor:gate-diagnosis first'
        : 'latest diagnosis is not PASS — resolve gate-diagnosis before gate-phase0';
    return {
      exit: 1,
      gate_status: 'fail',
      diagnosis_ref: null,
      lock_ok: false,
      ssot_forced: false,
      message,
      reason,
      ssot_ambiguous_reasons: [],
    };
  }

  const diagnosisRef = diagnosisGate.diagnosis_ref;

  // parseMigrationsLock() — single SOT; always runs (including --force-gate-phase0).
  const lock = parseMigrationsLock({ repoRoot });

  if (lock.status === 'parse_error') {
    return {
      exit: 1,
      gate_status: 'fail',
      diagnosis_ref: diagnosisRef,
      lock_ok: false,
      ssot_forced: false,
      message: `migrations lock parse error: ${lock.parse_error ?? 'unknown'}`,
      reason: 'LOCK_PARSE_ERROR',
      ssot_ambiguous_reasons: [],
    };
  }

  if (lock.status === 'missing_lock' || lock.status === 'drift') {
    const detail =
      lock.violations.length > 0 ? lock.violations.slice(0, 3).join('; ') : lock.status;
    return {
      exit: 1,
      gate_status: 'fail',
      diagnosis_ref: diagnosisRef,
      lock_ok: false,
      ssot_forced: false,
      message: `migrations lock drift (${lock.violation_count}): ${detail}`,
      reason: lock.status === 'missing_lock' ? 'LOCK_MISSING' : 'LOCK_DRIFT',
      ssot_ambiguous_reasons: [],
    };
  }

  if (force) {
    const ssotPath = activeWorkSsotPath(repoRoot);
    if (!existsSync(ssotPath)) {
      return {
        exit: 1,
        gate_status: 'fail',
        diagnosis_ref: diagnosisRef,
        lock_ok: true,
        ssot_forced: false,
        message: 'SSOT_MISSING_CANNOT_FORCE — ACTIVE_WORK_SSOT.md required for --force-gate-phase0',
        reason: 'SSOT_MISSING_CANNOT_FORCE',
        ssot_ambiguous_reasons: [],
      };
    }

    return {
      exit: 0,
      gate_status: 'pass',
      diagnosis_ref: diagnosisRef,
      lock_ok: true,
      ssot_forced: true,
      message: 'PASS (forced) — lock ok · SSOT heuristic bypassed by operator',
      reason: null,
      ssot_ambiguous_reasons: [],
    };
  }

  const ssot = evaluateActiveWorkSsotHeuristic(repoRoot);
  if (ssot.status === 'missing') {
    return {
      exit: 2,
      gate_status: 'ambiguous',
      diagnosis_ref: diagnosisRef,
      lock_ok: true,
      ssot_forced: false,
      message:
        'AMBIGUOUS — ACTIVE_WORK_SSOT.md missing; use --force-gate-phase0 after operator review',
      reason: 'SSOT_AMBIGUOUS',
      ssot_ambiguous_reasons: ['ACTIVE_WORK_SSOT missing'],
    };
  }

  if (ssot.status === 'ambiguous') {
    return {
      exit: 2,
      gate_status: 'ambiguous',
      diagnosis_ref: diagnosisRef,
      lock_ok: true,
      ssot_forced: false,
      message: `AMBIGUOUS — SSOT heuristic inconclusive: ${ssot.reasons.join('; ')}`,
      reason: 'SSOT_AMBIGUOUS',
      ssot_ambiguous_reasons: ssot.reasons,
    };
  }

  return {
    exit: 0,
    gate_status: 'pass',
    diagnosis_ref: diagnosisRef,
    lock_ok: true,
    ssot_forced: false,
    message: 'PASS — diagnosis ok · lock ok · SSOT ok',
    reason: null,
    ssot_ambiguous_reasons: [],
  };
}

export const GATE_PHASE0_REPO_ROOT = REPO_ROOT;
