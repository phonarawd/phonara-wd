import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell, Home, Smartphone, WifiOff, Zap } from 'lucide-react';

import { useInstallPrompt } from '@/features/pwa/install-prompt-context';
import {
  detectPwaInstallPlatform,
  dismissPwaInstallPrompt,
  type PwaInstallPlatform,
} from '@/features/pwa/pwa-install';
import { BRAND_ASSETS } from '@/domain/brand-display-contract';
import { useT } from '@/product/i18n';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

import { InstallGuideSheet } from './install-guide-sheet';

const BENEFIT_ROWS = [
  { key: 'pwa.install.benefits.fast' as const, icon: Zap },
  { key: 'pwa.install.benefits.offline' as const, icon: WifiOff },
  { key: 'pwa.install.benefits.push' as const, icon: Bell },
] as const;

const WHY_ROWS = [
  { key: 'pwa.install.why.home' as const, icon: Home },
  { key: 'pwa.install.why.speed' as const, icon: Zap },
  { key: 'pwa.install.why.offline' as const, icon: WifiOff },
] as const;

const PLATFORM_CTA: Record<
  PwaInstallPlatform,
  'pwa.install.cta.ios' | 'pwa.install.cta.android' | 'pwa.install.cta.desktop'
> = {
  ios: 'pwa.install.cta.ios',
  android: 'pwa.install.cta.android',
  desktop: 'pwa.install.cta.desktop',
};

/** Canonical `/install` — PWA install guide + deferred native prompt (§25.10). */
export function InstallPage() {
  const t = useT();
  const { canPrompt, isInstalled, promptInstall } = useInstallPrompt();
  const [platform] = useState<PwaInstallPlatform>(() => detectPwaInstallPlatform());
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<PwaInstallPlatform>(platform);
  const [promptBusy, setPromptBusy] = useState(false);

  useEffect(() => {
    document.title = t('seo.install.title');
  }, [t]);

  useEffect(() => {
    if (platform === 'ios' && !isInstalled) {
      setGuidePlatform('ios');
      setGuideOpen(true);
    }
  }, [platform, isInstalled]);

  const openGuide = (nextPlatform: PwaInstallPlatform) => {
    setGuidePlatform(nextPlatform);
    setGuideOpen(true);
  };

  const handleNativeInstall = async () => {
    if (!canPrompt) {
      openGuide(platform);
      return;
    }
    setPromptBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === 'dismissed') {
        dismissPwaInstallPrompt();
      }
    } finally {
      setPromptBusy(false);
    }
  };

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6 py-2 md:py-4"
      data-testid="install-page"
    >
      <header className="flex flex-col items-center gap-4 text-center">
        <img
          src={BRAND_ASSETS.raster}
          alt=""
          className="size-20"
          width={80}
          height={80}
          aria-hidden
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground m-0 text-2xl font-semibold">{t('pwa.install.title')}</h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t('pwa.install.subtitle')}
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('pwa.install.benefits.title')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 pt-0">
          {BENEFIT_ROWS.map(({ key, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="bg-accent/10 text-accent flex size-9 shrink-0 items-center justify-center rounded-(--ds-radius-md)">
                <Icon className="size-4" aria-hidden />
              </span>
              <span>{t(key)}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-3">
          {WHY_ROWS.map(({ key, icon: Icon }) => (
            <div key={key} className="text-foreground-muted flex items-start gap-2 text-sm">
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{t(key)}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="flex flex-col gap-3">
        {isInstalled ? (
          <Link
            to="/home"
            className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full')}
            data-testid="install-relaunch"
          >
            {t('pwa.install.relaunch')}
          </Link>
        ) : (
          <>
            <Button
              type="button"
              variant="primary"
              className="w-full"
              data-testid="install-primary-cta"
              disabled={promptBusy}
              onClick={() => void handleNativeInstall()}
            >
              {canPrompt ? t('pwa.install.cta.prompt') : t(PLATFORM_CTA[platform])}
            </Button>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(['ios', 'android', 'desktop'] as const).map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(item === platform && 'border-accent/40')}
                  data-testid={`install-guide-${item}`}
                  onClick={() => openGuide(item)}
                >
                  <Smartphone className="mr-1.5 size-3.5 sm:hidden" aria-hidden />
                  {t(PLATFORM_CTA[item])}
                </Button>
              ))}
            </div>
          </>
        )}

        {!isInstalled ? (
          <button
            type="button"
            className="text-foreground-muted hover:text-foreground text-sm underline-offset-4 transition-colors hover:underline"
            data-testid="install-dismiss"
            onClick={dismissPwaInstallPrompt}
          >
            {t('pwa.install.dismiss')}
          </button>
        ) : (
          <p
            className="text-foreground-muted m-0 text-center text-sm"
            data-testid="install-installed-label"
          >
            {t('pwa.install.cta.installed')}
          </p>
        )}
      </div>

      <InstallGuideSheet platform={guidePlatform} open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}
