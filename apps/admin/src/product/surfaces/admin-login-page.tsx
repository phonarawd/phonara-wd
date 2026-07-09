import { useEffect, type FormEvent } from 'react';

import { ADMIN_NEGATIVE_AUTH_TEST_IDS } from '@/domain/admin-security-display-contract';
import { useAdminLoginPageController } from '@/hooks/use-admin-login-page-controller';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';
import { ShellPage } from '@/product/layout/content-shell';

function AdminLoginLoadingShell() {
  return (
    <ShellPage className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-4" data-testid="admin-login-loading">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </ShellPage>
  );
}

/** Canonical admin `/login` — password auth · profiles role gate · MFA handoff. */
export function AdminLoginPage() {
  const t = useT();
  const engine = useAdminLoginPageController();

  useEffect(() => {
    document.title = t('admin.login.title');
  }, [t]);

  if (engine.loading) {
    return <AdminLoginLoadingShell />;
  }

  if (engine.forbidden) {
    return (
      <ShellPage
        className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
        data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.forbidden}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('admin.login.title')}</CardTitle>
            <CardDescription>{t('admin.forbidden')}</CardDescription>
          </CardHeader>
        </Card>
      </ShellPage>
    );
  }

  const errorMessage = engine.errorKey ? engine.t(engine.errorKey) : null;
  const credentialsReady = engine.email.trim().length > 0 && engine.password.length > 0;
  const submitDisabled = engine.isBusy || !credentialsReady;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void engine.handlePasswordLogin(event);
  };

  return (
    <ShellPage
      className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
      data-testid="admin-login-page"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('admin.login.title')}</CardTitle>
          <CardDescription>{t('admin.login.adminOnly')}</CardDescription>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col gap-4"
            data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.loginForm}
          >
            {errorMessage ? (
              <p className="text-danger m-0 text-sm" role="alert" aria-live="polite">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-login-email" className="text-foreground text-sm font-medium">
                {t('auth.entry.shared.emailLabel')}
              </label>
              <Input
                id="admin-login-email"
                data-testid="admin-login-email"
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
              <label htmlFor="admin-login-password" className="text-foreground text-sm font-medium">
                {t('auth.entry.shared.passwordLabel')}
              </label>
              <Input
                id="admin-login-password"
                data-testid="admin-login-password"
                type="password"
                autoComplete="current-password"
                placeholder={t('auth.entry.shared.passwordPlaceholder')}
                value={engine.password}
                disabled={engine.isBusy}
                onChange={(event) => engine.setPassword(event.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={engine.isBusy}
              disabled={submitDisabled}
              data-testid="admin-login-submit"
              aria-disabled={submitDisabled}
            >
              {engine.isBusy ? t('admin.login.signing') : t('admin.login.signIn')}
            </Button>
          </form>
        </CardBody>
      </Card>
    </ShellPage>
  );
}
