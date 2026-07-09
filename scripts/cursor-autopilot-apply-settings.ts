/**
 * Merge PHONARA Run-Everything terminal auto-approve patterns into user settings.json.
 * Idempotent — adds missing keys and upgrades PHONARA patterns from false → true.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  mergeSettingsRecord,
  PHONARA_COLD_START_USER_SETTINGS,
} from './lib/cursor-cold-start-settings';

const settingsPath = path.join(process.env.APPDATA ?? '', 'Cursor', 'User', 'settings.json');

/** Patterns that must be auto-approved for Run Everything autopilot. */
const PHONARA_AUTO_APPROVE: Record<string, boolean> = {
  '/^bun(\\s+--bun)?\\s+run\\s+cursor:/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+gate:(ai-impl|local-autopilot)\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+check:engine-demolition:/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+mcp:verify\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+cursor:(work-end|session-end|purge|emergency-reset|agent-stop)\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+cursor:autopilot-setup\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+ci:(status|watch|prune-runs)\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+(typecheck|lint|check:hygiene|check:i18n|check:release|check:migrations|check:advisors|check:release|check:env)\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+test\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+build\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+test:e2e\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+test:sql\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+check:full\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+check\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+stack:/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+e2e:kill\\b/': true,
  '/^bun(\\s+--bun)?\\s+run\\s+supabase\\b/': true,
  '/^supabase\\s+(db\\s+reset|status|migration\\s+list|functions)\\b/': true,
};

/** Legacy patterns from conservative setup — force-enable for Run Everything. */
const FORCE_ENABLE_KEYS = new Set([
  '/^bun(\\s+--bun)?\\s+run\\s+(test|build|test:e2e|check:full|test:sql|stack:push-remote|stack:stop|check)\\b/',
]);

function main(): void {
  if (!existsSync(settingsPath)) {
    process.stderr.write(`[cursor:autopilot-setup:apply-settings] not found: ${settingsPath}\n`);
    process.exitCode = 1;
    return;
  }

  const raw = readFileSync(settingsPath, 'utf8');
  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    process.stderr.write('[cursor:autopilot-setup:apply-settings] invalid JSON in settings.json\n');
    process.exitCode = 1;
    return;
  }

  const autoApprove =
    (settings['chat.tools.terminal.autoApprove'] as Record<string, boolean> | undefined) ?? {};
  let added = 0;
  let upgraded = 0;

  for (const [key, value] of Object.entries(PHONARA_AUTO_APPROVE)) {
    if (!(key in autoApprove)) {
      autoApprove[key] = value;
      added += 1;
    } else if (autoApprove[key] === false && value === true) {
      autoApprove[key] = true;
      upgraded += 1;
    }
  }

  for (const key of FORCE_ENABLE_KEYS) {
    if (autoApprove[key] === false) {
      autoApprove[key] = true;
      upgraded += 1;
    } else if (!(key in autoApprove)) {
      autoApprove[key] = true;
      added += 1;
    }
  }

  settings['chat.tools.terminal.autoApprove'] = autoApprove;
  const coldStart = mergeSettingsRecord(settings, PHONARA_COLD_START_USER_SETTINGS);

  if (added === 0 && upgraded === 0 && coldStart.changed === 0) {
    process.stdout.write(
      '[cursor:autopilot-setup:apply-settings] Run-Everything + cold-start settings already applied\n',
    );
    return;
  }

  writeFileSync(settingsPath, `${JSON.stringify(coldStart.next, null, 2)}\n`, 'utf8');
  if (added > 0 || upgraded > 0) {
    process.stdout.write(
      `[cursor:autopilot-setup:apply-settings] added ${added}, upgraded ${upgraded} pattern(s) -> ${settingsPath}\n`,
    );
  }
  if (coldStart.changed > 0) {
    process.stdout.write(
      `[cursor:autopilot-setup:apply-settings] cold-start settings: ${coldStart.changed} key(s) merged\n`,
    );
  }
}

main();
