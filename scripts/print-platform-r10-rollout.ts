/**
 * Print R10 rollout soak SOP summary (Plan audit-r10-rollout-soak).
 * Usage: bun run audit:r10-rollout
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PLATFORM_FEATURE_FLAG_FIVE_CONDITIONS,
  PLATFORM_R10_ROLLBACK_TRIGGERS,
  PLATFORM_R10_ROLLOUT_STAGES,
  PLATFORM_R10_SOAK_CHECKPOINTS,
  assertPlatformR10RolloutSync,
} from '../apps/web/src/domain/platform-r10-rollout-display-contract';

const yamlPath = resolve('docs/OPERATIONS/PLATFORM_R10_ROLLOUT_SOAK.yaml');
const yaml = readFileSync(yamlPath, 'utf8');

assertPlatformR10RolloutSync();

console.log('# Platform R10 Rollout Soak — contract summary\n');
console.log(`YAML: ${yamlPath}`);
console.log(`soak_window_hours: ${yaml.match(/soak_window_hours:\s*(\d+)/)?.[1] ?? '?'}`);
console.log(`known_good_sha: ${yaml.match(/known_good_sha:\s*'([^']+)'/)?.[1] ?? '?'}\n`);

console.log('## Five conditions (§8)');
for (const id of PLATFORM_FEATURE_FLAG_FIVE_CONDITIONS) {
  console.log(`- ${id}`);
}

console.log('\n## Rollout stages');
for (const stage of PLATFORM_R10_ROLLOUT_STAGES) {
  console.log(
    `- [${stage.order}] ${stage.id}: flip=${stage.flipAllowed} keys=${stage.featureKeys.join(',') || 'none'}`,
  );
}

console.log('\n## Soak checkpoints');
for (const cp of PLATFORM_R10_SOAK_CHECKPOINTS) {
  console.log(`- ${cp.id} (${cp.offset}): ${cp.checks.length} checks`);
}

console.log('\n## Rollback triggers (§20b)');
for (const t of PLATFORM_R10_ROLLBACK_TRIGGERS) {
  console.log(`- ${t.key}: ${t.draftValue} / ${t.window} → ${t.action}`);
}

console.log('\n---');
console.log('Spotcheck: psql $DATABASE_URL -f scripts/platform-r10-rollout-spotcheck.sql');
console.log('Dry-fire: bun run stack:ops-alert-dry-fire');
console.log('Handoff: docs/OPERATIONS/PLATFORM_R10_ROLLOUT_SOAK.md');
