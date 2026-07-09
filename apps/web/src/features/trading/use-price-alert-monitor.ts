import { useEffect, useRef } from 'react';

import { shouldTriggerPriceAlert } from '@/domain/trade-price-alert-display-contract';
import { formatOraclePriceDisplay } from '@/features/trading/format-oracle-price-display';
import { useMarketTicker } from '@/features/trading/market-store/use-market-ticker';
import { useT } from '@/product/i18n';
import { useNotificationStore } from '@/stores/notifications';

/** Display-only local price alert monitor — uses exchange ticker feed, not oracle settlement. */
export function usePriceAlertMonitor(enabled: boolean): void {
  const t = useT();
  const priceAlert = useNotificationStore((state) => state.priceAlert);
  const emitNotification = useNotificationStore((state) => state.emitNotification);
  const markPriceAlertTriggered = useNotificationStore((state) => state.markPriceAlertTriggered);

  const symbol = priceAlert?.symbol?.toUpperCase() ?? '';
  const ticker = useMarketTicker(symbol || null);
  const lastPrice = ticker.lastPrice;
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [priceAlert?.symbol, priceAlert?.target, priceAlert?.direction, priceAlert?.triggered]);

  useEffect(() => {
    if (!enabled || !priceAlert?.enabled || priceAlert.triggered) return;
    if (!shouldTriggerPriceAlert(lastPrice, priceAlert)) return;
    if (firedRef.current) return;

    firedRef.current = true;
    const dedupId = `price-alert:${priceAlert.symbol}:${priceAlert.target}:${priceAlert.direction}`;
    const targetDisplay = formatOraclePriceDisplay(priceAlert.target);
    const priceDisplay = formatOraclePriceDisplay(lastPrice);

    emitNotification({
      id: dedupId,
      tone: 'info',
      title: t('notif.priceAlert.title'),
      body: t('notif.priceAlert.body', {
        symbol: priceAlert.symbol,
        target: targetDisplay,
        price: priceDisplay,
      }),
      prefKey: 'priceAlert',
      toastZone: 'strict',
    });
    markPriceAlertTriggered(priceAlert.symbol);
  }, [enabled, emitNotification, lastPrice, markPriceAlertTriggered, priceAlert, t]);
}
