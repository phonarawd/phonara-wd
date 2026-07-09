#!/usr/bin/env tsx
/**
 * Idempotent local Admin dev account (Docker Supabase only).
 * Writes `.local-admin-dev.credentials.json` (gitignored) for repeat logins.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { generateSync } from 'otplib';
import { readLocalSupabaseEnv } from './lib/db-connect';
import { ensureLocalSupabaseStarted } from './lib/supabase-local';
import { ensureDockerReady } from './lib/docker-ready';

const CREDENTIALS_FILE = join(process.cwd(), '.local-admin-dev.credentials.json');

export const DEV_ADMIN_EMAIL = 'dev-admin@phonara.local';
export const DEV_ADMIN_PASSWORD = 'Phonara-Admin-Dev-123456';

export interface LocalAdminCredentials {
  email: string;
  password: string;
  totpSecret: string;
  userId: string;
  loginUrl: string;
  supabaseUrl: string;
  createdAt: string;
}

async function waitForProfileAndWallet(admin: SupabaseClient, userId: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    const { data: wallet } = await admin
      .from('wallets')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (profile && wallet) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('profile/wallet not created by handle_new_user trigger within 15s');
}

async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function provisionAdmin(
  supabaseUrl: string,
  anonKey: string,
  serviceRoleKey: string,
): Promise<LocalAdminCredentials> {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const pub = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId = await findUserIdByEmail(admin, DEV_ADMIN_EMAIL);

  if (!userId) {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: DEV_ADMIN_EMAIL,
      password: DEV_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (cErr || !created.user) {
      throw new Error(`createUser failed: ${cErr?.message ?? 'no user'}`);
    }
    userId = created.user.id;
  } else {
    const { error: pwErr } = await admin.auth.admin.updateUserById(userId, {
      password: DEV_ADMIN_PASSWORD,
    });
    if (pwErr) throw new Error(`updateUser password failed: ${pwErr.message}`);
  }

  await waitForProfileAndWallet(admin, userId);

  const { error: roleErr } = await admin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);
  if (roleErr) throw new Error(`promote admin failed: ${roleErr.message}`);

  const { data: signIn, error: sErr } = await pub.auth.signInWithPassword({
    email: DEV_ADMIN_EMAIL,
    password: DEV_ADMIN_PASSWORD,
  });
  if (sErr || !signIn.session) {
    throw new Error(`sign-in failed: ${sErr?.message ?? 'no session'}`);
  }

  const sessionClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
  });

  const { data: factors } = await sessionClient.auth.mfa.listFactors();
  for (const factor of factors?.totp ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
  }

  const { data: enrollData, error: enrollErr } = await sessionClient.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Local Admin Dev',
  });
  if (enrollErr || !enrollData?.totp) {
    throw new Error(`MFA enroll failed: ${enrollErr?.message ?? 'no totp'}`);
  }

  const totpSecret = enrollData.totp.secret;
  const verifyCode = generateSync({ secret: totpSecret });
  const { data: challengeData, error: challengeErr } = await sessionClient.auth.mfa.challenge({
    factorId: enrollData.id,
  });
  if (challengeErr || !challengeData?.id) {
    throw new Error(`MFA challenge failed: ${challengeErr?.message ?? 'no challenge'}`);
  }

  const { error: verifyErr } = await sessionClient.auth.mfa.verify({
    factorId: enrollData.id,
    challengeId: challengeData.id,
    code: verifyCode,
  });
  if (verifyErr) throw new Error(`MFA verify failed: ${verifyErr.message}`);

  return {
    email: DEV_ADMIN_EMAIL,
    password: DEV_ADMIN_PASSWORD,
    totpSecret,
    userId,
    loginUrl: 'http://localhost:3001/login',
    supabaseUrl,
    createdAt: new Date().toISOString(),
  };
}

function printBanner(creds: LocalAdminCredentials): void {
  const currentCode = generateSync({ secret: creds.totpSecret });
  process.stdout.write('\n=== PHONARA Admin · local dev ===\n');
  process.stdout.write(`Login:    ${creds.loginUrl}\n`);
  process.stdout.write(`Email:    ${creds.email}\n`);
  process.stdout.write(`Password: ${creds.password}\n`);
  process.stdout.write(`TOTP:     ${creds.totpSecret}  (Google Authenticator · 30s)\n`);
  process.stdout.write(`Code now: ${currentCode}\n`);
  process.stdout.write(`Supabase: ${creds.supabaseUrl}\n`);
  process.stdout.write(`Saved:    ${CREDENTIALS_FILE}\n`);
  process.stdout.write('\nFlow: login → MFA enroll/challenge → use TOTP code above\n\n');
}

async function main(): Promise<void> {
  ensureDockerReady({ quiet: false, startDesktop: false });
  ensureLocalSupabaseStarted({ quiet: false });

  const localEnv = readLocalSupabaseEnv();
  if (
    !localEnv?.VITE_SUPABASE_URL ||
    !localEnv.VITE_SUPABASE_ANON_KEY ||
    !localEnv.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Local Supabase env unavailable — run `bun run stack:ensure -- --full`');
  }

  const url = localEnv.VITE_SUPABASE_URL;
  if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
    throw new Error('seed:local-admin refuses non-local Supabase URL');
  }

  let creds: LocalAdminCredentials;

  const existingId = await findUserIdByEmail(
    createClient(url, localEnv.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    DEV_ADMIN_EMAIL,
  );

  if (existingId && existsSync(CREDENTIALS_FILE)) {
    creds = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf8')) as LocalAdminCredentials;
    if (creds.userId !== existingId || creds.email !== DEV_ADMIN_EMAIL) {
      creds = await provisionAdmin(
        url,
        localEnv.VITE_SUPABASE_ANON_KEY,
        localEnv.SUPABASE_SERVICE_ROLE_KEY,
      );
    } else {
      process.stdout.write('[seed:local-admin] existing dev admin — credentials reused\n');
    }
  } else {
    process.stdout.write('[seed:local-admin] provisioning dev admin…\n');
    creds = await provisionAdmin(
      url,
      localEnv.VITE_SUPABASE_ANON_KEY,
      localEnv.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
  printBanner(creds);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
