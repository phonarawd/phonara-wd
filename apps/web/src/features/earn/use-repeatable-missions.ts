import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { MessageKey } from '@phonara/i18n';
import { useAuth } from '../../contexts/auth-context';
import { translateError } from '../../lib/translate-error';

const earnHubStatusKey = (userId: string) => ['earn-hub-status', userId] as const;

export interface RepeatableMissionItem {
  mission: string;
  progress: number;
  target: number;
  claimed: boolean;
  claimable: boolean;
  reward_phon: string;
}

export interface RepeatableMissionStatus {
  ok: boolean;
  missions: RepeatableMissionItem[];
}

export const repeatableMissionKeys = {
  status: (userId: string | null, lane: string) =>
    ['repeatable-mission-status', userId, lane] as const,
};

export function useRepeatableMissionStatus(lane = 'all') {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const {
    data = null,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: repeatableMissionKeys.status(userId, lane),
    queryFn: async () => {
      const { data: rpcData, error } = await supabase.rpc('rpc_get_repeatable_mission_status', {
        p_lane: lane,
      });
      if (error) throw error;
      return rpcData as unknown as RepeatableMissionStatus;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  return { status: data, loading: isLoading, refetch };
}

export function useRepeatableMissionClaim() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  const claimMission = useCallback(
    async (mission: string, clientRequestId?: string) => {
      if (!session) return null;
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc('rpc_claim_repeatable_mission', {
          p_mission: mission,
          ...(clientRequestId ? { p_client_request_id: clientRequestId } : {}),
        });
        if (rpcError) throw rpcError;
        await qc.invalidateQueries({
          queryKey: repeatableMissionKeys.status(session.user.id, 'all'),
        });
        await qc.invalidateQueries({ queryKey: earnHubStatusKey(session.user.id) });
        return data as unknown as { ok: boolean; phon_awarded: string; mission: string };
      } catch (e) {
        setError(translateError(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session, qc],
  );

  return { claimMission, loading, error };
}

export { REPEATABLE_UI_TO_RPC } from '../../domain/viral-missions-display-contract';
