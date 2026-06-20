import { sqlAsService, sqlAsUser, sqlExec } from '../../pentest/lib/sql-rpc.ts';

export interface SportsProbeBet {
  betId: string;
  cashoutAmount: string;
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/** Seed a prematch fixture + place a pending sports bet for halt/cashout probes. */
export function seedSportsCashoutProbe(userId: string, suffix: string): SportsProbeBet | null {
  const canonicalFixtureId = `guard-audit:${suffix}`;
  const homeOutcome = `${canonicalFixtureId}:match_1x2:home`;
  const kickoffAt = new Date(Date.now() + 48 * 3600_000).toISOString();

  sqlExec(`
    UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
    UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  `);

  const ingest = sqlAsService<unknown>(`
    SELECT rpc_ingest_sports_c1(${sqlLiteral(
      JSON.stringify({
        type: 'event_upsert',
        fixture: {
          fixtureId: canonicalFixtureId,
          leagueCode: 'epl',
          homeName: 'Guard Home',
          awayName: 'Guard Away',
          kickoffAt,
          status: 'scheduled',
        },
        markets: [
          {
            marketId: `${canonicalFixtureId}:match_1x2`,
            marketType: 'match_1x2',
            status: 'open',
            outcomes: [
              { outcomeId: homeOutcome, selection: 'home' },
              { outcomeId: `${canonicalFixtureId}:match_1x2:draw`, selection: 'draw' },
              { outcomeId: `${canonicalFixtureId}:match_1x2:away`, selection: 'away' },
            ],
          },
        ],
      }),
    )}::jsonb)
  `);
  if (!ingest.ok) return null;

  const odds = sqlAsService<unknown>(`
    SELECT rpc_ingest_sports_c1(${sqlLiteral(
      JSON.stringify({
        type: 'odds_upsert',
        outcomeId: homeOutcome,
        odds: '2.000000',
        capturedAt: new Date().toISOString(),
      }),
    )}::jsonb)
  `);
  if (!odds.ok) return null;

  const outcomeRow = sqlExec(`
    SELECT o.id::text
    FROM sports_fixtures f
    JOIN sports_markets m ON m.fixture_id = f.id
    JOIN sports_outcomes o ON o.market_id = m.id
    WHERE f.canonical_fixture_id = ${sqlLiteral(canonicalFixtureId)}
      AND o.canonical_outcome_id = ${sqlLiteral(homeOutcome)}
    LIMIT 1;
  `);
  const outcomeId = outcomeRow.stdout.trim();
  if (!outcomeId) return null;

  const legs = JSON.stringify([{ outcome_id: outcomeId, odds_at_bet: '2.000000' }]);
  const place = sqlAsUser<{ bet_id?: string; status?: string }>(
    userId,
    `rpc_place_sports_bet('${legs}'::jsonb, 'PHON', '20.000000', 'guard-audit-sports-${suffix}')`,
  );
  if (!place.ok || !place.data?.bet_id) return null;

  const preview = sqlAsUser<{ cashout_amount?: string; offer?: string; amount?: string }>(
    userId,
    `rpc_preview_sports_cashout('${place.data.bet_id}'::uuid)`,
  );
  const cashoutAmount = preview.data?.cashout_amount ?? preview.data?.offer ?? preview.data?.amount;
  if (!cashoutAmount) return null;

  return { betId: place.data.bet_id, cashoutAmount };
}

/** Build a pending mines bet suitable for rpc_cancel_game_bet halt probing. */
export function seedMinesCancelProbe(userId: string): string | null {
  sqlExec(`
    UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_game_enabled', 'feature_game_mines_enabled');
  `);

  const round = sqlAsUser<{ round_id?: string }>(userId, `rpc_open_game_round('mines')`);
  if (!round.ok || !round.data?.round_id) return null;

  const bet = sqlAsUser<{ bet_id?: string; status?: string }>(
    userId,
    `rpc_place_game_bet('${round.data.round_id}'::uuid, 'PHON', '5.000000', '{"mineCount":3,"revealedCells":[]}'::jsonb, 'guard-seed', 'guard-audit-mines-cancel')`,
  );
  if (!bet.ok || !bet.data?.bet_id || bet.data.status !== 'pending') return null;
  return bet.data.bet_id;
}

/** Fund USDT for legacy spot wrapper halt probe. */
export function fundUsdtForSpotProbe(userId: string): void {
  sqlExec(`
    INSERT INTO wallets (user_id, currency, available, locked)
    SELECT ${sqlLiteral(userId)}::uuid, 'USDT'::currency, '500.000000', '0.000000'
    WHERE NOT EXISTS (
      SELECT 1 FROM wallets WHERE user_id = ${sqlLiteral(userId)}::uuid AND currency = 'USDT'
    );
    UPDATE wallets SET available = GREATEST(available::numeric, 500)::text
    WHERE user_id = ${sqlLiteral(userId)}::uuid AND currency = 'USDT';
  `);
}
