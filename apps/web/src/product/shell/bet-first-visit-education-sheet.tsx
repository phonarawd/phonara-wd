import { Link } from '@tanstack/react-router';

import {
  BET_EDUCATION_FAIRNESS_ROUTE,
  BET_EDUCATION_I18N_KEYS,
  BET_EDUCATION_RG_ROUTE,
  BET_EDUCATION_RISK_TOPICS,
  betEducationRiskBodyKey,
  betEducationRiskTitleKey,
} from '@/domain/operator-trust-pages-display-contract';
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

type BetFirstVisitEducationSheetProps = {
  open: boolean;
  onDismiss: () => void;
};

/** First-visit sports+casino risk education — bet slip · RG · provably-fair (§32.5 · ui_only). */
export function BetFirstVisitEducationSheet({
  open,
  onDismiss,
}: BetFirstVisitEducationSheetProps) {
  const t = useT();

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onDismiss()}>
      <SheetContent
        className="gap-4"
        data-testid="bet-first-visit-education-sheet"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{t(BET_EDUCATION_I18N_KEYS.title)}</SheetTitle>
          <SheetDescription>{t(BET_EDUCATION_I18N_KEYS.lead)}</SheetDescription>
        </SheetHeader>

        <ul className="m-0 flex list-none flex-col gap-4 px-4">
          {BET_EDUCATION_RISK_TOPICS.map((topic) => (
            <li key={topic} className="border-line rounded-md border p-3">
              <h3 className="text-foreground m-0 text-sm font-semibold">
                {t(betEducationRiskTitleKey(topic))}
              </h3>
              <p className="text-foreground-muted m-0 mt-2 text-sm leading-snug">
                {t(betEducationRiskBodyKey(topic))}
              </p>
            </li>
          ))}
        </ul>

        <div className="text-foreground-muted flex flex-col gap-2 px-4 text-sm">
          <Link
            to={BET_EDUCATION_RG_ROUTE}
            className="text-accent underline-offset-4 hover:underline"
            data-testid="bet-education-rg-link"
          >
            {t(BET_EDUCATION_I18N_KEYS.rgLink)}
          </Link>
          <Link
            to={BET_EDUCATION_FAIRNESS_ROUTE}
            className="text-accent underline-offset-4 hover:underline"
            data-testid="bet-education-fairness-link"
          >
            {t(BET_EDUCATION_I18N_KEYS.fairnessLink)}
          </Link>
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            data-testid="bet-education-dismiss"
            onClick={onDismiss}
          >
            {t(BET_EDUCATION_I18N_KEYS.dismiss)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
