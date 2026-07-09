import type { ReactNode } from 'react';

import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';
import { landingAnalyticsEventAttr } from '@/domain/landing-analytics-display-contract';

export type LandingFinalCtaProps = {
  signupHref: string;
  className?: string;
  SignupLink?: (props: {
    href: string;
    className?: string;
    testId?: string;
    children: ReactNode;
  }) => ReactNode;
};

/** Last push before signup — immediately after FAQ (CVR §7). */
export function LandingFinalCta({
  signupHref,
  className,
  SignupLink = DefaultSignupLink,
}: LandingFinalCtaProps) {
  const t = useT();

  return (
    <section
      className={cn('flex flex-col items-center gap-4 text-center', className)}
      data-testid="landing-final-cta"
    >
      <div className="flex max-w-lg flex-col gap-2">
        <p className="text-foreground m-0 text-lg font-medium leading-snug [word-break:keep-all]">
          {t('landing.finalCta.line1')}
        </p>
        <p className="text-foreground-muted m-0 text-sm">{t('landing.finalCta.line2')}</p>
        <p className="text-foreground-muted m-0 text-sm">{t('landing.finalCta.line3')}</p>
      </div>
      <SignupLink
        href={signupHref}
        className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full max-w-md')}
        testId="landing-final-cta-button"
      >
        <span {...landingAnalyticsEventAttr('landing.finalCta.click')}>
          {t('landing.finalCta.button')}
        </span>
      </SignupLink>
    </section>
  );
}

function DefaultSignupLink({
  href,
  className,
  testId,
  children,
}: {
  href: string;
  className?: string;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      data-testid={testId}
      {...landingAnalyticsEventAttr('landing.signup.started')}
    >
      {children}
    </a>
  );
}
