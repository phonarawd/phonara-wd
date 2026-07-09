import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isGreaterThanOrEqual, money } from '@phonara/money';

export type RGIntent = 'place_bet';
export type RGReason = 'self_exclusion' | 'daily_loss_limit';
export type RGPolicy = (intent: RGIntent) => Promise<RGReason | null>;
import { useAuth } from '../../contexts/auth-context';
import {
  effectiveRgLimit,
  findRgLimitRow,
  findRgLossRow,
  isSelfExclusionActive,
  loadRgSnapshot,
  type RgLimitRow,
  type RgLossRow,
} from './rg-snapshot';

function isGameLossLimitReached(
  limits: RgLimitRow[],
  losses: RgLossRow[],
  currency: 'PHON' | 'USDT',
): boolean {
  const limitRow = findRgLimitRow(limits, 'loss', 'game', currency);
  if (!limitRow) {
    return false;
  }
  const lossRow = findRgLossRow(losses, 'game', currency);
  const netLoss = lossRow?.net_loss ?? '0';
  const cap = effectiveRgLimit(limitRow);
  return isGreaterThanOrEqual(money(netLoss, currency), money(cap, currency));
}

/** Read-only RG policy for in-game gating — mirrors server entry guards where user data is visible. */
export function useRgGatePolicy(): RGPolicy {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const { data } = useQuery({
    queryKey: ['rg-gate-snapshot', userId],
    queryFn: () => loadRgSnapshot(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  return useCallback(
    async (intent: RGIntent): Promise<RGReason | null> => {
      if (!userId) {
        return null;
      }

      const snapshot = data ?? (await loadRgSnapshot(userId));

      if (snapshot.exclusions.some((row) => isSelfExclusionActive(row))) {
        return 'self_exclusion';
      }

      if (intent === 'place_bet') {
        if (isGameLossLimitReached(snapshot.limits, snapshot.losses, 'USDT')) {
          return 'daily_loss_limit';
        }
        if (isGameLossLimitReached(snapshot.limits, snapshot.losses, 'PHON')) {
          return 'daily_loss_limit';
        }
        return null;
      }

      return null;
    },
    [data, userId],
  );
}
