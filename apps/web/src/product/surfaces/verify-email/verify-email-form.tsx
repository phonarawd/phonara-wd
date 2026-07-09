import { ArrowLeft } from 'lucide-react';
import type { FormEvent } from 'react';

import type { VerifyEmailPageControllerView } from '@/features/auth/use-verify-email-page-controller';
import { isValidEmail } from '@/lib/auth-error-key';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Input } from '@/product/primitives/input';

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

export type VerifyEmailFormProps = {
  engine: VerifyEmailPageControllerView;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function VerifyEmailForm({ engine, onSubmit }: VerifyEmailFormProps) {
  const t = useT();
  const errorMessage = engine.errorKey ? engine.t(engine.errorKey) : null;
  const requestReady = engine.email.trim().length > 0 && isValidEmail(engine.email.trim());
  const submitDisabled = engine.isBusy || !requestReady;
  const gateReason = requestReady ? null : t('auth.entry.errors.emailRequired');

  if (engine.sent) {
    return (
      <div className="flex flex-col gap-4" data-testid="verify-email-sent">
        <div
          className="border-line bg-surface-raised flex flex-col gap-2 rounded-(--ds-radius-lg) border p-4"
          role="status"
        >
          <p className="text-foreground m-0 text-sm font-medium">
            {t('auth.entry.verify.checkEmailHeadline')}
          </p>
          {engine.email ? (
            <p className="text-foreground-muted m-0 text-sm tabular-nums">{engine.email}</p>
          ) : null}
          <p className="text-foreground-muted m-0 text-sm">
            {t('auth.entry.signup.verifySentBody')}
          </p>
        </div>

        {engine.resendErrorKey ? (
          <p className="text-danger m-0 text-sm" role="alert">
            {engine.t(engine.resendErrorKey)}
          </p>
        ) : null}
        {engine.resendSent ? (
          <p className="text-foreground m-0 text-sm">{t('auth.entry.signup.verifyResent')}</p>
        ) : null}

        <p className="text-foreground-muted m-0 text-center text-sm">
          {t('auth.entry.verify.resendPrompt')}{' '}
          <button
            type="button"
            data-testid="verify-email-resend"
            className="text-primary font-medium underline-offset-4 hover:underline disabled:opacity-50"
            disabled={engine.resendBusy}
            onClick={() => void engine.resendVerificationEmail()}
          >
            {engine.resendBusy
              ? t('auth.entry.signup.verifyResending')
              : t('auth.entry.signup.verifyResend')}
          </button>
        </p>

        <AuthRouteLink
          href="/login"
          className="text-primary inline-flex items-center justify-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {t('auth.entry.reset.backToLogin')}
        </AuthRouteLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="verify-email-request">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorMessage ? (
          <p className="text-danger m-0 text-sm" role="alert" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="verify-email" className="text-foreground text-sm font-medium">
            {t('auth.entry.shared.emailLabel')}
          </label>
          <Input
            id="verify-email"
            data-testid="verify-email-input"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t('auth.entry.shared.emailPlaceholder')}
            value={engine.email}
            disabled={engine.isBusy}
            onChange={(event) => engine.setEmail(event.target.value)}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={engine.isBusy}
          disabled={submitDisabled}
          data-testid="verify-email-submit"
          aria-disabled={submitDisabled}
          title={submitDisabled ? (gateReason ?? undefined) : undefined}
        >
          {engine.isBusy ? t('auth.entry.verify.submitting') : t('auth.entry.verify.submit')}
        </Button>
      </form>

      <p className="text-foreground-muted m-0 text-center text-sm">
        {t('auth.entry.signup.haveAccount')}{' '}
        <AuthRouteLink
          href="/login"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {t('auth.entry.signup.toLogin')}
        </AuthRouteLink>
      </p>
    </div>
  );
}
