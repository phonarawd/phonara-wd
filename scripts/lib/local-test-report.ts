import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const LOCAL_TEST_REPORT_PATH = path.join('gate-manifest', 'local-test-report.json');

export type LocalTestReport = {
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly status: 'running' | 'failed' | 'passed';
  readonly failedStepId: string | null;
  readonly failedStepLabel: string | null;
  readonly exitCode: number | null;
  readonly errorMessage: string | null;
  readonly completedSteps: string[];
  readonly remainingSteps: string[];
  readonly ramFreeMb: number;
  readonly resumeCommand: string;
};

export function ensureReportDir(): void {
  const dir = path.dirname(LOCAL_TEST_REPORT_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function writeLocalTestReport(report: LocalTestReport): void {
  ensureReportDir();
  writeFileSync(LOCAL_TEST_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

export function readLocalTestReport(): LocalTestReport | null {
  if (!existsSync(LOCAL_TEST_REPORT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(LOCAL_TEST_REPORT_PATH, 'utf8')) as LocalTestReport;
  } catch {
    return null;
  }
}

export function buildResumeCommand(stepId: string | null): string {
  if (!stepId) return 'bun run gate:local-autopilot';
  return `bun run gate:local-autopilot -- --from=${stepId}`;
}
