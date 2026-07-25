import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { LEGAL_DOC_EFFECTIVE_DATE, type LegalDocId } from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

import { LegalNav } from './legal-nav';

export type LegalDocumentLayoutProps = {
  testId: string;
  docId: LegalDocId;
  title: string;
  intro: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Canonical legal document shell — nav · scroll body · auth-cluster back link. */
export function LegalDocumentLayout({
  testId,
  docId,
  title,
  intro,
  children,
  footer,
  className,
}: LegalDocumentLayoutProps) {
  const t = useT();

  return (
    <div
      data-testid={testId}
      className={cn('mx-auto flex w-full max-w-3xl flex-col gap-ds-8 py-6 md:py-10', className)}
    >
      <Link
        to="/login"
        className="text-foreground-muted hover:text-foreground inline-flex min-h-11 items-center gap-1.5 text-sm font-medium"
        data-testid="legal-back-login"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        {t('legal.back')}
      </Link>

      <header className="flex flex-col gap-3">
        <LegalNav active={docId} />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-foreground m-0 text-2xl font-semibold tracking-tight [word-break:keep-all]">
            {title}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">{intro}</p>
          <p className="text-foreground-muted m-0 text-xs tabular-nums">
            {t('legal.effectiveDate', { date: LEGAL_DOC_EFFECTIVE_DATE })}
          </p>
        </div>
      </header>

      <div
        className="border-line bg-surface max-h-[min(60dvh,32rem)] overflow-y-auto rounded-(--ds-radius-lg) border p-4 md:p-6"
        data-testid="legal-document-scroll"
      >
        <div className="flex flex-col gap-ds-8">{children}</div>
      </div>

      <footer className="flex flex-col gap-3">
        <p className="text-foreground-muted m-0 text-xs">{t('legal.contactBody')}</p>
        {footer}
      </footer>
    </div>
  );
}
