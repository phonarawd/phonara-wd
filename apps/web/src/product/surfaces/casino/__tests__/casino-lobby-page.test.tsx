import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { CasinoLobbyPage } from '@/product/surfaces/casino/casino-lobby-page';

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => ({
    wallet: {
      usdt_available: '125.500000',
      phon_available: '1000.000000',
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('CasinoLobbyPage (p10-page-casino)', () => {
  it('renders Stake-style lobby with category chips, featured grid, and /games paths', () => {
    render(
      <I18nProvider>
        <CasinoLobbyPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('casino-lobby-page')).toHaveAttribute(
      'data-owner-todo',
      'p10-page-casino',
    );
    expect(screen.getByTestId('casino-lobby-page')).toHaveAttribute('data-lobby-exposure', 'live');
    expect(screen.getByText('PHONARA 카지노')).toBeInTheDocument();
    expect(screen.getByTestId('casino-hub-play-tile')).toHaveAttribute(
      'data-card-variant',
      'casino-play',
    );

    const balance = screen.getByTestId('casino-lobby-balance');
    expect(within(balance).getByText(/USDT/i)).toBeInTheDocument();
    expect(within(balance).getByText(/PHON/i)).toBeInTheDocument();

    expect(screen.getByTestId('casino-lobby-pf-verify')).toBeDisabled();
    expect(screen.getByTestId('casino-lobby-chip-originals')).toBeInTheDocument();
    expect(screen.getByTestId('casino-lobby-chip-slots')).toBeInTheDocument();
    expect(screen.getByTestId('casino-lobby-chip-table')).toBeInTheDocument();
    expect(screen.getByTestId('casino-lobby-chip-live')).toBeInTheDocument();

    expect(screen.getByTestId('casino-lobby-play-crash')).toHaveAttribute('href', '/games/crash');
    expect(screen.getByTestId('casino-lobby-play-mint_reels')).toHaveAttribute(
      'href',
      '/games/mint-reels',
    );

    fireEvent.click(screen.getByTestId('casino-lobby-chip-slots'));
    expect(screen.getByTestId('casino-lobby-play-mint_reels')).toBeInTheDocument();
    expect(screen.getByTestId('casino-lobby-play-gold_rush')).toBeInTheDocument();
    expect(screen.queryByTestId('casino-lobby-play-crash')).not.toBeInTheDocument();
  });
});
