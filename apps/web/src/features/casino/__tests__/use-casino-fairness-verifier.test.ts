import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { floatStream, hashServerSeed, recomputeResult, verifyRound } from '@phonara/game-engine';

import { CASINO_FAIRNESS_NONCE } from '@/domain/casino-fairness-display-contract';
import { useCasinoFairnessVerifier } from '@/features/casino/use-casino-fairness-verifier';

describe('useCasinoFairnessVerifier (p10-page-casino-fairness)', () => {
  it('locks nonce to 1 and rejects empty required fields', async () => {
    const { result } = renderHook(() => useCasinoFairnessVerifier('dice'));
    expect(result.current.nonce).toBe(CASINO_FAIRNESS_NONCE);
    expect(result.current.nonce).toBe(1);

    await act(async () => {
      await result.current.runVerify();
    });
    expect(result.current.errorKey).toBe('casino.fairness.verify.missingFields');
    expect(result.current.result).toBeNull();
  });

  it('matches @phonara/game-engine verifyRound for dice', async () => {
    const serverSeed = 'fairness-ui-seed-001';
    const clientSeed = 'fairness-ui-client';
    const serverSeedHash = await hashServerSeed(serverSeed);
    const selection = { target: '50.00', direction: 'over' as const };
    const floats = await floatStream(serverSeed, clientSeed, CASINO_FAIRNESS_NONCE, 1);
    const expected = recomputeResult('dice', floats, selection) as Record<string, unknown>;
    const engineVerified = await verifyRound({
      game: 'dice',
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce: CASINO_FAIRNESS_NONCE,
      selection,
      expectedResult: expected,
    });

    const { result } = renderHook(() => useCasinoFairnessVerifier('dice'));

    act(() => {
      result.current.setServerSeed(serverSeed);
      result.current.setServerSeedHash(serverSeedHash);
      result.current.setClientSeed(clientSeed);
      result.current.setSelectionJson(JSON.stringify(selection));
      result.current.setExpectedResultJson(JSON.stringify(expected));
    });

    await act(async () => {
      await result.current.runVerify();
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.errorKey).toBeNull();
    expect(result.current.result?.seedHashMatch).toBe(true);
    expect(result.current.result?.resultMatch).toBe(true);
    expect(result.current.result?.seedHashMatch).toBe(engineVerified.seedHashMatch);
    expect(result.current.result?.resultMatch).toBe(engineVerified.resultMatch);
    expect(result.current.recomputedJson).toContain('"roll"');
  });

  it('flags invalid selection JSON without calling verify', async () => {
    const { result } = renderHook(() => useCasinoFairnessVerifier('dice'));

    act(() => {
      result.current.setServerSeed('seed');
      result.current.setServerSeedHash('hash');
      result.current.setClientSeed('client');
      result.current.setSelectionJson('{not-json');
    });

    await act(async () => {
      await result.current.runVerify();
    });

    expect(result.current.errorKey).toBe('casino.fairness.verify.invalidJson');
    expect(result.current.result).toBeNull();
  });
});
