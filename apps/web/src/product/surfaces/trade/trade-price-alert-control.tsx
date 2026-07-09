import { Bell } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import {
  formatPriceAlertDirectionLabel,
  isValidPriceAlertTarget,
  normalizePriceAlertTargetInput,
} from '@/domain/trade-price-alert-display-contract';
import { formatOraclePriceDisplay } from '@/features/trading/format-oracle-price-display';
import type { MessageKey } from '@phonara/i18n';
import { Button } from '@/product/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/product/primitives/dialog';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import {
  useNotificationStore,
  type PriceAlertConfig,
  type PriceAlertDirection,
} from '@/stores/notifications';

export type TradePriceAlertControlProps = {
  symbol: string;
  /** Display-only last price for form hint — not settlement. */
  currentPrice?: string | null;
  t: (key: MessageKey, params?: Record<string, string>) => string;
  className?: string;
};

export function TradePriceAlertControl({
  symbol,
  currentPrice,
  t,
  className,
}: TradePriceAlertControlProps) {
  const priceAlert = useNotificationStore((state) => state.priceAlert);
  const setPriceAlert = useNotificationStore((state) => state.setPriceAlert);
  const emitNotification = useNotificationStore((state) => state.emitNotification);

  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<PriceAlertDirection>('above');
  const [target, setTarget] = useState('');

  const activeForSymbol = priceAlert?.symbol === symbol && priceAlert.enabled;
  const priceHint = useMemo(() => {
    if (!currentPrice || currentPrice === '0') return null;
    return formatOraclePriceDisplay(currentPrice);
  }, [currentPrice]);

  const resetForm = useCallback(() => {
    if (priceAlert?.symbol === symbol) {
      setDirection(priceAlert.direction);
      setTarget(priceAlert.target);
      return;
    }
    setDirection('above');
    setTarget('');
  }, [priceAlert, symbol]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) resetForm();
    },
    [resetForm],
  );

  const saveAlert = useCallback(() => {
    const normalized = normalizePriceAlertTargetInput(target);
    if (!isValidPriceAlertTarget(normalized)) {
      emitNotification({
        id: `price-alert-invalid:${symbol}`,
        tone: 'warning',
        title: t('notif.priceAlert.invalidTitle'),
        body: t('notif.priceAlert.invalidBody'),
        toastZone: 'strict',
      });
      return;
    }

    const next: PriceAlertConfig = {
      symbol,
      target: normalized,
      direction,
      enabled: true,
      triggered: false,
    };
    setPriceAlert(next);
    emitNotification({
      id: `price-alert-saved:${symbol}:${normalized}`,
      tone: 'success',
      title: t('notif.priceAlert.savedTitle'),
      body: t('notif.priceAlert.savedBody', {
        symbol,
        target: formatOraclePriceDisplay(normalized),
      }),
      prefKey: 'priceAlert',
      toastZone: 'strict',
    });
    setOpen(false);
  }, [direction, emitNotification, setPriceAlert, symbol, t, target]);

  const clearAlert = useCallback(() => {
    if (priceAlert?.symbol === symbol) {
      setPriceAlert(null);
    }
    setTarget('');
    setOpen(false);
  }, [priceAlert, setPriceAlert, symbol]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={activeForSymbol ? 'secondary' : 'ghost'}
          data-testid="trade-price-alert-trigger"
          aria-label={t('notif.priceAlert.formTitle')}
          className={cn('gap-1.5', className)}
        >
          <Bell className="size-4" aria-hidden />
          {activeForSymbol ? (
            <span className="max-w-[8rem] truncate text-xs tabular-nums">
              {t('notif.priceAlert.active', {
                symbol,
                direction: formatPriceAlertDirectionLabel(priceAlert!.direction, t),
                target: formatOraclePriceDisplay(priceAlert!.target),
              })}
            </span>
          ) : (
            <span className="text-xs">{t('notif.priceAlert.formTitle')}</span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent data-testid="trade-price-alert-dialog">
        <DialogHeader>
          <DialogTitle>{t('notif.priceAlert.formTitle')}</DialogTitle>
          <DialogDescription>{t('notif.priceAlert.formDescription')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {priceHint ? (
            <p className="text-foreground-muted m-0 text-sm tabular-nums">
              {t('notif.priceAlert.current', { symbol, price: priceHint })}
            </p>
          ) : null}

          <div className="flex gap-2" role="group" aria-label={t('notif.priceAlert.formTitle')}>
            <Button
              type="button"
              size="sm"
              variant={direction === 'above' ? 'secondary' : 'outline'}
              data-testid="trade-price-alert-direction-above"
              onClick={() => setDirection('above')}
            >
              {t('notif.priceAlert.above')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={direction === 'below' ? 'secondary' : 'outline'}
              data-testid="trade-price-alert-direction-below"
              onClick={() => setDirection('below')}
            >
              {t('notif.priceAlert.below')}
            </Button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-foreground-muted text-xs">
              {t('notif.priceAlert.targetPlaceholder')}
            </span>
            <Input
              inputMode="decimal"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder={t('notif.priceAlert.targetPlaceholder')}
              data-testid="trade-price-alert-target-input"
              aria-label={t('notif.priceAlert.targetPlaceholder')}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="button" data-testid="trade-price-alert-save" onClick={saveAlert}>
              {t('common.save')}
            </Button>
            {activeForSymbol ? (
              <Button
                type="button"
                variant="outline"
                data-testid="trade-price-alert-clear"
                onClick={clearAlert}
              >
                {t('notif.priceAlert.clear')}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
