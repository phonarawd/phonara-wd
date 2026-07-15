import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell } from 'lucide-react';

import {
  resolveNotificationPrefHintKey,
  resolveNotificationPrefLabelKey,
  resolveSettingsNotificationsGroupLabelKey,
  type SettingsNotificationsPrefGroup,
} from '@/domain/settings-notifications-display-contract';
import { useSettingsNotificationsController } from '@/features/settings/use-settings-notifications-controller';
import { Switch } from '@/product/primitives/switch';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

const GROUP_ORDER: readonly SettingsNotificationsPrefGroup[] = ['money', 'growth', 'marketing'];

function SettingsNotificationsToggleRow({
  id,
  label,
  hint,
  checked,
  partialEngine,
  partialEngineLabel,
  onCheckedChange,
}: {
  id: string;
  label: string;
  hint?: string | null;
  checked: boolean;
  partialEngine: boolean;
  partialEngineLabel: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-3 py-2"
      data-testid={`settings-notifications-toggle-${id}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={`settings-notifications-switch-${id}`}
            className="text-foreground text-sm font-medium"
          >
            {label}
          </label>
          {partialEngine ? (
            <span
              className={cn(
                'bg-surface-raised text-foreground-muted shrink-0 rounded-full px-2 py-0.5 text-tiny font-semibold tracking-wide uppercase',
              )}
              data-testid={`settings-notifications-partial-${id}`}
            >
              {partialEngineLabel}
            </span>
          ) : null}
        </div>
        {hint ? <p className="text-foreground-muted m-0 text-xs leading-relaxed">{hint}</p> : null}
      </div>
      <Switch
        id={`settings-notifications-switch-${id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}

/** Canonical `/settings/notifications` — topic pref toggles · partial ENGINE growth prefs (P8). */
export function NotificationsSettingsPage() {
  const engine = useSettingsNotificationsController();
  const { t, prefsByGroup, notificationPrefs, isPartialEnginePref, setNotificationPref } = engine;

  useEffect(() => {
    document.title = t('seo.settingsNotifications.title');
  }, [t]);

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4 md:py-6"
      data-testid="settings-notifications-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to="/settings"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="settings-notifications-back"
        >
          {t('settings.notifications.back')}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('settings.notifications.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t('settings.notifications.subtitle')}
          </p>
        </div>
      </header>

      {GROUP_ORDER.map((group) => {
        const keys = prefsByGroup[group];
        if (keys.length === 0) return null;

        return (
          <Card key={group} data-testid={`settings-notifications-group-${group}`}>
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <span
                className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-md"
                aria-hidden
              >
                <Bell className="size-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-base">
                  {t(resolveSettingsNotificationsGroupLabelKey(group))}
                </CardTitle>
                <p className="text-foreground-muted m-0 text-xs">
                  {t('settings.notifications.groupHint')}
                </p>
              </div>
            </CardHeader>
            <CardBody className="flex flex-col gap-1 pt-0">
              {keys.map((key) => (
                <SettingsNotificationsToggleRow
                  key={key}
                  id={key}
                  label={t(resolveNotificationPrefLabelKey(key))}
                  hint={
                    resolveNotificationPrefHintKey(key)
                      ? t(resolveNotificationPrefHintKey(key)!)
                      : null
                  }
                  checked={notificationPrefs[key]}
                  partialEngine={isPartialEnginePref(key)}
                  partialEngineLabel={t('settings.notifications.partialEngineTag')}
                  onCheckedChange={(checked) => setNotificationPref(key, checked)}
                />
              ))}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
