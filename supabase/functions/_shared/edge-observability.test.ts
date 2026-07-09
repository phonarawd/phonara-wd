import {
  durationBucket,
  redactForLog,
  resolveRequestId,
  toStableErrorCode,
} from './edge-observability.ts';

Deno.test('resolveRequestId accepts valid header', () => {
  const req = new Request('https://example.test', {
    headers: { 'x-request-id': 'req-test-12345678' },
  });
  const id = resolveRequestId(req);
  if (id !== 'req-test-12345678') throw new Error(`unexpected id ${id}`);
});

Deno.test('resolveRequestId generates uuid when missing', () => {
  const req = new Request('https://example.test');
  const id = resolveRequestId(req);
  if (id.length < 8) throw new Error('generated request id too short');
});

Deno.test('durationBucket boundaries', () => {
  if (durationBucket(50) !== 'lt_100ms') throw new Error('lt_100ms');
  if (durationBucket(250) !== 'lt_500ms') throw new Error('lt_500ms');
  if (durationBucket(900) !== 'lt_1s') throw new Error('lt_1s');
  if (durationBucket(1500) !== 'gte_1s') throw new Error('gte_1s');
});

Deno.test('redactForLog strips secrets', () => {
  const redacted = redactForLog({
    request_id: 'abc',
    authorization: 'Bearer secret-token',
    nested: { api_key: 'k', ok: true },
  }) as Record<string, unknown>;
  if (redacted['authorization'] !== '[redacted]') throw new Error('authorization not redacted');
  const nested = redacted['nested'] as Record<string, unknown>;
  if (nested['api_key'] !== '[redacted]') throw new Error('api_key not redacted');
  if (nested['ok'] !== true) throw new Error('non-sensitive field changed');
});

Deno.test('toStableErrorCode maps known codes only', () => {
  if (toStableErrorCode('unauthorized') !== 'unauthorized') throw new Error('unauthorized');
  if (toStableErrorCode(new Error('missing_env:FOO')) !== 'missing_env') {
    throw new Error('missing_env');
  }
  if (toStableErrorCode('raw postgres message') !== 'internal_error') {
    throw new Error('internal fallback');
  }
});
