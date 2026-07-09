import { useEffect, type FormEvent } from 'react';

import { ADMIN_NEGATIVE_AUTH_TEST_IDS } from '@/domain/admin-security-display-contract';
import { useAdminMfaChallengePageController } from '@/hooks/use-admin-mfa-challenge-page-controller';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';
import { ShellPage } from '@/product/layout/content-shell';

function AdminMfaChallengeLoadingShell() {
  return (
    <ShellPage className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4">
      <div
        className="flex w-full max-w-md flex-col gap-4"
        data-testid="admin-mfa-challenge-loading"
      >
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </ShellPage>
  );
}

/** Canonical admin `/mfa/challenge` — TOTP step-up · AAL2 · login/enroll handoff · AuthShell only. */
export function AdminMfaChallengePage() {
  const t = useT();
  const engine = useAdminMfaChallengePageController();

  useEffect(() => {
    document.title = t('admin.mfa.challenge.title');
  }, [t]);

  if (engine.loading) {
    return <AdminMfaChallengeLoadingShell />;
  }

  if (engine.forbidden) {
    return (
      <ShellPage
        className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
        data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.forbidden}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('admin.mfa.challenge.title')}</CardTitle>
            <CardDescription>{t('admin.forbidden')}</CardDescription>
          </CardHeader>
        </Card>
      </ShellPage>
    );
  }

  if (engine.setupError) {
    return (
      <ShellPage
        className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
        data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.mfaChallenge}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('admin.mfa.challenge.title')}</CardTitle>
            <CardDescription>{t('admin.mfa.challenge.setupError')}</CardDescription>
          </CardHeader>
        </Card>
      </ShellPage>
    );
  }

  if (engine.missingFactor) {
    return (
      <ShellPage
        className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
        data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.mfaChallenge}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('admin.mfa.challenge.title')}</CardTitle>
            <CardDescription>{t('admin.mfa.challenge.missingFactor')}</CardDescription>
          </CardHeader>
        </Card>
      </ShellPage>
    );
  }

  const codeReady = /^\d{6}$/.test(engine.code.trim());
  const submitDisabled = engine.isBusy || !codeReady;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void engine.handleVerifyChallenge(event);
  };

  return (
    <ShellPage
      className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
      data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.mfaChallenge}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('admin.mfa.challenge.title')}</CardTitle>
          <CardDescription>{t('admin.mfa.challenge.description')}</CardDescription>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col gap-4"
            data-testid="admin-mfa-challenge-form"
          >
            {engine.verifyError ? (
              <p className="text-danger m-0 text-sm" role="alert" aria-live="polite">
                {t('admin.mfa.challenge.verifyError')}
              </p>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-mfa-challenge-code"
                className="text-foreground text-sm font-medium"
              >
                {t('admin.mfa.challenge.codeLabel')}
              </label>
              <Input
                id="admin-mfa-challenge-code"
                data-testid="admin-mfa-challenge-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder={t('admin.mfa.challenge.codePlaceholder')}
                value={engine.code}
                disabled={engine.isBusy}
                onChange={(event) =>
                  engine.setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={engine.isBusy}
              disabled={submitDisabled}
              data-testid="admin-mfa-challenge-submit"
              aria-disabled={submitDisabled}
            >
              {engine.isBusy ? t('admin.mfa.challenge.verifying') : t('admin.mfa.challenge.submit')}
            </Button>
          </form>
        </CardBody>
      </Card>
    </ShellPage>
  );
}
