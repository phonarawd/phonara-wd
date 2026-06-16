import { spawnSync } from 'node:child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const THE_ODDS_API_VENDOR = 'the-odds-api';
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54444';
const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function readLocalServiceKey(): string {
  const result = spawnSync('supabase', ['status', '-o', 'env'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error('supabase status failed — run `supabase start` before sports E2E');
  }
  const values = new Map<string, string>();
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=['"]?(.+?)['"]?$/);
    if (match) values.set(match[1]!, match[2]!);
  }
  const key =
    values.get('SECRET_KEY') ?? values.get('SUPABASE_SERVICE_ROLE_KEY') ?? values.get('SERVICE_ROLE_KEY');
  if (!key) throw new Error('local service role key not found in supabase status');
  return key.replace(/^['"]|['"]$/g, '');
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
    { input: sql, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'psql failed');
  }
  return result.stdout.trim();
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/** Local stack admin client — avoids remote .env URL mismatch in sports E2E workers. */
export function localAdminClient(): SupabaseClient {
  return createClient(LOCAL_SUPABASE_URL, readLocalServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function localAuthedClient(accessToken: string): SupabaseClient {
  return createClient(LOCAL_SUPABASE_URL, LOCAL_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export interface SeededSportsFixture {
  readonly fixtureId: string;
  readonly outcomeHomeId: string;
  readonly canonicalFixtureId: string;
  readonly homeOdds: string;
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

  return { fixtureId, outcomeHomeId, canonicalFixtureId, homeOdds };
}

export function enableSportsFeatureFlag(): void {
  runPsql(`UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';`);
}

export function disableSportsE2EConsentGate(): void {
  runPsql(`UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';`);
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
