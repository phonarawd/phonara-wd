export type IngestChannel = 'rest' | 'ws' | 'settle' | 'orchestrator';

export type IngestHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'stale'
  | 'error'
  | 'disabled'
  | 'skipped';

export interface IngestHealthRecord {
  readonly channel: IngestChannel;
  readonly leagueCode: string;
  readonly vendor?: string;
  readonly status: IngestHealthStatus;
  readonly lastSuccessAt?: string;
  readonly lastErrorAt?: string;
  readonly lastError?: string;
  readonly lagMs?: number;
  readonly messagesProcessed?: number;
  readonly metadata?: Record<string, unknown>;
}
