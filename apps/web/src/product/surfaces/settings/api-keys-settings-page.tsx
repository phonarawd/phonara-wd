import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { KeyRound } from 'lucide-react';

import {
  SETTINGS_API_KEYS_SEO_DESCRIPTION_KEY,
  SETTINGS_API_KEYS_SEO_TITLE_KEY,
} from '@/domain/settings-api-keys-display-contract';
import { useSettingsApiKeysController } from '@/features/settings/use-settings-api-keys-controller';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/product/primitives/dialog';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';

/** Canonical `/settings/api-keys` — trading API keys · E10 live. */
export function ApiKeysSettingsPage() {
  const engine = useSettingsApiKeysController();
  const { t, canManageKeys } = engine;

  useEffect(() => {
    document.title = t(SETTINGS_API_KEYS_SEO_TITLE_KEY);
  }, [t]);

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4 md:py-6"
      data-testid="settings-api-keys-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to="/settings"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="settings-api-keys-back"
        >
          {t('settings.apiKeys.back')}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('settings.apiKeys.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(SETTINGS_API_KEYS_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      {engine.createdSecret ? (
        <Card data-testid="settings-api-keys-secret-card">
          <CardHeader>
            <CardTitle className="text-base">{t('settings.apiKeys.secret.title')}</CardTitle>
            <CardDescription>{t('settings.apiKeys.secret.body')}</CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <code
              className="bg-surface-raised border-line block overflow-x-auto rounded-md border px-3 py-2 text-sm break-all"
              data-testid="settings-api-keys-secret-value"
            >
              {engine.createdSecret.api_key}
            </code>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={engine.acknowledgeSecret}
              data-testid="settings-api-keys-secret-ack"
            >
              {t('settings.apiKeys.secret.ack')}
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <Card data-testid="settings-api-keys-list-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-md"
            aria-hidden
          >
            <KeyRound className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('settings.apiKeys.list.title')}</CardTitle>
            <CardDescription>{t('settings.apiKeys.list.body')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          {engine.keysLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : engine.keys.length === 0 ? (
            <div data-testid="settings-api-keys-empty">
              <EmptyState
                title={t('settings.apiKeys.empty.title')}
                description={t('settings.apiKeys.empty.body')}
                actionLabel={t('settings.apiKeys.create.label')}
                onAction={engine.openCreate}
                icon={<KeyRound className="size-8" aria-hidden />}
              />
            </div>
          ) : (
            <ul className="border-line divide-line m-0 list-none divide-y rounded-lg border p-0">
              {engine.keys.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  data-testid={`settings-api-keys-row-${row.id}`}
                >
                  <div className="min-w-0">
                    <p className="text-foreground m-0 text-sm font-semibold">{row.name}</p>
                    <p className="text-foreground-muted m-0 text-xs tabular-nums">
                      {row.key_masked} · {(row.scopes ?? []).join(', ')}
                    </p>
                    {row.revoked_at ? (
                      <p className="text-warning m-0 text-xs">{t('settings.apiKeys.revoked')}</p>
                    ) : null}
                  </div>
                  {!row.revoked_at ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canManageKeys}
                      onClick={() => engine.openRevoke(row)}
                      data-testid={`settings-api-keys-revoke-${row.id}`}
                    >
                      {t('settings.apiKeys.revoke.label')}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!canManageKeys}
            onClick={engine.openCreate}
            data-testid="settings-api-keys-create"
          >
            {t('settings.apiKeys.create.label')}
          </Button>
        </CardBody>
      </Card>

      <Dialog open={engine.createOpen} onOpenChange={(open) => !open && engine.closeCreate()}>
        <DialogContent data-testid="settings-api-keys-create-dialog">
          <DialogHeader>
            <DialogTitle>{t('settings.apiKeys.create.dialogTitle')}</DialogTitle>
            <DialogDescription>{t('settings.apiKeys.create.dialogBody')}</DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1.5">
            <span className="text-foreground text-sm font-medium">
              {t('settings.apiKeys.create.name')}
            </span>
            <Input
              value={engine.keyName}
              onChange={(e) => engine.setKeyName(e.target.value)}
              maxLength={64}
              data-testid="settings-api-keys-name"
            />
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-foreground text-sm font-medium">
              {t('settings.apiKeys.create.scopes')}
            </span>
            {(['read', 'trade'] as const).map((scope) => (
              <label key={scope} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={engine.scopes.includes(scope)}
                  onChange={() => engine.toggleScope(scope)}
                  data-testid={`settings-api-keys-scope-${scope}`}
                />
                {t(`settings.apiKeys.scope.${scope}`)}
              </label>
            ))}
          </div>
          {engine.createErrorKey ? (
            <p className="text-danger m-0 text-sm" role="alert">
              {t(engine.createErrorKey)}
            </p>
          ) : null}
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={engine.creating || !engine.keyName.trim()}
              onClick={() => void engine.createKey()}
              data-testid="settings-api-keys-create-confirm"
            >
              {engine.creating ? t('common.processing') : t('settings.apiKeys.create.label')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={engine.creating}
              onClick={engine.closeCreate}
            >
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(engine.revokeTarget)}
        onOpenChange={(open) => !open && engine.closeRevoke()}
      >
        <DialogContent data-testid="settings-api-keys-revoke-dialog">
          <DialogHeader>
            <DialogTitle>{t('settings.apiKeys.revoke.dialogTitle')}</DialogTitle>
            <DialogDescription>{t('settings.apiKeys.revoke.dialogBody')}</DialogDescription>
          </DialogHeader>
          {engine.revokeErrorKey ? (
            <p className="text-danger m-0 text-sm" role="alert">
              {t(engine.revokeErrorKey)}
            </p>
          ) : null}
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={engine.revoking}
              onClick={() => void engine.revokeKey()}
              data-testid="settings-api-keys-revoke-confirm"
            >
              {engine.revoking ? t('common.processing') : t('settings.apiKeys.revoke.label')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={engine.revoking}
              onClick={engine.closeRevoke}
            >
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
