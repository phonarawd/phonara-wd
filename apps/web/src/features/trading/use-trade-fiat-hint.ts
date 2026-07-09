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

import { buildTradeFiatHint, type BuildTradeFiatHintOptions } from './trade-fiat-hint-display';

export type TradeFiatHintView = {
  readonly targetFiat: LocaleFiatPreference;
  readonly hintFor: (
    amount: string,
    sourceCurrency: string,
    options?: BuildTradeFiatHintOptions,
  ) => FiatHintView;
  readonly showDisclaimer: boolean;
};

/**
 * Trade desk FiatHint — shared `useFiatReferenceRates` trade policy (30s) · §13.1.4.4 Fiat#7.
 */
export function useTradeFiatHint(hintEnabledOverride?: boolean): TradeFiatHintView {
  const { locale } = useI18n();
  const preferenceEnabled = useFiatHintPreference();
  const hintEnabled = hintEnabledOverride ?? preferenceEnabled;
  const targetFiat = resolveLocaleTargetFiat(locale, hintEnabled);
  const { rates } = useFiatReferenceRates({ refreshPolicy: 'trade' });

  const hintFor = useCallback(
    (amount: string, sourceCurrency: string, options?: BuildTradeFiatHintOptions) =>
      buildTradeFiatHint(amount, sourceCurrency, targetFiat, rates, options),
    [targetFiat, rates],
  );

  return {
    targetFiat,
    hintFor,
    showDisclaimer: isFiatHintTargetActive(targetFiat),
  };
}
