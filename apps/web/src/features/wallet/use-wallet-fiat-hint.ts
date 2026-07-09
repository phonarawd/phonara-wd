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

import { buildWalletFiatHint } from './wallet-fiat-hint-display';

export type WalletFiatHintView = {
  readonly targetFiat: LocaleFiatPreference;
  readonly hintFor: (amount: string, sourceCurrency: string) => FiatHintView;
  readonly showDisclaimer: boolean;
};

/**
 * Wallet/Ledger FiatHint — shared `useFiatReferenceRates` wallet policy (60s) · KRW deposit queryKey parity.
 */
export function useWalletFiatHint(hintEnabledOverride?: boolean): WalletFiatHintView {
  const { locale } = useI18n();
  const preferenceEnabled = useFiatHintPreference();
  const hintEnabled = hintEnabledOverride ?? preferenceEnabled;
  const targetFiat = resolveLocaleTargetFiat(locale, hintEnabled);
  const { rates } = useFiatReferenceRates({ refreshPolicy: 'wallet' });

  const hintFor = useCallback(
    (amount: string, sourceCurrency: string) =>
      buildWalletFiatHint(amount, sourceCurrency, targetFiat, rates),
    [targetFiat, rates],
  );

  return {
    targetFiat,
    hintFor,
    showDisclaimer: isFiatHintTargetActive(targetFiat),
  };
}
