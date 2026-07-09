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

import { buildEarnFiatHint } from './earn-fiat-hint-display';

export type EarnFiatHintView = {
  readonly targetFiat: LocaleFiatPreference;
  readonly hintFor: (amount: string, sourceCurrency: string) => FiatHintView;
  readonly showDisclaimer: boolean;
};

/**
 * Earn FiatHint — shared `useFiatReferenceRates` earn policy (60s) · §13.1.4.4 Fiat#8.
 */
export function useEarnFiatHint(hintEnabledOverride?: boolean): EarnFiatHintView {
  const { locale } = useI18n();
  const preferenceEnabled = useFiatHintPreference();
  const hintEnabled = hintEnabledOverride ?? preferenceEnabled;
  const targetFiat = resolveLocaleTargetFiat(locale, hintEnabled);
  const { rates } = useFiatReferenceRates({ refreshPolicy: 'earn' });

  const hintFor = useCallback(
    (amount: string, sourceCurrency: string) =>
      buildEarnFiatHint(amount, sourceCurrency, targetFiat, rates),
    [targetFiat, rates],
  );

  return {
    targetFiat,
    hintFor,
    showDisclaimer: isFiatHintTargetActive(targetFiat),
  };
}
