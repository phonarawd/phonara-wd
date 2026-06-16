/// <reference types="node" />
/**
 * Wave-S10: Odds-API.io WebSocket live ingest worker.
 * REST bootstrap → WS stream → C1 persist · lastSeq cursor · stall reconnect.
 */
import type { IngestMessage } from '@phonara/sportsbook-engine';
import {
  buildOddsApiIoWsUrl,
  extractWsSeq,
  fetchOddsApiIoSportOdds,
  isWsResyncRequired,
  mapOddsApiIoWsOddsMessage,
  mapOddsApiIoWsScoreMessage,
  mapOddsApiIoWsStatusMessage,
  resolveIoLeagueSlugs,
  type OddsApiIoWsOddsMessage,
  type OddsApiIoWsScoreMessage,
  type OddsApiIoWsStatusMessage,
  type OddsApiIoWsEventMeta,
  WS_CURSOR_LEAGUE_CODE,
  WsStallDetector,
} from '@phonara/sports-ingest';
import { ingestFixtureStatus, resolveServiceClient } from '../lib/sports-engine-client';
import {
  loadIngestCursor,
  ODDS_API_IO_WS_CURSOR,
  saveIngestCursor,
} from '../lib/sports-ingest-cursor';
import { persistIngestMessages } from '../lib/sports-ingest-persist';

export interface WsIngestWorkerConfig {
  readonly apiKey: string;
  readonly leagueSlugs: readonly string[];
  readonly dryRun: boolean;
  readonly bookmakers: string;
  readonly markets: string;
  readonly channels: string;
  readonly wsStatus?: 'live' | 'prematch';
  readonly stallMs: number;
  readonly flushBatchSize: number;
  readonly flushIntervalMs: number;
  readonly maxReconnectAttempts: number;
}

export function readWsIngestEnv(): WsIngestWorkerConfig {
  const apiKey = process.env['ODDS_API_IO_KEY']?.trim();
  if (!apiKey) {
    throw new Error(
      '[sports-ingest-ws] ODDS_API_IO_KEY required for WebSocket ingest (server-only, never VITE_*)',
    );
  }

  const leagueRaw = process.env['SPORTS_INGEST_LEAGUES'] ?? 'epl,k-league';
  const leagueSlugs = leagueRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const statusRaw = process.env['SPORTS_WS_STATUS']?.trim().toLowerCase();
  const wsStatus =
    statusRaw === 'live' || statusRaw === 'prematch' ? statusRaw : undefined;

  return {
    apiKey,
    leagueSlugs,
    dryRun: process.env['SPORTS_INGEST_DRY_RUN'] !== 'false',
    bookmakers: process.env['SPORTS_ODDS_IO_BOOKMAKERS'] ?? 'Bet365',
    markets: process.env['SPORTS_WS_MARKETS'] ?? 'ML,Totals',
    channels: process.env['SPORTS_WS_CHANNELS'] ?? 'odds,scores,status',
    wsStatus,
    stallMs: Number(process.env['SPORTS_WS_STALL_MS'] ?? '120000'),
    flushBatchSize: Number(process.env['SPORTS_WS_FLUSH_BATCH'] ?? '40'),
    flushIntervalMs: Number(process.env['SPORTS_WS_FLUSH_MS'] ?? '500'),
    maxReconnectAttempts: Number(process.env['SPORTS_WS_MAX_RECONNECT'] ?? '0'),
  };
}

type EventMetaCache = Map<string, OddsApiIoWsEventMeta>;

function cacheKey(eventId: string | number): string {
  return String(eventId);
}

export class OddsApiIoWsIngestWorker {
  private ws: WebSocket | null = null;
  private lastSeq = 0;
  private reconnectAttempts = 0;
  private stopped = false;
  private pendingMessages: IngestMessage[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private stallTimer: ReturnType<typeof setInterval> | null = null;
  private readonly eventMeta: EventMetaCache = new Map();
  private readonly stallDetector: WsStallDetector;

  constructor(private readonly config: WsIngestWorkerConfig) {
    this.stallDetector = new WsStallDetector({ stallMs: config.stallMs });
  }

  async start(): Promise<void> {
    await this.bootstrapRest();
    const cursor = await loadIngestCursor(
      ODDS_API_IO_WS_CURSOR.vendor,
      WS_CURSOR_LEAGUE_CODE,
    );
    if (cursor?.last_seq) {
      const parsed = Number(cursor.last_seq);
      if (Number.isFinite(parsed) && parsed > 0) {
        this.lastSeq = parsed;
        console.info(`[sports-ingest-ws] resume lastSeq=${this.lastSeq}`);
      }
    }

    this.startFlushLoop();
    this.startStallWatch();
    await this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.flushTimer) clearInterval(this.flushTimer);
    if (this.stallTimer) clearInterval(this.stallTimer);
    this.ws?.close();
    this.ws = null;
  }

  private startFlushLoop(): void {
    this.flushTimer = setInterval(() => {
      void this.flushPending();
    }, this.config.flushIntervalMs);
  }

  private startStallWatch(): void {
    this.stallTimer = setInterval(() => {
      if (this.stopped || !this.stallDetector.isStalled()) return;
      console.warn(
        `[sports-ingest-ws] stall detected (${this.stallDetector.elapsedMs()}ms) — reconnecting`,
      );
      this.forceReconnect();
    }, Math.min(this.config.stallMs / 2, 30_000));
  }

  private async bootstrapRest(): Promise<void> {
    console.info('[sports-ingest-ws] REST bootstrap…');
    for (const league of this.config.leagueSlugs) {
      const envKey = `SPORTS_ODDS_IO_LEAGUE_${league.toUpperCase().replace(/-/g, '_')}`;
      const leagueSlugOverride = process.env[envKey];

      const { messages, eventCount } = await fetchOddsApiIoSportOdds(
        this.config.apiKey,
        league,
        {
          bookmakers: this.config.bookmakers,
          leagueSlugOverride,
        },
      );

      for (const msg of messages) {
        if (msg.type === 'event_upsert') {
          const id = msg.fixture.fixtureId.split(':')[1];
          if (id) {
            this.eventMeta.set(cacheKey(id), {
              home: msg.fixture.homeName,
              away: msg.fixture.awayName,
              date: msg.fixture.kickoffAt,
              status: msg.fixture.status,
              leagueCode: msg.fixture.leagueCode,
            });
          }
        }
      }

      if (!this.config.dryRun && messages.length > 0) {
        await persistIngestMessages(messages);
      }

      console.info(
        `[sports-ingest-ws] bootstrap ${league}: ${eventCount} events → ${messages.length} C1 messages`,
      );
    }
  }

  private buildUrl(): string {
    const ioLeagues = resolveIoLeagueSlugs(this.config.leagueSlugs);
    return buildOddsApiIoWsUrl({
      apiKey: this.config.apiKey,
      ioLeagueSlugs: ioLeagues,
      markets: this.config.markets,
      channels: this.config.channels,
      status: this.config.wsStatus,
      lastSeq: this.lastSeq > 0 ? this.lastSeq : undefined,
    });
  }

  private async connect(): Promise<void> {
    if (this.stopped) return;

    const url = this.buildUrl();
    console.info(`[sports-ingest-ws] connecting… leagues=${this.config.leagueSlugs.join(',')}`);

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.addEventListener('open', () => {
        this.reconnectAttempts = 0;
        this.stallDetector.touch();
        console.info('[sports-ingest-ws] connected');
        resolve();
      });

      ws.addEventListener('message', (event) => {
        void this.handleRawMessage(String(event.data));
      });

      ws.addEventListener('error', (event) => {
        console.error('[sports-ingest-ws] socket error', event);
        reject(new Error('[sports-ingest-ws] WebSocket error'));
      });

      ws.addEventListener('close', () => {
        if (!this.stopped) {
          console.warn('[sports-ingest-ws] disconnected — scheduling reconnect');
          void this.scheduleReconnect();
        }
      });
    });
  }

  private async scheduleReconnect(): Promise<void> {
    if (this.stopped) return;

    this.reconnectAttempts += 1;
    if (
      this.config.maxReconnectAttempts > 0 &&
      this.reconnectAttempts > this.config.maxReconnectAttempts
    ) {
      console.error('[sports-ingest-ws] max reconnect attempts reached — exiting');
      this.stop();
      process.exitCode = 1;
      return;
    }

    const delay = Math.min(1000 * 2 ** Math.min(this.reconnectAttempts, 5), 30_000);
    console.info(`[sports-ingest-ws] reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    await new Promise((r) => setTimeout(r, delay));
    await this.connect();
  }

  private forceReconnect(): void {
    this.ws?.close();
  }

  private async handleResync(reason: string): Promise<void> {
    console.warn(`[sports-ingest-ws] resync_required: ${reason} — REST rebuild`);
    this.lastSeq = 0;
    await this.bootstrapRest();
    this.forceReconnect();
  }

  private async handleRawMessage(raw: string): Promise<void> {
    this.stallDetector.touch();

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      console.warn('[sports-ingest-ws] invalid JSON frame');
      return;
    }

    const type = String(data['type'] ?? '');

    if (type === 'welcome') {
      console.info('[sports-ingest-ws] welcome', JSON.stringify(data));
      return;
    }

    if (isWsResyncRequired(data as OddsApiIoWsOddsMessage)) {
      await this.handleResync(String(data['reason'] ?? 'unknown'));
      return;
    }

    const seq = extractWsSeq(data as OddsApiIoWsOddsMessage);
    if (seq !== undefined && seq > this.lastSeq) {
      this.lastSeq = seq;
      if (this.lastSeq % 50 === 0) {
        await saveIngestCursor(
          ODDS_API_IO_WS_CURSOR.vendor,
          WS_CURSOR_LEAGUE_CODE,
          this.lastSeq,
        );
      }
    }

    const capturedAt = new Date().toISOString();

    if (type === 'score') {
      const payload = mapOddsApiIoWsScoreMessage(data as OddsApiIoWsScoreMessage);
      await this.applyFixtureStatus(payload);
      return;
    }

    if (type === 'status') {
      const payload = mapOddsApiIoWsStatusMessage(data as OddsApiIoWsStatusMessage);
      if (payload) await this.applyFixtureStatus(payload);
      return;
    }

    if (type === 'created' || type === 'updated' || type === 'deleted' || type === 'no_markets') {
      const oddsMsg = data as OddsApiIoWsOddsMessage;
      if (oddsMsg.id === undefined) return;

      const meta =
        this.eventMeta.get(cacheKey(oddsMsg.id)) ??
        ({
          leagueCode: this.config.leagueSlugs[0] ?? 'unknown',
        } satisfies OddsApiIoWsEventMeta);

      const messages = mapOddsApiIoWsOddsMessage(oddsMsg, meta, capturedAt);
      if (messages.length > 0) {
        this.pendingMessages.push(...messages);
        if (this.pendingMessages.length >= this.config.flushBatchSize) {
          await this.flushPending();
        }
      }
    }
  }

  private async applyFixtureStatus(payload: {
    canonicalFixtureId: string;
    status: string;
    homeGoals: number | null;
    awayGoals: number | null;
    reason: string;
    autoSettle: boolean;
  }): Promise<void> {
    if (this.config.dryRun) {
      console.info('[sports-ingest-ws] dry-run status', JSON.stringify(payload));
      return;
    }

    try {
      const client = resolveServiceClient();
      await ingestFixtureStatus(client, {
        canonicalFixtureId: payload.canonicalFixtureId,
        status: payload.status,
        homeGoals: payload.homeGoals,
        awayGoals: payload.awayGoals,
        reason: payload.reason,
        autoSettle: payload.autoSettle,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('fixture_not_found')) return;
      console.error(`[sports-ingest-ws] status ingest failed: ${message}`);
    }
  }

  private async flushPending(): Promise<void> {
    if (this.pendingMessages.length === 0) return;

    const batch = this.pendingMessages.splice(0, this.pendingMessages.length);

    if (this.config.dryRun) {
      console.info(`[sports-ingest-ws] dry-run flush ${batch.length} messages`);
      return;
    }

    try {
      const count = await persistIngestMessages(batch);
      console.info(`[sports-ingest-ws] persisted ${count} messages (lastSeq=${this.lastSeq})`);
      await saveIngestCursor(
        ODDS_API_IO_WS_CURSOR.vendor,
        WS_CURSOR_LEAGUE_CODE,
        this.lastSeq,
      );
    } catch (error) {
      console.error(
        `[sports-ingest-ws] persist failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.pendingMessages.unshift(...batch);
    }
  }
}

export async function runWsIngestWorker(config: WsIngestWorkerConfig): Promise<void> {
  const worker = new OddsApiIoWsIngestWorker(config);

  const shutdown = (): void => {
    console.info('[sports-ingest-ws] shutting down…');
    worker.stop();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await worker.start();

  // Keep process alive
  await new Promise<void>(() => {
    /* long-running until signal */
  });
}
