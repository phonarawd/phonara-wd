import { ArrowLeft, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import type { ResetPasswordPageControllerView } from '@/features/auth/use-reset-password-page-controller';
import {
  getSignupPasswordIssue,
  isSignupPasswordAcceptable,
  isValidEmail,
  SIGNUP_MIN_PASSWORD_LENGTH,
} from '@/lib/auth-error-key';
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

export type ResetPasswordFormProps = {
  engine: ResetPasswordPageControllerView;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ResetPasswordForm({ engine, onSubmit }: ResetPasswordFormProps) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const errorMessage = engine.errorKey ? engine.t(engine.errorKey) : null;
  const requestReady = engine.email.trim().length > 0 && isValidEmail(engine.email.trim());
  const recoveryReady =
    isSignupPasswordAcceptable(engine.password) && engine.password === engine.confirm;

  if (engine.completed) {
    return (
      <div
        className="border-line bg-surface-raised flex flex-col gap-3 rounded-(--ds-radius-lg) border p-4 text-center"
        role="status"
        data-testid="reset-password-done"
      >
        <MailCheck className="text-accent mx-auto size-8" aria-hidden />
        <p className="text-foreground m-0 text-sm font-medium">
          {t('auth.entry.reset.updateDoneTitle')}
        </p>
        <p className="text-foreground-muted m-0 text-sm">{t('auth.entry.reset.updateDoneBody')}</p>
        <AuthRouteLink
          href="/login"
          className="text-accent inline-flex items-center justify-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {t('auth.entry.reset.backToLogin')}
        </AuthRouteLink>
      </div>
    );
  }

  if (engine.recoveryMode) {
    const gateReason = !engine.password.trim()
      ? t('auth.entry.errors.passwordRequired')
      : getSignupPasswordIssue(engine.password) !== null
        ? t('auth.entry.errors.passwordWeak')
        : engine.password !== engine.confirm
          ? t('auth.entry.errors.passwordMismatch')
          : null;
    const submitDisabled = engine.isBusy || !recoveryReady;

    return (
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4"
        data-testid="reset-password-recovery-form"
      >
        {errorMessage ? (
          <p className="text-danger m-0 text-sm" role="alert" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-new-password" className="text-foreground text-sm font-medium">
            {t('auth.entry.reset.newPasswordLabel')}
          </label>
          <div className="relative">
            <Input
              id="reset-new-password"
              data-testid="reset-new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={SIGNUP_MIN_PASSWORD_LENGTH}
              placeholder={t('auth.entry.reset.newPasswordPlaceholder')}
              value={engine.password}
              disabled={engine.isBusy}
              className="pr-11"
              onChange={(event) => engine.setPassword(event.target.value)}
            />
            <button
              type="button"
              className="text-foreground-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              aria-label={
                showPassword
                  ? t('auth.entry.login.hidePassword')
                  : t('auth.entry.login.showPassword')
              }
              onClick={() => setShowPassword((value) => !value)}
              disabled={engine.isBusy}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {engine.password.length === 0 ? (
            <p className="text-foreground-muted m-0 text-xs">
              {t('auth.entry.shared.passwordHelp')}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-confirm-password" className="text-foreground text-sm font-medium">
            {t('auth.entry.reset.confirmNewLabel')}
          </label>
          <div className="relative">
            <Input
              id="reset-confirm-password"
              data-testid="reset-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={SIGNUP_MIN_PASSWORD_LENGTH}
              placeholder={t('auth.entry.reset.confirmNewPlaceholder')}
              value={engine.confirm}
              disabled={engine.isBusy}
              className="pr-11"
              onChange={(event) => engine.setConfirm(event.target.value)}
            />
            <button
              type="button"
              className="text-foreground-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              aria-label={
                showConfirm
                  ? t('auth.entry.login.hidePassword')
                  : t('auth.entry.login.showPassword')
              }
              onClick={() => setShowConfirm((value) => !value)}
              disabled={engine.isBusy}
            >
              {showConfirm ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={engine.isBusy}
          disabled={submitDisabled}
          data-testid="reset-submit"
          aria-disabled={submitDisabled}
          title={submitDisabled ? (gateReason ?? undefined) : undefined}
        >
          {engine.isBusy
            ? t('auth.entry.reset.updateSubmitting')
            : t('auth.entry.reset.updateSubmit')}
        </Button>

        <AuthRouteLink
          href="/login"
          className="text-accent inline-flex items-center justify-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {t('auth.entry.reset.backToLogin')}
        </AuthRouteLink>
      </form>
    );
  }

  if (engine.sent) {
    return (
      <div className="flex flex-col gap-4" data-testid="reset-password-sent">
        <div
          className="border-line bg-surface-raised flex flex-col gap-2 rounded-(--ds-radius-lg) border p-4"
          role="status"
        >
          <p className="text-foreground m-0 text-sm font-medium">
            {t('auth.entry.reset.checkEmailHeadline')}
          </p>
          {engine.email ? (
            <p className="text-foreground-muted m-0 text-sm tabular-nums">{engine.email}</p>
          ) : null}
          <p className="text-foreground-muted m-0 text-sm">
            {t('auth.entry.reset.requestSentBody')}
          </p>
        </div>
        <p className="text-foreground-muted m-0 text-center text-sm">
          {t('auth.entry.reset.resendPrompt')}{' '}
          <button
            type="button"
            data-testid="reset-resend"
            className="text-accent font-medium underline-offset-4 hover:underline disabled:opacity-50"
            disabled={engine.isBusy}
            onClick={() => {
              const form = document.getElementById('reset-password-resend-form');
              if (form instanceof HTMLFormElement) form.requestSubmit();
            }}
          >
            {t('auth.entry.reset.resend')}
          </button>
        </p>
        <form id="reset-password-resend-form" onSubmit={onSubmit} className="hidden" />
        <AuthRouteLink
          href="/login"
          className="text-accent inline-flex items-center justify-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {t('auth.entry.reset.backToLogin')}
        </AuthRouteLink>
      </div>
    );
  }

  const submitDisabled = engine.isBusy || !requestReady;
  const gateReason = requestReady ? null : t('auth.entry.errors.emailRequired');

  return (
    <div className="flex flex-col gap-4" data-testid="reset-password-request">
      {engine.recoveryInvalid ? (
        <p className="text-danger m-0 text-sm" role="alert">
          {t('auth.entry.reset.recoveryInvalid')}
        </p>
      ) : null}

      <p className="text-foreground-muted m-0 text-sm">
        {t('auth.entry.reset.emailHintLead')}
        <span className="text-accent font-medium">{t('auth.entry.reset.emailHintAccent')}</span>
        {t('auth.entry.reset.emailHintTail')}
      </p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorMessage ? (
          <p className="text-danger m-0 text-sm" role="alert" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-email" className="text-foreground text-sm font-medium">
            {t('auth.entry.shared.emailLabel')}
          </label>
          <Input
            id="reset-email"
            data-testid="reset-email"
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
          data-testid="reset-submit"
          aria-disabled={submitDisabled}
          title={submitDisabled ? (gateReason ?? undefined) : undefined}
        >
          {engine.isBusy
            ? t('auth.entry.reset.requestSubmitting')
            : t('auth.entry.reset.sendLinkCta')}
        </Button>
      </form>

      <AuthRouteLink
        href="/login"
        className="text-accent inline-flex items-center justify-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {t('auth.entry.reset.backToLogin')}
      </AuthRouteLink>
    </div>
  );
}
