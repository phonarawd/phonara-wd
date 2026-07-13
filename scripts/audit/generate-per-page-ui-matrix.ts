#!/usr/bin/env bun
/**
 * Per-page UI state matrix for 81 web *-page.tsx surfaces.
 * Extracts loading / empty / error / responsive signals from page TSX +
 * related display-contracts + vitest files.
 * Output: docs/audit/PER_PAGE_UI_MATRIX.md (+ .json)
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'docs', 'audit');
const SURFACES = join(ROOT, 'apps', 'web', 'src', 'product', 'surfaces');
const DOMAIN = join(ROOT, 'apps', 'web', 'src', 'domain');
const DOMAIN_TESTS = join(DOMAIN, '__tests__');

type StateFlag = 'yes' | 'partial' | 'no' | 'n/a';

type PageRow = {
  page: string;
  domain: string;
  relativePath: string;
  loading: StateFlag;
  empty: StateFlag;
  error: StateFlag;
  responsive: StateFlag;
  loadingEvidence: string[];
  emptyEvidence: string[];
  errorEvidence: string[];
  responsiveEvidence: string[];
  displayContracts: string[];
  tests: string[];
};

function walk(dir: string, pred: (name: string, full: string) => boolean): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules') continue;
      if (entry === '__tests__') {
        for (const t of readdirSync(full)) {
          const tf = join(full, t);
          if (pred(t, tf)) out.push(tf);
        }
        continue;
      }
      out.push(...walk(full, pred));
      continue;
    }
    if (pred(entry, full)) out.push(full);
  }
  return out;
}

/** Canonical page surfaces: *-page.tsx + primary shells (game / trade desk). */
function isPageSurface(name: string): boolean {
  if (name.endsWith('-page.tsx')) return true;
  if (name === 'casino-game-shell.tsx') return true;
  if (name === 'trade-desk-page-shell.tsx') return true;
  return false;
}

function listDomainContracts(): string[] {
  if (!existsSync(DOMAIN)) return [];
  return readdirSync(DOMAIN)
    .filter((f) => f.endsWith('-display-contract.ts'))
    .map((f) => join(DOMAIN, f));
}

function listDomainTests(): string[] {
  if (!existsSync(DOMAIN_TESTS)) return [];
  return readdirSync(DOMAIN_TESTS)
    .filter((f) => f.endsWith('.test.ts') || f.endsWith('.test.tsx'))
    .map((f) => join(DOMAIN_TESTS, f));
}

function stemFromPage(pageFile: string): string {
  return basename(pageFile)
    .replace(/-page\.tsx$/, '')
    .replace(/\.tsx$/, '');
}

function findRelated(contracts: string[], tests: string[], stem: string, domain: string): {
  contracts: string[];
  tests: string[];
} {
  const tokens = new Set(
    [stem, domain, ...stem.split('-')].filter((t) => t.length >= 3),
  );
  const score = (path: string) => {
    const base = basename(path).toLowerCase();
    let s = 0;
    for (const t of tokens) {
      if (base.includes(t.toLowerCase())) s += 1;
    }
    return s;
  };
  const relatedContracts = contracts
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s >= 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, 5)
    .map((x) => relative(ROOT, x.p).replace(/\\/g, '/'));

  const pageTestDir = join(dirname(join(SURFACES, domain)), '__tests__');
  const localTests: string[] = [];
  // surface-local tests next to page
  const surfaceTests = walk(join(SURFACES, domain), (n) =>
    n.includes(stem) && /\.test\.(ts|tsx)$/.test(n),
  );
  for (const t of surfaceTests) {
    localTests.push(relative(ROOT, t).replace(/\\/g, '/'));
  }
  if (existsSync(pageTestDir)) {
    /* already covered by walk */
  }

  const relatedTests = [
    ...localTests,
    ...tests
      .map((p) => ({ p, s: score(p) }))
      .filter((x) => x.s >= 1)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map((x) => relative(ROOT, x.p).replace(/\\/g, '/')),
  ];

  return {
    contracts: [...new Set(relatedContracts)],
    tests: [...new Set(relatedTests)].slice(0, 8),
  };
}

function detectStates(
  content: string,
  relatedContractContents: string[],
): Pick<
  PageRow,
  | 'loading'
  | 'empty'
  | 'error'
  | 'responsive'
  | 'loadingEvidence'
  | 'emptyEvidence'
  | 'errorEvidence'
  | 'responsiveEvidence'
> {
  const blob = [content, ...relatedContractContents].join('\n');

  const loadingHits: string[] = [];
  const emptyHits: string[] = [];
  const errorHits: string[] = [];
  const responsiveHits: string[] = [];

  const loadingPatterns: Array<[RegExp, string]> = [
    [/\bSkeleton\b/, 'Skeleton'],
    [/\bQuadStreamLoading\b/, 'QuadStreamLoading'],
    [/\bloading\b/, 'loading'],
    [/isPending|isLoading|isFetching/, 'query loading flag'],
    [/data-testid=["'][^"']*loading/, 'loading testid'],
  ];
  const emptyPatterns: Array<[RegExp, string]> = [
    [/\bEmptyState\b/, 'EmptyState'],
    [/\bZeroBalanceState\b/, 'ZeroBalanceState'],
    [/\bempty\b/i, 'empty'],
    [/length\s*===\s*0|!\w+\.length/, 'empty length guard'],
    [/data-testid=["'][^"']*empty/, 'empty testid'],
  ];
  const errorPatterns: Array<[RegExp, string]> = [
    [/\bErrorPanel\b/, 'ErrorPanel'],
    [/\berrorKey\b/, 'errorKey'],
    [/role=["']alert["']/, 'role=alert'],
    [/\bisError\b|\.error\b/, 'error flag'],
    [/data-testid=["'][^"']*error/, 'error testid'],
  ];
  const responsivePatterns: Array<[RegExp, string]> = [
    [/\bmd:/, 'md:'],
    [/\blg:/, 'lg:'],
    [/\bsm:/, 'sm:'],
    [/max-w-|min-w-/, 'width constraint'],
    [/viewport|responsive|breakpoint/i, 'responsive keyword'],
  ];

  for (const [re, label] of loadingPatterns) {
    if (re.test(blob)) loadingHits.push(label);
  }
  for (const [re, label] of emptyPatterns) {
    if (re.test(blob)) emptyHits.push(label);
  }
  for (const [re, label] of errorPatterns) {
    if (re.test(blob)) errorHits.push(label);
  }
  for (const [re, label] of responsivePatterns) {
    if (re.test(content)) responsiveHits.push(label); // page only for layout
  }

  const flag = (hits: string[]): StateFlag => {
    if (hits.length === 0) return 'no';
    if (hits.length === 1 && (hits[0] === 'loading' || hits[0] === 'empty' || hits[0] === 'error flag')) {
      return 'partial';
    }
    return 'yes';
  };

  return {
    loading: flag(loadingHits),
    empty: flag(emptyHits),
    error: flag(errorHits),
    responsive: responsiveHits.length >= 2 ? 'yes' : responsiveHits.length === 1 ? 'partial' : 'no',
    loadingEvidence: [...new Set(loadingHits)],
    emptyEvidence: [...new Set(emptyHits)],
    errorEvidence: [...new Set(errorHits)],
    responsiveEvidence: [...new Set(responsiveHits)],
  };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const pages = walk(SURFACES, (n) => isPageSurface(n)).sort();
  const contracts = listDomainContracts();
  const tests = listDomainTests();
  const contractContentCache = new Map<string, string>();

  const rows: PageRow[] = [];
  for (const pagePath of pages) {
    const rel = relative(ROOT, pagePath).replace(/\\/g, '/');
    const domain = relative(SURFACES, pagePath).split(/[/\\]/)[0] ?? 'unknown';
    const stem = stemFromPage(pagePath);
    const content = readFileSync(pagePath, 'utf8');
    const related = findRelated(contracts, tests, stem, domain);

    const relatedContents: string[] = [];
    for (const c of related.contracts) {
      const abs = join(ROOT, c);
      if (!contractContentCache.has(abs)) {
        try {
          contractContentCache.set(abs, readFileSync(abs, 'utf8'));
        } catch {
          contractContentCache.set(abs, '');
        }
      }
      relatedContents.push(contractContentCache.get(abs) ?? '');
    }

    const states = detectStates(content, relatedContents);
    rows.push({
      page: basename(pagePath),
      domain,
      relativePath: rel,
      ...states,
      displayContracts: related.contracts,
      tests: related.tests,
    });
  }

  const tally = (key: keyof Pick<PageRow, 'loading' | 'empty' | 'error' | 'responsive'>) => {
    const yes = rows.filter((r) => r[key] === 'yes').length;
    const partial = rows.filter((r) => r[key] === 'partial').length;
    const no = rows.filter((r) => r[key] === 'no').length;
    return { yes, partial, no };
  };

  const generatedAt = new Date().toISOString();
  const L = tally('loading');
  const E = tally('empty');
  const Er = tally('error');
  const R = tally('responsive');

  const lines: string[] = [
    `# Per-Page UI State Matrix (Web)`,
    ``,
    `> Generated: ${generatedAt}  `,
    `> Scope: \`*-page.tsx\` + \`casino-game-shell.tsx\` + \`trade-desk-page-shell.tsx\` (${rows.length} surfaces; plan ~81 was approximate)  `,
    `> Method: static scan of page TSX + related \`-display-contract.ts\` + vitest paths  `,
    `> **NOT VERIFIED:** live browser render · axe · animation quality`,
    ``,
    `## Summary`,
    ``,
    `| State | yes | partial | no |`,
    `|-------|----:|--------:|---:|`,
    `| Loading | ${L.yes} | ${L.partial} | ${L.no} |`,
    `| Empty | ${E.yes} | ${E.partial} | ${E.no} |`,
    `| Error | ${Er.yes} | ${Er.partial} | ${Er.no} |`,
    `| Responsive (md/lg/sm in page) | ${R.yes} | ${R.partial} | ${R.no} |`,
    ``,
    `## Legend`,
    ``,
    `- **yes** — dedicated primitive/testid/contract signal found`,
    `- **partial** — weak keyword-only signal`,
    `- **no** — no static evidence in page + related contracts`,
    ``,
    `## Matrix`,
    ``,
    `| # | Domain | Page | Loading | Empty | Error | Responsive | Contracts | Tests |`,
    `|---|--------|------|---------|-------|-------|------------|-----------|-------|`,
  ];

  rows.forEach((r, i) => {
    const c = r.displayContracts.length ? String(r.displayContracts.length) : '0';
    const t = r.tests.length ? String(r.tests.length) : '0';
    lines.push(
      `| ${i + 1} | ${r.domain} | \`${r.page}\` | ${r.loading} | ${r.empty} | ${r.error} | ${r.responsive} | ${c} | ${t} |`,
    );
  });

  lines.push(``, `## Evidence detail (loading/empty/error hits)`, ``);
  for (const r of rows) {
    lines.push(`### \`${r.relativePath}\``);
    lines.push(`- loading: ${r.loading} — ${r.loadingEvidence.join(', ') || '—'}`);
    lines.push(`- empty: ${r.empty} — ${r.emptyEvidence.join(', ') || '—'}`);
    lines.push(`- error: ${r.error} — ${r.errorEvidence.join(', ') || '—'}`);
    lines.push(`- responsive: ${r.responsive} — ${r.responsiveEvidence.join(', ') || '—'}`);
    if (r.displayContracts.length) {
      lines.push(`- contracts: ${r.displayContracts.map((x) => `\`${x}\``).join(', ')}`);
    }
    if (r.tests.length) {
      lines.push(`- tests: ${r.tests.map((x) => `\`${x}\``).join(', ')}`);
    }
    lines.push(``);
  }

  const mdPath = join(OUT_DIR, 'PER_PAGE_UI_MATRIX.md');
  writeFileSync(mdPath, lines.join('\n'), 'utf8');
  writeFileSync(
    join(OUT_DIR, 'PER_PAGE_UI_MATRIX.json'),
    JSON.stringify({ generatedAt, pageCount: rows.length, summary: { L, E, Er, R }, rows }, null, 2),
    'utf8',
  );

  console.log(`[per-page-ui] pages=${rows.length} loading yes=${L.yes} empty yes=${E.yes} error yes=${Er.yes} responsive yes=${R.yes}`);
  console.log(`[per-page-ui] wrote ${relative(ROOT, mdPath).replace(/\\/g, '/')}`);
}

main();
