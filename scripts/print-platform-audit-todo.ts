/**
 * Print Platform Perfect Launch handoff for a Plan todo id.
 * Usage: bun run audit:todo -- audit-r2a-crypto-giftcard
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const id = process.argv[2]?.trim();
if (!id) {
  console.error('Usage: bun run audit:todo -- <plan-todo-id>');
  console.error('Example: bun run audit:todo -- audit-r2a-crypto-giftcard');
  process.exit(1);
}

const handoffPath = resolve('docs/OPERATIONS/PLATFORM_AUDIT_TODO_HANDOFF.md');
const text = readFileSync(handoffPath, 'utf8');
const anchor = `## ${id}`;
const start = text.indexOf(anchor);
if (start < 0) {
  console.error(`FAIL: no handoff section "${anchor}" in ${handoffPath}`);
  process.exit(1);
}

const next = text.indexOf('\n## ', start + anchor.length);
const section = next < 0 ? text.slice(start) : text.slice(start, next);

console.log(section.trim());
console.log('\n---');
console.log(`Chat: Implement ${id}`);
console.log(`Handoff: docs/OPERATIONS/PLATFORM_AUDIT_TODO_HANDOFF.md`);
