/**
 * Sportsbook E2E seed helpers — local stack ingest + settle (CI/operator · G13).
 */
import { spawnSync } from 'node:child_process';
import type { Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

const THE_ODDS_API_VENDOR = 'the-odds-api';

export type SportsE2EFixture = WalletE2EFixture;

export interface SeededSportsFixture {
  readonly fixtureId: string;
  readonly outcomeHomeId: string;
  readonly canonicalFixtureId: string;
  readonly homeOdds: string;
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function runPsql(sql: string): string {
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_yocjhjsdwoijfdrehzoq',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: sql, encoding: 'utf8', timeout: 45_000 },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'psql failed');
  }
  return result.stdout.trim();
}

export function enableSportsFeatureFlag(): void {
  runPsql(`UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';`);
  runPsql(
    `UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');`,
  );
}

export async function seedPrematchFixture(
  _admin: SupabaseClient,
  suffix: string,
  kickoffOffsetHours = 48,
): Promise<SeededSportsFixture> {
  void _admin;
  const canonicalFixtureId = `${THE_ODDS_API_VENDOR}:e2e-${suffix}`;
  const homeOutcomeCanonical = `${canonicalFixtureId}:match_1x2:home`;
  const kickoffAt = new Date(Date.now() + kickoffOffsetHours * 3600_000).toISOString();
  const capturedAt = new Date().toISOString();
  const homeOdds = '2.000000';

  const messages = JSON.stringify([
    {
      type: 'event_upsert',
      fixture: {
        fixtureId: canonicalFixtureId,
        leagueCode: 'epl',
        homeName: `E2E Home ${suffix}`,
        awayName: `E2E Away ${suffix}`,
        kickoffAt,
        status: 'scheduled',
      },
      markets: [
        {
          marketId: `${canonicalFixtureId}:match_1x2`,
          marketType: 'match_1x2',
          status: 'open',
          outcomes: [
            { outcomeId: homeOutcomeCanonical, selection: 'home' },
            { outcomeId: `${canonicalFixtureId}:match_1x2:draw`, selection: 'draw' },
            { outcomeId: `${canonicalFixtureId}:match_1x2:away`, selection: 'away' },
          ],
        },
      ],
    },
    {
      type: 'odds_upsert',
      outcomeId: homeOutcomeCanonical,
      odds: homeOdds,
      capturedAt,
    },
    {
      type: 'odds_upsert',
      outcomeId: `${canonicalFixtureId}:match_1x2:draw`,
      odds: '3.200000',
      capturedAt,
    },
    {
      type: 'odds_upsert',
      outcomeId: `${canonicalFixtureId}:match_1x2:away`,
      odds: '3.800000',
      capturedAt,
    },
  ]);

  runPsql(`
    SET ROLE service_role;
    SELECT rpc_ingest_sports_c1_batch(${sqlLiteral(messages)}::jsonb);
  `);

  const row = runPsql(`
    SELECT f.id || ',' || o.id
    FROM sports_fixtures f
    JOIN sports_markets m ON m.fixture_id = f.id
    JOIN sports_outcomes o ON o.market_id = m.id
    WHERE f.canonical_fixture_id = ${sqlLiteral(canonicalFixtureId)}
      AND o.canonical_outcome_id = ${sqlLiteral(homeOutcomeCanonical)};
  `);

  const [fixtureId, outcomeHomeId] = row.split(',');
  if (!fixtureId || !outcomeHomeId) {
    throw new Error('seeded fixture not found after ingest');
  }

  // Ensure place path can accept bets (status open · no suspend window).
  runPsql(`
    UPDATE sports_markets m
    SET status = 'open',
        suspended_until = NULL
    FROM sports_fixtures f
    WHERE m.fixture_id = f.id
      AND f.canonical_fixture_id = ${sqlLiteral(canonicalFixtureId)};
    UPDATE sports_fixtures
    SET status = 'scheduled',
        suspended_until = NULL
    WHERE canonical_fixture_id = ${sqlLiteral(canonicalFixtureId)};
  `);

  return { fixtureId, outcomeHomeId, canonicalFixtureId, homeOdds };
}

export async function settleFixtureWin(
  _admin: SupabaseClient,
  fixtureId: string,
  homeGoals = 2,
  awayGoals = 0,
): Promise<void> {
  void _admin;
  runPsql(`
    SET ROLE service_role;
    SELECT rpc_settle_sports_fixture_scores(
      ${sqlLiteral(fixtureId)}::uuid,
      ${homeGoals},
      ${awayGoals},
      'e2e_settle'
    );
  `);
}

export async function provisionSportsE2EFixture(): Promise<SportsE2EFixture> {
  const fixture = await provisionWalletE2EFixture();
  const admin = serviceClient();
  await primeWalletMoneyRails(admin, fixture.userId);
  enableSportsFeatureFlag();
  setPhonTrackBalances(fixture.userId, '5000.000000', '0.000000');
  return fixture;
}

export async function prepareSportsSession(page: Page, fixture: SportsE2EFixture): Promise<void> {
  enableSportsFeatureFlag();
  setPhonTrackBalances(fixture.userId, '5000.000000', '0.000000');
  await loginWebUser(page, fixture);
}

export function authedSportsClient(fixture: SportsE2EFixture): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${fixture.accessToken}` } },
  });
}
