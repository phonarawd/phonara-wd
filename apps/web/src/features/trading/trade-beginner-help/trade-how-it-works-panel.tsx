import {
  findTradeHowItWorksSlot,
  type TradeHowItWorksSlot,
} from '@/domain/trade-beginner-language-display-contract';
import { HowItWorks } from '@/product/primitives/how-it-works';

export type TradeHowItWorksPanelProps = {
  slotId: TradeHowItWorksSlot['id'];
  className?: string;
};

/** §13.1.3 — contract-driven HowItWorks for spot · futures · staking desks. */
export function TradeHowItWorksPanel({ slotId, className }: TradeHowItWorksPanelProps) {
  const slot = findTradeHowItWorksSlot(slotId);
  if (!slot) return null;

  return (
    <div data-testid={`trade-how-it-works-${slotId}`}>
      <HowItWorks
        className={className}
        persistenceId={slot.persistenceId}
        titleKey={slot.titleKey}
        stepKeys={slot.stepKeys}
      />
    </div>
  );
}
