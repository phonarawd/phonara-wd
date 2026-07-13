import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callRpc } from '../../lib/rpc';
import type { MessageKey } from '@phonara/i18n';
import { useAuth } from '../../contexts/auth-context';
import { translateError } from '../../lib/translate-error';

export interface ViralMissionItem {
  mission: string;
  used: number;
  max: number;
  remaining: number;
  window: string;
  reward_phon: string;
}

export interface ViralMissionStatus {
  ok: boolean;
  missions: ViralMissionItem[];
  streak_days: number;
  streak_target_days: number;
}

export interface ViralClaimResult {
  ok: boolean;
  claim_id: string;
  mission: string;
  phon_awarded: string;
  used: number;
  max: number;
  window_key: string;
}

export const viralMissionKeys = {
  status: (userId: string | null) => ['viral-mission-status', userId] as const,
};

export function useViralMissionStatus() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const {
    data = null,
    isLoading: loading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: viralMissionKeys.status(userId),
    queryFn: async () => {
      const rpcData = await callRpc('rpc_get_viral_mission_status');
      return rpcData as unknown as ViralMissionStatus;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const error: MessageKey | null = rawError ? translateError(rawError) : null;
  return { status: data, loading, error, refetch };
}

export function useViralMissionClaim() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ViralClaimResult | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  const claimViralMission = useCallback(
    async (mission: string, clientRequestId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await callRpc('rpc_claim_viral_mission', {
          p_mission: mission,
          p_client_request_id: clientRequestId,
        });
        const claimed = data as unknown as ViralClaimResult;
        setResult(claimed);
        void qc.invalidateQueries({ queryKey: viralMissionKeys.status(userId) });
        return claimed;
      } catch (err) {
        setError(translateError(err, 'error.UNKNOWN'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [qc, userId],
  );

  return { claimViralMission, result, loading, error };
}
