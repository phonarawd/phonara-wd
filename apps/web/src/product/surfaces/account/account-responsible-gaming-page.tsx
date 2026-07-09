import { useEffect, type FormEvent } from 'react';
import { HeartHandshake, ShieldAlert } from 'lucide-react';

import { useAccountRgController } from '@/features/account/use-account-rg-controller';
import { LEGAL_RESPONSIBLE_GAMING_ROUTE } from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { ConfirmDialog } from '@/product/primitives/confirm-dialog';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function RgLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="account-rg-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Canonical `/account/responsible-gaming` — RG limits read + user controls (P5). */
export function AccountResponsibleGamingPage() {
  const t = useT();
  const engine = useAccountRgController();

  useEffect(() => {
    document.title = t('seo.rg.title');
  }, [t]);

  if (engine.loading) {
    return <RgLoadingShell />;
  }

  if (engine.errorKey) {
    return (
      <div
        className="border-danger/30 bg-surface flex flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4"
        data-testid="account-rg-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(engine.errorKey)}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void engine.refresh()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const limitsSaveDisabled =
    engine.limitsSaveBusy ||
    engine.depositKrwGateKey !== null ||
    engine.lossGameUsdtGateKey !== null ||
    (!engine.depositKrwInput.trim() && !engine.lossGameUsdtInput.trim());

  const selfExclusionDisabled =
    engine.selfExclusionBusy ||
    engine.selfExclusionActive ||
    engine.selfExclusionDaysGateKey !== null;

  const onLimitsSubmit = (event: FormEvent<HTMLFormElement>) => {
    void engine.handleSaveLimits(event);
  };

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6" data-testid="account-rg-page">
      <header className="space-y-3">
        <a
          href="/account"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          {t('rg.back')}
        </a>
        <div className="space-y-2">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('rg.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">{t('rg.description')}</p>
          <p className="text-foreground-muted m-0 text-xs">{t('rg.hero.note')}</p>
        </div>
      </header>

      {engine.selfExclusionActive ? (
        <div
          className="border-warning/40 bg-warning/10 flex flex-col gap-2 rounded-(--ds-radius-lg) border p-4"
          data-testid="account-rg-self-exclusion-active"
          role="status"
        >
          <p className="text-foreground m-0 text-sm font-medium">
            {t('rg.selfExclusion.activeTitle')}
          </p>
          {engine.selfExclusionUntilDisplay ? (
            <p className="text-foreground-muted m-0 text-sm">
              {t('rg.selfExclusion.activeUntil', { until: engine.selfExclusionUntilDisplay })}
            </p>
          ) : null}
        </div>
      ) : null}

      <Card data-testid="account-rg-limits-card">
        <CardHeader className="flex flex-row items-start gap-3">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <HeartHandshake className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('rg.limits.title')}</CardTitle>
            <CardDescription>{t('rg.limits.help')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          <form
            onSubmit={onLimitsSubmit}
            noValidate
            className="flex flex-col gap-4"
            data-testid="account-rg-limits-form"
          >
            <div
              className="border-line flex flex-col gap-3 rounded-(--ds-radius-md) border p-3"
              data-testid="account-rg-deposit-limit"
            >
              <div className="space-y-1">
                <p className="text-foreground m-0 text-sm font-medium">
                  {t('rg.limits.depositKrw')}
                </p>
                <p className="text-foreground-muted m-0 text-xs">
                  {t('rg.limits.current')}:{' '}
                  <span className="font-mono tabular-nums">
                    {engine.depositLimit.currentLimitDisplay}
                  </span>
                </p>
                {engine.depositLimit.pendingLimitDisplay &&
                engine.depositLimit.pendingEffectiveAtDisplay ? (
                  <p className="text-warning m-0 text-xs">
                    {t('rg.limits.pendingIncrease', {
                      amount: engine.depositLimit.pendingLimitDisplay,
                      until: engine.depositLimit.pendingEffectiveAtDisplay,
                    })}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="account-rg-deposit-krw"
                  className="text-foreground text-sm font-medium"
                >
                  {t('rg.limits.newDepositKrw')}
                </label>
                <Input
                  id="account-rg-deposit-krw"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={engine.depositKrwInput}
                  disabled={engine.limitsSaveBusy || engine.selfExclusionActive}
                  aria-invalid={engine.depositKrwGateKey !== null}
                  onChange={(event) => engine.setDepositKrwInput(event.target.value)}
                  data-testid="account-rg-deposit-krw-input"
                />
                {engine.depositKrwGateKey ? (
                  <p className="text-danger m-0 text-xs" role="alert">
                    {t(engine.depositKrwGateKey)}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className="border-line flex flex-col gap-3 rounded-(--ds-radius-md) border p-3"
              data-testid="account-rg-loss-limit"
            >
              <div className="space-y-1">
                <p className="text-foreground m-0 text-sm font-medium">
                  {t('rg.limits.lossGameUsdt')}
                </p>
                <p className="text-foreground-muted m-0 text-xs">
                  {t('rg.limits.current')}:{' '}
                  <span className="font-mono tabular-nums">
                    {engine.lossLimit.currentLimitDisplay}
                  </span>
                </p>
                {engine.lossLimit.monthUsageDisplay ? (
                  <p className="text-foreground-muted m-0 text-xs">
                    {t('rg.limits.monthUsage')}:{' '}
                    <span className="font-mono tabular-nums">
                      {engine.lossLimit.monthUsageDisplay}
                    </span>
                  </p>
                ) : null}
                {engine.lossLimit.pendingLimitDisplay &&
                engine.lossLimit.pendingEffectiveAtDisplay ? (
                  <p className="text-warning m-0 text-xs">
                    {t('rg.limits.pendingIncrease', {
                      amount: engine.lossLimit.pendingLimitDisplay,
                      until: engine.lossLimit.pendingEffectiveAtDisplay,
                    })}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="account-rg-loss-usdt"
                  className="text-foreground text-sm font-medium"
                >
                  {t('rg.limits.newLossGameUsdt')}
                </label>
                <Input
                  id="account-rg-loss-usdt"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={engine.lossGameUsdtInput}
                  disabled={engine.limitsSaveBusy || engine.selfExclusionActive}
                  aria-invalid={engine.lossGameUsdtGateKey !== null}
                  onChange={(event) => engine.setLossGameUsdtInput(event.target.value)}
                  data-testid="account-rg-loss-usdt-input"
                />
                {engine.lossGameUsdtGateKey ? (
                  <p className="text-danger m-0 text-xs" role="alert">
                    {t(engine.lossGameUsdtGateKey)}
                  </p>
                ) : null}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              loading={engine.limitsSaveBusy}
              disabled={limitsSaveDisabled || engine.selfExclusionActive}
              data-testid="account-rg-limits-save"
            >
              {t('rg.limits.save')}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card data-testid="account-rg-self-exclusion-card">
        <CardHeader className="flex flex-row items-start gap-3">
          <span
            className="bg-danger/10 text-danger flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <ShieldAlert className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('rg.selfExclusion.title')}</CardTitle>
            <CardDescription>{t('rg.selfExclusion.description')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          <p className="text-warning m-0 text-sm">{t('rg.selfExclusion.warning')}</p>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="account-rg-self-exclusion-days"
              className="text-foreground text-sm font-medium"
            >
              {t('rg.selfExclusion.daysLabel')}
            </label>
            <Input
              id="account-rg-self-exclusion-days"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={engine.selfExclusionDaysInput}
              disabled={selfExclusionDisabled}
              aria-invalid={engine.selfExclusionDaysGateKey !== null}
              onChange={(event) => engine.setSelfExclusionDaysInput(event.target.value)}
              data-testid="account-rg-self-exclusion-days"
            />
            {engine.selfExclusionDaysGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.selfExclusionDaysGateKey)}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="md"
            className="w-full sm:w-auto"
            disabled={selfExclusionDisabled}
            loading={engine.selfExclusionBusy}
            onClick={engine.handleOpenSelfExclusionConfirm}
            data-testid="account-rg-self-exclusion-start"
          >
            {t('rg.selfExclusion.start')}
          </Button>
        </CardBody>
      </Card>

      <Card className={cn('border-line/80 bg-surface/80')} data-testid="account-rg-policy-card">
        <CardBody className="space-y-2">
          <p className="text-foreground-muted m-0 text-sm">{t('rg.why.body')}</p>
          <a
            href={LEGAL_RESPONSIBLE_GAMING_ROUTE}
            className="text-accent hover:text-accent/80 text-sm font-medium underline-offset-4 hover:underline"
            data-testid="account-rg-policy-link"
          >
            {t('rg.policyLink')}
          </a>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={engine.selfExclusionConfirmOpen}
        onOpenChange={engine.setSelfExclusionConfirmOpen}
        title={t('rg.selfExclusion.confirmTitle')}
        description={t('rg.selfExclusion.confirmDescription')}
        confirmLabel={t('rg.selfExclusion.confirmAction')}
        destructive
        loading={engine.selfExclusionBusy}
        onConfirm={() => void engine.handleConfirmSelfExclusion()}
      />
    </div>
  );
}
