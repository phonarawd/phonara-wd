import type { ReactNode } from 'react';

import { cn } from '@/product/primitives/lib/cn';

export type LegalSectionProps = {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
};

/** Single legal document section — heading + prose body. */
export function LegalSection({ id, title, children, className }: LegalSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-24', className)}>
      <h2 className="text-foreground m-0 text-base font-semibold">{title}</h2>
      <div className="text-foreground-muted mt-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
