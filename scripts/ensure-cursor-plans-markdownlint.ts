/**
 * Ensure ~/.cursor/plans/.markdownlint-cli2.jsonc disables linting for Cursor Plans.
 *
 * Evidence: vscode-markdownlint Problems on %USERPROFILE%\.cursor\plans\*.plan.md
 * (MD022/MD031/MD032/MD047) — Plan body is not first-party docs (rule 99).
 * Idempotent; safe on sessionStart.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, 'scripts/templates/cursor-plans.markdownlint-cli2.jsonc');
const DEST_DIR = path.join(homedir(), '.cursor', 'plans');
const DEST = path.join(DEST_DIR, '.markdownlint-cli2.jsonc');

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n').trimEnd() + '\n';
}

function main(): void {
  if (!existsSync(TEMPLATE)) {
    process.stderr.write(`[cursor:ensure-plans-markdownlint] missing template: ${TEMPLATE}\n`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(DEST_DIR, { recursive: true });
  const wanted = normalize(readFileSync(TEMPLATE, 'utf8'));

  if (existsSync(DEST)) {
    const current = normalize(readFileSync(DEST, 'utf8'));
    if (current === wanted) {
      process.stdout.write('[cursor:ensure-plans-markdownlint] already applied\n');
      return;
    }
    const bak = `${DEST}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    copyFileSync(DEST, bak);
    process.stdout.write(`[cursor:ensure-plans-markdownlint] backed up -> ${bak}\n`);
  }

  writeFileSync(DEST, wanted, 'utf8');
  process.stdout.write(`[cursor:ensure-plans-markdownlint] wrote ${DEST}\n`);
}

main();
