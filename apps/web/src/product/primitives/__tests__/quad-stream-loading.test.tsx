import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DA_W6_QUAD_STREAM_LOADING_AXES } from '@/domain/da-w6-brand-elevation-display-contract';
import { I18nProvider } from '@/product/i18n';
import { QuadStreamLoading } from '@/product/primitives/quad-stream-loading';

describe('QuadStreamLoading §34.20', () => {
  it('renders four Quad Stream axes with status semantics', () => {
    const { container } = render(
      <I18nProvider>
        <QuadStreamLoading />
      </I18nProvider>,
    );

    const root = screen.getByTestId('quad-stream-loading');
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-busy', 'true');

    for (const axis of DA_W6_QUAD_STREAM_LOADING_AXES) {
      expect(container.querySelector(`[data-axis="${axis}"]`)).toBeTruthy();
    }
  });

  it('compact mode hides title copy', () => {
    render(
      <I18nProvider>
        <QuadStreamLoading compact />
      </I18nProvider>,
    );
    expect(screen.queryByText('불러오는 중')).not.toBeInTheDocument();
  });
});
