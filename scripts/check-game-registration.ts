import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Validates that every GameCode is registered across engine, SQL, app config, and UI adapters.
 * See docs/rebuild/MASTER_EXECUTION_PROMPT.md §3 and docs/RUNBOOK.md for game registration checklist.
 */

await import('../packages/game-engine/src/index.ts');
import { GAME_CODES, listGames } from '../packages/game-engine/src/registry';

const ROOT = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function migrationSql(): string {
  const dir = join(ROOT, 'supabase/migrations');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => read(join('supabase/migrations', f)))
    .join('\n');
}

const sql = migrationSql();
// Import side-effect registration (above)
const registered = new Set(listGames());

for (const code of GAME_CODES) {
  if (!registered.has(code)) {
    failures.push(`engine not registered: ${code}`);
  }
  if (!sql.includes(`WHEN '${code}'`)) {
    failures.push(`SQL _game_result missing CASE: ${code}`);
  }
  if (!sql.includes(`feature_game_${code}_enabled`)) {
    failures.push(`app_config feature flag missing: feature_game_${code}_enabled`);
  }
}

const gameConfig = read('apps/web/src/features/casino/game-config.ts');
// Catalog files hold the literals; packages/i18n/src/index.ts is a re-export barrel only.
const i18nKo = read('packages/i18n/src/catalog-ko.ts');
const i18nEn = read('packages/i18n/src/catalog-en.ts');

for (const code of GAME_CODES) {
  if (!gameConfig.includes(`code: '${code}'`)) {
    failures.push(`game-config.ts missing: ${code}`);
  }
  const key = `casino.game.${code}`;
  if (!i18nKo.includes(key)) {
    failures.push(`i18n catalog-ko missing: ${key}`);
  }
  if (!i18nEn.includes(key)) {
    failures.push(`i18n catalog-en missing: ${key}`);
  }
}

// Enum-add migrations must not mix implementation DDL in the same file.
const enumOnlyPattern = /game_code_enum|enum_new_games|enum_add/i;
const migrationFiles = readdirSync(join(ROOT, 'supabase/migrations')).filter((f) =>
  f.endsWith('.sql'),
);
for (const file of migrationFiles) {
  const content = read(join('supabase/migrations', file));
  if (
    content.includes('ALTER TYPE game_code ADD VALUE') &&
    content.includes('CREATE OR REPLACE FUNCTION _game_result') &&
    !enumOnlyPattern.test(file)
  ) {
    failures.push(`enum-add mixed with implementation in same migration (split required): ${file}`);
  }
}

const parityTest = existsSync('tests/integration/casino-sql-parity.test.ts')
  ? read('tests/integration/casino-sql-parity.test.ts')
  : '';
for (const code of GAME_CODES) {
  if (parityTest && !parityTest.includes(`'${code}'`)) {
    failures.push(`casino-sql-parity.test.ts missing CASE_DEF: ${code}`);
  }
}

if (failures.length > 0) {
  console.error('check:games registration failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`check:games OK (${GAME_CODES.length} codes registered across engine/SQL/UI).`);
