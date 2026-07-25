import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

export type MarketingPageLayoutProps = {
  testId: string;
  eyebrow?: string;
  title: string;
  lead: string;
  children: ReactNode;
  className?: string;
  /** Back link — defaults to landing. */
  backTo?: string;
  backLabelKey?: 'marketing.back.home' | 'marketing.back.features' | 'support.faq.hubCta';
};

/** Shared public marketing page chrome — MarketingShell content (P12). */
export function MarketingPageLayout({
  testId,
  eyebrow,
  title,
  lead,
  children,
  className,
  backTo = '/',
  backLabelKey = 'marketing.back.home',
}: MarketingPageLayoutProps) {
  const t = useT();

  return (
    <div
      data-testid={testId}
      className={cn('mx-auto flex w-full max-w-3xl flex-col gap-ds-8 py-6 md:py-10', className)}
    >
      <Link
        to={backTo}
        className="text-foreground-muted hover:text-foreground inline-flex min-h-11 items-center gap-1.5 text-sm font-medium"
        data-testid="marketing-back"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        {t(backLabelKey)}
      </Link>

      <header className="flex flex-col gap-2">
        {eyebrow ? (
          <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-foreground m-0 text-2xl font-semibold tracking-tight md:text-3xl break-keep">
          {title}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">{lead}</p>
      </header>

      {children}
    </div>
  );
}
