import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { currencyTotals, fundE2EWallet } from './_helpers';
import {
  disableSportsE2EConsentGate,
  enableSportsFeatureFlag,
  localAdminClient,
  localAuthedClient,
  seedPrematchFixture,
  settleFixtureWin,
} from './helpers/sports-fixture';

async function createSportsUser(admin: SupabaseClient) {
  const email = `sports_e2e_${Date.now()}@phonara.local`;
  const password = 'Sports-E2e-Password-123456';
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) throw new Error(createError?.message ?? 'createUser failed');

  const { data: signed, error: signError } = await admin.auth.signInWithPassword({ email, password });
  if (signError || !signed.session) throw new Error(signError?.message ?? 'signIn failed');

  fundE2EWallet(created.user.id, { phon: '5000.000000' });
  await admin.from('profiles').update({ onboarding_consent_at: new Date().toISOString() }).eq('id', created.user.id);

  return {
    userId: created.user.id,
    email,
    accessToken: signed.session.access_token,
    refreshToken: signed.session.refresh_token,
  };
}

test.describe('Sportsbook engine (RPC · conservation)', () => {
  test.beforeAll(() => {
    disableSportsE2EConsentGate();
    enableSportsFeatureFlag();
  });

  test.afterAll(() => {
    enableSportsFeatureFlag();
  });

  test('M1 place single prematch conserves PHON', async () => {
    const admin = localAdminClient();
    const auth = await createSportsUser(admin);
    const client = localAuthedClient(auth.accessToken);
    const before = currencyTotals(admin);

    const seeded = await seedPrematchFixture(admin, String(Date.now()));
    const idem = `sports-e2e-place-${Date.now()}`;

    const { data: placed, error: placeError } = await client.rpc('rpc_place_sports_bet', {
      p_legs: [{ outcome_id: seeded.outcomeHomeId, odds_at_bet: seeded.homeOdds }],
      p_stake: '100.000000',
      p_currency: 'PHON',
      p_idempotency_key: idem,
    });
    expect(placeError).toBeNull();
    expect(placed?.status).toBe('pending');
    expect(placed?.already_placed).toBe(false);

    const afterPlace = currencyTotals(admin);
    expect(afterPlace.PHON).toBe(before.PHON);

    await settleFixtureWin(admin, seeded.fixtureId, 1, 0);

    const afterSettle = currencyTotals(admin);
    expect(afterSettle.PHON).toBe(before.PHON);
  });

  test('M2 idempotency replay returns same bet without extra lock', async () => {
    const admin = localAdminClient();
    const auth = await createSportsUser(admin);
    const client = localAuthedClient(auth.accessToken);
    const seeded = await seedPrematchFixture(admin, `idem-${Date.now()}`);
    const idem = `sports-e2e-idem-${Date.now()}`;

    const first = await client.rpc('rpc_place_sports_bet', {
      p_legs: [{ outcome_id: seeded.outcomeHomeId, odds_at_bet: seeded.homeOdds }],
      p_stake: '50.000000',
      p_currency: 'PHON',
      p_idempotency_key: idem,
    });
    expect(first.error).toBeNull();

    const second = await client.rpc('rpc_place_sports_bet', {
      p_legs: [{ outcome_id: seeded.outcomeHomeId, odds_at_bet: seeded.homeOdds }],
      p_stake: '50.000000',
      p_currency: 'PHON',
      p_idempotency_key: idem,
    });
    expect(second.error).toBeNull();
    expect(second.data?.bet_id).toBe(first.data?.bet_id);
    expect(second.data?.already_placed).toBe(true);

    const { count } = await admin
      .from('sports_bets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('idempotency_key', idem);
    expect(count).toBe(1);
  });

  test('N1 rejects tampered odds_at_bet', async () => {
    const admin = localAdminClient();
    const auth = await createSportsUser(admin);
    const client = localAuthedClient(auth.accessToken);
    const seeded = await seedPrematchFixture(admin, `neg-${Date.now()}`);

    const { error } = await client.rpc('rpc_place_sports_bet', {
      p_legs: [{ outcome_id: seeded.outcomeHomeId, odds_at_bet: '9.990000' }],
      p_stake: '10.000000',
      p_currency: 'PHON',
      p_idempotency_key: `sports-e2e-bad-odds-${Date.now()}`,
    });
    expect(error).not.toBeNull();
    expect(error?.message.toLowerCase()).toContain('odds_changed');
  });

  test('N2 rejects insufficient balance', async () => {
    const admin = localAdminClient();
    const auth = await createSportsUser(admin);
    const client = localAuthedClient(auth.accessToken);
    const seeded = await seedPrematchFixture(admin, `insuf-${Date.now()}`);

    const { error } = await client.rpc('rpc_place_sports_bet', {
      p_legs: [{ outcome_id: seeded.outcomeHomeId, odds_at_bet: seeded.homeOdds }],
      p_stake: '6000.000000',
      p_currency: 'PHON',
      p_idempotency_key: `sports-e2e-insuf-${Date.now()}`,
    });
    expect(error).not.toBeNull();
    expect(error?.message.toLowerCase()).toContain('insufficient');
  });

  test('N3 rejects when feature_sports_enabled is off', async () => {
    const admin = localAdminClient();
    await admin.from('app_config').update({ value: 'false' }).eq('key', 'feature_sports_enabled');

    try {
      const auth = await createSportsUser(admin);
      const client = localAuthedClient(auth.accessToken);
      const seeded = await seedPrematchFixture(admin, `kill-${Date.now()}`);

      const { error } = await client.rpc('rpc_place_sports_bet', {
        p_legs: [{ outcome_id: seeded.outcomeHomeId, odds_at_bet: seeded.homeOdds }],
        p_stake: '10.000000',
        p_currency: 'PHON',
        p_idempotency_key: `sports-e2e-kill-${Date.now()}`,
      });
      expect(error).not.toBeNull();
      expect(error?.message.toLowerCase()).toContain('feature_disabled');
    } finally {
      await admin.from('app_config').update({ value: 'true' }).eq('key', 'feature_sports_enabled');
    }
  });
});
