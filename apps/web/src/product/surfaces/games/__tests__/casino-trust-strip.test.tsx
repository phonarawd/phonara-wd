import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { CasinoTrustStrip } from '@/product/surfaces/games/casino-trust-strip';

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('CasinoTrustStrip (phase1a-trust-layer)', () => {
  it('renders the RTP badge formatted to two decimals', () => {
    render(
      <I18nProvider>
        <CasinoTrustStrip rtp={99} connectionStatus="subscribed" connectionDisconnected={false} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('casino-rtp-badge')).toBeInTheDocument();
    expect(screen.getByTestId('casino-rtp-value')).toHaveTextContent('99.00%');
  });

  it('renders the live state when connected', () => {
    render(
      <I18nProvider>
        <CasinoTrustStrip rtp={97.3} connectionStatus="subscribed" connectionDisconnected={false} />
      </I18nProvider>,
    );

    const status = screen.getByTestId('casino-connection-status');
    expect(status).toHaveAttribute('data-connection-status', 'subscribed');
    expect(status).toHaveAttribute('data-connection-disconnected', 'false');
    expect(status).toHaveTextContent('실시간 연결됨');
  });

  it('renders the disconnected alarm state', () => {
    render(
      <I18nProvider>
        <CasinoTrustStrip rtp={97.3} connectionStatus="channel_error" connectionDisconnected />
      </I18nProvider>,
    );

    const status = screen.getByTestId('casino-connection-status');
    expect(status).toHaveAttribute('data-connection-status', 'channel_error');
    expect(status).toHaveAttribute('data-connection-disconnected', 'true');
    expect(status).toHaveTextContent('실시간 연결 끊김');
  });

  it('renders English copy for the live/disconnected states', () => {
    window.localStorage.setItem('phonara.locale', 'en');
    render(
      <I18nProvider>
        <CasinoTrustStrip rtp={99} connectionStatus="subscribed" connectionDisconnected={false} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('casino-connection-status')).toHaveTextContent('Live');
  });
});
