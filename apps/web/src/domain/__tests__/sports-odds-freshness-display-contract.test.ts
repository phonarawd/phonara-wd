import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '@/lib/launch-gates';

import {
  SPORTS_ODDS_LIVE_MAX_AGE_SEC,
  SPORTS_ODDS_PREMATCH_MAX_AGE_SEC,
  SPORTS_ODDS_STALE_DISPLAY,
  collectSportsMatch1x2Outcomes,
  isSportsOddsCapturedAtFresh,
  isSportsOddsIngestHealthGreen,
  resolveSportsBettingExposureAllowed,
  resolveSportsCashoutExposureAllowed,
  resolveSportsOddsCellDisplay,
  resolveSportsOddsMaxAgeSec,
  shouldAllowSportsBettingGateFlip,
  shouldAllowSportsCashoutGateFlip,
  shouldBlockSportsCashoutNetworkMutation,
  shouldBlockSportsPlaceNetworkMutation,
  shouldShowSportsIngestOfflineBanner,
  sportsBettingGatesClosedUntilIngestGreen,
} from '../sports-odds-freshness-display-contract';

const NOW = Date.parse('2026-07-13T00:00:00.000Z');

describe('sports-odds-freshness-display-contract (H-05)', () => {
  it('pins engine-default TTL seconds (prematch 300 · live 15)', () => {
    expect(SPORTS_ODDS_PREMATCH_MAX_AGE_SEC).toBe(300);
    expect(SPORTS_ODDS_LIVE_MAX_AGE_SEC).toBe(15);
    expect(resolveSportsOddsMaxAgeSec(false)).toBe(300);
    expect(resolveSportsOddsMaxAgeSec(true)).toBe(15);
  });

  it('judges freshness from server captured_at (not client clock alone)', () => {
    expect(isSportsOddsCapturedAtFresh('2026-07-12T23:55:00.000Z', NOW, 300)).toBe(true);
    expect(isSportsOddsCapturedAtFresh('2026-07-12T23:54:59.000Z', NOW, 300)).toBe(false);
    expect(isSportsOddsCapturedAtFresh(null, NOW, 300)).toBe(false);
    expect(isSportsOddsCapturedAtFresh('not-a-date', NOW, 300)).toBe(false);
  });

  it('uses live TTL when isLive', () => {
    expect(
      isSportsOddsCapturedAtFresh(
        '2026-07-12T23:59:50.000Z',
        NOW,
        resolveSportsOddsMaxAgeSec(true),
      ),
    ).toBe(true);
    expect(
      isSportsOddsCapturedAtFresh(
        '2026-07-12T23:59:44.000Z',
        NOW,
        resolveSportsOddsMaxAgeSec(true),
      ),
    ).toBe(false);
  });

  it('renders stale/missing as — and not selectable', () => {
    expect(
      resolveSportsOddsCellDisplay({
        odds: '1.95',
        capturedAt: '2026-06-16T04:43:29.944Z',
        nowMs: NOW,
      }),
    ).toEqual({
      kind: 'stale',
      display: SPORTS_ODDS_STALE_DISPLAY,
      selectable: false,
    });

    expect(
      resolveSportsOddsCellDisplay({
        odds: null,
        capturedAt: '2026-07-12T23:55:00.000Z',
        nowMs: NOW,
      }),
    ).toEqual({
      kind: 'missing',
      display: SPORTS_ODDS_STALE_DISPLAY,
      selectable: false,
    });
  });

  it('renders fresh odds as selectable numeric display', () => {
    expect(
      resolveSportsOddsCellDisplay({
        odds: '1.95',
        capturedAt: '2026-07-12T23:55:00.000Z',
        nowMs: NOW,
      }),
    ).toEqual({
      kind: 'fresh',
      display: '1.95',
      selectable: true,
    });
  });

  it('treats audit-era snapshots (newest 2026-06-16) as ingest not green', () => {
    const outcomes = collectSportsMatch1x2Outcomes({
      home: { outcome_id: 'h', odds: '1.90', captured_at: '2026-06-16T04:43:29.944Z' },
      draw: { outcome_id: 'd', odds: '3.40', captured_at: '2026-06-16T04:43:29.944Z' },
      away: { outcome_id: 'a', odds: '4.10', captured_at: '2026-06-16T04:43:29.944Z' },
    });
    expect(isSportsOddsIngestHealthGreen(outcomes, NOW)).toBe(false);
    expect(shouldAllowSportsBettingGateFlip(false)).toBe(false);
    expect(shouldAllowSportsCashoutGateFlip(false)).toBe(false);
  });

  it('ZA-13: shows board-level ingest-offline banner only when fixtures exist and ingest is not green', () => {
    expect(
      shouldShowSportsIngestOfflineBanner({ hasFixtures: true, ingestHealthGreen: false }),
    ).toBe(true);
    expect(
      shouldShowSportsIngestOfflineBanner({ hasFixtures: true, ingestHealthGreen: true }),
    ).toBe(false);
    expect(
      shouldShowSportsIngestOfflineBanner({ hasFixtures: false, ingestHealthGreen: false }),
    ).toBe(false);
  });

  it('keeps LAUNCH_GATES.sportsBetting/sportsCashout false until ingest green (H-05)', () => {
    expect(LAUNCH_GATES.sportsBetting).toBe(false);
    expect(LAUNCH_GATES.sportsCashout).toBe(false);
    expect(
      sportsBettingGatesClosedUntilIngestGreen({
        ingestHealthGreen: false,
      }),
    ).toBe(true);
    expect(
      resolveSportsBettingExposureAllowed({
        ingestHealthGreen: false,
        sportsBettingGate: false,
      }),
    ).toBe(false);
    expect(
      resolveSportsCashoutExposureAllowed({
        ingestHealthGreen: false,
        sportsCashoutGate: false,
      }),
    ).toBe(false);
  });

  it('blocks place/cashout network mutations while gate off or ingest down or selection stale', () => {
    expect(
      shouldBlockSportsPlaceNetworkMutation({
        sportsBettingGate: false,
        ingestHealthGreen: false,
        hasStaleOrMissingSelection: false,
      }),
    ).toBe(true);

    expect(
      shouldBlockSportsPlaceNetworkMutation({
        sportsBettingGate: true,
        ingestHealthGreen: true,
        hasStaleOrMissingSelection: true,
      }),
    ).toBe(true);

    expect(
      shouldBlockSportsPlaceNetworkMutation({
        sportsBettingGate: true,
        ingestHealthGreen: true,
        hasStaleOrMissingSelection: false,
      }),
    ).toBe(false);

    expect(
      shouldBlockSportsCashoutNetworkMutation({
        sportsCashoutGate: true,
        ingestHealthGreen: false,
      }),
    ).toBe(true);

    expect(
      shouldBlockSportsCashoutNetworkMutation({
        sportsCashoutGate: true,
        ingestHealthGreen: true,
      }),
    ).toBe(false);
  });

  it('marks ingest green when ≥1 fresh outcome exists', () => {
    expect(
      isSportsOddsIngestHealthGreen(
        [{ odds: '2.10', captured_at: '2026-07-12T23:58:00.000Z' }],
        NOW,
      ),
    ).toBe(true);
    expect(shouldAllowSportsBettingGateFlip(true)).toBe(true);
  });
});
