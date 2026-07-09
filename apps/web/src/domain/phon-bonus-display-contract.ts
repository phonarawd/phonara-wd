import { toDecimal } from '@phonara/money';
import { formatMoney } from '../hooks/use-money';
import type { PhonBalanceBreakdown } from './phon-balance';

/** Engine-backed PHON track raw strings — never derived from `phon_available - bonus`. */
export type PhonTrackRawValues = {
  phonBonusAvailable: string;
  phonRealAvailable: string;
  wageringRemaining: string;
};

export type PhonTrackRawFallback = {
  walletPhonRealAvailable?: string | null;
  walletPhonBonusAvailable?: string | null;
  /** Legacy single-pool wallet row — maps to real bucket only; bonus stays `0`. */
  walletPhonAvailable?: string | null;
};

export type PhonBonusDisplayFixture = {
  phonBonusAvailableDisplay: string;
  phonRealAvailableDisplay: string;
  wageringRemainingDisplay: string | null;
};

export type PhonBonusDisplayContract = {
  phonBonusAvailableDisplay: string | null;
  phonRealAvailableDisplay: string | null;
  wageringRemainingDisplay: string | null;
  raw: PhonTrackRawValues;
};

/**
 * Resolve raw PHON track values from `rpc_get_phon_balance_breakdown` (+ wallet fallbacks).
 * Forbidden: subtracting bonus from `phon_available` to infer real balance.
 */
export function resolvePhonTrackRawValues(
  breakdown: PhonBalanceBreakdown | null | undefined,
  fallback?: PhonTrackRawFallback,
): PhonTrackRawValues {
  return {
    phonBonusAvailable:
      breakdown?.phon_bonus_available ?? fallback?.walletPhonBonusAvailable ?? '0',
    phonRealAvailable:
      breakdown?.phon_real_available ??
      fallback?.walletPhonRealAvailable ??
      fallback?.walletPhonAvailable ??
      '0',
    wageringRemaining: breakdown?.wagering_remaining ?? '0',
  };
}

export function resolveWageringRemainingDisplay(
  wageringRemainingRaw: string,
  opts?: { showCurrency?: boolean },
): string | null {
  try {
    if (toDecimal(wageringRemainingRaw).lessThanOrEqualTo(0)) return null;
    return formatMoney(wageringRemainingRaw, 'PHON', {
      showCurrency: opts?.showCurrency ?? false,
    });
  } catch {
    return null;
  }
}

/**
 * E8 — bonus/real/wagering display contract (display-only · no client money split).
 * Authority: `rpc_get_phon_balance_breakdown` · migration `20260701000001`.
 */
export function resolvePhonBonusDisplayContract(input: {
  breakdown: PhonBalanceBreakdown | null | undefined;
  fallback?: PhonTrackRawFallback;
  showCurrency?: boolean;
  fixture?: PhonBonusDisplayFixture | null;
  /** Sports hub: omit strip until breakdown RPC resolves. */
  nullWhenMissingBreakdown?: boolean;
}): PhonBonusDisplayContract {
  const raw = resolvePhonTrackRawValues(input.breakdown, input.fallback);

  if (input.fixture) {
    return {
      phonBonusAvailableDisplay: input.fixture.phonBonusAvailableDisplay,
      phonRealAvailableDisplay: input.fixture.phonRealAvailableDisplay,
      wageringRemainingDisplay: input.fixture.wageringRemainingDisplay,
      raw,
    };
  }

  if (input.nullWhenMissingBreakdown && !input.breakdown) {
    return {
      phonBonusAvailableDisplay: null,
      phonRealAvailableDisplay: null,
      wageringRemainingDisplay: null,
      raw,
    };
  }

  const showCurrency = input.showCurrency ?? false;

  return {
    phonBonusAvailableDisplay: formatMoney(raw.phonBonusAvailable, 'PHON', { showCurrency }),
    phonRealAvailableDisplay: formatMoney(raw.phonRealAvailable, 'PHON', { showCurrency }),
    wageringRemainingDisplay: resolveWageringRemainingDisplay(raw.wageringRemaining, {
      showCurrency,
    }),
    raw,
  };
}
