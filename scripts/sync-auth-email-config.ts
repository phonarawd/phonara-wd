import { readAccessTokenFromEnvFiles } from './lib/supabase-auth';
import { LOCKED_SUPABASE_PROJECT_REF } from './lib/locked-supabase-project';
import {
  buildProductionAuthPatch,
  parseAuthSnapshot,
  productionSiteUrl,
  verifyAuthSnapshot,
} from './lib/auth-production-config';

async function main(): Promise<void> {
  const token = readAccessTokenFromEnvFiles();
  if (!token) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN required. Add to .env or setup/.env.secrets (see .env.example).',
    );
  }

  const patch = buildProductionAuthPatch();
  const hasSmtp = Boolean(patch.smtp_host && patch.smtp_pass);

  if (hasSmtp) {
    process.stdout.write('[auth:sync-email] custom SMTP fields included\n');
  } else {
    process.stdout.write(
      '[auth:sync-email] SMTP env missing — set SUPABASE_SMTP_* in .env then re-run\n',
    );
  }

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${LOCKED_SUPABASE_PROJECT_REF}/config/auth`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Auth config PATCH failed (${res.status}): ${body}`);
  }

  const verifyRes = await fetch(
    `https://api.supabase.com/v1/projects/${LOCKED_SUPABASE_PROJECT_REF}/config/auth`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!verifyRes.ok) {
    throw new Error(`Auth config verify GET failed (${verifyRes.status})`);
  }

  const snapshot = parseAuthSnapshot((await verifyRes.json()) as Record<string, unknown>);
  const issues = verifyAuthSnapshot(snapshot);

  process.stdout.write(
    `[auth:sync-email] remote auth updated · site_url=${productionSiteUrl()} · confirmations=ON\n`,
  );

  if (issues.length === 0) {
    process.stdout.write('[auth:sync-email] verify OK\n');
    return;
  }

  process.stderr.write('[auth:sync-email] verify issues after PATCH:\n');
  for (const issue of issues) {
    process.stderr.write(`  - ${issue}\n`);
  }
  process.exitCode = 1;
}

void main();
