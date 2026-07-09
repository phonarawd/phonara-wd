import { useEffect, type FormEvent } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useResetPasswordPageController } from '@/features/auth/use-reset-password-page-controller';
import { useT } from '@/product/i18n';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import { AuthEntryLayout, AuthLegalFooter } from '../login/auth-entry-layout';
import { ResetPasswordForm } from './reset-password-form';

function ResetPasswordLoadingShell() {
  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col gap-4 py-8"
      data-testid="reset-password-loading"
    >
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

/** Canonical `/reset-password` surface — request link · recovery update (P3·W2). */
export function ResetPasswordPage() {
  const t = useT();
  const { loading: authLoading } = useAuth();
  const engine = useResetPasswordPageController();

  useEffect(() => {
    document.title = t('auth.entry.reset.pageTitle');
  }, [t]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void engine.handleSubmit(event);
  };

  if (authLoading || engine.loading) {
    return <ResetPasswordLoadingShell />;
  }

  const title = engine.recoveryMode ? t('auth.entry.reset.title') : t('auth.entry.reset.pageTitle');
  const subtitle = engine.recoveryMode
    ? t('auth.entry.shared.passwordHelp')
    : t('auth.entry.reset.subtitle');

  return (
    <AuthEntryLayout
      testId="reset-password-page"
      title={title}
      subtitle={subtitle}
      footer={<AuthLegalFooter />}
    >
      <div className={cn('border-line bg-surface rounded-(--ds-radius-lg) border p-4 md:p-6')}>
        <ResetPasswordForm engine={engine} onSubmit={onSubmit} />
      </div>
    </AuthEntryLayout>
  );
}
