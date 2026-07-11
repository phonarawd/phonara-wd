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

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('CasinoFairnessPage (p10-page-casino-fairness)', () => {
  it('renders verifier with §23.2.1 PF limits and no seed rotation UI', () => {
    render(
      <I18nProvider>
        <CasinoFairnessPage />
      </I18nProvider>,
    );

    const page = screen.getByTestId('casino-fairness-page');
    expect(page).toHaveAttribute('data-owner-todo', 'p10-page-casino-fairness');
    expect(page).toHaveAttribute('data-fairness-exposure', 'live');
    expect(page).toHaveAttribute('data-client-seed-mode', 'per_bet');
    expect(page).toHaveAttribute('data-seed-rotation-ui', 'false');
    expect(page).toHaveAttribute('data-nonce', '1');

    expect(screen.getByTestId('casino-fairness-verifier')).toBeInTheDocument();
    expect(screen.getByTestId('casino-fairness-limits')).toBeInTheDocument();
    expect(screen.getByTestId('casino-fairness-nonce')).toBeDisabled();
    expect(screen.getByTestId('casino-fairness-nonce')).toHaveValue('1');
    expect(screen.queryByTestId('casino-fairness-seed-rotate')).not.toBeInTheDocument();
    expect(screen.getByText(/시드 로테이션 UI는 아직 없습니다/)).toBeInTheDocument();
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
