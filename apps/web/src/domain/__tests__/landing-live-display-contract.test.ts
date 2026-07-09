import { describe, expect, it } from 'vitest';

import {
  findLandingLiveCmsRow,
  parseLandingLiveCmsCount,
  resolveLandingLiveProofModeFromEnv,
} from '../landing-live-display-contract';

describe('landing-live-display-contract', () => {
  it('defaults to presentation when env unset', () => {
    expect(resolveLandingLiveProofModeFromEnv({})).toBe('presentation');
    expect(resolveLandingLiveProofModeFromEnv({ VITE_PHONARA_LANDING_PROOF_MODE: 'live' })).toBe(
      'live',
    );
  });

  it('parses CMS body counts for L0b momentum', () => {
    expect(parseLandingLiveCmsCount('1,240')).toBe(1240);
    expect(parseLandingLiveCmsCount('')).toBeNull();
  });

  it('finds CMS row by content_key', () => {
    const rows = [{ content_key: 'withdrawal_momentum', body: '500' }];
    expect(findLandingLiveCmsRow(rows, 'withdrawal_momentum')?.body).toBe('500');
  });
});
