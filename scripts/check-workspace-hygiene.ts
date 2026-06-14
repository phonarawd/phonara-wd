import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CURSORIGNORE_REQUIRED_PATTERNS,
  EPHEMERAL_AUTH_PATHS,
  SESSION_RESIDUE_DIRS,
  VSCODE_WATCHER_EXCLUDE_REQUIRED,
  WORKSPACE_ROOTS,
} from './lib/workspace-artifacts';

const violations: string[] = [];

function readText(path: string): string {
  if (!existsSync(path)) {
    violations.push(`Missing required file: ${path}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function requirePatternsInFile(file: string, label: string, patterns: readonly string[]) {
  const text = readText(file);
  if (!text) return;
  for (const pattern of patterns) {
    if (!text.includes(pattern)) {
      violations.push(`${label} missing pattern: ${pattern}`);
    }
  }
}

function checkCursorignore() {
  requirePatternsInFile('.cursorignore', '.cursorignore', CURSORIGNORE_REQUIRED_PATTERNS);
}

function checkVscodeWatcherExclude() {
  const raw = readText('.vscode/settings.json');
  if (!raw) return;
  try {
    const settings = JSON.parse(raw) as {
      files?: { watcherExclude?: Record<string, boolean> };
    };
    const exclude = settings.files?.watcherExclude ?? {};
    for (const key of VSCODE_WATCHER_EXCLUDE_REQUIRED) {
      if (!exclude[key]) {
        violations.push(`.vscode/settings.json files.watcherExclude missing: ${key}`);
      }
    }
  } catch {
    violations.push('.vscode/settings.json is not valid JSON');
  }
}

function checkCleanArtifactsSync() {
  const cleanScript = readText('scripts/clean-artifacts.ts');
  if (!cleanScript) return;
  if (!cleanScript.includes('workspace-artifacts')) {
    violations.push('scripts/clean-artifacts.ts must import from ./lib/workspace-artifacts');
    return;
  }
  const requiredSymbols = [
    'ROOT_ARTIFACT_DIRS',
    'ROOT_ARTIFACT_FILES',
    'WORKSPACE_ARTIFACT_NAMES',
    'EPHEMERAL_AUTH_PATHS',
    'CURSOR_EPHEMERAL_PATHS',
    'WORKSPACE_ROOTS',
  ];
  for (const symbol of requiredSymbols) {
    if (!cleanScript.includes(symbol)) {
      violations.push(`scripts/clean-artifacts.ts must use ${symbol} from workspace-artifacts`);
    }
  }
}

function checkSessionResidue() {
  for (const dir of SESSION_RESIDUE_DIRS) {
    if (existsSync(dir)) {
      violations.push(`Session residue present: ${dir}/ (run bun run clean)`);
    }
  }

  const testResults = 'test-results';
  if (existsSync(testResults)) {
    for (const entry of readdirSync(testResults, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith('.playwright-artifacts')) {
        violations.push(
          `Session residue present: ${join(testResults, entry.name)}/ (run bun run clean)`,
        );
      }
    }
  }

  for (const authPath of EPHEMERAL_AUTH_PATHS) {
    if (existsSync(authPath)) {
      violations.push(`E2E auth token file present: ${authPath} (run bun run clean)`);
    }
  }
}

function checkWorkspaceRoots() {
  for (const root of WORKSPACE_ROOTS) {
    if (!existsSync(root)) continue;
    for (const workspace of readdirSync(root, { withFileTypes: true })) {
      if (!workspace.isDirectory()) continue;
      for (const artifact of ['playwright-report', 'test-results', 'coverage']) {
        const path = join(root, workspace.name, artifact);
        if (existsSync(path)) {
          violations.push(`Session residue present: ${path}/ (run bun run clean)`);
        }
      }
    }
  }
}

checkCursorignore();
checkVscodeWatcherExclude();
checkCleanArtifactsSync();
checkSessionResidue();
checkWorkspaceRoots();

if (violations.length > 0) {
  process.stderr.write(
    `Workspace hygiene gate failed (${violations.length} issue(s)):\n` +
      violations.map((v) => `  - ${v}`).join('\n') +
      '\n\nSee .cursor/rules/75-workspace-hygiene.mdc and 76-cursor-performance.mdc.\n',
  );
  process.exit(1);
}

process.stdout.write('check:hygiene OK — cursorignore, watcher excludes, and session residue clean\n');
