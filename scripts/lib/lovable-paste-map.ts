/**
 * Lovable canvas → PHONARA paste path map (presentation only).
 * 정본: apps/web/PRESENTATION_IMPORT.md · docs/PHONARA_CURSOR_PASTE_CRUSH_P2_0_PASTE_MAP.md
 */

export const LOVABLE_INTAKE_ROOT = '.lovable-intake' as const;
export const LOVABLE_INTAKE_INCOMING = `${LOVABLE_INTAKE_ROOT}/incoming` as const;
export const LOVABLE_INTAKE_STAGING = `${LOVABLE_INTAKE_ROOT}/staging` as const;

export type PasteAction = 'COPY' | 'ADAPT' | 'MERGE' | 'SKIP';

export type PasteRule = {
  lovableGlob: string;
  phonaraDir: string;
  action: PasteAction;
  note?: string;
};

/** Never paste into PHONARA — engine / secrets / vendor residue */
export const PASTE_SKIP_PREFIXES = [
  'supabase/',
  'packages/',
  'apps/admin/',
  'src/engine/',
  '.lovable/',
  '.phonara-stage/',
  'node_modules/',
  'dist/',
  'dist-phonara-package.zip',
] as const;

export const PASTE_SKIP_FILES = [
  'src/games/preview/useMockPipeline.ts',
] as const;

/** Directory-level copy rules (relative to Lovable `src/`) */
export const PASTE_DIRECTORY_RULES: readonly PasteRule[] = [
  { lovableGlob: 'components/ui', phonaraDir: 'apps/web/src/components/ui', action: 'COPY' },
  { lovableGlob: 'components/shell', phonaraDir: 'apps/web/src/components/shell', action: 'COPY' },
  { lovableGlob: 'components/earn', phonaraDir: 'apps/web/src/components/earn', action: 'COPY' },
  { lovableGlob: 'components/trade', phonaraDir: 'apps/web/src/components/trade', action: 'COPY' },
  { lovableGlob: 'components/fomo', phonaraDir: 'apps/web/src/components/fomo', action: 'COPY' },
  { lovableGlob: 'components/welcome', phonaraDir: 'apps/web/src/components/welcome', action: 'COPY' },
  { lovableGlob: 'components/sports', phonaraDir: 'apps/web/src/components/sports', action: 'COPY' },
  { lovableGlob: 'components/casino', phonaraDir: 'apps/web/src/components/casino', action: 'COPY' },
  { lovableGlob: 'data', phonaraDir: 'apps/web/src/data', action: 'COPY', note: 'casino-game-meta · search-index' },
  { lovableGlob: 'mocks', phonaraDir: 'apps/web/src/mocks', action: 'COPY', note: 'sports fixtures' },
  { lovableGlob: 'games/shared', phonaraDir: 'apps/web/src/components/games/shared', action: 'ADAPT', note: 'types.ts = PHONARA contract 우선' },
  { lovableGlob: 'games/crash', phonaraDir: 'apps/web/src/components/games/crash', action: 'ADAPT', note: 'mock pipeline 제거' },
  { lovableGlob: 'games/dice', phonaraDir: 'apps/web/src/components/games/dice', action: 'ADAPT' },
  { lovableGlob: 'games/limbo', phonaraDir: 'apps/web/src/components/games/limbo', action: 'ADAPT' },
  { lovableGlob: 'games/hilo', phonaraDir: 'apps/web/src/components/games/hilo', action: 'ADAPT' },
  { lovableGlob: 'games/roulette', phonaraDir: 'apps/web/src/components/games/roulette', action: 'ADAPT' },
  { lovableGlob: 'games/mines', phonaraDir: 'apps/web/src/components/games/mines', action: 'ADAPT' },
  { lovableGlob: 'games/plinko', phonaraDir: 'apps/web/src/components/games/plinko', action: 'ADAPT' },
  { lovableGlob: 'games/mint_reels', phonaraDir: 'apps/web/src/components/games/mint-reels', action: 'ADAPT' },
  { lovableGlob: 'games/gold_rush', phonaraDir: 'apps/web/src/components/games/gold-rush', action: 'ADAPT' },
  { lovableGlob: 'games/blackjack', phonaraDir: 'apps/web/src/components/games/blackjack', action: 'ADAPT' },
  { lovableGlob: 'games/deepshaft', phonaraDir: 'apps/web/src/components/games/deepshaft', action: 'ADAPT' },
  { lovableGlob: 'games/momentum', phonaraDir: 'apps/web/src/components/games/momentum', action: 'ADAPT' },
  { lovableGlob: 'styles', phonaraDir: 'apps/web/src/styles', action: 'MERGE', note: 'presentation-import-tokens.css' },
  { lovableGlob: 'i18n', phonaraDir: 'packages/i18n/src/locales', action: 'MERGE', note: '키 merge · JSX inline 0' },
] as const;

/** Route page bodies → presentation-import/pages (Lovable routes/*.tsx UI only) */
export const PASTE_PAGE_RULES: readonly { lovableRoute: string; phonaraPage: string }[] = [
  { lovableRoute: 'routes/index.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/landing-page.tsx' },
  { lovableRoute: 'routes/home.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/home-page.tsx' },
  { lovableRoute: 'routes/earn.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/earn-page.tsx' },
  { lovableRoute: 'routes/trade.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/trade-page.tsx' },
  { lovableRoute: 'routes/account.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/account-page.tsx' },
  { lovableRoute: 'routes/settings.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/settings-page.tsx' },
  { lovableRoute: 'routes/referral.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/referral-page.tsx' },
  { lovableRoute: 'routes/about.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/about-page.tsx' },
  { lovableRoute: 'routes/terms.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/terms-page.tsx' },
  { lovableRoute: 'routes/privacy.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/privacy-page.tsx' },
  { lovableRoute: 'routes/login.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/login-page.tsx' },
  { lovableRoute: 'routes/signup.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/signup-page.tsx' },
  { lovableRoute: 'routes/dashboard.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/dashboard-page.tsx' },
  { lovableRoute: 'routes/wallet.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/wallet-page.tsx' },
  { lovableRoute: 'routes/ledger.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/ledger-page.tsx' },
  { lovableRoute: 'routes/staking.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/staking-page.tsx' },
  { lovableRoute: 'routes/more.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/more-page.tsx' },
  { lovableRoute: 'routes/games.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/games-catalog-page.tsx' },
  { lovableRoute: 'routes/casino.fairness.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/games-fairness-page.tsx' },
  { lovableRoute: 'routes/sports.tsx', phonaraPage: 'apps/web/src/presentation-import/pages/sports-page.tsx' },
] as const;

export const SECRET_SCAN_PATTERNS = [
  /SUPABASE_SERVICE_ROLE/i,
  /service_role_key/i,
  /sk_live_/,
  /VITE_SUPABASE_SERVICE/i,
] as const;

export const RELEASE_BLOCK_PATTERNS = [
  /\bTODO\b/,
  /\bFIXME\b/,
  /\bHACK\b/,
  /console\.(log|warn|error|debug|info)\(/,
  /test mode/i,
  /lorem ipsum/i,
] as const;

/** Post-paste guards — sync with lovable-paste-postcheck.ts */
export const POSTCHECK_ENGINE_PATH_RE =
  /^(supabase\/|packages\/|apps\/web\/src\/(hooks\/|domain\/|contexts\/|lib\/(auth|rpc|supabase)\.ts))/;

export const POSTCHECK_FORBIDDEN_IMPORT_RE =
  /useMockPipeline|from ['"]@\/engine|from ['"]\.\.\/.*engine/;

export const POSTCHECK_G1_PATTERNS: readonly { id: string; re: RegExp; roots: string[] }[] = [
  {
    id: 'rng',
    re: /Math\.random|crypto\.getRandomValues|seedrandom/,
    roots: ['apps/web/src/components/games'],
  },
  {
    id: 'mines-leak',
    re: /if \(.*mine.*\)|tileResults\[|safeTiles\[/,
    roots: ['apps/web/src/components/games'],
  },
  {
    id: 'momentum-mult',
    re: /totalMultiplier\s*=|comboMultiplier\s*=/,
    roots: ['apps/web/src/components/games'],
  },
  {
    id: 'crash-client',
    re: /crashAt\s*=|Math\.exp\(.*GROWTH|\.exp\(.*growth|elapsedMs\s*\*\s*GROWTH_RATE|elapsed.*\*.*growth/i,
    roots: ['apps/web/src/components/games'],
  },
  {
    id: 'autobet-interval',
    re: /setInterval.*placeBet|setInterval.*bet\(|autoBetLoop|while\s*\(.*auto/i,
    roots: ['apps/web/src/components/games', 'apps/web/src/presentation-import'],
  },
];

export const POSTCHECK_G2_FORMAT_RE = /toLocaleString|\.toFixed\(/;

export const POSTCHECK_G2_MONEY_CONTEXT_RE =
  /balance|stake|payout|amount|price|fee|pnl|wallet|deposit|withdraw|phon|usdt|krw|bet|reward|profit|loss/i;

export const POSTCHECK_G2_NON_MONEY_OK_RE =
  /timer|countdown|duration|elapsed|percent|%|axis|chart|rpm|fps|opacity|progress|streak|day|hour|minute|second|rtp|apr|latency/i;

export const POSTCHECK_MOCK_DATA_RE =
  /useFakeTicker|mockPrice|demoPrice|TX-XXXX|DEMO-ADDR|DEMO123|5000P/;

export const POSTCHECK_G4_CSS_UNIVERSAL_RE = /^\s*\*\s*\{|^body\s*\{|^html\s*\{/m;

export const LOVABLE_INTAKE_BASELINE_LOCK = `${LOVABLE_INTAKE_ROOT}/baseline-bun.lock.txt` as const;
export const LOVABLE_INTAKE_BASELINE_COMMIT = `${LOVABLE_INTAKE_ROOT}/baseline-commit.txt` as const;

export const POSTCHECK_LOCKFILE_WATCH_PACKAGES = [
  'framer-motion',
  'tailwindcss',
  'react',
  '@radix-ui/react-dialog',
] as const;
