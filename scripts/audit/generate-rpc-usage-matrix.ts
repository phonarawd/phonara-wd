#!/usr/bin/env bun
/**
 * database.types.ts rpc_* ↔ apps/web|admin call-site cross matrix.
 * SA-04 — also cross-references Edge Functions (supabase/functions/**) and
 * SQL (supabase/migrations|tests/**) so "unused in apps" is split into
 * genuine cross-use (edge/cron/internal/test-only) vs true dead candidates.
 * Output: docs/audit/RPC_USAGE_MATRIX.md (+ .json)
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'docs', 'audit');
const TYPES_PATH = join(ROOT, 'packages', 'shared-types', 'src', 'database.types.ts');
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');
const ADMIN_SRC = join(ROOT, 'apps', 'admin', 'src');
const EDGE_FUNCTIONS_DIR = join(ROOT, 'supabase', 'functions');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');
const SQL_TESTS_DIR = join(ROOT, 'supabase', 'tests');

type AppScope = 'web' | 'admin';
type CrossUseScope = 'edge' | 'sql_cron_or_internal' | 'sql_test_only' | 'none';

type CallSite = {
  app: AppScope;
  file: string;
  line: number;
  rpc: string;
};

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
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
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '');
  if (/^rpc_[a-z0-9_]+$/.test(trimmed)) return trimmed;
  if (/^[A-Z][A-Z0-9_]+$/.test(trimmed) && constants.has(trimmed)) {
    return constants.get(trimmed) ?? null;
  }
  const asCast = trimmed.match(/^(rpc_[a-z0-9_]+)/);
  if (asCast) return asCast[1];
  return null;
}

function scanRpcCalls(app: AppScope, srcRoot: string, constants: Map<string, string>): CallSite[] {
  const files = walkTsFiles(srcRoot);
  const calls: CallSite[] = [];
  const patterns: RegExp[] = [
    /(?:callRpc|supabase\.rpc|\.rpc)\s*\(\s*([^,)\n]+)/g,
    /sportsRpc<[^>]*>\s*\(\s*['"](rpc_[a-z0-9_]+)['"]/g,
    /['"](rpc_[a-z0-9_]+)['"]\s+as\s+(?:const\s+)?(?:never|RpcFn|keyof)/g,
  ];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    // Also catch string literals that are clearly RPC names in invoke helpers
    const litRe = /['"](rpc_[a-z0-9_]+)['"]/g;
    let lm: RegExpExecArray | null;
    const literalHits = new Set<string>();
    while ((lm = litRe.exec(content)) !== null) {
      literalHits.add(lm[1]);
    }

    for (const callRe of patterns) {
      callRe.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = callRe.exec(content)) !== null) {
        const rpc = resolveRpcName(m[1], constants);
        if (!rpc) continue;
        calls.push({ app, file: rel, line: lineNumber(content, m.index), rpc });
      }
    }

    // Include typed string constants / RPC name tables when file already references callRpc/supabase.rpc
    if (/callRpc|supabase\.rpc|\.rpc\s*\(/.test(content)) {
      for (const rpc of literalHits) {
        if (calls.some((c) => c.file === rel && c.rpc === rpc)) continue;
        const idx =
          content.indexOf(`'${rpc}'`) >= 0
            ? content.indexOf(`'${rpc}'`)
            : content.indexOf(`"${rpc}"`);
        if (idx < 0) continue;
        calls.push({ app, file: rel, line: lineNumber(content, idx), rpc });
      }
    }
  }
  return calls;
}

/** Edge Functions call rpc_* via `supabase.rpc('rpc_name', ...)` / `service.rpc(...)`. */
function scanEdgeRpcCalls(): Set<string> {
  const found = new Set<string>();
  if (!existsDir(EDGE_FUNCTIONS_DIR)) return found;
  const files = walkTsFiles(EDGE_FUNCTIONS_DIR).filter((f) => !f.endsWith('.test.ts'));
  const callRe = /\.rpc\(\s*['"](rpc_[a-z0-9_]+)['"]/g;
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    callRe.lastIndex = 0;
    while ((m = callRe.exec(content)) !== null) {
      found.add(m[1]!);
    }
  }
  return found;
}

/**
 * SQL cross-use: an rpc_* name appearing anywhere in migrations OUTSIDE of its
 * own CREATE/DROP/REVOKE/GRANT declaration lines — i.e. inside a
 * `cron.schedule(...)` body, another function's body calling it internally
 * (including via a `_*_logged()` wrapper that itself contains the literal
 * name), or a comment/doc reference. This is a text cross-reference, not a
 * call graph — sufficient to separate "something in SQL still names this"
 * from "nothing outside its own definition ever mentions it".
 */
function scanSqlCrossUse(rpcNames: string[]): {
  cronOrInternal: Set<string>;
  testOnly: Set<string>;
} {
  const declLineRe = /^(?:CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION|DROP\s+FUNCTION|REVOKE|GRANT)\b/i;
  const cronOrInternal = new Set<string>();
  const testOnly = new Set<string>();

  const migrationFiles = existsDir(MIGRATIONS_DIR)
    ? readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .map((f) => join(MIGRATIONS_DIR, f))
    : [];
  const testFiles = existsDir(SQL_TESTS_DIR)
    ? readdirSync(SQL_TESTS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .map((f) => join(SQL_TESTS_DIR, f))
    : [];

  for (const rpc of rpcNames) {
    const callRe = new RegExp(`\\b${rpc}\\s*\\(`, 'g');
    let hitInMigrations = false;
    for (const file of migrationFiles) {
      const lines = readFileSync(file, 'utf8').split('\n');
      for (const line of lines) {
        if (declLineRe.test(line.trim()) && line.includes(rpc)) continue;
        callRe.lastIndex = 0;
        if (callRe.test(line)) {
          hitInMigrations = true;
          break;
        }
      }
      if (hitInMigrations) break;
    }
    if (hitInMigrations) {
      cronOrInternal.add(rpc);
      continue;
    }

    let hitInTests = false;
    for (const file of testFiles) {
      const content = readFileSync(file, 'utf8');
      callRe.lastIndex = 0;
      if (callRe.test(content)) {
        hitInTests = true;
        break;
      }
    }
    if (hitInTests) testOnly.add(rpc);
  }

  return { cronOrInternal, testOnly };
}

/**
 * ZA-02 — domain grouping for the flat rpc_* list (previously alphabetical only).
 * Two independent signals are combined:
 *   1. Name-based keyword classification (fast, but ambiguous for cross-domain
 *      words like "stake"/"roulette" — see AMBIGUOUS_NAME_HINTS below).
 *   2. Call-site path classification (which app feature/surface folder actually
 *      calls it) — a stronger signal when it disagrees with the name guess.
 * When the two disagree, the RPC is reported under "ambiguous" rather than
 * silently picked one way, so the doc keeps the ZA-02 uncertainty visible
 * instead of hiding it behind a confident-looking bucket.
 */
type Domain =
  | 'admin'
  | 'service'
  | 'earn'
  | 'trading'
  | 'sports'
  | 'wallet'
  | 'casino'
  | 'identity'
  | 'platform'
  | 'unclassified';

const DOMAIN_LABEL: Record<Domain, string> = {
  admin: 'Admin',
  service: 'Platform/Service (internal)',
  earn: 'Earn/Mission/Referral/Tier/Staking',
  trading: 'Trading (Spot/Futures/Margin/Oracle)',
  sports: 'Sports',
  wallet: 'Wallet/Ledger/Payments',
  casino: 'Casino (games/PF)',
  identity: 'Identity/Auth/Compliance/RG',
  platform: 'Platform/Ops/Marketing/CMS',
  unclassified: 'Unclassified (no strong signal)',
};

/**
 * Known ambiguous name fragments (ZA-02 finding) — same keyword, different
 * domains depending on which specific RPC/call-site it is. Listed so the
 * generator's own naming-guide output stays honest about what it cannot
 * resolve from the name alone.
 */
const AMBIGUOUS_NAME_HINTS = ['stake', 'roulette'];

function classifyByName(rpc: string): Domain {
  if (/^rpc_admin_/.test(rpc)) return 'admin';
  if (/^rpc_service_/.test(rpc)) return 'service';
  if (/(futures|spot|margin|oracle|liquidat|leverage|funding|order_book|candle)/.test(rpc))
    return 'trading';
  if (/(sports|fixture|odds_)/.test(rpc)) return 'sports';
  if (/(withdraw|deposit|ledger|transfer_to_user|giftcard|krw_)/.test(rpc)) return 'wallet';
  if (
    /(game_bet|game_round|live_crash|reveal_game|blackjack|mines|hilo|plinko|dice_|crash_|paytable)/.test(
      rpc,
    )
  )
    return 'casino';
  if (/(kyc|self_exclusion|consent|aal2|mfa|siwe|passkey|sanction)/.test(rpc)) return 'identity';
  if (
    /(mission|referral|tier|stake|attendance|earn_hub|viral|welcome_bonus|wagering|roulette)/.test(
      rpc,
    )
  )
    return 'earn';
  if (/(cms|reconciliation|platform_status|ops_|health)/.test(rpc)) return 'platform';
  return 'unclassified';
}

function classifyByCallSites(sites: CallSite[]): Domain | null {
  const pathHints: Array<[RegExp, Domain]> = [
    [/\/features\/earn\//, 'earn'],
    [/\/features\/trading\//, 'trading'],
    [/\/features\/sports\//, 'sports'],
    [/\/surfaces\/trade\//, 'trading'],
    [/\/surfaces\/sports\//, 'sports'],
    [/\/surfaces\/(games|casino)\//, 'casino'],
    [/\/surfaces\/wallet\//, 'wallet'],
    [/\/surfaces\/staking\//, 'earn'],
    [/^apps\/admin\//, 'admin'],
  ];
  for (const site of sites) {
    for (const [re, domain] of pathHints) {
      if (re.test(site.file)) return domain;
    }
  }
  return null;
}

function resolveDomain(rpc: string, sites: CallSite[]): { domain: Domain; ambiguous: boolean } {
  const byName = classifyByName(rpc);
  const bySite = classifyByCallSites(sites);
  if (bySite && bySite !== byName && byName !== 'unclassified') {
    return { domain: byName, ambiguous: true };
  }
  if (byName === 'unclassified' && bySite) {
    return { domain: bySite, ambiguous: false };
  }
  return { domain: byName, ambiguous: AMBIGUOUS_NAME_HINTS.some((h) => rpc.includes(h)) };
}

function existsDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function classifyCrossUse(
  rpc: string,
  edgeUsed: Set<string>,
  sqlCronOrInternal: Set<string>,
  sqlTestOnly: Set<string>,
): CrossUseScope {
  if (edgeUsed.has(rpc)) return 'edge';
  if (sqlCronOrInternal.has(rpc)) return 'sql_cron_or_internal';
  if (sqlTestOnly.has(rpc)) return 'sql_test_only';
  return 'none';
}

function parseTypesRpcNames(): string[] {
  const content = readFileSync(TYPES_PATH, 'utf8');
  const publicIdx = content.indexOf('public: {');
  const functionsIdx = content.indexOf('Functions: {', publicIdx);
  if (functionsIdx < 0) return [];
  const slice = content.slice(functionsIdx);
  const names = new Set<string>();
  const fnRe = /^\s+(rpc_[a-z0-9_]+):\s*\{/gm;
  let m: RegExpExecArray | null;
  while ((m = fnRe.exec(slice)) !== null) {
    names.add(m[1]);
  }
  return [...names].sort();
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const typesRpcs = parseTypesRpcNames();
  const allFiles = [...walkTsFiles(WEB_SRC), ...walkTsFiles(ADMIN_SRC)];
  const constants = loadRpcConstants(allFiles);
  const calls = [
    ...scanRpcCalls('web', WEB_SRC, constants),
    ...scanRpcCalls('admin', ADMIN_SRC, constants),
  ];

  const byRpc = new Map<string, CallSite[]>();
  for (const c of calls) {
    const list = byRpc.get(c.rpc) ?? [];
    list.push(c);
    byRpc.set(c.rpc, list);
  }

  const usedInTypes = typesRpcs.filter((r) => byRpc.has(r));
  const unusedInApps = typesRpcs.filter((r) => !byRpc.has(r));
  const orphanCalls = [...byRpc.keys()].filter((r) => !typesRpcs.includes(r)).sort();

  const edgeUsed = scanEdgeRpcCalls();
  const { cronOrInternal: sqlCronOrInternal, testOnly: sqlTestOnly } =
    scanSqlCrossUse(unusedInApps);
  const crossUse = new Map<string, CrossUseScope>();
  for (const rpc of unusedInApps) {
    crossUse.set(rpc, classifyCrossUse(rpc, edgeUsed, sqlCronOrInternal, sqlTestOnly));
  }
  const trulyUnused = unusedInApps.filter((r) => crossUse.get(r) === 'none');
  const crossUseCount = unusedInApps.length - trulyUnused.length;

  const domainByRpc = new Map<string, { domain: Domain; ambiguous: boolean }>();
  for (const rpc of typesRpcs) {
    domainByRpc.set(rpc, resolveDomain(rpc, byRpc.get(rpc) ?? []));
  }
  const domainCounts = new Map<Domain, number>();
  const ambiguousRpcs: string[] = [];
  for (const [rpc, { domain, ambiguous }] of domainByRpc) {
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    if (ambiguous) ambiguousRpcs.push(rpc);
  }

  const generatedAt = new Date().toISOString();
  const lines: string[] = [
    `# RPC Usage Matrix`,
    ``,
    `> Generated: ${generatedAt}  `,
    `> SOT: \`packages/shared-types/src/database.types.ts\` Functions \`rpc_*\`  `,
    `> Call sites: \`apps/web\` · \`apps/admin\` (\`callRpc\` / \`supabase.rpc\` / string constants) · \`supabase/functions/**\` (edge) · \`supabase/migrations|tests/**\` (SQL cron/internal/test)`,
    ``,
    `## Domain groups (ZA-02 — was flat alphabetical only)`,
    ``,
    `Best-effort classification from name keywords + call-site folder (\`features/*\` · \`surfaces/*\`).`,
    `Disagreement between the two signals is reported as **ambiguous**, not silently resolved —`,
    `naming guide: avoid introducing new \`rpc_*\` names that reuse a keyword already ambiguous below`,
    `(currently: \`${AMBIGUOUS_NAME_HINTS.join('`, `')}\`) across more than one domain; prefer a`,
    `domain-prefixed name (e.g. \`rpc_casino_reveal_roulette_spin\` vs \`rpc_spin_roulette\`) for new RPCs`,
    `that share a keyword with an existing RPC in a different domain.`,
    ``,
    `| Domain | Count |`,
    `|---|---:|`,
    ...(Object.keys(DOMAIN_LABEL) as Domain[])
      .filter((d) => (domainCounts.get(d) ?? 0) > 0)
      .map((d) => `| ${DOMAIN_LABEL[d]} | ${domainCounts.get(d) ?? 0} |`),
    `| **Ambiguous (name/call-site signal disagree or known-ambiguous keyword)** | **${ambiguousRpcs.length}** |`,
    ``,
    ...(ambiguousRpcs.length
      ? [
          `<details><summary>Ambiguous RPC list</summary>`,
          ``,
          ...ambiguousRpcs
            .sort()
            .map((r) => `- \`${r}\` → ${DOMAIN_LABEL[domainByRpc.get(r)!.domain]}`),
          ``,
          `</details>`,
          ``,
        ]
      : []),
    `## Summary`,
    ``,
    `| Metric | Count |`,
    `|--------|------:|`,
    `| Types \`rpc_*\` | ${typesRpcs.length} |`,
    `| Called from apps (∩ types) | ${usedInTypes.length} |`,
    `| Types but **no app call site** | ${unusedInApps.length} |`,
    `| — of which Edge/SQL cross-use (SA-04) | ${crossUseCount} |`,
    `| — of which **genuinely unused** (no app/edge/SQL reference) | ${trulyUnused.length} |`,
    `| App call sites not in types | ${orphanCalls.length} |`,
    `| Total call-site rows | ${calls.length} |`,
    ``,
    `## Matrix (types ∩ apps)`,
    ``,
    `| RPC | web | admin | call sites | sample file |`,
    `|-----|----:|------:|-----------:|-------------|`,
  ];

  for (const rpc of typesRpcs) {
    const sites = byRpc.get(rpc) ?? [];
    const web = sites.filter((s) => s.app === 'web').length;
    const admin = sites.filter((s) => s.app === 'admin').length;
    const sample = sites[0] ? `${sites[0].file}:${sites[0].line}` : '—';
    const status = sites.length === 0 ? '**unused**' : String(sites.length);
    lines.push(`| \`${rpc}\` | ${web} | ${admin} | ${status} | ${sample} |`);
  }

  if (unusedInApps.length) {
    lines.push(
      ``,
      `## SA-04 — Edge/SQL cross-use classification for "no app call site" RPCs`,
      ``,
      `Cross-reference of the ${unusedInApps.length} types RPCs with no \`apps/web\`|\`apps/admin\` call site against`,
      `\`supabase/functions/**\` (edge) and \`supabase/migrations|tests/**\` (SQL). "sql_cron_or_internal" means the`,
      `name appears in SQL outside its own CREATE/DROP/REVOKE/GRANT declaration lines (cron.schedule body, another`,
      `function calling it internally, or a \`_*_logged()\` wrapper). "sql_test_only" means it is exercised only by`,
      `\`supabase/tests/*.sql\` (SQL integration test coverage without a live wiring). "none" is not proof of dead`,
      `code — some remain intentionally callable admin/service paths not yet wired into a UI — but it is the`,
      `strongest static signal available without a live DB read.`,
      ``,
      `| Classification | Count |`,
      `|---|---:|`,
      `| \`edge\` | ${unusedInApps.filter((r) => crossUse.get(r) === 'edge').length} |`,
      `| \`sql_cron_or_internal\` | ${unusedInApps.filter((r) => crossUse.get(r) === 'sql_cron_or_internal').length} |`,
      `| \`sql_test_only\` | ${unusedInApps.filter((r) => crossUse.get(r) === 'sql_test_only').length} |`,
      `| \`none\` (genuinely unused candidate) | ${trulyUnused.length} |`,
      ``,
      `| RPC | Classification |`,
      `|-----|----------------|`,
    );
    for (const r of unusedInApps) {
      lines.push(`| \`${r}\` | \`${crossUse.get(r)}\` |`);
    }
    lines.push(``);
    lines.push(
      `> Deletion of \`none\`-classified RPCs is **not** authorized by this scan — engine freeze`,
      `> (\`00-post-closeout-active-ssot.mdc\`) bars new/removed \`rpc_*\` without an explicit operator-approved`,
      `> Phase R plan item. This table is inventory for that future decision, not an action list.`,
    );
  }

  if (orphanCalls.length) {
    lines.push(``, `## App references not in database.types Functions`, ``);
    for (const r of orphanCalls) {
      const sites = byRpc.get(r) ?? [];
      lines.push(`- \`${r}\` (${sites.length} sites) — e.g. ${sites[0]?.file ?? '?'}`);
    }
  }

  lines.push(``, `## Method`, ``);
  lines.push(`1. Parse \`Functions\` block in \`database.types.ts\` for keys matching \`rpc_*\`.`);
  lines.push(
    `2. Walk \`apps/web/src\` + \`apps/admin/src\` for \`callRpc\` / \`.rpc(\` / RPC string constants.`,
  );
  lines.push(`3. Resolve \`RPC_*\` exported constants to literal names.`);
  lines.push(
    `4. SA-04: for each app-unused RPC, scan \`supabase/functions/**/*.ts\` for \`.rpc('rpc_name', ...)\`,`,
  );
  lines.push(
    `   then \`supabase/migrations/**/*.sql\` for the name outside its own declaration lines (cron/internal),`,
  );
  lines.push(`   then \`supabase/tests/**/*.sql\` for test-only coverage.`);
  lines.push(``);

  const mdPath = join(OUT_DIR, 'RPC_USAGE_MATRIX.md');
  writeFileSync(mdPath, lines.join('\n'), 'utf8');

  const jsonPath = join(OUT_DIR, 'RPC_USAGE_MATRIX.json');
  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generatedAt,
        typesCount: typesRpcs.length,
        usedInTypes: usedInTypes.length,
        unusedInApps,
        crossUse: Object.fromEntries(unusedInApps.map((r) => [r, crossUse.get(r)])),
        trulyUnused,
        orphanCalls,
        callSiteCount: calls.length,
        byRpc: Object.fromEntries(
          [...byRpc.entries()].map(([rpc, sites]) => [
            rpc,
            sites.map((s) => ({ app: s.app, file: s.file, line: s.line })),
          ]),
        ),
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(
    `[rpc-matrix] types=${typesRpcs.length} used=${usedInTypes.length} unused=${unusedInApps.length} orphans=${orphanCalls.length} crossUse=${crossUseCount} trulyUnused=${trulyUnused.length}`,
  );
  console.log(`[rpc-matrix] wrote ${relative(ROOT, mdPath).replace(/\\/g, '/')}`);
}

main();
