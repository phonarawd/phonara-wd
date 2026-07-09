import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

import { LegalDocumentLayout } from './legal-document-layout';
import { RiskDocumentBody } from './risk-document-body';

/** Canonical `/legal/risk-disclosure` surface — i18n-only risk disclosures (P3·W2). */
export function RiskDisclosurePage() {
  const t = useT();

  useEffect(() => {
    document.title = t('legal.risk.pageTitle');
  }, [t]);

  return (
    <LegalDocumentLayout
      testId="legal-risk-page"
      docId="risk"
      title={t('legal.risk.title')}
      intro={t('legal.risk.lead')}
      footer={
        <Link
          to="/signup"
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full md:w-auto')}
          data-testid="risk-agree-continue"
        >
          {t('auth.entry.terms.agreeContinue')}
        </Link>
      }
    >
      <RiskDocumentBody />
    </LegalDocumentLayout>
  );
}
