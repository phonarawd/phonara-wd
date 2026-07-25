import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CURSOR_ARCHIVAL_DIR_PATTERNS,
  CURSOR_ARCHIVAL_DOC_GLOB_PREFIXES,
  CURSOR_ARCHIVAL_DOC_PATHS,
  CURSORIGNORE_REQUIRED_PATTERNS,
  EPHEMERAL_AUTH_PATHS,
  SESSION_RESIDUE_DIRS,
  VSCODE_WATCHER_EXCLUDE_REQUIRED,
  WORKSPACE_ROOTS,
} from './lib/workspace-artifacts';

const violations: string[] = [];

// Keep VS Code watcher/search excludes aligned with CURSOR_ARCHIVAL_DOC_PATHS.
execSync('tsx scripts/sync-cursor-archival-excludes.ts', { stdio: 'pipe' });

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
  requirePatternsInFile('.cursorignore', '.cursorignore', CURSOR_ARCHIVAL_DOC_PATHS);
  requirePatternsInFile('.cursorignore', '.cursorignore', CURSOR_ARCHIVAL_DIR_PATTERNS);
  requirePatternsInFile('.cursorignore', '.cursorignore', CURSOR_ARCHIVAL_DOC_GLOB_PREFIXES);
}

function checkVscodeArchivalWatcherExclude() {
  const raw = readText('.vscode/settings.json');
  if (!raw) return;
  try {
    const settings = JSON.parse(raw) as {
      files?: { watcherExclude?: Record<string, boolean> };
      search?: { exclude?: Record<string, boolean> };
    };
    const watcher = settings.files?.watcherExclude ?? {};
    const search = settings.search?.exclude ?? {};
    for (const docPath of CURSOR_ARCHIVAL_DOC_PATHS) {
      const watcherKey = `**/${docPath.replace(/\\/g, '/')}`;
      if (!watcher[watcherKey]) {
        violations.push(`.vscode/settings.json files.watcherExclude missing: ${watcherKey}`);
      }
      if (!search[watcherKey]) {
        violations.push(`.vscode/settings.json search.exclude missing: ${watcherKey}`);
      }
    }
    for (const dirPattern of CURSOR_ARCHIVAL_DIR_PATTERNS) {
      const normalized = dirPattern.replace(/\\/g, '/').replace(/\/$/, '');
      const watcherKey = `**/${normalized}/**`;
      if (!watcher[watcherKey]) {
        violations.push(`.vscode/settings.json files.watcherExclude missing: ${watcherKey}`);
      }
      if (!search[watcherKey]) {
        violations.push(`.vscode/settings.json search.exclude missing: ${watcherKey}`);
      }
    }
  } catch {
    violations.push('.vscode/settings.json is not valid JSON');
  }
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

function checkPlanMarkdownlintExclusion() {
  requirePatternsInFile('.markdownlint-cli2.yaml', '.markdownlint-cli2.yaml', ['**/*.plan.md']);
  requirePatternsInFile('.markdownlintignore', '.markdownlintignore', ['**/*.plan.md']);
  if (!existsSync('scripts/templates/cursor-plans.markdownlint-cli2.jsonc')) {
    violations.push('Missing scripts/templates/cursor-plans.markdownlint-cli2.jsonc');
  }
  if (!existsSync('scripts/ensure-cursor-plans-markdownlint.ts')) {
    violations.push('Missing scripts/ensure-cursor-plans-markdownlint.ts');
  }
  const vscode = readText('.vscode/settings.json');
  if (vscode && !vscode.includes('!**/*.plan.md')) {
    violations.push('.vscode/settings.json markdownlint.lintWorkspaceGlobs missing !**/*.plan.md');
  }
}

checkCursorignore();
checkVscodeWatcherExclude();
checkVscodeArchivalWatcherExclude();
checkCleanArtifactsSync();
checkSessionResidue();
checkWorkspaceRoots();
checkPlanMarkdownlintExclusion();

if (violations.length > 0) {
  process.stderr.write(
    `Workspace hygiene gate failed (${violations.length} issue(s)):\n` +
      violations.map((v) => `  - ${v}`).join('\n') +
      '\n\nSee .cursor/rules/75-workspace-hygiene.mdc and 76-cursor-performance.mdc.\n',
  );
  process.exit(1);
}

process.stdout.write(
  'check:hygiene OK — cursorignore, watcher excludes, plan markdownlint exclude, and session residue clean\n',
);
