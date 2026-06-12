/**
 * Responsible gaming E2E — limit cooldown semantics and self-exclusion entry block.
 */
import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  readAuth,
  injectBrowserSession,
  adminClient,
  assertConservationUnchanged,
  currencyTotals,
  ANON_KEY,
  SUPABASE_URL,
} from './_helpers';

interface RgLimitRow {
  current_limit: string;
  pending_limit: string | null;
  pending_effective_at: string | null;
}

interface RgLimitRpcResult {
  ok?: boolean;
  pending?: boolean;
  current_limit?: string;
  pending_limit?: string | null;
  pending_effective_at?: string | null;
}

function authedClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function rpcSetLimit(
  client: SupabaseClient,
  kind: 'loss' | 'deposit',
  domain: string,
  currency: string,
  amount: string,
): Promise<RgLimitRpcResult> {
  const { data, error } = await client.rpc('rpc_set_rg_limit', {
    p_limit_kind: kind,
    p_domain: domain,
    p_currency: currency,
    p_amount: amount,
  });
  expect(error).toBeNull();
  return data as RgLimitRpcResult;
}

async function readGameLossLimit(admin: SupabaseClient, userId: string): Promise<RgLimitRow> {
  const { data, error } = await admin
    .from('rg_user_limits')
    .select('current_limit, pending_limit, pending_effective_at')
    .eq('user_id', userId)
    .eq('limit_kind', 'loss')
    .eq('domain', 'game')
    .eq('currency', 'USDT')
    .maybeSingle();
  expect(error).toBeNull();
  expect(data).not.toBeNull();
  return data as RgLimitRow;
}

test.describe('Responsible gaming', () => {
  test('limit decrease immediate, increase 24h pending, self-exclusion blocks bets', async ({ page }) => {
    const auth = readAuth();
    const admin = adminClient();
    const client = authedClient(auth.accessToken);
    const before = currencyTotals(admin);

    await injectBrowserSession(page, auth.accessToken, auth.refreshToken, {
      postLoginPath: '/responsible-gaming',
      unregisterServiceWorkers: true,
    });
    await expect(page.getByTestId('responsible-gaming-page')).toBeVisible({ timeout: 20_000 });

    // (a) 한도 강화(하향) 즉시 적용
    await rpcSetLimit(client, 'loss', 'game', 'USDT', '100.000000');
    const tighten = await rpcSetLimit(client, 'loss', 'game', 'USDT', '50.000000');
    expect(tighten.pending).toBe(false);
    const afterTighten = await readGameLossLimit(admin, auth.userId);
    expect(afterTighten.current_limit).toBe('50.000000');
    expect(afterTighten.pending_limit).toBeNull();

    // (b) 한도 완화(상향) 24h 지연 — current 유지, pending만 설정
    const relax = await rpcSetLimit(client, 'loss', 'game', 'USDT', '80.000000');
    expect(relax.pending).toBe(true);
    const afterRelax = await readGameLossLimit(admin, auth.userId);
    expect(afterRelax.current_limit).toBe('50.000000');
    expect(afterRelax.pending_limit).toBe('80.000000');
    expect(afterRelax.pending_effective_at).not.toBeNull();
    const effectiveMs = new Date(afterRelax.pending_effective_at as string).getTime();
    expect(effectiveMs - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000);

    // (c) 자기배제 후 신규 베팅 차단 + Σ 보존
    await page.getByTestId('rg-self-exclusion-start').click();
    await expect(page.getByTestId('rg-self-exclusion-confirm-confirm')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('rg-self-exclusion-confirm-confirm').click();
    await expect(page.locator('[data-sonner-toast]')).toContainText(/적용|active/i, { timeout: 15_000 });

    await admin
      .from('app_config')
      .update({ value: 'true' })
      .in('key', ['feature_game_enabled', 'feature_game_dice_enabled']);

    const { data: round, error: roundError } = await client.rpc('rpc_open_game_round', { p_game: 'dice' });
    expect(roundError).toBeNull();

    const { error: betError } = await client.rpc('rpc_place_game_bet', {
      p_round_id: (round as { round_id: string }).round_id,
      p_currency: 'PHON',
      p_stake: '10.000000',
      p_selection: { target: '50.00', direction: 'over' },
      p_client_seed: `rg-e2e-${Date.now()}`,
      p_idempotency_key: `rg-e2e-${crypto.randomUUID()}`,
    });
    expect(betError?.message).toMatch(/rg_self_excluded/i);

    assertConservationUnchanged(before, currencyTotals(admin));
  });
});
