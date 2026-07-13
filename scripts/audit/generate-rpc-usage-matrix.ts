#!/usr/bin/env bun
/**
 * database.types.ts rpc_* ↔ apps/web|admin call-site cross matrix.
 * Output: docs/audit/RPC_USAGE_MATRIX.md (+ .json)
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'docs', 'audit');
const TYPES_PATH = join(ROOT, 'packages', 'shared-types', 'src', 'database.types.ts');
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');
const ADMIN_SRC = join(ROOT, 'apps', 'admin', 'src');

type AppScope = 'web' | 'admin';

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

  const generatedAt = new Date().toISOString();
  const lines: string[] = [
    `# RPC Usage Matrix`,
    ``,
    `> Generated: ${generatedAt}  `,
    `> SOT: \`packages/shared-types/src/database.types.ts\` Functions \`rpc_*\`  `,
    `> Call sites: \`apps/web\` · \`apps/admin\` (\`callRpc\` / \`supabase.rpc\` / string constants)`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Count |`,
    `|--------|------:|`,
    `| Types \`rpc_*\` | ${typesRpcs.length} |`,
    `| Called from apps (∩ types) | ${usedInTypes.length} |`,
    `| Types but **no app call site** | ${unusedInApps.length} |`,
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
    lines.push(``, `## Types RPCs with no app call site`, ``);
    for (const r of unusedInApps) {
      lines.push(`- \`${r}\``);
    }
    lines.push(``);
    lines.push(
      `> Note: unused in apps ≠ dead — Edge Functions, SQL tests, cron, or admin-only paths may still call these.`,
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
    `[rpc-matrix] types=${typesRpcs.length} used=${usedInTypes.length} unused=${unusedInApps.length} orphans=${orphanCalls.length}`,
  );
  console.log(`[rpc-matrix] wrote ${relative(ROOT, mdPath).replace(/\\/g, '/')}`);
}

main();
