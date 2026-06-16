import { describe, expect, it } from 'vitest';
import { ODDS_API_IO_VENDOR, resolveVendorChain, THE_ODDS_API_VENDOR } from './vendor-chain';

describe('resolveVendorChain', () => {
  it('auto mode prefers the-odds-api then odds-api-io when both keys exist', () => {
    const chain = resolveVendorChain({
      vendor: 'auto',
      theOddsApiKey: 'key-a',
      oddsApiIoKey: 'key-b',
    });
    expect(chain).toEqual([
      { vendor: THE_ODDS_API_VENDOR, apiKey: 'key-a' },
      { vendor: ODDS_API_IO_VENDOR, apiKey: 'key-b' },
    ]);
  });

  it('fixed vendor uses only that key', () => {
    const chain = resolveVendorChain({
      vendor: 'odds-api-io',
      theOddsApiKey: 'key-a',
      oddsApiIoKey: 'key-b',
    });
    expect(chain).toEqual([{ vendor: ODDS_API_IO_VENDOR, apiKey: 'key-b' }]);
  });

  it('auto with single key returns one entry', () => {
    const chain = resolveVendorChain({
      vendor: 'auto',
      theOddsApiKey: 'only',
    });
    expect(chain).toEqual([{ vendor: THE_ODDS_API_VENDOR, apiKey: 'only' }]);
  });
});
