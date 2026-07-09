import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { listExceptionQueueRaw } from '@/domain/ops';
import { runQueueAction } from '@/domain/queues';

export interface AdminReviewQueueItem {
  id: string;
  itemType: string;
  entityType: string;
  entityId: string;
  userId: string;
  status: string;
  reason: string | null;
  slaDueAt: string | null;
  createdAt: string;
}

function parseReviewQueueItems(raw: unknown): AdminReviewQueueItem[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];

  return items.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const record = row as Record<string, unknown>;
    const id = typeof record['id'] === 'string' ? record['id'] : null;
    if (!id) return [];
    return [
      {
        id,
        itemType: typeof record['item_type'] === 'string' ? record['item_type'] : '—',
        entityType: typeof record['entity_type'] === 'string' ? record['entity_type'] : '—',
        entityId: typeof record['entity_id'] === 'string' ? record['entity_id'] : '—',
        userId: typeof record['user_id'] === 'string' ? `${record['user_id'].slice(0, 8)}…` : '—',
        status: typeof record['status'] === 'string' ? record['status'] : 'pending',
        reason: typeof record['reason'] === 'string' ? record['reason'] : null,
        slaDueAt: typeof record['sla_due_at'] === 'string' ? record['sla_due_at'] : null,
        createdAt: typeof record['created_at'] === 'string' ? record['created_at'] : '—',
      },
    ];
  });
}

const MIN_REASON = 4;

/** Engine-backed general admin review queue (`rpc_admin_list_exception_queue`). */
export function useAdminReviewQueue() {
  const qc = useQueryClient();

  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-review-queue'],
    queryFn: async () => {
      const raw = await listExceptionQueueRaw('admin_review', 100);
      return parseReviewQueueItems(raw);
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15_000,
  });

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin-review-queue'] });
    await refetch();
  }, [qc, refetch]);

  const resolveItem = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'resolveQueue', id }, reason.trim());
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  return {
    items,
    isLoading,
    refetch,
    resolveItem,
  };
}
