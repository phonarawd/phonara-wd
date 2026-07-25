import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Bell,
  Building2,
  ChevronRight,
  Fingerprint,
  Globe2,
  KeyRound,
  Palette,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  resolveNotificationPrefHintKey,
  resolveNotificationPrefLabelKey,
  resolveSettingsHubGroupLabelKey,
  SETTINGS_HUB_NOTIFICATION_PREF_KEYS,
  type SettingsHubNavGroup,
  type SettingsHubNavItem,
} from '@/domain/settings-hub-display-contract';
import { useSettingsHubController } from '@/features/settings/use-settings-hub-controller';
import { Switch } from '@/product/primitives/switch';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';

const NAV_ITEM_ICONS: Readonly<Record<string, LucideIcon>> = {
  security: Fingerprint,
  'bank-accounts': Building2,
  account: Globe2,
  referral: Users,
  'notifications-prefs': Bell,
  'notifications-inbox': Bell,
  preferences: Palette,
  'api-keys': KeyRound,
};

const HUB_GROUP_ORDER: readonly SettingsHubNavGroup[] = ['alerts', 'account', 'display'] as const;

function SettingsHubNavLink({
  item,
  t,
}: {
  item: SettingsHubNavItem;
  t: ReturnType<typeof useSettingsHubController>['t'];
}) {
  const Icon = NAV_ITEM_ICONS[item.id] ?? ChevronRight;

  return (
    <Link
      to={item.route}
      className="border-line hover:bg-surface-raised flex items-center gap-3 rounded-md border px-3 py-3 transition-colors"
      data-testid={`settings-hub-link-${item.id}`}
    >
      <span
        className="bg-accent/10 text-accent flex size-9 shrink-0 items-center justify-center rounded-md"
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="text-foreground text-sm font-semibold">{t(item.labelKey)}</span>
        {item.hintKey ? (
          <span className="text-foreground-muted text-xs leading-relaxed">{t(item.hintKey)}</span>
        ) : null}
      </span>
      <ChevronRight className="text-foreground-muted size-4 shrink-0" aria-hidden />
    </Link>
  );
}

function SettingsHubToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  hint?: string | null;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-3 py-2"
      data-testid={`settings-hub-toggle-${id}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <label
          htmlFor={`settings-hub-switch-${id}`}
          className="text-foreground text-sm font-medium"
        >
          {label}
        </label>
        {hint ? <p className="text-foreground-muted m-0 text-xs leading-relaxed">{hint}</p> : null}
      </div>
      <Switch
        id={`settings-hub-switch-${id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}

/** Canonical `/settings` hub — local prefs · sub-route IA (P8). */
export function SettingsHubPage() {
  const engine = useSettingsHubController();
  const {
    t,
    navByGroup,
    notificationPrefs,
    casinoConfirm,
    casinoSoundEffects,
    tradeOneClick,
    tradeConfirm,
    setNotificationPref,
    setCasinoConfirm,
    setCasinoSoundEffects,
    setTradeOneClick,
    setTradeConfirm,
  } = engine;

  useEffect(() => {
    document.title = t('seo.settings.title');
  }, [t]);

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-ds-8 py-4 md:py-6"
      data-testid="settings-hub-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to="/account"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="settings-hub-back"
        >
          {t('settings.back')}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('settings.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t('settings.subtitle')}
          </p>
        </div>
      </header>

      <Card data-testid="settings-hub-notifications-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('settings.section.notif')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-1 pt-0">
          {SETTINGS_HUB_NOTIFICATION_PREF_KEYS.map((key) => (
            <SettingsHubToggleRow
              key={key}
              id={key}
              label={t(resolveNotificationPrefLabelKey(key))}
              hint={
                resolveNotificationPrefHintKey(key) ? t(resolveNotificationPrefHintKey(key)!) : null
              }
              checked={notificationPrefs[key]}
              onCheckedChange={(checked) => setNotificationPref(key, checked)}
            />
          ))}
        </CardBody>
      </Card>

      {HUB_GROUP_ORDER.map((group) => {
        const items = navByGroup[group];
        if (items.length === 0) return null;

        return (
          <section
            key={group}
            className="flex flex-col gap-3"
            data-testid={`settings-hub-group-${group}`}
          >
            <h2 className="text-foreground-muted m-0 text-xs font-semibold tracking-wide uppercase">
              {t(resolveSettingsHubGroupLabelKey(group))}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <SettingsHubNavLink key={item.id} item={item} t={t} />
              ))}
            </div>
          </section>
        );
      })}

      <Card data-testid="settings-hub-casino-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('settings.section.casino')}</CardTitle>
          <p className="text-foreground-muted m-0 text-xs">{t('settings.casino.sectionHint')}</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-1 pt-0">
          <SettingsHubToggleRow
            id="casino-confirm"
            label={t('settings.casino.confirmDialog.label')}
            hint={t('settings.casino.confirmDialog.hint')}
            checked={casinoConfirm}
            onCheckedChange={setCasinoConfirm}
          />
          <SettingsHubToggleRow
            id="casino-sound"
            label={t('settings.casino.soundEffects.label')}
            hint={t('settings.casino.soundEffects.hint')}
            checked={casinoSoundEffects}
            onCheckedChange={setCasinoSoundEffects}
          />
        </CardBody>
      </Card>

      <Card data-testid="settings-hub-trade-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('settings.section.trade')}</CardTitle>
          <p className="text-foreground-muted m-0 text-xs">{t('settings.trade.sectionHint')}</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-1 pt-0">
          <SettingsHubToggleRow
            id="trade-oneclick"
            label={t('settings.trade.oneClick.label')}
            hint={t('settings.trade.oneClick.hint')}
            checked={tradeOneClick}
            onCheckedChange={setTradeOneClick}
          />
          <SettingsHubToggleRow
            id="trade-confirm"
            label={t('settings.trade.confirmDialog.label')}
            hint={t('settings.trade.confirmDialog.hint')}
            checked={tradeConfirm}
            onCheckedChange={setTradeConfirm}
          />
        </CardBody>
      </Card>

      <Card data-testid="settings-hub-info-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('settings.section.info')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-2 pt-0">
          <Link
            to="/legal/terms"
            className="text-accent text-sm font-medium underline-offset-4 hover:underline"
            data-testid="settings-hub-terms"
          >
            {t('settings.info.terms')}
          </Link>
          <Link
            to="/legal/privacy"
            className="text-accent text-sm font-medium underline-offset-4 hover:underline"
            data-testid="settings-hub-privacy"
          >
            {t('settings.info.privacy')}
          </Link>
          <p
            className="text-foreground-muted m-0 text-xs tabular-nums"
            data-testid="settings-hub-version"
          >
            {t('settings.info.version')} · v1.0.0
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
