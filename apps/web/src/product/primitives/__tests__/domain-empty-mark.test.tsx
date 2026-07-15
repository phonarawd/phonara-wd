import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  DA_W6_DOMAIN_EMPTY_DOMAINS,
  DA_W6_DOMAIN_EMPTY_SIGNATURES,
} from '@/domain/da-w6-brand-elevation-display-contract';
import { DomainEmptyMark } from '@/product/primitives/domain-empty-mark';
import { EmptyState } from '@/product/primitives/empty-state';

describe('DomainEmptyMark §34.19', () => {
  it.each(DA_W6_DOMAIN_EMPTY_DOMAINS)('renders %s signature illustration', (domain) => {
    render(<DomainEmptyMark domain={domain} />);
    const el = screen.getByTestId(`domain-empty-mark-${domain}`);
    expect(el).toHaveAttribute('data-domain', domain);
    expect(el).toHaveAttribute('data-signature', DA_W6_DOMAIN_EMPTY_SIGNATURES[domain]);
  });

  it('EmptyState wires domain mark when domain prop is set', () => {
    render(
      <EmptyState
        domain="casino"
        title="Empty"
        description="Try again"
        actionLabel="Explore"
        onAction={() => undefined}
        testId="empty-casino"
      />,
    );
    expect(screen.getByTestId('empty-casino')).toHaveAttribute('data-domain', 'casino');
    expect(screen.getByTestId('domain-empty-mark-casino')).toBeInTheDocument();
  });
});
