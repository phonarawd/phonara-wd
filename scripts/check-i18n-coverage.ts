import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['apps', 'packages'];
const koreanPattern = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
const serverTestErrorCodePattern = [
  /\bIF\s+v_msg\s*=\s*'([a-z_]+)'/g,
  /\bmust\s+(?:raise|fail with)\s+([a-z_]+)/gi,
];

// The i18n catalog is the single source of Korean copy. Static HTML fallbacks
// that ship outside the JS bundle cannot import the catalog, so they are
// allowed to inline Korean ONLY when they also inline the English counterpart
// and resolve the locale at runtime. Each such file is verified below to
// contain BOTH locales, so dropping either side re-triggers a failure.
const allowedFiles = new Set([
  'packages/i18n/src/index.ts',
  'packages/i18n/src/locales/lovable-ko.ts',
  'packages/i18n/src/locales/lovable-en.ts',
  'apps/web/src/i18n/ko.ts',
  'apps/web/src/i18n/en.ts',
]);
const bilingualHtmlFiles: { file: string; mustContain: string[] }[] = [
  {
    file: 'apps/web/public/offline.html',
    // Korean + English offline copy must both be present (runtime locale switch).
    mustContain: ['네트워크 연결 없음', 'No network connection'],
  },
];

function collectFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (['dist', 'node_modules'].includes(entry)) return [];
      return collectFiles(path);
    }
    return /\.(ts|tsx|html)$/.test(entry) ? [path.replaceAll('\\', '/')] : [];
  });
}

const bilingualSet = new Set(bilingualHtmlFiles.map((b) => b.file));

// Imported presentation zones may keep Korean copy verbatim until mirrored into packages/i18n.
const allowedPrefixes = [
  'apps/web/src/components/shell/',
  'apps/web/src/components/sports/',
  'apps/web/src/components/ui/',
  'apps/web/src/components/casino/',
  'apps/web/src/components/earn/',
  'apps/web/src/components/fomo/',
  'apps/web/src/components/games/',
  'apps/web/src/components/home/',
  'apps/web/src/components/trade/',
  'apps/web/src/components/welcome/',
  'apps/web/src/components/social/',
  'apps/web/src/presentation-import/',
  'packages/i18n/src/locales/',
  'apps/web/src/lib/social-proof/',
  'apps/web/src/hooks/',
  'apps/web/src/i18n/',
  'apps/admin/src/components/admin/',
  'apps/admin/src/components/ui/',
  'apps/admin/src/presentation-import/',
  'apps/admin/src/hooks/admin/',
  'apps/admin/src/hooks/useAdminSportsMock.ts',
];

function isTestOrFixturePath(file: string): boolean {
  return (
    file.includes('/__tests__/') ||
    file.endsWith('.test.ts') ||
    file.endsWith('.test.tsx')
  );
}

function isAllowedPresentationImportPath(file: string): boolean {
  return allowedPrefixes.some((prefix) => file.startsWith(prefix));
}

const violations = roots.flatMap((root) => collectFiles(root)).filter((file) => {
  if (isTestOrFixturePath(file)) return false;
  if (allowedFiles.has(file) || bilingualSet.has(file) || isAllowedPresentationImportPath(file)) return false;
  return koreanPattern.test(readFileSync(file, 'utf8'));
});

if (violations.length > 0) {
  throw new Error(`Hardcoded Korean text outside locale files:\n${violations.join('\n')}`);
}

// Verify each declared bilingual fallback still carries every required locale.
const bilingualViolations = bilingualHtmlFiles.flatMap(({ file, mustContain }) => {
  const content = readFileSync(file, 'utf8');
  return mustContain
    .filter((needle) => !content.includes(needle))
    .map((needle) => `${file} is missing required localized copy: "${needle}"`);
});

if (bilingualViolations.length > 0) {
  throw new Error(`Bilingual fallback coverage failed:\n${bilingualViolations.join('\n')}`);
}

function extractMatches(content: string, patterns: RegExp[]): Set<string> {
  const values = new Set<string>();
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const value = match[1]?.toLowerCase();
      if (value) values.add(value);
    }
  }
  return values;
}

const translateErrorFiles = [
  'apps/web/src/lib/translate-error.ts',
  'apps/admin/src/lib/translate-error.ts',
].filter((file) => existsSync(file));
const translateErrorContent = translateErrorFiles
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');
const mappedErrorCodes = extractMatches(translateErrorContent, [/\[\s*'([a-z_]+)'\s*,\s*'error\.[A-Z_]+'\s*\]/g]);
const serverTestErrorCodes = extractMatches(
  collectFiles('supabase/tests')
    .filter((file) => file.endsWith('.sql'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n'),
  serverTestErrorCodePattern,
);
const missingServerErrorMappings = [...serverTestErrorCodes]
  .filter((code) => !mappedErrorCodes.has(code))
  .sort();

if (missingServerErrorMappings.length > 0) {
  throw new Error(
    `Server-tested error codes missing translate-error mappings:\n${missingServerErrorMappings.join('\n')}`,
  );
}
