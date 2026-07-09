/**
 * `/share/earnings` — earnings proof share card · canvas OG · Web Share (plan §18.2).
 * ENGINE:partial — today tap earnings from `rpc_get_golden_earth_status.earned_phon_today`;
 * tier from `rpc_get_earn_hub_status`. No client reward math.
 */

import type { MessageKey } from '@phonara/i18n';

import { BRAND_AXIS_COLORS, BRAND_CORE, BRAND_INK_DARK } from './brand-display-contract';
import {
  canUseWebShare,
  isReferralShareAbortError,
  REFERRAL_WEB_SHARE_MISSION_RPC,
  type ReferralShareMissionSnapshot,
} from './referral-invite-display-contract';
import { parseEarnHubTierSnapshot, type EarnHubTierSnapshot } from './tier-me-display-contract';
import { formatPhonRewardDisplay } from './viral-missions-display-contract';

export { canUseWebShare, isReferralShareAbortError, REFERRAL_WEB_SHARE_MISSION_RPC };

export const SHARE_EARNINGS_ROUTE = '/share/earnings' as const;

export const SHARE_EARNINGS_ENGINE_RPC = {
  hubStatus: 'rpc_get_earn_hub_status',
  goldenEarth: 'rpc_get_golden_earth_status',
} as const;

export const SHARE_EARNINGS_STREAK_MISSION_RPC = 'viral_streak_share' as const;

export const SHARE_EARNINGS_SEO_TITLE_KEY =
  'seo.share.earnings.title' as const satisfies MessageKey;
export const SHARE_EARNINGS_SEO_DESCRIPTION_KEY =
  'seo.share.earnings.description' as const satisfies MessageKey;

export const SHARE_EARNINGS_CANVAS = {
  width: 1200,
  height: 630,
} as const;

export type ShareEarningsTodaySnapshot = {
  earnedPhonToday: string | null;
  loginStreak: number;
};

export type ShareEarningsStreakMissionSnapshot = {
  rewardPhon: string | null;
  used: number;
  max: number;
  remaining: number;
  canClaim: boolean;
  streakDays: number;
  streakTargetDays: number;
};

export type ShareEarningsCardView = {
  tier: EarnHubTierSnapshot;
  today: ShareEarningsTodaySnapshot;
  earningsLabel: string;
  tierLabelKey: MessageKey;
};

export type ShareEarningsCanvasLabels = {
  headline: string;
  todayLabel: string;
  tierLabel: string;
  tierName: string;
  earningsDisplay: string;
  streakLine: string | null;
  footer: string;
  disclosure: string;
};

export type ShareEarningsSharePayload = {
  title: string;
  text: string;
  url: string;
};

export function parseShareEarningsTodaySnapshot(
  payload: Record<string, unknown> | null | undefined,
): ShareEarningsTodaySnapshot {
  const earnedRaw = payload?.['earned_phon_today'];
  const earnedPhonToday =
    typeof earnedRaw === 'string' && earnedRaw.trim() ? earnedRaw.trim() : null;
  const streakRaw = payload?.['login_streak'];
  const loginStreak = Number.isFinite(Number(streakRaw)) ? Number(streakRaw) : 0;

  return { earnedPhonToday, loginStreak };
}

export function resolveShareEarningsCardView(
  hubPayload: Record<string, unknown> | null | undefined,
  goldenEarthPayload: Record<string, unknown> | null | undefined,
): ShareEarningsCardView | null {
  const tier = parseEarnHubTierSnapshot(hubPayload);
  if (!tier) return null;

  const today = parseShareEarningsTodaySnapshot(goldenEarthPayload);
  const earningsLabel = today.earnedPhonToday
    ? formatPhonRewardDisplay(today.earnedPhonToday)
    : formatPhonRewardDisplay('0');

  return {
    tier,
    today,
    earningsLabel,
    tierLabelKey: `earn.tier.${tier.tier}` as MessageKey,
  };
}

export function resolveShareEarningsStreakMissionSnapshot(
  missions:
    | ReadonlyArray<{
        mission: string;
        used: number;
        max: number;
        remaining: number;
        reward_phon: string;
      }>
    | undefined,
  streakDays: number,
  streakTargetDays = 7,
): ShareEarningsStreakMissionSnapshot {
  const row = missions?.find((mission) => mission.mission === SHARE_EARNINGS_STREAK_MISSION_RPC);
  if (!row) {
    return {
      rewardPhon: null,
      used: 0,
      max: 0,
      remaining: 0,
      canClaim: false,
      streakDays,
      streakTargetDays,
    };
  }

  const eligible = streakDays >= streakTargetDays && (row.remaining ?? 0) > 0;

  return {
    rewardPhon: row.reward_phon ?? null,
    used: row.used ?? 0,
    max: row.max ?? 0,
    remaining: row.remaining ?? 0,
    canClaim: eligible,
    streakDays,
    streakTargetDays,
  };
}

export function resolveReferralShareMissionFromRows(
  missions:
    | ReadonlyArray<{
        mission: string;
        used: number;
        max: number;
        remaining: number;
        reward_phon: string;
      }>
    | undefined,
): ReferralShareMissionSnapshot {
  const row = missions?.find((mission) => mission.mission === REFERRAL_WEB_SHARE_MISSION_RPC);
  if (!row) {
    return { rewardPhon: null, used: 0, max: 0, remaining: 0, canClaim: false };
  }
  return {
    rewardPhon: row.reward_phon ?? null,
    used: row.used ?? 0,
    max: row.max ?? 0,
    remaining: row.remaining ?? 0,
    canClaim: (row.remaining ?? 0) > 0,
  };
}

export function buildShareEarningsSharePayload(input: {
  shareTitle: string;
  shareText: string;
  inviteUrl: string;
}): ShareEarningsSharePayload {
  return {
    title: input.shareTitle,
    text: input.shareText,
    url: input.inviteUrl,
  };
}

export function canShareImageFiles(files: File[]): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') {
    return false;
  }
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

export function drawShareEarningsCard(
  ctx: CanvasRenderingContext2D,
  input: ShareEarningsCanvasLabels,
): void {
  const { width, height } = SHARE_EARNINGS_CANVAS;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0d0f14');
  gradient.addColorStop(0.55, '#151822');
  gradient.addColorStop(1, '#1a1030');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = BRAND_AXIS_COLORS.earn;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.2, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = BRAND_CORE;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, width - 64, height - 64);
  ctx.globalAlpha = 1;

  ctx.fillStyle = BRAND_INK_DARK;
  ctx.font = '600 28px Pretendard, system-ui, sans-serif';
  ctx.fillText(input.headline, 72, 96);

  ctx.fillStyle = 'rgba(240, 242, 245, 0.72)';
  ctx.font = '500 22px Pretendard, system-ui, sans-serif';
  ctx.fillText(input.todayLabel, 72, 200);

  ctx.fillStyle = BRAND_AXIS_COLORS.earn;
  ctx.font = '700 72px Pretendard, system-ui, sans-serif';
  ctx.fillText(input.earningsDisplay, 72, 290);

  ctx.fillStyle = 'rgba(240, 242, 245, 0.72)';
  ctx.font = '500 22px Pretendard, system-ui, sans-serif';
  ctx.fillText(input.tierLabel, 72, 360);

  ctx.fillStyle = BRAND_INK_DARK;
  ctx.font = '600 36px Pretendard, system-ui, sans-serif';
  ctx.fillText(input.tierName, 72, 410);

  if (input.streakLine) {
    ctx.fillStyle = 'rgba(240, 242, 245, 0.65)';
    ctx.font = '500 20px Pretendard, system-ui, sans-serif';
    ctx.fillText(input.streakLine, 72, 460);
  }

  ctx.fillStyle = 'rgba(240, 242, 245, 0.55)';
  ctx.font = '400 18px Pretendard, system-ui, sans-serif';
  ctx.fillText(input.footer, 72, height - 96);

  ctx.fillStyle = 'rgba(240, 242, 245, 0.45)';
  ctx.font = '400 16px Pretendard, system-ui, sans-serif';
  wrapCanvasText(ctx, input.disclosure, 72, height - 64, width - 144, 22);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(/\s+/);
  let line = '';
  let cursorY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

export async function renderShareEarningsCanvasBlob(
  labels: ShareEarningsCanvasLabels,
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = SHARE_EARNINGS_CANVAS.width;
  canvas.height = SHARE_EARNINGS_CANVAS.height;

  let ctx: CanvasRenderingContext2D | null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    return null;
  }
  if (!ctx) return null;

  drawShareEarningsCard(ctx, labels);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
