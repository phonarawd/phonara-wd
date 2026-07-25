import { describe, expect, it } from 'vitest';
import { Decimal } from '@phonara/money';
import { floatStream } from '../fairness/float';
import {
  blackjackDefinition,
  cardRank,
  cardSuit,
  playBlackjack,
  resolveBlackjackPlay,
  shuffleDeck,
} from './blackjack';

import './blackjack';

const SERVER = 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
const CLIENT = 'blackjack_red';

describe('blackjack RED', () => {
  it('PF shuffle is deterministic', async () => {
    const floats = await floatStream(SERVER, CLIENT, 1, 51);
    const a = shuffleDeck(floats);
    const b = shuffleDeck(floats);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(52);
  });

  it('rejects illegal double on 3+ cards', async () => {
    const floats = await floatStream(SERVER, CLIENT, 2, 51);
    expect(() =>
      playBlackjack(
        {
          actions: [
            { seat: 0, move: 'hit' },
            { seat: 0, move: 'double' },
          ],
        },
        floats,
      ),
    ).toThrow('invalid_action');
  });

  it('stand resolves with totalMultiplier >= 0', async () => {
    const floats = await floatStream(SERVER, CLIENT, 3, 51);
    const result = playBlackjack({ actions: [{ seat: 0, move: 'stand' }] }, floats);
    expect(result.totalMultiplier).toBeGreaterThanOrEqual(0);
    expect(result.totalMultiplier).toBeLessThanOrEqual(2.5);
  });

  it('resolveBlackjackPlay returns real hands without changing settle shape', async () => {
    const floats = await floatStream(SERVER, CLIENT, 3, 51);
    const selection = { actions: [{ seat: 0, move: 'stand' as const }] };
    const detail = resolveBlackjackPlay(selection, floats);
    const settle = playBlackjack(selection, floats);
    expect(detail.totalMultiplier).toBe(settle.totalMultiplier);
    expect(detail.playerHands.length).toBeGreaterThanOrEqual(1);
    expect(detail.playerHands[0]!.cards.length).toBeGreaterThanOrEqual(2);
    expect(detail.dealerHand.cards.length).toBeGreaterThanOrEqual(2);
    expect(cardRank(detail.playerHands[0]!.cards[0]!)).toBeGreaterThanOrEqual(1);
    expect(cardRank(detail.playerHands[0]!.cards[0]!)).toBeLessThanOrEqual(13);
    expect(cardSuit(detail.dealerHand.cards[0]!)).toBeGreaterThanOrEqual(0);
    expect(cardSuit(detail.dealerHand.cards[0]!)).toBeLessThanOrEqual(3);
    // Settlement result stays multiplier-only (SQL parity).
    expect(Object.keys(settle)).toEqual(['totalMultiplier']);
  });

  it('settle conserves stake = payout + houseEdgeLeg', () => {
    const stake = new Decimal('10');
    const { payout, houseEdgeLeg } = blackjackDefinition.settle(
      stake,
      { actions: [{ seat: 0, move: 'stand' }] },
      { totalMultiplier: 2 },
    );
    expect(payout.plus(houseEdgeLeg).eq(stake)).toBe(true);
  });
});
