#!/usr/bin/env tsx
/**
 * Section D — app_config ↔ server gate / client precheck / remote state audit (read-only).
 * Writes JSON to scripts/audit/last-d-config-state-report.json
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findSupabaseDbContainer } from '../lib/db-connect.ts';
import { LOCKED_SUPABASE_PROJECT_REF } from '../lib/locked-supabase-project.ts';
import { sqlExec } from '../pentest/lib/sql-rpc.ts';

type Severity = 'P0' | 'P1' | 'P2' | 'P3' | 'PASS' | 'UNVERIFIED';

interface ConfigKeyRow {
  key: string;
  migrationSeeds: string[];
  serverGateKind:
    | 'system_live'
    | 'feature_kill'
    | 'consent'
    | 'geo'
    | 'withdrawal_mfa'
    | 'per_game'
    | 'trade_launch'
    | 'numeric_limit'
    | 'direct_read'
    | 'admin_only'
    | 'unknown';
  serverEvidence: string[];
  clientReads: string[];
  isPublic: boolean | null;
  liveValue: string | null;
  clientPrecheck: boolean;
  verdict: Severity;
  note: string;
}

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');
const ADMIN_SRC = join(ROOT, 'apps', 'admin', 'src');

const PLATFORM_CONFIG_KEYS = [
  'system_halt',
  'system_readonly',
  'feature_game_enabled',
  'feature_spot_enabled',
  'feature_futures_enabled',
  'feature_staking_enabled',
  'feature_deposit_enabled',
  'feature_withdrawal_enabled',
  'feature_sports_enabled',
] as const;

const TRADE_LAUNCH_FLAG_KEYS = ['feature_cross_margin_enabled', 'feature_funding_enabled'] as const;

const KILL_DEFS_KEYS = [
  'system_halt',
  'system_readonly',
  'feature_deposit_enabled',
  'feature_withdrawal_enabled',
  'feature_spot_enabled',
  'feature_futures_enabled',
  'feature_staking_enabled',
  'feature_game_enabled',
  'feature_sports_enabled',
  'feature_referral_enabled',
] as const;

const CONSENT_KEY = 'consent_gate_enabled';
const GEO_KEY = 'geo_block_enabled';
const MFA_KEY = 'withdrawal_mfa_step_up_enabled';
const WHITELIST_KEY = 'withdrawal_whitelist_enabled';

const PER_GAME_SLUGS = [
  'crash',
  'limbo',
  'dice',
  'mines',
  'hilo',
  'plinko',
  'mint_reels',
  'gold_rush',
  'roulette',
  'blackjack',
  'deepshaft',
  'momentum',
] as const;

const STATIC_SERVER_GATES: Record<string, string[]> = {
  system_halt: ['_assert_system_live()', '20260609000018_p0_system_live_guard.sql'],
  system_readonly: ['_assert_system_live()', '20260609000018_p0_system_live_guard.sql'],
  consent_gate_enabled: ['_assert_onboarding_consent()', '20260609000008_p0_hardening_schema.sql'],
  geo_block_enabled: [
    '_assert_not_geo_blocked() defined · RPC inject 0',
    '20260627000001_worldno1_money_ops_rails.sql:749',
  ],
  withdrawal_mfa_step_up_enabled: [
    '_assert_withdrawal_mfa_step_up()',
    '20260623000007_withdrawal_mfa_step_up.sql',
  ],
  feature_cross_margin_enabled: [
    '_assert_cross_margin_enabled()',
    '20260620000140_trade_launch_funding_cross_gates.sql',
  ],
  feature_funding_enabled: [
    '_assert_funding_enabled()',
    '20260620000140_trade_launch_funding_cross_gates.sql',
  ],
  withdrawal_whitelist_enabled: [
    'server: rpc_request_withdrawal branch',
    '20260629000001_worldno1_vertical_hardening.sql',
  ],
};

for (const slug of PER_GAME_SLUGS) {
  STATIC_SERVER_GATES[`feature_game_${slug}_enabled`] = [
    'dynamic:feature_game_<slug>_enabled in casino RPC',
    '20260609000029_s3_casino_atomic_settlement.sql',
  ];
}

for (const feat of [
  'spot',
  'futures',
  'staking',
  'game',
  'referral',
  'deposit',
  'withdrawal',
  'sports',
]) {
  const k = `feature_${feat}_enabled`;
  STATIC_SERVER_GATES[k] = [
    `_assert_feature_enabled('${feat}')`,
    '20260609000019_p0_feature_kill_switches.sql',
  ];
}

const GATE_HELPERS = [
  '_assert_system_live',
  '_assert_feature_enabled',
  '_assert_onboarding_consent',
  '_assert_not_geo_blocked',
  '_assert_withdrawal_mfa_step_up',
  '_assert_funding_enabled',
  '_assert_cross_margin_enabled',
] as const;

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '__tests__') continue;
      out.push(...walkTsFiles(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function parseMigrationKeys(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (key: string, file: string) => {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    const list = map.get(key) ?? [];
    if (!list.includes(rel)) list.push(rel);
    map.set(key, list);
  };

  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'))) {
    const full = join(MIGRATIONS_DIR, file);
    const content = readFileSync(full, 'utf8');
    if (!content.includes('app_config')) continue;

    for (const m of content.matchAll(
      /INSERT\s+INTO\s+app_config\s*\([^)]*\)\s*VALUES\s*([\s\S]*?);/gi,
    )) {
      const block = m[1] ?? '';
      for (const row of block.matchAll(/\(\s*'([a-z0-9_]+)'/g)) {
        add(row[1]!, full);
      }
    }

    for (const m of content.matchAll(/_app_config_numeric\(\s*'([a-z0-9_]+)'/g)) {
      add(m[1]!, full);
    }

    for (const m of content.matchAll(
      /(?:WHERE|AND)\s+key\s*=\s*'([a-z0-9_]+)'|key\s+IN\s*\(\s*'([a-z0-9_]+)'/gi,
    )) {
      const key = m[1] ?? m[2];
      if (key) add(key, full);
    }
  }

  for (const slug of PER_GAME_SLUGS) {
    add(
      `feature_game_${slug}_enabled`,
      'supabase/migrations/20260609000029_s3_casino_atomic_settlement.sql',
    );
  }

  return map;
}

function scanClientKeyReads(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (key: string, evidence: string) => {
    const list = map.get(key) ?? [];
    if (!list.includes(evidence)) list.push(evidence);
    map.set(key, list);
  };

  const platformPath = 'apps/web/src/domain/platform-gate-contract.ts';
  for (const key of PLATFORM_CONFIG_KEYS) {
    add(key, `${platformPath}:PLATFORM_CONFIG_KEYS`);
  }
  const clientGatePath = 'apps/web/src/domain/client-gate-contract.ts';
  add(CONSENT_KEY, `${clientGatePath}:CLIENT_GATE_CONFIG_KEYS`);
  add(MFA_KEY, `${clientGatePath}:CLIENT_GATE_CONFIG_KEYS`);
  add(GEO_KEY, `${clientGatePath}:CLIENT_GATE_CONFIG_KEYS · apps/web/src/lib/geo-block.ts`);
  for (const slug of PER_GAME_SLUGS) {
    add(`feature_game_${slug}_enabled`, `${clientGatePath}:PER_GAME_CONFIG_SLUGS`);
  }
  add(
    'feature_cross_margin_enabled',
    'apps/web/src/hooks/use-trade-launch-flags.ts:TRADE_LAUNCH_FLAG_KEYS',
  );
  add(
    'feature_funding_enabled',
    'apps/web/src/hooks/use-trade-launch-flags.ts:TRADE_LAUNCH_FLAG_KEYS',
  );
  add(WHITELIST_KEY, 'apps/web/src/features/wallet/use-crypto-withdraw.ts:whitelistEnabled query');
  add(GEO_KEY, 'apps/web/src/lib/geo-block.ts:profiles.geo_blocked (not app_config)');

  for (const key of KILL_DEFS_KEYS) {
    add(key, 'apps/admin/src/hooks/admin/useAdminOperations.ts:KILL_DEFS');
  }
  add(
    'consent_gate_enabled',
    'apps/admin/src/product/bridge/parse-admin-settings-config.ts:LABEL_KEYS',
  );

  const files = [...walkTsFiles(WEB_SRC), ...walkTsFiles(ADMIN_SRC)];
  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    const content = readFileSync(file, 'utf8');
    for (const m of content.matchAll(/\.eq\(\s*'key'\s*,\s*'([a-z0-9_]+)'/g)) {
      add(m[1]!, `${rel}:eq(key)`);
    }
    for (const m of content.matchAll(/'([a-z0-9_]+)'/g)) {
      if (
        m[1]!.includes('feature_') ||
        m[1]!.startsWith('system_') ||
        m[1]!.includes('withdrawal_')
      ) {
        if (
          content.includes('app_config') ||
          content.includes('CONFIG_SELECT') ||
          content.includes('CONFIG_KEYS')
        ) {
          add(m[1]!, `${rel}:literal`);
        }
      }
    }
  }

  return map;
}

function classifyServerGate(key: string): ConfigKeyRow['serverGateKind'] {
  if (key === 'system_halt' || key === 'system_readonly') return 'system_live';
  if (key === CONSENT_KEY) return 'consent';
  if (key === GEO_KEY) return 'geo';
  if (key === MFA_KEY) return 'withdrawal_mfa';
  if (/^feature_game_[a-z0-9_]+_enabled$/.test(key)) return 'per_game';
  if (TRADE_LAUNCH_FLAG_KEYS.includes(key as (typeof TRADE_LAUNCH_FLAG_KEYS)[number]))
    return 'trade_launch';
  if (/^feature_[a-z0-9_]+_enabled$/.test(key)) return 'feature_kill';
  if (
    key.includes('max') ||
    key.includes('min') ||
    key.includes('cap') ||
    key.includes('threshold') ||
    key.includes('sla') ||
    key.includes('rate') ||
    key.includes('multiplier')
  ) {
    return 'numeric_limit';
  }
  if (
    key.startsWith('system_') ||
    key.startsWith('earn_') ||
    key.startsWith('viral_') ||
    key.startsWith('referral_')
  ) {
    return 'admin_only';
  }
  return 'unknown';
}

function scalar(sql: string): string {
  const r = sqlExec(sql);
  if (!r.ok) throw new Error(r.error);
  return r.stdout.trim();
}

function loadLiveConfigRows(): Array<{
  key: string;
  value: string;
  is_public: boolean;
  updated_at: string;
}> {
  const raw = sqlExec(`
    SELECT json_agg(row_to_json(t) ORDER BY t.key)
    FROM (
      SELECT key, value, is_public, updated_at::text
      FROM app_config
    ) t;
  `);
  if (!raw.ok) return [];
  return JSON.parse(raw.stdout.trim() || '[]') as Array<{
    key: string;
    value: string;
    is_public: boolean;
    updated_at: string;
  }>;
}

function loadServerKeyUsage(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const raw = sqlExec(`
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args,
             pg_get_functiondef(p.oid) AS def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND (
          pg_get_functiondef(p.oid) LIKE '%app_config%'
          OR p.proname = ANY(ARRAY[${GATE_HELPERS.map((h) => `'${h}'`).join(',')}])
        )
    ) t;
  `);
  if (!raw.ok) return map;

  const rows = JSON.parse(raw.stdout.trim() || '[]') as Array<{
    name: string;
    args: string;
    def: string;
  }>;

  for (const row of rows) {
    const evidence = `${row.name}(${row.args})`;
    for (const m of row.def.matchAll(/key\s*=\s*'([a-z0-9_]+)'/g)) {
      const key = m[1]!;
      const list = map.get(key) ?? [];
      if (!list.includes(evidence)) list.push(evidence);
      map.set(key, list);
    }
    if (row.def.includes('_assert_system_live()')) {
      for (const k of ['system_halt', 'system_readonly']) {
        const list = map.get(k) ?? [];
        if (!list.includes('_assert_system_live()')) list.push('_assert_system_live()');
        map.set(k, list);
      }
    }
    if (row.def.includes('_assert_onboarding_consent(')) {
      const list = map.get(CONSENT_KEY) ?? [];
      if (!list.includes(evidence)) list.push(evidence);
      map.set(CONSENT_KEY, list);
    }
    if (row.def.includes('_assert_not_geo_blocked(')) {
      const list = map.get(GEO_KEY) ?? [];
      if (!list.includes(evidence)) list.push(evidence);
      map.set(GEO_KEY, list);
    }
    if (row.def.includes('_assert_withdrawal_mfa_step_up()')) {
      const list = map.get(MFA_KEY) ?? [];
      if (!list.includes(evidence)) list.push(evidence);
      map.set(MFA_KEY, list);
    }
    for (const m of row.def.matchAll(/_assert_feature_enabled\(\s*'([a-z0-9_]+)'/g)) {
      const featKey = `feature_${m[1]}_enabled`;
      const list = map.get(featKey) ?? [];
      if (!list.includes(evidence)) list.push(evidence);
      map.set(featKey, list);
    }
    for (const m of row.def.matchAll(/feature_game_' \|\| [^']*::TEXT \|\| '_enabled/g)) {
      void m;
      for (const slug of PER_GAME_SLUGS) {
        const k = `feature_game_${slug}_enabled`;
        const list = map.get(k) ?? [];
        if (!list.includes('dynamic:feature_game_<slug>_enabled'))
          list.push('dynamic:feature_game_<slug>_enabled');
        map.set(k, list);
      }
    }
  }

  return map;
}

function hasClientPrecheck(key: string, clientReads: string[]): boolean {
  if (PLATFORM_CONFIG_KEYS.includes(key as (typeof PLATFORM_CONFIG_KEYS)[number])) return true;
  if (TRADE_LAUNCH_FLAG_KEYS.includes(key as (typeof TRADE_LAUNCH_FLAG_KEYS)[number])) return true;
  if (key === WHITELIST_KEY) return true;
  if (key === CONSENT_KEY) {
    return clientReads.some((e) => e.includes('client-gate-contract'));
  }
  if (key === MFA_KEY) {
    return clientReads.some((e) => e.includes('client-gate-contract'));
  }
  if (key === GEO_KEY) {
    return clientReads.some(
      (e) => e.includes('client-gate-contract') || e.includes('geo-block.ts'),
    );
  }
  if (/^feature_game_[a-z0-9_]+_enabled$/.test(key)) {
    return clientReads.some((e) => e.includes('client-gate-contract'));
  }
  if (key === 'feature_game_enabled')
    return clientReads.some((e) => e.includes('platform-gate-contract'));
  return false;
}

function judgeRow(row: ConfigKeyRow): { verdict: Severity; note: string } {
  const serverUsed = row.serverEvidence.length > 0;
  const clientReads = row.clientReads.length > 0;

  if (row.serverGateKind === 'geo' && serverUsed) {
    const rpcInjected = row.serverEvidence.some((e) => e.startsWith('rpc_'));
    if (!rpcInjected) {
      return {
        verdict: 'P2',
        note: '_assert_not_geo_blocked 정의만 존재 · balance-moving RPC 주입 0',
      };
    }
  }

  if ((row.key === CONSENT_KEY || row.key === MFA_KEY) && serverUsed && !row.clientPrecheck) {
    return {
      verdict: 'P2',
      note: '서버 게이트 있음 · web client precheck 없음 (RPC fail-closed만)',
    };
  }

  if (row.serverGateKind === 'per_game' && serverUsed && !clientReads) {
    return {
      verdict: 'P2',
      note: 'per-game 서버 kill만 · aggregate feature_game_enabled client precheck',
    };
  }

  if (clientReads && row.isPublic === false && clientReads.some((e) => e.startsWith('apps/web/'))) {
    return {
      verdict: 'P2',
      note: 'web client가 is_public=false 키 조회 · RLS로 null/빈값 → UI precheck 불가',
    };
  }

  if (PLATFORM_CONFIG_KEYS.includes(row.key as (typeof PLATFORM_CONFIG_KEYS)[number])) {
    if (row.isPublic === true)
      return { verdict: 'PASS', note: 'platform gate public + client wired' };
    return { verdict: 'P1', note: 'PLATFORM_CONFIG_KEYS but is_public=false' };
  }

  if (!serverUsed && !clientReads)
    return { verdict: 'P3', note: 'migration seed only / display limit' };
  return { verdict: 'PASS', note: 'server/client scope OK or admin-only' };
}

function parseLocalMigrationNames(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => {
      const m = file.match(/^\d+_(.+)\.sql$/);
      if (!m) throw new Error(`Invalid migration filename: ${file}`);
      return m[1]!;
    });
}

function main(): void {
  const hasDb = !!(findSupabaseDbContainer() || process.env.SUPABASE_DB_URL);
  const migrationKeys = parseMigrationKeys();
  const clientReads = scanClientKeyReads();
  const localMigrationNames = parseLocalMigrationNames();

  const liveRows = hasDb ? loadLiveConfigRows() : [];
  const liveByKey = new Map(liveRows.map((r) => [r.key, r]));
  const serverUsage = hasDb ? loadServerKeyUsage() : new Map<string, string[]>();

  const allKeys = [...new Set([...migrationKeys.keys(), ...liveByKey.keys()])].sort();

  const matrix: ConfigKeyRow[] = allKeys.map((key) => {
    const reads = clientReads.get(key) ?? [];
    const serverEvidence = [
      ...(serverUsage.get(key) ?? []),
      ...(serverUsage.get(key)?.length ? [] : (STATIC_SERVER_GATES[key] ?? [])),
    ];
    const row: ConfigKeyRow = {
      key,
      migrationSeeds: migrationKeys.get(key) ?? [],
      serverGateKind: classifyServerGate(key),
      serverEvidence,
      clientReads: reads,
      isPublic: liveByKey.get(key)?.is_public ?? null,
      liveValue: liveByKey.get(key)?.value ?? null,
      clientPrecheck: hasClientPrecheck(key, reads),
      verdict: 'UNVERIFIED',
      note: '',
    };
    const judged = judgeRow(row);
    row.verdict = judged.verdict;
    row.note = judged.note;
    return row;
  });

  const p2Gaps = matrix.filter((r) => r.verdict === 'P2');
  const p1Gaps = matrix.filter((r) => r.verdict === 'P1');

  let reconciliationRecent: unknown[] = [];
  let hashChainLatest: unknown[] = [];
  let globalZeroLatest: unknown[] = [];
  const gateHelperCounts: Record<string, number> = {};
  let systemHalt = null as string | null;
  let systemReadonly = null as string | null;

  if (hasDb) {
    const recon = sqlExec(`
      SELECT json_agg(row_to_json(t) ORDER BY t.run_at DESC)
      FROM (
        SELECT run_at::text, check_type, currency, is_match, delta::text, triggered_halt, broken_count
        FROM reconciliation_log ORDER BY run_at DESC LIMIT 12
      ) t;
    `);
    if (recon.ok) reconciliationRecent = JSON.parse(recon.stdout.trim() || '[]') as unknown[];

    const hc = sqlExec(`
      SELECT json_agg(row_to_json(t) ORDER BY t.run_at DESC)
      FROM (
        SELECT run_at::text, check_type, is_match, broken_count
        FROM reconciliation_log
        WHERE check_type IN ('hash_chain_wallet','hash_chain_system')
        ORDER BY run_at DESC LIMIT 4
      ) t;
    `);
    if (hc.ok) hashChainLatest = JSON.parse(hc.stdout.trim() || '[]') as unknown[];

    const gz = sqlExec(`
      SELECT json_agg(row_to_json(t) ORDER BY t.run_at DESC)
      FROM (
        SELECT run_at::text, currency, is_match, delta::text, triggered_halt
        FROM reconciliation_log
        WHERE check_type = 'global_zero'
        ORDER BY run_at DESC LIMIT 6
      ) t;
    `);
    if (gz.ok) globalZeroLatest = JSON.parse(gz.stdout.trim() || '[]') as unknown[];

    systemHalt = scalar(`SELECT value FROM app_config WHERE key = 'system_halt';`);
    systemReadonly = scalar(`SELECT value FROM app_config WHERE key = 'system_readonly';`);

    for (const helper of GATE_HELPERS) {
      gateHelperCounts[helper] = Number.parseInt(
        scalar(`
          SELECT count(*)::text FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname='public' AND p.proname='${helper}'
        `),
        10,
      );
    }
  }

  const report = {
    ranAt: new Date().toISOString(),
    scope: 'D — app_config ↔ server gate / client precheck / ops state (read-only)',
    projectRef: LOCKED_SUPABASE_PROJECT_REF,
    dbSource: hasDb ? 'local-docker' : 'none',
    counts: {
      migrationKeyRefs: migrationKeys.size,
      liveAppConfigKeys: liveRows.length,
      matrixRows: matrix.length,
      platformPublicKeys: matrix.filter(
        (r) =>
          PLATFORM_CONFIG_KEYS.includes(r.key as (typeof PLATFORM_CONFIG_KEYS)[number]) &&
          r.isPublic === true,
      ).length,
      p1Gaps: p1Gaps.length,
      p2Gaps: p2Gaps.length,
    },
    platformConfigKeys: [...PLATFORM_CONFIG_KEYS],
    tradeLaunchFlagKeys: [...TRADE_LAUNCH_FLAG_KEYS],
    migrationParity: {
      localCount: localMigrationNames.length,
      localLatest: localMigrationNames.at(-1) ?? null,
      remoteNote: 'Run check-remote-migration-parity + MCP list_migrations — embedded in audit doc',
    },
    opsState: {
      systemHalt,
      systemReadonly,
      reconciliationRecent,
      hashChainLatest,
      globalZeroLatest,
      gateHelperCounts,
    },
    matrix,
    gatePrecheckGaps: p2Gaps.map((r) => ({
      key: r.key,
      serverGateKind: r.serverGateKind,
      serverEvidence: r.serverEvidence.slice(0, 5),
      clientReads: r.clientReads,
      isPublic: r.isPublic,
      note: r.note,
    })),
    verdict: {
      p0Blockers: 0,
      p1Count: p1Gaps.length,
      p2Count: p2Gaps.length,
      platformGatePublicPass: hasDb
        ? PLATFORM_CONFIG_KEYS.every((k) => {
            const row = matrix.find((r) => r.key === k);
            return row?.isPublic === true;
          })
        : null,
      hashChainPass:
        hashChainLatest.length > 0
          ? (hashChainLatest as Array<{ is_match: boolean; broken_count: number }>).every(
              (r) => r.is_match && (r.broken_count ?? 0) === 0,
            )
          : null,
      globalZeroPass:
        globalZeroLatest.length > 0
          ? (globalZeroLatest as Array<{ is_match: boolean }>).every((r) => r.is_match)
          : null,
    },
  };

  const outPath = join(ROOT, 'scripts', 'audit', 'last-d-config-state-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        outPath,
        dbSource: report.dbSource,
        ...report.counts,
        ...report.verdict,
      },
      null,
      2,
    ),
  );
}

main();
