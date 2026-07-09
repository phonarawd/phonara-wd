import { Eye, EyeOff, Gift } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import type { SignupPageControllerView } from '@/features/auth/use-signup-page-controller';
import {
  getSignupPasswordIssue,
  isSignupPasswordAcceptable,
  isValidEmail,
  SIGNUP_MIN_PASSWORD_LENGTH,
} from '@/lib/auth-error-key';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';

import {
  SignupConsentPanel,
  signupConsentsComplete,
  type SignupConsentState,
} from './signup-consent-panel';

const EMPTY_CONSENTS: SignupConsentState = {
  age: false,
  terms: false,
  privacy: false,
  marketing: false,
};

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

function strengthMeta(password: string, t: ReturnType<typeof useT>) {
  const issue = getSignupPasswordIssue(password);
  if (issue !== null || password.length === 0) {
    return { score: 0 as const, label: t('auth.entry.signup.strength.weak') };
  }
  if (password.length >= 12) {
    return { score: 3 as const, label: t('auth.entry.signup.strength.strong') };
  }
  return { score: 2 as const, label: t('auth.entry.signup.strength.medium') };
}

export type SignupFormProps = {
  engine: SignupPageControllerView;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SignupForm({ engine, onSubmit }: SignupFormProps) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [consents, setConsents] = useState<SignupConsentState>(EMPTY_CONSENTS);

  const strength = strengthMeta(engine.password, t);
  const passwordReady = isSignupPasswordAcceptable(engine.password);
  const consentsReady = signupConsentsComplete(consents);
  const fieldsReady =
    engine.email.trim().length > 0 &&
    isValidEmail(engine.email.trim()) &&
    passwordReady &&
    engine.password === engine.confirm;
  const submitDisabled = engine.isBusy || !fieldsReady || !consentsReady;
  const errorMessage = engine.errorKey ? engine.t(engine.errorKey) : null;

  const gateReason = useMemo(() => {
    if (consentsReady && fieldsReady) return null;
    if (!consentsReady) return t('auth.entry.signup.consent.gateReason');
    if (!engine.email.trim()) return t('auth.entry.errors.emailRequired');
    if (!isValidEmail(engine.email.trim())) return t('auth.entry.errors.emailInvalid');
    if (!passwordReady) return t('auth.entry.errors.passwordWeak');
    if (engine.password !== engine.confirm) return t('auth.entry.errors.passwordMismatch');
    return t('auth.entry.signup.consent.gateReason');
  }, [consentsReady, engine.confirm, engine.email, engine.password, fieldsReady, passwordReady, t]);

  if (engine.verifySent) {
    return (
      <div
        className="border-line bg-surface-raised flex flex-col gap-3 rounded-(--ds-radius-lg) border p-4"
        role="status"
        data-testid="signup-verify-sent"
      >
        <p className="text-foreground m-0 text-sm font-medium">
          {t('auth.entry.signup.verifySentTitle')}
        </p>
        <p className="text-foreground-muted m-0 text-sm">{t('auth.entry.signup.verifySentBody')}</p>
        {engine.resendErrorKey ? (
          <p className="text-danger m-0 text-sm" role="alert">
            {engine.t(engine.resendErrorKey)}
          </p>
        ) : null}
        {engine.resendSent ? (
          <p className="text-foreground m-0 text-sm">{t('auth.entry.signup.verifyResent')}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={engine.resendBusy}
          loading={engine.resendBusy}
          data-testid="signup-resend"
          onClick={() => void engine.resendVerificationEmail()}
        >
          {engine.resendBusy
            ? t('auth.entry.signup.verifyResending')
            : t('auth.entry.signup.verifyResend')}
        </Button>
        <p className="text-foreground-muted m-0 text-center text-sm">
          {t('auth.entry.signup.haveAccount')}{' '}
          <AuthRouteLink
            href="/login"
            className="text-accent font-medium underline-offset-4 hover:underline"
          >
            {t('auth.entry.signup.toLogin')}
          </AuthRouteLink>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" data-testid="signup-form">
      {errorMessage ? (
        <p className="text-danger m-0 text-sm" role="alert" aria-live="polite">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-email" className="text-foreground text-sm font-medium">
          {t('auth.entry.shared.emailLabel')}
        </label>
        <Input
          id="signup-email"
          data-testid="signup-email"
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-password" className="text-foreground text-sm font-medium">
          {t('auth.entry.shared.passwordLabel')}
        </label>
        <div className="relative">
          <Input
            id="signup-password"
            data-testid="signup-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={SIGNUP_MIN_PASSWORD_LENGTH}
            placeholder={t('auth.entry.shared.passwordPlaceholder')}
            value={engine.password}
            disabled={engine.isBusy}
            className="pr-11"
            onChange={(event) => engine.setPassword(event.target.value)}
          />
          <button
            type="button"
            className="text-foreground-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            aria-label={
              showPassword ? t('auth.entry.login.hidePassword') : t('auth.entry.login.showPassword')
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
        {engine.password.length > 0 ? (
          <div className="text-foreground-muted flex items-center justify-between gap-2 text-xs">
            <span>{t('auth.entry.signup.strength.label')}</span>
            <span className="inline-flex items-center gap-2">
              <StrengthBar score={strength.score} />
              <span className="text-foreground font-medium">{strength.label}</span>
            </span>
          </div>
        ) : (
          <p className="text-foreground-muted m-0 text-xs">{t('auth.entry.shared.passwordHelp')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-confirm" className="text-foreground text-sm font-medium">
          {t('auth.entry.shared.confirmLabel')}
        </label>
        <div className="relative">
          <Input
            id="signup-confirm"
            data-testid="signup-confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={SIGNUP_MIN_PASSWORD_LENGTH}
            placeholder={t('auth.entry.shared.confirmPlaceholder')}
            value={engine.confirm}
            disabled={engine.isBusy}
            className="pr-11"
            onChange={(event) => engine.setConfirm(event.target.value)}
          />
          <button
            type="button"
            className="text-foreground-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            aria-label={
              showConfirm ? t('auth.entry.login.hidePassword') : t('auth.entry.login.showPassword')
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

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-referral"
          className="text-foreground flex items-center gap-1.5 text-sm font-medium"
        >
          <Gift className="text-accent size-4 shrink-0" aria-hidden />
          {t('auth.entry.signup.referralLabel')}
        </label>
        <Input
          id="signup-referral"
          data-testid="signup-referral"
          type="text"
          autoComplete="off"
          placeholder={t('auth.entry.signup.referralPlaceholder')}
          value={engine.referralCode}
          disabled={engine.isBusy}
          onChange={(event) => engine.setReferralCode(event.target.value)}
        />
      </div>

      <SignupConsentPanel value={consents} onChange={setConsents} disabled={engine.isBusy} />

      <p className="text-accent m-0 text-center text-sm font-medium">
        {t('auth.entry.signup.rewardBadge')}
      </p>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={engine.isBusy}
        disabled={submitDisabled}
        data-testid="signup-submit"
        aria-disabled={submitDisabled}
        title={submitDisabled ? (gateReason ?? undefined) : undefined}
      >
        {engine.isBusy ? t('auth.entry.signup.submitting') : t('auth.entry.signup.submitReward')}
      </Button>

      <p className="text-foreground-muted m-0 text-center text-sm">
        {t('auth.entry.signup.haveAccount')}{' '}
        <AuthRouteLink
          href="/login"
          className="text-accent font-medium underline-offset-4 hover:underline"
        >
          {t('auth.entry.signup.toLogin')}
        </AuthRouteLink>
      </p>
    </form>
  );
}

function StrengthBar({ score }: { score: 0 | 1 | 2 | 3 }) {
  return (
    <span aria-hidden className="inline-flex gap-0.5">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            'h-1.5 w-5 rounded-full',
            index < score
              ? score >= 3
                ? 'bg-accent'
                : score === 2
                  ? 'bg-warning'
                  : 'bg-danger'
              : 'bg-line',
          )}
          data-state={
            index < score ? (score >= 3 ? 'strong' : score === 2 ? 'medium' : 'weak') : 'empty'
          }
        />
      ))}
    </span>
  );
}
