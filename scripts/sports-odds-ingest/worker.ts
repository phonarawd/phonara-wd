/// <reference types="node" />
/**
 * Server-only sports odds ingest worker (Wave-S2).
 * Vendors: the-odds-api (REST) · odds-api-io (REST + WS defer).
 * Auto mode: failover across vendors when quota/API errors occur.
 */
import type { IngestMessage } from '@phonara/sportsbook-engine';
import {
  fetchSportOdds,
  fetchOddsApiIoSportOdds,
  fetchSportsGameOddsSportOdds,
  isVendorQuotaExhausted,
  mapTheOddsApiEventToMessages,
  normalizeVendorEventUpsert,
  ODDS_API_IO_VENDOR,
  resolveVendorChain,
  SPORTSGAMEODDS_VENDOR,
  THE_ODDS_API_VENDOR,
  type VendorCredential,
} from '@phonara/sports-ingest';
import { persistIngestMessages } from '../lib/sports-ingest-persist';

export interface IngestWorkerConfig {
  readonly vendorChain: readonly VendorCredential[];
  readonly leagueSlugs?: readonly string[];
  readonly dryRun?: boolean;
  readonly regions?: string;
  readonly bookmakerKey?: string;
  readonly bookmakers?: string;
  readonly markets?: string;
}

export function readIngestEnv(): IngestWorkerConfig {
  const vendorChain = resolveVendorChain({
    vendor: process.env['SPORTS_ODDS_VENDOR'],
    vendorPriority: process.env['SPORTS_ODDS_VENDOR_PRIORITY'],
    theOddsApiKey: process.env['THE_ODDS_API_KEY'],
    oddsApiIoKey: process.env['ODDS_API_IO_KEY'],
    sportsGameOddsKey: process.env['SPORTSGAMEODDS_API_KEY'],
    legacyOddsApiKey: process.env['ODDS_API_KEY'],
  });

  const leagueRaw = process.env['SPORTS_INGEST_LEAGUES'] ?? 'epl,k-league';
  const leagueSlugs = leagueRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    vendorChain,
    leagueSlugs,
    dryRun: process.env['SPORTS_INGEST_DRY_RUN'] !== 'false',
    regions: process.env['SPORTS_ODDS_REGIONS'] ?? 'uk,eu',
    bookmakerKey: process.env['SPORTS_ODDS_BOOKMAKER'] ?? undefined,
    bookmakers: process.env['SPORTS_ODDS_BOOKMAKERS'] ?? undefined,
    markets: process.env['SPORTS_ODDS_MARKETS'] ?? 'h2h,totals',
  };
}

/** Bootstrap sample normalization — used when vendor has no live fetch yet. */
export function bootstrapSampleMessages(vendor: string) {
  const capturedAt = new Date().toISOString();
  const sample = normalizeVendorEventUpsert(
    vendor,
    {
      id: 'bootstrap',
      league: { slug: 'epl' },
      home: 'Sample Home',
      away: 'Sample Away',
      commenceTime: capturedAt,
      status: 'scheduled',
    },
    [
      {
        key: 'match_1x2',
        outcomes: [
          { id: 'home', name: 'Home', price: '2.00' },
          { id: 'draw', name: 'Draw', price: '3.50' },
          { id: 'away', name: 'Away', price: '3.10' },
        ],
      },
    ],
  );

  return { capturedAt, sample };
}

async function runTheOddsApiIngest(
  credential: VendorCredential,
  config: IngestWorkerConfig,
): Promise<{ messages: IngestMessage[]; quotaRemaining?: string }> {
  const capturedAt = new Date().toISOString();
  const allMessages: IngestMessage[] = [];
  let lastQuota: { remaining?: string; used?: string } = {};

  for (const league of config.leagueSlugs ?? []) {
    const { events, requestsRemaining, requestsUsed } = await fetchSportOdds(
      credential.apiKey,
      league,
      {
        regions: config.regions,
        bookmakers: config.bookmakers,
        bookmakerKey: config.bookmakerKey ?? config.bookmakers?.split(',')[0]?.trim(),
        markets: config.markets,
      },
    );

    lastQuota = { remaining: requestsRemaining, used: requestsUsed };

    if (isVendorQuotaExhausted(THE_ODDS_API_VENDOR, requestsRemaining)) {
      throw new Error(`[the-odds-api] monthly quota exhausted (remaining=${requestsRemaining ?? '0'})`);
    }

    for (const event of events) {
      const messages = mapTheOddsApiEventToMessages(
        event,
        league,
        capturedAt,
        config.bookmakerKey ?? config.bookmakers?.split(',')[0]?.trim(),
      );
      allMessages.push(...messages);
    }

    console.info(
      `[sports-odds-ingest] ${credential.vendor}/${league}: ${events.length} events (quota used=${requestsUsed ?? '?'} remaining=${requestsRemaining ?? '?'})`,
    );
  }

  return { messages: allMessages, quotaRemaining: lastQuota.remaining };
}

async function runOddsApiIoIngest(
  credential: VendorCredential,
  config: IngestWorkerConfig,
): Promise<{ messages: IngestMessage[] }> {
  const capturedAt = new Date().toISOString();
  const allMessages: IngestMessage[] = [];
  const bookmakers = process.env['SPORTS_ODDS_IO_BOOKMAKERS'] ?? 'Bet365';

  for (const league of config.leagueSlugs ?? []) {
    const envKey = `SPORTS_ODDS_IO_LEAGUE_${league.toUpperCase().replace(/-/g, '_')}`;
    const leagueSlugOverride = process.env[envKey];

    const { messages, eventCount, rateLimited } = await fetchOddsApiIoSportOdds(
      credential.apiKey,
      league,
      { bookmakers, leagueSlugOverride },
    );

    if (rateLimited) {
      throw new Error('[odds-api-io] rate limit exceeded (429)');
    }

    allMessages.push(...messages);
    console.info(
      `[sports-odds-ingest] ${credential.vendor}/${league}: ${eventCount} events → ${messages.length} C1 messages`,
    );
  }

  if (config.dryRun !== false && allMessages.length === 0) {
    const { sample } = bootstrapSampleMessages(credential.vendor);
    console.info('[sports-odds-ingest] odds-api-io dry-run — no live events; sample shape:');
    console.info(JSON.stringify(sample, null, 2));
    return { messages: [] };
  }

  if (allMessages.length === 0) {
    throw new Error(`[odds-api-io] zero ingest messages at ${capturedAt}`);
  }

  return { messages: allMessages };
}

async function runSportsGameOddsIngest(
  credential: VendorCredential,
  config: IngestWorkerConfig,
): Promise<{ messages: IngestMessage[] }> {
  const allMessages: IngestMessage[] = [];
  const bookmakers = process.env['SPORTS_SGO_BOOKMAKERS'] ?? 'bet365';

  for (const league of config.leagueSlugs ?? []) {
    const envKey = `SPORTS_SGO_LEAGUE_${league.toUpperCase().replace(/-/g, '_')}`;
    const leagueIdOverride = process.env[envKey];

    const { messages, eventCount } = await fetchSportsGameOddsSportOdds(
      credential.apiKey,
      league,
      { bookmakerIds: bookmakers, leagueIdOverride },
    );

    allMessages.push(...messages);
    console.info(
      `[sports-odds-ingest] ${credential.vendor}/${league}: ${eventCount} events → ${messages.length} C1 messages`,
    );
  }

  if (allMessages.length === 0) {
    throw new Error('[sportsgameodds] zero ingest messages');
  }

  return { messages: allMessages };
}

async function runSingleVendorIngest(
  credential: VendorCredential,
  config: IngestWorkerConfig,
): Promise<{ messages: IngestMessage[]; quotaRemaining?: string }> {
  if (credential.vendor === THE_ODDS_API_VENDOR || credential.vendor === 'the-odds-api.com') {
    return runTheOddsApiIngest(credential, config);
  }
  if (credential.vendor === ODDS_API_IO_VENDOR) {
    return runOddsApiIoIngest(credential, config);
  }
  if (credential.vendor === SPORTSGAMEODDS_VENDOR) {
    return runSportsGameOddsIngest(credential, config);
  }
  throw new Error(`[sports-odds-ingest] unsupported vendor "${credential.vendor}"`);
}

function logMessagePreview(messages: readonly IngestMessage[]): void {
  console.info(`[sports-odds-ingest] total C1 messages: ${messages.length}`);
  const preview = messages.slice(0, 5);
  if (preview.length > 0) {
    console.info(JSON.stringify(preview, null, 2));
  }
  if (messages.length > preview.length) {
    console.info(`[sports-odds-ingest] … and ${messages.length - preview.length} more`);
  }
}

export async function runIngestWorker(config: IngestWorkerConfig): Promise<void> {
  const chain = config.vendorChain;
  if (chain.length === 0) {
    throw new Error('[sports-odds-ingest] vendor chain is empty');
  }

  const isAuto = chain.length > 1;
  let lastError: Error | undefined;

  for (let index = 0; index < chain.length; index += 1) {
    const credential = chain[index]!;
    const hasFallback = index < chain.length - 1;

    try {
      if (isAuto) {
        console.info(
          `[sports-odds-ingest] trying vendor=${credential.vendor} (${index + 1}/${chain.length})`,
        );
      }

      const { messages, quotaRemaining } = await runSingleVendorIngest(credential, config);
      logMessagePreview(messages);

      if (config.dryRun !== false) {
        console.info(
          `[sports-odds-ingest] dry-run — PG upsert skipped (vendor=${credential.vendor} quota remaining=${quotaRemaining ?? '?'})`,
        );
        return;
      }

      if (messages.length === 0) {
        throw new Error(`[sports-odds-ingest] vendor ${credential.vendor} returned zero messages`);
      }

      const persisted = await persistIngestMessages(messages);
      console.info(
        `[sports-odds-ingest] persisted ${persisted} messages via vendor=${credential.vendor}`,
      );
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (hasFallback) {
        console.warn(
          `[sports-odds-ingest] vendor ${credential.vendor} failed — failover: ${lastError.message}`,
        );
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error('[sports-odds-ingest] all vendors failed');
}
