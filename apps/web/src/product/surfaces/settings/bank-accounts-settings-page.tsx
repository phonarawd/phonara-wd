import { useEffect } from 'react';
import { Building2, ShieldCheck } from 'lucide-react';

import { useSettingsBankAccountsController } from '@/features/settings/use-settings-bank-accounts-controller';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function BankAccountsLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="settings-bank-accounts-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Canonical `/settings/bank-accounts` — KRW withdrawal destinations (P5). */
export function BankAccountsSettingsPage() {
  const t = useT();
  const engine = useSettingsBankAccountsController();

  useEffect(() => {
    document.title = t('seo.bankAccounts.title');
  }, [t]);

  if (engine.loading) {
    return <BankAccountsLoadingShell />;
  }

  if (engine.errorKey) {
    return (
      <div
        className="border-danger/30 bg-surface flex flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4"
        data-testid="settings-bank-accounts-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(engine.errorKey)}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void engine.refresh()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const addDisabled = engine.addBusy || engine.accountGateKey !== null;

  return (
    <div className="flex flex-col gap-ds-8 py-4 md:py-6" data-testid="settings-bank-accounts-page">
      <header className="space-y-3">
        <a
          href="/account"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          {t('bankAccounts.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('bankAccounts.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">{t('bankAccounts.subtitle')}</p>
        </div>
      </header>

      <Card data-testid="settings-bank-accounts-list-card">
        <CardHeader className="flex flex-row items-start gap-3">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <Building2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('bankAccounts.list.title')}</CardTitle>
            <CardDescription>{t('bankAccounts.list.desc')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          {engine.whitelistEnabled ? (
            <p
              className="text-foreground-muted m-0 text-xs"
              data-testid="settings-bank-accounts-whitelist-hint"
            >
              {t('bankAccounts.whitelistHint')}
            </p>
          ) : null}

          {engine.bankAccounts.length === 0 ? (
            <p
              className="text-foreground-muted m-0 text-sm"
              data-testid="settings-bank-accounts-empty"
            >
              {t('bankAccounts.list.empty')}
            </p>
          ) : (
            <ul
              className="m-0 flex list-none flex-col gap-2 p-0"
              data-testid="settings-bank-accounts-list"
            >
              {engine.bankAccounts.map((account) => (
                <li
                  key={account.id}
                  className="border-line bg-surface flex flex-col gap-2 rounded-(--ds-radius-md) border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  data-testid="settings-bank-accounts-row"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-foreground m-0 font-mono text-sm tabular-nums">
                      {account.displayAccount}
                    </p>
                    {account.label ? (
                      <p className="text-foreground-muted m-0 text-xs">{account.label}</p>
                    ) : null}
                    {account.cooldownActive && account.cooldownUntilDisplay ? (
                      <p
                        className="text-warning m-0 text-xs"
                        data-testid={`settings-bank-accounts-cooldown-${account.id}`}
                      >
                        {t('bankAccounts.cooldown', { until: account.cooldownUntilDisplay })}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={engine.removeBusyId === account.id}
                    loading={engine.removeBusyId === account.id}
                    onClick={() => void engine.handleRemoveBankAccount(account.id)}
                    data-testid={`settings-bank-accounts-remove-${account.id}`}
                  >
                    {t('bankAccounts.remove')}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {engine.addFormOpen ? (
            <form
              onSubmit={(event) => void engine.handleAddBankAccount(event)}
              noValidate
              className="border-line flex flex-col gap-4 rounded-(--ds-radius-md) border p-4"
              data-testid="settings-bank-accounts-add-form"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="settings-bank-accounts-account"
                  className="text-foreground text-sm font-medium"
                >
                  {t('bankAccounts.accountLabel')}
                </label>
                <Input
                  id="settings-bank-accounts-account"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t('bankAccounts.accountPlaceholder')}
                  value={engine.accountInput}
                  disabled={engine.addBusy}
                  aria-invalid={engine.accountGateKey !== null}
                  onChange={(event) => engine.setAccountInput(event.target.value)}
                  data-testid="settings-bank-accounts-account-input"
                />
                {engine.accountGateKey ? (
                  <p className="text-danger m-0 text-xs" role="alert">
                    {t(engine.accountGateKey)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="settings-bank-accounts-label"
                  className="text-foreground text-sm font-medium"
                >
                  {t('bankAccounts.labelLabel')}
                </label>
                <Input
                  id="settings-bank-accounts-label"
                  type="text"
                  autoComplete="off"
                  placeholder={t('bankAccounts.labelPlaceholder')}
                  value={engine.labelInput}
                  disabled={engine.addBusy}
                  onChange={(event) => engine.setLabelInput(event.target.value)}
                  data-testid="settings-bank-accounts-label-input"
                />
              </div>
              <p className="text-foreground-muted m-0 text-xs">{t('bankAccounts.cooldownHint')}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="sm:flex-1"
                  loading={engine.addBusy}
                  disabled={addDisabled}
                  data-testid="settings-bank-accounts-add-submit"
                >
                  {t('bankAccounts.add')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={engine.addBusy}
                  onClick={engine.closeAddForm}
                  data-testid="settings-bank-accounts-add-cancel"
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
              onClick={engine.openAddForm}
              data-testid="settings-bank-accounts-add-open"
            >
              {t('bankAccounts.add')}
            </Button>
          )}
        </CardBody>
      </Card>

      <Card
        className={cn('border-line/80 bg-surface/80')}
        data-testid="settings-bank-accounts-why-card"
      >
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="text-foreground-muted flex size-10 shrink-0 items-center justify-center"
            aria-hidden
          >
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('bankAccounts.why.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-2 pt-0">
          <p className="text-foreground-muted m-0 text-sm">{t('bankAccounts.why.body')}</p>
          <p className="text-foreground-muted m-0 text-sm">
            <a
              href="/wallet/withdraw/krw"
              className="text-foreground hover:text-accent font-medium underline-offset-4 hover:underline"
            >
              {t('bankAccounts.withdrawLink')}
            </a>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
