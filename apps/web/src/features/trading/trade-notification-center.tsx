import { useEffect, useState } from 'react';
import type { MessageKey } from '@phonara/i18n';
import { Badge, Button, Card, Input, SegmentedControl, formatMoney } from '@phonara/ui';
import type { FuturesMarket } from '../../hooks/use-trading';
import type { PriceAlertConfig, TradeNotification } from '../../hooks/use-trade-notifications';
import { normalizeDecimalInput } from '../../lib/money-input';
import { useT } from '../../lib/i18n';

export function TradeNotificationCenter({
  markets,
  prices,
  notifications,
  permission,
  permissionBusy,
  permissionError,
  pushConsent,
  priceAlert,
  onRequestPermission,
  onSetPriceAlert,
  onClearPriceAlert,
  onClearNotifications,
}: {
  markets: FuturesMarket[];
  prices: Record<string, string>;
  notifications: TradeNotification[];
  permission: NotificationPermission | 'unsupported';
  permissionBusy: boolean;
  permissionError: MessageKey | null;
  pushConsent: boolean;
  priceAlert: PriceAlertConfig | null;
  onRequestPermission: () => Promise<boolean>;
  onSetPriceAlert: (next: Omit<PriceAlertConfig, 'enabled' | 'triggered'>) => boolean;
  onClearPriceAlert: () => void;
  onClearNotifications: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState(markets[0]?.symbol ?? '');
  const [target, setTarget] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');

  useEffect(() => {
    if (!symbol && markets[0]) {
      setSymbol(markets[0].symbol);
    }
  }, [markets, symbol]);

  const selectedPrice = symbol ? (prices[symbol] ?? '0') : '0';
  const permissionLabel =
    permission === 'granted'
      ? t('notif.permission.statusGranted')
      : permission === 'denied'
        ? t('notif.permission.statusDenied')
        : permission === 'unsupported'
          ? t('notif.permission.statusUnsupported')
          : t('notif.permission.statusDefault');

  return (
    <div className="relative z-50" data-testid="notification-center">
      <Button
        variant="secondary"
        size="sm"
        data-testid="notification-center-toggle"
        aria-expanded={open}
        aria-controls="trade-notification-panel"
        onClick={() => setOpen((value) => !value)}
      >
        {t('notif.center.toggle')}
        {notifications.length > 0 && <Badge tone="primary">{notifications.length}</Badge>}
      </Button>

      {open && (
        <Card
          id="trade-notification-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="trade-notification-title"
          className="fixed right-4 top-20 z-100 flex w-[min(92vw,390px)] flex-col gap-3 p-4 text-left shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="trade-notification-title" className="text-sm font-bold text-fg">
                {t('notif.center.title')}
              </h3>
              <p className="text-xs text-muted">{t('notif.center.description')}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('common.close')}
              onClick={() => setOpen(false)}
            >
              {t('common.close')}
            </Button>
          </div>

          <div
            className="rounded-xl border border-border bg-surface-2/60 p-3"
            data-testid="notification-permission"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-fg">{t('notif.permission.title')}</p>
                <p className="text-xs text-muted">{permissionLabel}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={permissionBusy || permission === 'unsupported'}
                data-testid="notification-permission-button"
                onClick={() => void onRequestPermission()}
              >
                {permissionBusy ? t('common.processing') : t('notif.permission.cta')}
              </Button>
            </div>
            {pushConsent && (
              <p className="mt-2 text-xs text-up">{t('notif.permission.consentLinked')}</p>
            )}
            {permissionError && <p className="mt-2 text-xs text-down">{t(permissionError)}</p>}
          </div>

          <div
            className="rounded-xl border border-border bg-surface-2/60 p-3"
            data-testid="price-alert-form"
          >
            <p className="text-sm font-semibold text-fg">{t('notif.priceAlert.formTitle')}</p>
            <p className="text-xs text-muted">{t('notif.priceAlert.formDescription')}</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_0.8fr]">
              <select
                className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-fg"
                value={symbol}
                data-testid="price-alert-symbol"
                onChange={(event) => setSymbol(event.target.value)}
              >
                {markets.map((market) => (
                  <option key={market.symbol} value={market.symbol}>
                    {market.display_name ?? market.symbol}
                  </option>
                ))}
              </select>
              <SegmentedControl<'above' | 'below'>
                size="sm"
                value={direction}
                onChange={setDirection}
                options={[
                  { value: 'above', label: t('notif.priceAlert.above') },
                  { value: 'below', label: t('notif.priceAlert.below') },
                ]}
              />
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={target}
                inputMode="decimal"
                data-testid="price-alert-target"
                placeholder={t('notif.priceAlert.targetPlaceholder')}
                onChange={(event) => setTarget(normalizeDecimalInput(event.target.value))}
              />
              <Button
                size="sm"
                data-testid="price-alert-save"
                disabled={!symbol}
                onClick={() => {
                  if (onSetPriceAlert({ symbol, target, direction })) setTarget('');
                }}
              >
                {t('common.save')}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted">
              {t('notif.priceAlert.current', {
                symbol: symbol || '-',
                price: formatMoney(selectedPrice, 'USDT'),
              })}
            </p>
            {priceAlert && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-xs">
                <span className="text-muted">
                  {t('notif.priceAlert.active', {
                    symbol: priceAlert.symbol,
                    direction: t(
                      priceAlert.direction === 'above'
                        ? 'notif.priceAlert.above'
                        : 'notif.priceAlert.below',
                    ),
                    target: priceAlert.target,
                  })}
                </span>
                <Button variant="ghost" size="sm" onClick={onClearPriceAlert}>
                  {t('notif.priceAlert.clear')}
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-fg">{t('notif.center.recent')}</p>
            <Button variant="ghost" size="sm" onClick={onClearNotifications}>
              {t('notif.center.clear')}
            </Button>
          </div>
          <div
            className="flex max-h-64 flex-col gap-2 overflow-auto"
            data-testid="notification-list"
            aria-live="polite"
          >
            {notifications.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface-2/50 p-3 text-sm text-muted">
                {t('notif.center.empty')}
              </p>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-fg">{item.title}</p>
                    <Badge
                      tone={
                        item.tone === 'danger' ? 'down' : item.tone === 'success' ? 'up' : 'primary'
                      }
                    >
                      {t(`notif.tone.${item.tone}` as MessageKey)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.body}</p>
                  <p className="mt-2 text-[0.7rem] text-muted">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
