import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import {
  type AdminViralCommissionAggregate,
  type AdminViralMissionClaimAggregate,
  type AdminViralReferralSnapshot,
  type AdminViralStatsPartialFlags,
} from '@/product/bridge/parse-admin-viral-stats';
import { supabase } from '../../lib/supabase';
import type { UseAdminViralStatsDesk } from './useAdminViralStatsDeskMock';

export type { UseAdminViralStatsDesk } from './useAdminViralStatsDeskMock';

const QUERY_KEY = ['admin-viral-stats'] as const;

const VIRAL_MISSION_LABEL_KEYS: Record<string, MessageKey> = {
  share_referral_link: 'admin.missions.viral.shareReferralLink',
  share_story_template: 'admin.missions.viral.shareStoryTemplate',
  invite_friend_signup: 'admin.missions.viral.inviteFriendSignup',
  affiliate_content_post: 'admin.missions.viral.affiliateContentPost',
  viral_streak_share: 'admin.missions.viral.streakShare',
};

type ViralAnalyticsRpc = {
  ok?: boolean;
  referrals?: {
    total?: number;
    unique_referrers?: number;
    recent_7d?: number;
  };
  affiliate_links?: {
    total?: number;
    unique_parents?: number;
    recent_7d?: number;
  };
  viral_missions?: Array<{
    mission?: string;
    claim_count?: number;
    phon_awarded_total?: string;
  }>;
  commissions?: Array<{
    domain?: string;
    currency?: string;
    gross_revenue_total?: string;
    latest_date?: string;
    row_count?: number;
  }>;
  share_events_available?: boolean;
};

function missionLabelKey(mission: string): MessageKey {
  return VIRAL_MISSION_LABEL_KEYS[mission] ?? 'admin.viralStats.mission.unknown';
}

/** Engine-backed viral stats desk — E3 `rpc_admin_get_viral_analytics` (full aggregates). */
export function useAdminViralStatsDesk(): UseAdminViralStatsDesk {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data: raw, error } = await (
        supabase as {
          rpc: (fn: string, args?: Record<string, unknown>) => ReturnType<typeof supabase.rpc>;
        }
      ).rpc('rpc_admin_get_viral_analytics');
      if (error) throw error;
      return (raw ?? {}) as ViralAnalyticsRpc;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const referralSnapshot = useMemo((): AdminViralReferralSnapshot => {
    const affiliate = data?.affiliate_links;
    const referrals = data?.referrals;
    return {
      totalLinks: Number(affiliate?.total ?? referrals?.total ?? 0),
      uniqueAffiliates: Number(affiliate?.unique_parents ?? referrals?.unique_referrers ?? 0),
      recentLinks: Number(affiliate?.recent_7d ?? referrals?.recent_7d ?? 0),
    };
  }, [data?.affiliate_links, data?.referrals]);

  const missionClaims = useMemo((): AdminViralMissionClaimAggregate[] => {
    return (data?.viral_missions ?? []).map((row) => ({
      mission: String(row.mission ?? ''),
      labelKey: missionLabelKey(String(row.mission ?? '')),
      claimCount: Number(row.claim_count ?? 0),
      phonAwardedTotal: String(row.phon_awarded_total ?? '0.000000'),
    }));
  }, [data?.viral_missions]);

  const commissionAggregates = useMemo((): AdminViralCommissionAggregate[] => {
    return (data?.commissions ?? []).map((row) => ({
      domain: String(row.domain ?? ''),
      currency: String(row.currency ?? ''),
      grossRevenueTotal: String(row.gross_revenue_total ?? '0'),
      latestDate: String(row.latest_date ?? ''),
      rowCount: Number(row.row_count ?? 0),
    }));
  }, [data?.commissions]);

  const partialFlags = useMemo((): AdminViralStatsPartialFlags => {
    // E3 RPC returns full aggregates — truncation flags stay false.
    return {
      relationshipsTruncated: false,
      claimsTruncated: false,
      commissionsTruncated: false,
    };
  }, []);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    referralSnapshot,
    missionClaims,
    commissionAggregates,
    partialFlags,
    shareEventsAvailable: data?.share_events_available === true,
    isLoading,
    isError,
    refresh,
  };
}
