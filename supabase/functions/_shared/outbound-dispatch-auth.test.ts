import {
  buildOutboundDispatchHeaders,
  signOutboundDispatchBody,
} from './outbound-dispatch-auth.ts';

Deno.test('signOutboundDispatchBody is deterministic for fixed timestamp', async () => {
  const body = '{"event_type":"test"}';
  const a = await signOutboundDispatchBody('test-secret', body, 1_700_000_000);
  const b = await signOutboundDispatchBody('test-secret', body, 1_700_000_000);
  if (a.signature !== b.signature) throw new Error('signature mismatch');
  if (a.timestamp !== '1700000000') throw new Error('timestamp mismatch');
});

Deno.test('buildOutboundDispatchHeaders adds HMAC when secret present', async () => {
  const body = '{"a":1}';
  const headers = await buildOutboundDispatchHeaders(body, 'idem-1', 'secret');
  if (!headers['x-phonara-signature']) throw new Error('missing signature');
  if (!headers['x-phonara-timestamp']) throw new Error('missing timestamp');
  if (headers['x-idempotency-key'] !== 'idem-1') throw new Error('idempotency key');
});

Deno.test('buildOutboundDispatchHeaders omits HMAC without secret', async () => {
  const headers = await buildOutboundDispatchHeaders('{}', 'idem-2', undefined);
  if (headers['x-phonara-signature']) throw new Error('unexpected signature');
  if (headers['x-idempotency-key'] !== 'idem-2') throw new Error('idempotency key');
});
