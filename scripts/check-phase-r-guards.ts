/**
 * Phase R guard ladder — duplicate work + surface domain isolation + mobile layout debt.
 * Plan SOT: phase_r_super-app_8bdf2c10 · ACTIVE_WORK_SSOT · REBUILD_PLAN_v1 §12.19
 *
 * Usage:
 *   bun run check:phase-r-guards
 *   bun run check:phase-r-guards -- --strict
 *   PHONARA_IMPL_TODO=p9-gate-trade bun run check:phase-r-guards  # fails if todo is DONE
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  FORBIDDEN_CROSS_DOMAIN_PATTERNS,
  FORBIDDEN_SUBNAV_IMPORTS_IN_SURFACES,
  MOBILE_LAYOUT_FORBIDDEN_PATTERNS,
  isAllowedCrossSurfaceImport,
  isAllowedFeatureImport,
  resolveDomainForRoute,
  resolveDomainForSurfaceFolder,
} from '../apps/web/src/product/shell/surface-domain-boundary.ts';

const root = process.cwd();

type Violation = { id: string; message: string };

function read(path: string): string {
  return readFileSync(join(root, path.replaceAll('\\', '/')), 'utf8');
}

function collectFiles(
  dir: string,
  ext: string,
  skip = new Set(['node_modules', 'dist', '__tests__']),
): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  let out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const path = join(abs, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (!skip.has(entry)) out = out.concat(collectFiles(join(dir, entry), ext, skip));
      continue;
    }
    if (entry.endsWith(ext)) out.push(join(dir, entry).replaceAll('\\', '/'));
  }
  return out;
}

/** Parse `[x] DONE` todo ids from ACTIVE_WORK_SSOT + REBUILD_PLAN (재착수 금지). */
function parseCompletedTodoIds(): Set<string> {
  const ids = new Set<string>();
  const sources = ['docs/SSOT/ACTIVE_WORK_SSOT.md', 'docs/PRODUCT/REBUILD_PLAN_v1.md'];

  for (const rel of sources) {
    if (!existsSync(join(root, rel))) continue;
    const lines = read(rel).split('\n');
    for (const line of lines) {
      const doneMatch = line.match(/\|\s*`([a-z0-9][a-z0-9-]*)`\s*\|\s*`\[x\]/i);
      if (doneMatch) ids.add(doneMatch[1]!);
      const backtickDone = line.match(/`([a-z0-9][a-z0-9-]*)`\s*\|\s*`\[x\]\s*DONE`/i);
      if (backtickDone) ids.add(backtickDone[1]!);
      const inlineDone = line.match(/\*\*`([a-z0-9][a-z0-9-]*)`\s*`\[x\]`\*\*/);
      if (inlineDone) ids.add(inlineDone[1]!);
      const gateDone = line.match(/\(`([a-z0-9][a-z0-9-]*)`\s*·/);
      if (gateDone && /\[x\]\s*DONE|재착수\s*금지|VISUAL\s*APPROVED/i.test(line)) {
        ids.add(gateDone[1]!);
      }
    }
  }

  return ids;
}

function checkDuplicateWorkIntent(): Violation[] {
  const out: Violation[] = [];
  const todo = process.env.PHONARA_IMPL_TODO?.trim();
  if (!todo) return out;

  const completed = parseCompletedTodoIds();
  if (completed.has(todo)) {
    out.push({
      id: 'duplicate-work:todo-done',
      message: `PHONARA_IMPL_TODO=${todo} is marked [x] DONE / 재착수 금지 in ACTIVE_WORK_SSOT or REBUILD_PLAN — STOP and report to operator`,
    });
  }

  return out;
}

function extractSurfaceImportFolder(importPath: string): string | null {
  const surfaceMatch = importPath.match(/\/surfaces\/([^/'"]+)/);
  return surfaceMatch?.[1] ?? null;
}

function extractFeatureImportFolder(importPath: string): string | null {
  const featureMatch = importPath.match(/\/features\/([^/'"]+)/);
  return featureMatch?.[1] ?? null;
}

function surfaceFolderFromPath(filePath: string): string | null {
  const match = filePath.match(/product\/surfaces\/([^/]+)\//);
  return match?.[1] ?? null;
}

function checkPageRootMobileLayout(src: string, file: string): Violation[] {
  const out: Violation[] = [];
  const rootTagPattern =
    /<(section|main|article|div)[^>]*className=\{?cn\([^)]*\)\}?[^>]*>|<(section|main|article|div)[^>]*className="[^"]*"[^>]*>/;
  const rootMatch = src.match(rootTagPattern);
  if (!rootMatch) return out;
  const rootLine = rootMatch[0]!;
  for (const rule of MOBILE_LAYOUT_FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(rootLine)) {
      out.push({
        id: `mobile-layout:${file}`,
        message: `${file}: page root — ${rule.reason}`,
      });
    }
  }
  return out;
}

function checkCrossDomainSurfaceImports(): Violation[] {
  const out: Violation[] = [];
  const productDir = 'apps/web/src/product/surfaces';
  const files = collectFiles(productDir, '.tsx').concat(collectFiles(productDir, '.ts'));

  for (const file of files) {
    const src = read(file);
    const fromFolder = surfaceFolderFromPath(file);
    if (!fromFolder) continue;

    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(src)) !== null) {
      const importPath = match[1]!;
      const importedSurface = extractSurfaceImportFolder(importPath);
      if (importedSurface && !isAllowedCrossSurfaceImport(fromFolder, importedSurface)) {
        out.push({
          id: `cross-domain-surface:${file}`,
          message: `${file}: ${fromFolder} surface must not import surfaces/${importedSurface} (§12.19 domain isolation)`,
        });
      }

      const importedFeature = extractFeatureImportFolder(importPath);
      if (importedFeature && !isAllowedFeatureImport(fromFolder, importedFeature)) {
        out.push({
          id: `cross-domain-feature:${file}`,
          message: `${file}: ${fromFolder} surface must not import features/${importedFeature} (wrong product chapter)`,
        });
      }
    }

    for (const pattern of FORBIDDEN_CROSS_DOMAIN_PATTERNS) {
      if (pattern.test(src)) {
        out.push({
          id: `forbidden-embed:${file}`,
          message: `${file}: forbidden cross-domain embed pattern ${pattern.source}`,
        });
        break;
      }
    }

    if (FORBIDDEN_SUBNAV_IMPORTS_IN_SURFACES.test(src)) {
      out.push({
        id: `subnav-in-surface:${file}`,
        message: `${file}: domain subnav belongs in AppShell only — do not mount subnav inside surface pages`,
      });
    }

    const isPageRoot =
      file.endsWith('-page.tsx') ||
      file.endsWith('-desk-page.tsx') ||
      file.endsWith('-hub-page.tsx');
    if (isPageRoot) {
      out.push(...checkPageRootMobileLayout(src, file));

      const horizontalSubnavCount = (src.match(/HorizontalSubnav/g) ?? []).length;
      if (horizontalSubnavCount > 0) {
        out.push({
          id: `duplicate-subnav:${file}`,
          message: `${file}: page must not render HorizontalSubnav — AppShell owns domain chrome (prevents stacked scroll)`,
        });
      }
    }
  }

  return out;
}

function checkRouteSurfaceDomainAlignment(): Violation[] {
  const out: Violation[] = [];
  const routesDir = join(root, 'apps/web/src/routes');
  if (!existsSync(routesDir)) return out;

  const routePaths = new Map<string, string[]>();

  for (const file of readdirSync(routesDir)) {
    if (!file.endsWith('.tsx') || file.startsWith('__')) continue;
    const rel = `apps/web/src/routes/${file}`;
    const src = read(rel);
    const routeMatch = src.match(/createFileRoute\(\s*['"]([^'"]+)['"]\s*\)/);
    if (!routeMatch) continue;

    const routePath = routeMatch[1]!;
    const list = routePaths.get(routePath) ?? [];
    list.push(rel);
    routePaths.set(routePath, list);

    const surfaceImport = src.match(/from\s+['"][^'"]*\/surfaces\/([^/'"]+)/);
    if (!surfaceImport) continue;

    const importedFolder = surfaceImport[1]!;
    const routeDomain = resolveDomainForRoute(routePath);
    const surfaceDomain = resolveDomainForSurfaceFolder(importedFolder);
    if (
      routeDomain === null ||
      surfaceDomain === null ||
      surfaceDomain === 'neutral' ||
      routeDomain === 'landing' ||
      routeDomain === 'legal' ||
      routeDomain === 'auth'
    ) {
      continue;
    }
    if (routeDomain !== surfaceDomain) {
      out.push({
        id: `route-domain-mismatch:${rel}`,
        message: `${rel}: route ${routePath} (${routeDomain}) imports surfaces/${importedFolder} (${surfaceDomain}) — wrong product chapter`,
      });
    }
  }

  for (const [routePath, files] of routePaths) {
    if (files.length > 1) {
      out.push({
        id: `duplicate-route:${routePath}`,
        message: `Duplicate createFileRoute('${routePath}') in: ${files.join(', ')}`,
      });
    }
  }

  return out;
}

function checkOrphanSurfaceFolders(): Violation[] {
  const out: Violation[] = [];
  const surfacesRoot = join(root, 'apps/web/src/product/surfaces');
  if (!existsSync(surfacesRoot)) return out;

  for (const entry of readdirSync(surfacesRoot)) {
    const path = join(surfacesRoot, entry);
    if (!statSync(path).isDirectory()) continue;
    if (entry === '__tests__') continue;
    const domain = resolveDomainForSurfaceFolder(entry);
    if (domain === null) {
      out.push({
        id: `orphan-surface-folder:${entry}`,
        message: `product/surfaces/${entry} is not registered in surface-domain-boundary.ts — add to plan or remove duplicate folder`,
      });
    }
  }

  return out;
}

function checkPlanDuplicateSurfaceFiles(): Violation[] {
  const out: Violation[] = [];
  const seen = new Map<string, string[]>();
  const surfacesRoot = 'apps/web/src/product/surfaces';

  for (const file of collectFiles(surfacesRoot, '.tsx')) {
    if (file.includes('__tests__')) continue;
    const base = file.split('/').pop()!;
    if (!base.endsWith('-page.tsx') && !base.endsWith('-desk-page.tsx')) continue;
    const list = seen.get(base) ?? [];
    list.push(file);
    seen.set(base, list);
  }

  for (const [base, files] of seen) {
    if (files.length > 1) {
      const folders = files.map((f) => surfaceFolderFromPath(f)).filter(Boolean);
      const uniqueDomains = new Set(folders.map((f) => resolveDomainForSurfaceFolder(f!)));
      if (uniqueDomains.size > 1) {
        out.push({
          id: `duplicate-page-name:${base}`,
          message: `Parallel page implementations for ${base}: ${files.join(', ')} — extend existing surface instead`,
        });
      }
    }
  }

  return out;
}

function collectPhaseRGuardViolations(): Violation[] {
  return [
    ...checkDuplicateWorkIntent(),
    ...checkCrossDomainSurfaceImports(),
    ...checkRouteSurfaceDomainAlignment(),
    ...checkOrphanSurfaceFolders(),
    ...checkPlanDuplicateSurfaceFiles(),
  ];
}

export { collectPhaseRGuardViolations, parseCompletedTodoIds };

function main(): void {
  const strict =
    process.argv.includes('--strict') || process.env.PHONARA_PHASE_R_GUARDS_STRICT === '1';

  const violations = collectPhaseRGuardViolations();

  if (violations.length === 0) {
    console.log('check:phase-r-guards OK — no duplicate-work signal · domain boundaries clean');
    return;
  }

  for (const v of violations) {
    console.error(`[phase-r-guard] ${v.id}: ${v.message}`);
  }

  if (strict) {
    console.error(`check:phase-r-guards FAIL — ${violations.length} violation(s)`);
    console.error(
      'AI STOP: report to operator before continuing — see .cursor/rules/97-phase-r-surface-domain-guard.mdc',
    );
    process.exit(1);
  }

  console.error(
    `check:phase-r-guards WARN — ${violations.length} violation(s) (non-strict; use --strict to fail)`,
  );
}

main();
