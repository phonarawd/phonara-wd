import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MissionCard } from '@/product/primitives/mission-card';

describe('MissionCard (§34.17 · da-w5-gate-domain-cards)', () => {
  it('renders mission personality with accent ring cue (0.2s scan)', () => {
    const { container } = render(
      <MissionCard
        title="Daily spin"
        state="in_progress"
        progress={40}
        progressLabel="2 / 5"
        actionLabel="Continue"
        onAction={() => undefined}
      />,
    );

    const card = container.querySelector('[data-card-variant="mission"]');
    expect(card).toBeTruthy();
    expect(card).toHaveAttribute('data-mission-state', 'in_progress');
    expect(card?.className).toMatch(/ring-accent/);
    expect(screen.getByText('Daily spin')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('wires action CTA for in_progress and hides it when completed', () => {
    const onAction = vi.fn();
    const { rerender } = render(
      <MissionCard title="Invite" state="in_progress" actionLabel="Go" onAction={onAction} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onAction).toHaveBeenCalledTimes(1);

    rerender(<MissionCard title="Invite" state="completed" actionLabel="Go" onAction={onAction} />);
    expect(screen.queryByRole('button', { name: 'Go' })).not.toBeInTheDocument();
  });

  it('marks completed mission state for signature CSS dim path', () => {
    const { container } = render(<MissionCard title="Done" state="completed" progress={100} />);
    const card = container.querySelector('[data-card-variant="mission"]');
    expect(card).toHaveAttribute('data-mission-state', 'completed');
  });
});
