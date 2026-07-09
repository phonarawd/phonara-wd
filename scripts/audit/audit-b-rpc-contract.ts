#!/usr/bin/env tsx
/**
 * Section B — RPC contract / error mapping / RLS SELECT / realtime publication audit (read-only).
 * Writes JSON to scripts/audit/last-b-rpc-contract-report.json
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findSupabaseDbContainer } from '../lib/db-connect.ts';
import { sqlExec } from '../pentest/lib/sql-rpc.ts';

type AppScope = 'web' | 'admin';

interface RpcCallSite {
  app: AppScope;
  file: string;
  line: number;
  rpc: string;
  argKeys: string[];
  argKeysSource: 'literal' | 'empty' | 'dynamic' | 'unknown';
}

interface LiveRpcSig {
  name: string;
  args: string;
  argNames: string[];
  requiredArgNames: string[];
  authenticated: boolean;
}

interface ErrorMappingRow {
  code: string;
  sources: string[];
  mappedNeedle: string | null;
  mappedKey: string | null;
  verdict: 'mapped' | 'unmapped' | 'duplicate_needle' | 'misordered';
}

interface TableAccessRow {
  table: string;
  app: AppScope;
  files: string[];
  authSelect: boolean | null;
  anonSelect: boolean | null;
  rlsEnabled: boolean | null;
}

interface RealtimeRow {
  table: string;
  files: string[];
  inPublication: boolean | null;
}

interface TypesRpcSig {
  name: string;
  argNames: string[];
  optionalArgNames: string[];
}

const ROOT = process.cwd();
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');
const ADMIN_SRC = join(ROOT, 'apps', 'admin', 'src');
const TYPES_PATH = join(ROOT, 'packages', 'shared-types', 'src', 'database.types.ts');
const TRANSLATE_ERROR_PATH = join(ROOT, 'packages', 'i18n', 'src', 'translate-error.ts');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      out.push(...walkTsFiles(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function lineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function loadRpcConstants(files: string[]): Map<string, string> {
  const map = new Map<string, string>();
  const constRe = /export\s+const\s+([A-Z0-9_]+)\s*=\s*['"](rpc_[a-z0-9_]+)['"]/g;
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = constRe.exec(content)) !== null) {
      map.set(m[1], m[2]);
    }
  }
  return map;
}

function resolveRpcName(raw: string, constants: Map<string, string>): string | null {
  const trimmed = raw.trim();
  if (/^rpc_[a-z0-9_]+$/.test(trimmed)) return trimmed;
  if (/^[A-Z][A-Z0-9_]+$/.test(trimmed) && constants.has(trimmed)) {
    return constants.get(trimmed) ?? null;
  }
  const asCast = trimmed.match(/^['"](rpc_[a-z0-9_]+)['"]/);
  if (asCast) return asCast[1];
  return null;
}

function extractArgKeys(snippet: string): { keys: string[]; source: RpcCallSite['argKeysSource'] } {
  const objMatch = snippet.match(/\{([\s\S]*?)\}/);
  if (!objMatch) {
    if (/\(\s*\)/.test(snippet) || /,\s*\{\s*\}/.test(snippet)) {
      return { keys: [], source: 'empty' };
    }
    return { keys: [], source: 'unknown' };
  }
  const body = objMatch[1];
  if (/\.\.\./.test(body) || /\bargs\b/.test(body) || /\bparams\b/.test(body)) {
    return { keys: [], source: 'dynamic' };
  }
  const keys = [...body.matchAll(/\b(p_[a-z0-9_]+)\s*:/g)].map((m) => m[1]);
  return { keys: [...new Set(keys)], source: keys.length ? 'literal' : 'empty' };
}

function scanRpcCalls(
  app: AppScope,
  srcRoot: string,
  constants: Map<string, string>,
): RpcCallSite[] {
  const files = walkTsFiles(srcRoot);
  const calls: RpcCallSite[] = [];
  const patterns: RegExp[] = [
    /(?:callRpc|supabase\.rpc|\.rpc)\s*\(\s*([^,)]+)/g,
    /(?:^|[^\w])rpc\s*\(\s*([^,)]+)/g,
    /sportsRpc<[^>]*>\s*\(\s*['"](rpc_[a-z0-9_]+)['"]/g,
    /sportsRpc<[^>]*>\s*\(\s*\n\s*['"](rpc_[a-z0-9_]+)['"]/g,
    /(?:callRpc|supabase\.rpc|\.rpc)\s*\(\s*\n\s*['"](rpc_[a-z0-9_]+)['"]/g,
    /(?:callRpc|supabase\.rpc|\.rpc)\s*\(\s*['"](rpc_[a-z0-9_]+)['"]\s+as\s+never/g,
  ];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const callRe of patterns) {
      callRe.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = callRe.exec(content)) !== null) {
        const rawName = m[1].replace(/^['"]|['"]$/g, '').trim();
        const rpc = resolveRpcName(rawName, constants);
        if (!rpc) continue;
        const snippet = content.slice(m.index, m.index + 800);
        const { keys, source } = extractArgKeys(snippet);
        calls.push({
          app,
          file: relative(ROOT, file).replace(/\\/g, '/'),
          line: lineNumber(content, m.index),
          rpc,
          argKeys: keys,
          argKeysSource: source,
        });
      }
    }
  }
  return calls;
}

function parseTypesRpcSigs(): TypesRpcSig[] {
  const content = readFileSync(TYPES_PATH, 'utf8');
  const publicIdx = content.indexOf('public: {');
  const functionsIdx = content.indexOf('Functions: {', publicIdx);
  if (functionsIdx < 0) return [];
  const slice = content.slice(functionsIdx);
  const sigs: TypesRpcSig[] = [];
  const fnRe = /^\s+(rpc_[a-z0-9_]+):\s*\{[\s\S]*?Args:\s*\{([\s\S]*?)\}/gm;
  let m: RegExpExecArray | null;
  while ((m = fnRe.exec(slice)) !== null) {
    const name = m[1];
    const argsBlock = m[2];
    const argNames: string[] = [];
    const optionalArgNames: string[] = [];
    for (const line of argsBlock.split('\n')) {
      const km = line.match(/^\s+(p_[a-z0-9_]+)(\?)?:/);
      if (!km) continue;
      argNames.push(km[1]);
      if (km[2]) optionalArgNames.push(km[1]);
    }
    sigs.push({ name, argNames, optionalArgNames });
  }
  return sigs;
}

function parseTranslateErrorNeedles(): Array<{ needle: string; key: string }> {
  const content = readFileSync(TRANSLATE_ERROR_PATH, 'utf8');
  const rows: Array<{ needle: string; key: string }> = [];
  const re = /\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    rows.push({ needle: m[1], key: m[2] });
  }
  return rows;
}

function extractRaiseCodesFromMigrations(): Map<string, Set<string>> {
  const byFile = new Map<string, Set<string>>();
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
  const patterns = [
    /RAISE\s+EXCEPTION\s+'([a-z][a-z0-9_]*)'/gi,
    /RAISE\s+EXCEPTION\s+'%',\s*'([a-z][a-z0-9_]*)'/gi,
    /RAISE\s+EXCEPTION\s+USING\s+MESSAGE\s*=\s*'([a-z][a-z0-9_]*)'/gi,
  ];
  for (const file of files) {
    const content = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    const codes = new Set<string>();
    for (const re of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) {
        const code = m[1].toLowerCase();
        if (code.length >= 3 && !code.startsWith('p_') && /^[a-z][a-z0-9_]+$/.test(code)) {
          codes.add(code);
        }
      }
    }
    if (codes.size) byFile.set(file, codes);
  }
  return byFile;
}

function extractRaiseCodesFromLiveDefs(defs: string[]): Set<string> {
  const codes = new Set<string>();
  const patterns = [
    /RAISE\s+EXCEPTION\s+'([a-z][a-z0-9_]*)'/gi,
    /RAISE\s+EXCEPTION\s+'%',\s*'([a-z][a-z0-9_]*)'/gi,
  ];
  for (const def of defs) {
    for (const re of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(def)) !== null) {
        const code = m[1].toLowerCase();
        if (code.length >= 3) codes.add(code);
      }
    }
  }
  return codes;
}

function parseArgNames(identityArgs: string): { names: string[]; required: string[] } {
  if (!identityArgs.trim()) return { names: [], required: [] };
  const parts = identityArgs.split(',').map((p) => p.trim());
  const names: string[] = [];
  const required: string[] = [];
  for (const part of parts) {
    const nm = part.split(/\s+/)[0]?.trim();
    if (!nm || !nm.startsWith('p_')) continue;
    names.push(nm);
    if (!part.includes('DEFAULT')) required.push(nm);
  }
  return { names, required };
}

function loadLiveRpcSigs(): LiveRpcSig[] {
  const raw = sqlExec(`
    SELECT json_agg(row_to_json(t) ORDER BY t.name, t.args)
    FROM (
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args,
             pg_get_functiondef(p.oid) AS def,
             has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname LIKE 'rpc_%'
    ) t;
  `);
  if (!raw.ok) throw new Error(raw.error);
  const rows = JSON.parse(raw.stdout.trim() || '[]') as Array<{
    name: string;
    args: string;
    def: string;
    authenticated: boolean;
  }>;
  return rows.map((r) => {
    const parsed = parseArgNames(r.args);
    return {
      name: r.name,
      args: r.args,
      argNames: parsed.names,
      requiredArgNames: parsed.required,
      authenticated: r.authenticated,
    };
  });
}

function loadLiveRaiseDefs(): string[] {
  const raw = sqlExec(`
    SELECT json_agg(pg_get_functiondef(p.oid))
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (p.proname LIKE 'rpc_%' OR p.proname LIKE '\\_%' ESCAPE '\\');
  `);
  if (!raw.ok) return [];
  return (JSON.parse(raw.stdout.trim() || '[]') as string[] | null) ?? [];
}

function loadTablePrivileges(tables: string[]): TableAccessRow[] {
  const lit = tables.map((t) => `'${t.replace(/'/g, "''")}'`).join(', ');
  const raw = sqlExec(`
    SELECT json_agg(row_to_json(t) ORDER BY t.table_name)
    FROM (
      SELECT c.relname AS table_name,
             c.relrowsecurity AS rls_enabled,
             has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select,
             has_table_privilege('anon', c.oid, 'SELECT') AS anon_select
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND c.relname IN (${lit})
    ) t;
  `);
  if (!raw.ok) throw new Error(raw.error);
  const rows = JSON.parse(raw.stdout.trim() || '[]') as Array<{
    table_name: string;
    rls_enabled: boolean;
    auth_select: boolean;
    anon_select: boolean;
  }>;
  const byName = new Map(rows.map((r) => [r.table_name, r]));
  return tables.map((table) => {
    const row = byName.get(table);
    return {
      table,
      app: 'web' as AppScope,
      files: [],
      authSelect: row?.auth_select ?? null,
      anonSelect: row?.anon_select ?? null,
      rlsEnabled: row?.rls_enabled ?? null,
    };
  });
}

function loadPublicationTables(): Set<string> {
  const raw = sqlExec(`
    SELECT json_agg(pt.tablename ORDER BY pt.tablename)
    FROM pg_publication_tables pt
    WHERE pt.pubname = 'supabase_realtime';
  `);
  if (!raw.ok) throw new Error(raw.error);
  return new Set((JSON.parse(raw.stdout.trim() || '[]') as string[] | null) ?? []);
}

function scanFromTables(app: AppScope, srcRoot: string): Map<string, string[]> {
  const files = walkTsFiles(srcRoot);
  const tables = new Map<string, string[]>();
  const re = /\.from\(\s*['"]([a-z_][a-z0-9_]*)['"]\s*\)/g;
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const table = m[1];
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      const list = tables.get(table) ?? [];
      if (!list.includes(rel)) list.push(rel);
      tables.set(table, list);
    }
  }
  return tables;
}

function scanRealtimeTables(srcRoot: string): Map<string, string[]> {
  const files = walkTsFiles(srcRoot);
  const tables = new Map<string, string[]>();
  const re = /useRealtime\(\s*\{[\s\S]*?table:\s*['"]([a-z_][a-z0-9_]*)['"]/g;
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const table = m[1];
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      const list = tables.get(table) ?? [];
      if (!list.includes(rel)) list.push(rel);
      tables.set(table, list);
    }
  }
  return tables;
}

function simulateTranslateError(
  code: string,
  needles: Array<{ needle: string; key: string }>,
): { needle: string | null; key: string | null } {
  const msg = `error: ${code}`.toLowerCase();
  for (const { needle, key } of needles) {
    if (msg.includes(needle)) return { needle, key };
  }
  return { needle: null, key: null };
}

function dedupeCalls(calls: RpcCallSite[]): RpcCallSite[] {
  const seen = new Map<string, RpcCallSite>();
  for (const c of calls) {
    const key = `${c.app}:${c.rpc}`;
    const prev = seen.get(key);
    if (!prev) {
      seen.set(key, c);
      continue;
    }
    if (c.argKeysSource === 'literal' && prev.argKeysSource !== 'literal') {
      seen.set(key, c);
    }
  }
  return [...seen.values()];
}

function main(): void {
  const hasDb = !!(findSupabaseDbContainer() || process.env.SUPABASE_DB_URL);

  const webFiles = walkTsFiles(WEB_SRC);
  const adminFiles = walkTsFiles(ADMIN_SRC);
  const webConstants = loadRpcConstants(webFiles);
  const adminConstants = loadRpcConstants(adminFiles);
  const allConstants = new Map([...webConstants, ...adminConstants]);

  const webCallsRaw = scanRpcCalls('web', WEB_SRC, allConstants);
  const adminCallsRaw = scanRpcCalls('admin', ADMIN_SRC, allConstants);
  const webCalls = dedupeCalls(webCallsRaw);
  const adminCalls = dedupeCalls(adminCallsRaw);

  const typesSigs = parseTypesRpcSigs();
  const typesByName = new Map(typesSigs.map((s) => [s.name, s]));

  const needles = parseTranslateErrorNeedles();
  const needleCounts = new Map<string, number>();
  for (const n of needles) {
    needleCounts.set(n.needle, (needleCounts.get(n.needle) ?? 0) + 1);
  }

  const migrationCodes = extractRaiseCodesFromMigrations();
  const allMigrationCodes = new Set<string>();
  for (const codes of migrationCodes.values()) {
    for (const c of codes) allMigrationCodes.add(c);
  }

  let liveSigs: LiveRpcSig[] = [];
  let liveRaiseCodes = new Set<string>();
  let publicationTables = new Set<string>();
  let dbSource: 'local' | 'unavailable' = 'unavailable';

  if (hasDb) {
    dbSource = 'local';
    liveSigs = loadLiveRpcSigs();
    liveRaiseCodes = extractRaiseCodesFromLiveDefs(loadLiveRaiseDefs());
    publicationTables = loadPublicationTables();
  }

  const liveByName = new Map<string, LiveRpcSig[]>();
  for (const sig of liveSigs) {
    const list = liveByName.get(sig.name) ?? [];
    list.push(sig);
    liveByName.set(sig.name, list);
  }

  const rpcContractGaps: Array<{
    app: AppScope;
    rpc: string;
    gap: string;
    clientArgs: string[];
    liveArgs: string[];
    typesArgs: string[];
    evidence: string;
    severity: 'P1' | 'P2' | 'P3';
  }> = [];

  for (const call of [...webCalls, ...adminCalls]) {
    const live = liveByName.get(call.rpc);
    const types = typesByName.get(call.rpc);
    const evidence = `${call.file}:${call.line}`;

    if (hasDb && !live?.length) {
      rpcContractGaps.push({
        app: call.app,
        rpc: call.rpc,
        gap: 'PGRST202_function_not_found',
        clientArgs: call.argKeys,
        liveArgs: [],
        typesArgs: types?.argNames ?? [],
        evidence,
        severity: 'P1',
      });
      continue;
    }

    if (types && hasDb && live?.length) {
      const sig = live.find((s) => s.argNames.join(',') === types.argNames.join(',')) ?? live[0];
      const typesSet = new Set(types.argNames);
      const liveSet = new Set(sig.argNames);
      const missingInTypes = sig.argNames.filter((a) => !typesSet.has(a));
      const extraInTypes = types.argNames.filter((a) => !liveSet.has(a));
      if (missingInTypes.length || extraInTypes.length) {
        rpcContractGaps.push({
          app: call.app,
          rpc: call.rpc,
          gap: 'database_types_drift',
          clientArgs: call.argKeys,
          liveArgs: sig.argNames,
          typesArgs: types.argNames,
          evidence: `${evidence} · types:${TYPES_PATH}`,
          severity: 'P2',
        });
      }
    }

    if (call.argKeysSource === 'literal' && hasDb && live?.length) {
      const sig = live[0];
      const extraClient = call.argKeys.filter((k) => !sig.argNames.includes(k));
      const missingRequired = sig.requiredArgNames.filter((k) => !call.argKeys.includes(k));
      if (extraClient.length) {
        rpcContractGaps.push({
          app: call.app,
          rpc: call.rpc,
          gap: 'PGRST300_extra_client_args',
          clientArgs: call.argKeys,
          liveArgs: sig.argNames,
          typesArgs: types?.argNames ?? [],
          evidence,
          severity: 'P1',
        });
      }
      if (missingRequired.length) {
        rpcContractGaps.push({
          app: call.app,
          rpc: call.rpc,
          gap: 'missing_required_args',
          clientArgs: call.argKeys,
          liveArgs: sig.requiredArgNames,
          typesArgs: types?.argNames ?? [],
          evidence,
          severity: 'P1',
        });
      }
    }
  }

  const raiseUnion = new Set([...allMigrationCodes, ...liveRaiseCodes]);
  const errorRows: ErrorMappingRow[] = [];
  for (const code of [...raiseUnion].sort()) {
    const sim = simulateTranslateError(code, needles);
    const sources: string[] = [];
    if (allMigrationCodes.has(code)) sources.push('migrations');
    if (liveRaiseCodes.has(code)) sources.push('live_db');
    let verdict: ErrorMappingRow['verdict'] = sim.key ? 'mapped' : 'unmapped';
    if ((needleCounts.get(code) ?? 0) > 1) verdict = 'duplicate_needle';
    if (code === 'market_not_found') verdict = 'duplicate_needle';
    if (code === 'affiliate_self_forbidden' && sim.needle === 'forbidden') {
      verdict = 'misordered';
    }
    errorRows.push({
      code,
      sources,
      mappedNeedle: sim.needle,
      mappedKey: sim.key,
      verdict,
    });
  }

  const unmappedErrors = errorRows.filter((r) => r.verdict === 'unmapped');
  const duplicateNeedles = errorRows.filter((r) => r.verdict === 'duplicate_needle');
  const misordered = errorRows.filter((r) => r.verdict === 'misordered');

  const webFrom = scanFromTables('web', WEB_SRC);
  const adminFrom = scanFromTables('admin', ADMIN_SRC);
  const allFromTables = [...new Set([...webFrom.keys(), ...adminFrom.keys()])].sort();

  let tableAccess: TableAccessRow[];
  if (hasDb && allFromTables.length) {
    tableAccess = loadTablePrivileges(allFromTables);
    for (const row of tableAccess) {
      row.files = [...(webFrom.get(row.table) ?? []), ...(adminFrom.get(row.table) ?? [])];
      row.app = (adminFrom.has(row.table) ? 'admin' : 'web') as AppScope;
      if (webFrom.has(row.table) && adminFrom.has(row.table)) row.app = 'web';
    }
  } else {
    tableAccess = allFromTables.map((table) => ({
      table,
      app: 'web' as AppScope,
      files: [...(webFrom.get(table) ?? []), ...(adminFrom.get(table) ?? [])],
      authSelect: null,
      anonSelect: null,
      rlsEnabled: null,
    }));
  }

  const tableGaps = tableAccess.filter((t) => t.authSelect === false);

  const rtTables = scanRealtimeTables(WEB_SRC);
  const realtimeRows: RealtimeRow[] = [...rtTables.entries()].map(([table, files]) => ({
    table,
    files,
    inPublication: hasDb ? publicationTables.has(table) : null,
  }));
  const publicationGaps = realtimeRows.filter((r) => r.inPublication === false);

  const report = {
    ranAt: new Date().toISOString(),
    scope: 'B — RPC contract / error mapping / RLS SELECT / realtime publication (read-only)',
    dbSource,
    counts: {
      webRpcUnique: webCalls.length,
      adminRpcUnique: adminCalls.length,
      webRpcCallSites: webCallsRaw.length,
      adminRpcCallSites: adminCallsRaw.length,
      liveRpcOverloads: liveSigs.length,
      raiseCodesMigration: allMigrationCodes.size,
      raiseCodesLive: liveRaiseCodes.size,
      translateNeedles: needles.length,
      clientFromTables: allFromTables.length,
      realtimeSubscriptions: realtimeRows.length,
      publicationTableCount: publicationTables.size,
    },
    rpcInventory: {
      web: webCalls.map((c) => ({
        rpc: c.rpc,
        argKeys: c.argKeys,
        evidence: `${c.file}:${c.line}`,
      })),
      admin: adminCalls.map((c) => ({
        rpc: c.rpc,
        argKeys: c.argKeys,
        evidence: `${c.file}:${c.line}`,
      })),
    },
    rpcContractGaps,
    errorMapping: {
      duplicateNeedlesInMap: [...needleCounts.entries()]
        .filter(([, n]) => n > 1)
        .map(([needle, count]) => ({ needle, count })),
      unmapped: unmappedErrors,
      duplicateNeedle: duplicateNeedles,
      misordered,
      phaseECandidates: unmappedErrors
        .filter((r) =>
          [
            'order_not_found',
            'post_only_would_cross',
            'invalid_time_in_force',
            'market_hedge_blocked',
            'sports_user_banned',
            'withdrawal_address_not_whitelisted',
            'geo_blocked',
          ].includes(r.code),
        )
        .map((r) => r.code),
    },
    tableAccess,
    tableGaps,
    realtime: {
      rows: realtimeRows,
      publicationGaps,
      publicationTables: hasDb ? [...publicationTables].sort() : null,
    },
    verdict: {
      rpcContractPass: rpcContractGaps.filter((g) => g.severity === 'P1').length === 0,
      p1RpcGaps: rpcContractGaps.filter((g) => g.severity === 'P1').length,
      unmappedErrorCount: unmappedErrors.length,
      publicationGapCount: publicationGaps.length,
      tableSelectGapCount: tableGaps.length,
    },
  };

  const outPath = join(ROOT, 'scripts', 'audit', 'last-b-rpc-contract-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        outPath,
        dbSource,
        ...report.counts,
        ...report.verdict,
      },
      null,
      2,
    ),
  );
}

main();
