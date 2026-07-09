/**
 * Trade feedback SSOT — Phase 2B P2-9~10.
 * Single exit for spot · futures · staking money-action toasts (strict zone only).
 */

import { translate, type Locale, type MessageKey } from '@phonara/i18n';

import {
  findTradeToastRegistryRow,
  resolveTradeToastI18nKey,
  type TradeToastCta,
  type TradeToastEventId,
} from '@/domain/trade-toast-display-contract';
import { productToast } from '@/product/primitives/toast-zone';
import { WEB_LOCALE_STORAGE_KEY } from '@/product/i18n/constants';

import { mapTradeRpcErrorKey } from './trade-rpc-error-display';

export type TradeFeedbackSuccessEvent = {
  eventId: Exclude<TradeToastEventId, 'trade.rpc.error' | 'trade.submit.blocked'>;
  values?: Record<string, string | number>;
  dedupId?: string;
  /** When outcome copy differs from registry default (e.g. partial close ratios). */
  i18nKeyOverride?: MessageKey;
};

export type TradeFeedbackRpcErrorEvent = {
  eventId: 'trade.rpc.error';
  error?: unknown;
  errorKey?: MessageKey;
  dedupId?: string;
};

export type TradeFeedbackEvent = TradeFeedbackSuccessEvent | TradeFeedbackRpcErrorEvent;

function readLocale(): Locale {
  if (typeof window === 'undefined') return 'ko';
  const stored = window.localStorage.getItem(WEB_LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'ko';
}

/** Dedup id pattern — mirrors deposit-realtime-notify (`entityId:event`). */
export function tradeFeedbackDedupId(eventId: TradeToastEventId, entityId?: string): string {
  return entityId ? `trade:${eventId}:${entityId}` : `trade:${eventId}`;
}

function resolveTradeToastCta(cta: TradeToastCta): {
  labelKey: MessageKey;
  onClick: () => void;
} {
  switch (cta) {
    case 'orders':
      return {
        labelKey: 'trade.subnav.orders',
        onClick: () => {
          window.location.assign('/trade/orders');
        },
      };
    case 'positions':
      return {
        labelKey: 'trade.subnav.positions',
        onClick: () => {
          window.location.assign('/trade/positions');
        },
      };
    case 'wallet':
      return {
        labelKey: 'wallet.title',
        onClick: () => {
          window.location.assign('/wallet');
        },
      };
  }
}

/** Shows strict trade desk feedback through productToast (single exit). */
export function showTradeFeedback(event: TradeFeedbackEvent): void {
  if (event.eventId === 'trade.rpc.error') {
    const errorKey = event.errorKey ?? mapTradeRpcErrorKey(event.error);
    const dedupId = event.dedupId ?? tradeFeedbackDedupId('trade.rpc.error', errorKey);
    productToast.showText({
      zone: 'strict',
      title: translate(readLocale(), errorKey),
      tone: 'error',
      id: dedupId,
    });
    return;
  }

  const key = resolveTradeToastI18nKey(event.eventId, event.i18nKeyOverride);
  const dedupId = event.dedupId;
  const registryRow = findTradeToastRegistryRow(event.eventId);
  const action = registryRow?.cta ? resolveTradeToastCta(registryRow.cta) : undefined;

  if (dedupId) {
    productToast.show({
      zone: 'strict',
      key,
      values: event.values,
      id: dedupId,
      action,
    });
    return;
  }

  productToast.show({
    zone: 'strict',
    key,
    values: event.values,
    action,
  });
}

/** Convenience for hook layers that already resolved MessageKey errors. */
export function showTradeRpcErrorFeedback(errorKey: MessageKey, dedupId?: string): void {
  showTradeFeedback({
    eventId: 'trade.rpc.error',
    errorKey,
    dedupId,
  });
}
