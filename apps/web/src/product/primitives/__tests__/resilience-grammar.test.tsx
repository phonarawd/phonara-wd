import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { EmptyState } from '@/product/primitives/empty-state';
import { ErrorPanel } from '@/product/primitives/error-panel';
import { Skeleton } from '@/product/primitives/skeleton';
import { ZeroBalanceState } from '@/product/primitives/zero-balance-state';

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('§25.15 resilience grammar', () => {
  it('ZeroBalanceState keeps hero-sized zero with deposit CTA', () => {
    const onDeposit = vi.fn();
    renderWithI18n(<ZeroBalanceState currency="PHON" onDeposit={onDeposit} />);

    const amount = screen.getByText('0');
    expect(amount.className).toContain('font-display');
    expect(amount.className).toContain('text-(--ds-text-hero)');
    expect(amount.parentElement?.className).toContain('text-foreground-muted');

    fireEvent.click(screen.getByRole('button', { name: '원화 입금' }));
    expect(onDeposit).toHaveBeenCalledTimes(1);
  });

  it('ErrorPanel network variant exposes retry with aria-live polite', () => {
    const onRetry = vi.fn();
    const { container } = renderWithI18n(
      <ErrorPanel variant="network" errorCode="NET_001" onRetry={onRetry} />,
    );

    const alert = container.querySelector('[aria-live="polite"]');
    expect(alert).toBeTruthy();
    expect(screen.getByText('지금은 연결이 흔들려요')).toBeInTheDocument();
    expect(screen.getByText(/NET_001/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ErrorPanel forbidden variant shows back CTA without retry', () => {
    const onBack = vi.fn();
    renderWithI18n(<ErrorPanel variant="forbidden" onBack={onBack} />);

    expect(screen.getByText('이 페이지에 접근할 수 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '이전으로' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('Skeleton uses shimmer token class (not animate-pulse only)', () => {
    const { container } = render(<Skeleton className="h-8 w-full" data-testid="sk" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('skeleton-shimmer');
    expect(el.className).not.toContain('animate-pulse');
  });

  it('EmptyState admin queue pattern keeps filter context + next action', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="지금 처리할 항목이 없어요"
        description="필터는 유지됩니다."
        actionLabel="처리 대기함 보기"
        onAction={onAction}
      />,
    );

    expect(screen.getByText('필터는 유지됩니다.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '처리 대기함 보기' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
