/**
 * Print R12 post-release review summary (Plan audit-r12-post-release).
 * Usage: bun run audit:r12-post-release
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PLATFORM_PPR_REVIEW_WINDOWS,
  PLATFORM_R12_DRILL_SCHEDULE,
  PLATFORM_R12_RC_SHA,
  PLATFORM_R12_SECRETS_ROTATION,
  assertPlatformR12PostReleaseSync,
  platformR12PendingPprReviews,
  platformR12PprSchedule,
  platformR12ProductionNormalVerdict,
} from '../apps/web/src/domain/platform-r12-post-release-display-contract';

const pprYamlPath = resolve('docs/OPERATIONS/PLATFORM_POST_RELEASE_REVIEW.yaml');
const secretsYamlPath = resolve('docs/OPERATIONS/PLATFORM_SECRETS_ROTATION.yaml');
const pprYaml = readFileSync(pprYamlPath, 'utf8');
const secretsYaml = readFileSync(secretsYamlPath, 'utf8');

assertPlatformR12PostReleaseSync();

const verdict = platformR12ProductionNormalVerdict();
const pending = platformR12PendingPprReviews();
const schedule = platformR12PprSchedule();

console.log('# Platform R12 Post Release Review — contract summary\n');
console.log(`PPR YAML: ${pprYamlPath}`);
console.log(`Secrets YAML: ${secretsYamlPath}`);
console.log(`rc_sha: ${PLATFORM_R12_RC_SHA}`);
console.log(
  `production_normal: ${verdict} (yaml: ${pprYaml.match(/production_normal:\s*(\w+)/)?.[1] ?? '?'})\n`,
);

console.log('## PPR schedule (§47 — mandatory 3 reviews)');
for (const row of schedule) {
  const window = PLATFORM_PPR_REVIEW_WINDOWS.find((w) => w.id === row.id);
  console.log(
    `- ${row.id}: due=${row.dueAt} status=${row.status} owners=${window?.owners.join('+') ?? '?'}`,
  );
}
console.log(`\nPending reviews: ${pending.length}/3`);

console.log('\n## Drill calendar (§51 — R12 confirmed)');
for (const drill of PLATFORM_R12_DRILL_SCHEDULE) {
  console.log(`- ${drill.type}: next=${drill.nextDue} status=${drill.status} owner=${drill.owner}`);
}

console.log('\n## Secrets rotation (§53 — deadline tracking)');
console.log(
  `rotation_policy_days: ${secretsYaml.match(/rotation_policy_days:\s*(\d+)/)?.[1] ?? '?'}`,
);
for (const secret of PLATFORM_R12_SECRETS_ROTATION) {
  console.log(`- ${secret.secretId}: next=${secret.nextDue} status=${secret.status}`);
}

console.log('\n---');
console.log(
  '24h template: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-ppr-24h-template.md',
);
console.log(
  '72h template: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-ppr-72h-template.md',
);
console.log(
  '7d template: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-ppr-7d-template.md',
);
console.log(
  'DR checklist: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-dr-drill-checklist.md',
);
console.log(
  'Secrets spotcheck: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-secrets-rotation-spotcheck.md',
);
console.log('Handoff: docs/OPERATIONS/PLATFORM_POST_RELEASE_REVIEW.md');

process.exit(0);
