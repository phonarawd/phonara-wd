import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/product/primitives/sheet';

type AdsConsentSheetProps = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

/** First-visit analytics consent — Sheet primitive (§25.2 · §28.5). */
export function AdsConsentSheet({ open, onAccept, onDecline }: AdsConsentSheetProps) {
  const t = useT();

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onDecline()}>
      <SheetContent
        className="gap-4"
        data-testid="ads-consent-sheet"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{t('ads.consent.title')}</SheetTitle>
          <SheetDescription>{t('ads.consent.body')}</SheetDescription>
        </SheetHeader>
        <p className="text-foreground-muted m-0 flex flex-col gap-1 px-4 text-sm">
          <a href="/legal/cookies" className="text-accent underline-offset-4 hover:underline">
            {t('ads.consent.cookiesLink')}
          </a>
          <a href="/legal/privacy" className="text-accent underline-offset-4 hover:underline">
            {t('ads.consent.privacyLink')}
          </a>
        </p>
        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            data-testid="ads-consent-decline"
            onClick={onDecline}
          >
            {t('ads.consent.decline')}
          </Button>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            data-testid="ads-consent-accept"
            onClick={onAccept}
          >
            {t('ads.consent.accept')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
