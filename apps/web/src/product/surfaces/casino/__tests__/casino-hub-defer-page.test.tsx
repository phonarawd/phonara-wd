import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { CasinoHubDeferPage } from '@/product/surfaces/casino/casino-hub-defer-page';

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

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('CasinoHubDeferPage', () => {
  it('renders defer empty state without dead controls', () => {
    render(
      <I18nProvider>
        <CasinoHubDeferPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('casino-hub-defer-page')).toBeInTheDocument();
    expect(screen.getByText('카지노 게임 준비 중')).toBeInTheDocument();
    expect(screen.getByTestId('casino-hub-defer-home-link')).toHaveAttribute('href', '/home');
    expect(screen.getByRole('button', { name: '돈벌기' })).toBeInTheDocument();
  });
});
