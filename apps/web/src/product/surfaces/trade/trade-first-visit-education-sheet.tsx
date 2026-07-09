import { Link } from '@tanstack/react-router';

import {
  TRADE_EDUCATION_I18N_KEYS,
  TRADE_EDUCATION_RG_ROUTE,
  TRADE_EDUCATION_RISK_DISCLOSURE_ROUTE,
  TRADE_EDUCATION_RISK_TOPICS,
  tradeEducationRiskBodyKey,
  tradeEducationRiskTitleKey,
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

type TradeFirstVisitEducationSheetProps = {
  open: boolean;
  onDismiss: () => void;
};

/** First-visit trade risk education — fee · liquidation · RG (§32.5 · ui_only). */
export function TradeFirstVisitEducationSheet({
  open,
  onDismiss,
}: TradeFirstVisitEducationSheetProps) {
  const t = useT();

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onDismiss()}>
      <SheetContent
        className="gap-4"
        data-testid="trade-first-visit-education-sheet"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{t(TRADE_EDUCATION_I18N_KEYS.title)}</SheetTitle>
          <SheetDescription>{t(TRADE_EDUCATION_I18N_KEYS.lead)}</SheetDescription>
        </SheetHeader>

        <ul className="m-0 flex list-none flex-col gap-4 px-4">
          {TRADE_EDUCATION_RISK_TOPICS.map((topic) => (
            <li key={topic} className="border-line rounded-(--ds-radius-md) border p-3">
              <h3 className="text-foreground m-0 text-sm font-semibold">
                {t(tradeEducationRiskTitleKey(topic))}
              </h3>
              <p className="text-foreground-muted m-0 mt-2 text-sm leading-snug">
                {t(tradeEducationRiskBodyKey(topic))}
              </p>
            </li>
          ))}
        </ul>

        <div className="text-foreground-muted flex flex-col gap-2 px-4 text-sm">
          <Link
            to={TRADE_EDUCATION_RISK_DISCLOSURE_ROUTE}
            className="text-accent underline-offset-4 hover:underline"
            data-testid="trade-education-risk-link"
          >
            {t(TRADE_EDUCATION_I18N_KEYS.riskLink)}
          </Link>
          <Link
            to={TRADE_EDUCATION_RG_ROUTE}
            className="text-accent underline-offset-4 hover:underline"
            data-testid="trade-education-rg-link"
          >
            {t(TRADE_EDUCATION_I18N_KEYS.rgLink)}
          </Link>
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            data-testid="trade-education-dismiss"
            onClick={onDismiss}
          >
            {t(TRADE_EDUCATION_I18N_KEYS.dismiss)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
