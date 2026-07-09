import { describe, expect, it } from 'vitest';
import {
  DISPLAY_ONLY_ODDS_SOURCE,
  SPORTS_ODDS_INGEST_EDGE_ENTRY,
  type SportsOddsSource,
} from '../sports-odds-source';

describe('sports-odds-source seam', () => {
  it('marks display-only boundary', () => {
    expect(DISPLAY_ONLY_ODDS_SOURCE).toBe(true);
  });

  it('documents future edge entry path', () => {
    expect(SPORTS_ODDS_INGEST_EDGE_ENTRY).toContain('sports-odds-ingest');
  });

  it('accepts a stub adapter shape', async () => {
    const stub: SportsOddsSource = {
      vendorId: 'stub-vendor',
      async fetchFixtureBatch() {
        return [];
      },
    };
    await expect(stub.fetchFixtureBatch()).resolves.toEqual([]);
  });
});
