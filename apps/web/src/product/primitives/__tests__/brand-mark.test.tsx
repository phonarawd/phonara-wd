import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BRAND_ASSETS } from '@/domain/brand-display-contract';
import { BrandMark } from '@/product/primitives/brand-mark';

describe('BrandMark §34.18 aurora', () => {
  it('renders flat mono mask by default', () => {
    render(<BrandMark testId="mark-flat" />);
    const el = screen.getByTestId('mark-flat');
    expect(el).toHaveAttribute('data-brand-asset', BRAND_ASSETS.mono);
  });

  it('renders aurora geometric recall with Quad Stream glow wrapper', () => {
    const { container } = render(<BrandMark variant="aurora" testId="mark-aurora" />);
    const root = screen.getByTestId('mark-aurora');
    expect(root).toHaveAttribute('data-brand-variant', 'aurora');
    expect(root).toHaveAttribute('data-brand-asset', BRAND_ASSETS.shape);
    expect(root.className).toContain('ds-brand-mark-aurora');
    expect(container.querySelector('.ds-brand-mark-aurora__glow')).toBeTruthy();
    expect(container.querySelector('img')?.getAttribute('src')).toBe(BRAND_ASSETS.shape);
  });

  it('keeps hero-3d on sculpted SVG path', () => {
    render(<BrandMark variant="hero-3d" testId="mark-hero" />);
    expect(screen.getByTestId('mark-hero')).toHaveAttribute('data-brand-asset', BRAND_ASSETS.hero3d);
  });
});
