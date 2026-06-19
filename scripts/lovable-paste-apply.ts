#!/usr/bin/env tsx
/**
 * Apply Lovable staging → PHONARA paste (operator GO Wave-1).
 * COPY/ADAPT per scripts/lib/lovable-paste-map.ts · slice-by-slice.
 *
 * Usage:
 *   bun run lovable:paste -- --slice p0
 *   bun run lovable:paste -- --slice p1
 *   bun run lovable:paste -- --slice all
 */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { basename, dirname, join, relative } from 'node:path';
import {
  LOVABLE_INTAKE_STAGING,
  PASTE_DIRECTORY_RULES,
  PASTE_PAGE_RULES,
} from './lib/lovable-paste-map';

const repoRoot = process.cwd();

const PAGE_COMPONENT_MAP: Record<string, string> = {
  'routes/index.tsx': 'ImportedLandingPage',
  'routes/home.tsx': 'ImportedHomePage',
  'routes/earn.tsx': 'ImportedEarnPage',
  'routes/trade.tsx': 'ImportedTradePage',
  'routes/account.tsx': 'ImportedAccountPage',
  'routes/settings.tsx': 'ImportedSettingsPage',
  'routes/referral.tsx': 'ImportedReferralPage',
  'routes/about.tsx': 'ImportedAboutPage',
  'routes/terms.tsx': 'ImportedTermsPage',
  'routes/privacy.tsx': 'ImportedPrivacyPage',
  'routes/login.tsx': 'ImportedLoginPage',
  'routes/signup.tsx': 'ImportedSignupPage',
  'routes/dashboard.tsx': 'ImportedDashboardPage',
  'routes/wallet.tsx': 'ImportedWalletPage',
  'routes/ledger.tsx': 'ImportedLedgerPage',
  'routes/staking.tsx': 'ImportedStakingPage',
  'routes/more.tsx': 'ImportedMorePage',
  'routes/games.tsx': 'ImportedGamesCatalogPage',
  'routes/casino.fairness.tsx': 'ImportedGamesFairnessPage',
  'routes/sports.tsx': 'ImportedSportsPage',
};

const EXTRA_COPY: { src: string; dest: string }[] = [
  { src: 'components/pages', dest: 'apps/web/src/presentation-import/pages/_staging-pages' },
  { src: 'components/social', dest: 'apps/web/src/components/social' },
  { src: 'components/home', dest: 'apps/web/src/components/home' },
  { src: 'assets', dest: 'apps/web/src/assets' },
  { src: 'public/games', dest: 'apps/web/public/games' },
  { src: 'lib/social-proof', dest: 'apps/web/src/lib/social-proof' },
  { src: 'hooks/use-mobile.tsx', dest: 'apps/web/src/hooks/use-mobile.tsx' },
  { src: 'hooks/useGameShortkeys.ts', dest: 'apps/web/src/hooks/useGameShortkeys.ts' },
  { src: 'hooks/useHandedness.ts', dest: 'apps/web/src/hooks/useHandedness.ts' },
  { src: 'hooks/useInView.ts', dest: 'apps/web/src/hooks/useInView.ts' },
  { src: 'hooks/usePageVisible.ts', dest: 'apps/web/src/hooks/usePageVisible.ts' },
  { src: 'hooks/useGameRecentWins.ts', dest: 'apps/web/src/hooks/useGameRecentWins.ts' },
  { src: 'hooks/useHotMultipliers.ts', dest: 'apps/web/src/hooks/useHotMultipliers.ts' },
  { src: 'hooks/useLiveCount.ts', dest: 'apps/web/src/hooks/useLiveCount.ts' },
  { src: 'hooks/useLiveTickerFeed.ts', dest: 'apps/web/src/hooks/useLiveTickerFeed.ts' },
  { src: 'hooks/useRecentPlays.ts', dest: 'apps/web/src/hooks/useRecentPlays.ts' },
  { src: 'lib/motion.ts', dest: 'apps/web/src/lib/motion.ts' },
  { src: 'lib/confetti.ts', dest: 'apps/web/src/lib/confetti.ts' },
  { src: 'lib/toast-variants.ts', dest: 'apps/web/src/lib/toast-variants.ts' },
  { src: 'lib/useCountUp.ts', dest: 'apps/web/src/lib/useCountUp.ts' },
  { src: 'i18n', dest: 'apps/web/src/i18n' },
  { src: 'lib/format.ts', dest: 'apps/web/src/lib/format.ts' },
  { src: 'lib/utils.ts', dest: 'apps/web/src/lib/utils.ts' },
];

function findSrcRoot(): string {
  const stagingRoot = join(repoRoot, LOVABLE_INTAKE_STAGING);
  const direct = join(stagingRoot, 'src');
  if (existsSync(join(direct, 'i18n')) || existsSync(join(direct, 'components'))) return direct;
  for (const entry of readdirSync(stagingRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const nested = join(stagingRoot, entry.name, 'src');
    if (existsSync(nested)) return nested;
  }
  throw new Error(`Lovable src/ not found under ${LOVABLE_INTAKE_STAGING}`);
}

function copyDir(src: string, dest: string, skipFiles: string[] = []) {
  if (!existsSync(src)) {
    console.warn(`[paste] SKIP missing: ${relative(repoRoot, src)}`);
    return 0;
  }
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const name of readdirSync(src)) {
    if (name === 'useMockPipeline.ts') continue;
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) {
      count += copyDir(from, to, skipFiles);
    } else {
      cpSync(from, to, { force: true });
      count++;
    }
  }
  return count;
}

function copyFile(src: string, dest: string) {
  if (!existsSync(src)) {
    console.warn(`[paste] SKIP missing file: ${relative(repoRoot, src)}`);
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { force: true });
}

function gameFolderName(lovableName: string): string {
  const map: Record<string, string> = {
    mint_reels: 'mint-reels',
    gold_rush: 'gold-rush',
  };
  return map[lovableName] ?? lovableName.replace(/_/g, '-');
}

function applyDirectoryRules(srcRoot: string, filter?: (rule: (typeof PASTE_DIRECTORY_RULES)[number]) => boolean) {
  let total = 0;
  for (const rule of PASTE_DIRECTORY_RULES) {
    if (filter && !filter(rule)) continue;
    const src = join(srcRoot, rule.lovableGlob);
    let dest = join(repoRoot, rule.phonaraDir);
    if (rule.lovableGlob.startsWith('games/')) {
      const game = rule.lovableGlob.replace('games/', '');
      dest = join(repoRoot, 'apps/web/src/components/games', gameFolderName(game));
    }
    if (rule.action === 'SKIP') continue;
    const n = copyDir(src, dest);
    console.log(`[paste] [${rule.action}] ${rule.lovableGlob} → ${relative(repoRoot, dest)} (${n} files)`);
    total += n;
  }
  return total;
}

function mergeStyles(srcRoot: string) {
  const stylesSrc = join(srcRoot, 'styles.css');
  const motionSrc = join(srcRoot, 'games/shared/motion-tokens.css');
  const globalsDest = join(repoRoot, 'apps/web/src/presentation-import/styles/lovable-globals.css');

  if (!existsSync(stylesSrc)) {
    console.warn('[paste] styles.css missing');
    return;
  }

  let css = readFileSync(stylesSrc, 'utf8');
  css = css
    .replace(/@import "tailwindcss" source\(none\);\s*/g, '')
    .replace(/@source "\.\.\/src";\s*/g, '')
    .replace(/@import "tw-animate-css";\s*/g, '');

  writeFileSync(
    globalsDest,
    `/* Auto-pasted from Lovable styles.css — Wave-1 (presentation scope) */\n${css}\n`,
    'utf8',
  );

  if (existsSync(motionSrc)) {
    const motionDest = join(repoRoot, 'apps/web/src/components/games/shared/motion-tokens.css');
    copyFile(motionSrc, motionDest);
  }

  console.log('[paste] [MERGE] styles.css → lovable-globals.css');
}

function wirePageFromStagingComponent(pageFile: string, componentName: string) {
  const stagingPages = join(repoRoot, 'apps/web/src/presentation-import/pages/_staging-pages', `${componentName}.tsx`);
  if (!existsSync(stagingPages)) {
    console.warn(`[paste] page component missing: ${componentName}`);
    return;
  }
  const body = readFileSync(stagingPages, 'utf8');
  writeFileSync(join(repoRoot, 'apps/web/src/presentation-import/pages', pageFile), body, 'utf8');
  console.log(`[paste] [PAGE] ${componentName} → pages/${pageFile}`);
}

function extractRouteComponent(routeRel: string, exportName: string, destFile: string) {
  const srcRoot = findSrcRoot();
  const routePath = join(srcRoot, routeRel);
  if (!existsSync(routePath)) {
    console.warn(`[paste] route missing: ${routeRel}`);
    return;
  }
  const raw = readFileSync(routePath, 'utf8');
  const cleaned = raw
    .replace(/import \{ createFileRoute \} from "@tanstack\/react-router";\n?/g, '')
    .replace(/export const Route = createFileRoute\([\s\S]*?\);\s*$/m, '')
    .replace(/^function (\w+)/m, 'export function $1')
    .trim();

  const header = `/* Extracted from Lovable ${routeRel} — Wave-1 ADAPT */\n`;
  writeFileSync(join(repoRoot, 'apps/web/src/presentation-import/pages', destFile), `${header}${cleaned}\n`, 'utf8');
  console.log(`[paste] [ROUTE→PAGE] ${routeRel} → ${destFile}`);
}

function wirePresentationPages() {
  for (const { lovableRoute, phonaraPage } of PASTE_PAGE_RULES) {
    const pageFile = basename(phonaraPage);
    const componentName = PAGE_COMPONENT_MAP[lovableRoute];
    if (componentName) {
      wirePageFromStagingComponent(pageFile, componentName);
    }
  }

  extractRouteComponent('routes/earn.index.tsx', 'EarnHomePage', 'earn-home-page.tsx');
  extractRouteComponent('routes/earn.missions.tsx', 'EarnMissionsPage', 'earn-missions-page.tsx');

  wirePageFromStagingComponent('responsible-gaming-page.tsx', 'ImportedResponsibleGamingPage');

  wirePageFromStagingComponent('casino-page.tsx', 'ImportedCasinoPage');

  const sportsStaging = join(repoRoot, 'apps/web/src/presentation-import/pages/_staging-pages/ImportedSportsPage.tsx');
  if (existsSync(sportsStaging)) {
    wirePageFromStagingComponent('sports-page.tsx', 'ImportedSportsPage');
  } else {
    const sportsRoute = join(findSrcRoot(), 'routes/sports.tsx');
    if (existsSync(sportsRoute)) {
      extractRouteComponent('routes/sports.tsx', 'ImportedSportsPage', 'sports-page.tsx');
    }
  }
}

function wireGameEntrypoints(srcRoot: string) {
  const gamesDir = join(srcRoot, 'games');
  if (!existsSync(gamesDir)) return;

  for (const entry of readdirSync(gamesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'preview' || entry.name === 'shared' || entry.name === '__tests__') continue;
    const indexPath = join(gamesDir, entry.name, 'index.tsx');
    if (!existsSync(indexPath)) continue;
    const folder = gameFolderName(entry.name);
    const dest = join(repoRoot, 'apps/web/src/components/games', folder, `imported-${folder}-game.tsx`);
    let content = readFileSync(indexPath, 'utf8');
    if (content.includes('useMockPipeline')) {
      content = content.replace(/useMockPipeline[\s\S]*?;/g, '');
    }
    writeFileSync(dest, content, 'utf8');
    const exportMatch = content.match(/export function (Imported\w+Game)/);
    const exportName = exportMatch?.[1] ?? `Imported${folder.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')}Game`;
    const barrel = join(repoRoot, 'apps/web/src/components/games', folder, 'index.ts');
    writeFileSync(barrel, `export { ${exportName} } from './imported-${folder}-game';\n`, 'utf8');
    console.log(`[paste] [GAME] ${entry.name}/index.tsx → games/${folder}/imported-${folder}-game.tsx`);
  }
}

function applyExtraCopy(srcRoot: string) {
  for (const { src, dest } of EXTRA_COPY) {
    const from = join(srcRoot, src);
    const to = join(repoRoot, dest);
    if (!existsSync(from)) {
      console.warn(`[paste] extra SKIP: ${src}`);
      continue;
    }
    if (statSync(from).isDirectory()) {
      const n = copyDir(from, to);
      console.log(`[paste] [EXTRA] ${src} → ${dest} (${n})`);
    } else {
      copyFile(from, to);
      console.log(`[paste] [EXTRA] ${src} → ${dest}`);
    }
  }
}

function applySlice(slice: string) {
  const srcRoot = findSrcRoot();
  console.log(`\n=== lovable:paste slice=${slice} ===\n`);

  switch (slice) {
    case 'p0':
      applyDirectoryRules(srcRoot, (r) => r.lovableGlob === 'components/ui');
      applyExtraCopy(srcRoot);
      mergeStyles(srcRoot);
      break;
    case 'p1':
      applyDirectoryRules(srcRoot, (r) =>
        ['components/shell', 'components/welcome'].includes(r.lovableGlob),
      );
      applyExtraCopy(srcRoot);
      break;
    case 'p2':
      applyExtraCopy(srcRoot);
      wirePresentationPages();
      break;
    case 'p3':
      applyDirectoryRules(srcRoot, (r) =>
        ['components/earn', 'components/fomo'].includes(r.lovableGlob),
      );
      applyExtraCopy(srcRoot);
      wirePresentationPages();
      break;
    case 'p4':
      applyDirectoryRules(srcRoot, (r) => ['components/fomo', 'components/home', 'components/welcome'].includes(r.lovableGlob));
      wirePresentationPages();
      break;
    case 'p5':
      applyDirectoryRules(srcRoot, (r) =>
        ['components/trade', 'components/sports'].includes(r.lovableGlob),
      );
      wirePresentationPages();
      break;
    case 'p6':
      wirePresentationPages();
      break;
    case 'p7':
      applyDirectoryRules(srcRoot, (r) => r.lovableGlob.startsWith('games/'));
      wireGameEntrypoints(srcRoot);
      break;
    case 'p8':
      applyDirectoryRules(srcRoot, (r) => r.lovableGlob === 'i18n');
      break;
    case 'all':
      applyDirectoryRules(srcRoot);
      applyExtraCopy(srcRoot);
      mergeStyles(srcRoot);
      wirePresentationPages();
      wireGameEntrypoints(srcRoot);
      break;
    default:
      console.error(`Unknown slice: ${slice}`);
      process.exit(1);
  }

  console.log(`\n[paste] slice ${slice} done\n`);
}

function main() {
  const sliceArg = process.argv.find((a) => a.startsWith('--slice='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--slice') + 1]
    ?? 'all';

  if (!existsSync(join(repoRoot, LOVABLE_INTAKE_STAGING))) {
    console.error('Run lovable:intake first');
    process.exit(1);
  }

  if (sliceArg === 'all') {
    for (const s of ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']) {
      applySlice(s);
    }
  } else {
    applySlice(sliceArg);
  }

  console.log('[paste] running lovable:postcheck…');
  try {
    execSync('bun run lovable:postcheck', { cwd: repoRoot, stdio: 'inherit' });
  } catch {
    console.error('[paste] postcheck FAILED — review hits before continuing');
    process.exit(1);
  }
}

main();
