#!/usr/bin/env tsx
/**
 * H-06 / R8 — deployment parity gate.
 *
 * Default (local): deploy script flags · _headers security tokens · manifest schema · lock hash.
 * Optional:
 *   --remote          fetch Web/Admin preview `/release-manifest.json` + security headers
 *   --bun-audit       re-run `bun audit` (Critical CVE = FAIL)
 *   --advisors        run check:advisors (needs SUPABASE_ACCESS_TOKEN)
 *
 * Usage:
 *   bun run check:deploy-parity
 *   bun run check:deploy-parity -- --remote
 *   bun run check:deploy-parity -- --remote --bun-audit --advisors
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMigrationsLock } from './lib/parse-migrations-lock';
import {
  LOCKED_SUPABASE_PROJECT_REF,
  RELEASE_MANIFEST_FILENAME,
  assertHeadersFileContainsSecurityTokens,
  assertReleaseManifest,
  buildReleaseManifest,
  computeMigrationLockHash,
  type ReleaseManifest,
} from './lib/release-manifest';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const WEB_PREVIEW_ORIGIN =
  process.env.PHONARA_WEB_PREVIEW_ORIGIN?.trim() || 'https://preview.phonara-web.pages.dev';
const ADMIN_PREVIEW_ORIGIN =
  process.env.PHONARA_ADMIN_PREVIEW_ORIGIN?.trim() || 'https://preview.phonara-admin.pages.dev';

const REQUIRED_RESPONSE_HEADERS = [
  { name: 'content-security-policy', mustInclude: 'frame-ancestors' },
  { name: 'strict-transport-security', mustInclude: 'max-age' },
  { name: 'x-content-type-options', mustInclude: 'nosniff' },
] as const;

type Finding = { ok: boolean; id: string; detail: string };

function checkPackageDeployScripts(): Finding {
  const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const scripts = pkg.scripts ?? {};
  const keys = [
    'deploy:pages:web',
    'deploy:pages:web:preview',
    'deploy:pages:admin',
    'deploy:pages:admin:preview',
  ] as const;
  const bad: string[] = [];
  for (const key of keys) {
    const body = scripts[key] ?? '';
    if (!body) {
      bad.push(`${key}: missing`);
      continue;
    }
    if (body.includes('commit-dirty=true')) {
      bad.push(`${key}: commit-dirty=true forbidden`);
    }
    if (!body.includes('deploy-pages.ts') && !body.includes('commit-dirty=false')) {
      bad.push(`${key}: must use deploy-pages.ts or commit-dirty=false`);
    }
  }
  if (!scripts['check:deploy-parity']) {
    bad.push('check:deploy-parity script missing');
  }
  if (!scripts['release:manifest']) {
    bad.push('release:manifest script missing');
  }
  return {
    ok: bad.length === 0,
    id: 'deploy-scripts',
    detail: bad.length === 0 ? 'commit-dirty=false · deploy-pages wrapper present' : bad.join('; '),
  };
}

function checkHeadersFiles(): Finding {
  const paths = [
    path.join(REPO_ROOT, 'apps/web/public/_headers'),
    path.join(REPO_ROOT, 'apps/admin/public/_headers'),
  ];
  const errors: string[] = [];
  for (const p of paths) {
    if (!existsSync(p)) {
      errors.push(`missing ${path.relative(REPO_ROOT, p)}`);
      continue;
    }
    try {
      assertHeadersFileContainsSecurityTokens(readFileSync(p, 'utf8'), path.relative(REPO_ROOT, p));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return {
    ok: errors.length === 0,
    id: 'security-headers-files',
    detail: errors.length === 0 ? 'web+admin _headers tokens OK' : errors.join('; '),
  };
}

function checkManifestBuilder(): Finding {
  try {
    const lockHash = computeMigrationLockHash();
    const web = assertReleaseManifest(
      buildReleaseManifest({
        app: 'web',
        branch: 'preview',
        releaseSha: 'a'.repeat(40),
        gitDirty: false,
        migrationLockHash: lockHash,
        deploymentId: 'fixture-deploy',
        builtAt: '2026-07-13T00:00:00.000Z',
      }),
    );
    const admin = assertReleaseManifest(
      buildReleaseManifest({
        app: 'admin',
        branch: 'preview',
        releaseSha: 'a'.repeat(40),
        gitDirty: false,
        migrationLockHash: lockHash,
        deploymentId: 'fixture-deploy',
        builtAt: '2026-07-13T00:00:00.000Z',
      }),
    );
    if (web.releaseSha !== admin.releaseSha) {
      return { ok: false, id: 'manifest-builder', detail: 'web/admin fixture SHA mismatch' };
    }
    if (web.projectRef !== LOCKED_SUPABASE_PROJECT_REF) {
      return { ok: false, id: 'manifest-builder', detail: 'projectRef lock failed' };
    }
    if (web.migrationLockHash !== admin.migrationLockHash) {
      return { ok: false, id: 'manifest-builder', detail: 'migrationLockHash mismatch' };
    }
    return {
      ok: true,
      id: 'manifest-builder',
      detail: `schema OK · lock=${lockHash.slice(0, 12)}… · ref=${LOCKED_SUPABASE_PROJECT_REF}`,
    };
  } catch (e) {
    return {
      ok: false,
      id: 'manifest-builder',
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

function checkMigrationsLock(): Finding {
  const parsed = parseMigrationsLock({ repoRoot: REPO_ROOT });
  if (parsed.status !== 'ok') {
    return {
      ok: false,
      id: 'migrations-lock',
      detail: `${parsed.status}: ${parsed.violations.slice(0, 5).join('; ') || parsed.parse_error}`,
    };
  }
  return {
    ok: true,
    id: 'migrations-lock',
    detail: `ok · locked=${parsed.locked_count}`,
  };
}

async function fetchManifest(origin: string): Promise<{ ok: boolean; manifest?: ReleaseManifest; detail: string }> {
  const url = `${origin.replace(/\/$/, '')}/${RELEASE_MANIFEST_FILENAME}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      return { ok: false, detail: `${url} → HTTP ${res.status}` };
    }
    const json: unknown = await res.json();
    const manifest = assertReleaseManifest(json);
    return { ok: true, manifest, detail: `${url} sha=${manifest.releaseShaShort}` };
  } catch (e) {
    return { ok: false, detail: `${url}: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function fetchSecurityHeaders(origin: string): Promise<Finding> {
  const url = `${origin.replace(/\/$/, '')}/`;
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    const missing: string[] = [];
    for (const req of REQUIRED_RESPONSE_HEADERS) {
      const value = res.headers.get(req.name) ?? '';
      if (!value.toLowerCase().includes(req.mustInclude.toLowerCase())) {
        missing.push(`${req.name} (need ${req.mustInclude})`);
      }
    }
    // CSP frame-ancestors may only appear in CSP body; also accept X-Frame-Options DENY
    const csp = res.headers.get('content-security-policy') ?? '';
    const xfo = res.headers.get('x-frame-options') ?? '';
    if (!/frame-ancestors/i.test(csp) && !/deny|sameorigin/i.test(xfo)) {
      missing.push('frame-ancestors or X-Frame-Options');
    }
    return {
      ok: missing.length === 0,
      id: `remote-headers:${origin}`,
      detail:
        missing.length === 0
          ? `HTTP ${res.status} · CSP/HSTS/nosniff/frame OK`
          : `missing: ${missing.join(', ')}`,
    };
  } catch (e) {
    return {
      ok: false,
      id: `remote-headers:${origin}`,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

async function checkRemoteParity(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const web = await fetchManifest(WEB_PREVIEW_ORIGIN);
  const admin = await fetchManifest(ADMIN_PREVIEW_ORIGIN);
  findings.push({
    ok: web.ok,
    id: 'remote-web-manifest',
    detail: web.detail,
  });
  findings.push({
    ok: admin.ok,
    id: 'remote-admin-manifest',
    detail: admin.detail,
  });
  if (web.ok && admin.ok && web.manifest && admin.manifest) {
    const sameSha = web.manifest.releaseSha === admin.manifest.releaseSha;
    const sameLock = web.manifest.migrationLockHash === admin.manifest.migrationLockHash;
    const sameRef =
      web.manifest.projectRef === admin.manifest.projectRef &&
      web.manifest.projectRef === LOCKED_SUPABASE_PROJECT_REF;
    const dirty = web.manifest.gitDirty || admin.manifest.gitDirty;
    findings.push({
      ok: sameSha && sameLock && sameRef && !dirty,
      id: 'remote-web-admin-sha-parity',
      detail: sameSha && sameLock && sameRef && !dirty
        ? `parity OK sha=${web.manifest.releaseShaShort} lock=${web.manifest.migrationLockHash.slice(0, 12)}…`
        : `mismatch sha=${sameSha} lock=${sameLock} ref=${sameRef} dirty=${dirty}`,
    });
  }
  findings.push(await fetchSecurityHeaders(WEB_PREVIEW_ORIGIN));
  findings.push(await fetchSecurityHeaders(ADMIN_PREVIEW_ORIGIN));
  return findings;
}

function checkBunAudit(): Finding {
  const r = spawnSync('bun', ['audit', '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const stdout = r.stdout ?? '';
  let critical = 0;
  try {
    const parsed = JSON.parse(stdout) as {
      metadata?: { vulnerabilities?: { critical?: number } };
      vulnerabilities?: { critical?: number };
    };
    critical =
      parsed.metadata?.vulnerabilities?.critical ??
      parsed.vulnerabilities?.critical ??
      0;
  } catch {
    // bun audit --json shape varies; fall back to text scan
    if (/critical/i.test(stdout) && /[1-9]\d*\s+critical/i.test(stdout)) {
      critical = 1;
    }
  }
  return {
    ok: critical === 0 && (r.status === 0 || r.status === 1),
    id: 'bun-audit',
    detail:
      critical === 0
        ? `Critical CVE 0 (exit ${r.status ?? 'n/a'})`
        : `Critical CVE count=${critical}`,
  };
}

function checkAdvisors(): Finding {
  const r = spawnSync('bun', ['run', 'check:advisors'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, PHONARA_ADVISORS_STRICT: '1' },
  });
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  const ok = r.status === 0 && /0 ERROR|OK/i.test(out);
  return {
    ok,
    id: 'advisors',
    detail: ok ? 'advisor 0 ERROR' : `exit ${r.status}: ${out.slice(0, 400)}`,
  };
}

async function main(): Promise<void> {
  const remote = process.argv.includes('--remote');
  const wantAudit = process.argv.includes('--bun-audit');
  const wantAdvisors = process.argv.includes('--advisors');

  const findings: Finding[] = [
    checkPackageDeployScripts(),
    checkHeadersFiles(),
    checkManifestBuilder(),
    checkMigrationsLock(),
  ];

  if (remote) {
    findings.push(...(await checkRemoteParity()));
  }
  if (wantAudit) {
    findings.push(checkBunAudit());
  }
  if (wantAdvisors) {
    findings.push(checkAdvisors());
  }

  let failed = 0;
  for (const f of findings) {
    const mark = f.ok ? 'PASS' : 'FAIL';
    process.stdout.write(`[check:deploy-parity] ${mark} ${f.id} — ${f.detail}\n`);
    if (!f.ok) failed += 1;
  }

  if (failed > 0) {
    process.stderr.write(`[check:deploy-parity] FAILED — ${failed} check(s)\n`);
    process.exit(1);
  }
  process.stdout.write(
    `[check:deploy-parity] OK — ${findings.length} check(s)` +
      `${remote ? ' · remote' : ' · local'}` +
      `${wantAudit ? ' · bun-audit' : ''}` +
      `${wantAdvisors ? ' · advisors' : ''}\n`,
  );
}

main().catch((err) => {
  process.stderr.write(
    `[check:deploy-parity] ERROR ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
