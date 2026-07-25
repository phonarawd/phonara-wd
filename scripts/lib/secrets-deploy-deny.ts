/**
 * Secrets / deploy deny inventory — shared scanners for tracked paths, file
 * contents, dist bundles, and .gitignore coverage.
 *
 * Escape hatch (per line): `secrets-deploy-allow: <reason>`
 * Values in violation messages are always masked (never log raw secrets).
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

export const ALLOW_MARKER = 'secrets-deploy-allow';

/** Known Supabase local-demo anon JWT signature marker (public; safe to ship). */
export const LOCAL_DEMO_ANON_JWT_MARKER = 'CRXP1A7W';

export type SecretViolationKind = 'tracked-path' | 'content' | 'gitignore' | 'dist-content';

export type SecretViolation = {
  kind: SecretViolationKind;
  ruleId: string;
  file: string;
  line?: number;
  /** Human-readable; secret fragments already masked. */
  message: string;
};

export type ForbiddenTrackedPathRule = {
  id: string;
  description: string;
  match: (posixPath: string) => boolean;
};

export type SecretContentRule = {
  id: string;
  description: string;
  /**
   * Return raw match strings on this line (pre-allowlist). Empty = no hit.
   * Callers apply placeholder/demo allowlists + masking.
   */
  findRawMatches: (line: string) => string[];
};

const BINARY_EXT =
  /\.(png|jpe?g|gif|webp|ico|bmp|woff2?|ttf|eot|otf|mp4|webm|mp3|wav|zip|gz|br|wasm|pdf|exe|dll|so|dylib|bin)$/i;

const TEXT_DIST_EXT = /\.(js|mjs|cjs|css|html?|map|json|txt|svg|xml|webmanifest)$/i;

const MAX_SCAN_BYTES = 5 * 1024 * 1024;

// ── Path helpers ────────────────────────────────────────────────────────────

export function toPosixPath(p: string): string {
  return p.replace(/\\/g, '/');
}

export function pathBasename(posixPath: string): string {
  const parts = posixPath.split('/');
  return parts[parts.length - 1] ?? posixPath;
}

function isEnvExampleBasename(base: string): boolean {
  return (
    base === '.env.example' ||
    base.endsWith('.env.example') ||
    /\.env\.[^/]+\.example$/i.test(base) ||
    /\.env\.example$/i.test(base)
  );
}

function isKeyExampleBasename(base: string): boolean {
  return /\.key\.example$/i.test(base);
}

/** A. Absolute never-track path rules (tracked ⇒ FAIL). */
export const FORBIDDEN_TRACKED_PATH_RULES: readonly ForbiddenTrackedPathRule[] = [
  {
    id: 'env-file',
    description: '.env / .env.* (except *.example)',
    match: (posixPath) => {
      const base = pathBasename(posixPath);
      if (isEnvExampleBasename(base)) return false;
      if (base === '.env') return true;
      if (base.startsWith('.env.')) return true;
      if (posixPath === 'setup/.env.secrets' || posixPath.endsWith('/setup/.env.secrets')) {
        return true;
      }
      return false;
    },
  },
  {
    id: 'dev-vars',
    description: '.dev.vars',
    match: (posixPath) => pathBasename(posixPath) === '.dev.vars',
  },
  {
    id: 'key-material',
    description: '*.pem / *.p12 / *.pfx / *.key (except *.key.example)',
    match: (posixPath) => {
      const base = pathBasename(posixPath);
      if (isKeyExampleBasename(base)) return false;
      return /\.(pem|p12|pfx|key)$/i.test(base);
    },
  },
  {
    id: 'credentials-json',
    description: '*credentials*.json / credentials.json',
    match: (posixPath) => {
      const base = pathBasename(posixPath);
      if (!base.toLowerCase().endsWith('.json')) return false;
      return base.toLowerCase() === 'credentials.json' || /credentials/i.test(base);
    },
  },
  {
    id: 'e2e-auth',
    description: 'tests/e2e/.auth.json / .admin-auth.json',
    match: (posixPath) => {
      const n = posixPath.replace(/^\.\//, '');
      return (
        n === 'tests/e2e/.auth.json' ||
        n === 'tests/e2e/.admin-auth.json' ||
        n.endsWith('/tests/e2e/.auth.json') ||
        n.endsWith('/tests/e2e/.admin-auth.json')
      );
    },
  },
  {
    id: 'secrets-toml',
    description: 'secrets.toml',
    match: (posixPath) => pathBasename(posixPath) === 'secrets.toml',
  },
];

export function matchForbiddenTrackedPath(posixPath: string): ForbiddenTrackedPathRule | undefined {
  const normalized = toPosixPath(posixPath).replace(/^\.\//, '');
  return FORBIDDEN_TRACKED_PATH_RULES.find((rule) => rule.match(normalized));
}

// ── Masking / allowlists ────────────────────────────────────────────────────

export function maskSecretFragment(fragment: string): string {
  const f = fragment.trim();
  if (!f) return '***';
  if (f.startsWith('sbp_')) return 'sbp_***';
  if (f.startsWith('ghp_')) return 'ghp_***';
  if (f.startsWith('github_pat_')) return 'github_pat_***';
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(f)) {
    const parts = f.split('.');
    const head = (parts[0] ?? '').slice(0, 10);
    const tail = (parts[2] ?? '').slice(-4);
    return `${head}….***.…${tail}`;
  }
  if (/PRIVATE KEY/i.test(f)) return '-----BEGIN PRIVATE KEY-----***'; // secrets-deploy-allow: mask example — scanner self-reference
  if (f.length <= 8) return '***';
  return `${f.slice(0, 4)}***${f.slice(-2)}`;
}

/** Placeholder / template values that must not trip content rules. */
export function isPlaceholderSecretValue(value: string): boolean {
  const v = value.trim().replace(/^['"]|['"]$/g, '');
  if (!v) return true;
  if (v === '*)') return true; // bash case arm: KEY=*)
  if (v.startsWith('${') || v.startsWith('$(') || /^\$[A-Za-z_]/.test(v)) return true;
  if (/^(YOUR_|your_|CHANGE_?ME|xxx+|placeholder|TODO|TBD|INSERT_|REPLACE_)/i.test(v)) {
    return true;
  }
  if (/your_/i.test(v)) return true;
  if (/^<.*>$/.test(v)) return true;
  if (/^…+$/.test(v) || /^[.]{3,}$/.test(v)) return true;
  // Short non-JWT tokens are almost certainly docs/templates
  if (v.length < 16 && !v.startsWith('eyJ') && !v.startsWith('sbp_') && !v.startsWith('ghp_')) {
    return true;
  }
  return false;
}

export function isAllowedDemoJwt(token: string): boolean {
  return token.includes(LOCAL_DEMO_ANON_JWT_MARKER);
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    try {
      const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = Buffer.from(padded, 'base64').toString('utf8');
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export function looksLikeServiceRoleJwt(token: string): boolean {
  if (isAllowedDemoJwt(token)) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  return payload['role'] === 'service_role';
}

function stripQuotes(value: string): string {
  const t = value.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function isSbpPlaceholder(match: string): boolean {
  return /your/i.test(match) || isPlaceholderSecretValue(match);
}

// ── Content rules ───────────────────────────────────────────────────────────

const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const SBP_RE = /sbp_[A-Za-z0-9]{20,}/g;
const GHP_RE = /ghp_[A-Za-z0-9]{30,}/g;
const GITHUB_PAT_RE = /github_pat_[A-Za-z0-9_]{20,}/g;
const PRIVATE_KEY_RE = /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/g;
const VITE_SERVICE_ROLE_RE = /\bVITE_[A-Z0-9_]*SERVICE_ROLE[A-Z0-9_]*/g; // secrets-deploy-allow: pattern id — scanner self-reference
const SERVICE_ROLE_KEY_ASSIGN_RE = /\bSUPABASE_SERVICE_ROLE_KEY\s*=\s*([^\s#]+|"[^"]*"|'[^']*')/g;

export const SECRET_CONTENT_PATTERNS: readonly SecretContentRule[] = [
  {
    id: 'sbp-token',
    description: 'Supabase personal access token (sbp_…)',
    findRawMatches: (line) => {
      const out: string[] = [];
      for (const m of line.matchAll(SBP_RE)) {
        const raw = m[0];
        if (!isSbpPlaceholder(raw)) out.push(raw);
      }
      return out;
    },
  },
  {
    id: 'service-role-jwt',
    description: 'JWT with role=service_role',
    findRawMatches: (line) => {
      const out: string[] = [];
      for (const m of line.matchAll(JWT_RE)) {
        const raw = m[0];
        if (looksLikeServiceRoleJwt(raw)) out.push(raw);
      }
      return out;
    },
  },
  {
    id: 'private-key',
    description: 'PEM/OpenSSH private key header',
    findRawMatches: (line) => [...line.matchAll(PRIVATE_KEY_RE)].map((m) => m[0]),
  },
  {
    id: 'github-pat',
    description: 'GitHub fine-grained PAT (github_pat_…)',
    findRawMatches: (line) => {
      const out: string[] = [];
      for (const m of line.matchAll(GITHUB_PAT_RE)) {
        if (!isPlaceholderSecretValue(m[0])) out.push(m[0]);
      }
      return out;
    },
  },
  {
    id: 'github-ghp',
    description: 'GitHub classic token (ghp_…)',
    findRawMatches: (line) => {
      const out: string[] = [];
      for (const m of line.matchAll(GHP_RE)) {
        if (!isPlaceholderSecretValue(m[0])) out.push(m[0]);
      }
      return out;
    },
  },
  {
    id: 'vite-service-role',
    description: 'VITE_* env name containing SERVICE_ROLE',
    findRawMatches: (line) => [...line.matchAll(VITE_SERVICE_ROLE_RE)].map((m) => m[0]), // secrets-deploy-allow: pattern id identifier — scanner self-reference
  },
  {
    id: 'service-role-key-assign',
    description: 'SUPABASE_SERVICE_ROLE_KEY= with a real secret value',
    findRawMatches: (line) => {
      const out: string[] = [];
      for (const m of line.matchAll(SERVICE_ROLE_KEY_ASSIGN_RE)) {
        const value = stripQuotes(m[1] ?? '');
        if (isPlaceholderSecretValue(value)) continue;
        if (looksLikeServiceRoleJwt(value) || value.startsWith('eyJ') || value.length >= 32) {
          out.push(`${'SUPABASE_SERVICE_ROLE_KEY='}${maskSecretFragment(value)}`); // secrets-deploy-allow: masked violation message builder — scanner self-reference
        }
      }
      return out;
    },
  },
];

export function lineHasAllowMarker(line: string): boolean {
  return line.includes(ALLOW_MARKER);
}

/**
 * Scan file text for high-confidence secret content patterns.
 * Respects per-line `secrets-deploy-allow: <reason>`.
 */
export function scanTextContent(
  content: string,
  filePath: string,
  kind: Extract<SecretViolationKind, 'content' | 'dist-content'> = 'content',
): SecretViolation[] {
  const violations: SecretViolation[] = [];
  const lines = content.split(/\r?\n/);
  const posix = toPosixPath(filePath);

  lines.forEach((line, idx) => {
    if (lineHasAllowMarker(line)) return;
    for (const rule of SECRET_CONTENT_PATTERNS) {
      const matches = rule.findRawMatches(line);
      for (const raw of matches) {
        const masked = rule.id === 'service-role-key-assign' ? raw : maskSecretFragment(raw);
        violations.push({
          kind,
          ruleId: rule.id,
          file: posix,
          line: idx + 1,
          message: `${posix}:${idx + 1}  [${rule.id}]  ${rule.description}: ${masked}`,
        });
      }
    }
  });

  return violations;
}

// ── Gitignore coverage ──────────────────────────────────────────────────────

/**
 * Patterns that MUST appear in `.gitignore` (substring match).
 * Kept in sync with deny inventory A — ignore-cursor todo adds missing rows.
 */
export const GITIGNORE_REQUIRED_PATTERNS = [
  '.env',
  '.dev.vars',
  '*.pem',
  '*.p12',
  '*.pfx',
  '*.key',
  'credentials.json',
  'secrets.toml',
  'tests/e2e/.auth.json',
  'tests/e2e/.admin-auth.json',
  'setup/.env.secrets',
] as const;

/** True when `.gitignore` has an active (non-negated) line equal to `pattern`. */
export function gitignoreHasRequiredPattern(gitignoreText: string, pattern: string): boolean {
  for (const raw of gitignoreText.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('!')) continue; // negation — does not satisfy coverage
    const body = line.replace(/^\//, '');
    if (body === pattern || body === `**/${pattern}`) return true;
  }
  return false;
}

export function assertGitignoreCoversDenyList(options?: {
  cwd?: string;
  gitignoreText?: string;
}): SecretViolation[] {
  const cwd = options?.cwd ?? process.cwd();
  const text =
    options?.gitignoreText ??
    (existsSync(join(cwd, '.gitignore')) ? readFileSync(join(cwd, '.gitignore'), 'utf8') : '');

  const violations: SecretViolation[] = [];
  if (!text.trim()) {
    violations.push({
      kind: 'gitignore',
      ruleId: 'gitignore-missing',
      file: '.gitignore',
      message: '.gitignore missing or empty — cannot verify secrets deny coverage',
    });
    return violations;
  }

  for (const pattern of GITIGNORE_REQUIRED_PATTERNS) {
    if (!gitignoreHasRequiredPattern(text, pattern)) {
      violations.push({
        kind: 'gitignore',
        ruleId: 'gitignore-coverage',
        file: '.gitignore',
        message: `.gitignore missing required secrets deny pattern: ${pattern}`,
      });
    }
  }
  return violations;
}

// ── Tracked file / dist scanners ────────────────────────────────────────────

export function listTrackedFiles(cwd: string = process.cwd()): string[] {
  const out = execFileSync('git', ['ls-files', '-z'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out
    .split('\0')
    .map((p) => toPosixPath(p).replace(/^\.\//, ''))
    .filter(Boolean);
}

function shouldSkipContentScan(posixPath: string, absPath: string): boolean {
  if (BINARY_EXT.test(posixPath)) return true;
  try {
    const st = statSync(absPath);
    if (!st.isFile()) return true;
    if (st.size > MAX_SCAN_BYTES) return true;
    if (st.size === 0) return true;
  } catch {
    return true;
  }
  return false;
}

function readTextIfScannable(absPath: string): string | null {
  try {
    const buf = readFileSync(absPath);
    if (buf.includes(0)) return null;
    return buf.toString('utf8');
  } catch {
    return null;
  }
}

export function scanTrackedFiles(options?: { cwd?: string }): SecretViolation[] {
  const cwd = options?.cwd ?? process.cwd();
  const violations: SecretViolation[] = [];
  let files: string[];
  try {
    files = listTrackedFiles(cwd);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return [
      {
        kind: 'tracked-path',
        ruleId: 'git-ls-files',
        file: cwd,
        message: `git ls-files failed: ${msg}`,
      },
    ];
  }

  for (const rel of files) {
    const rule = matchForbiddenTrackedPath(rel);
    if (rule) {
      violations.push({
        kind: 'tracked-path',
        ruleId: rule.id,
        file: rel,
        message: `Tracked forbidden path [${rule.id}]: ${rel} (${rule.description})`,
      });
      continue;
    }

    const abs = join(cwd, rel);
    if (shouldSkipContentScan(rel, abs)) continue;
    const text = readTextIfScannable(abs);
    if (text == null) continue;
    violations.push(...scanTextContent(text, rel, 'content'));
  }

  return violations;
}

function collectDistFiles(dir: string, root: string): string[] {
  if (!existsSync(dir)) return [];
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      out = out.concat(collectDistFiles(abs, root));
      continue;
    }
    if (!st.isFile()) continue;
    const rel = toPosixPath(relative(root, abs));
    if (TEXT_DIST_EXT.test(rel) || (!BINARY_EXT.test(rel) && st.size <= MAX_SCAN_BYTES)) {
      out.push(abs);
    }
  }
  return out;
}

/**
 * Scan a Vite/wrangler dist tree for the same high-confidence content rules.
 * When `requireExists` is true and the directory is missing → one violation.
 */
export function scanDistTree(
  distDir: string,
  options?: { cwd?: string; requireExists?: boolean },
): SecretViolation[] {
  const cwd = options?.cwd ?? process.cwd();
  const absDist = resolve(cwd, distDir);
  const relDist = toPosixPath(relative(cwd, absDist) || distDir);

  if (!existsSync(absDist)) {
    if (options?.requireExists) {
      return [
        {
          kind: 'dist-content',
          ruleId: 'dist-missing',
          file: relDist,
          message: `dist tree missing (required for deploy scan): ${relDist}`,
        },
      ];
    }
    return [];
  }

  const violations: SecretViolation[] = [];
  for (const abs of collectDistFiles(absDist, absDist)) {
    const rel = toPosixPath(join(relDist, relative(absDist, abs)));
    if (shouldSkipContentScan(rel, abs)) continue;
    const text = readTextIfScannable(abs);
    if (text == null) continue;
    violations.push(...scanTextContent(text, rel, 'dist-content'));
  }
  return violations;
}

/** Convenience: path + content + gitignore (no dist). */
export function scanRepoSecretsDeny(options?: { cwd?: string }): SecretViolation[] {
  const cwd = options?.cwd ?? process.cwd();
  return [...assertGitignoreCoversDenyList({ cwd }), ...scanTrackedFiles({ cwd })];
}

export function formatSecretViolations(violations: SecretViolation[]): string {
  return violations.map((v) => v.message).join('\n');
}
