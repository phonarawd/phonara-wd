import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/product/i18n';
import { AdminCasinoPage } from '@/product/surfaces/admin-casino-page';

vi.mock('@/hooks/admin/useAdminCasinoDesk', () => ({
  useAdminCasinoDesk: () => ({
    filteredCatalog: [{ id: 'game-1', labelKey: 'admin.casino.catalog.game.crash', status: 'live', rtpConfigured: '99', bets24h: '4' }],
    filteredRtpReviews: [],
    setGameStatus: vi.fn(() => true),
    ackRtpReview: vi.fn(() => true),
    resolveRtpReview: vi.fn(() => true),
  }),
}));

describe('AdminCasinoPage', () => {
  it('renders catalog tab and game status control', () => {
    render(<I18nProvider><AdminCasinoPage /></I18nProvider>);
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('button', { name: /정비|Maintenance/i })).toBeTruthy();
  });
});
