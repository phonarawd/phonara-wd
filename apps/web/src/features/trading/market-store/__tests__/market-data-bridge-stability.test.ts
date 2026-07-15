import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const bridgeSrc = readFileSync(join(import.meta.dirname, '../market-data-bridge.tsx'), 'utf8');

describe('market-data-bridge ticker subscription stability (ZA-21)', () => {
  it('ticker effect depends on tickersKey only — not marketSymbols array identity', () => {
    // Parents pass `.map()` arrays each render; depending on marketSymbols churns
    // subscribe/unsubscribe and aborts CONNECTING Binance multiplex sockets.
    expect(bridgeSrc).toMatch(/}, \[tickersKey, remote\]\);/);
    expect(bridgeSrc).not.toMatch(/}, \[tickersKey, marketSymbols, remote\]\);/);
  });
});
