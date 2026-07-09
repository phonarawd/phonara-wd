import { toDecimal, toFixed } from '@phonara/money';
import type { MessageKey } from '@phonara/i18n';

import {
  effectiveRgLimit,
  findRgLimitRow,
  findRgLossRow,
  isSelfExclusionActive,
  type RgExclusionRow,
  type RgLimitRow,
  type RgLossRow,
} from '@/features/responsible-gaming/rg-snapshot';
import { formatKrwWon, formatMoney } from '@/hooks/use-money';

export type RgLimitFieldView = {
  currentLimit: string | null;
  currentLimitDisplay: string;
  monthUsage: string | null;
  monthUsageDisplay: string | null;
  pendingLimit: string | null;
  pendingLimitDisplay: string | null;
  pendingEffectiveAt: string | null;
  pendingEffectiveAtDisplay: string | null;
};

export function normalizeKrwLimitInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function normalizeUsdtLimitInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, 6)}`;
}

export function normalizeSelfExclusionDaysInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 3);
}

export function depositKrwGateKey(value: string): MessageKey | null {
  const normalized = normalizeKrwLimitInput(value);
  if (!normalized) return 'rg.gate.depositKrw';
  try {
    if (!toDecimal(normalized).greaterThan(0)) return 'rg.gate.depositKrw';
  } catch {
    return 'rg.gate.depositKrw';
  }
  return null;
}

export function lossGameUsdtGateKey(value: string): MessageKey | null {
  const normalized = normalizeUsdtLimitInput(value);
  if (!normalized) return 'rg.gate.lossGameUsdt';
  try {
    if (!toDecimal(normalized).greaterThan(0)) return 'rg.gate.lossGameUsdt';
  } catch {
    return 'rg.gate.lossGameUsdt';
  }
  return null;
}

export function selfExclusionDaysGateKey(value: string): MessageKey | null {
  const normalized = normalizeSelfExclusionDaysInput(value);
  if (!normalized) return 'rg.gate.selfExclusionDays';
  const days = Number.parseInt(normalized, 10);
  if (!Number.isFinite(days) || days < 1 || days > 365) {
    return 'rg.gate.selfExclusionDays';
  }
  return null;
}

export function toRpcKrwAmount(input: string): string {
  return toFixed(toDecimal(normalizeKrwLimitInput(input)), 'KRW');
}

export function toRpcUsdtAmount(input: string): string {
  return toFixed(toDecimal(normalizeUsdtLimitInput(input)), 'USDT');
}

export function formatRgDateTime(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

export function activeSelfExclusionRow(
  exclusions: RgExclusionRow[],
  now = Date.now(),
): RgExclusionRow | null {
  return exclusions.find((row) => isSelfExclusionActive(row, now)) ?? null;
}

export function buildDepositKrwLimitView(limits: RgLimitRow[], locale: string): RgLimitFieldView {
  const row = findRgLimitRow(limits, 'deposit', null, 'KRW');
  const currentLimit = row ? effectiveRgLimit(row) : null;
  const pendingLimit =
    row?.pending_limit &&
    row.pending_effective_at &&
    Date.parse(row.pending_effective_at) > Date.now()
      ? row.pending_limit
      : null;

  return {
    currentLimit,
    currentLimitDisplay: currentLimit ? formatKrwWon(currentLimit) : '—',
    monthUsage: null,
    monthUsageDisplay: null,
    pendingLimit,
    pendingLimitDisplay: pendingLimit ? formatKrwWon(pendingLimit) : null,
    pendingEffectiveAt: row?.pending_effective_at ?? null,
    pendingEffectiveAtDisplay: formatRgDateTime(row?.pending_effective_at, locale),
  };
}

export function buildLossGameUsdtLimitView(
  limits: RgLimitRow[],
  losses: RgLossRow[],
  locale: string,
): RgLimitFieldView {
  const row = findRgLimitRow(limits, 'loss', 'game', 'USDT');
  const lossRow = findRgLossRow(losses, 'game', 'USDT');
  const currentLimit = row ? effectiveRgLimit(row) : null;
  const monthUsage = lossRow?.net_loss ?? null;
  const pendingLimit =
    row?.pending_limit &&
    row.pending_effective_at &&
    Date.parse(row.pending_effective_at) > Date.now()
      ? row.pending_limit
      : null;

  return {
    currentLimit,
    currentLimitDisplay: currentLimit
      ? formatMoney(currentLimit, 'USDT', { showCurrency: true })
      : '—',
    monthUsage,
    monthUsageDisplay: monthUsage ? formatMoney(monthUsage, 'USDT', { showCurrency: true }) : null,
    pendingLimit,
    pendingLimitDisplay: pendingLimit
      ? formatMoney(pendingLimit, 'USDT', { showCurrency: true })
      : null,
    pendingEffectiveAt: row?.pending_effective_at ?? null,
    pendingEffectiveAtDisplay: formatRgDateTime(row?.pending_effective_at, locale),
  };
}

export function selfExclusionUntilIso(daysInput: string): string {
  const days = Number.parseInt(normalizeSelfExclusionDaysInput(daysInput), 10);
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + days);
  return until.toISOString();
}
