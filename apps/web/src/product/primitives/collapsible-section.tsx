import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import { Card, CardBody, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

export interface CollapsibleSectionProps {
  /** Resolved title string (i18n at call site). */
  title: string;
  children: ReactNode;
  /** Default collapsed for progressive disclosure (§34.12 Fold3). */
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional one-line cue when collapsed. */
  summary?: ReactNode;
  /** Accessible expand label when title alone is insufficient. */
  expandLabel?: string;
  collapseLabel?: string;
  /** `card` wraps trigger+panel in Card; `plain` is borderless section. */
  variant?: 'card' | 'plain';
  className?: string;
  testId?: string;
}

/** Shared progressive-disclosure section — home Fold3 · wallet-hero · trade ticket (§34.12–34.14). */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  open: openControlled,
  onOpenChange,
  summary,
  expandLabel,
  collapseLabel,
  variant = 'card',
  className,
  testId = 'collapsible-section',
}: CollapsibleSectionProps) {
  const panelId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openControlled !== undefined;
  const open = isControlled ? openControlled : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const ariaLabel = open ? (collapseLabel ?? title) : (expandLabel ?? title);

  const trigger = (
    <button
      type="button"
      className={cn(
        'flex min-h-12 w-full items-center justify-between gap-3 text-left',
        variant === 'card' &&
          'px-4 py-3 transition-colors duration-(--ds-motion-press) hover:bg-surface-hover',
        variant === 'plain' && 'py-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus) focus-visible:ring-inset',
      )}
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={ariaLabel}
      data-testid={`${testId}-toggle`}
      onClick={() => setOpen(!open)}
    >
      <div className="min-w-0 flex-1">
        {variant === 'card' ? (
          <CardTitle className="m-0 text-base leading-snug">{title}</CardTitle>
        ) : (
          <span className="text-foreground m-0 text-sm font-semibold leading-snug">{title}</span>
        )}
        {!open && summary ? (
          <div
            className="text-foreground-muted mt-1 text-xs leading-relaxed"
            data-testid={`${testId}-summary`}
          >
            {summary}
          </div>
        ) : null}
      </div>
      <ChevronDown
        className={cn(
          'size-5 shrink-0 self-center text-foreground-muted transition-transform duration-(--ds-motion-surface)',
          open && 'rotate-180',
        )}
        aria-hidden
      />
    </button>
  );

  const panel = open ? (
    <div id={panelId} data-testid={`${testId}-panel`}>
      {variant === 'card' ? (
        <CardBody className="border-t border-line pt-3">{children}</CardBody>
      ) : (
        <div className="pt-2">{children}</div>
      )}
    </div>
  ) : null;

  if (variant === 'plain') {
    return (
      <section className={cn('flex flex-col', className)} data-testid={testId}>
        {trigger}
        {panel}
      </section>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)} data-testid={testId}>
      {trigger}
      {panel}
    </Card>
  );
}
