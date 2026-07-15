import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DA_W5_GATE_SCAN_CUES,
  DA_W5_GATE_SCAN_DISTINGUISH_MARKERS,
} from '@/domain/da-w5-gate-domain-cards-display-contract';
import { DA_W5_DOMAIN_CARD_VARIANTS } from '@/domain/da-w5-cards-domain-variants-display-contract';
import { I18nProvider } from '@/product/i18n';
import { Card } from '@/product/primitives/card';
import { MissionCard } from '@/product/primitives/mission-card';
import { CasinoLobbyPage } from '@/product/surfaces/casino/casino-lobby-page';
import { WalletBalanceHero } from '@/product/surfaces/wallet/wallet-balance-hero';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => ({
    wallet: {
      usdt_available: '10.000000',
      phon_available: '20.000000',
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('da-w5-gate-domain-cards · 0.2s scan distinguish (§34.17 · YAML #195)', () => {
  it('keeps six scan cues unique so personalities do not collide', () => {
    const cues = DA_W5_DOMAIN_CARD_VARIANTS.map((v) => DA_W5_GATE_SCAN_CUES[v]);
    expect(new Set(cues).size).toBe(6);
    expect(DA_W5_GATE_SCAN_DISTINGUISH_MARKERS.mission).toContain('ring-accent');
    expect(DA_W5_GATE_SCAN_DISTINGUISH_MARKERS['wallet-hero']).toContain('aurora');
    expect(DA_W5_GATE_SCAN_DISTINGUISH_MARKERS['casino-play']).toContain('hover:shadow-2');
  });

  it('renders mission · wallet · casino owners with distinct data-card-variant', () => {
    const { container } = render(
      <I18nProvider>
        <div data-testid="da-w5-scan-board">
          <MissionCard title="Mission scan" state="in_progress" progress={50} />
          <WalletBalanceHero
            label="Available"
            amount="1,000"
            detailsTitle="Breakdown"
            details={<span>locked</span>}
          />
          <CasinoLobbyPage />
        </div>
      </I18nProvider>,
    );

    const board = screen.getByTestId('da-w5-scan-board');
    const mission = board.querySelector('[data-card-variant="mission"]');
    const wallet = board.querySelector('[data-card-variant="wallet-hero"]');
    const casino = board.querySelector('[data-card-variant="casino-play"]');

    expect(mission).toBeTruthy();
    expect(wallet).toBeTruthy();
    expect(casino).toBeTruthy();

    expect(mission).toHaveAttribute('data-mission-state', 'in_progress');
    expect(screen.getByTestId('wallet-balance-hero')).toHaveAttribute(
      'data-card-variant',
      'wallet-hero',
    );
    expect(screen.getByTestId('casino-hub-play-tile')).toHaveAttribute(
      'data-card-variant',
      'casino-play',
    );

    // 0.2s distinguish: three primary owners must not share the same variant attr.
    const variants = [mission, wallet, casino].map((el) => el?.getAttribute('data-card-variant'));
    expect(new Set(variants).size).toBe(3);

    // CVA class cues remain distinct across the three owners.
    expect(mission?.className).toMatch(/ring-accent/);
    expect(wallet?.className).toMatch(/ring-accent/);
    expect(casino?.className).toMatch(/hover:shadow-2|hover:-translate/);
    expect(casino?.className).not.toMatch(/ring-accent/);
    expect(container.querySelectorAll('[data-card-variant]').length).toBeGreaterThanOrEqual(3);
  });

  it('emits distinct CVA class fingerprints for all six personalities', () => {
    const { container } = render(
      <>
        {DA_W5_DOMAIN_CARD_VARIANTS.map((variant) => (
          <Card key={variant} variant={variant} data-testid={`scan-${variant}`}>
            {variant}
          </Card>
        ))}
      </>,
    );

    const fingerprints = DA_W5_DOMAIN_CARD_VARIANTS.map((variant) => {
      const el = screen.getByTestId(`scan-${variant}`);
      expect(el).toHaveAttribute('data-card-variant', variant);
      return el.className;
    });

    // trade-dense must stay line-first (no raise shadow class collision with casino float).
    const trade = screen.getByTestId('scan-trade-dense');
    const casino = screen.getByTestId('scan-casino-play');
    expect(trade.className).toContain('shadow-none');
    expect(casino.className).toMatch(/hover:shadow-2/);
    expect(trade.className).not.toEqual(casino.className);

    expect(new Set(fingerprints).size).toBe(6);
    expect(container.querySelectorAll('[data-card-variant]')).toHaveLength(6);
  });
});
