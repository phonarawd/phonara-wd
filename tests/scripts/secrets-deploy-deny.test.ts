import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  ALLOW_MARKER,
  GITIGNORE_REQUIRED_PATTERNS,
  LOCAL_DEMO_ANON_JWT_MARKER,
  assertGitignoreCoversDenyList,
  formatSecretViolations,
  isPlaceholderSecretValue,
  maskSecretFragment,
  matchForbiddenTrackedPath,
  scanTextContent,
} from '../../scripts/lib/secrets-deploy-deny';

/** Synthetic JWT helpers — never real credentials. */
function b64urlJson(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

const JWT_HDR = b64urlJson({ alg: 'HS256', typ: 'JWT' });

/** Fake service_role JWT (payload role only — not a live key). */
const FAKE_SERVICE_ROLE_JWT = `${JWT_HDR}.${b64urlJson({ role: 'service_role', iss: 'test' })}.fakesignature_service_role_test_only`;

/** Fake anon JWT without local-demo marker. */
const FAKE_ANON_JWT = `${JWT_HDR}.${b64urlJson({ role: 'anon', iss: 'test' })}.fakesignature_anon_test_only`;

/** Public Supabase local-demo anon JWT (shipped in repo fixtures). */
const LOCAL_DEMO_ANON_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/** Looks like a real sbp_ token shape (≥20 payload chars, no `your`). */
const FAKE_SBP = 'sbp_abcdefghijklmnopqrstuvwxyz12';

describe('secrets-deploy-deny', () => {
  describe('placeholders / demo allowlist', () => {
    it('treats common placeholders as non-secrets', () => {
      expect(isPlaceholderSecretValue('YOUR_VALUE_HERE')).toBe(true);
      expect(isPlaceholderSecretValue('sbp_your_token_placeholder')).toBe(true);
      expect(isPlaceholderSecretValue('your_supabase_anon_key_here')).toBe(true);
      expect(isPlaceholderSecretValue('${SUPABASE_SERVICE_ROLE_KEY}')).toBe(true);
    });

    it('allows local demo anon JWT and placeholder sbp lines', () => {
      expect(LOCAL_DEMO_ANON_JWT).toContain(LOCAL_DEMO_ANON_JWT_MARKER);
      const content = [
        `VITE_SUPABASE_ANON_KEY=${LOCAL_DEMO_ANON_JWT}`,
        'SUPABASE_ACCESS_TOKEN=sbp_your_access_token_here',
        'SUPABASE_SERVICE_ROLE_KEY=YOUR_VALUE_HERE',
        `anon_ok=${FAKE_ANON_JWT}`,
      ].join('\n');

      expect(scanTextContent(content, 'fixture.env.example')).toEqual([]);
    });
  });

  describe('high-confidence content FAIL', () => {
    it('flags real-shaped sbp_ tokens', () => {
      const hits = scanTextContent(`token=${FAKE_SBP}`, 'leak.txt');
      expect(hits.some((v) => v.ruleId === 'sbp-token')).toBe(true);
    });

    it('flags JWT with role=service_role', () => {
      const hits = scanTextContent(`key=${FAKE_SERVICE_ROLE_JWT}`, 'leak.txt');
      expect(hits.some((v) => v.ruleId === 'service-role-jwt')).toBe(true);
    });

    it('flags private key headers', () => {
      const hits = scanTextContent('-----BEGIN PRIVATE KEY-----', 'key.pem.txt');
      expect(hits.some((v) => v.ruleId === 'private-key')).toBe(true);
    });

    it('flags VITE_*SERVICE_ROLE* names', () => {
      const hits = scanTextContent('VITE_SUPABASE_SERVICE_ROLE_KEY=x', 'bad.ts');
      expect(hits.some((v) => v.ruleId === 'vite-service-role')).toBe(true);
    });

    it('flags SUPABASE_SERVICE_ROLE_KEY assignments with long values', () => {
      const hits = scanTextContent(
        `SUPABASE_SERVICE_ROLE_KEY=${FAKE_SERVICE_ROLE_JWT}`,
        'server.env',
      );
      expect(hits.some((v) => v.ruleId === 'service-role-key-assign')).toBe(true);
    });

    it('respects per-line secrets-deploy-allow escape', () => {
      const line = `${FAKE_SBP}  # ${ALLOW_MARKER}: unit-test documented false positive`;
      expect(scanTextContent(line, 'docs/note.md')).toEqual([]);
    });
  });

  describe('forbidden tracked paths', () => {
    it('matches deny inventory A paths', () => {
      expect(matchForbiddenTrackedPath('.env')?.id).toBe('env-file');
      expect(matchForbiddenTrackedPath('.env.local')?.id).toBe('env-file');
      expect(matchForbiddenTrackedPath('setup/.env.secrets')?.id).toBe('env-file');
      expect(matchForbiddenTrackedPath('.dev.vars')?.id).toBe('dev-vars');
      expect(matchForbiddenTrackedPath('apps/web/.dev.vars')?.id).toBe('dev-vars');
      expect(matchForbiddenTrackedPath('certs/prod.pem')?.id).toBe('key-material');
      expect(matchForbiddenTrackedPath('foo.p12')?.id).toBe('key-material');
      expect(matchForbiddenTrackedPath('credentials.json')?.id).toBe('credentials-json');
      expect(matchForbiddenTrackedPath('.local-trade-dev.credentials.json')?.id).toBe(
        'credentials-json',
      );
      expect(matchForbiddenTrackedPath('tests/e2e/.auth.json')?.id).toBe('e2e-auth');
      expect(matchForbiddenTrackedPath('tests/e2e/.admin-auth.json')?.id).toBe('e2e-auth');
      expect(matchForbiddenTrackedPath('secrets.toml')?.id).toBe('secrets-toml');
    });

    it('allows documented example exceptions', () => {
      expect(matchForbiddenTrackedPath('.env.example')).toBeUndefined();
      expect(matchForbiddenTrackedPath('apps/web/.env.example')).toBeUndefined();
      expect(matchForbiddenTrackedPath('demo.key.example')).toBeUndefined();
    });
  });

  describe('masking', () => {
    it('masks sbp_ / ghp_ / JWT fragments without echoing the raw secret', () => {
      expect(maskSecretFragment(FAKE_SBP)).toBe('sbp_***');
      expect(maskSecretFragment('ghp_abcdefghijklmnopqrstuvwxyz1234')).toBe('ghp_***');
      const maskedJwt = maskSecretFragment(FAKE_SERVICE_ROLE_JWT);
      expect(maskedJwt).not.toBe(FAKE_SERVICE_ROLE_JWT);
      expect(maskedJwt).toContain('***');
      expect(maskedJwt.includes(FAKE_SERVICE_ROLE_JWT)).toBe(false);
    });

    it('never leaves raw sbp or service_role JWT in violation messages', () => {
      const hits = scanTextContent(
        [`token=${FAKE_SBP}`, `jwt=${FAKE_SERVICE_ROLE_JWT}`].join('\n'),
        'leak.txt',
      );
      expect(hits.length).toBeGreaterThan(0);
      const joined = formatSecretViolations(hits);
      expect(joined).not.toContain(FAKE_SBP);
      expect(joined).not.toContain(FAKE_SERVICE_ROLE_JWT);
      expect(joined).toMatch(/sbp_\*\*\*/);
    });
  });

  describe('gitignore coverage inventory', () => {
    it('exports the required deny patterns from inventory A', () => {
      expect([...GITIGNORE_REQUIRED_PATTERNS]).toEqual(
        expect.arrayContaining([
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
        ]),
      );
      expect(GITIGNORE_REQUIRED_PATTERNS.length).toBeGreaterThanOrEqual(11);
    });

    it('repo .gitignore covers every required secrets deny pattern', () => {
      const violations = assertGitignoreCoversDenyList({ cwd: process.cwd() });
      expect(violations, formatSecretViolations(violations)).toEqual([]);
    });

    it('fails when a required pattern is missing from gitignore text', () => {
      const violations = assertGitignoreCoversDenyList({
        gitignoreText: '.env\nnode_modules/\n',
      });
      expect(violations.some((v) => v.ruleId === 'gitignore-coverage')).toBe(true);
      expect(violations.some((v) => v.message.includes('.dev.vars'))).toBe(true);
    });
  });

  describe('wiring', () => {
    it('package.json exposes check:secrets-deploy-deny on the check chain', () => {
      const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
        scripts: Record<string, string>;
      };
      expect(pkg.scripts['check:secrets-deploy-deny']).toContain('check-secrets-deploy-deny.ts');
      expect(pkg.scripts.check).toContain('check:secrets-deploy-deny');
    });
  });
});
