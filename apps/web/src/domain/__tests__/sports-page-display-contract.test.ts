import { describe, expect, it } from 'vitest';

import {
  leagueFilterToRpcParam,
  resolveSportCodeFromLeague,
  resolveSportsPageModeStatusFilter,
  SPORTS_LEAGUE_FILTER_OPTIONS,
  SPORTS_STAKE_CURRENCIES,
} from '../sports-page-display-contract';

describe('sports-page-display-contract', () => {
  it('maps league filters to RPC params', () => {
    expect(leagueFilterToRpcParam('all')).toBeUndefined();
    expect(leagueFilterToRpcParam('epl')).toBe('epl');
  });

  it('derives sport buckets from league until sport_code RPC ships', () => {
    expect(resolveSportCodeFromLeague('epl')).toBe('football');
    expect(resolveSportCodeFromLeague('mlb')).toBe('baseball');
    expect(resolveSportCodeFromLeague('unknown')).toBe('other');
  });

  it('maps page modes to fixture status filters', () => {
    expect(resolveSportsPageModeStatusFilter('live')).toBe('live');
    expect(resolveSportsPageModeStatusFilter('prematch')).toBe('scheduled');
    expect(resolveSportsPageModeStatusFilter('home')).toBeUndefined();
  });

  it('registers dual stake currencies for slip wire', () => {
    expect(SPORTS_STAKE_CURRENCIES).toEqual(['USDT', 'PHON']);
    expect(SPORTS_LEAGUE_FILTER_OPTIONS.length).toBeGreaterThan(1);
  });
});
