import type { MessageKey } from '@phonara/i18n';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Menu,
  MoreVertical,
  PlusSquare,
  Share,
  type LucideIcon,
} from 'lucide-react';

import { BRAND_ASSETS } from '@/domain/brand-display-contract';
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
  {
    titleKey: MessageKey;
    hintKey: MessageKey;
    stepKeys: readonly [MessageKey, MessageKey, MessageKey];
    icons: readonly [LucideIcon, LucideIcon, LucideIcon];
  }
> = {
  ios: {
    titleKey: 'pwa.install.ios.title',
    hintKey: 'pwa.install.ios.hint',
    stepKeys: ['pwa.install.ios.step1', 'pwa.install.ios.step2', 'pwa.install.ios.step3'],
    icons: [Share, PlusSquare, Check],
  },
  android: {
    titleKey: 'pwa.install.android.title',
    hintKey: 'pwa.install.android.hint',
    stepKeys: [
      'pwa.install.android.step1',
      'pwa.install.android.step2',
      'pwa.install.android.step3',
    ],
    icons: [MoreVertical, Download, Check],
  },
  desktop: {
    titleKey: 'pwa.install.desktop.title',
    hintKey: 'pwa.install.desktop.hint',
    stepKeys: [
      'pwa.install.desktop.step1',
      'pwa.install.desktop.step2',
      'pwa.install.desktop.step3',
    ],
    icons: [Download, Check, Check],
  },
};

const IOS_STEP_CUES = [
  'pwa.install.ios.shareLabel',
  'pwa.install.ios.menuLabel',
  'pwa.install.ios.addLabel',
] as const;

type InstallGuideSheetProps = {
  platform: PwaInstallPlatform;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Safari bottom toolbar mock — share control is the only highlighted target. */
function IosSafariToolbarMock({ shareLabel }: { shareLabel: string }) {
  return (
    <div
      className="border-line bg-surface relative flex items-end justify-around rounded-b-md border-t px-2 pt-2 pb-2.5"
      data-testid="install-ios-safari-toolbar"
      aria-hidden
    >
      <span className="text-foreground-muted flex size-8 items-center justify-center">
        <ChevronLeft className="size-4" />
      </span>
      <span className="text-foreground-muted flex size-8 items-center justify-center">
        <ChevronRight className="size-4" />
      </span>
      <div className="relative flex flex-col items-center gap-1">
        <span className="bg-accent/25 ring-accent absolute -inset-1.5 rounded-full ring-2" />
        <span className="bg-accent relative z-10 flex size-9 items-center justify-center rounded-full text-white shadow-sm">
          <Share className="size-4" strokeWidth={2.5} />
        </span>
        <span className="text-accent relative z-10 text-[10px] font-semibold tracking-tight">
          {shareLabel}
        </span>
      </div>
      <span className="text-foreground-muted flex size-8 items-center justify-center">
        <BookOpen className="size-4" />
      </span>
      <span className="text-foreground-muted flex size-8 items-center justify-center">
        <Menu className="size-4" />
      </span>
    </div>
  );
}

/** Visual teach-aid: phone chrome + share highlight (not a live app screenshot). */
function IosInstallVisualGuide() {
  const t = useT();

  return (
    <div
      className="border-line bg-surface-raised mx-4 overflow-hidden rounded-lg border"
      data-testid="install-ios-visual-guide"
    >
      <div className="border-line flex items-center gap-2 border-b px-3 py-2">
        <img
          src={BRAND_ASSETS.raster}
          alt=""
          className="size-7 shrink-0"
          width={28}
          height={28}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-foreground m-0 truncate text-sm font-semibold">
            {t('brand.wordmark')}
          </p>
          <p className="text-foreground-muted m-0 truncate text-xs">
            {t('pwa.install.ios.visualSubtitle')}
          </p>
        </div>
      </div>

      <div className="bg-surface flex flex-col gap-3 px-3 py-3">
        <div className="border-line bg-surface-overlay rounded-md border px-3 py-2.5">
          <p className="text-foreground-muted m-0 text-[11px] font-medium tracking-wide uppercase">
            Safari
          </p>
          <p className="text-foreground m-0 mt-1 truncate text-sm tabular-nums">phonara.app</p>
        </div>

        <div className="border-line bg-surface-overlay flex items-center gap-2.5 rounded-md border px-3 py-2.5">
          <span className="bg-accent/15 text-accent flex size-9 shrink-0 items-center justify-center rounded-sm">
            <PlusSquare className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-foreground m-0 text-sm font-medium">
              {t('pwa.install.ios.menuLabel')}
            </p>
            <p className="text-foreground-muted m-0 text-xs">{t('pwa.install.ios.menuHint')}</p>
          </div>
        </div>
      </div>

      <IosSafariToolbarMock shareLabel={t('pwa.install.ios.shareLabel')} />
    </div>
  );
}

/** Manual install steps — iOS Safari visual teach-aid + numbered steps (§25.10). */
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
          <SheetDescription>{t(guide.hintKey)}</SheetDescription>
        </SheetHeader>

        {platform === 'ios' ? <IosInstallVisualGuide /> : null}

        <ol className="text-foreground m-0 flex list-none flex-col gap-3 px-4 pb-2">
          {guide.stepKeys.map((stepKey, index) => {
            const Icon = guide.icons[index]!;
            const iosCue = platform === 'ios' ? IOS_STEP_CUES[index] : null;
            return (
              <li
                key={stepKey}
                className="border-line bg-surface-raised flex gap-3 rounded-md border p-3"
                data-testid={`install-guide-step-${platform}-${index + 1}`}
              >
                <span
                  className="bg-accent flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white tabular-nums"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <span className="bg-accent/15 text-accent mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm leading-relaxed font-medium">{t(stepKey)}</span>
                    {iosCue ? (
                      <span className="text-accent text-xs font-semibold">{t(iosCue)}</span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </SheetContent>
    </Sheet>
  );
}
