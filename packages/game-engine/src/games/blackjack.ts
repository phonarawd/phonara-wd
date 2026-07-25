import { z } from 'zod';
import { registerGame, type GameDefinition } from '../registry';
import { quantize6 } from '../lib/quantize';
import { requireFloat } from '../lib/require-float';

export type BlackjackMove = 'hit' | 'stand' | 'double' | 'split' | 'insurance';

export interface BlackjackAction {
  seat: number;
  move: BlackjackMove;
}

export interface BlackjackSelection {
  actions: BlackjackAction[];
}

export interface BlackjackHand {
  cards: number[];
  value: number;
  isSoft: boolean;
  isBlackjack: boolean;
  busted: boolean;
  doubled: boolean;
}

export interface BlackjackResult {
  totalMultiplier: number;
}

/**
 * Full table resolution for presentation / PF hand replay.
 * Settlement RPC / `resultFromFloats` stay `{ totalMultiplier }` only —
 * this helper does not change the stored result shape.
 */
export interface BlackjackPlayDetail {
  totalMultiplier: number;
  playerHands: BlackjackHand[];
  dealerHand: BlackjackHand;
}

const DECK_SIZE = 52;
const SHUFFLE_FLOATS = 51;

/** Rank index 1–13 from engine card id 1–52 (suit = floor((id-1)/13)). */
export function cardRank(card: number): number {
  return ((card - 1) % 13) + 1;
}

/** Suit index 0–3 (♠♥♦♣) from engine card id 1–52. */
export function cardSuit(card: number): number {
  return Math.floor((card - 1) / 13);
}

export function cardValue(card: number): number {
  const rank = cardRank(card);
  return rank >= 10 ? 10 : rank;
}

export function handValue(cards: number[]): { value: number; isSoft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    const v = cardValue(c);
    total += v;
    if (v === 1) aces += 1;
  }
  while (aces > 0 && total + 10 <= 21) {
    total += 10;
    aces -= 1;
  }
  const isSoft = cards.some((c) => cardValue(c) === 1) && total <= 21 && total >= 12;
  return { value: total, isSoft };
}

export function shuffleDeck(floats: number[]): number[] {
  const deck = Array.from({ length: DECK_SIZE }, (_, i) => i + 1);
  for (let i = DECK_SIZE - 1; i >= 1; i -= 1) {
    const j = Math.floor(requireFloat(floats, DECK_SIZE - 1 - i) * (i + 1));
    [deck[i], deck[j]!] = [deck[j]!, deck[i]!];
  }
  return deck;
}

function buildHand(cards: number[]): BlackjackHand {
  const { value, isSoft } = handValue(cards);
  const isBlackjack = cards.length === 2 && value === 21;
  return {
    cards,
    value,
    isSoft,
    isBlackjack,
    busted: value > 21,
    doubled: false,
  };
}

function dealerPlay(
  deck: number[],
  idx: number,
  dealerCards: number[],
): { hand: BlackjackHand; idx: number } {
  const cards = [...dealerCards];
  let i = idx;
  while (true) {
    const hv = handValue(cards);
    if (hv.value >= 17) break;
    if (hv.value > 21) break;
    cards.push(deck[i]!);
    i += 1;
  }
  return { hand: buildHand(cards), idx: i };
}

function handPayoutMultiplier(player: BlackjackHand, dealer: BlackjackHand): number {
  if (player.busted) return 0;
  if (player.isBlackjack && !dealer.isBlackjack) return 2.5;
  if (dealer.isBlackjack && !player.isBlackjack) return 0;
  if (dealer.busted) return player.doubled ? 4 : 2;
  if (player.value > dealer.value) return player.doubled ? 4 : 2;
  if (player.value < dealer.value) return 0;
  return player.doubled ? 2 : 1;
}

/**
 * Resolve full blackjack hands + multiplier from PF floats.
 * Used by presentation to render real card faces without inventing ranks.
 * Settlement path continues to use `playBlackjack` → `{ totalMultiplier }` only.
 */
export function resolveBlackjackPlay(
  selection: BlackjackSelection,
  floats: number[],
): BlackjackPlayDetail {
  const deck = shuffleDeck(floats);
  let idx = 0;
  const deal = () => {
    const c = deck[idx]!;
    idx += 1;
    return c;
  };

  const playerCards = [deal(), deal()];
  const dealerCards = [deal(), deal()];

  let hands: BlackjackHand[] = [buildHand(playerCards)];
  let insuranceWon = false;
  let activeSeat = 0;

  for (const action of selection.actions) {
    if (action.seat !== activeSeat) throw new Error('invalid_action');
    const hand = hands[activeSeat]!;
    if (hand.busted) throw new Error('invalid_action');

    switch (action.move) {
      case 'insurance': {
        if (cardValue(dealerCards[0]!) !== 10 && cardValue(dealerCards[0]!) !== 1) {
          throw new Error('invalid_action');
        }
        insuranceWon = handValue(dealerCards).value === 21;
        break;
      }
      case 'hit': {
        hand.cards.push(deal());
        Object.assign(hand, buildHand(hand.cards));
        hands[activeSeat] = hand;
        break;
      }
      case 'stand':
        activeSeat += 1;
        break;
      case 'double': {
        if (hand.cards.length !== 2) throw new Error('invalid_action');
        hand.cards.push(deal());
        hand.doubled = true;
        Object.assign(hand, buildHand(hand.cards));
        hand.doubled = true;
        hands[activeSeat] = hand;
        activeSeat += 1;
        break;
      }
      case 'split': {
        if (hand.cards.length !== 2 || cardValue(hand.cards[0]!) !== cardValue(hand.cards[1]!)) {
          throw new Error('invalid_action');
        }
        const c0 = hand.cards[0]!;
        const c1 = hand.cards[1]!;
        hands = [buildHand([c0, deal()]), buildHand([c1, deal()])];
        activeSeat = 0;
        break;
      }
      default:
        throw new Error('invalid_action');
    }
  }

  const { hand: dealerHand } = dealerPlay(deck, idx, dealerCards);

  let totalMult = 0;
  for (const h of hands) {
    totalMult += handPayoutMultiplier(h, dealerHand);
  }
  if (insuranceWon) totalMult += 2;

  return {
    totalMultiplier: totalMult / hands.length,
    playerHands: hands,
    dealerHand,
  };
}

export function playBlackjack(selection: BlackjackSelection, floats: number[]): BlackjackResult {
  const detail = resolveBlackjackPlay(selection, floats);
  return { totalMultiplier: detail.totalMultiplier };
}

const blackjackDefinition: GameDefinition<BlackjackSelection, BlackjackResult> = {
  code: 'blackjack',
  betSchema: z.object({
    actions: z.array(
      z.object({
        seat: z.number().int().min(0).max(3),
        move: z.enum(['hit', 'stand', 'double', 'split', 'insurance']),
      }),
    ),
  }),
  floatCount: SHUFFLE_FLOATS,

  resultFromFloats(floats, selection): BlackjackResult {
    return playBlackjack(selection, floats);
  },

  settle(stake, _selection, result) {
    const payout = stake.mul(quantize6(result.totalMultiplier.toFixed(6)));
    return { payout, houseEdgeLeg: stake.minus(payout) };
  },

  maxPayoutMultiplier() {
    return 2.5;
  },
};

registerGame(blackjackDefinition);
export { blackjackDefinition };
