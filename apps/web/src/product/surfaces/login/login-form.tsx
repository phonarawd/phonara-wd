import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import type { LoginPageControllerView } from '@/features/auth/use-login-page-controller';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Input } from '@/product/primitives/input';
import { Switch } from '@/product/primitives/switch';

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

export type LoginFormProps = {
  engine: LoginPageControllerView;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  rememberMe: boolean;
  onRememberMeChange: (checked: boolean) => void;
};

export function LoginForm({ engine, onSubmit, rememberMe, onRememberMeChange }: LoginFormProps) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const errorMessage = engine.errorKey ? engine.t(engine.errorKey) : null;
  const credentialsReady = engine.email.trim().length > 0 && engine.password.length > 0;
  const submitDisabled = engine.isBusy || !credentialsReady;

  if (engine.magicSent) {
    return (
      <div
        className="border-line bg-surface-raised rounded-(--ds-radius-lg) border p-4"
        role="status"
        data-testid="login-magic-sent"
      >
        <p className="text-foreground m-0 text-sm font-medium">
          {t('auth.entry.shared.magicLinkSentTitle')}
        </p>
        <p className="text-foreground-muted m-0 mt-2 text-sm">
          {t('auth.entry.shared.magicLinkSentBody')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" data-testid="login-form">
      {errorMessage ? (
        <div className="flex flex-col gap-2">
          <p className="text-danger m-0 text-sm" role="alert" aria-live="polite">
            {errorMessage}
          </p>
          {engine.errorKey === 'auth.entry.errors.emailNotConfirmed' && engine.email.trim() ? (
            <AuthRouteLink
              href={`/verify-email?email=${encodeURIComponent(engine.email.trim())}&sent=1`}
              className="text-accent text-sm font-medium underline-offset-4 hover:underline"
            >
              {t('auth.entry.verify.ctaFromLogin')}
            </AuthRouteLink>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-foreground text-sm font-medium">
          {t('auth.entry.shared.emailLabel')}
        </label>
        <Input
          id="login-email"
          data-testid="login-email"
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
        <label htmlFor="login-password" className="text-foreground text-sm font-medium">
          {t('auth.entry.shared.passwordLabel')}
        </label>
        <div className="relative">
          <Input
            id="login-password"
            data-testid="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-foreground flex cursor-pointer items-center gap-2 text-sm">
          <Switch
            checked={rememberMe}
            onCheckedChange={onRememberMeChange}
            disabled={engine.isBusy}
            aria-label={t('auth.entry.login.remember')}
          />
          {t('auth.entry.login.remember')}
        </label>
        <AuthRouteLink
          href="/reset-password"
          className="text-accent text-sm font-medium underline-offset-4 hover:underline"
        >
          {t('auth.entry.login.forgot')}
        </AuthRouteLink>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={engine.isBusy && engine.password.length > 0}
        disabled={submitDisabled}
        data-testid="login-submit"
        aria-disabled={submitDisabled}
        title={!credentialsReady ? t('auth.entry.login.gateReason') : undefined}
      >
        {engine.isBusy ? t('auth.entry.login.submitting') : t('auth.entry.login.submit')}
      </Button>

      <div className="relative py-1">
        <div className="border-line absolute inset-0 flex items-center" aria-hidden>
          <div className="border-line w-full border-t" />
        </div>
        <p className="text-foreground-muted relative m-0 bg-background px-2 text-center text-xs">
          {t('auth.entry.shared.or')}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={engine.isBusy}
        data-testid="login-passkey"
        onClick={() => void engine.handlePasskeyLogin()}
      >
        <KeyRound className="size-4 shrink-0" aria-hidden />
        {t('auth.entry.login.passkey')}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="lg"
        className="w-full"
        disabled={engine.isBusy}
        data-testid="login-magic-link"
        onClick={() => void engine.handleMagicLink()}
      >
        {engine.isBusy
          ? t('auth.entry.shared.magicLinkSending')
          : t('auth.entry.shared.magicLinkSecondary')}
      </Button>

      <p className="text-foreground-muted m-0 text-center text-sm">
        {t('auth.entry.login.noAccount')}{' '}
        <AuthRouteLink
          href="/signup"
          className="text-accent font-medium underline-offset-4 hover:underline"
        >
          {t('auth.entry.login.toSignup')}
        </AuthRouteLink>
      </p>

      <p className="text-foreground-muted m-0 text-center text-sm">
        <AuthRouteLink
          href="/?landing=1"
          className="text-accent font-medium underline-offset-4 hover:underline"
        >
          {t('auth.entry.login.browseLanding')}
        </AuthRouteLink>
      </p>
    </form>
  );
}
