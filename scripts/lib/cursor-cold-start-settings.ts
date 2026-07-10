import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** User-level settings that shorten Cursor cold boot on 8GB Windows PCs. */
export const PHONARA_COLD_START_USER_SETTINGS: Record<string, unknown> = {
  'window.restoreWindows': 'one',
  'workbench.startupEditor': 'none',
  'workbench.localHistory.enabled': false,
  'workbench.editor.restoreViewState': false,
  'extensions.autoCheckUpdates': false,
  'extensions.autoUpdate': false,
  'search.followSymlinks': false,
  'search.maintainFileSearchCache': false,
  'git.autofetch': false,
  'git.autorefresh': false,
  'typescript.disableAutomaticTypeAcquisition': true,
  'typescript.tsserver.maxTsServerMemory': 512,
  'typescript.tsserver.useSeparateSyntaxServer': true,
  'files.watcherExclude': {
    '**/node_modules/**': true,
    '**/.bun/**': true,
    '**/.git/objects/**': true,
    '**/dist/**': true,
    '**/.vite/**': true,
    '**/test-results/**': true,
    '**/playwright-report/**': true,
    '**/packages/*/dist/**': true,
    '**/apps/*/dist/**': true,
    '**/.tmp/**': true,
    '**/_audit/**': true,
    '**/*.zip': true,
  },
};

/** Workspace-level cold-start settings (merged into .vscode/settings.json). */
export const PHONARA_COLD_START_WORKSPACE_SETTINGS: Record<string, unknown> = {
  'window.restoreWindows': 'one',
  'workbench.startupEditor': 'none',
  'workbench.localHistory.enabled': false,
};

export function cursorUserSettingsPath(): string {
  return path.join(process.env.APPDATA ?? '', 'Cursor', 'User', 'settings.json');
}

export function mergeSettingsRecord(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
): { next: Record<string, unknown>; changed: number } {
  let changed = 0;
  const next = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    const existing = next[key];
    if (existing === undefined) {
      next[key] = value;
      changed += 1;
      continue;
    }
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof existing === 'object' &&
      existing !== null &&
      !Array.isArray(existing)
    ) {
      const merged = {
        ...(existing as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
      const before = JSON.stringify(existing);
      const after = JSON.stringify(merged);
      if (before !== after) {
        next[key] = merged;
        changed += 1;
      }
      continue;
    }
    if (JSON.stringify(existing) !== JSON.stringify(value)) {
      next[key] = value;
      changed += 1;
    }
  }

  return { next, changed };
}

export function applyColdStartUserSettings(): { path: string; changed: number } {
  const filePath = cursorUserSettingsPath();
  if (!existsSync(filePath)) {
    writeFileSync(
      filePath,
      `${JSON.stringify(PHONARA_COLD_START_USER_SETTINGS, null, 2)}\n`,
      'utf8',
    );
    return { path: filePath, changed: Object.keys(PHONARA_COLD_START_USER_SETTINGS).length };
  }

  const current = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  const { next, changed } = mergeSettingsRecord(current, PHONARA_COLD_START_USER_SETTINGS);
  if (changed > 0) {
    writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  }
  return { path: filePath, changed };
}
