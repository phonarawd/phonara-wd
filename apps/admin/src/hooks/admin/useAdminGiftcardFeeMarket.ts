import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export type GiftcardFeeMarketKind = 'culture' | 'happy' | 'book' | 'department' | 'mobile' | 'game';

export type AdminGiftcardFeeMarketRow = {
  id: string;
  kind: GiftcardFeeMarketKind;
  providerName: string;
  giftcardType: string;
  payoutRateBps: number;
  percentFeeBps: number;
  fixedFeeKrw: string;
  minFaceValueKrw: string;
  maxFaceValueKrw: string;
  slaMinutes: number;
  evidenceUrl: string | null;
  lastCheckedAt: string;
  enabled: boolean;
  isStale: boolean;
  updatedAt: string;
};

export type GiftcardFeeMarketUpsertInput = {
  kind: GiftcardFeeMarketKind;
  providerName: string;
  giftcardType: string;
  payoutRateBps: number;
  percentFeeBps: number;
  fixedFeeKrw: string;
  minFaceValueKrw: string;
  maxFaceValueKrw: string;
  slaMinutes: number;
  evidenceUrl: string;
  lastCheckedAt: string;
  enabled: boolean;
};

type EngineRow = {
  id: string;
  kind: string;
  provider_name: string;
  giftcard_type: string;
  payout_rate_bps: number;
  percent_fee_bps: number;
  fixed_fee_krw: string;
  min_face_value_krw: string;
  max_face_value_krw: string;
  sla_minutes: number;
  evidence_url: string | null;
  last_checked_at: string;
  enabled: boolean;
  is_stale: boolean;
  updated_at: string;
};

function mapRow(row: EngineRow): AdminGiftcardFeeMarketRow {
  return {
    id: row.id,
    kind: row.kind as GiftcardFeeMarketKind,
    providerName: row.provider_name,
    giftcardType: row.giftcard_type,
    payoutRateBps: row.payout_rate_bps,
    percentFeeBps: row.percent_fee_bps,
    fixedFeeKrw: row.fixed_fee_krw,
    minFaceValueKrw: row.min_face_value_krw,
    maxFaceValueKrw: row.max_face_value_krw,
    slaMinutes: row.sla_minutes,
    evidenceUrl: row.evidence_url,
    lastCheckedAt: row.last_checked_at,
    enabled: row.enabled,
    isStale: row.is_stale,
    updatedAt: row.updated_at,
  };
}

function parseEngineRows(data: unknown): AdminGiftcardFeeMarketRow[] {
  if (!Array.isArray(data)) return [];
  return data.map((raw) => {
    const row = raw as Record<string, unknown>;
    return mapRow({
      id: String(row['id']),
      kind: String(row['kind']),
      provider_name: String(row['provider_name']),
      giftcard_type: String(row['giftcard_type']),
      payout_rate_bps: Number(row['payout_rate_bps']),
      percent_fee_bps: Number(row['percent_fee_bps']),
      fixed_fee_krw: String(row['fixed_fee_krw']),
      min_face_value_krw: String(row['min_face_value_krw']),
      max_face_value_krw: String(row['max_face_value_krw']),
      sla_minutes: Number(row['sla_minutes']),
      evidence_url: row['evidence_url'] == null ? null : String(row['evidence_url']),
      last_checked_at: String(row['last_checked_at']),
      enabled: Boolean(row['enabled']),
      is_stale: Boolean(row['is_stale']),
      updated_at: String(row['updated_at']),
    });
  });
}

export function useAdminGiftcardFeeMarket() {
  const qc = useQueryClient();

  const {
    data: rows = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-giftcard-fee-market'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_admin_list_giftcard_fee_market');
      if (error) throw error;
      return parseEngineRows(data);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: GiftcardFeeMarketUpsertInput) => {
      const { data, error } = await supabase.rpc('rpc_admin_upsert_giftcard_fee_market', {
        p_payload: {
          kind: input.kind,
          provider_name: input.providerName,
          giftcard_type: input.giftcardType,
          payout_rate_bps: input.payoutRateBps,
          percent_fee_bps: input.percentFeeBps,
          fixed_fee_krw: input.fixedFeeKrw,
          min_face_value_krw: input.minFaceValueKrw,
          max_face_value_krw: input.maxFaceValueKrw,
          sla_minutes: input.slaMinutes,
          evidence_url: input.evidenceUrl,
          last_checked_at: input.lastCheckedAt,
          enabled: input.enabled,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-giftcard-fee-market'] });
    },
  });

  const saveRow = useCallback(
    async (input: GiftcardFeeMarketUpsertInput) => {
      await upsertMutation.mutateAsync(input);
    },
    [upsertMutation],
  );

  return {
    rows,
    isLoading,
    isSaving: upsertMutation.isPending,
    refetch,
    saveRow,
  };
}
