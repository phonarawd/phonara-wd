/**
 * P2-D synthetic book disclosure — reference order book header + house-counterparty confirm ack.
 * Display-only book (`rpc_get_synthetic_book`); fills are house-settled (Engine Wave CLOB defer).
 */

import type { MessageKey } from '@phonara/i18n';

/** Order book panel + confirm ack i18n keys (Zone B · beginner-language canon). */
export const TRADE_SYNTHETIC_BOOK_DISCLOSURE_I18N_KEYS = [
  'trade.orderbook.referenceDisclosure',
  'trade.orderbook.syntheticActive',
  'trade.orderbook.houseCounterpartyDisclosure',
  'trade.houseCounterpartyAckCta',
  'trade.houseCounterpartyConfirmNotice',
] as const satisfies readonly MessageKey[];

export type TradeSyntheticBookDisclosureI18nKey =
  (typeof TRADE_SYNTHETIC_BOOK_DISCLOSURE_I18N_KEYS)[number];

/** Submit/confirm blocked until one-time house-counterparty ack (mirrors high-leverage riskAck gate). */
export function resolveHouseCounterpartySubmitBlocked(acknowledged: boolean): boolean {
  return !acknowledged;
}
