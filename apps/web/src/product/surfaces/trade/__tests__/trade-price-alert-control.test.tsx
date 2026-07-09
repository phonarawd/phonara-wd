import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { useNotificationStore } from '@/stores/notifications';
import { TradePriceAlertControl } from '@/product/surfaces/trade/trade-price-alert-control';

describe('TradePriceAlertControl', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      priceAlert: null,
      notifications: [],
      permission: 'default',
      permissionBusy: false,
      permissionError: null,
    });
    window.localStorage.clear();
  });

  it('opens dialog and saves a price alert for the active symbol', () => {
    const t = (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key;

    render(
      <I18nProvider>
        <TradePriceAlertControl symbol="BTCUSDT-SIM" currentPrice="64000" t={t} />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('trade-price-alert-trigger'));

    const dialog = screen.getByTestId('trade-price-alert-dialog');
    fireEvent.click(within(dialog).getByTestId('trade-price-alert-direction-below'));
    fireEvent.change(within(dialog).getByTestId('trade-price-alert-target-input'), {
      target: { value: '63000' },
    });
    fireEvent.click(within(dialog).getByTestId('trade-price-alert-save'));

    const alert = useNotificationStore.getState().priceAlert;
    expect(alert).toMatchObject({
      symbol: 'BTCUSDT-SIM',
      target: '63000',
      direction: 'below',
      enabled: true,
      triggered: false,
    });
  });

  it('shows active alert label on trigger when alert matches symbol', () => {
    useNotificationStore.setState({
      priceAlert: {
        symbol: 'ETH_USDT',
        target: '3200',
        direction: 'above',
        enabled: true,
        triggered: false,
      },
    });

    const t = (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key;

    render(
      <I18nProvider>
        <TradePriceAlertControl symbol="ETH_USDT" currentPrice="3250" t={t} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-price-alert-trigger')).toHaveTextContent(
      'notif.priceAlert.active',
    );
  });

  it('clears alert for the active symbol', () => {
    useNotificationStore.setState({
      priceAlert: {
        symbol: 'BTCUSDT-SIM',
        target: '65000',
        direction: 'above',
        enabled: true,
        triggered: false,
      },
    });

    const t = (key: string) => key;

    render(
      <I18nProvider>
        <TradePriceAlertControl symbol="BTCUSDT-SIM" currentPrice="64000" t={t} />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('trade-price-alert-trigger'));
    fireEvent.click(screen.getByTestId('trade-price-alert-clear'));
    expect(useNotificationStore.getState().priceAlert).toBeNull();
  });
});
