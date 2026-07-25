#!/usr/bin/env tsx
/**
 * Section C — surface controls / dead control / domain boundary / i18n parity audit (read-only).
 * Writes JSON to scripts/audit/last-c-surface-controls-report.json
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { collectPhaseRGuardViolations } from '../check-phase-r-guards.ts';
import {
  CASINO_GAME_SLUGS,
  resolveDomainForRoute,
  resolveDomainForSurfaceFolder,
  SURFACE_DOMAIN_SPECS,
} from '../../apps/web/src/product/shell/surface-domain-boundary.ts';

const ROOT = process.cwd();
const ROUTES_DIR = join(ROOT, 'apps', 'web', 'src', 'routes');
const SURFACES_DIR = join(ROOT, 'apps', 'web', 'src', 'product', 'surfaces');
const I18N_INDEX = join(ROOT, 'packages', 'i18n', 'src', 'index.ts');
const KO_PRESENTATION = join(ROOT, 'packages', 'i18n', 'src', 'locales', 'presentation-ko.ts');
const EN_PRESENTATION = join(ROOT, 'packages', 'i18n', 'src', 'locales', 'presentation-en.ts');

type Severity = 'P1' | 'P2' | 'P3' | 'PASS' | 'UNVERIFIED';

interface RouteRow {
  routePath: string;
  file: string;
  line: number;
  domain: string | null;
  surfaceFolder: string | null;
  surfacePage: string | null;
  isLayoutOutlet: boolean;
  isDomainHubStub: boolean;
  boundaryVerdict: Severity;
  boundaryNote: string;
}

interface SurfacePageRow {
  file: string;
  folder: string;
  domain: string | null;
  routeWired: boolean;
  wiredRoutes: string[];
}

interface ControlFinding {
  id: string;
  severity: Severity;
  category: 'dead_control' | 'permanent_disabled' | 'soon_stub' | 'orphan_hook' | 'missing_route';
  file: string;
  line: number;
  evidence: string;
  note: string;
}

interface I18nFinding {
  id: string;
  severity: Severity;
  category: 'korean_jsx' | 'english_jsx' | 'missing_ko' | 'missing_en' | 'surface_key_gap';
  file: string;
  line: number;
  keyOrText: string;
  note: string;
}

function walkFiles(
  dir: string,
  ext: RegExp,
  skip = new Set(['node_modules', 'dist', '__tests__']),
): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!skip.has(entry)) out.push(...walkFiles(full, ext, skip));
      continue;
    }
    if (ext.test(entry)) out.push(full);
  }
  return out;
}

function rel(path: string): string {
  return relative(ROOT, path).replaceAll('\\', '/');
}

function lineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function parseLocaleKeys(filePath: string): Set<string> {
  const content = readFileSync(filePath, 'utf8');
  const keys = new Set<string>();
  const re = /^\s*'([^']+)':/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    keys.add(m[1]!);
  }
  return keys;
}

/** Shipped user-facing catalog = engine keys in index.ts + presentation locale spreads. */
function loadShippedCatalogKeys(): {
  all: Set<string>;
  presentationKo: Set<string>;
  presentationEn: Set<string>;
} {
  const presentationKo = parseLocaleKeys(KO_PRESENTATION);
  const presentationEn = parseLocaleKeys(EN_PRESENTATION);
  const indexKeys = parseLocaleKeys(I18N_INDEX);
  const all = new Set<string>([...indexKeys, ...presentationKo, ...presentationEn]);
  return { all, presentationKo, presentationEn };
}

function collectRoutes(): RouteRow[] {
  const rows: RouteRow[] = [];
  const routeFiles = walkFiles(ROUTES_DIR, /\.tsx$/);

  for (const abs of routeFiles) {
    if (abs.includes('__root')) continue;
    const content = readFileSync(abs, 'utf8');
    const routeMatch = content.match(/createFileRoute\(\s*['"]([^'"]+)['"]\s*\)/);
    if (!routeMatch) continue;

    const routePath = routeMatch[1]!;
    const line = lineNumber(content, routeMatch.index ?? 0);
    const file = rel(abs);
    const domain = resolveDomainForRoute(routePath);
    const surfaceImport = content.match(/from\s+['"][^'"]*\/surfaces\/([^/'"]+)/);
    const surfaceFolder = surfaceImport?.[1] ?? null;
    const isLayoutOutlet = /\bOutlet\b/.test(content) && !surfaceImport;
    const isDomainHubStub = /\bDomainHubPage\b/.test(content);
    const surfacePageMatch = content.match(/import\s+\{[^}]*\b(\w+Page)\b/);
    const surfacePage = surfacePageMatch?.[1] ?? null;

    let boundaryVerdict: Severity = 'PASS';
    let boundaryNote = 'route↔domain OK';

    if (domain === null) {
      boundaryVerdict = 'P3';
      boundaryNote = 'route not mapped in surface-domain-boundary resolveDomainForRoute';
    } else if (
      surfaceFolder &&
      domain !== 'neutral' &&
      domain !== 'landing' &&
      domain !== 'legal' &&
      domain !== 'auth'
    ) {
      const surfaceDomain = resolveDomainForSurfaceFolder(surfaceFolder);
      if (surfaceDomain !== null && surfaceDomain !== 'neutral' && surfaceDomain !== domain) {
        boundaryVerdict = 'P1';
        boundaryNote = `route domain ${domain} ≠ surface folder ${surfaceFolder} (${surfaceDomain})`;
      }
    }

    rows.push({
      routePath,
      file,
      line,
      domain,
      surfaceFolder,
      surfacePage,
      isLayoutOutlet,
      isDomainHubStub,
      boundaryVerdict,
      boundaryNote,
    });
  }

  return rows.sort((a, b) => a.routePath.localeCompare(b.routePath));
}

function collectSurfacePages(): SurfacePageRow[] {
  const routes = collectRoutes();
  const pageFiles = walkFiles(SURFACES_DIR, /-page\.tsx$/).filter((f) => !f.includes('__tests__'));

  return pageFiles.map((abs) => {
    const file = rel(abs);
    const folder = file.match(/surfaces\/([^/]+)\//)?.[1] ?? 'unknown';
    const domain = resolveDomainForSurfaceFolder(folder);
    const baseName = file.split('/').pop()!;
    const wiredRoutes = routes
      .filter(
        (r) =>
          r.file && readFileSync(join(ROOT, r.file), 'utf8').includes(baseName.replace('.tsx', '')),
      )
      .map((r) => r.routePath);
    const routeWired = wiredRoutes.length > 0 || folder === 'shell';
    return { file, folder, domain, routeWired, wiredRoutes };
  });
}

function scanControlFindings(routeRows: RouteRow[]): ControlFinding[] {
  const findings: ControlFinding[] = [];
  const surfaceFiles = walkFiles(SURFACES_DIR, /\.(tsx|ts)$/);

  const stubPatterns: {
    re: RegExp;
    category: ControlFinding['category'];
    severity: Severity;
    id: string;
    note: string;
  }[] = [
    {
      re: /\bDomainHubPage\b/,
      category: 'soon_stub',
      severity: 'P3',
      id: 'domain-hub-stub',
      note: 'Sparse P6 hub — title only · full surface deferred',
    },
    {
      re: /\bSTUB\b|\bstub\b.*ENGINE:gap|coming_soon/,
      category: 'soon_stub',
      severity: 'P3',
      id: 'soon-stub-marker',
      note: 'Documented defer / coming-soon surface',
    },
    {
      re: /disabled=\{!canManageKeys\}|canManageTradingApiKeys\(\)\s*\?\?\s*false|canManageKeys:\s*false/,
      category: 'permanent_disabled',
      severity: 'P3',
      id: 'api-keys-permanent-disabled',
      note: 'Trading bot API ENGINE:gap — create CTA permanently disabled',
    },
    {
      re: /onClick=\{\(\)\s*=>\s*\{\s*\}\}/,
      category: 'dead_control',
      severity: 'P2',
      id: 'empty-onclick',
      note: 'Button/link with empty handler',
    },
    {
      re: /href=["']#["']/,
      category: 'dead_control',
      severity: 'P2',
      id: 'hash-href',
      note: 'Placeholder href="#"',
    },
    {
      re: /disabled=\{true\}|disabled=\{\s*true\s*\}/,
      category: 'permanent_disabled',
      severity: 'P2',
      id: 'literal-disabled-true',
      note: 'Hard-coded disabled={true}',
    },
  ];

  for (const abs of surfaceFiles) {
    if (abs.includes('__tests__')) continue;
    const content = readFileSync(abs, 'utf8');
    const file = rel(abs);
    const lines = content.split('\n');

    for (const rule of stubPatterns) {
      if (!rule.re.test(content)) continue;
      const idx = content.search(rule.re);
      findings.push({
        id: rule.id,
        severity: rule.severity,
        category: rule.category,
        file,
        line: lineNumber(content, idx),
        evidence: lines[lineNumber(content, idx) - 1]?.trim().slice(0, 120) ?? rule.re.source,
        note: rule.note,
      });
    }

    // Buttons without onClick/type=submit/navigation (heuristic · surface pages only)
    if (!file.endsWith('-page.tsx') && !file.endsWith('-panel.tsx') && !file.endsWith('-form.tsx'))
      continue;
    const buttonRe = /<Button\b[^>]*>/g;
    let bm: RegExpExecArray | null;
    while ((bm = buttonRe.exec(content)) !== null) {
      const tag = bm[0];
      if (/type="submit"/.test(tag)) continue;
      if (/\bonClick=/.test(tag)) continue;
      if (/\bdisabled=\{true\}/.test(tag)) continue;
      if (/\basChild\b/.test(tag)) continue;
      const testId = tag.match(/data-testid="([^"]+)"/)?.[1];
      if (!testId) continue;
      findings.push({
        id: 'button-no-handler',
        severity: 'UNVERIFIED',
        category: 'dead_control',
        file,
        line: lineNumber(content, bm.index),
        evidence: tag.slice(0, 120),
        note: `Button data-testid=${testId} has no onClick in opening tag — may use form/parent handler`,
      });
    }
  }

  for (const row of routeRows) {
    if (row.isDomainHubStub) {
      findings.push({
        id: 'casino-route-hub-stub',
        severity: 'P3',
        category: 'soon_stub',
        file: row.file,
        line: row.line,
        evidence: `createFileRoute('${row.routePath}') → DomainHubPage`,
        note: 'Plan §33.3 #5 — casino orphan stub until P10 casino infra',
      });
    }
  }

  // Casino game routes missing (12 slugs · boundary registered but no route files)
  const routePaths = new Set(routeRows.map((r) => r.routePath));
  const missingGameSlugs: string[] = [];
  for (const slug of CASINO_GAME_SLUGS) {
    const expected = `/games/${slug}`;
    if (!routePaths.has(expected) && !routePaths.has(`/casino/${slug}`)) {
      missingGameSlugs.push(slug);
    }
  }
  if (missingGameSlugs.length > 0) {
    findings.push({
      id: 'casino-game-routes-missing',
      severity: 'P3',
      category: 'missing_route',
      file: 'apps/web/src/product/shell/surface-domain-boundary.ts',
      line: 109,
      evidence: `CASINO_GAME_SLUGS ${missingGameSlugs.length}/12 without routes: ${missingGameSlugs.join(', ')}`,
      note: 'Boundary SOT lists 12 slugs · /games/* routes not mounted (P10 casino infra)',
    });
  }

  // use-casino-round hook without mounted game surface route
  const casinoRoundPath = join(ROOT, 'apps/web/src/features/casino/use-casino-round.ts');
  if (existsSync(casinoRoundPath)) {
    const gameSurfaces = surfaceFiles.filter(
      (f) => f.includes('/games/') || (f.includes('/casino/') && f.endsWith('-page.tsx')),
    );
    if (gameSurfaces.length === 0) {
      findings.push({
        id: 'casino-round-hook-orphan',
        severity: 'P3',
        category: 'orphan_hook',
        file: rel(casinoRoundPath),
        line: 38,
        evidence: 'useCasinoRoundPipeline exported · 0 game surface pages',
        note: 'Plan §33.3 #5 — engine hook exists · presentation routes deferred',
      });
    }
  }

  // Deduplicate by file+line+id
  const seen = new Set<string>();
  return findings.filter((f) => {
    const k = `${f.id}:${f.file}:${f.line}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function scanI18nFindings(surfacePages: SurfacePageRow[]): I18nFinding[] {
  const findings: I18nFinding[] = [];
  const catalog = loadShippedCatalogKeys();
  const presentationKo = catalog.presentationKo;
  const presentationEn = catalog.presentationEn;
  const koreanPattern = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;

  const surfaceFiles = surfacePages.map((p) => join(ROOT, p.file));

  for (const abs of surfaceFiles) {
    const content = readFileSync(abs, 'utf8');
    const file = rel(abs);
    const lines = content.split('\n');

    // Korean in JSX (check:i18n scope is apps/** — surfaces included)
    lines.forEach((line, i) => {
      if (line.includes('//') || line.includes('/*')) return;
      if (!koreanPattern.test(line)) return;
      if (/t\s*\(\s*['"]/.test(line)) return;
      findings.push({
        id: 'korean-jsx',
        severity: 'P2',
        category: 'korean_jsx',
        file,
        line: i + 1,
        keyOrText: line.trim().slice(0, 100),
        note: 'Hardcoded Korean outside t() — check:i18n would fail if present',
      });
    });

    // Hardcoded English in JSX attributes (check:i18n does NOT scan non-Korean)
    const attrRe =
      /\b(title|placeholder|aria-label|label|description|alt)=["']([^"'{][^"']{2,})["']/g;
    let am: RegExpExecArray | null;
    while ((am = attrRe.exec(content)) !== null) {
      const text = am[2]!;
      if (/^(USDT|PHON)$/i.test(text)) continue;
      findings.push({
        id: 'english-attr-literal',
        severity: 'P3',
        category: 'english_jsx',
        file,
        line: lineNumber(content, am.index),
        keyOrText: `${am[1]}="${text.slice(0, 60)}"`,
        note: 'English attribute literal without t() — outside check:i18n scope',
      });
    }

    // Literal keys used via t('...') in surface pages
    const keyRe = /\bt\s*\(\s*['"]([^'"]+)['"]/g;
    let km: RegExpExecArray | null;
    while ((km = keyRe.exec(content)) !== null) {
      const key = km[1]!;
      if (!catalog.all.has(key)) {
        findings.push({
          id: 'surface-key-missing-catalog',
          severity: 'P1',
          category: 'missing_ko',
          file,
          line: lineNumber(content, km.index),
          keyOrText: key,
          note: 't() key absent from packages/i18n/src/index.ts catalog',
        });
      }
    }
  }

  // Presentation slice parity (check:i18n 미검 — presentation-only keys)
  const presKoWithoutEn = [...presentationKo].filter((k) => !presentationEn.has(k));
  const presEnWithoutKo = [...presentationEn].filter((k) => !presentationKo.has(k));
  for (const key of presKoWithoutEn.slice(0, 15)) {
    findings.push({
      id: 'presentation-ko-without-en',
      severity: 'P2',
      category: 'surface_key_gap',
      file: 'packages/i18n/src/locales/presentation-ko.ts',
      line: 0,
      keyOrText: key,
      note: 'presentation-ko key missing in presentation-en.ts (sample)',
    });
  }
  for (const key of presEnWithoutKo.slice(0, 15)) {
    findings.push({
      id: 'presentation-en-without-ko',
      severity: 'P2',
      category: 'surface_key_gap',
      file: 'packages/i18n/src/locales/presentation-en.ts',
      line: 0,
      keyOrText: key,
      note: 'presentation-en key missing in presentation-ko.ts (sample)',
    });
  }

  return findings;
}

function main(): void {
  const routes = collectRoutes();
  const surfacePages = collectSurfacePages();
  const phaseRGuards = collectPhaseRGuardViolations();
  const controlFindings = scanControlFindings(routes);
  const i18nFindings = scanI18nFindings(surfacePages);

  const catalog = loadShippedCatalogKeys();
  const presKoWithoutEn = [...catalog.presentationKo].filter((k) => !catalog.presentationEn.has(k));
  const presEnWithoutKo = [...catalog.presentationEn].filter((k) => !catalog.presentationKo.has(k));
  const missingGameRouteCount =
    controlFindings.filter((f) => f.id === 'casino-game-routes-missing').length > 0
      ? CASINO_GAME_SLUGS.length
      : 0;

  const orphanSurfaces = surfacePages.filter((p) => p.domain === null);
  const unwiredSurfaces = surfacePages.filter((p) => !p.routeWired && p.folder !== 'shell');
  const unmappedRoutes = routes.filter((r) => r.domain === null);
  const boundaryFails = routes.filter((r) => r.boundaryVerdict === 'P1');

  const report = {
    generatedAt: new Date().toISOString(),
    scope: 'pqa-audit-c-surface-controls',
    counts: {
      routes: routes.length,
      surfacePages: surfacePages.length,
      phaseRGuardViolations: phaseRGuards.length,
      controlFindings: controlFindings.length,
      i18nFindings: i18nFindings.length,
      shippedCatalogKeys: catalog.all.size,
      presentationKoKeys: catalog.presentationKo.size,
      presentationEnKeys: catalog.presentationEn.size,
      presentationKoWithoutEn: presKoWithoutEn.length,
      presentationEnWithoutKo: presEnWithoutKo.length,
      casinoGameRoutesMissing: missingGameRouteCount,
    },
    routes,
    surfacePages,
    phaseRGuards,
    domainBoundary: {
      registeredRoutePrefixes: SURFACE_DOMAIN_SPECS.flatMap((s) => [...s.routePrefixes]),
      unmappedRoutes,
      boundaryFails,
      orphanSurfaceFolders: orphanSurfaces,
    },
    controlFindings: {
      dead: controlFindings.filter((f) => f.category === 'dead_control'),
      permanentDisabled: controlFindings.filter((f) => f.category === 'permanent_disabled'),
      soonStub: controlFindings.filter((f) => f.category === 'soon_stub'),
      orphanHook: controlFindings.filter((f) => f.category === 'orphan_hook'),
      missingRoute: controlFindings.filter((f) => f.category === 'missing_route'),
      all: controlFindings,
    },
    i18n: {
      koreanJsx: i18nFindings.filter((f) => f.category === 'korean_jsx'),
      englishJsx: i18nFindings.filter((f) => f.category === 'english_jsx'),
      surfaceKeyMissingKo: i18nFindings.filter((f) => f.category === 'missing_ko'),
      surfaceKeyMissingEn: i18nFindings.filter((f) => f.category === 'missing_en'),
      catalogParity: {
        presentationKoWithoutEnTotal: presKoWithoutEn.length,
        presentationEnWithoutKoTotal: presEnWithoutKo.length,
        presentationKoWithoutEnSample: presKoWithoutEn.slice(0, 15),
        presentationEnWithoutKoSample: presEnWithoutKo.slice(0, 15),
      },
    },
    unwiredSurfaces,
    verdict: {
      domainIsolationPass: phaseRGuards.length === 0 && boundaryFails.length === 0,
      deadControlP2Count: controlFindings.filter((f) => f.severity === 'P2').length,
      soonStubP3Count: controlFindings.filter((f) => f.category === 'soon_stub').length,
      i18nP1Count: i18nFindings.filter((f) => f.severity === 'P1').length,
    },
  };

  const outPath = join(ROOT, 'scripts', 'audit', 'last-c-surface-controls-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        outPath,
        ...report.counts,
        ...report.verdict,
      },
      null,
      2,
    ),
  );
}

main();
