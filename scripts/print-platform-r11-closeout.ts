/**
 * Print R11 release closeout summary (Plan audit-r11-closeout).
 * Usage: bun run audit:r11-closeout
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PLATFORM_EVIDENCE_PRIMARY_BUCKET,
  PLATFORM_EVIDENCE_RETENTION_DAYS,
  PLATFORM_R11_KNOWN_GOOD_SHA,
  PLATFORM_R11_RC_SHA,
  PLATFORM_RELEASE_GATE_CRITERIA,
  PLATFORM_THREE_OWNER_ROLES,
  assertPlatformR11CloseoutSync,
  platformR11ReleaseBlockers,
  platformR11ReleaseCandidateVerdict,
} from '../apps/web/src/domain/platform-r11-closeout-display-contract';

const yamlPath = resolve('docs/OPERATIONS/PLATFORM_RELEASE_FREEZE.yaml');
const yaml = readFileSync(yamlPath, 'utf8');

assertPlatformR11CloseoutSync();

const verdict = platformR11ReleaseCandidateVerdict();
const blockers = platformR11ReleaseBlockers();

console.log('# Platform R11 Release Closeout — contract summary\n');
console.log(`YAML: ${yamlPath}`);
console.log(`freeze_status: ${yaml.match(/freeze_status:\s*(\w+)/)?.[1] ?? '?'}`);
console.log(`rc_sha: ${PLATFORM_R11_RC_SHA}`);
console.log(`known_good_sha: ${PLATFORM_R11_KNOWN_GOOD_SHA}`);
console.log(`release_candidate: ${verdict}\n`);

console.log('## Three-Owner roles (§46 — operator sign only)');
for (const role of PLATFORM_THREE_OWNER_ROLES) {
  console.log(`- ${role}: PENDING_OPERATOR`);
}

console.log('\n## Evidence retention (§45)');
console.log(`- days: ${PLATFORM_EVIDENCE_RETENTION_DAYS}`);
console.log(`- primary_bucket: ${PLATFORM_EVIDENCE_PRIMARY_BUCKET}`);
console.log('- index: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/');

console.log('\n## Release Gate criteria');
for (const row of PLATFORM_RELEASE_GATE_CRITERIA) {
  const flag = row.blocker ? '*' : ' ';
  console.log(`${flag} [${row.status}] ${row.id}: ${row.label}`);
}

if (blockers.length > 0) {
  console.log('\n## Blockers');
  for (const row of blockers) {
    console.log(`- ${row.id} (${row.status}): ${row.evidence}`);
  }
}

console.log('\n---');
console.log(
  'Signoff template: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-3-owner-signoff-template.md',
);
console.log(
  'Retention spotcheck: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-evidence-retention-spotcheck.md',
);
console.log('Handoff: docs/OPERATIONS/PLATFORM_RELEASE_FREEZE.md');
