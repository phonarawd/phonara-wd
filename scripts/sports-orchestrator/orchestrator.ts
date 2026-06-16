/// <reference types="node" />
/**
 * Wave-S11: 24/7 sports ingest orchestrator — REST poll · WS supervisor · settle · ops alerts.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import {
  computeLagMs,
  evaluateIngestHealthStatus,
  nextWakeDelayMs,
  parseOrchestratorScheduleFromEnv,
  shouldRunScheduledTick,
  staleMsForChannel,
  type OrchestratorScheduleConfig,
} from '@phonara/sports-ingest';
import { loadIngestCursor, ODDS_API_IO_WS_CURSOR } from '../lib/sports-ingest-cursor';
import { loadIngestHealthLag, recordIngestHealth, syncSportsIngestOpsAlerts } from '../lib/sports-ingest-health';
import { readSportsFeatureEnabled } from '../lib/sports-feature-gate';
import { readIngestEnv, runIngestWorker } from '../sports-odds-ingest/worker';
import { readSettleEnv, runSettleWorker } from '../sports-settle/worker';

export interface OrchestratorConfig extends OrchestratorScheduleConfig {
  readonly dryRun: boolean;
  readonly repoRoot: string;
}

export function readOrchestratorEnv(): OrchestratorConfig {
  const schedule = parseOrchestratorScheduleFromEnv(process.env as Record<string, string | undefined>);
  return {
    ...schedule,
    dryRun: process.env['SPORTS_INGEST_DRY_RUN'] !== 'false',
    repoRoot: process.cwd(),
  };
}

type TickState = {
  lastRunAtMs: number | null;
  lastSuccessAtMs: number | null;
};

export class SportsIngestOrchestrator {
  private wsChild: ChildProcess | null = null;
  private wsRestartAttempts = 0;
  private lastAlertSyncMs = 0;
  private stopped = false;

  private readonly ticks: Record<'rest' | 'ws' | 'settle' | 'orchestrator', TickState> = {
    rest: { lastRunAtMs: null, lastSuccessAtMs: null },
    ws: { lastRunAtMs: null, lastSuccessAtMs: null },
    settle: { lastRunAtMs: null, lastSuccessAtMs: null },
    orchestrator: { lastRunAtMs: Date.now(), lastSuccessAtMs: Date.now() },
  };

  constructor(private readonly config: OrchestratorConfig) {}

  async start(): Promise<void> {
    console.info('[sports-orchestrator] starting 24/7 supervisor');
    await this.recordOrchestratorHeartbeat('healthy');

    if (this.config.wsEnabled) {
      this.spawnWsChild();
    } else {
      console.info('[sports-orchestrator] WS disabled (no ODDS_API_IO_KEY or SPORTS_ORCHESTRATOR_WS=false)');
    }

    while (!this.stopped) {
      const nowMs = Date.now();
      await this.runDueTicks(nowMs);
      await this.monitorWsHealth(nowMs);

      if (shouldRunScheduledTick(this.lastAlertSyncMs, this.config.alertSyncIntervalMs, nowMs)) {
        await this.syncOpsAlerts();
        this.lastAlertSyncMs = nowMs;
      }

      const delay = nextWakeDelayMs(this.ticks, this.config, nowMs);
      await new Promise((resolve) => setTimeout(resolve, Math.max(delay, 1_000)));
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.wsChild && !this.wsChild.killed) {
      this.wsChild.kill('SIGTERM');
    }
    this.wsChild = null;
  }

  private async runDueTicks(nowMs: number): Promise<void> {
    if (shouldRunScheduledTick(this.ticks.rest.lastRunAtMs, this.config.restIntervalMs, nowMs)) {
      await this.runRestTick(nowMs);
    }
    if (shouldRunScheduledTick(this.ticks.settle.lastRunAtMs, this.config.settleIntervalMs, nowMs)) {
      await this.runSettleTick(nowMs);
    }
  }

  private async runRestTick(nowMs: number): Promise<void> {
    this.ticks.rest.lastRunAtMs = nowMs;
    const staleMs = staleMsForChannel('rest', this.config);

    try {
      const sportsEnabled = await readSportsFeatureEnabled();
      if (!sportsEnabled && process.env['SPORTS_ORCHESTRATOR_RESPECT_KILL'] === 'true') {
        await recordIngestHealth({
          channel: 'rest',
          leagueCode: '_all',
          status: 'disabled',
          metadata: { feature_sports_enabled: false },
        });
        return;
      }

      const ingestConfig = readIngestEnv();
      await runIngestWorker({ ...ingestConfig, dryRun: this.config.dryRun });

      this.ticks.rest.lastSuccessAtMs = nowMs;
      await recordIngestHealth({
        channel: 'rest',
        leagueCode: '_all',
        status: 'healthy',
        lastSuccessAt: new Date(nowMs).toISOString(),
        lagMs: 0,
        messagesProcessed: 1,
        metadata: { dryRun: this.config.dryRun },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lagMs = computeLagMs(this.ticks.rest.lastSuccessAtMs, nowMs);
      await recordIngestHealth({
        channel: 'rest',
        leagueCode: '_all',
        status: evaluateIngestHealthStatus({
          lagMs,
          staleMs,
          errored: true,
          disabled: false,
        }),
        lastErrorAt: new Date(nowMs).toISOString(),
        lastError: message.slice(0, 500),
        lagMs: lagMs ?? undefined,
      });
      console.error(`[sports-orchestrator] rest tick failed: ${message}`);
    }
  }

  private async runSettleTick(nowMs: number): Promise<void> {
    this.ticks.settle.lastRunAtMs = nowMs;
    const staleMs = staleMsForChannel('settle', this.config);

    try {
      const settleConfig = readSettleEnv();
      const result = await runSettleWorker({
        ...settleConfig,
        dryRun: this.config.dryRun || settleConfig.dryRun,
      });

      this.ticks.settle.lastSuccessAtMs = nowMs;
      await recordIngestHealth({
        channel: 'settle',
        leagueCode: '_all',
        status: 'healthy',
        lastSuccessAt: new Date(nowMs).toISOString(),
        lagMs: 0,
        messagesProcessed: result.processed,
        vendor: result.vendor,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lagMs = computeLagMs(this.ticks.settle.lastSuccessAtMs, nowMs);
      await recordIngestHealth({
        channel: 'settle',
        leagueCode: '_all',
        status: evaluateIngestHealthStatus({
          lagMs,
          staleMs,
          errored: true,
          disabled: false,
        }),
        lastErrorAt: new Date(nowMs).toISOString(),
        lastError: message.slice(0, 500),
        lagMs: lagMs ?? undefined,
      });
      console.error(`[sports-orchestrator] settle tick failed: ${message}`);
    }
  }

  private spawnWsChild(): void {
    if (this.wsChild && !this.wsChild.killed) return;

    const script = join(this.config.repoRoot, 'scripts', 'sports-odds-ingest', 'ws-run.ts');
    console.info('[sports-orchestrator] spawning WS child');

    this.wsChild = spawn(process.execPath, ['--import', 'tsx', script], {
      cwd: this.config.repoRoot,
      env: process.env,
      stdio: 'inherit',
      shell: false,
    });

    this.wsChild.on('exit', (code, signal) => {
      console.warn(`[sports-orchestrator] WS child exited code=${code ?? 'null'} signal=${signal ?? 'null'}`);
      this.wsChild = null;
      if (!this.stopped) {
        this.wsRestartAttempts += 1;
        const delay = Math.min(1000 * 2 ** Math.min(this.wsRestartAttempts, 5), 60_000);
        setTimeout(() => this.spawnWsChild(), delay);
      }
    });
  }

  private async monitorWsHealth(nowMs: number): Promise<void> {
    if (!this.config.wsEnabled) return;

    const staleMs = staleMsForChannel('ws', this.config);
    let lastSuccessAtMs = this.ticks.ws.lastSuccessAtMs;

    try {
      const cursor = await loadIngestCursor(
        ODDS_API_IO_WS_CURSOR.vendor,
        ODDS_API_IO_WS_CURSOR.leagueCode,
      );
      if (cursor?.last_success) {
        lastSuccessAtMs = Date.parse(cursor.last_success);
        this.ticks.ws.lastSuccessAtMs = lastSuccessAtMs;
      }
    } catch {
      /* cursor optional during dry-run */
    }

    const health = await loadIngestHealthLag('ws').catch(() => null);
    if (health?.lastSuccessAt) {
      lastSuccessAtMs = Date.parse(health.lastSuccessAt);
      this.ticks.ws.lastSuccessAtMs = lastSuccessAtMs;
    }

    const lagMs = computeLagMs(lastSuccessAtMs, nowMs);
    const childDead = !this.wsChild || this.wsChild.killed;
    const status = evaluateIngestHealthStatus({
      lagMs,
      staleMs,
      errored: childDead,
      disabled: false,
    });

    if (status === 'stale' || status === 'error') {
      console.warn(`[sports-orchestrator] WS ${status} lag=${lagMs ?? 'unknown'}ms — restarting child`);
      if (this.wsChild && !this.wsChild.killed) {
        this.wsChild.kill('SIGTERM');
      }
      this.spawnWsChild();
    }

    await recordIngestHealth({
      channel: 'ws',
      leagueCode: '_all',
      status,
      lastSuccessAt: lastSuccessAtMs ? new Date(lastSuccessAtMs).toISOString() : undefined,
      lagMs: lagMs ?? undefined,
      metadata: { childAlive: !childDead },
    });
  }

  private async syncOpsAlerts(): Promise<void> {
    try {
      const result = await syncSportsIngestOpsAlerts({
        restStaleMs: this.config.restStaleMs,
        wsStaleMs: this.config.wsStaleMs,
        settleStaleMs: this.config.settleStaleMs,
      });
      if (result.opened > 0 || result.resolved > 0) {
        console.info(`[sports-orchestrator] ops alerts opened=${result.opened} resolved=${result.resolved}`);
      }
    } catch (error) {
      console.error(
        `[sports-orchestrator] ops alert sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async recordOrchestratorHeartbeat(status: 'healthy' | 'degraded' | 'error'): Promise<void> {
    await recordIngestHealth({
      channel: 'orchestrator',
      leagueCode: '_all',
      status,
      lastSuccessAt: new Date().toISOString(),
      metadata: {
        restIntervalMs: this.config.restIntervalMs,
        settleIntervalMs: this.config.settleIntervalMs,
        wsEnabled: this.config.wsEnabled,
      },
    }).catch((error) => {
      console.error(
        `[sports-orchestrator] heartbeat failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }
}

export async function runSportsOrchestrator(config: OrchestratorConfig): Promise<void> {
  const orchestrator = new SportsIngestOrchestrator(config);

  const shutdown = (): void => {
    console.info('[sports-orchestrator] shutdown signal');
    orchestrator.stop();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await orchestrator.start();
}
