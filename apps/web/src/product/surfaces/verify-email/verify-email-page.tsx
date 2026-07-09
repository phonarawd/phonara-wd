import { useEffect, type FormEvent } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useVerifyEmailPageController } from '@/features/auth/use-verify-email-page-controller';
import { useT } from '@/product/i18n';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import { AuthEntryLayout, AuthLegalFooter } from '../login/auth-entry-layout';
import { VerifyEmailForm } from './verify-email-form';

function VerifyEmailLoadingShell() {
  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col gap-4 py-8"
      data-testid="verify-email-loading"
    >
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export type VerifyEmailPageProps = {
  initialEmail?: string;
  startSent?: boolean;
};

/** Canonical `/verify-email` surface — resend signup confirmation (P3·W2). */
export function VerifyEmailPage({ initialEmail, startSent }: VerifyEmailPageProps) {
  const t = useT();
  const { loading: authLoading } = useAuth();
  const engine = useVerifyEmailPageController({ initialEmail, startSent });

  useEffect(() => {
    document.title = t('auth.entry.verify.pageTitle');
  }, [t]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void engine.handleSubmit(event);
  };

  if (authLoading || engine.loading) {
    return <VerifyEmailLoadingShell />;
  }

  const title = engine.sent ? t('auth.entry.signup.verifySentTitle') : t('auth.entry.verify.title');
  const subtitle = engine.sent
    ? t('auth.entry.signup.verifySentBody')
    : t('auth.entry.verify.subtitle');

  return (
    <AuthEntryLayout
      testId="verify-email-page"
      title={title}
      subtitle={subtitle}
      footer={<AuthLegalFooter />}
    >
      <div className={cn('border-line bg-surface rounded-(--ds-radius-lg) border p-4 md:p-6')}>
        <VerifyEmailForm engine={engine} onSubmit={onSubmit} />
      </div>
    </AuthEntryLayout>
  );
}
