import type { MessageKey } from '@phonara/i18n';
import { Decimal } from '@phonara/money';

export type AffiliateRelationshipReadRow = {
  parent_id: string;
  created_at: string;
};

export type ViralMissionClaimReadRow = {
  mission: string;
  phon_awarded: string;
  claimed_at: string;
};

export type CommissionAggregateReadRow = {
  domain: string;
  currency: string;
  gross_revenue: string;
  aggregate_date: string;
};

export type AdminViralReferralSnapshot = {
  totalLinks: number;
  uniqueAffiliates: number;
  recentLinks: number;
};

export type AdminViralMissionClaimAggregate = {
  mission: string;
  labelKey: MessageKey;
  claimCount: number;
  phonAwardedTotal: string;
};

export type AdminViralCommissionAggregate = {
  domain: string;
  currency: string;
  grossRevenueTotal: string;
  latestDate: string;
  rowCount: number;
};

export type AdminViralStatsPartialFlags = {
  relationshipsTruncated: boolean;
  claimsTruncated: boolean;
  commissionsTruncated: boolean;
};

const VIRAL_MISSION_LABEL_KEYS: Record<string, MessageKey> = {
  share_referral_link: 'admin.missions.viral.shareReferralLink',
  share_story_template: 'admin.missions.viral.shareStoryTemplate',
  invite_friend_signup: 'admin.missions.viral.inviteFriendSignup',
  affiliate_content_post: 'admin.missions.viral.affiliateContentPost',
  viral_streak_share: 'admin.missions.viral.streakShare',
};

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function missionLabelKey(mission: string): MessageKey {
  return VIRAL_MISSION_LABEL_KEYS[mission] ?? 'admin.viralStats.mission.unknown';
}

function sumDecimalStrings(values: string[]): string {
  let total = new Decimal(0);
  for (const value of values) {
    try {
      total = total.add(new Decimal(value));
    } catch {
      continue;
    }
  }
  return total.toFixed(6);
}

/** Referral link counts from `affiliate_relationships` (admin-readable proxy for referrals). */
export function parseReferralSnapshot(
  rows: AffiliateRelationshipReadRow[],
  totalLinks: number,
): AdminViralReferralSnapshot {
  const parentIds = new Set<string>();
  const cutoff = Date.now() - RECENT_WINDOW_MS;
  let recentLinks = 0;

  for (const row of rows) {
    parentIds.add(row.parent_id);
    const createdAt = Date.parse(row.created_at);
    if (!Number.isNaN(createdAt) && createdAt >= cutoff) {
      recentLinks += 1;
    }
  }

  return {
    totalLinks,
    uniqueAffiliates: parentIds.size,
    recentLinks,
  };
}

/** Viral mission claim aggregates from `viral_mission_claims` (partial sample). */
export function parseViralMissionClaimAggregates(
  rows: ViralMissionClaimReadRow[],
): AdminViralMissionClaimAggregate[] {
  const grouped = new Map<string, { count: number; amounts: string[] }>();

  for (const row of rows) {
    const bucket = grouped.get(row.mission) ?? { count: 0, amounts: [] };
    bucket.count += 1;
    bucket.amounts.push(row.phon_awarded);
    grouped.set(row.mission, bucket);
  }

  return [...grouped.entries()]
    .map(([mission, bucket]) => ({
      mission,
      labelKey: missionLabelKey(mission),
      claimCount: bucket.count,
      phonAwardedTotal: sumDecimalStrings(bucket.amounts),
    }))
    .sort((a, b) => b.claimCount - a.claimCount);
}

/** Commission daily aggregate rollups by domain and currency (partial sample). */
export function parseCommissionAggregates(
  rows: CommissionAggregateReadRow[],
): AdminViralCommissionAggregate[] {
  const grouped = new Map<
    string,
    { domain: string; currency: string; amounts: string[]; latestDate: string; rowCount: number }
  >();

  for (const row of rows) {
    const key = `${row.domain}:${row.currency}`;
    const bucket = grouped.get(key) ?? {
      domain: row.domain,
      currency: row.currency,
      amounts: [],
      latestDate: row.aggregate_date,
      rowCount: 0,
    };
    bucket.amounts.push(row.gross_revenue);
    bucket.rowCount += 1;
    if (row.aggregate_date > bucket.latestDate) {
      bucket.latestDate = row.aggregate_date;
    }
    grouped.set(key, bucket);
  }

  return [...grouped.values()]
    .map((bucket) => ({
      domain: bucket.domain,
      currency: bucket.currency,
      grossRevenueTotal: sumDecimalStrings(bucket.amounts),
      latestDate: bucket.latestDate,
      rowCount: bucket.rowCount,
    }))
    .sort((a, b) => b.latestDate.localeCompare(a.latestDate));
}

export function buildPartialFlags(input: {
  relationshipRows: number;
  relationshipLimit: number;
  claimRows: number;
  claimLimit: number;
  commissionRows: number;
  commissionLimit: number;
}): AdminViralStatsPartialFlags {
  return {
    relationshipsTruncated: input.relationshipRows >= input.relationshipLimit,
    claimsTruncated: input.claimRows >= input.claimLimit,
    commissionsTruncated: input.commissionRows >= input.commissionLimit,
  };
}
