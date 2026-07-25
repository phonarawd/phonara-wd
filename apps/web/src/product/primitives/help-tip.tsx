import { Info } from 'lucide-react';
import { useState } from 'react';

import { useT } from '@/product/i18n';
import type { MessageKey } from '@phonara/i18n';
import { IconButton } from '@/product/primitives/icon-button';
import { cn } from '@/product/primitives/lib/cn';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/product/primitives/sheet';

export interface HelpTipAction {
  labelKey: MessageKey;
  href: string;
}

export interface HelpTipProps {
  /** Inline label shown next to the trigger. */
  label: string;
  /** i18n body — `help.{term}` pattern (≤3 sentences in catalog). */
  bodyKey: MessageKey;
  action?: HelpTipAction;
  className?: string;
}

/** Term ⓘ → bottom sheet explainer with optional action link (§30.2). */
export function HelpTip({ label, bodyKey, action, className }: HelpTipProps) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <span className={cn('inline-flex items-center gap-1', className)}>
        <span>{label}</span>
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('ux.helpTip.open', { term: label })}
          className="shrink-0 text-foreground-muted"
          onClick={() => setOpen(true)}
        >
          <Info className="size-4" aria-hidden />
        </IconButton>
      </span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>{label}</SheetTitle>
          </SheetHeader>
          <p className="px-4 text-sm leading-relaxed text-foreground-muted">{t(bodyKey)}</p>
          {action ? (
            <SheetFooter>
              <a
                href={action.href}
                className="text-center text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                {t(action.labelKey)}
              </a>
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
