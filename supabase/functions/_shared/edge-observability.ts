/**
 * Edge structured logging, HTTP error redaction, and provider-health helpers.
 * Secrets, tokens, PII, and raw provider payloads must never appear in logs or responses.
 */
import { CORS_HEADERS } from './cors.ts';

export const REQUEST_ID_HEADER = 'x-request-id';
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]{8,128}$/;

export type DurationBucket = 'lt_100ms' | 'lt_500ms' | 'lt_1s' | 'gte_1s';
export type ProviderHealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'missing_config';

// SA-05 — every edge JSON response declares explicit CORS instead of relying
// on the gateway default, so direct-from-browser functions (siwe-auth,
// product-analytics) work under a locked-down/custom-domain gateway too.
const jsonHeaders = { 'content-type': 'application/json', ...CORS_HEADERS };

const SENSITIVE_KEY_RE =
  /(?:password|secret|token|authorization|bearer|api[_-]?key|private[_-]?key|signature|jwt|refresh|credential|email|phone|address|wallet|iban|account|ssn|payload)$/i;

const BEARER_RE = /^Bearer\s+.+/i;
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function resolveRequestId(req: Request): string {
  const incoming = req.headers.get(REQUEST_ID_HEADER)?.trim();
  if (incoming && REQUEST_ID_PATTERN.test(incoming)) return incoming;
  return crypto.randomUUID();
}

export function durationBucket(ms: number): DurationBucket {
  if (ms < 100) return 'lt_100ms';
  if (ms < 500) return 'lt_500ms';
  if (ms < 1000) return 'lt_1s';
  return 'gte_1s';
}

export function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[redacted:depth]';
  if (value == null) return value;
  if (typeof value === 'string') {
    if (BEARER_RE.test(value) || JWT_RE.test(value)) return '[redacted:token]';
    if (value.length > 256) return `[redacted:string:${value.length}]`;
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactForLog(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_RE.test(key)) {
        out[key] = '[redacted]';
        continue;
      }
      out[key] = redactForLog(nested, depth + 1);
    }
    return out;
  }
  return '[redacted:unknown]';
}

const STABLE_ERROR_CODES = new Set([
  'unauthorized',
  'service_role_required',
  'method_not_allowed',
  'invalid_json',
  'invalid_body',
  'replay_body_mismatch',
  'duplicate',
  'rpc_failed',
  'source_query_failed',
  'internal_error',
  'unknown_error',
  'missing_env',
  'provider_health_rpc_failed',
  'edge_ops_event_rpc_failed',
  'web_push_not_configured',
  'email_not_configured',
  'withdrawal_not_found',
  'invalid_withdrawal_id',
  'invalid_withdrawal_status',
  'unsupported_currency',
  'invalid_chain',
  'signing_not_configured',
  'custody_xpub_not_configured',
  'unauthenticated',
  'missing_hot_wallet_or_sign_endpoint',
]);

export function toStableErrorCode(raw: unknown, fallback = 'internal_error'): string {
  if (typeof raw === 'string' && STABLE_ERROR_CODES.has(raw)) return raw;
  if (raw instanceof Error) {
    const msg = raw.message;
    if (STABLE_ERROR_CODES.has(msg)) return msg;
    if (msg.startsWith('missing_env:')) return 'missing_env';
    if (msg.startsWith('http_')) return msg;
    if (msg.startsWith('trongrid_') || msg.startsWith('etherscan_') || msg.startsWith('upbit_')) {
      return msg;
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as { code?: string; error?: string; message?: string };
    if (obj.code && STABLE_ERROR_CODES.has(obj.code)) return obj.code;
    if (obj.error && STABLE_ERROR_CODES.has(obj.error)) return obj.error;
    if (obj.message && STABLE_ERROR_CODES.has(obj.message)) return obj.message;
  }
  return fallback;
}

export function mapSupabaseError(error: { message?: string; code?: string }): string {
  const code = error.code?.toLowerCase() ?? '';
  if (code === '23505') return 'duplicate';
  if (code.startsWith('pgrst')) return 'rpc_failed';
  return toStableErrorCode(error.message, 'rpc_failed');
}

export interface EdgeLogEvent {
  level: 'info' | 'warn' | 'error';
  event: string;
  request_id: string;
  function: string;
  duration_ms?: number;
  duration_bucket?: DurationBucket;
  batch_count?: number;
  skipped_count?: number;
  error_code?: string;
  [key: string]: unknown;
}

export function emitStructuredLog(event: EdgeLogEvent): void {
  console.log(JSON.stringify(redactForLog(event)));
}

export interface EdgeContext {
  readonly requestId: string;
  readonly functionName: string;
  readonly startedAt: number;
  log(eventKey: string, fields?: Record<string, unknown>): void;
  logError(eventKey: string, errorCode: string, fields?: Record<string, unknown>): void;
  jsonOk(body: Record<string, unknown>, status?: number): Response;
  jsonErr(errorCode: string, status?: number, opts?: { internal?: unknown }): Response;
  elapsedMs(): number;
  elapsedBucket(): DurationBucket;
}

export function createEdgeContext(functionName: string, req: Request): EdgeContext {
  const requestId = resolveRequestId(req);
  const startedAt = Date.now();

  const baseFields = (): Pick<
    EdgeLogEvent,
    'request_id' | 'function' | 'duration_ms' | 'duration_bucket'
  > => ({
    request_id: requestId,
    function: functionName,
    duration_ms: Date.now() - startedAt,
    duration_bucket: durationBucket(Date.now() - startedAt),
  });

  return {
    requestId,
    functionName,
    startedAt,
    log(eventKey, fields = {}) {
      emitStructuredLog({
        level: 'info',
        event: eventKey,
        ...baseFields(),
        ...fields,
      });
    },
    logError(eventKey, errorCode, fields = {}) {
      emitStructuredLog({
        level: 'error',
        event: eventKey,
        error_code: errorCode,
        ...baseFields(),
        ...fields,
      });
    },
    jsonOk(body, status = 200) {
      return new Response(JSON.stringify({ ...body, request_id: requestId }), {
        status,
        headers: jsonHeaders,
      });
    },
    jsonErr(errorCode, status = 500, opts) {
      if (opts?.internal !== undefined) {
        this.logError(`ops.edge.${functionName.replace(/-/g, '_')}.error`, errorCode, {
          internal: redactForLog(opts.internal),
        });
      }
      return new Response(JSON.stringify({ ok: false, error: errorCode, request_id: requestId }), {
        status,
        headers: jsonHeaders,
      });
    },
    elapsedMs() {
      return Date.now() - startedAt;
    },
    elapsedBucket() {
      return durationBucket(Date.now() - startedAt);
    },
  };
}

type SupabaseRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message?: string; code?: string } | null }>;
};

export async function recordProviderHealth(
  supabase: SupabaseRpcClient,
  ctx: EdgeContext,
  params: {
    provider: string;
    domain: string;
    channel?: string;
    status: ProviderHealthStatus;
    errorCode?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.rpc('rpc_service_upsert_provider_health', {
    p_provider: params.provider,
    p_domain: params.domain,
    p_channel: params.channel ?? '',
    p_status: params.status,
    p_error_code: params.errorCode ?? null,
    p_request_id: ctx.requestId,
    p_metadata: redactForLog(params.metadata ?? {}) as Record<string, unknown>,
  });
  if (error) {
    ctx.logError('ops.edge.provider_health.record_failed', 'provider_health_rpc_failed', {
      provider: params.provider,
      domain: params.domain,
      rpc_error_code: mapSupabaseError(error),
    });
  }
}

type SupabaseDataRpcClient = SupabaseRpcClient & {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>;
};

export interface CircuitBreakerGate {
  allowed: boolean;
  state: string;
  reason?: string;
}

export async function assessCircuitBreaker(
  supabase: SupabaseDataRpcClient,
  provider: string,
  domain: string,
  channel = '',
): Promise<CircuitBreakerGate> {
  const { data, error } = await supabase.rpc('rpc_service_assess_circuit_breaker', {
    p_provider: provider,
    p_domain: domain,
    p_channel: channel,
  });
  if (error) {
    return { allowed: true, state: 'closed', reason: 'assess_rpc_failed' };
  }
  const gate = (data ?? {}) as Record<string, unknown>;
  return {
    allowed: gate['allowed'] === true,
    state: String(gate['state'] ?? 'closed'),
    reason: gate['reason'] != null ? String(gate['reason']) : undefined,
  };
}

export async function recordCircuitBreakerOutcome(
  supabase: SupabaseDataRpcClient,
  ctx: EdgeContext,
  params: {
    provider: string;
    domain: string;
    channel?: string;
    success: boolean;
    errorCode?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.rpc('rpc_service_record_circuit_breaker_outcome', {
    p_provider: params.provider,
    p_domain: params.domain,
    p_channel: params.channel ?? '',
    p_success: params.success,
    p_error_code: params.errorCode ?? null,
    p_request_id: ctx.requestId,
  });
  if (error) {
    ctx.logError('ops.edge.circuit_breaker.record_failed', 'circuit_breaker_rpc_failed', {
      provider: params.provider,
      domain: params.domain,
      rpc_error_code: mapSupabaseError(error),
    });
  }
}

/** Provider/job outcome — HTTP 2xx must not be treated as success (H-04 / ADR-021). */
export type EdgeOpsOutcomeStatus =
  | 'ok'
  | 'error'
  | 'partial'
  | 'circuit_open'
  | 'rpc_failed'
  | 'rejected'
  | 'missing_config';

export interface EdgeOpsOutcomeCounts {
  applied: number;
  rejected: number;
  circuitOpen: number;
  rpcFailed: number;
  total: number;
  missingConfig?: number;
}

/**
 * Classify price-feed / watcher batch outcomes. `ok` only when every item applied
 * with zero rejects/circuit/RPC failures — never false-green on partial success.
 */
export function classifyEdgeOpsOutcome(counts: EdgeOpsOutcomeCounts): {
  status: EdgeOpsOutcomeStatus;
  errorCode: string | null;
} {
  const missing = counts.missingConfig ?? 0;
  if (counts.total <= 0 && missing > 0) {
    return { status: 'missing_config', errorCode: 'missing_config' };
  }
  if (counts.total <= 0) {
    return { status: 'error', errorCode: 'no_sources' };
  }

  const allApplied =
    counts.applied === counts.total &&
    counts.rejected === 0 &&
    counts.circuitOpen === 0 &&
    counts.rpcFailed === 0 &&
    missing === 0;

  if (allApplied) {
    return { status: 'ok', errorCode: null };
  }

  if (counts.applied === 0) {
    if (missing > 0 && counts.circuitOpen === 0 && counts.rpcFailed === 0) {
      return { status: 'missing_config', errorCode: 'missing_config' };
    }
    if (counts.circuitOpen === counts.total) {
      return { status: 'circuit_open', errorCode: 'circuit_open' };
    }
    if (counts.rpcFailed > 0 && counts.rejected === 0 && counts.circuitOpen === 0) {
      return { status: 'rpc_failed', errorCode: 'rpc_failed' };
    }
    if (counts.rejected === counts.total) {
      return { status: 'rejected', errorCode: 'all_rejected' };
    }
    return { status: 'error', errorCode: 'all_sources_failed' };
  }

  return { status: 'partial', errorCode: 'partial_apply' };
}

export async function recordEdgeOpsEvent(
  supabase: SupabaseRpcClient,
  ctx: EdgeContext,
  params: {
    eventKey: string;
    status: EdgeOpsOutcomeStatus;
    batchCount?: number;
    skippedCount?: number;
    errorCode?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.rpc('rpc_service_record_edge_ops_event', {
    p_request_id: ctx.requestId,
    p_function_name: ctx.functionName,
    p_event_key: params.eventKey,
    p_status: params.status,
    p_duration_ms: ctx.elapsedMs(),
    p_duration_bucket: ctx.elapsedBucket(),
    p_batch_count: params.batchCount ?? null,
    p_skipped_count: params.skippedCount ?? null,
    p_error_code: params.errorCode ?? null,
    p_metadata: redactForLog(params.metadata ?? {}) as Record<string, unknown>,
  });
  if (error) {
    ctx.logError('ops.edge.ops_event.record_failed', 'edge_ops_event_rpc_failed', {
      event_key: params.eventKey,
      rpc_error_code: mapSupabaseError(error),
    });
  }
}
