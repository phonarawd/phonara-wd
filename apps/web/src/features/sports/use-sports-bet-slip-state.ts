import { useCallback, useMemo, useState } from 'react';
import {
  previewComboPayout,
  previewSinglePayout,
  productComboOddsFromLegs,
} from '@phonara/sportsbook-engine';
import { isPositive, money } from '@phonara/money';

import { resolveSportsDebitBucketDisplayKey } from '@/domain/sports-debit-bucket-display';
import type { SportsStakeCurrency } from '@/domain/sports-page-display-contract';

export type SportsSlipSelection = {
  readonly outcomeId: string;
  readonly oddsAtBet: string;
  readonly fixtureId: string;
  readonly homeName: string;
  readonly awayName: string;
  readonly selection: string;
  readonly marketType: string;
};

export function useSportsBetSlipState(phonBonusAvailable: string | null | undefined) {
  const [selections, setSelections] = useState<SportsSlipSelection[]>([]);
  const [stake, setStake] = useState('');
  const [stakeCurrency, setStakeCurrency] = useState<SportsStakeCurrency>('USDT');

  const toggleSelection = useCallback((leg: SportsSlipSelection) => {
    setSelections((prev) => {
      const withoutSameOutcome = prev.filter((row) => row.outcomeId !== leg.outcomeId);
      const existing = prev.find((row) => row.outcomeId === leg.outcomeId);
      if (existing) {
        return withoutSameOutcome;
      }
      const withoutSameFixtureMarket = withoutSameOutcome.filter(
        (row) => !(row.fixtureId === leg.fixtureId && row.marketType === leg.marketType),
      );
      return [...withoutSameFixtureMarket, leg];
    });
  }, []);

  const removeSelection = useCallback((outcomeId: string) => {
    setSelections((prev) => prev.filter((row) => row.outcomeId !== outcomeId));
  }, []);

  const clearSlip = useCallback(() => {
    setSelections([]);
    setStake('');
  }, []);

  const combinedOddsDisplay = useMemo(() => {
    if (selections.length === 0) return null;
    if (selections.length === 1) return selections[0]?.oddsAtBet ?? null;
    try {
      return productComboOddsFromLegs(
        selections.map((row) => ({
          outcomeId: row.outcomeId,
          odds: row.oddsAtBet,
          fixtureId: row.fixtureId,
        })),
      );
    } catch {
      return null;
    }
  }, [selections]);

  const potentialPayoutDisplay = useMemo(() => {
    const stakeRaw = stake.replace(/,/g, '').trim();
    if (!stakeRaw || selections.length === 0) return null;
    try {
      if (!isPositive(money(stakeRaw, stakeCurrency))) return null;
      if (selections.length === 1) {
        const preview = previewSinglePayout(stakeRaw, stakeCurrency, selections[0]!.oddsAtBet);
        return preview.amount;
      }
      const preview = previewComboPayout(
        money(stakeRaw, stakeCurrency),
        selections.map((row) => ({
          outcomeId: row.outcomeId,
          odds: row.oddsAtBet,
          fixtureId: row.fixtureId,
        })),
      );
      return preview.amount;
    } catch {
      return null;
    }
  }, [selections, stake, stakeCurrency]);

  const debitBucketKey = useMemo(
    () =>
      resolveSportsDebitBucketDisplayKey({
        currency: stakeCurrency,
        stake,
        phonBonusAvailable,
      }),
    [phonBonusAvailable, stake, stakeCurrency],
  );

  return {
    selections,
    stake,
    setStake,
    stakeCurrency,
    setStakeCurrency,
    toggleSelection,
    removeSelection,
    clearSlip,
    combinedOddsDisplay,
    potentialPayoutDisplay,
    debitBucketKey,
    legCount: selections.length,
  };
}

export type SportsBetSlipState = ReturnType<typeof useSportsBetSlipState>;
