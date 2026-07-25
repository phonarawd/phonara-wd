/**
 * Casino E2E helpers — dice PF + conservation (CI/operator · G13).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, type Page } from '@playwright/test';

import {
  ANON_KEY,
  currencyTotals,
  loginWebUser,
  primeWalletMoneyRails,
  provisionWalletE2EFixture,
  serviceClient,
  setPhonTrackBalances,
  SUPABASE_URL,
  type WalletE2EFixture,
} from './wallet-money';

export {
  ANON_KEY,
  currencyTotals,
  loginWebUser,
  serviceClient,
  setPhonTrackBalances,
  SUPABASE_URL,
  type WalletE2EFixture,
};

export type CasinoE2EFixture = WalletE2EFixture;

export async function provisionCasinoE2EFixture(): Promise<CasinoE2EFixture> {
  const fixture = await provisionWalletE2EFixture();
  const admin = serviceClient();
  await primeWalletMoneyRails(admin, fixture.userId);
  await resetCasinoConfig(admin);
  setPhonTrackBalances(fixture.userId, '5000.000000', '0.000000');
  return fixture;
}

export async function resetCasinoConfig(admin: SupabaseClient): Promise<void> {
  await admin
    .from('app_config')
    .update({ value: '1000000.000000' })
    .eq('key', 'casino_max_payout_phon');
  await admin
    .from('app_config')
    .update({ value: 'true' })
    .in('key', ['feature_game_enabled', 'feature_game_dice_enabled', 'consent_gate_enabled']);
  await admin
    .from('app_config')
    .update({ value: 'false' })
    .in('key', ['system_halt', 'system_readonly']);
}

export async function prepareCasinoSession(page: Page, fixture: CasinoE2EFixture): Promise<void> {
  const admin = serviceClient();
  await resetCasinoConfig(admin);
  setPhonTrackBalances(fixture.userId, '5000.000000', '0.000000');
  await loginWebUser(page, fixture);
}

export function authedCasinoClient(fixture: CasinoE2EFixture): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${fixture.accessToken}` } },
  });
}

export async function rpcCasino<T>(
  client: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name} failed: ${error.message}`);
  return data as T;
}

export async function gotoCasinoDice(page: Page): Promise<void> {
  await page.goto('/games/dice', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('casino-game-shell')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('casino-dice-stage')).toBeVisible({ timeout: 30_000 });
}

export async function gotoCasinoFairness(page: Page): Promise<void> {
  await page.goto('/casino/fairness', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('casino-fairness-verifier')).toBeVisible({ timeout: 30_000 });
}
