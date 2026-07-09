/**
 * Pre-demolition P2 SSOT manifest generator.
 *
 * v5 Demolition deleted route/controller presentation paths and Batch 11 removed
 * the generated UI SSOT docs. This script must not recreate those artifacts until
 * Phase R defines a new route/component/controller model.
 *
 * Run: bun run generate:ssot-freeze-manifest
 *
 * Outputs:
 *   docs/SSOT/FREEZE_MANIFEST.md
 *   docs/SSOT/UI_INVENTORY.md
 *   docs/SSOT/ROUTE_CANONICAL_REGISTRY.md
 *   docs/SSOT/DISPLAY_DATA_CONTRACT.md
 *   docs/SSOT/ENGINE_INTEGRATION_PLAYBOOK.md
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(import.meta.dirname, '..');
const ssotDir = join(repoRoot, 'docs/SSOT');
const webRoutesDir = join(repoRoot, 'apps/web/src/routes');
const adminRoutesDir = join(repoRoot, 'apps/admin/src/routes');

if (!existsSync(webRoutesDir) || !existsSync(adminRoutesDir)) {
  console.log(
    'generate:ssot-freeze-manifest SKIP — v5 Demolition deleted route/controller presentation paths; Phase R will define a new manifest model',
  );
  process.exit(0);
}

const GENERATED_BANNER = `<!-- GENERATED — do not edit by hand. Run: bun run generate:ssot-freeze-manifest -->`;

interface RouteEntry {
  path: string;
  surface: string;
  controller: string | null;
  hooks: string[];
  rpcBoundary: string;
  enginePackage: string;
  dbBoundary: string;
  owner: string;
  redirects: string[];
  legacyUrls: string[];
  status: 'canonical' | 'redirect-only' | 'hub-tab' | 'conditional';
  container?: string;
  flag?: string;
  duplicateCandidates?: string[];
  pageComponent?: string;
}

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      walkTsx(full, out);
    } else if (/\.tsx$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function parseRoutePaths(content: string): string[] {
  const paths: string[] = [];
  for (const m of content.matchAll(/path:\s*['"]([^'"]+)['"]/g)) {
    paths.push(m[1]!);
  }
  return paths;
}

/** Code-derived redirect truth — paired per route export, not cross-product. */
const KNOWN_REDIRECTS: Record<string, string> = {
  '/earn': '/home',
  '/earn/missions': '/home/missions',
  '/tier': '/account',
  '/notifications': '/account',
  '/r/$code': '/signup',
};

function parseNavigateTargets(content: string, pathHint?: string): { from: string; to: string }[] {
  const redirects: { from: string; to: string }[] = [];
  const paths = pathHint ? [pathHint] : parseRoutePaths(content);

  // Match createRoute blocks with their Navigate target
  const blocks = content.split(/export const \w+ = createRoute\(/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]!;
    const pathM = block.match(/path:\s*['"]([^'"]+)['"]/);
    const navM = block.match(/<Navigate[^>]+to=['"]([^'"]+)['"]/);
    if (pathM && navM) redirects.push({ from: pathM[1]!, to: navM[1]! });
  }

  if (redirects.length === 0) {
    for (const m of content.matchAll(/<Navigate[^>]+to=['"]([^'"]+)['"]/g)) {
      const to = m[1]!;
      for (const from of paths) redirects.push({ from, to });
    }
  }

  for (const m of content.matchAll(/navigate\(\{\s*to:\s*['"]([^'"]+)['"]/g)) {
    if (paths.includes('/')) redirects.push({ from: '/', to: m[1]! });
  }

  for (const [from, to] of Object.entries(KNOWN_REDIRECTS)) {
    if (paths.includes(from) && !redirects.some((r) => r.from === from)) {
      redirects.push({ from, to });
    }
  }

  return redirects;
}

function parseSurfaceFromRoute(content: string): string | null {
  const deskImport = content.match(/import\s+\{\s*([^}]*DeskSurface[^}]*)\}\s+from/);
  if (deskImport) {
    const names = deskImport[1]!.split(',').map((s) => s.trim());
    const primary = names.find((n) => n.endsWith('DeskSurface'));
    if (primary) return primary;
  }
  const componentMatch = content.match(/component:\s*(\w+DeskSurface|\w+)/);
  if (componentMatch?.[1]?.includes('DeskSurface')) return componentMatch[1];
  if (content.includes('CasinoPage')) return 'CasinoDeskSurface';
  if (content.includes('LandingDeskSurface')) return 'LandingDeskSurface';
  if (content.includes('AuthCallbackPage')) return 'AuthCallbackPage';
  return null;
}

function findControllerFile(importPath: string, surfaceFile: string): string | null {
  const candidates = [
    join(surfaceFile, '..', importPath),
    join(surfaceFile, '..', `${importPath}.ts`),
    join(repoRoot, 'apps/web/src', importPath.replace(/^(\.\.\/)+/, '')),
    join(repoRoot, 'apps/web/src', `${importPath.replace(/^(\.\.\/)+/, '')}.ts`),
  ];
  for (const c of candidates) {
    const withTs = c.endsWith('.ts') ? c : `${c}.ts`;
    try {
      statSync(withTs);
      return withTs;
    } catch {
      /* try next */
    }
  }
  const base = importPath.split('/').pop()?.replace(/\.ts$/, '');
  if (base) {
    const featuresRoot = join(repoRoot, 'apps/web/src/features');
    try {
      const hit = walkTsx(featuresRoot).find((f) => f.endsWith(`${base}.ts`));
      if (hit) return hit;
    } catch {
      /* skip */
    }
  }
  return null;
}

function parseControllerFromSurface(surfaceFile: string | null): {
  controller: string | null;
  hooks: string[];
} {
  if (!surfaceFile) return { controller: null, hooks: [] };
  try {
    const content = readText(surfaceFile);
    const importMatch = content.match(
      /import\s+\{\s*(use\w+PageController)\s*\}\s+from\s+['"]([^'"]+)['"]/,
    );
    if (!importMatch) {
      const hookImports = [...content.matchAll(/from\s+['"].*hooks\/(use-[^'"]+)['"]/g)].map(
        (m) => m[1]!,
      );
      if (hookImports.length) return { controller: null, hooks: hookImports };
      return { controller: null, hooks: [] };
    }
    const controller = importMatch[1]!;
    const ctrlFile = findControllerFile(importMatch[2]!, surfaceFile);
    let hooks: string[] = [];
    if (ctrlFile) {
      const ctrlContent = readText(ctrlFile);
      hooks = [
        ...new Set(
          [...ctrlContent.matchAll(/from\s+['"][^'"]*hooks\/(use-[^'"]+)['"]/g)].map((m) => m[1]!),
        ),
      ];
    }
    return { controller, hooks };
  } catch {
    return { controller: null, hooks: [] };
  }
}

function findSurfaceFile(surfaceName: string): string | null {
  const roots = [join(repoRoot, 'apps/web/src/ui'), join(repoRoot, 'apps/web/src')];
  for (const root of roots) {
    try {
      const files = walkTsx(root);
      const hit = files.find((f) => readText(f).includes(`export function ${surfaceName}`));
      if (hit) return hit;
    } catch {
      /* skip */
    }
  }
  return null;
}

function inferOwner(path: string, surface: string | null): string {
  if (
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/reset-password') ||
    path === '/auth/callback'
  )
    return 'Auth';
  if (
    path.startsWith('/home') ||
    path === '/earn' ||
    path === '/earn/missions' ||
    path === '/dashboard'
  )
    return 'Earn';
  if (path === '/trade' || path.includes('trade')) return 'Trade';
  if (path.startsWith('/casino') || path.startsWith('/games')) return 'Casino';
  if (path.startsWith('/sports')) return 'Sports';
  if (path.startsWith('/wallet') || path === '/ledger' || path === '/staking') return 'Wallet';
  if (path === '/account' || path === '/settings' || path === '/tier' || path === '/notifications')
    return 'Account';
  if (path === '/security') return 'Security';
  if (path === '/referral' || path.startsWith('/r/')) return 'Referral';
  if (path === '/partner') return 'Partner';
  if (path === '/events') return 'Events';
  if (path === '/responsible-gaming') return 'RG';
  if (path === '/onboarding') return 'Onboarding';
  if (path === '/leaderboard') return 'Leaderboard';
  if (path === '/more') return 'Shell';
  if (path === '/' || surface === 'LandingDeskSurface') return 'Landing';
  if (['/about', '/faq', '/support', '/install', '/privacy', '/terms'].includes(path))
    return 'Static';
  if (path === '/share-round') return 'Casino';
  return 'App';
}

function inferEnginePackage(hooks: string[], controller: string | null): string {
  const all = [...hooks, controller ?? ''].join(' ');
  if (/casino|game/i.test(all)) return '@phonara/game-engine + casino RPC';
  if (/trading|futures|spot|staking/i.test(all)) return '@phonara/trading-engine';
  if (/wallet|ledger|deposit|withdraw|compliance/i.test(all))
    return '@phonara/wallet-ledger + @phonara/money';
  if (/sports/i.test(all)) return '@phonara/sportsbook-engine';
  if (/earn|mission|retention|referral/i.test(all)) return 'earn RPC (Supabase)';
  if (/auth|security|rg/i.test(all)) return 'Supabase Auth + RPC';
  return 'Supabase (display-only)';
}

function inferRpcBoundary(hooks: string[]): string {
  if (hooks.length === 0) return 'apps/web/src/lib/rpc.ts · supabase client';
  return hooks.map((h) => `hooks/${h}.ts`).join(' · ') + ' → lib/rpc.ts';
}

const OWNER_MAP: Record<string, Partial<RouteEntry>> = {
  '/login': { pageComponent: 'LoginPage (via LoginDeskSurface)' },
  '/signup': { pageComponent: 'SignupPage' },
  '/wallet': { pageComponent: 'WalletPage' },
  '/trade': {
    container: 'BetHubShell',
    duplicateCandidates: ['TradeDeskSurface (orphan parallel)'],
  },
  '/sports': {
    duplicateCandidates: ['BetHubShell sports tab (embedded)'],
    flag: 'dual-sports-entry — canonical standalone /sports; /trade?section=sports = hub tab',
  },
  '/home': {
    controller: 'useEarnPageController (missions) · direct useWallet (home hub)',
    duplicateCandidates: ['EarnHomeDeskSurface', 'ImportedHomePage'],
  },
};

function buildWebRoutes(): RouteEntry[] {
  const routesDir = join(repoRoot, 'apps/web/src/routes');
  const files = readdirSync(routesDir).filter((f) => f.endsWith('.tsx') && f !== '__root.tsx');
  const entries: RouteEntry[] = [];
  const seenPaths = new Set<string>();
  const redirectMap = new Map<string, string>(Object.entries(KNOWN_REDIRECTS));

  for (const file of files) {
    const full = join(routesDir, file);
    const content = readText(full);
    const paths = parseRoutePaths(content);
    const redirects = parseNavigateTargets(content);
    for (const r of redirects) redirectMap.set(r.from, r.to);

    for (const path of paths) {
      if (seenPaths.has(path)) continue;
      seenPaths.add(path);
      const surface = parseSurfaceFromRoute(content);
      const surfaceFile = surface ? findSurfaceFile(surface) : null;
      let { controller, hooks } = parseControllerFromSurface(surfaceFile);

      const overrides = OWNER_MAP[path] ?? {};
      if (path === '/home') {
        controller = null;
        hooks = ['use-auth', 'use-wallet'];
      }
      if (path === '/' && !surface) {
        entries.push({
          path: '/',
          surface: 'LandingDeskSurface (guest) · authed → /home',
          controller: null,
          hooks: ['use-auth'],
          rpcBoundary: 'contexts/auth-context',
          enginePackage: 'Supabase Auth',
          dbBoundary: 'Supabase auth.users',
          owner: 'Landing',
          redirects: ['authed / → /home'],
          legacyUrls: [],
          status: 'conditional',
        });
        continue;
      }

      const isRedirect =
        KNOWN_REDIRECTS[path] != null ||
        (content.includes('<Navigate') && !content.includes('LandingDeskSurface') && path !== '/');
      entries.push({
        path,
        surface: surface ?? (isRedirect ? '(redirect)' : '—'),
        controller: overrides.controller ?? controller,
        hooks,
        rpcBoundary: inferRpcBoundary(hooks),
        enginePackage: inferEnginePackage(hooks, controller),
        dbBoundary: 'Supabase (yocjhjsdwoijfdrehzoq)',
        owner: inferOwner(path, surface),
        redirects: isRedirect ? [redirectMap.get(path) ?? 'see route file'] : [],
        legacyUrls: path.startsWith('/earn') ? [path] : [],
        status: isRedirect ? 'redirect-only' : 'canonical',
        ...overrides,
      });
    }
  }

  // Fix /casino index surface (route file imports multiple DeskSurfaces)
  const casinoIdx = entries.findIndex((e) => e.path === '/casino');
  if (casinoIdx >= 0) {
    entries[casinoIdx]!.surface = 'CasinoLobbyDeskSurface';
    entries[casinoIdx]!.controller = null;
    entries[casinoIdx]!.hooks = [];
  }
  const fairnessIdx = entries.findIndex((e) => e.path === '/casino/fairness');
  if (fairnessIdx >= 0) {
    entries[fairnessIdx]!.surface = 'GamesFairnessDeskSurface';
  }

  // Casino multi-export routes (if not already captured)
  const casinoContent = readText(join(routesDir, 'casino.tsx'));
  const gamePaths = [...casinoContent.matchAll(/path:\s*['"](\/casino[^'"]*)['"]/g)].map(
    (m) => m[1]!,
  );
  for (const path of gamePaths) {
    if (entries.some((e) => e.path === path)) continue;
    const isLobby = path === '/casino';
    const isFairness = path === '/casino/fairness';
    entries.push({
      path,
      surface: isLobby
        ? 'CasinoLobbyDeskSurface'
        : isFairness
          ? 'GamesFairnessDeskSurface'
          : 'CasinoDeskSurface',
      controller: isLobby ? null : 'useCasinoPageController',
      hooks: isLobby ? [] : ['use-wallet', 'use-casino-round-pipeline'],
      rpcBoundary: isLobby ? 'static lobby' : 'use-casino-page-controller → casino RPC',
      enginePackage: '@phonara/game-engine',
      dbBoundary: 'Supabase casino rounds + ledger',
      owner: 'Casino',
      redirects: [],
      legacyUrls: path.startsWith('/games') ? [`/games${path.replace('/casino', '')}`] : [],
      status: 'canonical',
    });
  }

  // BetHub tabs (not routes)
  for (const tab of ['casino', 'sports', 'trade'] as const) {
    entries.push({
      path: `/trade?section=${tab}`,
      surface:
        tab === 'trade'
          ? 'TradeModeShell'
          : tab === 'sports'
            ? 'ImportedSportsPage (embedded)'
            : 'CasinoSportsLiveDesk + CasinoCrashDesk',
      controller:
        tab === 'trade'
          ? 'useTradePageController'
          : tab === 'sports'
            ? 'useSportsPageController'
            : 'useCasinoPageController (partial)',
      hooks:
        tab === 'trade'
          ? ['use-wallet', 'use-trading', 'use-prices']
          : tab === 'sports'
            ? ['sports-engine-glue']
            : ['use-wallet', 'use-casino'],
      rpcBoundary: inferRpcBoundary([]),
      enginePackage:
        tab === 'trade'
          ? '@phonara/trading-engine'
          : tab === 'sports'
            ? '@phonara/sportsbook-engine'
            : '@phonara/game-engine',
      dbBoundary: 'Supabase',
      owner: tab === 'trade' ? 'Trade' : tab === 'sports' ? 'Sports' : 'Casino',
      redirects: [],
      legacyUrls: [],
      status: 'hub-tab',
      container: 'BetHubShell',
    });
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

function buildAdminRoutes(): RouteEntry[] {
  const routesDir = join(repoRoot, 'apps/admin/src/routes');
  const files = readdirSync(routesDir).filter((f) => f.endsWith('.tsx'));
  const entries: RouteEntry[] = [];

  for (const file of files) {
    const content = readText(join(routesDir, file));
    const paths = parseRoutePaths(content);
    const pageMatch = content.match(/Admin(\w+Page)/);
    const page = pageMatch ? `Admin${pageMatch[1]}` : file.replace('.tsx', '');

    for (const path of paths) {
      entries.push({
        path: `/admin${path === '/' ? '' : path}`,
        surface: 'AdminDeskSurface',
        controller: null,
        hooks: ['admin auth context · react-query'],
        rpcBoundary: 'apps/admin service role RPC',
        enginePackage: 'Supabase (admin RLS bypass via service)',
        dbBoundary: 'Supabase',
        owner: 'Admin',
        redirects: path === '/' ? ['/ → /login'] : [],
        legacyUrls: [],
        status: path === '/' ? 'redirect-only' : 'canonical',
        pageComponent: page,
      });
    }
  }
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

function formatFreezeManifest(web: RouteEntry[], admin: RouteEntry[]): string {
  const lines: string[] = [
    GENERATED_BANNER,
    '',
    '# Freeze Manifest',
    '',
    `> **Generated:** ${new Date().toISOString().slice(0, 10)} · **Source:** codebase via \`generate-ssot-freeze-manifest.ts\``,
    '> **Rule:** Route → Surface → Controller → Hook → RPC → Engine → DB. Do not infer from deleted docs.',
    '',
    '## Protected boundaries (never delete/modify behavior in UI-only work)',
    '',
    '- `supabase/**`, `packages/money`, `packages/game-engine`, `packages/trading-engine`, `packages/sportsbook-engine`, `packages/wallet-ledger`',
    '- `apps/web/src/features/**/use-*-page-controller*`',
    '- `apps/web/src/contracts/**`, `hooks/use-trading.ts`, `hooks/use-wallet.ts`, `lib/rpc.ts`',
    '',
    '## User app',
    '',
  ];

  for (const e of web) {
    if (e.status === 'redirect-only') continue;
    lines.push(`### \`${e.path}\``);
    lines.push('');
    lines.push('```text');
    lines.push(`${e.path}`);
    lines.push(`→ ${e.surface}${e.container ? ` (container: ${e.container})` : ''}`);
    lines.push(`→ ${e.controller ?? '(no page controller — hooks/shell only)'}`);
    lines.push(`→ ${e.hooks.length ? e.hooks.join(', ') : '(none)'}`);
    lines.push(`→ ${e.rpcBoundary}`);
    lines.push(`→ ${e.enginePackage}`);
    lines.push(`→ ${e.dbBoundary}`);
    if (e.flag) lines.push(`flag: ${e.flag}`);
    lines.push('```');
    lines.push('');
  }

  lines.push('## Redirect-only URLs', '');
  for (const e of web.filter((r) => r.status === 'redirect-only')) {
    lines.push(`- \`${e.path}\` → \`${e.redirects[0] ?? '?'}\``);
  }

  lines.push('', '## Admin app', '');
  for (const e of admin.filter((r) => r.status !== 'redirect-only')) {
    lines.push(`### \`${e.path}\``);
    lines.push('');
    lines.push('```text');
    lines.push(`${e.path}`);
    lines.push(`→ ${e.surface}`);
    lines.push(`→ ${e.pageComponent ?? 'Admin page'}`);
    lines.push(`→ ${e.rpcBoundary}`);
    lines.push(`→ ${e.enginePackage}`);
    lines.push(`→ ${e.dbBoundary}`);
    lines.push('```');
    lines.push('');
  }

  lines.push('## Regenerate when', '');
  lines.push(
    '- Route add/remove · redirect change · surface/controller wiring change · hook/RPC boundary change',
    '',
  );

  return lines.join('\n');
}

function formatUiInventory(web: RouteEntry[], admin: RouteEntry[]): string {
  const lines: string[] = [
    GENERATED_BANNER,
    '',
    '# UI Inventory',
    '',
    `> **Generated:** ${new Date().toISOString().slice(0, 10)}`,
    '',
    '| Route | Owner | Canonical Surface | Canonical Component | Status | Duplicate candidates | Action |',
    '|-------|-------|-------------------|---------------------|--------|----------------------|--------|',
  ];

  for (const e of [...web, ...admin]) {
    if (e.status === 'redirect-only') continue;
    const dup = e.duplicateCandidates?.join('; ') ?? 'None';
    const action = e.status === 'hub-tab' ? 'Rebuild tab panel in place' : 'Replace in place';
    lines.push(
      `| \`${e.path}\` | ${e.owner} | ${e.surface} | ${e.pageComponent ?? e.surface} | Rebuild target | ${dup} | ${action} |`,
    );
  }

  lines.push('', '## Redirect-only (no standalone rebuild)', '');
  for (const e of web.filter((r) => r.status === 'redirect-only')) {
    lines.push(
      `- \`${e.path}\` → canonical \`${e.redirects[0]}\` — **do not** start U-phase as standalone surface`,
    );
  }

  lines.push('', '## Package ownership', '');
  lines.push('| Package | Scope | UI reset |');
  lines.push('|---------|-------|----------|');
  lines.push('| `@phonara/ui` | Engine/trade/shell DS | Rebuild presentation · API compat |');
  lines.push('| `@phonara/game-ui` | Game canvas/Pixi | Protected · in-place presentation only |');
  lines.push(
    '| `apps/web/src/components/ui` | Paste-zone shadcn | Rebuild · consolidate per wave |',
  );

  return lines.join('\n');
}

function formatRouteRegistry(web: RouteEntry[], admin: RouteEntry[]): string {
  const lines: string[] = [
    GENERATED_BANNER,
    '',
    '# Route Canonical Registry',
    '',
    `> **Generated:** ${new Date().toISOString().slice(0, 10)}`,
    '',
    '| Route | Owner | Canonical Surface | Redirects | Legacy URLs | Status |',
    '|-------|-------|-------------------|-----------|-------------|--------|',
  ];

  for (const e of [...web, ...admin]) {
    const redir = e.redirects.length ? e.redirects.join(', ') : '—';
    const legacy = e.legacyUrls.length ? e.legacyUrls.join(', ') : 'none';
    const status = e.container ? `${e.status} · container: ${e.container}` : e.status;
    lines.push(`| \`${e.path}\` | ${e.owner} | ${e.surface} | ${redir} | ${legacy} | ${status} |`);
  }

  lines.push('', '## Canonical decisions', '');
  lines.push('- **Earn hub:** `/home` (not `/earn`) — `/earn` redirect-only');
  lines.push(
    '- **Sports:** standalone `/sports` = canonical sportsbook; `/trade?section=sports` = BetHub embedded entry',
  );
  lines.push('- **Trade:** `/trade` = BetHubShell; `/trade?section=trade` = futures/spot terminal');
  lines.push(
    '- **Casino games:** `/casino/{game}` canonical; `/games/*` parallel catalog (inventory duplicate — converge in C-wave)',
  );

  lines.push('', '## Blueprint mapping flags', '');
  lines.push('| Blueprint area | Canonical route/tab | Notes |');
  lines.push('|----------------|---------------------|-------|');
  lines.push('| D1 Auth | `/login`, `/signup`, `/reset-password` | OK |');
  lines.push('| D2 Wallet | `/wallet`, `/ledger`, `/staking` | OK |');
  lines.push('| D3 Trade | `/trade?section=trade` | Hub tab |');
  lines.push('| D4 Sports | `/sports` + hub tab | dual entry documented |');
  lines.push('| D5 Casino | `/casino`, `/casino/*` | OK |');
  lines.push('| D4 Earn | `/home`, `/home/missions` | `/earn` redirect |');
  lines.push('| Admin | `/admin/*` | 14 desk routes |');

  return lines.join('\n');
}

interface DisplayFieldAudit {
  domain: string;
  field: string;
  contractLocation: string;
  status: 'exposed' | 'missing-from-contract' | 'ui-only-local' | 'hook-only-not-in-controller';
  notes: string;
}

function buildDisplayContractAudits(): DisplayFieldAudit[] {
  const shapesPath = join(repoRoot, 'apps/web/src/contracts/page-controller-view-shapes.ts');
  const shapes = readText(shapesPath);
  const audits: DisplayFieldAudit[] = [];

  const add = (
    domain: string,
    field: string,
    loc: string,
    status: DisplayFieldAudit['status'],
    notes: string,
  ) => {
    audits.push({ domain, field, contractLocation: loc, status, notes });
  };

  // Wallet / balance
  for (const f of [
    'heroBalanceDisplay',
    'phonAvailableDisplay',
    'usdtAvailableDisplay',
    'withdrawAvailableDisplay',
    'giftcardPreviewFeeDisplay',
  ]) {
    add(
      'Wallet',
      f,
      'WalletPageControllerView',
      shapes.includes(f) ? 'exposed' : 'missing-from-contract',
      '',
    );
  }

  // Trade / PnL / margin
  add(
    'Trade',
    'futuresPositions (incl. realized_pnl, margin_amount, liquidation_price, open_fee)',
    'TradePageControllerView.futuresPositions',
    shapes.includes('futuresPositions') ? 'exposed' : 'missing-from-contract',
    'Position rows from DB via useFuturesPositions',
  );
  add(
    'Trade',
    'phonAvail / usdtAvail',
    'TradePageControllerView',
    'exposed',
    'Wallet balances for order panel',
  );
  add(
    'Trade',
    'oraclePriceDisplay / priceDisplay',
    'TradePageControllerView',
    'exposed',
    'Display-only formatted prices',
  );
  add(
    'Trade',
    'margin input / margin mode',
    'TradePageControllerView',
    'missing-from-contract',
    'useFuturesActions local state — not on TradePageControllerView; UI must not invent margin',
  );
  add(
    'Trade',
    'unrealized PnL per position',
    'FuturesPosition row',
    'hook-only-not-in-controller',
    'Available on position objects if UI reads futuresPositions[].realized_pnl / computed display in presentation layer from RPC fields only',
  );

  // Casino / auto bet
  add(
    'Casino',
    'autoBet action',
    'CasinoPageControllerView.autoBet',
    'exposed',
    'Pipeline auto bet — not session stats',
  );
  add('Casino', 'available balance', 'CasinoPageControllerView.available', 'exposed', '');
  add(
    'Casino',
    'Auto Bet running state',
    'useAutoBetQueue (UI-only hook)',
    'ui-only-local',
    'remaining, runningStake, cumulativeProfit, firesPlaced — **not** in CasinoPageControllerView',
  );
  add(
    'Casino',
    'Auto Bet remaining cycles',
    'useAutoBetQueue.remaining',
    'ui-only-local',
    'Presentation queue state — OK for UI-only; must not drive ledger',
  );
  add(
    'Casino',
    'Auto Bet stop conditions (profit/loss limits)',
    'AutoBetConfig in useAutoBetQueue',
    'ui-only-local',
    'stopOnProfit, stopOnLoss — client queue only',
  );
  add(
    'Casino',
    'Auto Bet session profit',
    'useAutoBetQueue.cumulativeProfit',
    'ui-only-local',
    'Display-only cumulative string',
  );
  add(
    'Casino',
    'Auto Bet live statistics (firesPlaced)',
    'useAutoBetQueue.firesPlaced',
    'ui-only-local',
    'Session counter — not RPC',
  );

  // Sports / odds
  add(
    'Sports',
    'odds / fixture prices',
    'SportsPageControllerView.hubProps',
    'exposed',
    'Via SportsHubControllerProps — verify in sports controller',
  );
  add('Sports', 'sportsBlocked / gate reason', 'SportsPageControllerView', 'exposed', '');

  // Staking
  add(
    'Staking',
    'balanceDisplay / rewardsDisplay / aprDisplay',
    'StakingPageControllerView',
    'exposed',
    '',
  );

  // Ledger / fees
  add(
    'Wallet',
    'ledger rows (amount/fee)',
    'LedgerPageControllerView.rows',
    'exposed',
    'LedgerRowView from RPC',
  );

  // Settlement
  add(
    'Casino',
    'settlement / bet result',
    'CasinoPageControllerView.bet / settledResult',
    'exposed',
    '',
  );

  // Risk
  add('RG', 'deposit/loss limits', 'RgPageViewProps via useRgPageController', 'exposed', '');
  add(
    'Trade',
    'oracleStale / circuit breaker',
    'TradePageControllerView.oracleStale',
    'exposed',
    '',
  );
  add(
    'Wallet',
    'phonKrwRateStale / rate unavailable',
    'WalletPageControllerView.phonKrwRateStale',
    'exposed',
    '15min TTL parity with server phon_krw_rate_stale',
  );

  return audits;
}

function formatDisplayContract(audits: DisplayFieldAudit[]): string {
  const lines: string[] = [
    GENERATED_BANNER,
    '',
    '# Display Data Contract Audit',
    '',
    `> **Generated:** ${new Date().toISOString().slice(0, 10)} · **Source:** \`page-controller-view-shapes.ts\` + hook scan`,
    '> **Rule:** UI displays controller/hook/RPC values only. No client-side money recompute.',
    '',
    '| Domain | Display field | Contract location | Status | Notes |',
    '|--------|---------------|-------------------|--------|-------|',
  ];

  for (const a of audits) {
    lines.push(
      `| ${a.domain} | ${a.field} | ${a.contractLocation} | **${a.status}** | ${a.notes} |`,
    );
  }

  lines.push('', '## Summary', '');
  const missing = audits.filter((a) => a.status === 'missing-from-contract');
  const uiOnly = audits.filter((a) => a.status === 'ui-only-local');
  lines.push(`- **exposed:** ${audits.filter((a) => a.status === 'exposed').length}`);
  lines.push(
    `- **ui-only-local:** ${uiOnly.length} (Auto Bet queue — allowed; must not mutate ledger)`,
  );
  lines.push(`- **missing-from-contract:** ${missing.length}`);
  lines.push(
    `- **hook-only-not-in-controller:** ${audits.filter((a) => a.status === 'hook-only-not-in-controller').length}`,
  );

  lines.push('', '## Product decisions required before U-phase', '');
  for (const m of missing) {
    lines.push(
      `- **${m.domain} · ${m.field}** — options: remove from blueprint, show "not available yet", or operator-approved engine/controller work (separate from UI reset)`,
    );
  }

  lines.push('', '## Auto Bet explicit boundary', '');
  lines.push(
    'Auto Bet **session UI state** (`useAutoBetQueue`) is intentionally **outside** `CasinoPageControllerView`.',
  );
  lines.push('The controller exposes only `autoBet()` pipeline action and `available` balance.');
  lines.push(
    'Rebuild UI may show queue stats from the hook; it must **not** recompute payouts or balances.',
  );

  lines.push('', '## Controllers without freeze type', '');
  lines.push('- `useAccountPageController` — no `FreezeControllerView` yet');
  lines.push('- `useOnboardingPageController` — no `FreezeControllerView` yet');
  lines.push(
    '- **Action:** add freeze shapes before account/onboarding U-phase, or treat as presentation-only static',
  );

  return lines.join('\n');
}

type FieldCategory =
  | 'display'
  | 'action'
  | 'loading'
  | 'error'
  | 'empty'
  | 'success'
  | 'permission'
  | 'money';

interface ParsedControllerView {
  displayValues: string[];
  actionHandlers: string[];
  loadingFields: string[];
  errorFields: string[];
  emptyFields: string[];
  successFields: string[];
  permissionFields: string[];
  moneyFields: string[];
}

interface PlaybookMeta {
  id: string;
  surface: string;
  routes: string[];
  container?: string;
  controller: string | null;
  viewType: string | null;
  hooks: string[];
  rpcBoundary: string;
  enginePackage: string;
  dbBoundary: string;
  extraDisplay?: string[];
  extraActions?: string[];
  loadingSource: string;
  errorSource: string;
  emptySource: string;
  successSource: string;
  permissionSource: string;
  moneySource: string;
  forbiddenDirectCalls: string[];
  testFixture: string;
  mountSmokeTest: string;
  notes?: string[];
  supplementalHooks?: string[];
}

function categorizeField(name: string): FieldCategory | null {
  if (
    /^(handle|open|close|confirm|submit|request|prepare|select|update|refresh|copy|cancel|reset|dismiss|claim|spin|stake|autoBet|finish|goNext|goBack|skip|retry|resend|on[A-Z]|setSelected|markOnboarding|refetch)/.test(
      name,
    )
  ) {
    return 'action';
  }
  if (/Loading|loading|Busy|busy|Fetching|fetching|spinning|SpinBusy/.test(name)) return 'loading';
  if (
    /Error|errorKey|errorMessage|hubErrorKey|spinErrorKey|pricesError|positionsError|marketsError|walletError/.test(
      name,
    )
  ) {
    return 'error';
  }
  if (name === 'empty') return 'empty';
  if (
    /Success|sent|completed|magicSent|verifySent|lastTransactionSuccess|lastResult|settledResult|toastKey/.test(
      name,
    )
  ) {
    return 'success';
  }
  if (
    /Blocked|Gate|gate|Paused|kyc|whitelist|canRequest|canSubmit|canConfirm|canStake|canUnstake|canClaim|showKyc|withdrawalPaused|depositGate|withdrawGate|sportsBlocked|casinoBlocked|confirmNotice/.test(
      name,
    )
  ) {
    return 'permission';
  }
  if (
    /Display|Avail|available|balance|Amount|price|oracle|phon|usdt|krw|rewards|apr|fee|stake|commission|positions|pools|odds|hubProps|viewProps|homeProps|layoutProps|gameSurfaceProps|rows|recentBets|commitment|bet|verification|prices|markets|breakdown|tier|referral|points|tickets|activityItems|season|slot|discount|wagering|depositReference|crypto|giftcard|withdraw|ledger|evidence|settledResult|hubStatus|missionItems|days|streak|reward|downline|partnerLink|passkeys|totp|security|compliance|profile|email|password|confirm|selection|clientSeed|config|currency|gameCode/.test(
      name,
    )
  ) {
    return /Display|Avail|available|balance|Amount|price|oracle|phon|usdt|krw|rewards|apr|fee|commission|positions|pools|points|tickets|wagering|depositReference|crypto|giftcard|withdraw|rows|recentBets|prices|markets|hubProps|viewProps|homeProps|layoutProps|gameSurfaceProps|breakdown|tier|referral|activityItems|season|slot|discount|partnerLink|downline|passkeys|totp|security|compliance|profile|email|password|confirm|selection|clientSeed|config|currency|gameCode|commitment|bet|verification|settledResult|hubStatus|missionItems|days|streak|reward|evidence/.test(
      name,
    )
      ? 'money'
      : 'display';
  }
  if (
    /^t$|^session$|^tab$|^step$|^state$|^busy$|^recoveryMode$|^isLoggedIn$|^showWelcome$|^showKycForm$|^depositConfirmOpen$|^withdrawConfirmOpen$|^withdrawMfaOpen$|^stakeConfirmOpen$|^confirmOpen$|^actionConfirm$|^totpEnroll$|^totpCode$|^resendSent$|^resendBusy$|^pendingEmail$|^verifySent$|^magicSent$|^sent$|^completed$|^fixtureMode$|^userId$|^initialTab$|^initialLeague$|^onChange$|^onTabChange$|^setEmail$|^setPassword$|^setConfirm$|^setStakeAmount$|^setSelectedPoolId$|^setTotpCode$|^setWithdrawMfaCode$|^setWithdrawAddress$|^setShowKycForm$|^setKycLegalName$|^setKycDocumentLast4$|^setKycCountry$|^setKycDocumentPaths$|^onGiftcardKindChange$|^onDepositRailChange$|^onWithdrawRailChange$|^onCryptoChainChange$|^onWithdrawCryptoChainChange$|^onDepositAmountChange$|^onCryptoDepositAmountChange$|^onWithdrawAmountChange$|^onGiftcardFaceValueChange$|^onGiftcardPinChange$|^dismissWelcome$|^onClaimDaily$|^onWheelSpin$|^onLogout$|^onDeleteAccount$|^goNext$|^goBack$|^skip$|^finish$/.test(
      name,
    )
  ) {
    return 'display';
  }
  return null;
}

function parseControllerViewShapes(content: string): Map<string, ParsedControllerView> {
  const map = new Map<string, ParsedControllerView>();
  const chunks = content.split(/export interface (\w+)\s*\{/);
  for (let i = 1; i < chunks.length; i += 2) {
    const name = chunks[i]!;
    const body = chunks[i + 1] ?? '';
    const end = body.indexOf('\n}');
    const block = end >= 0 ? body.slice(0, end) : body;
    const fields = block
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line && !line.startsWith('/**') && !line.startsWith('*') && !line.startsWith('//'),
      )
      .map((line) => line.replace(/;$/, '').split(/[:(]/)[0]?.trim())
      .filter((field): field is string => Boolean(field) && !field.startsWith('export'));

    const parsed: ParsedControllerView = {
      displayValues: [],
      actionHandlers: [],
      loadingFields: [],
      errorFields: [],
      emptyFields: [],
      successFields: [],
      permissionFields: [],
      moneyFields: [],
    };

    for (const field of fields) {
      const cat = categorizeField(field);
      if (!cat) {
        parsed.displayValues.push(field);
        continue;
      }
      switch (cat) {
        case 'display':
          parsed.displayValues.push(field);
          break;
        case 'action':
          parsed.actionHandlers.push(field);
          break;
        case 'loading':
          parsed.loadingFields.push(field);
          break;
        case 'error':
          parsed.errorFields.push(field);
          break;
        case 'empty':
          parsed.emptyFields.push(field);
          break;
        case 'success':
          parsed.successFields.push(field);
          break;
        case 'permission':
          parsed.permissionFields.push(field);
          break;
        case 'money':
          parsed.moneyFields.push(field);
          break;
      }
    }
    map.set(name, parsed);
  }
  return map;
}

const PLAYBOOK_REGISTRY: PlaybookMeta[] = [
  {
    id: 'auth-login',
    surface: 'LoginDeskSurface',
    routes: ['/login'],
    controller: 'useLoginPageController',
    viewType: 'LoginPageControllerView',
    hooks: [
      'contexts/auth-context',
      'lib/auth (signInWithPassword · sendMagicLink · signInWithPasskey)',
    ],
    rpcBoundary: 'Supabase Auth client — no wallet RPC',
    enginePackage: 'Supabase Auth',
    dbBoundary: 'auth.users · profiles trigger',
    loadingSource: 'useAuth().loading → controller.loading',
    errorSource: 'controller.errorKey (authErrorMessageKey)',
    emptySource: 'N/A — form always rendered',
    successSource: 'session set via setAuthSession · redirectOnSuccess → /home',
    permissionSource: 'N/A',
    moneySource: 'N/A',
    forbiddenDirectCalls: [
      'supabase.auth.* from presentation JSX',
      'new auth RPC from desk surface',
    ],
    testFixture: 'isVisualFixtureMode() · VISUAL_FIXTURE.authEmailPlaceholder',
    mountSmokeTest: 'gate:ai-impl — auth flow vitest · E2E /login smoke',
  },
  {
    id: 'auth-signup',
    surface: 'SignupDeskSurface',
    routes: ['/signup', '/r/$code'],
    controller: 'useSignupPageController',
    viewType: 'SignupPageControllerView',
    hooks: ['contexts/auth-context', 'lib/auth signup + email verification'],
    rpcBoundary: 'Supabase Auth signUp · resend',
    enginePackage: 'Supabase Auth',
    dbBoundary: 'auth.users · handle_new_user profiles/wallets',
    loadingSource: 'useAuth().loading',
    errorSource: 'controller.errorKey · resendErrorKey',
    emptySource: 'N/A',
    successSource: 'verifySent · session on confirm',
    permissionSource: 'N/A',
    moneySource: 'N/A',
    forbiddenDirectCalls: ['direct profiles INSERT from UI'],
    testFixture: 'visual-fixture auth placeholders',
    mountSmokeTest: 'signup route render · auth vitest',
  },
  {
    id: 'auth-reset',
    surface: 'ResetPasswordDeskSurface',
    routes: ['/reset-password'],
    controller: 'useResetPasswordPageController',
    viewType: 'ResetPasswordPageControllerView',
    hooks: ['contexts/auth-context', 'lib/auth recovery'],
    rpcBoundary: 'Supabase Auth resetPasswordForEmail · updateUser',
    enginePackage: 'Supabase Auth',
    dbBoundary: 'auth.users',
    loadingSource: 'controller.busy',
    errorSource: 'controller.errorMessage',
    emptySource: 'N/A',
    successSource: 'controller.sent · controller.completed',
    permissionSource: 'controller.recoveryMode',
    moneySource: 'N/A',
    forbiddenDirectCalls: ['password update bypassing controller.submit'],
    testFixture: 'visual-fixture',
    mountSmokeTest: 'reset-password route mount',
  },
  {
    id: 'home-hub',
    surface: 'HomeDeskSurface',
    routes: ['/home'],
    controller: null,
    viewType: null,
    hooks: ['use-auth', 'use-wallet', 'lib/onboarding-consent'],
    rpcBoundary: 'hooks/use-wallet.ts → wallet RPC · no page controller',
    enginePackage: '@phonara/wallet-ledger + earn presentation props',
    dbBoundary: 'wallets · profiles',
    extraDisplay: [
      'ImportedHomePage static FOMO props (guest)',
      'WelcomeSheet when new wallet Σ=0',
    ],
    loadingSource: 'authLoading → data-testid=home-loading',
    errorSource: 'none at shell — page handles inline',
    emptySource: 'guest static home always renders',
    successSource: 'WelcomeSheet dismiss',
    permissionSource: 'session gate for welcome only',
    moneySource:
      'useWallet() balances for welcome heuristic only — **do not** format amounts in shell; pass to child if wired',
    forbiddenDirectCalls: [
      'useWalletPageController bypass',
      'createEarnPageController',
      'direct rpc_* from ImportedHomePage',
    ],
    testFixture: 'isVisualFixtureMode()',
    mountSmokeTest: 'home route · earn/home vitest if present',
    notes: [
      'Earn canonical URL — /earn redirect-only',
      'Full earn engine on /home/missions via useEarnPageController',
    ],
  },
  {
    id: 'earn-missions',
    surface: 'HomeMissionsDeskSurface',
    routes: ['/home/missions'],
    controller: 'useEarnPageController',
    viewType: 'EarnPageControllerView',
    hooks: [
      'use-retention (missions · daily · roulette)',
      'use-earn-hub-status',
      'use-phon-balance-breakdown',
      'use-viral-missions',
      'use-repeatable-missions',
    ],
    rpcBoundary: 'hooks/use-retention.ts · earn hub RPC',
    enginePackage: 'earn RPC (Supabase)',
    dbBoundary: 'missions · retention · referral',
    loadingSource: 'authLoading · pageLoading · layoutLoading · homeLoading · missionsLoading',
    errorSource: 'toast on action failure — no global errorKey on view',
    emptySource: 'missionItems empty array',
    successSource: 'DailyClaimResult · RouletteResult via onClaimDaily / onWheelSpin',
    permissionSource: 'dailyClaimGateReason · canClaimDaily · wheelDisabled · hubStatus limits',
    moneySource:
      'homeProps phonBonusDisplay · phonRealDisplay · pointsDisplay · claimableHeroDisplay · hubStatus (from controller formatting via @phonara/money)',
    forbiddenDirectCalls: ['client reward calculation', 'direct mission RPC from JSX'],
    testFixture: 'VISUAL_FIXTURE earn balances',
    mountSmokeTest: 'earn page controller vitest if present',
  },
  {
    id: 'wallet-main',
    surface: 'WalletDeskSurface',
    routes: ['/wallet'],
    controller: 'useWalletPageController',
    viewType: 'WalletPageControllerView',
    hooks: [
      'use-wallet',
      'use-profile',
      'use-wallet-data',
      'use-crypto-deposit',
      'use-crypto-withdraw',
      'use-giftcard-fee-market',
      'use-phon-balance-breakdown',
      'use-compliance-status',
    ],
    rpcBoundary: 'domain/wallet.ts · features/wallet/* → lib/rpc.ts',
    enginePackage: '@phonara/wallet-ledger + @phonara/money',
    dbBoundary: 'wallets · ledger · compliance · KYC storage',
    loadingSource:
      'authLoading · walletLoading · complianceLoading · cryptoAddressLoading · giftcardPreviewLoading · busy',
    errorSource:
      'walletError · deposit/withdraw status keys · giftcardDepositStatusKey · cryptoWithdrawStatusKey · krwWithdrawStatusKey',
    emptySource: 'N/A — tabs always show structure',
    successSource: 'lastTransactionSuccess · copy toasts',
    permissionSource:
      'kycVerified · showKycGate · withdrawalPaused · phonLocked · depositGateReason · withdrawGateReason · canRequestDeposit · canRequestWithdraw · whitelistEnabled',
    moneySource:
      '*Display fields on WalletPageControllerView — heroBalanceDisplay · phon/usdt/krw available · giftcardPreviewFeeDisplay · withdrawAvailableDisplay (see DISPLAY_DATA_CONTRACT)',
    forbiddenDirectCalls: [
      'requestWithdrawal from JSX',
      'createKrwDepositRequest direct',
      'toLocaleString for amounts',
      'JS number arithmetic on balances',
    ],
    testFixture: 'isVisualFixtureMode() · VISUAL_FIXTURE wallet',
    mountSmokeTest: 'wallet domain unit tests · wallet E2E deposit/withdraw paths (operator gate)',
  },
  {
    id: 'wallet-ledger',
    surface: 'LedgerDeskSurface',
    routes: ['/ledger'],
    controller: 'useLedgerPageController',
    viewType: 'LedgerPageControllerView',
    hooks: ['use-wallet ledger query'],
    rpcBoundary: 'use-ledger-page-controller → wallet ledger RPC',
    enginePackage: '@phonara/wallet-ledger',
    dbBoundary: 'ledger entries (append-only)',
    loadingSource: 'authLoading · loading',
    errorSource: 'implicit query error — empty fallback',
    emptySource: 'controller.empty · rows.length === 0',
    successSource: 'N/A',
    permissionSource: 'auth session required',
    moneySource: 'rows[].amountDisplay · feeDisplay from LedgerRowView (RPC-backed)',
    forbiddenDirectCalls: ['ledger row amount reformat with JS number'],
    testFixture: 'visual-fixture ledger rows if defined',
    mountSmokeTest: 'ledger controller mount',
  },
  {
    id: 'wallet-staking',
    surface: 'StakingDeskSurface',
    routes: ['/staking', '/wallet?tab=staking'],
    controller: 'useStakingPageController',
    viewType: 'StakingPageControllerView',
    hooks: ['use-wallet', 'use-trading staking hooks'],
    rpcBoundary: 'hooks/use-trading.ts staking RPC',
    enginePackage: '@phonara/trading-engine (staking pools)',
    dbBoundary: 'staking positions · pools',
    loadingSource: 'authLoading · walletLoading · busy',
    errorSource: 'errorKey · errorMessage',
    emptySource: 'activePositions.length === 0',
    successSource: 'confirmStakingAction success toast',
    permissionSource: 'canStake · canUnstake',
    moneySource:
      'balanceDisplay · rewardsDisplay · aprDisplay · stakeAmountDisplay · phonAvailable',
    forbiddenDirectCalls: ['stake/unstake RPC from presentation', 'APR client calculation'],
    testFixture: 'visual-fixture',
    mountSmokeTest: 'staking panel vitest via trade terminal tests',
  },
  {
    id: 'trade-hub',
    surface: 'BetDeskSurface',
    routes: ['/trade'],
    container: 'BetHubShell',
    controller: 'useTradePageController',
    viewType: 'TradePageControllerView',
    hooks: [
      'use-wallet',
      'use-trading (prices · markets · positions · futuresActions · spotActions)',
      'use-trade-notifications',
      'display-chart/use-exchange-display-price',
    ],
    rpcBoundary: 'hooks/use-trading.ts → lib/rpc.ts · trading RPC',
    enginePackage: '@phonara/trading-engine',
    dbBoundary: 'futures/spot orders · positions · prices oracle',
    loadingSource:
      'authLoading · walletLoading · futuresMarketsLoading · pricesFetching · positionsFetching',
    errorSource: 'pricesError · positionsError · marketsError · tradeNotifications',
    emptySource: 'guest TradeModeShell — session null',
    successSource: 'tradeNotifications toasts · order fill events',
    permissionSource:
      'oracleStale · isPriceStale · realtimeDisconnected · oracleMarkUnavailable · session gate',
    moneySource:
      'phonAvail · usdtAvail · priceDisplay · oraclePriceDisplay · futuresPositions[] (realized_pnl · margin_amount · liquidation_price · open_fee from RPC rows)',
    forbiddenDirectCalls: [
      'useFuturesActions bypass from new UI',
      'margin mode local state in presentation (missing-from-contract)',
      'client PnL recompute',
      'duplicate usePrices channel',
    ],
    testFixture: 'shouldBlockOnAuthLoading · visual-fixture trade prices',
    mountSmokeTest:
      'components/trade/__tests__/TradeModeShell.test.tsx · trade-rpc-capabilities vitest',
    notes: [
      'BetHub passes engine={controller} when session present',
      'Trade tab: /trade?section=trade · defaultSection=trade',
    ],
  },
  {
    id: 'trade-terminal',
    surface: 'TradeDeskSurface · TradeModeShell (embedded)',
    routes: ['/trade?section=trade'],
    container: 'BetHubShell · TradeModeShell',
    controller: 'useTradePageController',
    viewType: 'TradePageControllerView',
    hooks: ['same as BetDeskSurface'],
    rpcBoundary: 'futuresActions · spotActions on controller',
    enginePackage: '@phonara/trading-engine',
    dbBoundary: 'same as trade-hub',
    loadingSource: 'same as BetDeskSurface',
    errorSource: 'same as BetDeskSurface',
    emptySource: 'guest-trade-guest when !session',
    successSource: 'futuresActions/spotActions submit handlers',
    permissionSource: 'oracleStale · circuit via oracleStale flag',
    moneySource:
      'controller.futuresActions + spotActions for tickets; display prices from controller only',
    forbiddenDirectCalls: [
      'new useTradePageController() in leaf components',
      'terminal wire hooks duplicating controller',
    ],
    testFixture: 'TradeModeShell test mocks',
    mountSmokeTest: 'TradeModeShell.test.tsx · useFuturesTerminalWire consumes controller props',
  },
  {
    id: 'sports-standalone',
    surface: 'SportsDeskSurface · SportsFixtureDeskSurface',
    routes: ['/sports', '/sports/fixture/$fixtureId'],
    controller: 'useSportsPageController',
    viewType: 'SportsPageControllerView',
    hooks: ['use-platform-gates', 'use-phon-balance-breakdown'],
    rpcBoundary: 'Sports hub embedded components → sportsbook RPC via child wiring',
    enginePackage: '@phonara/sportsbook-engine',
    dbBoundary: 'sports fixtures · bets',
    loadingSource: 'authLoading · gatesLoading · breakdownLoading',
    errorSource: 'sportsGateReason when blocked',
    emptySource: 'fixture list empty states in presentation',
    successSource: 'bet slip submit via sports components (not controller action)',
    permissionSource: 'sportsBlocked · sportsGateReason · session required',
    moneySource:
      'hubProps.phonBonusDisplay · phonRealDisplay · odds from hub child wiring (DISPLAY_DATA_CONTRACT exposed)',
    forbiddenDirectCalls: [
      'odds client recompute',
      'direct sportsbook RPC from desk surface bypassing hub',
    ],
    testFixture: 'VISUAL_FIXTURE phon balances · sportsGateReason null in fixture mode',
    mountSmokeTest: 'sports desk mount · sports E2E (operator gate)',
    notes: [
      'Canonical sportsbook owner: standalone /sports',
      '/trade?section=sports = embedded summary entry only',
    ],
  },
  {
    id: 'sports-hub-tab',
    surface: 'ImportedSportsPage (BetHub tab)',
    routes: ['/trade?section=sports'],
    container: 'BetHubShell',
    controller: 'useSportsPageController',
    viewType: 'SportsPageControllerView',
    hooks: ['same as sports-standalone'],
    rpcBoundary: 'same as sports-standalone',
    enginePackage: '@phonara/sportsbook-engine',
    dbBoundary: 'same as sports-standalone',
    loadingSource: 'same as sports-standalone',
    errorSource: 'same as sports-standalone',
    emptySource: 'embedded tab empty states',
    successSource: 'same as sports-standalone',
    permissionSource: 'same as sports-standalone',
    moneySource: 'same as sports-standalone',
    forbiddenDirectCalls: ['parallel sports controller instance in tab vs /sports route'],
    testFixture: 'same as sports-standalone',
    mountSmokeTest: 'BetHubShell sports section render',
  },
  {
    id: 'casino-game',
    surface: 'CasinoDeskSurface',
    routes: ['/casino/$game', '/games/$game'],
    controller: 'useCasinoPageController',
    viewType: 'CasinoPageControllerView',
    hooks: [
      'use-wallet',
      'use-casino-round-pipeline (use-casino-round.ts)',
      'use-platform-gates',
      'use-confirm-snapshot',
    ],
    rpcBoundary: 'use-casino-round.ts → game RPC · provably fair',
    enginePackage: '@phonara/game-engine + casino RPC',
    dbBoundary: 'casino rounds · ledger settlement',
    supplementalHooks: ['useAutoBetQueue (UI-only session — components/games/shared/hooks)'],
    loadingSource: 'authLoading · walletLoading · busy',
    errorSource: 'errorKey · toastKey · confirmNotice (casinoBlocked)',
    emptySource: 'recentBets empty',
    successSource: 'bet · settledResult · verificationEvidence · toastKey',
    permissionSource: 'canSubmit · canConfirm · casinoBlocked · confirmOpen drift',
    moneySource:
      'available (wallet phon/usdt) · stake string · gameSurfaceProps (mapped — no client payout math)',
    forbiddenDirectCalls: [
      'settlement recompute in JSX',
      'direct game RPC from GameSurfaceLoader',
      'useAutoBetQueue driving ledger',
    ],
    testFixture: 'casino E2E engine env · visual-fixture',
    mountSmokeTest:
      'apps/web/src/ui/pages/__tests__/casino-page.test.tsx · features/casino/__tests__/autoBet.test.tsx · useAutoBetQueue.test.ts',
    notes: [
      'Auto Bet queue stats: ui-only-local per DISPLAY_DATA_CONTRACT',
      'Presentation consumes gameSurfaceProps bundle',
    ],
  },
  {
    id: 'casino-lobby',
    surface: 'CasinoLobbyDeskSurface',
    routes: ['/casino'],
    controller: null,
    viewType: null,
    hooks: [],
    rpcBoundary: 'static lobby · navigate to game routes',
    enginePackage: 'none (navigation only)',
    dbBoundary: 'none',
    loadingSource: 'none',
    errorSource: 'none',
    emptySource: 'N/A',
    successSource: 'N/A',
    permissionSource: 'N/A',
    moneySource: 'N/A — lobby cards use static/meta props only',
    forbiddenDirectCalls: ['useCasinoPageController on lobby index'],
    testFixture: 'N/A',
    mountSmokeTest: 'casino lobby route mount',
  },
  {
    id: 'casino-fairness',
    surface: 'GamesFairnessDeskSurface',
    routes: ['/casino/fairness'],
    controller: null,
    viewType: null,
    hooks: ['load-fairness-history (UI data loader)'],
    rpcBoundary: 'read-only fairness history',
    enginePackage: '@phonara/game-engine verification display',
    dbBoundary: 'round history read',
    loadingSource: 'loader pending state in surface',
    errorSource: 'loader error in surface',
    emptySource: 'no history rows',
    successSource: 'N/A',
    permissionSource: 'N/A',
    moneySource: 'N/A',
    forbiddenDirectCalls: ['verify hash recompute diverging from server algorithm in UI'],
    testFixture: 'fairness E2E anchor',
    mountSmokeTest: 'casino fairness route · aurora-hero-visual E2E (operator)',
  },
  {
    id: 'rg',
    surface: 'RgDeskSurface',
    routes: ['/responsible-gaming'],
    controller: 'useRgPageController',
    viewType: 'RgPageControllerView',
    hooks: ['RG limits RPC via viewProps'],
    rpcBoundary: 'responsible-gaming feature hooks',
    enginePackage: 'Supabase RG RPC',
    dbBoundary: 'RG limits · self-exclusion',
    loadingSource: 'authLoading · sessionReady',
    errorSource: 'viewProps error surfaces',
    emptySource: 'viewProps empty limits',
    successSource: 'limit update confirm',
    permissionSource: 'sessionReady gate',
    moneySource: 'deposit/loss limit displays via viewProps (DISPLAY_DATA_CONTRACT exposed)',
    forbiddenDirectCalls: ['RG RPC from presentation'],
    testFixture: 'visual-fixture',
    mountSmokeTest: 'rg desk mount',
  },
  {
    id: 'security',
    surface: 'SecurityDeskSurface',
    routes: ['/security'],
    controller: 'useSecurityPageController',
    viewType: 'SecurityPageControllerView',
    hooks: ['domain/user-auth-security'],
    rpcBoundary: 'passkey · TOTP MFA Supabase + domain helpers',
    enginePackage: 'Supabase Auth MFA',
    dbBoundary: 'auth factors · passkeys',
    loadingSource: 'authLoading · isLoading · busy',
    errorSource: 'toast on handler failure',
    emptySource: 'no passkeys list',
    successSource: 'enroll verify success',
    permissionSource: 'session required',
    moneySource: 'N/A',
    forbiddenDirectCalls: ['MFA enroll bypassing controller handlers'],
    testFixture: 'secondary-account-surfaces test mock SecurityPageControllerView',
    mountSmokeTest: 'apps/web/src/ui/pages/__tests__/secondary-account-surfaces.test.tsx',
  },
  {
    id: 'account',
    surface: 'AccountDeskSurface',
    routes: ['/account'],
    controller: 'useAccountPageController',
    viewType: null,
    hooks: ['use-auth', 'use-profile', 'use-wallet', 'use-retention referral'],
    rpcBoundary: 'lib/auth signOut · supabase account delete RPC via controller',
    enginePackage: 'Supabase Auth + wallet display',
    dbBoundary: 'profiles · wallets · referral',
    extraDisplay: ['AccountPageViewProps — displayName · tier · phon · krw · referralCode'],
    loadingSource: 'authLoading · walletLoading on viewProps',
    errorSource: 'toast on delete/logout failure',
    emptySource: 'guest redirect to login',
    successSource: 'logout navigate',
    permissionSource: 'isLoggedIn',
    moneySource:
      'wallet phon/krw formatted in controller (tierFromPhon uses @phonara/money toDecimal — display tier only)',
    forbiddenDirectCalls: ['supabase.auth.signOut from JSX', 'account delete RPC direct'],
    testFixture: 'account-page.test.tsx mocks',
    mountSmokeTest: 'apps/web/src/ui/pages/__tests__/account-page.test.tsx',
    notes: ['No FreezeControllerView yet — add shape before U-phase or static presentation only'],
  },
  {
    id: 'onboarding',
    surface: 'OnboardingDeskSurface',
    routes: ['/onboarding'],
    controller: 'useOnboardingPageController',
    viewType: null,
    hooks: ['contexts/auth-context', 'lib/onboarding-funnel'],
    rpcBoundary: 'local onboarding-funnel storage only',
    enginePackage: 'none',
    dbBoundary: 'localStorage onboarding flag',
    extraDisplay: ['step · ONBOARDING_STEP_COUNT · t'],
    loadingSource: 'useAuth().loading',
    errorSource: 'N/A',
    emptySource: 'N/A',
    successSource: 'finish() → /home',
    permissionSource: 'session required · redirect if complete',
    moneySource: 'N/A',
    forbiddenDirectCalls: ['markOnboardingComplete from JSX'],
    testFixture: 'onboarding-page.test.tsx buildEngine()',
    mountSmokeTest: 'apps/web/src/ui/pages/__tests__/onboarding-page.test.tsx',
    notes: ['No FreezeControllerView yet'],
  },
  {
    id: 'referral',
    surface: 'ReferralDeskSurface',
    routes: ['/referral'],
    controller: 'useReferralPageController',
    viewType: 'ReferralPageControllerView',
    hooks: ['use-retention referral dashboard'],
    rpcBoundary: 'referral RPC',
    enginePackage: 'earn/referral RPC',
    dbBoundary: 'referral stats',
    loadingSource: 'authLoading · pageLoading',
    errorSource: 'implicit in viewProps',
    emptySource: 'viewProps empty stats',
    successSource: 'share/copy actions in viewProps',
    permissionSource: 'auth required',
    moneySource: 'commission displays in viewProps (RPC-backed strings)',
    forbiddenDirectCalls: ['referral RPC from JSX'],
    testFixture: 'visual-fixture',
    mountSmokeTest: 'referral desk mount',
  },
  {
    id: 'partner',
    surface: 'PartnerDeskSurface',
    routes: ['/partner'],
    controller: 'usePartnerPageController',
    viewType: 'PartnerPageControllerView',
    hooks: ['partner commission RPC'],
    rpcBoundary: 'partner feature RPC',
    enginePackage: 'partner/affiliate RPC',
    dbBoundary: 'partner commissions',
    loadingSource: 'loading',
    errorSource: 'gated surface when !partner',
    emptySource: 'zero commission strings',
    successSource: 'N/A',
    permissionSource: 'gated prop on PartnerDeskSurface',
    moneySource:
      'commissionTotal · commissionPending · commissionPaid · commissionRate · commissionMtd (display strings from RPC)',
    forbiddenDirectCalls: ['commission math in JSX'],
    testFixture: 'use-partner-page-controller.test.ts',
    mountSmokeTest: 'apps/web/src/features/partner/__tests__/use-partner-page-controller.test.ts',
  },
  {
    id: 'events',
    surface: 'EventsDeskSurface',
    routes: ['/events'],
    controller: 'useEventsPageController',
    viewType: 'EventsPageControllerView',
    hooks: ['use-retention daily · roulette'],
    rpcBoundary: 'retention RPC',
    enginePackage: 'earn/events RPC',
    dbBoundary: 'retention events',
    loadingSource: 'authLoading · hubLoading',
    errorSource: 'hubErrorKey · spinErrorKey',
    emptySource: 'days empty',
    successSource: 'lastResult · onClaimDaily',
    permissionSource: 'canClaimDaily · canSpin · gateReasonKey · dailyClaimGateReason',
    moneySource: 'todayRewardLabel · streakLabel · attendanceRemaining · rouletteRemaining',
    forbiddenDirectCalls: ['roulette outcome client randomization for ledger'],
    testFixture: 'events-page.test.tsx makeView()',
    mountSmokeTest: 'apps/web/src/ui/pages/__tests__/events-page.test.tsx',
  },
  {
    id: 'dashboard',
    surface: 'DashboardDeskSurface',
    routes: ['/dashboard'],
    controller: 'useDashboardPageController',
    viewType: 'DashboardPageControllerView',
    hooks: ['use-retention', 'use-wallet'],
    rpcBoundary: 'retention + wallet',
    enginePackage: 'earn RPC',
    dbBoundary: 'retention · wallets',
    loadingSource: 'authLoading · walletLoading · dailyLoading · rouletteLoading',
    errorSource: 'error MessageKey',
    emptySource: 'viewProps empty sections',
    successSource: 'claimDaily · spin results',
    permissionSource: 'showWelcome',
    moneySource: 'viewProps wallet/earn displays',
    forbiddenDirectCalls: ['retention RPC direct from dashboard JSX'],
    testFixture: 'visual-fixture',
    mountSmokeTest: 'dashboard desk mount',
    notes: ['Legacy route — canonical earn hub is /home'],
  },
];

function formatEngineIntegrationPlaybook(
  viewShapes: Map<string, ParsedControllerView>,
  audits: DisplayFieldAudit[],
): string {
  const lines: string[] = [
    GENERATED_BANNER,
    '',
    '# Engine Integration Playbook',
    '',
    `> **Generated:** ${new Date().toISOString().slice(0, 10)} · **Source:** page controllers · desk surfaces · \`page-controller-view-shapes.ts\``,
    '> **Rule:** UI rebuild replaces presentation only. Consume controller/hook output — never recompute money/odds/settlement.',
    '',
    '## How to use (U-phase surface implementation)',
    '',
    '1. Confirm route/tab in [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md).',
    '2. Confirm wiring in [`FREEZE_MANIFEST.md`](FREEZE_MANIFEST.md).',
    '3. Confirm display fields in [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md).',
    '4. Read the surface section below — wire **Display values** and **Action handlers** only.',
    '5. If a blueprint field is **missing-from-contract** → remove UI, show unavailable state, or separate engine work ([`DECISION_LOG.md`](DECISION_LOG.md)).',
    '6. Verify with lightweight mount/action vitest listed under **Mount smoke test**.',
    '',
    '## Global principles',
    '',
    '- UI displays engine output; never recomputes balance, odds, payout, fee, margin, or PnL.',
    '- UI calls existing controller/hook action handlers — no new `use*-page-controller` and no signature changes.',
    '- UI does not add direct `rpc_*` / `supabase.from` calls in desk surfaces or presentation pages.',
    '- Route → `*DeskSurface` → controller hook → existing hooks/RPC boundary chain stays intact.',
    '- Auto Bet session UI: `useAutoBetQueue` is **ui-only-local** — display OK, ledger drive **forbidden**.',
    '',
    '## Missing contract summary (blockers)',
    '',
  ];

  const missing = audits.filter((a) => a.status === 'missing-from-contract');
  if (missing.length === 0) {
    lines.push('- None');
  } else {
    for (const m of missing) {
      lines.push(`- **${m.domain} · ${m.field}** — ${m.notes}`);
    }
  }

  lines.push('', '## Controllers without freeze view type', '');
  lines.push(
    '- `useAccountPageController` — wire `AccountPageViewProps` only until freeze shape added',
  );
  lines.push(
    '- `useOnboardingPageController` — step navigation handlers only until freeze shape added',
  );
  lines.push('');

  for (const entry of PLAYBOOK_REGISTRY) {
    const parsed = entry.viewType ? viewShapes.get(entry.viewType) : undefined;
    const displayValues = [
      ...(parsed?.displayValues ?? []),
      ...(parsed?.moneyFields ?? []),
      ...(entry.extraDisplay ?? []),
    ];
    const actionHandlers = [...(parsed?.actionHandlers ?? []), ...(entry.extraActions ?? [])];
    const loadingFields = parsed?.loadingFields ?? [];
    const errorFields = parsed?.errorFields ?? [];
    const emptyFields = parsed?.emptyFields ?? [];
    const successFields = parsed?.successFields ?? [];
    const permissionFields = parsed?.permissionFields ?? [];

    lines.push(`## ${entry.surface}`, '');
    lines.push('```text');
    lines.push(`Surface: ${entry.surface}`);
    lines.push(`Route: ${entry.routes.join(' · ')}`);
    if (entry.container) lines.push(`Canonical container: ${entry.container}`);
    lines.push(`Controller: ${entry.controller ?? '(none — hooks/shell only)'}`);
    lines.push(`Hooks: ${[...entry.hooks, ...(entry.supplementalHooks ?? [])].join(' · ')}`);
    lines.push(`RPC/lib boundary: ${entry.rpcBoundary}`);
    lines.push(`Engine package: ${entry.enginePackage}`);
    lines.push(`DB boundary: ${entry.dbBoundary}`);
    lines.push('');
    lines.push(
      `Display values: ${displayValues.length ? displayValues.slice(0, 24).join(', ') + (displayValues.length > 24 ? ` … (+${displayValues.length - 24} more from ${entry.viewType ?? 'viewProps'})` : '') : (entry.extraDisplay?.join(', ') ?? 'see viewProps')}`,
    );
    lines.push(
      `Action handlers: ${actionHandlers.length ? actionHandlers.join(', ') : 'navigation-only · see child components'}`,
    );
    lines.push(
      `Loading state source: ${entry.loadingSource}${loadingFields.length ? ` · fields: ${loadingFields.join(', ')}` : ''}`,
    );
    lines.push(
      `Error state source: ${entry.errorSource}${errorFields.length ? ` · fields: ${errorFields.join(', ')}` : ''}`,
    );
    lines.push(
      `Empty state source: ${entry.emptySource}${emptyFields.length ? ` · fields: ${emptyFields.join(', ')}` : ''}`,
    );
    lines.push(
      `Success/result state source: ${entry.successSource}${successFields.length ? ` · fields: ${successFields.join(', ')}` : ''}`,
    );
    lines.push(
      `Permission/restriction state source: ${entry.permissionSource}${permissionFields.length ? ` · fields: ${permissionFields.join(', ')}` : ''}`,
    );
    lines.push(`Money/odds/balance display source: ${entry.moneySource}`);
    lines.push(`Forbidden direct calls: ${entry.forbiddenDirectCalls.join(' · ')}`);
    lines.push(`Required test fixture: ${entry.testFixture}`);
    lines.push(`Mount smoke test: ${entry.mountSmokeTest}`);
    if (entry.notes?.length) {
      lines.push('');
      for (const note of entry.notes) lines.push(`Note: ${note}`);
    }
    lines.push('```');
    lines.push('');
  }

  lines.push('## Admin app (summary)', '');
  lines.push('```text');
  lines.push('Route: /admin/*');
  lines.push('Surface: AdminDeskSurface → Admin*Page components');
  lines.push('Controller: none (react-query + admin auth context)');
  lines.push('Display values: per Admin page hooks — no web FreezeControllerView');
  lines.push('Action handlers: Admin page mutations via existing admin hooks');
  lines.push(
    'Forbidden direct calls: service role in browser · new admin RPC from presentation without audit',
  );
  lines.push('Mount smoke test: apps/admin vitest · admin E2E (operator gate)');
  lines.push('```');
  lines.push('');
  lines.push('## Regenerate when', '');
  lines.push(
    '- Route/surface/controller wiring change · page-controller-view-shapes.ts change · new action/display field on controller',
    '',
  );
  lines.push('```bash');
  lines.push('bun run generate:ssot-freeze-manifest');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function main(): void {
  const web = buildWebRoutes();
  const admin = buildAdminRoutes();
  const audits = buildDisplayContractAudits();
  const shapesPath = join(repoRoot, 'apps/web/src/contracts/page-controller-view-shapes.ts');
  const viewShapes = parseControllerViewShapes(readText(shapesPath));

  writeFileSync(join(ssotDir, 'FREEZE_MANIFEST.md'), formatFreezeManifest(web, admin));
  writeFileSync(join(ssotDir, 'UI_INVENTORY.md'), formatUiInventory(web, admin));
  writeFileSync(join(ssotDir, 'ROUTE_CANONICAL_REGISTRY.md'), formatRouteRegistry(web, admin));
  writeFileSync(join(ssotDir, 'DISPLAY_DATA_CONTRACT.md'), formatDisplayContract(audits));
  writeFileSync(
    join(ssotDir, 'ENGINE_INTEGRATION_PLAYBOOK.md'),
    formatEngineIntegrationPlaybook(viewShapes, audits),
  );

  console.log('[ssot-freeze-manifest] wrote 5 files to docs/SSOT/');
  console.log(
    `  web routes: ${web.length}, admin routes: ${admin.length}, display audits: ${audits.length}, playbook surfaces: ${PLAYBOOK_REGISTRY.length}`,
  );
}

main();
