import { useEffect, type FormEvent } from 'react';
import { Fingerprint, KeyRound, ShieldCheck } from 'lucide-react';

import { useSettingsSecurityController } from '@/features/auth/use-settings-security-controller';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function SecurityLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="settings-security-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Canonical `/settings/security` — passkey + TOTP (P5·W4). */
export function SecuritySettingsPage() {
  const t = useT();
  const engine = useSettingsSecurityController();

  useEffect(() => {
    document.title = t('seo.security.title');
  }, [t]);

  if (engine.loading) {
    return <SecurityLoadingShell />;
  }

  if (engine.errorKey) {
    return (
      <div
        className="border-danger/30 bg-surface flex flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4"
        data-testid="settings-security-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(engine.errorKey)}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void engine.refresh()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const hasTotp = engine.security?.hasVerifiedTotp ?? false;
  const totpCodeReady = /^\d{6}$/.test(engine.totpCode.trim());
  const totpSubmitDisabled = engine.totpEnrolling || !totpCodeReady;

  const onTotpSubmit = (event: FormEvent<HTMLFormElement>) => {
    void engine.handleVerifyTotpEnroll(event);
  };

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6" data-testid="settings-security-page">
      <header className="space-y-3">
        <a
          href="/account"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          {t('security.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('security.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">{t('security.subtitle')}</p>
        </div>
      </header>

      <Card data-testid="settings-security-passkey-card">
        <CardHeader className="flex flex-row items-start gap-3">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <Fingerprint className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('security.passkey.title')}</CardTitle>
            <CardDescription>{t('security.passkey.desc')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          {engine.passkeys.length === 0 ? (
            <p
              className="text-foreground-muted m-0 text-sm"
              data-testid="settings-security-passkey-empty"
            >
              {t('security.passkey.empty')}
            </p>
          ) : (
            <ul
              className="m-0 flex list-none flex-col gap-2 p-0"
              data-testid="settings-security-passkey-list"
            >
              {engine.passkeys.map((passkey) => (
                <li
                  key={passkey.id}
                  className="border-line bg-surface flex items-center justify-between gap-3 rounded-(--ds-radius-md) border px-3 py-2"
                  data-testid="settings-security-passkey-row"
                >
                  <span className="text-foreground text-sm font-medium">
                    {passkey.friendly_name ?? t('security.passkey.unnamed')}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={engine.passkeyBusy}
                    onClick={() => void engine.handleDeletePasskey(passkey.id)}
                    data-testid={`settings-security-passkey-remove-${passkey.id}`}
                  >
                    {t('security.passkey.remove')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            loading={engine.passkeyBusy}
            disabled={engine.passkeyBusy}
            onClick={() => void engine.handleRegisterPasskey()}
            data-testid="settings-security-passkey-add"
          >
            {t('security.passkey.add')}
          </Button>
        </CardBody>
      </Card>

      <Card data-testid="settings-security-totp-card">
        <CardHeader className="flex flex-row items-start gap-3">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <KeyRound className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('security.totp.title')}</CardTitle>
            <CardDescription>{t('security.totp.desc')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          {hasTotp ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className="text-foreground m-0 text-sm font-medium"
                data-testid="settings-security-totp-active"
              >
                {t('security.totp.active')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={engine.totpRemoveBusy}
                disabled={engine.totpRemoveBusy}
                onClick={() => void engine.handleRemoveTotp()}
                data-testid="settings-security-totp-remove"
              >
                {t('security.totp.remove')}
              </Button>
            </div>
          ) : engine.totpEnroll ? (
            <form
              onSubmit={onTotpSubmit}
              noValidate
              className="flex flex-col gap-4"
              data-testid="settings-security-totp-enroll-form"
            >
              <img
                src={engine.totpEnroll.qrCode}
                alt={t('security.totp.qrAlt')}
                className="border-line mx-auto h-48 w-48 rounded-(--ds-radius-md) border bg-white p-2"
                data-testid="settings-security-totp-qr"
              />
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="settings-security-totp-secret"
                  className="text-foreground text-sm font-medium"
                >
                  {t('security.totp.secretLabel')}
                </label>
                <Input
                  id="settings-security-totp-secret"
                  readOnly
                  value={engine.totpEnroll.secret}
                  className="font-mono text-xs"
                  aria-readonly
                  data-testid="settings-security-totp-secret"
                />
              </div>
              {engine.totpVerifyError ? (
                <p className="text-danger m-0 text-sm" role="alert" aria-live="polite">
                  {t('security.totp.verifyError')}
                </p>
              ) : null}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="settings-security-totp-code"
                  className="text-foreground text-sm font-medium"
                >
                  {t('security.totp.codePlaceholder')}
                </label>
                <Input
                  id="settings-security-totp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder={t('security.totp.codePlaceholder')}
                  value={engine.totpCode}
                  disabled={engine.totpEnrolling}
                  onChange={(event) =>
                    engine.setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  data-testid="settings-security-totp-code"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="sm:flex-1"
                  loading={engine.totpEnrolling}
                  disabled={totpSubmitDisabled}
                  data-testid="settings-security-totp-verify"
                >
                  {t('security.totp.verify')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={engine.totpEnrolling}
                  onClick={engine.handleCancelTotpEnroll}
                  data-testid="settings-security-totp-cancel"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              loading={engine.totpEnrolling}
              disabled={engine.totpEnrolling}
              onClick={() => void engine.handleStartTotpEnroll()}
              data-testid="settings-security-totp-start"
            >
              {t('security.totp.start')}
            </Button>
          )}
        </CardBody>
      </Card>

      <Card className={cn('border-line/80 bg-surface/80')} data-testid="settings-security-why-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="text-foreground-muted flex size-10 shrink-0 items-center justify-center"
            aria-hidden
          >
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('security.why.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-2 pt-0">
          <p className="text-foreground-muted m-0 text-sm">{t('security.why.body')}</p>
          {hasTotp ? (
            <p className="text-foreground-muted m-0 text-sm">{t('security.why.withdrawHint')}</p>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
