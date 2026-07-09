import {
  findTradeHelpTerm,
  type TradeHelpTermId,
} from '@/domain/trade-beginner-language-display-contract';
import { useT } from '@/product/i18n';
import { HelpTip } from '@/product/primitives/help-tip';

export type TradeHelpTipProps = {
  termId: TradeHelpTermId;
  className?: string;
};

/** §13.1.3 — contract-driven HelpTip wired to `trade.help.{term}.*` i18n. */
export function TradeHelpTip({ termId, className }: TradeHelpTipProps) {
  const t = useT();
  const term = findTradeHelpTerm(termId);
  if (!term) return null;

  return (
    <span data-testid={`trade-help-tip-${termId}`}>
      <HelpTip label={t(term.labelKey)} bodyKey={term.bodyKey} className={className} />
    </span>
  );
}
