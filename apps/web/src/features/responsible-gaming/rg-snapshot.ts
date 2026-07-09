import { supabase } from '@/lib/supabase';

export type RgLimitRow = {
  limit_kind: string;
  domain: string | null;
  currency: string;
  current_limit: string;
  pending_limit: string | null;
  pending_effective_at: string | null;
};

export type RgExclusionRow = {
  status: string;
  starts_at: string;
  excluded_until: string;
  release_cooldown_until: string | null;
};

export type RgLossRow = {
  domain: string;
  currency: string;
  net_loss: string;
};

export type RgSnapshot = {
  limits: RgLimitRow[];
  exclusions: RgExclusionRow[];
  losses: RgLossRow[];
};

export function monthStartUtc(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export function effectiveRgLimit(row: RgLimitRow, now = Date.now()): string {
  if (
    row.pending_limit &&
    row.pending_effective_at &&
    Date.parse(row.pending_effective_at) <= now
  ) {
    return row.pending_limit;
  }
  return row.current_limit;
}

export function isSelfExclusionActive(row: RgExclusionRow, now = Date.now()): boolean {
  const starts = Date.parse(row.starts_at);
  const excludedUntil = Date.parse(row.excluded_until);
  if (row.status === 'active' || row.status === 'release_requested') {
    return starts <= now && excludedUntil > now;
  }
  if (row.status === 'released' && row.release_cooldown_until) {
    return Date.parse(row.release_cooldown_until) > now;
  }
  return false;
}

export function findRgLimitRow(
  limits: RgLimitRow[],
  limitKind: 'deposit' | 'loss',
  domain: string | null,
  currency: string,
): RgLimitRow | undefined {
  return limits.find(
    (row) =>
      row.limit_kind === limitKind &&
      (row.domain ?? '') === (domain ?? '') &&
      row.currency === currency,
  );
}

export function findRgLossRow(
  losses: RgLossRow[],
  domain: string,
  currency: string,
): RgLossRow | undefined {
  return losses.find((row) => row.domain === domain && row.currency === currency);
}

export async function loadRgSnapshot(userId: string): Promise<RgSnapshot> {
  const month = monthStartUtc();
  const [limitsRes, exclusionsRes, trackingRes] = await Promise.all([
    supabase
      .from('rg_user_limits')
      .select('limit_kind, domain, currency, current_limit, pending_limit, pending_effective_at')
      .eq('user_id', userId),
    supabase
      .from('rg_exclusions')
      .select('status, starts_at, excluded_until, release_cooldown_until')
      .eq('user_id', userId),
    supabase
      .from('rg_loss_tracking')
      .select('domain, currency, net_loss')
      .eq('user_id', userId)
      .eq('month_start', month),
  ]);

  if (limitsRes.error) throw limitsRes.error;
  if (exclusionsRes.error) throw exclusionsRes.error;
  if (trackingRes.error) throw trackingRes.error;

  return {
    limits: (limitsRes.data ?? []) as RgLimitRow[],
    exclusions: (exclusionsRes.data ?? []) as RgExclusionRow[],
    losses: (trackingRes.data ?? []) as RgLossRow[],
  };
}
