import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/auth-context';
import { translateError } from '../../lib/translate-error';
import type { MessageKey } from '@phonara/i18n';
import { fetchPhonBalanceBreakdown } from '../../domain/phon-balance';

function isVisualFixtureMode(): boolean {
  return false;
}

export const phonBalanceKeys = {
  breakdown: (userId: string | null) => ['phon-balance-breakdown', userId] as const,
};

export function usePhonBalanceBreakdown() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const fixture = isVisualFixtureMode();

  const {
    data,
    isLoading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: phonBalanceKeys.breakdown(userId),
    queryFn: fetchPhonBalanceBreakdown,
    enabled: !!userId && !fixture,
  });

  const breakdown = fixture
    ? {
        ok: true,
        phon_bonus_available: '2345.000000',
        phon_real_available: '10000.000000',
        phon_bonus_locked: '0.000000',
        phon_real_locked: '0.000000',
        phon_available: '12345.000000',
        phon_locked: '0.000000',
        wagering_remaining: '500.000000',
      }
    : data;

  const error: MessageKey | null = rawError ? translateError(rawError) : null;

  return {
    breakdown,
    loading: fixture ? false : isLoading,
    error,
    refetch,
    wageringProgressDisplay: null,
  };
}
