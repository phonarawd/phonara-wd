/**
 * One-shot emergency reset for Cursor lag / stuck terminals (low-spec safe).
 * Inlines hygiene steps — no nested `bun run` chains that can deadlock.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { killOrphanRepoDevProcesses, listOrphanRepoDevProcesses } from './lib/cursor-dev-processes';
import { killE2ePortListeners, E2E_PORTS } from './lib/e2e-lifecycle';
import {
  EPHEMERAL_AUTH_PATHS,
  CURSOR_EPHEMERAL_PATHS,
  ROOT_ARTIFACT_DIRS,
  ROOT_ARTIFACT_FILES,
  WORKSPACE_ARTIFACT_NAMES,
  WORKSPACE_ROOTS,
} from './lib/workspace-artifacts';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

function cleanArtifacts(): number {
  let removed = 0;
  const targets: string[] = [
    ...ROOT_ARTIFACT_DIRS,
    ...ROOT_ARTIFACT_FILES,
    ...EPHEMERAL_AUTH_PATHS,
    ...CURSOR_EPHEMERAL_PATHS,
  ];

  for (const root of WORKSPACE_ROOTS) {
    const rootPath = path.join(REPO_ROOT, root);
    if (!existsSync(rootPath)) continue;
    for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const artifact of WORKSPACE_ARTIFACT_NAMES) {
        targets.push(path.join(rootPath, entry.name, artifact));
      }
    }
  }

  const testResults = path.join(REPO_ROOT, 'test-results');
  if (existsSync(testResults)) {
    for (const entry of readdirSync(testResults, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith('.playwright-artifacts')) {
        targets.push(path.join(testResults, entry.name));
      }
    }
  }

  for (const target of targets) {
    const absolute = path.isAbsolute(target) ? target : path.join(REPO_ROOT, target);
    if (!existsSync(absolute)) continue;
    rmSync(absolute, { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

function portStatus(): string {
  const lines: string[] = [];
  for (const port of E2E_PORTS) {
    try {
      const out = execSync('netstat -ano', { encoding: 'utf8' });
      const busy = out.split('\n').some((line) => line.includes('LISTENING') && line.includes(`:${port} `));
      lines.push(`  ${port}: ${busy ? 'BUSY' : 'free'}`);
    } catch {
      lines.push(`  ${port}: unknown`);
    }
  }
  return lines.join('\n');
}

const orphansBefore = listOrphanRepoDevProcesses();
process.stdout.write(`[cursor:emergency-reset] orphans before: ${orphansBefore.length}\n`);
for (const orphan of orphansBefore.slice(0, 8)) {
  process.stdout.write(`  pid=${orphan.pid} ${orphan.commandLine.slice(0, 120)}\n`);
}
if (orphansBefore.length > 8) {
  process.stdout.write(`  … +${orphansBefore.length - 8} more\n`);
}

const killed = killOrphanRepoDevProcesses();
const ports = killE2ePortListeners();
const cleaned = cleanArtifacts();

process.stdout.write(`[cursor:emergency-reset] killed ${killed} orphan(s), freed ${ports} port listener(s), cleaned ${cleaned} artifact path(s)\n`);
process.stdout.write(`[cursor:emergency-reset] E2E ports:\n${portStatus()}\n`);
process.stdout.write('[cursor:emergency-reset] done — restart Cursor if UI still lags\n');
