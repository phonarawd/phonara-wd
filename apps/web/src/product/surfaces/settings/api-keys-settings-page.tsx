import { useEffect } from 'react';

import { Link } from '@tanstack/react-router';

import { KeyRound } from 'lucide-react';

import {
  SETTINGS_API_KEYS_SEO_DESCRIPTION_KEY,
  SETTINGS_API_KEYS_SEO_TITLE_KEY,
} from '@/domain/settings-api-keys-display-contract';

import { resolveSettingsApiKeysCreateDisabledReasonKey } from '@/domain/dead-controls-display-contract';

import { useSettingsApiKeysController } from '@/features/settings/use-settings-api-keys-controller';

import { Button } from '@/product/primitives/button';

import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';

import { EmptyState } from '@/product/primitives/empty-state';

/** Canonical `/settings/api-keys` — trading bot API STUB · ENGINE:gap · IA hidden (P8). */

export function ApiKeysSettingsPage() {
  const engine = useSettingsApiKeysController();

  const { t, canManageKeys } = engine;
  const createDisabledReasonKey = resolveSettingsApiKeysCreateDisabledReasonKey();

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

      <Card data-testid="settings-api-keys-gap-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <KeyRound className="size-5" />
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('settings.apiKeys.gap.title')}</CardTitle>

            <CardDescription>{t('settings.apiKeys.gap.body')}</CardDescription>
          </div>
        </CardHeader>

        <CardBody className="flex flex-col gap-4 pt-0">
          <div data-testid="settings-api-keys-empty">
            <EmptyState
              title={t('settings.apiKeys.empty.title')}
              description={t('settings.apiKeys.empty.body')}
              actionLabel={t('settings.apiKeys.back')}
              onAction={() => {
                window.location.assign('/settings');
              }}
              icon={<KeyRound className="size-8" aria-hidden />}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!canManageKeys}
              aria-disabled={!canManageKeys}
              aria-describedby="settings-api-keys-create-reason"
              data-testid="settings-api-keys-create"
            >
              {t('settings.apiKeys.create.label')}
            </Button>

            <p
              id="settings-api-keys-create-reason"
              className="text-foreground-muted m-0 text-xs leading-relaxed"
              role="status"
            >
              {t(createDisabledReasonKey)}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
