import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { generateSync } from 'otplib';
import { expect, type Page } from '@playwright/test';
import { readLocalSupabaseEnv } from '../../../scripts/lib/db-connect';

export const SUPABASE_URL = process.env['VITE_SUPABASE_URL'] ?? 'http://127.0.0.1:54321';
export const ANON_KEY =
  process.env['VITE_SUPABASE_ANON_KEY'] ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function readServiceRoleKey(): string {
  const key =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ??
    process.env['SUPABASE_SECRET_KEY'] ??
    readLocalSupabaseEnv()?.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('Local Supabase service role key is required for admin auth E2E.');
  }
  return key.replace(/^['"]|['"]$/g, '');
}

export const ADMIN_BASE = 'http://127.0.0.1:3001';
export const E2E_USER_PASSWORD = 'E2e-Test-Password-123456';
export const E2E_ADMIN_PASSWORD = 'E2e-Admin-Password-123456';

export type AdminAuthFixture = {
  userId: string;
  email: string;
  password: string;
};

export type AdminAuthFixtures = {
  user: AdminAuthFixture;
  admin: AdminAuthFixture & { totpSecret: string };
};

export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, readServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createConfirmedUser(
  admin: SupabaseClient,
  email: string,
  password: string,
): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`createUser failed: ${error?.message ?? 'no user'}`);
  }
  return data.user.id;
}

async function waitForProfile(admin: SupabaseClient, userId: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const { data } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (data) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('profile not created within 15s');
}

async function enrollVerifiedTotp(
  admin: SupabaseClient,
  userId: string,
  email: string,
  password: string,
): Promise<string> {
  const pub = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signIn, error: signInErr } = await pub.auth.signInWithPassword({ email, password });
  if (signInErr || !signIn.session) {
    throw new Error(`admin sign-in failed: ${signInErr?.message ?? 'no session'}`);
  }

  const sessionClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
  });

  const { data: factors } = await sessionClient.auth.mfa.listFactors();
  for (const factor of factors?.totp ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
  }

  const { data: enrollData, error: enrollErr } = await sessionClient.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'E2E Admin',
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

  return totpSecret;
}

export async function provisionAdminAuthFixtures(): Promise<AdminAuthFixtures> {
  const admin = serviceClient();
  const stamp = Date.now();

  const userEmail = `e2e_user_${stamp}@phonara.local`;
  const adminEmail = `e2e_admin_${stamp}@phonara.local`;

  const userId = await createConfirmedUser(admin, userEmail, E2E_USER_PASSWORD);
  await waitForProfile(admin, userId);

  const adminUserId = await createConfirmedUser(admin, adminEmail, E2E_ADMIN_PASSWORD);
  await waitForProfile(admin, adminUserId);
  const { error: roleErr } = await admin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', adminUserId);
  if (roleErr) throw new Error(`promote admin failed: ${roleErr.message}`);

  const totpSecret = await enrollVerifiedTotp(admin, adminUserId, adminEmail, E2E_ADMIN_PASSWORD);

  return {
    user: { userId, email: userEmail, password: E2E_USER_PASSWORD },
    admin: { userId: adminUserId, email: adminEmail, password: E2E_ADMIN_PASSWORD, totpSecret },
  };
}

export async function loginAdminWithMfa(
  page: Page,
  fixture: AdminAuthFixtures['admin'],
): Promise<void> {
  await page.goto(`${ADMIN_BASE}/login`);
  await expect(page.getByTestId('admin-login-form')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('admin-login-email').fill(fixture.email);
  await page.getByTestId('admin-login-password').fill(fixture.password);
  await page.getByTestId('admin-login-submit').click();

  await expect(page.getByTestId('admin-mfa-challenge-page')).toBeVisible({ timeout: 20_000 });
  const code = generateSync({ secret: fixture.totpSecret });
  await page.getByTestId('admin-mfa-challenge-code').fill(code);
  await page.getByTestId('admin-mfa-challenge-submit').click();
  await expect(page.getByTestId('overview-page')).toBeVisible({ timeout: 20_000 });
}
