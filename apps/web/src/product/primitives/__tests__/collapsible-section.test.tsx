import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CollapsibleSection } from '@/product/primitives/collapsible-section';

describe('CollapsibleSection', () => {
  it('starts collapsed by default and expands on toggle', () => {
    render(
      <CollapsibleSection title="Insights" testId="fold3">
        <p>Hidden body</p>
      </CollapsibleSection>,
    );

    expect(screen.getByTestId('fold3')).toBeInTheDocument();
    expect(screen.queryByTestId('fold3-panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden body')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('fold3-toggle'));
    expect(screen.getByTestId('fold3-panel')).toBeInTheDocument();
    expect(screen.getByText('Hidden body')).toBeInTheDocument();
  });

  it('honors defaultOpen and shows summary only when collapsed', () => {
    render(
      <CollapsibleSection title="Details" defaultOpen summary="3 items" testId="open-fold">
        <p>Body</p>
      </CollapsibleSection>,
    );

    expect(screen.getByTestId('open-fold-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('open-fold-summary')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open-fold-toggle'));
    expect(screen.queryByTestId('open-fold-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('open-fold-summary')).toHaveTextContent('3 items');
  });

  it('supports controlled open + onOpenChange', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <CollapsibleSection title="Ticket" open={false} onOpenChange={onOpenChange} testId="ctl">
        <p>Ticket body</p>
      </CollapsibleSection>,
    );

    fireEvent.click(screen.getByTestId('ctl-toggle'));
    expect(onOpenChange).toHaveBeenCalledWith(true);

    rerender(
      <CollapsibleSection title="Ticket" open onOpenChange={onOpenChange} testId="ctl">
        <p>Ticket body</p>
      </CollapsibleSection>,
    );
    expect(screen.getByTestId('ctl-panel')).toBeInTheDocument();
  });

  it('renders plain variant without card chrome', () => {
    render(
      <CollapsibleSection title="Plain" variant="plain" defaultOpen testId="plain">
        <span>Inner</span>
      </CollapsibleSection>,
    );

    const root = screen.getByTestId('plain');
    expect(root.tagName).toBe('SECTION');
    expect(root).not.toHaveAttribute('data-card-variant');
    expect(screen.getByText('Inner')).toBeInTheDocument();
  });
});
