import { useCallback, useEffect, useState } from 'react';

import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';

const STORAGE_KEY_PREFIX = 'phonara:trade:house-counterparty-ack:v1:';

export type HouseCounterpartyAcknowledgement = {
  acknowledged: boolean;
  acknowledge: () => Promise<boolean>;
  busy: boolean;
  error: MessageKey | null;
  loading: boolean;
};

function readStoredAck(userId: string | null): boolean {
  if (!userId || typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) === '1';
  } catch {
    return false;
  }
}

/** One-time per-user ack — same surface contract as `useTradingRiskAcknowledgement` (P2-D). */
export function useHouseCounterpartyAcknowledgement(): HouseCounterpartyAcknowledgement {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAcknowledged(readStoredAck(userId));
    setLoading(false);
  }, [userId]);

  const acknowledge = useCallback(async () => {
    if (!userId) return false;
    setBusy(true);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, '1');
      setAcknowledged(true);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, [userId]);

  return { acknowledged, acknowledge, busy, error: null, loading };
}
