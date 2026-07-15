import { useCallback } from 'react';

import {
  isFiatHintTargetActive,
  resolveLocaleTargetFiat,
  type FiatHintView,
  type LocaleFiatPreference,
} from '@/domain/fiat-reference-display-contract';
import { useFiatReferenceRates } from '@/features/money/use-fiat-reference-rates';
import { useFiatHintPreference } from '@/features/settings/use-fiat-hint-preference';
import { useI18n } from '@/product/i18n';

import { buildSportsFiatHint, type BuildSportsFiatHintOptions } from './sports-fiat-hint-display';

export type SportsFiatHintView = {
  readonly targetFiat: LocaleFiatPreference;
  readonly hintFor: (
    amount: string | null | undefined,
    sourceCurrency: string,
    options?: BuildSportsFiatHintOptions,
  ) => FiatHintView;
  readonly showDisclaimer: boolean;
};

/**
 * Sports slip FiatHint — shared `useFiatReferenceRates` trade policy (30s) · §13.1.4.4 Fiat#10.
 */
export function useSportsFiatHint(hintEnabledOverride?: boolean): SportsFiatHintView {
  const { locale } = useI18n();
  const preferenceEnabled = useFiatHintPreference();
  const hintEnabled = hintEnabledOverride ?? preferenceEnabled;
  const targetFiat = resolveLocaleTargetFiat(locale, hintEnabled);
  const { rates } = useFiatReferenceRates({ refreshPolicy: 'trade' });

  const hintFor = useCallback(
    (
      amount: string | null | undefined,
      sourceCurrency: string,
      options?: BuildSportsFiatHintOptions,
    ) => buildSportsFiatHint(amount, sourceCurrency, targetFiat, rates, options),
    [targetFiat, rates],
  );

  return {
    targetFiat,
    hintFor,
    showDisclaimer: isFiatHintTargetActive(targetFiat),
  };
}
