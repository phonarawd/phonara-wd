import { toDecimal } from '@phonara/money';

import type { PriceAlertConfig, PriceAlertDirection } from '@/stores/notifications';

/** Display-only price alert evaluation — not settlement input. */
export function isValidPriceAlertTarget(target: string): boolean {
  try {
    return toDecimal(target).greaterThan(0);
  } catch {
    return false;
  }
}

export function formatPriceAlertDirectionLabel(
  direction: PriceAlertDirection,
  t: (key: 'notif.priceAlert.above' | 'notif.priceAlert.below') => string,
): string {
  return direction === 'above' ? t('notif.priceAlert.above') : t('notif.priceAlert.below');
}

/** Returns true when display feed price crosses the configured alert threshold. */
export function shouldTriggerPriceAlert(
  currentPrice: string | null | undefined,
  alert: PriceAlertConfig | null,
): boolean {
  if (!alert?.enabled || alert.triggered) return false;
  if (!currentPrice || !isValidPriceAlertTarget(alert.target)) return false;

  try {
    const current = toDecimal(currentPrice);
    const target = toDecimal(alert.target);
    if (current.lessThanOrEqualTo(0)) return false;

    if (alert.direction === 'above') {
      return current.greaterThanOrEqualTo(target);
    }
    return current.lessThanOrEqualTo(target);
  } catch {
    return false;
  }
}

/** Normalize user-entered target for local alert storage (display-only). */
export function normalizePriceAlertTargetInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return toDecimal(trimmed).toFixed();
  } catch {
    return trimmed;
  }
}
