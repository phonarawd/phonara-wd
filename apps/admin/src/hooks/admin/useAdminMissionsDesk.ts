import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ADMIN_MISSION_CATALOG_LIST_RPC,
  ADMIN_MISSION_CATALOG_UPSERT_RPC,
  ADMIN_MISSION_CATALOG_WRITE_UI_UNLOCKED,
} from '@/domain/admin-mission-catalog-display-contract';
import {
  buildMissionCatalogUpsertPayload,
  parseMissionCatalogRows,
  type AdminMissionCatalogUpsertInput,
} from '@/product/bridge/parse-admin-missions-config';
import { supabase } from '../../lib/supabase';
import type { UseAdminMissionsDesk } from './useAdminMissionsDeskMock';

export type { UseAdminMissionsDesk } from './useAdminMissionsDeskMock';
export type { AdminMissionCatalogUpsertInput } from '@/product/bridge/parse-admin-missions-config';

const QUERY_KEY = ['admin-mission-catalog'] as const;

/** Engine-backed missions desk — catalog list RPC + upsert write path (E2 · UI unlock = GATE). */
export function useAdminMissionsDesk(): UseAdminMissionsDesk {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc(
        ADMIN_MISSION_CATALOG_LIST_RPC as 'rpc_admin_list_casino_catalog',
      );
      if (error) throw error;
      return parseMissionCatalogRows(rows);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: AdminMissionCatalogUpsertInput) => {
      const { data: result, error } = await supabase.rpc(
        ADMIN_MISSION_CATALOG_UPSERT_RPC as 'rpc_admin_set_casino_game_status',
        {
          p_payload: buildMissionCatalogUpsertPayload(input),
        } as never,
      );
      if (error) throw error;
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const earnLimits = useMemo(() => data?.earnLimits ?? [], [data?.earnLimits]);
  const viralMissions = useMemo(() => data?.viralMissions ?? [], [data?.viralMissions]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const upsertMission = useCallback(
    async (input: AdminMissionCatalogUpsertInput) => {
      if (!ADMIN_MISSION_CATALOG_WRITE_UI_UNLOCKED) {
        throw new Error('ADMIN_MISSIONS_WRITE_UI_LOCKED');
      }
      await upsertMutation.mutateAsync(input);
    },
    [upsertMutation],
  );

  return {
    earnLimits,
    viralMissions,
    isLoading,
    isError,
    isSaving: upsertMutation.isPending,
    writeUiUnlocked: ADMIN_MISSION_CATALOG_WRITE_UI_UNLOCKED,
    refresh,
    upsertMission,
  };
}
