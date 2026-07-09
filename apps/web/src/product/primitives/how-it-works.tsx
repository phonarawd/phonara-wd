import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, ChevronDown, Circle, ListOrdered } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import { useT } from '@/product/i18n';
import type { MessageKey } from '@phonara/i18n';
import { Card, CardBody, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

const DEFAULT_STEP_ICONS: readonly [LucideIcon, LucideIcon, LucideIcon] = [
  Circle,
  ListOrdered,
  CheckCircle2,
];

function visitStorageKey(persistenceId: string) {
  return `phonara.howItWorks.${persistenceId}`;
}

export interface HowItWorksProps {
  /** i18n keys for three one-line steps (§30.2). */
  stepKeys: readonly [MessageKey, MessageKey, MessageKey];
  titleKey?: MessageKey;
  /** Unique per surface instance — revisit defaults to collapsed (§30.2). */
  persistenceId: string;
  stepIcons?: readonly [LucideIcon, LucideIcon, LucideIcon];
  className?: string;
}

/** Collapsible 3-step explainer — surface top, once per visit pattern (§30.2). */
export function HowItWorks({
  stepKeys,
  titleKey = 'ux.howItWorks.title',
  persistenceId,
  stepIcons = DEFAULT_STEP_ICONS,
  className,
}: HowItWorksProps) {
  const t = useT();
  const panelId = useId();
  const storageKey = visitStorageKey(persistenceId);
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(storageKey) === null;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, 'visited');
  }, [storageKey]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <button
        type="button"
        className={cn(
          'flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left',
          'transition-colors duration-(--ds-motion-press) hover:bg-surface-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus) focus-visible:ring-inset',
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <CardTitle className="m-0 min-w-0 flex-1 text-base leading-snug">{t(titleKey)}</CardTitle>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 self-center text-foreground-muted transition-transform duration-(--ds-motion-surface)',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <CardBody id={panelId} className="space-y-3 border-t border-line pt-3">
          {stepKeys.map((key, index) => {
            const Icon = stepIcons[index] ?? DEFAULT_STEP_ICONS[index] ?? Circle;
            return (
              <div key={key} className="flex items-start gap-3 text-sm">
                <span
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-(--ds-radius-full) bg-surface-raised text-accent"
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>
                <p className="m-0 leading-snug text-foreground">{t(key)}</p>
              </div>
            );
          })}
        </CardBody>
      ) : null}
    </Card>
  );
}
