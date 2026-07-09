import type { MessageKey } from '@phonara/i18n';
import { Share } from 'lucide-react';

import type { PwaInstallPlatform } from '@/features/pwa/pwa-install';
import { useT } from '@/product/i18n';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/product/primitives/sheet';

const GUIDE_STEPS: Record<
  PwaInstallPlatform,
  { titleKey: MessageKey; stepKeys: readonly [MessageKey, MessageKey, MessageKey] }
> = {
  ios: {
    titleKey: 'pwa.install.ios.title',
    stepKeys: ['pwa.install.ios.step1', 'pwa.install.ios.step2', 'pwa.install.ios.step3'],
  },
  android: {
    titleKey: 'pwa.install.android.title',
    stepKeys: [
      'pwa.install.android.step1',
      'pwa.install.android.step2',
      'pwa.install.android.step3',
    ],
  },
  desktop: {
    titleKey: 'pwa.install.desktop.title',
    stepKeys: [
      'pwa.install.desktop.step1',
      'pwa.install.desktop.step2',
      'pwa.install.desktop.step3',
    ],
  },
};

type InstallGuideSheetProps = {
  platform: PwaInstallPlatform;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Manual install steps — iOS Safari share sheet with preview (§25.10). */
export function InstallGuideSheet({ platform, open, onOpenChange }: InstallGuideSheetProps) {
  const t = useT();
  const guide = GUIDE_STEPS[platform];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="gap-4 overflow-y-auto"
        data-testid={`install-guide-sheet-${platform}`}
      >
        <SheetHeader>
          <SheetTitle>{t(guide.titleKey)}</SheetTitle>
          <SheetDescription>{t('pwa.install.subtitle')}</SheetDescription>
        </SheetHeader>

        {platform === 'ios' ? (
          <figure className="mx-4 overflow-hidden rounded-(--ds-radius-lg) border border-line">
            <img
              src="/screenshots/home-narrow.png"
              alt={t('pwa.install.ios.previewAlt')}
              className="block w-full"
              width={390}
              height={844}
              loading="lazy"
            />
            <figcaption className="text-foreground-muted flex items-center gap-2 px-3 py-2 text-xs">
              <Share className="size-3.5 shrink-0" aria-hidden />
              {t('pwa.install.ios.previewCaption')}
            </figcaption>
          </figure>
        ) : null}

        <ol className="text-foreground m-0 flex list-none flex-col gap-3 px-4 pb-2">
          {guide.stepKeys.map((stepKey, index) => (
            <li key={stepKey} className="flex gap-3 text-sm leading-relaxed">
              <span
                className="bg-accent/15 text-accent flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
                aria-hidden
              >
                {index + 1}
              </span>
              <span>{t(stepKey)}</span>
            </li>
          ))}
        </ol>
      </SheetContent>
    </Sheet>
  );
}
