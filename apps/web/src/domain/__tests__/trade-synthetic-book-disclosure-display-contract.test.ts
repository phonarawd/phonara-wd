import { describe, expect, it } from 'vitest';

import {
  resolveHouseCounterpartySubmitBlocked,
  TRADE_SYNTHETIC_BOOK_DISCLOSURE_I18N_KEYS,
} from '@/domain/trade-synthetic-book-disclosure-display-contract';
import {
  resolveFuturesOrderSubmitDisabled,
  resolveSpotOrderSubmitDisabled,
} from '@/domain/trade-submit-display-contract';

describe('trade-synthetic-book-disclosure-display-contract', () => {
  it('exports order book + confirm ack i18n keys', () => {
    expect(TRADE_SYNTHETIC_BOOK_DISCLOSURE_I18N_KEYS).toContain(
      'trade.orderbook.houseCounterpartyDisclosure',
    );
    expect(TRADE_SYNTHETIC_BOOK_DISCLOSURE_I18N_KEYS).toContain('trade.houseCounterpartyAckCta');
  });

  it('blocks submit until house-counterparty ack', () => {
    expect(resolveHouseCounterpartySubmitBlocked(false)).toBe(true);
    expect(resolveHouseCounterpartySubmitBlocked(true)).toBe(false);
  });

  it('gates spot and futures submit disabled when ack missing (P2-D DoD #6)', () => {
    const spotReady = {
      busy: false,
      orderType: 'market' as const,
      estimate: '1',
      orderPricesReady: true,
      submitBlocked: false,
      submitBlockedReason: null,
      houseCounterpartyAcknowledged: false,
    };
    expect(resolveSpotOrderSubmitDisabled(spotReady)).toBe(true);
    expect(
      resolveSpotOrderSubmitDisabled({ ...spotReady, houseCounterpartyAcknowledged: true }),
    ).toBe(false);

    const futuresReady = {
      busy: false,
      walletLoading: false,
      marginModeBusy: false,
      orderType: 'market' as const,
      preview: { openFee: '0' },
      orderPricesReady: true,
      submitBlocked: false,
      submitBlockedReason: null,
      isHighLeverage: false,
      riskAcknowledged: true,
      insufficientAvail: false,
      houseCounterpartyAcknowledged: false,
    };
    expect(resolveFuturesOrderSubmitDisabled(futuresReady)).toBe(true);
    expect(
      resolveFuturesOrderSubmitDisabled({ ...futuresReady, houseCounterpartyAcknowledged: true }),
    ).toBe(false);
  });
});
