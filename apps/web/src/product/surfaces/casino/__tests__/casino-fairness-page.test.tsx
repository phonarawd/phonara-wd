import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashServerSeed } from '@phonara/game-engine';

import { I18nProvider } from '@/product/i18n';
import { CasinoFairnessPage } from '@/product/surfaces/casino/casino-fairness-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
    'data-testid'?: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/casino/use-game-pf-state', () => ({
  useGamePfState: () => ({
    data: {
      client_seed: 'account-client',
      next_nonce: 3,
      server_seed_hash: 'hash-demo',
      previous_server_seed: null,
    },
    isLoading: false,
  }),
  useSetGameClientSeed: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRotateGameServerSeed: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('CasinoFairnessPage (p10-page-casino-fairness)', () => {
  it('renders verifier with E23 seed controls when casinoLiveLive', () => {
    render(
      <I18nProvider>
        <CasinoFairnessPage />
      </I18nProvider>,
    );

    const page = screen.getByTestId('casino-fairness-page');
    expect(page).toHaveAttribute('data-owner-todo', 'p10-page-casino-fairness');
    expect(page).toHaveAttribute('data-fairness-exposure', 'live');
    expect(page).toHaveAttribute('data-client-seed-mode', 'account_or_per_bet');
    expect(page).toHaveAttribute('data-seed-rotation-ui', 'true');
    expect(page).toHaveAttribute('data-nonce', '1');

    expect(screen.getByTestId('casino-fairness-verifier')).toBeInTheDocument();
    expect(screen.getByTestId('casino-fairness-limits')).toBeInTheDocument();
    expect(screen.getByTestId('casino-fairness-seed-controls')).toBeInTheDocument();
    expect(screen.getByTestId('casino-fairness-seed-rotate')).toBeInTheDocument();
    expect(screen.getByTestId('casino-fairness-nonce')).toBeDisabled();
    expect(screen.getByTestId('casino-fairness-nonce')).toHaveValue('1');
    expect(screen.getByText(/계정 클라이언트 시드를 저장할 수 있습니다/)).toBeInTheDocument();
  });

  it('runs verifyRound and shows hash match for a known seed', async () => {
    const serverSeed = 'page-fairness-seed';
    const clientSeed = 'page-fairness-client';
    const serverSeedHash = await hashServerSeed(serverSeed);

    render(
      <I18nProvider>
        <CasinoFairnessPage />
      </I18nProvider>,
    );

    fireEvent.change(screen.getByTestId('casino-fairness-server-hash'), {
      target: { value: serverSeedHash },
    });
    fireEvent.change(screen.getByTestId('casino-fairness-server-seed'), {
      target: { value: serverSeed },
    });
    fireEvent.change(screen.getByTestId('casino-fairness-client-seed'), {
      target: { value: clientSeed },
    });
    fireEvent.click(screen.getByTestId('casino-fairness-verify-run'));

    await waitFor(() => {
      expect(screen.getByTestId('casino-fairness-result')).toHaveAttribute(
        'data-hash-match',
        'true',
      );
    });
    expect(screen.getByTestId('casino-fairness-hash-status')).toHaveTextContent(
      '서버 시드 해시가 일치합니다',
    );
  });
});
