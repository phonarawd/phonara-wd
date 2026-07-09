/**
 * Git pre-push hook entry — blocks push to origin main/master.
 * Installed by: bun run git:hooks:install
 */
import { readFileSync } from 'node:fs';
import { checkPrePushRefs, parsePrePushRefLines } from './lib/main-push-guard';

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const stdin = readStdin();
const lines = parsePrePushRefLines(stdin);
const result = checkPrePushRefs(lines);

if (!result.allowed) {
  process.stderr.write(`[git:pre-push] ${result.reason}\n`);
  process.stderr.write('[git:pre-push] Safe push: bun run git:push\n');
  process.stderr.write('[git:pre-push] Move off main: bun run wip:branch -- "<topic>"\n');
  process.exit(1);
}

process.exit(0);
