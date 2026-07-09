import type { HouseCounterpartyAcknowledgement } from '@/features/trading/use-house-counterparty-acknowledgement';
import { Button } from '@/product/primitives/button';

type TradeHouseCounterpartyAckButtonProps = {
  ack: HouseCounterpartyAcknowledgement;
  t: (key: 'trade.houseCounterpartyAckCta') => string;
};

/** Inline ack CTA — mirrors high-leverage `trading-risk-ack` pattern (P2-D). */
export function TradeHouseCounterpartyAckButton({ ack, t }: TradeHouseCounterpartyAckButtonProps) {
  if (ack.loading || ack.acknowledged) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-testid="house-counterparty-ack"
      disabled={ack.busy}
      onClick={() => void ack.acknowledge()}
    >
      {t('trade.houseCounterpartyAckCta')}
    </Button>
  );
}
