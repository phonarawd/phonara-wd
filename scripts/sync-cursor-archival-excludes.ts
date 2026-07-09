/**
 * Sync CURSOR_ARCHIVAL_* → .vscode/settings.json watcher + search excludes
 * and ensure .cursorignore contains the same patterns (single source of truth).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  CURSOR_ARCHIVAL_DIR_PATTERNS,
  CURSOR_ARCHIVAL_DOC_GLOB_PREFIXES,
  CURSOR_ARCHIVAL_DOC_PATHS,
  CURSORIGNORE_REQUIRED_PATTERNS,
  VSCODE_WATCHER_EXCLUDE_REQUIRED,
} from './lib/workspace-artifacts';

const settingsPath = '.vscode/settings.json';
const raw = readFileSync(settingsPath, 'utf8');
const settings = JSON.parse(raw) as {
  files?: { watcherExclude?: Record<string, boolean>; exclude?: Record<string, boolean> };
  search?: { exclude?: Record<string, boolean> };
};

settings.files ??= {};
settings.files.watcherExclude ??= {};
settings.search ??= {};
settings.search.exclude ??= {};

for (const docPath of CURSOR_ARCHIVAL_DOC_PATHS) {
  const key = `**/${docPath.replace(/\\/g, '/')}`;
  settings.files.watcherExclude[key] = true;
  settings.search.exclude[key] = true;
}

for (const dirPattern of CURSOR_ARCHIVAL_DIR_PATTERNS) {
  const normalized = dirPattern.replace(/\\/g, '/').replace(/\/$/, '');
  const key = `**/${normalized}/**`;
  settings.files.watcherExclude[key] = true;
  settings.search.exclude[key] = true;
}

for (const prefix of CURSOR_ARCHIVAL_DOC_GLOB_PREFIXES) {
  const key = `**/${prefix.replace(/\\/g, '/')}*`;
  settings.files.watcherExclude[key] = true;
  settings.search.exclude[key] = true;
}

for (const key of VSCODE_WATCHER_EXCLUDE_REQUIRED) {
  settings.files.watcherExclude[key] = true;
}

const nextSettings = `${JSON.stringify(settings, null, 2)}\n`;
if (nextSettings === raw || nextSettings === `${raw.trimEnd()}\n`) {
  console.log('sync: .vscode/settings.json already up to date');
} else {
  writeFileSync(settingsPath, nextSettings, 'utf8');
  console.log(
    `synced ${CURSOR_ARCHIVAL_DOC_PATHS.length} archival doc + ${CURSOR_ARCHIVAL_DIR_PATTERNS.length} dir + ${CURSOR_ARCHIVAL_DOC_GLOB_PREFIXES.length} glob excludes → .vscode/settings.json`,
  );
}

function syncCursorignore(): number {
  const cursorignorePath = '.cursorignore';
  if (!existsSync(cursorignorePath)) {
    console.warn('sync: .cursorignore missing — skipped');
    return 0;
  }

  const requiredLines = new Set<string>([
    ...CURSORIGNORE_REQUIRED_PATTERNS,
    ...CURSOR_ARCHIVAL_DOC_PATHS,
    ...CURSOR_ARCHIVAL_DIR_PATTERNS,
    ...CURSOR_ARCHIVAL_DOC_GLOB_PREFIXES.map((prefix) => `${prefix}*`),
    'scripts/tmp-',
  ]);

  const autoSyncMarker =
    '# Auto-synced from scripts/lib/workspace-artifacts.ts (cursor:sync-excludes)';
  let text = readFileSync(cursorignorePath, 'utf8');
  const markerIndex = text.indexOf(autoSyncMarker);
  if (markerIndex >= 0) {
    text = text.slice(0, markerIndex).trimEnd();
  }

  const bodyLines = text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0 && !line.startsWith('# Auto-synced'));

  const bodySet = new Set(bodyLines);
  const dedupedBody = bodyLines.filter((line) => {
    if (line.startsWith('#')) return true;
    // Drop body lines fully covered by a required pattern already present elsewhere in body
    for (const required of requiredLines) {
      if (line === required && bodySet.has(required)) {
        const firstIndex = bodyLines.indexOf(required);
        return bodyLines.indexOf(line) === firstIndex;
      }
    }
    return true;
  });

  const bodyText = dedupedBody.join('\n');
  const missing: string[] = [];
  for (const line of requiredLines) {
    if (!bodyText.includes(line)) {
      missing.push(line);
    }
  }

  if (missing.length === 0) {
    const normalized = `${bodyText}\n`;
    if (normalized !== readFileSync(cursorignorePath, 'utf8')) {
      writeFileSync(cursorignorePath, normalized, 'utf8');
      console.log('sync: normalized .cursorignore (removed duplicate auto-sync blocks)');
      return 1;
    }
    console.log('sync: .cursorignore already contains all workspace-artifacts patterns');
    return 0;
  }

  const block = ['', autoSyncMarker, ...missing.sort(), ''].join('\n');
  const next = `${bodyText}${block}`;
  writeFileSync(cursorignorePath, next.endsWith('\n') ? next : `${next}\n`, 'utf8');
  const added = missing.length;
  console.log(`sync: appended ${added} missing pattern(s) → .cursorignore`);
  return added;
}

syncCursorignore();
