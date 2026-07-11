import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProgressRing } from '@/product/primitives/progress-ring';

describe('ProgressRing (§34.26 fillOnMount)', () => {
  it('renders accessible ring with value', () => {
    render(<ProgressRing value={40} aria-label="progress 40" />);
    expect(screen.getByRole('img', { name: 'progress 40' })).toBeInTheDocument();
  });

  it('marks fill-on-mount when enabled', () => {
    const { container } = render(
      <ProgressRing value={55} fillOnMount aria-label="xp fill 55" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-fill-on-mount', 'true');
  });
});
