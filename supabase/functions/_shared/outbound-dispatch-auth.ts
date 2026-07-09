async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signOutboundDispatchBody(
  secret: string,
  body: string,
  timestampUnix: number,
): Promise<{ signature: string; timestamp: string }> {
  const message = `${timestampUnix}.${body}`;
  const signature = await hmacSha256Hex(secret, message);
  return { signature, timestamp: String(timestampUnix) };
}

export async function buildOutboundDispatchHeaders(
  body: string,
  idempotencyKey: string,
  hmacSecret: string | undefined,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-idempotency-key': idempotencyKey,
  };
  if (hmacSecret) {
    const ts = Math.floor(Date.now() / 1000);
    const { signature, timestamp } = await signOutboundDispatchBody(hmacSecret, body, ts);
    headers['x-phonara-timestamp'] = timestamp;
    headers['x-phonara-signature'] = signature;
  }
  return headers;
}
