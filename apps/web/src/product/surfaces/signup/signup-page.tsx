import { useEffect, type FormEvent } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useSignupPageController } from '@/features/auth/use-signup-page-controller';
import { PLATFORM_POSITIONING_KEYS } from '@/domain/platform-narrative-display-contract';
import { useT } from '@/product/i18n';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import { AuthEntryLayout, AuthLegalFooter } from '../login/auth-entry-layout';
import { SignupForm } from './signup-form';

function SignupLoadingShell() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-8" data-testid="signup-loading">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export type SignupPageProps = {
  initialReferralCode?: string;
};

/** Canonical `/signup` surface — email/password · optional referral_code (P3·W2). */
export function SignupPage({ initialReferralCode }: SignupPageProps) {
  const t = useT();
  const { loading: authLoading } = useAuth();
  const engine = useSignupPageController({ initialReferralCode });

  useEffect(() => {
    document.title = t('auth.entry.signup.pageTitle');
  }, [t]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void engine.handleSubmit(event);
  };

  if (authLoading || engine.loading) {
    return <SignupLoadingShell />;
  }

  return (
    <AuthEntryLayout
      testId="signup-page"
      title={t('auth.entry.signup.title')}
      subtitle={t(PLATFORM_POSITIONING_KEYS.subhead)}
      footer={<AuthLegalFooter />}
    >
      <div className={cn('border-line bg-surface rounded-(--ds-radius-lg) border p-4 md:p-6')}>
        <SignupForm engine={engine} onSubmit={onSubmit} />
      </div>
    </AuthEntryLayout>
  );
}
