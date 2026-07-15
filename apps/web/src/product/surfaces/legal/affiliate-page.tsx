import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

import { AffiliateDocumentBody } from './affiliate-document-body';
import { LegalDocumentLayout } from './legal-document-layout';

/** Canonical `/legal/affiliate` — referral qualification · commission eligibility (P12). */
export function AffiliatePage() {
  const t = useT();

  useEffect(() => {
    document.title = t('legal.affiliate.pageTitle');
  }, [t]);

  return (
    <LegalDocumentLayout
      testId="legal-affiliate-page"
      docId="affiliate"
      title={t('legal.affiliate.title')}
      intro={t('legal.affiliate.intro')}
      footer={
        <Link
          to="/referral"
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full md:w-auto')}
          data-testid="affiliate-referral-cta"
        >
          {t('legal.affiliate.referralCta')}
        </Link>
      }
    >
      <AffiliateDocumentBody />
    </LegalDocumentLayout>
  );
}
