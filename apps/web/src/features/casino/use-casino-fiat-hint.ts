import { useCallback } from 'react';

import {
  isFiatHintTargetActive,
  resolveLocaleTargetFiat,
  type FiatHintView,
  type LocaleFiatPreference,
} from '@/domain/fiat-reference-display-contract';
import { CASINO_FIAT_HINT_REFRESH_POLICY } from '@/domain/casino-fiat-hint-session-lock-display-contract';
import { useFiatReferenceRates } from '@/features/money/use-fiat-reference-rates';
import { useFiatHintPreference } from '@/features/settings/use-fiat-hint-preference';
import { useI18n } from '@/product/i18n';

import { buildCasinoFiatHint } from './casino-fiat-hint-display';
import { resolveCasinoFiatHintRates, useCasinoFiatRateSession } from './casino-fiat-rate-session';

export type CasinoFiatHintView = {
  readonly targetFiat: LocaleFiatPreference;
  readonly sessionLocked: boolean;
  readonly lockedAt: string | null;
  readonly hintFor: (amount: string | null | undefined, sourceCurrency: string) => FiatHintView;
  /** Snapshot live rates into CasinoFiatRateSession (no-op if already locked). */
  readonly lockSession: () => void;
  readonly unlockSession: () => void;
  readonly showDisclaimer: boolean;
};

/**
 * Casino FiatHint — `casino_session_lock` policy + CasinoFiatRateSession (§13.1.4.4 Fiat#11).
 */
export function useCasinoFiatHint(hintEnabledOverride?: boolean): CasinoFiatHintView {
  const { locale } = useI18n();
  const preferenceEnabled = useFiatHintPreference();
  const hintEnabled = hintEnabledOverride ?? preferenceEnabled;
  const targetFiat = resolveLocaleTargetFiat(locale, hintEnabled);
  const { rates: liveRates } = useFiatReferenceRates({
    refreshPolicy: CASINO_FIAT_HINT_REFRESH_POLICY,
  });
  const sessionLocked = useCasinoFiatRateSession((s) => s.locked);
  const lockedAt = useCasinoFiatRateSession((s) => s.lockedAt);
  const sessionRates = useCasinoFiatRateSession((s) => s.rates);
  const lock = useCasinoFiatRateSession((s) => s.lock);
  const unlock = useCasinoFiatRateSession((s) => s.unlock);
  const effectiveRates = resolveCasinoFiatHintRates(
    { locked: sessionLocked, lockedAt, rates: sessionRates },
    liveRates,
  );

  const hintFor = useCallback(
    (amount: string | null | undefined, sourceCurrency: string) =>
      buildCasinoFiatHint(amount, sourceCurrency, targetFiat, effectiveRates),
    [targetFiat, effectiveRates],
  );

  const lockSession = useCallback(() => {
    lock(liveRates);
  }, [liveRates, lock]);

  const unlockSession = useCallback(() => {
    unlock();
  }, [unlock]);

  return {
    targetFiat,
    sessionLocked,
    lockedAt,
    hintFor,
    lockSession,
    unlockSession,
    showDisclaimer: isFiatHintTargetActive(targetFiat),
  };
}
