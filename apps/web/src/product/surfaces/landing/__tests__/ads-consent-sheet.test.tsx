import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdsConsentSheet } from '@/product/surfaces/landing/ads-consent-sheet';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

function renderSheet(open = true) {
  const onAccept = vi.fn();
  const onDecline = vi.fn();
  render(
    <I18nProvider>
      <AdsConsentSheet open={open} onAccept={onAccept} onDecline={onDecline} />
    </I18nProvider>,
  );
  return { onAccept, onDecline };
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('AdsConsentSheet', () => {
  it('renders consent actions and cookies/privacy links', () => {
    const { onAccept, onDecline } = renderSheet();

    expect(screen.getByTestId('ads-consent-sheet')).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/legal/cookies');
    expect(links[1]).toHaveAttribute('href', '/legal/privacy');

    fireEvent.click(screen.getByTestId('ads-consent-accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('ads-consent-decline'));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});
