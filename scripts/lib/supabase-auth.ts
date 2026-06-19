import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCKED_SUPABASE_PROJECT_REF } from './locked-supabase-project';
import { loadRepoEnvFiles } from './load-repo-env';

const TOKEN_PATTERN = /^sbp_[A-Za-z0-9]+$/;

export function repoRoot(): string {
  return process.cwd();
}

export function ensureEnvFileFromExample(): void {
  const root = repoRoot();
  const envPath = join(root, '.env');
  const examplePath = join(root, '.env.example');
  if (existsSync(envPath) || !existsSync(examplePath)) return;
  copyFileSync(examplePath, envPath);
  process.stdout.write('[stack:env] created .env from .env.example\n');
}

export function readAccessTokenFromEnvFiles(): string | null {
  loadRepoEnvFiles();
  const direct = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (direct && TOKEN_PATTERN.test(direct)) return direct;

  for (const filename of ['.env', '.env.local', 'setup/.env.secrets']) {
    const path = join(repoRoot(), filename);
    if (!existsSync(path)) continue;
    for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/);
      if (!m) continue;
      const value = m[1]!.trim().replace(/^["']|["']$/g, '');
      if (TOKEN_PATTERN.test(value)) return value;
    }
  }
  return null;
}

function upsertEnvToken(token: string): void {
  const envPath = join(repoRoot(), '.env');
  ensureEnvFileFromExample();
  const lines = existsSync(envPath) ? readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
  let found = false;
  const out = lines.map((line) => {
    if (/^\s*SUPABASE_ACCESS_TOKEN=/.test(line)) {
      found = true;
      return `SUPABASE_ACCESS_TOKEN=${token}`;
    }
    return line;
  });
  if (!found) out.push(`SUPABASE_ACCESS_TOKEN=${token}`);
  writeFileSync(envPath, `${out.join('\n').replace(/\n*$/, '')}\n`, 'utf8');
  process.env.SUPABASE_ACCESS_TOKEN = token;
}

function syncFromWindowsCredentialManager(): boolean {
  if (process.platform !== 'win32') return false;
  const script = join(repoRoot(), 'scripts', 'sync-supabase-pat.ps1');
  if (!existsSync(script)) return false;
  const result = spawnSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script],
    { stdio: 'pipe', encoding: 'utf8' },
  );
  if (result.status !== 0) return false;
  loadRepoEnvFiles();
  return Boolean(readAccessTokenFromEnvFiles());
}

function cliLoginWithToken(token: string): boolean {
  const result = spawnSync('bunx', ['supabase', 'login', '--token', token, '--name', 'phonara-gb'], {
    cwd: repoRoot(),
    stdio: 'pipe',
    encoding: 'utf8',
  });
  return result.status === 0;
}

export async function verifyManagementApi(token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${LOCKED_SUPABASE_PROJECT_REF}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { id?: string };
    return body.id === LOCKED_SUPABASE_PROJECT_REF;
  } catch {
    return false;
  }
}

export type EnsureSupabaseAuthOptions = {
  quiet?: boolean;
};

/** Idempotent: .env → CLI login → Windows cred sync → verify Management API. */
export async function ensureSupabaseAuth(options: EnsureSupabaseAuthOptions = {}): Promise<void> {
  const { quiet = false } = options;
  ensureEnvFileFromExample();
  loadRepoEnvFiles();

  let token = readAccessTokenFromEnvFiles();

  if (!token && process.platform === 'win32') {
    if (!quiet) process.stdout.write('[stack:supabase] syncing PAT from Windows credential store…\n');
    if (syncFromWindowsCredentialManager()) {
      token = readAccessTokenFromEnvFiles();
    }
  }

  if (!token) {
    throw new Error(
      '[stack:supabase] SUPABASE_ACCESS_TOKEN missing.\n' +
        '  One-time: add token to .env (see .env.example) OR run `supabase login` once on this PC.\n' +
        '  Then agents use `bun run stack:ensure` with zero manual steps.',
    );
  }

  if (!quiet) process.stdout.write('[stack:supabase] CLI login (token from env)…\n');
  if (!cliLoginWithToken(token)) {
    throw new Error('[stack:supabase] `supabase login --token` failed — check PAT validity');
  }

  upsertEnvToken(token);

  const ok = await verifyManagementApi(token);
  if (!ok) {
    throw new Error(
      `[stack:supabase] Management API verify failed for project ${LOCKED_SUPABASE_PROJECT_REF}`,
    );
  }

  if (!quiet) {
    process.stdout.write(
      `[stack:supabase] auth OK · project=${LOCKED_SUPABASE_PROJECT_REF}\n`,
    );
  }
}

/** Non-throwing probe for hooks. */
export async function isSupabaseAuthReady(): Promise<boolean> {
  const token = readAccessTokenFromEnvFiles();
  if (!token) return false;
  return verifyManagementApi(token);
}
