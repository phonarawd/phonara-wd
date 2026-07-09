/**
 * Idempotent PHONARA Cursor render argv merge (%APPDATA%/Cursor/argv.json).
 * Safe on sessionStart · after mcp:fix — preserves unknown keys, merges contract only.
 */
import { auditCursorArgv, formatCursorArgvStatusLine, mergeCursorArgv } from './lib/cursor-argv';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check') || args.includes('--check-only');
const quiet = args.includes('--quiet');
const apply = !checkOnly && !args.includes('--no-apply');

function main(): void {
  if (apply) {
    const result = mergeCursorArgv({ apply: true });
    if (!quiet) {
      process.stdout.write(`${formatCursorArgvStatusLine(result)}\n`);
      if (result.applied && result.hadMissingKeys) {
        process.stdout.write(
          '[cursor:render-fix] argv.json merged — fully quit Cursor (tray too) and reopen (new render keys applied)\n',
        );
      } else if (result.applied) {
        process.stdout.write('[cursor:render-fix] argv.json normalized to PHONARA contract\n');
      } else if (result.ok) {
        process.stdout.write('[cursor:render-fix] argv.json already matches contract\n');
      }
    }
    if (!result.ok && !result.applied) {
      process.exitCode = 1;
    }
    return;
  }

  const audit = auditCursorArgv();
  if (!quiet) {
    process.stdout.write(`${formatCursorArgvStatusLine(audit)}\n`);
  }
  if (!audit.ok) {
    process.exitCode = 1;
  }
}

main();
