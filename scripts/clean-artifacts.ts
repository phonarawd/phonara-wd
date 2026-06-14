import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  EPHEMERAL_AUTH_PATHS,
  CURSOR_EPHEMERAL_PATHS,
  ROOT_ARTIFACT_DIRS,
  ROOT_ARTIFACT_FILES,
  WORKSPACE_ARTIFACT_NAMES,
  WORKSPACE_ROOTS,
} from './lib/workspace-artifacts';

function workspaceTargets() {
  return WORKSPACE_ROOTS.flatMap((root) => {
    if (!existsSync(root)) {
      return [];
    }

    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) =>
        WORKSPACE_ARTIFACT_NAMES.map((artifact) => join(root, entry.name, artifact)),
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
  ...ROOT_ARTIFACT_DIRS,
  ...workspaceTargets(),
  ...EPHEMERAL_AUTH_PATHS,
  ...CURSOR_EPHEMERAL_PATHS,
  ...playwrightArtifactDirs(),
  ...ROOT_ARTIFACT_FILES,
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
