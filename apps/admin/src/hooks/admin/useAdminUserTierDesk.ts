import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ADMIN_SET_EARN_VIP_TIER_RPC,
  ADMIN_TIER_WRITE_UI_UNLOCKED,
} from '@/domain/admin-tier-option-b-display-contract';
import {
  ADMIN_EARN_VIP_TIERS,
  type AdminEarnVipTier,
} from '@/product/bridge/parse-admin-tiers-desk';
import type { MessageKey } from '@phonara/i18n';
import { supabase } from '../../lib/supabase';

const TIER_LABEL_KEYS: Record<AdminEarnVipTier, MessageKey> = {
  bronze: 'admin.tiers.tier.bronze',
  silver: 'admin.tiers.tier.silver',
  gold: 'admin.tiers.tier.gold',
  platinum: 'admin.tiers.tier.platinum',
  diamond: 'admin.tiers.tier.diamond',
  prime_elite: 'admin.tiers.tier.prime_elite',
};

export type AdminUserTierSnapshot = {
  userId: string;
  displayName: string;
  emailMasked: string;
  tier: AdminEarnVipTier | null;
  tierLabelKey: MessageKey | null;
  xp: number | null;
  updatedAt: string | null;
};

export type AdminSetEarnVipTierInput = {
  tier: AdminEarnVipTier;
  reason: string;
  xp?: number | null;
};

function normalizeTier(raw: string | null | undefined): AdminEarnVipTier | null {
  if (!raw) return null;
  const normalized = raw.toLowerCase() as AdminEarnVipTier;
  return ADMIN_EARN_VIP_TIERS.includes(normalized) ? normalized : null;
}

/** Single-member earn VIP read + Option B write path (E4 · UI unlock = GATE). */
export function useAdminUserTierDesk(userId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-user-tier', userId],
    queryFn: async (): Promise<AdminUserTierSnapshot> => {
      const [vipResult, userResult] = await Promise.all([
        supabase
          .from('user_earn_vip' as never)
          .select('tier,xp,updated_at')
          .eq('user_id', userId)
          .maybeSingle(),
        (
          supabase as {
            rpc: (
              fn: string,
              args: Record<string, unknown>,
            ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
          }
        ).rpc('rpc_admin_list_users', { p_search: userId, p_limit: 5 }),
      ]);

      if (vipResult.error) throw vipResult.error;
      if (userResult.error) throw userResult.error;

      const users = (userResult.data ?? []) as Record<string, unknown>[];
      const profile = users.find((row) => String(row['id'] ?? '') === userId) ?? users[0];
      const tier = normalizeTier(
        vipResult.data && typeof vipResult.data === 'object' && 'tier' in vipResult.data
          ? String((vipResult.data as { tier?: string }).tier ?? '')
          : null,
      );

      return {
        userId,
        displayName: String(profile?.['display_name'] ?? '—'),
        emailMasked: String(profile?.['email_masked'] ?? '—'),
        tier,
        tierLabelKey: tier ? TIER_LABEL_KEYS[tier] : null,
        xp:
          vipResult.data && typeof vipResult.data === 'object' && 'xp' in vipResult.data
            ? Number((vipResult.data as { xp?: number }).xp ?? 0)
            : null,
        updatedAt:
          vipResult.data &&
          typeof vipResult.data === 'object' &&
          'updated_at' in vipResult.data &&
          typeof (vipResult.data as { updated_at?: string }).updated_at === 'string'
            ? (vipResult.data as { updated_at: string }).updated_at
            : null,
      };
    },
    staleTime: 15_000,
    enabled: userId.length > 0,
  });

  const setTierMutation = useMutation({
    mutationFn: async (input: AdminSetEarnVipTierInput) => {
      const { error } = await (
        supabase as {
          rpc: (
            fn: string,
            args: Record<string, unknown>,
          ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
        }
      ).rpc(ADMIN_SET_EARN_VIP_TIER_RPC, {
        p_user_id: userId,
        p_tier: input.tier,
        p_reason: input.reason,
        p_xp: input.xp ?? null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-user-tier', userId] });
    },
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const setUserTier = useCallback(
    async (input: AdminSetEarnVipTierInput) => {
      if (!ADMIN_TIER_WRITE_UI_UNLOCKED) {
        throw new Error('ADMIN_TIER_WRITE_UI_LOCKED');
      }
      await setTierMutation.mutateAsync(input);
    },
    [setTierMutation],
  );

  return {
    snapshot: data,
    isLoading,
    isError,
    refresh,
    isSaving: setTierMutation.isPending,
    writeUiUnlocked: ADMIN_TIER_WRITE_UI_UNLOCKED,
    writePathReady: true as const,
    setUserTier,
  };
}
