/**
 * M-16 RPC type hygiene (R7) — forbid production type-lie / dynamic string RPC helpers.
 *
 * Allowed `as never` only inside apps/web|admin src/lib/rpc.ts (PostgREST shim).
 * Default: --strict behavior (exit 1 on findings). Pass `--advisory` to warn only.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const advisory = process.argv.includes('--advisory');

const SCAN_DIRS = ['apps/web/src', 'apps/admin/src'] as const;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.turbo', '__tests__']);

const ALLOW_AS_NEVER = new Set([
  'apps/web/src/lib/rpc.ts',
  'apps/admin/src/lib/rpc.ts',
]);

/** Non-RPC `as never` that are out of M-16 scope (navigate / i18n / realtime / table). */
const LINE_ALLOW = [
  /navigate\(\s*\{\s*to:.*as never/,
  /t\([^)]*as never\)/,
  /\.from\(\s*['"][^'"]+['"]\s+as never/,
  /schema:\s*['"]public['"].*as never/,
  /filter\s*\?\s*\{\s*filter/,
];

const PATTERNS: { id: string; re: RegExp }[] = [
  {
    id: 'rpc-name-lie',
    re: /['"`]rpc_[a-z0-9_]+['"`]\s+as\s+['"`]rpc_[a-z0-9_]+['"`]/g,
  },
  {
    id: 'supabase-rpc-as-never',
    re: /\.rpc\s*\(\s*[^)]*as\s+never/g,
  },
  {
    id: 'args-as-never-object',
    re: /\}\s*as\s+never\s*[,)]/g,
  },
  {
    id: 'dynamic-rpc-helper',
    re: /(?:sportsRpc|casinoLiveRpc|LooseRpcResult)\b/g,
  },
  {
    id: 'fn-string-rpc',
    re: /(?:async\s+)?function\s+\w*rpc\w*\s*<[^>]*>\s*\(\s*fn:\s*string/gi,
  },
];

function rel(path: string): string {
  return relative(root, path).replaceAll('\\', '/');
}

function collectFiles(dir: string): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  let out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const path = join(abs, entry);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) out = out.concat(collectFiles(join(dir, entry)));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) {
      out.push(path);
    }
  }
  return out;
}

function lineAllowed(line: string): boolean {
  return LINE_ALLOW.some((re) => re.test(line));
}

type Finding = { id: string; file: string; line: number; snippet: string };

function scan(): Finding[] {
  const findings: Finding[] = [];
  for (const dir of SCAN_DIRS) {
    for (const path of collectFiles(dir)) {
      const key = rel(path);
      const source = readFileSync(path, 'utf8');
      const lines = source.split(/\r?\n/);

      for (const { id, re } of PATTERNS) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] ?? '';
          if (!re.test(line)) {
            re.lastIndex = 0;
            continue;
          }
          re.lastIndex = 0;
          if (id !== 'dynamic-rpc-helper' && id !== 'fn-string-rpc' && ALLOW_AS_NEVER.has(key)) {
            continue;
          }
          if (lineAllowed(line)) continue;
          // Skip realtime channel config objects that are not RPC.
          if (id === 'args-as-never-object' && /event:|schema:|table:/.test(line)) continue;
          if (
            id === 'args-as-never-object' &&
            i > 0 &&
            /event:|schema:|table:/.test(lines[i - 1] ?? '')
          ) {
            continue;
          }
          findings.push({
            id,
            file: key,
            line: i + 1,
            snippet: line.trim().slice(0, 120),
          });
        }
      }
    }
  }
  return findings;
}

function main(): void {
  const findings = scan();
  console.log(`[check:rpc-type-hygiene] findings=${findings.length}`);
  for (const f of findings) {
    console[advisory ? 'warn' : 'error'](
      `  ${f.id} ${f.file}:${f.line}  ${f.snippet}`,
    );
  }
  if (findings.length === 0) {
    console.log('[check:rpc-type-hygiene] ✓ type-lie / dynamic RPC helper 0');
    process.exit(0);
  }
  if (advisory) {
    console.warn('[check:rpc-type-hygiene] WARN (advisory)');
    process.exit(0);
  }
  console.error('[check:rpc-type-hygiene] FAIL — migrate to typed callRpc');
  process.exit(1);
}

main();
