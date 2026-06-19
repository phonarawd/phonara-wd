import { describe, expect, it } from 'vitest';
import { Decimal } from '@phonara/money';
import { verifyRound } from '../fairness/verifier';
import { floatStream } from '../fairness/float';
import { assertMcRtpSmoke } from '../lib/mc-rtp-harness';
import {
  COMBO_MULT,
  comboPayoutMultiplier,
  evaluateMomentum,
  expectedStakesToCashOut,
  MOMENTUM_MAX_COMBO,
  MOMENTUM_WIN_THRESHOLD,
  momentumDefinition,
  momentumWinProbability,
} from './momentum';

import './momentum';

const SERVER = 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
const CLIENT = 'momentum_client';

async function simulateEarlyPolicyRtp(seeds: number): Promise<number> {
  const stake = new Decimal('1');
  let staked = 0;
  let returned = 0;
  const target = 2;

  for (let s = 0; s < seeds; s += 1) {
    let combo = 0;
    let step = 0;
    const serverSeed = `${SERVER}:smoke:early:${s}`;
    const clientSeed = `${CLIENT}:${s % 997}`;

    while (step < 500) {
      if (combo >= target) {
        staked += 1;
        const floats = await floatStream(serverSeed, clientSeed, step + 1, 1);
        const cashResult = momentumDefinition.resultFromFloats(floats, {
          comboBefore: combo,
          cashOut: true,
        });
        const { payout } = momentumDefinition.settle(
          stake,
          { comboBefore: combo, cashOut: true },
          cashResult,
        );
        returned += payout.toNumber();
        break;
      }
      staked += 1;
      const floats = await floatStream(serverSeed, clientSeed, step + 1, 1);
      const playResult = momentumDefinition.resultFromFloats(floats, {
        comboBefore: combo,
        cashOut: false,
      });
      combo = playResult.comboAfter;
      step += 1;
    }
  }

  return returned / staked;
}

describe('momentum', () => {
  it('rejects cashOut with comboBefore 0', async () => {
    const floats = await floatStream(SERVER, CLIENT, 1, 1);
    expect(() =>
      momentumDefinition.resultFromFloats(floats, { comboBefore: 0, cashOut: true }),
    ).toThrow('invalid_momentum_cashout');
  });

  it('cashOut banks combo without using roll', async () => {
    const floats = await floatStream(SERVER, CLIENT, 1, 1);
    const result = evaluateMomentum(floats, { comboBefore: 3, cashOut: true });
    expect(result.cashedOut).toBe(true);
    expect(result.won).toBe(true);
    expect(result.roll).toBe(0);
    expect(result.comboAfter).toBe(0);
    expect(result.totalMultiplier).toBe(comboPayoutMultiplier(3));
    expect(result.comboMultiplier).toBe(COMBO_MULT[3]);
  });

  it('play win increments combo; loss resets', () => {
    const winFloats = [0.99];
    const win = evaluateMomentum(winFloats, { comboBefore: 2, cashOut: false });
    expect(win.won).toBe(true);
    expect(win.comboAfter).toBe(3);
    expect(win.totalMultiplier).toBe(0);
    expect(win.cashedOut).toBe(false);

    const loseFloats = [0.01];
    const lose = evaluateMomentum(loseFloats, { comboBefore: 4, cashOut: false });
    expect(lose.won).toBe(false);
    expect(lose.comboAfter).toBe(0);
  });

  it('verifyRound resultMatch on cashOut (float ignored)', async () => {
    const serverSeed = SERVER;
    const clientSeed = CLIENT;
    const selection = { comboBefore: 4, cashOut: true };
    const floats = await floatStream(serverSeed, clientSeed, 1, 1);
    const expected = momentumDefinition.resultFromFloats(floats, selection);
    const verified = await verifyRound({
      game: 'momentum',
      serverSeed,
      serverSeedHash: 'unused',
      clientSeed,
      nonce: 1,
      selection,
      expectedResult: expected as unknown as Record<string, unknown>,
    });
    expect(verified.recomputedResult).toEqual(expected);
    expect(verified.resultMatch).toBe(true);
  });

  it('COMBO_MULT length covers max combo', () => {
    expect(COMBO_MULT.length).toBe(MOMENTUM_MAX_COMBO + 1);
  });

  describe('policy RTP (closed-form)', () => {
    const policies = [
      { policy: 'early' as const, target: 2 },
      { policy: 'mid' as const, target: 5 },
      { policy: 'greedy' as const, target: 10 },
    ];
    for (const { policy, target } of policies) {
      it(`${policy} policy matches closed-form RTP`, () => {
        const p = momentumWinProbability();
        const theoretical = comboPayoutMultiplier(target) / expectedStakesToCashOut(p, target);
        expect(theoretical).toBeGreaterThanOrEqual(0.985);
        expect(theoretical).toBeLessThanOrEqual(0.995);
      });
    }
  });

  it('MC RTP smoke — early policy only (300 seeds, Hoeffding band)', async () => {
    const p = momentumWinProbability();
    const theoretical = comboPayoutMultiplier(2) / expectedStakesToCashOut(p, 2);
    const measured = await simulateEarlyPolicyRtp(300);
    assertMcRtpSmoke(measured, theoretical, 300, 'early');
  }, 30_000);

  it('settle conserves on cashOut', () => {
    const stake = new Decimal('10');
    const selection = { comboBefore: 5, cashOut: true };
    const result = evaluateMomentum([0.5], selection);
    const { payout, houseEdgeLeg } = momentumDefinition.settle(stake, selection, result);
    expect(payout.plus(houseEdgeLeg).eq(stake)).toBe(true);
  });

  it('WIN_THRESHOLD is exported for SQL parity', () => {
    expect(MOMENTUM_WIN_THRESHOLD).toBe(52);
  });

  it('maxPayoutMultiplier is 0 on play rounds; cash-out uses combo table', () => {
    expect(momentumDefinition.maxPayoutMultiplier!({ comboBefore: 0, cashOut: false })).toBe(0);
    expect(momentumDefinition.maxPayoutMultiplier!({ comboBefore: 5, cashOut: false })).toBe(0);
    expect(momentumDefinition.maxPayoutMultiplier!({ comboBefore: 3, cashOut: true })).toBe(
      comboPayoutMultiplier(3),
    );
    expect(momentumDefinition.maxPayoutMultiplier!({ comboBefore: 15, cashOut: true })).toBe(
      comboPayoutMultiplier(15),
    );
  });

  it('closed-form policy RTP at combo targets', () => {
    const p = momentumWinProbability();
    for (const target of [2, 5, 10]) {
      const payMult = comboPayoutMultiplier(target);
      const expected = expectedStakesToCashOut(p, target);
      const rtp = payMult / expected;
      expect(rtp).toBeGreaterThanOrEqual(0.985);
      expect(rtp).toBeLessThanOrEqual(0.995);
    }
  });
});
