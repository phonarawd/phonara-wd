import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const rootTargets = [
  '.turbo',
  '.vite',
  'blob-report',
  'coverage',
  'playwright-report',
  'test-results',
  'supabase/.temp',
  'supabase/.branches',
];

const ephemeralAuthPatterns = [
  'tests/e2e/.auth.json',
  'tests/e2e/.admin-auth.json',
];

const workspaceArtifactNames = [
  '.turbo',
  '.vite',
  'build',
  'coverage',
  'dist',
  'node_modules/.cache',
  'node_modules/.vite',
  'playwright-report',
  'test-results',
  'tsconfig.tsbuildinfo',
  'tsconfig.app.tsbuildinfo',
  'tsconfig.node.tsbuildinfo',
];

const workspaceRoots = ['apps', 'packages'];

function workspaceTargets() {
  return workspaceRoots.flatMap((root) => {
    if (!existsSync(root)) {
      return [];
    }

    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) =>
        workspaceArtifactNames.map((artifact) => join(root, entry.name, artifact)),
      );
  });
}

/** Playwright leaves nested artifact dirs under test-results between runs. */
function playwrightArtifactDirs() {
  const base = 'test-results';
  if (!existsSync(base)) {
    return [];
  }
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('.playwright-artifacts'))
    .map((entry) => join(base, entry.name));
}

const targets = [
  ...rootTargets,
  ...workspaceTargets(),
  ...ephemeralAuthPatterns,
  ...playwrightArtifactDirs(),
];

let removed = 0;
for (const target of targets) {
  if (!existsSync(target)) {
    continue;
  }
  rmSync(target, { recursive: true, force: true });
  removed += 1;
}

if (removed > 0) {
  console.log(`clean:artifacts removed ${removed} path(s)`);
}
