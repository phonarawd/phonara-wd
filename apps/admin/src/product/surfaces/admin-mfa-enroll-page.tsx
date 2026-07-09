import { useEffect, type FormEvent } from 'react';

import { ADMIN_NEGATIVE_AUTH_TEST_IDS } from '@/domain/admin-security-display-contract';
import { useAdminMfaEnrollPageController } from '@/hooks/use-admin-mfa-enroll-page-controller';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';
import { ShellPage } from '@/product/layout/content-shell';

function AdminMfaEnrollLoadingShell() {
  return (
    <ShellPage className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-4" data-testid="admin-mfa-enroll-loading">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mx-auto h-48 w-48" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </ShellPage>
  );
}

/** Canonical admin `/mfa/enroll` — TOTP QR enrollment · AAL2 prerequisite · AuthShell only. */
export function AdminMfaEnrollPage() {
  const t = useT();
  const engine = useAdminMfaEnrollPageController();

  useEffect(() => {
    document.title = t('admin.mfa.enroll.title');
  }, [t]);

  if (engine.loading) {
    return <AdminMfaEnrollLoadingShell />;
  }

  if (engine.forbidden) {
    return (
      <ShellPage
        className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
        data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.forbidden}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('admin.mfa.enroll.title')}</CardTitle>
            <CardDescription>{t('admin.forbidden')}</CardDescription>
          </CardHeader>
        </Card>
      </ShellPage>
    );
  }

  if (engine.setupError || !engine.enroll) {
    return (
      <ShellPage
        className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
        data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.mfaEnroll}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('admin.mfa.enroll.title')}</CardTitle>
            <CardDescription>{t('admin.mfa.enroll.setupError')}</CardDescription>
          </CardHeader>
        </Card>
      </ShellPage>
    );
  }

  const codeReady = /^\d{6}$/.test(engine.code.trim());
  const submitDisabled = engine.isBusy || !codeReady;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void engine.handleVerifyEnroll(event);
  };

  return (
    <ShellPage
      className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
      data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.mfaEnroll}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('admin.mfa.enroll.title')}</CardTitle>
          <CardDescription>{t('admin.mfa.enroll.description')}</CardDescription>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col gap-4"
            data-testid="admin-mfa-enroll-form"
          >
            <div className="flex flex-col gap-2">
              <p className="text-foreground m-0 text-sm font-medium">
                {t('admin.mfa.enroll.qrLabel')}
              </p>
              <img
                src={engine.enroll.qrCode}
                alt={t('admin.mfa.enroll.qrAlt')}
                className="border-border mx-auto h-48 w-48 rounded-md border bg-white p-2"
                data-testid="admin-mfa-enroll-qr"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-mfa-enroll-secret"
                className="text-foreground text-sm font-medium"
              >
                {t('admin.mfa.enroll.secretLabel')}
              </label>
              <Input
                id="admin-mfa-enroll-secret"
                data-testid="admin-mfa-enroll-secret"
                readOnly
                value={engine.enroll.secret}
                className="font-mono text-xs"
                aria-readonly
              />
            </div>

            {engine.verifyError ? (
              <p className="text-danger m-0 text-sm" role="alert" aria-live="polite">
                {t('admin.mfa.enroll.verifyError')}
              </p>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-mfa-enroll-code"
                className="text-foreground text-sm font-medium"
              >
                {t('admin.mfa.enroll.codeLabel')}
              </label>
              <Input
                id="admin-mfa-enroll-code"
                data-testid="admin-mfa-enroll-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder={t('admin.mfa.enroll.codePlaceholder')}
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
              data-testid="admin-mfa-enroll-submit"
              aria-disabled={submitDisabled}
            >
              {engine.isBusy ? t('admin.mfa.enroll.verifying') : t('admin.mfa.enroll.submit')}
            </Button>
          </form>
        </CardBody>
      </Card>
    </ShellPage>
  );
}
