import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { findSupabaseDbContainer, readLocalSupabaseEnv, runDbJsonQuery, runDbQuery } from './lib/db-connect';
import { collectRemoteProdLayer, type RemoteProdLayer } from './lib/remote-prod-layer';

loadRepoEnvFiles();

const ROOT = process.cwd();
const MIRROR_DIR = join(ROOT, 'supabase', 'functions-sql', 'current');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');
const LOCK_PATH = join(ROOT, 'supabase', 'migrations.lock.json');

const args = new Set(process.argv.slice(2));
const runFullGate = args.has('--full') || args.has('--ultimate');
const skipGates = args.has('--skip-gates');
const tryRemote = args.has('--remote') || args.has('--ultimate') || Boolean(process.env.SUPABASE_ACCESS_TOKEN?.trim());

interface GateResult {
  readonly command: string;
  readonly exitCode: number | null;
  readonly ok: boolean;
  readonly skipped: boolean;
  readonly logFile: string;
}

interface ScoreItem {
  readonly id: string;
  readonly label: string;
  readonly status: 'PASS' | 'FAIL' | 'UNVERIFIED' | 'SKIP';
  readonly evidence: string;
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

function runCommand(label: string, command: string, cmdArgs: string[], logPath: string): GateResult {
  const result = spawnSync(command, cmdArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  });
  const combined = [result.stdout ?? '', result.stderr ?? ''].filter(Boolean).join('\n');
  writeFileSync(logPath, combined, 'utf8');
  return {
    command: `${command} ${cmdArgs.join(' ')}`.trim(),
    exitCode: result.status,
    ok: result.status === 0,
    skipped: false,
    logFile: logPath.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, ''),
  };
}

function skippedGate(label: string, reason: string): GateResult {
  return {
    command: label,
    exitCode: null,
    ok: false,
    skipped: true,
    logFile: reason,
  };
}

function gitHead(): string {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: ROOT, shell: process.platform === 'win32' });
  return r.status === 0 ? (r.stdout ?? '').trim() : 'unknown';
}

function gitBranch(): string {
  const r = spawnSync('git', ['branch', '--show-current'], {
    encoding: 'utf8',
    cwd: ROOT,
    shell: process.platform === 'win32',
  });
  return r.status === 0 ? (r.stdout ?? '').trim() : 'unknown';
}

function gitStatusShort(): string {
  const r = spawnSync('git', ['status', '--short'], { encoding: 'utf8', cwd: ROOT, shell: process.platform === 'win32' });
  return r.status === 0 ? (r.stdout ?? '') : '';
}

function migrationInventory(): {
  files: string[];
  lockedCount: number;
  latest: string | null;
  rpcNames: string[];
  tableCreates: Array<{ file: string; count: number }>;
} {
  const files = existsSync(MIGRATIONS_DIR)
    ? readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort()
    : [];
  const lock = existsSync(LOCK_PATH) ? (JSON.parse(readText(LOCK_PATH)) as { migrations?: Record<string, string> }) : { migrations: {} };
  const rpcNames = new Set<string>();
  const tableCreates: Array<{ file: string; count: number }> = [];

  for (const file of files) {
    const content = readText(join(MIGRATIONS_DIR, file));
    for (const m of content.matchAll(/CREATE OR REPLACE FUNCTION\s+(rpc_[a-z0-9_]+|_[a-z0-9_]+)/gi)) {
      rpcNames.add(m[1]!);
    }
    const tableCount = (content.match(/CREATE TABLE/gi) ?? []).length;
    if (tableCount > 0) tableCreates.push({ file, count: tableCount });
  }

  return {
    files,
    lockedCount: Object.keys(lock.migrations ?? {}).length,
    latest: files.at(-1) ?? null,
    rpcNames: [...rpcNames].sort(),
    tableCreates,
  };
}

function hookRpcMap(): Array<{ hook: string; rpcCalls: string[] }> {
  const hooksDir = join(ROOT, 'apps', 'web', 'src', 'features');
  if (!existsSync(hooksDir)) return [];

  const out: Array<{ hook: string; rpcCalls: string[] }> = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.startsWith('use-') && entry.name.endsWith('.ts')) {
        const rel = full.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '');
        const text = readText(full);
        const rpcCalls = [...new Set([...text.matchAll(/rpc_[a-z0-9_]+/gi)].map((m) => m[0]!))].sort();
        out.push({ hook: rel, rpcCalls });
      }
    }
  };
  walk(hooksDir);
  return out.sort((a, b) => a.hook.localeCompare(b.hook));
}

function rpcCallSites(): Record<string, string[]> {
  const map = new Map<string, Set<string>>();
  const scanDirs = ['apps/web/src/features', 'apps/web/src/domain', 'apps/admin/src'];
  const walk = (dir: string): void => {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) return;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const full = join(abs, entry.name);
      const rel = full.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '');
      if (entry.isDirectory()) walk(rel);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const text = readText(full);
        for (const m of text.matchAll(/rpc_[a-z0-9_]+/gi)) {
          const rpc = m[0]!;
          if (!map.has(rpc)) map.set(rpc, new Set());
          map.get(rpc)!.add(rel);
        }
      }
    }
  };
  for (const dir of scanDirs) walk(dir);
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, [...v].sort()]));
}

function sqlTestInventory(): string[] {
  const dir = join(ROOT, 'supabase', 'tests');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function buildScorecard(ctx: {
  migrations: ReturnType<typeof migrationInventory>;
  gates: Record<string, GateResult>;
  dbAvailable: boolean;
  remote: RemoteProdLayer | Record<string, unknown>;
  hooks: ReturnType<typeof hookRpcMap>;
  p95?: Record<string, unknown> | null;
}): ScoreItem[] {
  const i18n = existsSync(join(ROOT, 'packages', 'i18n', 'src', 'index.ts'))
    ? readText(join(ROOT, 'packages', 'i18n', 'src', 'index.ts'))
    : '';
  const types = existsSync(join(ROOT, 'packages', 'shared-types', 'src', 'database.types.ts'))
    ? readText(join(ROOT, 'packages', 'shared-types', 'src', 'database.types.ts'))
    : '';

  const items: ScoreItem[] = [
    {
      id: 'G1',
      label: 'Remote migration 088–098 applied',
      status:
        ctx.remote?.skipped === true
          ? 'UNVERIFIED'
          : ctx.remote?.migrationListOk !== true
            ? 'UNVERIFIED'
            : ctx.remote?.migrationParity === true
              ? 'PASS'
              : 'FAIL',
      evidence:
        ctx.remote?.skipped === true
          ? String(ctx.remote?.reason ?? 'SUPABASE_ACCESS_TOKEN absent')
          : ctx.remote?.migrationParity === true
            ? 'remote migration list through 098'
            : String(ctx.remote?.migrationListError ?? ctx.remote?.migrationListTail ?? 'migration list not run'),
    },
    {
      id: 'G2',
      label: 'database.types.ts game_code + crypto/viral types',
      status: types.includes('game_code') && types.includes('crypto_') && types.includes('viral_') ? 'PASS' : 'FAIL',
      evidence: 'packages/shared-types/src/database.types.ts scan',
    },
    {
      id: 'G3',
      label: 'Crypto deposit rails (097)',
      status: ctx.migrations.files.some((f) => f.includes('000097')) ? 'PASS' : 'FAIL',
      evidence: ctx.migrations.latest ?? 'no 097 migration',
    },
    {
      id: 'G4',
      label: 'Viral missions RPC (098)',
      status: ctx.migrations.files.some((f) => f.includes('000098')) ? 'PASS' : 'FAIL',
      evidence: 'migration 098 present',
    },
    {
      id: 'G5',
      label: 'Prod rpc_run_reconciliation green',
      status:
        ctx.remote?.reconciliationOk === true ? 'PASS' : ctx.remote?.reconciliationOk === false ? 'FAIL' : 'UNVERIFIED',
      evidence: String(ctx.remote?.reconciliationDetail ?? 'service_role remote query not run'),
    },
    {
      id: 'G6',
      label: 'Earn roulette HMAC (000030)',
      status: ctx.migrations.files.some((f) => f.includes('000030')) ? 'PASS' : 'FAIL',
      evidence: 'migration 000030 present',
    },
    {
      id: 'G7',
      label: 'Trading spot RPC p95 measured',
      status: ctx.p95?.buy && ctx.p95?.sell ? 'PASS' : 'UNVERIFIED',
      evidence: ctx.p95
        ? `buy p95=${(ctx.p95.buy as { p95_ms?: number })?.p95_ms ?? '?'}ms sell p95=${(ctx.p95.sell as { p95_ms?: number })?.p95_ms ?? '?'}ms`
        : 'scripts/measure-spot-rpc-p95.ts not run',
    },
    {
      id: 'G8',
      label: 'Prod auth.users > 0 for authenticated smoke',
      status:
        typeof ctx.remote?.authUsers === 'number'
          ? ctx.remote.authUsers > 0
            ? 'PASS'
            : 'FAIL'
          : 'UNVERIFIED',
      evidence: typeof ctx.remote?.authUsers === 'number' ? `auth.users=${ctx.remote.authUsers}` : 'remote count not run',
    },
    {
      id: 'G9',
      label: 'build:packages + check:games green',
      status:
        ctx.gates.checkFull?.skipped === false
          ? ctx.gates.checkFull.ok
            ? 'PASS'
            : 'FAIL'
          : ctx.gates.buildPackages?.ok && ctx.gates.checkGames?.ok
            ? 'PASS'
            : 'FAIL',
      evidence:
        ctx.gates.checkFull?.skipped === false
          ? `check:full=${ctx.gates.checkFull?.ok ?? false} — see gates/check-full.log`
          : ctx.gates.buildPackages?.ok && ctx.gates.checkGames?.ok
            ? 'build:packages + check:games green'
            : `build:packages=${ctx.gates.buildPackages?.ok ?? false}, check:games=${ctx.gates.checkGames?.ok ?? false}`,
    },
    {
      id: 'G10',
      label: 'i18n viral/crypto error keys',
      status: /viral\./.test(i18n) && /crypto/.test(i18n) ? 'PASS' : 'FAIL',
      evidence: 'packages/i18n/src/index.ts key scan',
    },
    {
      id: 'G11',
      label: 'Hook wrappers for viral/crypto RPC',
      status:
        ctx.hooks.some((h) => h.rpcCalls.some((r) => r.includes('viral') || r.includes('crypto'))) ? 'PASS' : 'FAIL',
      evidence: ctx.hooks.map((h) => `${h.hook}: ${h.rpcCalls.join(', ') || '(none)'}`).join(' | ') || 'no hooks',
    },
    {
      id: 'G12',
      label: 'Crypto RG / phase5 gates branch',
      status: ctx.migrations.files.some((f) => f.includes('000073')) ? 'PASS' : 'FAIL',
      evidence: 'responsible_gambling migration 073',
    },
  ];
  return items;
}

function stripAnsiEscapes(text: string): string {
  const esc = String.fromCharCode(27);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === esc && text[i + 1] === '[') {
      const end = text.indexOf('m', i + 2);
      if (end !== -1) {
        i = end;
        continue;
      }
    }
    result += text[i]!;
  }
  return result;
}

function checkFullSummary(gates: Record<string, GateResult>): string[] {
  if (gates.checkFull?.skipped !== false || !gates.checkFull?.logFile) return [];
  const logPath = join(ROOT, gates.checkFull.logFile.replace(/\\/g, '/'));
  if (!existsSync(logPath)) return [];
  const log = readText(logPath);
  const lines: string[] = ['', '## check:full 게이트 요약', ''];
  const markers = [
    ['check:hygiene', /check:hygiene OK/],
    ['check:advisors', /check:advisors OK/],
    ['check:migrations', /check:migrations: OK/],
    ['check:games', /check:games OK/],
    ['unit test', /Tests\s+\d+ passed/],
    ['check:pwa', /check:pwa OK/],
    ['functions mirror', /functions-mirror: OK/],
    ['sql 41/41', /All 41 SQL test file\(s\) passed/],
    ['casino sql parity', /casino-sql-parity|Tests\s+1 passed \(1\)/],
    ['e2e', /(\d+) passed.*\([\d.]+m\)|(\d+) failed/],
  ] as const;
  for (const [name, re] of markers) {
    const hit = log.match(re);
    if (hit) {
      lines.push(`- **${name}:** ${stripAnsiEscapes(hit[0]).slice(0, 120)}`);
    }
  }
  if (/check:full OK/.test(log)) lines.push('- **전체:** check:full OK');
  else if (gates.checkFull.ok === false) lines.push('- **전체:** check:full **RED** — `gates/check-full.log`');
  return lines;
}

function writeEngineStateMd(
  outDir: string,
  manifest: Record<string, unknown>,
  scorecard: ScoreItem[],
  gates: Record<string, GateResult>,
): void {
  const pass = scorecard.filter((s) => s.status === 'PASS').length;
  const fail = scorecard.filter((s) => s.status === 'FAIL').length;
  const unverified = scorecard.filter((s) => s.status === 'UNVERIFIED').length;
  const lines = [
    '# PHONARA Engine State Dump',
    '',
    `> 생성: ${manifest.generatedAt as string} · HEAD \`${manifest.gitHead as string}\` · branch \`${manifest.gitBranch as string}\``,
    '',
    '## Scorecard (ENGINE 100 · G1–G12)',
    '',
    `PASS **${pass}** · FAIL **${fail}** · UNVERIFIED **${unverified}**`,
    '',
    '| ID | 상태 | 항목 | 근거 |',
    '|---|---|---|---|',
    ...scorecard.map((s) => `| ${s.id} | ${s.status} | ${s.label} | ${s.evidence.replace(/\|/g, '\\|')} |`),
    '',
    '## 레이어',
    '',
    '- **L0** Git/Lock → `layers/L0-git.json`',
    '- **L1** Schema inventory → `layers/L1-schema-inventory.json`',
    '- **L2** Functions mirror → `layers/L2-functions-mirror/` (또는 UNVERIFIED)',
    '- **L3** Security (GRANT/RLS/feature flags) → `layers/L3-security.json`',
    '- **L4** Packages/games → `layers/L4-packages.json` + gate logs',
    '- **L5** SQL tests → `layers/L5-sql-tests.json`',
    '- **L6** Hook↔RPC map → `layers/L6-hooks-rpc-map.json`',
    '- **L7** Gates → `layers/L7-gates.json` (+ `gates/check-full.log` when --full)',
    '- **L8** Remote prod → `layers/L8-remote.json`',
    '- **L9** Spot RPC p95 → `layers/L9-p95.json`',
    '- **L10** Unit/casino parity → `layers/L10-extra-gates.json`',
    ...checkFullSummary(gates),
    '',
    '## 다음 액션',
    '',
    fail > 0 ? '- FAIL 항목부터 `scorecard.json` evidence 확인' : '- FAIL 없음 — UNVERIFIED remote/p95만 보완',
    unverified > 0 ? '- UNVERIFIED: remote token · prod operator account · p95 probe 확인' : '',
    runFullGate ? '' : '- launch-readiness 전체: `bun run dump:engine -- --ultimate`',
    '',
  ].filter(Boolean);
  writeFileSync(join(outDir, 'ENGINE_STATE.md'), `${lines.join('\n')}\n`, 'utf8');
}

function captureL3Security(l3: Record<string, unknown>, mirrorCopied: boolean): void {
  const dbAvailable = findSupabaseDbContainer() !== null || runDbQuery('SELECT 1').mode !== 'unavailable';
  l3.dbAvailable = dbAvailable;
  l3.mirrorCopied = mirrorCopied;

  const grantQuery = `
SELECT coalesce(json_agg(row_to_json(t) ORDER BY proname, args), '[]'::json) FROM (
  SELECT p.proname AS proname,
         pg_get_function_identity_arguments(p.oid) AS args,
         array_agg(DISTINCT grantee.rolname ORDER BY grantee.rolname)
           FILTER (WHERE grantee.rolname IS NOT NULL) AS grantees
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  LEFT JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) acl ON TRUE
  LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname = 'public' AND p.prokind IN ('f','p')
  GROUP BY p.oid, p.proname
) t;`.trim();

  const rlsQuery = `
SELECT coalesce(json_agg(row_to_json(t) ORDER BY relname), '[]'::json) FROM (
  SELECT c.relname AS relname,
         c.relrowsecurity AS rls_on,
         (SELECT count(*)::int FROM pg_policies pol WHERE pol.tablename = c.relname) AS policy_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
) t;`.trim();

  const flagsQuery = `
SELECT coalesce(json_agg(row_to_json(t) ORDER BY key), '[]'::json) FROM (
  SELECT key, value FROM app_config
  WHERE key LIKE 'feature_%' OR key LIKE 'kill_%'
) t;`.trim();

  const tableCountQuery = `
SELECT coalesce(json_agg(row_to_json(t) ORDER BY relname), '[]'::json) FROM (
  SELECT c.relname AS relname,
         (SELECT count(*)::bigint FROM pg_catalog.pg_class c2 WHERE c2.relname = c.relname) AS exists
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
) t;`.trim();

  const grants = runDbJsonQuery<unknown[]>(grantQuery);
  const rls = runDbJsonQuery<unknown[]>(rlsQuery);
  const flags = runDbJsonQuery<unknown[]>(flagsQuery);
  const rpcCount = runDbQuery(
    `SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.prokind IN ('f','p');`,
  );

  l3.grants = grants.ok ? (grants.data ?? []) : { error: grants.error };
  l3.rls = rls.ok ? (rls.data ?? []) : { error: rls.error };
  l3.featureFlags = flags.ok ? (flags.data ?? []) : { error: flags.error };
  l3.publicRpcCount = rpcCount.ok ? Number.parseInt(rpcCount.stdout.trim(), 10) : null;
  l3.grantsQueryOk = grants.ok;
  l3.rlsQueryOk = rls.ok;
  l3.featureFlagsQueryOk = flags.ok;
  l3.tableInventoryQuery = tableCountQuery;
}

function copyMirrorToL2(layersDir: string): boolean {
  const l2Dir = join(layersDir, 'L2-functions-mirror');
  if (!existsSync(MIRROR_DIR)) {
    writeJson(join(layersDir, 'L2-functions-mirror-index.json'), {
      copied: false,
      reason: 'supabase/functions-sql/current missing',
    });
    return false;
  }
  mkdirSync(l2Dir, { recursive: true });
  cpSync(MIRROR_DIR, l2Dir, { recursive: true });
  const mirrorFiles = readdirSync(l2Dir).filter((f) => f.endsWith('.sql'));
  writeJson(join(layersDir, 'L2-functions-mirror-index.json'), {
    copied: true,
    fileCount: mirrorFiles.length,
    files: mirrorFiles.sort(),
  });
  return true;
}

function runP95Probe(logPath: string): { ok: boolean; data: Record<string, unknown> | null } {
  const localEnv = readLocalSupabaseEnv();
  const result = spawnSync('bun', ['run', 'scripts/measure-spot-rpc-p95.ts', '--samples=30'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, ...localEnv },
  });
  writeFileSync(logPath, [result.stdout ?? '', result.stderr ?? ''].filter(Boolean).join('\n'), 'utf8');
  if (result.status !== 0) return { ok: false, data: null };
  try {
    const jsonStart = (result.stdout ?? '').indexOf('{');
    const parsed = JSON.parse((result.stdout ?? '').slice(jsonStart)) as Record<string, unknown>;
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, data: null };
  }
}

async function main(): Promise<void> {
  const outDir = join(ROOT, 'engine-dump', stamp());
  const layersDir = join(outDir, 'layers');
  const gatesDir = join(outDir, 'gates');
  mkdirSync(layersDir, { recursive: true });
  mkdirSync(gatesDir, { recursive: true });

  console.log(`[dump:engine] writing to ${outDir}`);

  const migrations = migrationInventory();
  const hooks = hookRpcMap();
  const gates: Record<string, GateResult> = {};

  // L0
  const l0 = {
    gitHead: gitHead(),
    gitBranch: gitBranch(),
    gitStatusShort: gitStatusShort(),
    migrationsLock: existsSync(LOCK_PATH) ? JSON.parse(readText(LOCK_PATH)) : null,
    migrationsLockedCount: migrations.lockedCount,
    migrationsFileCount: migrations.files.length,
    latestMigration: migrations.latest,
  };
  writeJson(join(layersDir, 'L0-git.json'), l0);

  // L1
  writeJson(join(layersDir, 'L1-schema-inventory.json'), {
    latestMigration: migrations.latest,
    migrationFiles: migrations.files,
    rpcNamesFromMigrations: migrations.rpcNames,
    rpcCount: migrations.rpcNames.length,
    tableCreatesByMigration: migrations.tableCreates,
    databaseTypesSha256: existsSync(join(ROOT, 'packages', 'shared-types', 'src', 'database.types.ts'))
      ? sha256(readText(join(ROOT, 'packages', 'shared-types', 'src', 'database.types.ts')))
      : null,
  });

  // L2 — db reset (skip when --full defers to check:full)
  const dbContainer = findSupabaseDbContainer();
  if (!runFullGate) {
    if (dbContainer && !args.has('--no-reset')) {
      console.log('[dump:engine] supabase db reset (clean slate for SQL + mirror)...');
      gates.dbReset = runCommand('supabase db reset', 'supabase', ['db', 'reset'], join(gatesDir, 'db-reset.log'));
      if (!gates.dbReset.ok) {
        console.error('[dump:engine] db reset failed — SQL/mirror layers may be invalid.');
      }
    } else if (!dbContainer) {
      gates.dbReset = skippedGate('supabase db reset', 'no supabase_db_* container');
    } else {
      gates.dbReset = skippedGate('supabase db reset', '--no-reset passed');
    }

    if (dbContainer) {
      gates.mirrorFunctions = runCommand('mirror:functions', 'bun', ['run', 'mirror:functions'], join(gatesDir, 'mirror-functions.log'));
    }
  } else {
    gates.dbReset = skippedGate('supabase db reset', 'deferred to check:full');
    gates.mirrorFunctions = skippedGate('mirror:functions', 'deferred until after check:full');
  }

  const mirrorCopied = !runFullGate && copyMirrorToL2(layersDir);

  // L3 — security (post-reset in standard mode; after check:full in ultimate mode)
  const l3: Record<string, unknown> = {};
  if (!runFullGate) {
    captureL3Security(l3, mirrorCopied);
    writeJson(join(layersDir, 'L3-security.json'), l3);
  }

  // L4 gates
  if (!runFullGate) {
    gates.buildPackages = runCommand('build:packages', 'bun', ['run', 'build:packages'], join(gatesDir, 'build-packages.log'));
    gates.checkGames = runCommand('check:games', 'bun', ['run', 'check:games'], join(gatesDir, 'check-games.log'));
    gates.checkMigrations = runCommand('check:migrations', 'bun', ['run', 'check:migrations'], join(gatesDir, 'check-migrations.log'));
  }
  writeJson(join(layersDir, 'L4-packages.json'), {
    gates: {
      buildPackages: gates.buildPackages,
      checkGames: gates.checkGames,
      checkMigrations: gates.checkMigrations,
    },
  });

  // L5 SQL tests
  if (runFullGate) {
    gates.testSql = skippedGate('test:sql', 'included in check:full');
  } else if (!skipGates) {
    gates.testSql = runCommand('test:sql', 'bun', ['run', 'test:sql'], join(gatesDir, 'test-sql.log'));
  } else {
    gates.testSql = skippedGate('test:sql', '--skip-gates');
  }
  writeJson(join(layersDir, 'L5-sql-tests.json'), {
    inventory: sqlTestInventory(),
    inventoryCount: sqlTestInventory().length,
    gate: gates.testSql,
  });

  // L6 hooks
  writeJson(join(layersDir, 'L6-hooks-rpc-map.json'), {
    hooks,
    rpcCallSites: rpcCallSites(),
  });

  // L8 remote prod (early — while check:full runs we already have token work done)
  let remote: RemoteProdLayer | Record<string, unknown> = { skipped: true, reason: 'not requested' };
  if (tryRemote) {
    console.log('[dump:engine] collecting remote prod layer (read-only)...');
    remote = await collectRemoteProdLayer(process.env.SUPABASE_ACCESS_TOKEN);
    writeJson(join(layersDir, 'L8-remote.json'), remote);
  } else {
    writeJson(join(layersDir, 'L8-remote.json'), { skipped: true, reason: 'pass --remote or --ultimate' });
  }

  let p95: Record<string, unknown> | null = null;
  const l10: Record<string, unknown> = {};

  // L7 ultimate gate
  if (runFullGate) {
    console.log('[dump:engine] build:packages (required before check:games in check:full)...');
    gates.buildPackages = runCommand('build:packages', 'bun', ['run', 'build:packages'], join(gatesDir, 'build-packages.log'));
    gates.checkGames = runCommand('check:games', 'bun', ['run', 'check:games'], join(gatesDir, 'check-games.log'));
    gates.checkMigrations = runCommand('check:migrations', 'bun', ['run', 'check:migrations'], join(gatesDir, 'check-migrations.log'));

    console.log('[dump:engine] pre-sync functions mirror (db reset + mirror for check:full strict gate)...');
    gates.preMirrorReset = runCommand('supabase db reset (pre-check:full)', 'supabase', ['db', 'reset'], join(gatesDir, 'pre-mirror-reset.log'));
    gates.preMirrorSync = runCommand('mirror:functions (pre-check:full)', 'bun', ['run', 'mirror:functions'], join(gatesDir, 'pre-mirror-sync.log'));

    console.log('[dump:engine] running check:full (check + PWA + reset + mirror + SQL + casino parity + E2E)...');
    gates.checkFull = runCommand('check:full', 'bun', ['run', 'check:full'], join(gatesDir, 'check-full.log'));
    gates.testSql = {
      ...gates.checkFull,
      command: 'test:sql (via check:full)',
      logFile: gates.checkFull.logFile,
    };

    console.log('[dump:engine] post-check:full mirror + security + p95...');
    gates.mirrorFunctions = runCommand('mirror:functions', 'bun', ['run', 'mirror:functions'], join(gatesDir, 'mirror-functions.log'));
    const mirrorAfterFull = copyMirrorToL2(layersDir);
    captureL3Security(l3, mirrorAfterFull);
    writeJson(join(layersDir, 'L3-security.json'), l3);

    const p95Result = runP95Probe(join(gatesDir, 'measure-spot-rpc-p95.log'));
    gates.p95 = {
      command: 'scripts/measure-spot-rpc-p95.ts --samples=30',
      exitCode: p95Result.ok ? 0 : 1,
      ok: p95Result.ok,
      skipped: false,
      logFile: join(gatesDir, 'measure-spot-rpc-p95.log').replace(`${ROOT}\\`, '').replace(`${ROOT}/`, ''),
    };
    p95 = p95Result.data;
    writeJson(join(layersDir, 'L9-p95.json'), p95 ?? { error: 'p95 probe failed', log: gates.p95.logFile });

    l10.casinoSqlParity = { includedIn: 'check:full', ok: gates.checkFull.ok };
    l10.checkAdvisorsStrict = runCommand(
      'check:advisors (strict)',
      'bun',
      ['run', 'check:advisors'],
      join(gatesDir, 'check-advisors-strict.log'),
    );
    writeJson(join(layersDir, 'L4-packages.json'), {
      gates: {
        buildPackages: gates.buildPackages,
        checkGames: gates.checkGames,
        checkMigrations: gates.checkMigrations,
      },
    });
    writeJson(join(layersDir, 'L10-extra-gates.json'), l10);
  } else {
    gates.checkFull = skippedGate('check:full', 'pass --full or --ultimate');
    if (!skipGates) {
      gates.check = runCommand('check', 'bun', ['run', 'check'], join(gatesDir, 'check.log'));
    }
    writeJson(join(layersDir, 'L9-p95.json'), { skipped: true, reason: 'pass --ultimate' });
    writeJson(join(layersDir, 'L10-extra-gates.json'), { skipped: true });
  }

  writeJson(join(layersDir, 'L7-gates.json'), gates);

  const dbAvailable = Boolean(l3.dbAvailable);
  const scorecard = buildScorecard({ migrations, gates, dbAvailable, remote, hooks, p95 });
  writeJson(join(outDir, 'scorecard.json'), scorecard);

  const manifest = {
    generatedAt: new Date().toISOString(),
    gitHead: l0.gitHead,
    gitBranch: l0.gitBranch,
    outputDir: outDir.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, ''),
    layers: ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10'],
    options: { runFullGate, skipGates, tryRemote, ultimate: args.has('--ultimate') },
    scorecardSummary: {
      pass: scorecard.filter((s) => s.status === 'PASS').length,
      fail: scorecard.filter((s) => s.status === 'FAIL').length,
      unverified: scorecard.filter((s) => s.status === 'UNVERIFIED').length,
    },
  };
  writeJson(join(outDir, 'manifest.json'), manifest);
  writeEngineStateMd(outDir, manifest, scorecard, gates);

  // Symlink latest
  const latestFile = join(ROOT, 'engine-dump', 'LATEST.txt');
  writeFileSync(latestFile, `${manifest.outputDir}\n`, 'utf8');

  console.log(`[dump:engine] done → ${manifest.outputDir}`);
  console.log(
    `[dump:engine] scorecard PASS=${manifest.scorecardSummary.pass} FAIL=${manifest.scorecardSummary.fail} UNVERIFIED=${manifest.scorecardSummary.unverified}`,
  );
  console.log(`[dump:engine] read ENGINE_STATE.md in ${manifest.outputDir}`);

  const gateFailed =
    manifest.scorecardSummary.fail > 0 ||
    gates.checkFull?.skipped === false && gates.checkFull?.ok === false ||
    (gates.testSql?.skipped !== true && gates.testSql?.ok === false) ||
    (gates.dbReset?.skipped !== true && gates.dbReset?.ok === false && !runFullGate);

  if (gateFailed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[dump:engine] fatal:', error instanceof Error ? error.message : error);
  process.exit(1);
});
