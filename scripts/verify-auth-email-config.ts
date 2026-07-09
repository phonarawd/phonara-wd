import { readAccessTokenFromEnvFiles } from './lib/supabase-auth';
import { LOCKED_SUPABASE_PROJECT_REF } from './lib/locked-supabase-project';
import {
  parseAuthSnapshot,
  productionSiteUrl,
  verifyAuthSnapshot,
} from './lib/auth-production-config';

async function fetchAuthConfig(token: string): Promise<Record<string, unknown>> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${LOCKED_SUPABASE_PROJECT_REF}/config/auth`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Auth config GET failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  const token = readAccessTokenFromEnvFiles();
  if (!token) {
    throw new Error('SUPABASE_ACCESS_TOKEN required in .env or setup/.env.secrets');
  }

  const raw = await fetchAuthConfig(token);
  const snapshot = parseAuthSnapshot(raw);
  const issues = verifyAuthSnapshot(snapshot);

  process.stdout.write('[auth:verify] remote Supabase Auth snapshot\n');
  process.stdout.write(`  site_url=${snapshot.site_url ?? '—'}\n`);
  process.stdout.write(`  smtp_host=${snapshot.smtp_host ?? '—'}\n`);
  process.stdout.write(`  smtp_admin_email=${snapshot.smtp_admin_email ?? '—'}\n`);
  process.stdout.write(`  mailer_autoconfirm=${String(snapshot.mailer_autoconfirm)}\n`);
  process.stdout.write(`  disable_signup=${String(snapshot.disable_signup)}\n`);
  process.stdout.write(`  expected_site_url=${productionSiteUrl()}\n`);

  if (issues.length === 0) {
    process.stdout.write('[auth:verify] OK — production auth + SMTP aligned\n');
    return;
  }

  process.stderr.write('[auth:verify] issues:\n');
  for (const issue of issues) {
    process.stderr.write(`  - ${issue}\n`);
  }
  process.exitCode = 1;
}

void main();
