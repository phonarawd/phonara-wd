/// <reference types="node" />
import {
  fetchFootballDataFinishedScores,
  fetchSportScores,
  isVendorQuotaExhausted,
  decideDualFeedSettle,
  findSecondaryFinishedMatch,
  mapScoreEventToStatusPayload,
  resolveVendorChain,
  scoreEventToFixtureBootstrapMessage,
  THE_ODDS_API_VENDOR,
  type FootballDataFinishedScore,
  type PrimaryFinishedScore,
  type TheOddsApiScoreEvent,
} from '@phonara/sports-ingest';
import { persistIngestMessages } from '../lib/sports-ingest-persist';
import { ingestFixtureStatus, resolveServiceClient } from '../lib/sports-engine-client';
import { recordIngestHealth } from '../lib/sports-ingest-health';

export interface SettleWorkerConfig {
  readonly vendorChain: ReturnType<typeof resolveVendorChain>;
  readonly leagues: readonly string[];
  readonly dryRun: boolean;
  readonly dualFeed: boolean;
  readonly dualFeedStrict: boolean;
  readonly footballDataApiKey?: string;
}

export interface SettleWorkerResult {
  readonly processed: number;
  readonly skipped: number;
  readonly mismatches: number;
  readonly vendor: string;
}

export function readSettleEnv(): SettleWorkerConfig {
  const vendorChain = resolveVendorChain({
    vendor: process.env['SPORTS_ODDS_VENDOR'],
    vendorPriority: process.env['SPORTS_ODDS_VENDOR_PRIORITY'],
    theOddsApiKey: process.env['THE_ODDS_API_KEY'],
    oddsApiIoKey: process.env['ODDS_API_IO_KEY'],
    sportsGameOddsKey: process.env['SPORTSGAMEODDS_API_KEY'],
    legacyOddsApiKey: process.env['ODDS_API_KEY'],
  });

  const leagueRaw =
    process.env['SPORTS_SETTLE_LEAGUES'] ?? process.env['SPORTS_INGEST_LEAGUES'] ?? 'epl';
  const leagues = leagueRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const footballDataApiKey = process.env['FOOTBALL_DATA_API_KEY']?.trim() || undefined;

  return {
    vendorChain,
    leagues,
    dryRun: process.env['SPORTS_SETTLE_DRY_RUN'] !== 'false',
    dualFeed: process.env['SPORTS_SETTLE_DUAL_FEED'] === 'true',
    dualFeedStrict: process.env['SPORTS_SETTLE_DUAL_FEED_STRICT'] !== 'false',
    footballDataApiKey,
  };
}

async function loadSecondaryScores(
  config: SettleWorkerConfig,
): Promise<Readonly<Record<string, readonly FootballDataFinishedScore[]>>> {
  if (!config.dualFeed || !config.footballDataApiKey) {
    return {};
  }

  const byLeague: Record<string, FootballDataFinishedScore[]> = {};

  for (const league of config.leagues) {
    try {
      const { scores } = await fetchFootballDataFinishedScores(
        config.footballDataApiKey,
        league,
        3,
      );
      byLeague[league] = [...scores];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[sports-settle] secondary feed ${league}: ${message}`);
      byLeague[league] = [];
    }
  }

  return byLeague;
}

async function ensureFixtureFromScoreEvent(
  event: TheOddsApiScoreEvent,
  league: string,
): Promise<void> {
  await persistIngestMessages([scoreEventToFixtureBootstrapMessage(event, league)]);
}

async function ingestFinishedScore(
  client: ReturnType<typeof resolveServiceClient>,
  event: TheOddsApiScoreEvent,
  league: string,
  mapped: ReturnType<typeof mapScoreEventToStatusPayload>,
  settleReason: string,
): Promise<boolean> {
  try {
    await ingestFixtureStatus(client, {
      canonicalFixtureId: mapped.canonicalFixtureId,
      status: 'finished',
      homeGoals: mapped.homeGoals!,
      awayGoals: mapped.awayGoals!,
      reason: settleReason,
      autoSettle: true,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('fixture_not_found')) {
      console.error(`[sports-settle] ${mapped.canonicalFixtureId}: ${message}`);
      return false;
    }
    await ensureFixtureFromScoreEvent(event, league);
    await ingestFixtureStatus(client, {
      canonicalFixtureId: mapped.canonicalFixtureId,
      status: 'finished',
      homeGoals: mapped.homeGoals!,
      awayGoals: mapped.awayGoals!,
      reason: settleReason,
      autoSettle: true,
    });
    return true;
  }
}

export async function runSettleWorker(config: SettleWorkerConfig): Promise<SettleWorkerResult> {
  const client = resolveServiceClient();
  let processed = 0;
  let skipped = 0;
  let mismatches = 0;
  let lastError: Error | undefined;

  const scoreVendors = config.vendorChain.filter((c) => c.vendor === THE_ODDS_API_VENDOR);
  if (scoreVendors.length === 0) {
    throw new Error('[sports-settle] scores feed requires THE_ODDS_API_KEY');
  }

  if (config.dualFeed && !config.footballDataApiKey) {
    console.warn(
      '[sports-settle] SPORTS_SETTLE_DUAL_FEED=true but FOOTBALL_DATA_API_KEY missing — primary-only settle',
    );
  }

  const secondaryByLeague = await loadSecondaryScores(config);

  for (let index = 0; index < scoreVendors.length; index += 1) {
    const credential = scoreVendors[index]!;
    const hasFallback = index < scoreVendors.length - 1;

    try {
      for (const league of config.leagues) {
        const { events, requestsRemaining } = await fetchSportScores(credential.apiKey, league, 3);
        if (isVendorQuotaExhausted(THE_ODDS_API_VENDOR, requestsRemaining)) {
          throw new Error(`[the-odds-api] scores quota exhausted (remaining=${requestsRemaining ?? '0'})`);
        }

        const secondaryScores = secondaryByLeague[league] ?? [];
        const dualFeedActive =
          config.dualFeed &&
          config.footballDataApiKey &&
          secondaryScores.length > 0;

        for (const event of events) {
          const mapped = mapScoreEventToStatusPayload(event, league);
          if (mapped.status !== 'finished' || mapped.homeGoals === null || mapped.awayGoals === null) {
            continue;
          }

          const primary: PrimaryFinishedScore = {
            canonicalFixtureId: mapped.canonicalFixtureId,
            leagueCode: league,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            kickoffAt: event.commence_time,
            homeGoals: mapped.homeGoals,
            awayGoals: mapped.awayGoals,
            source: THE_ODDS_API_VENDOR,
          };

          let settleReason = `${THE_ODDS_API_VENDOR}_scores`;

          if (dualFeedActive) {
            const secondaryMatch = findSecondaryFinishedMatch(primary, secondaryScores);
            const decision = decideDualFeedSettle(primary, secondaryMatch, config.dualFeedStrict);
            if (decision.action === 'skip') {
              skipped += 1;
              if (decision.mismatch) {
                mismatches += 1;
                console.warn(
                  `[sports-settle] score_mismatch ${primary.canonicalFixtureId} primary=${primary.homeGoals}-${primary.awayGoals} secondary=${secondaryMatch?.homeGoals ?? '?'}-${secondaryMatch?.awayGoals ?? '?'}`,
                );
              }
              continue;
            }
            settleReason = `dual_feed:${decision.reason}`;
          }

          if (config.dryRun) {
            processed += 1;
            continue;
          }

          const settled = await ingestFinishedScore(
            client,
            event,
            league,
            mapped,
            settleReason,
          );
          if (settled) processed += 1;
        }
      }

      const healthStatus =
        mismatches > 0 ? 'degraded' : skipped > 0 && processed === 0 ? 'degraded' : 'healthy';

      if (!config.dryRun) {
        await recordIngestHealth({
          channel: 'settle',
          leagueCode: '_all',
          vendor: credential.vendor,
          status: healthStatus,
          lastSuccessAt: new Date().toISOString(),
          messagesProcessed: processed,
          metadata: {
            dual_feed: config.dualFeed,
            dual_feed_strict: config.dualFeedStrict,
            skipped,
            mismatches,
            secondary_leagues: Object.keys(secondaryByLeague).filter(
              (code) => (secondaryByLeague[code]?.length ?? 0) > 0,
            ),
          },
        });
      }

      console.info(
        `[sports-settle] processed=${processed} skipped=${skipped} mismatches=${mismatches} dual_feed=${config.dualFeed}`,
      );

      return { processed, skipped, mismatches, vendor: credential.vendor };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (hasFallback) continue;
      throw lastError;
    }
  }

  throw lastError ?? new Error('[sports-settle] all score vendors failed');
}
