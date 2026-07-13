/**
 * `/earn/play` — apptech side-income hub (free roulette).
 * ENGINE:exists — `rpc_spin_roulette` · quota from `rpc_get_earn_hub_status.roulette`.
 * ≠ casino `/games/roulette` (Pixi) — Earn retention only.
 */

import type { MessageKey } from '@phonara/i18n';

import { parseEarnHubRouletteSnapshot } from './home-attendance-display-contract';

export const EARN_PLAY_ROUTE = '/earn/play' as const;
export const EARN_PLAY_ROULETTE_ROUTE = '/earn/play' as const;
export const SPIN_ROULETTE_RPC = 'rpc_spin_roulette' as const;

export const EARN_PLAY_SEO_TITLE_KEY = 'earn.play.head.title' as const satisfies MessageKey;
export const EARN_PLAY_SEO_DESCRIPTION_KEY = 'earn.play.head.desc' as const satisfies MessageKey;

/** Casino game slug must never be linked from this surface. */
export const EARN_PLAY_FORBIDDEN_CASINO_ROUTE = '/games/roulette' as const;

export type EarnPlayRouletteQuota = {
  remaining: number;
  used: number;
  max: number;
};

export type EarnPlaySpinResult = {
  alreadySpun: boolean;
  phonAwarded: string;
  prizeIndex: number;
  seedHash: string | null;
};

export function parseEarnPlayRouletteQuota(
  hubPayload: Record<string, unknown> | null | undefined,
): EarnPlayRouletteQuota | null {
  return parseEarnHubRouletteSnapshot(hubPayload);
}

export function parseEarnPlaySpinResult(
  payload: Record<string, unknown> | null | undefined,
): EarnPlaySpinResult | null {
  if (!payload) return null;
  return {
    alreadySpun: Boolean(payload['already_spun']),
    phonAwarded: String(payload['phon_awarded'] ?? '0'),
    prizeIndex: Number(payload['prize_index'] ?? 0),
    seedHash: payload['seed_hash'] != null ? String(payload['seed_hash']) : null,
  };
}

export function resolveEarnPlaySpinBlocked(params: {
  authenticated: boolean;
  remaining: number;
  spinning: boolean;
}): boolean {
  if (!params.authenticated) return true;
  if (params.spinning) return true;
  return params.remaining <= 0;
}

export function isCasinoRouletteRoute(pathname: string): boolean {
  return pathname === EARN_PLAY_FORBIDDEN_CASINO_ROUTE;
}
