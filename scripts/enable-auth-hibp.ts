/**
 * Enable Supabase Auth leaked-password protection (HIBP) via Management API.
 * H-09 / audit-r3e-auth-hibp-feature-flag — Pro+ entitlement required.
 *
 * Usage: bun run stack:auth-hibp-enable
 * Idempotent: GET → PATCH password_hibp_enabled=true → verify.
 */
import { LOCKED_SUPABASE_PROJECT_REF } from './lib/locked-supabase-project';
import { ensureSupabaseAuth, readAccessTokenFromEnvFiles } from './lib/supabase-auth';

const AUTH_CONFIG_URL = `https://api.supabase.com/v1/projects/${LOCKED_SUPABASE_PROJECT_REF}/config/auth`;

type AuthConfigSlice = {
  password_hibp_enabled?: boolean;
};

async function fetchAuthConfig(token: string): Promise<AuthConfigSlice> {
  const res = await fetch(AUTH_CONFIG_URL, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`[stack:auth-hibp] GET auth config failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as AuthConfigSlice;
}

async function patchHibpEnabled(token: string): Promise<AuthConfigSlice> {
  const res = await fetch(AUTH_CONFIG_URL, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password_hibp_enabled: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 402) {
      throw new Error(
        `[stack:auth-hibp] PRO_PLAN_REQUIRED (402) — leaked-password (HIBP) needs Pro+ entitlement.\n` +
          `  Unblock: upgrade org/project to Pro → re-run \`bun run stack:auth-hibp-enable\`.\n` +
          `  API: ${body}`,
      );
    }
    throw new Error(`[stack:auth-hibp] PATCH password_hibp_enabled failed: ${res.status} ${body}`);
  }
  return (await res.json()) as AuthConfigSlice;
}

async function main(): Promise<void> {
  await ensureSupabaseAuth({ quiet: false });
  const token = readAccessTokenFromEnvFiles();
  if (!token) {
    throw new Error('[stack:auth-hibp] SUPABASE_ACCESS_TOKEN missing after ensureSupabaseAuth');
  }

  const before = await fetchAuthConfig(token);
  process.stdout.write(
    `[stack:auth-hibp] before password_hibp_enabled=${String(before.password_hibp_enabled)}\n`,
  );

  if (before.password_hibp_enabled === true) {
    process.stdout.write('[stack:auth-hibp] already enabled — no PATCH\n');
    return;
  }

  const afterPatch = await patchHibpEnabled(token);
  process.stdout.write(
    `[stack:auth-hibp] PATCH ok password_hibp_enabled=${String(afterPatch.password_hibp_enabled)}\n`,
  );

  const verify = await fetchAuthConfig(token);
  if (verify.password_hibp_enabled !== true) {
    throw new Error(
      `[stack:auth-hibp] verify failed — password_hibp_enabled=${String(verify.password_hibp_enabled)}`,
    );
  }
  process.stdout.write('[stack:auth-hibp] verified password_hibp_enabled=true\n');
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
