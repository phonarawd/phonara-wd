import { MAX_COMBO_LEGS } from './constants';
import type { BetLegInput } from './types';
import { SportsbookComboError } from './combo-odds';

export function validateBetLegs(legs: readonly BetLegInput[]): void {
  if (legs.length === 0) {
    throw new SportsbookComboError('[sportsbook] at least one leg required');
  }
  if (legs.length > MAX_COMBO_LEGS) {
    throw new SportsbookComboError(`[sportsbook] max ${MAX_COMBO_LEGS} legs`);
  }

  const outcomeIds = new Set<string>();
  const fixtureIds = new Set<string>();
  for (const leg of legs) {
    if (outcomeIds.has(leg.outcomeId)) {
      throw new SportsbookComboError('[sportsbook] duplicate outcome in combo');
    }
    outcomeIds.add(leg.outcomeId);
    if (legs.length > 1) {
      if (fixtureIds.has(leg.fixtureId)) {
        throw new SportsbookComboError('[sportsbook] duplicate fixture in combo parlay');
      }
      fixtureIds.add(leg.fixtureId);
    }
  }
}
