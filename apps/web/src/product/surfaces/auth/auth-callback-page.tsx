import { Loader2 } from 'lucide-react';

import { useEffect } from 'react';

import { useAuthCallbackPageController } from '@/features/auth/use-auth-callback-page-controller';

import { useT } from '@/product/i18n';

import { cn } from '@/product/primitives/lib/cn';

import { AuthEntryLayout, AuthLegalFooter } from '../login/auth-entry-layout';

function AuthRouteLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/** Canonical `/auth/callback` surface — OAuth/magic-link session exchange (P3·W2). */

export function AuthCallbackPage() {
  const t = useT();

  const engine = useAuthCallbackPageController();

  useEffect(() => {
    document.title = t('auth.entry.callback.processing');
  }, [t]);

  if (engine.state === 'failed') {
    return (
      <AuthEntryLayout
        testId="auth-callback-failed"
        title={engine.t('auth.entry.callback.failedTitle')}
        subtitle={engine.t('auth.entry.callback.failedBody')}
        footer={<AuthLegalFooter />}
      >
        <div
          className={cn(
            'border-line bg-surface flex flex-col gap-4 rounded-(--ds-radius-lg) border p-4 text-center md:p-6',
          )}
          role="alert"
          data-testid="auth-callback-failed-panel"
        >
          <p className="text-foreground-muted m-0 text-sm">
            {engine.t('auth.entry.callback.failedBody')}
          </p>

          <AuthRouteLink
            href="/login"
            className="text-primary inline-flex items-center justify-center text-sm font-medium underline-offset-4 hover:underline"
          >
            {engine.t('auth.entry.signup.toLogin')}
          </AuthRouteLink>
        </div>
      </AuthEntryLayout>
    );
  }

  return (
    <AuthEntryLayout
      testId="auth-callback-loading"
      title={engine.t('auth.entry.callback.processing')}
      subtitle={engine.t('auth.entry.shared.statusLoading')}
      footer={<AuthLegalFooter />}
    >
      <div
        className={cn(
          'border-line bg-surface flex flex-col items-center gap-4 rounded-(--ds-radius-lg) border p-6 text-center md:p-8',
        )}
        aria-busy="true"
        data-testid="auth-callback-processing"
      >
        <Loader2 className="text-accent size-8 animate-spin" aria-hidden />

        <p className="text-foreground-muted m-0 text-sm">
          {engine.t('auth.entry.callback.processing')}
        </p>
      </div>
    </AuthEntryLayout>
  );
}
