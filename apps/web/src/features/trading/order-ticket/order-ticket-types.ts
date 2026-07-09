import type { MarginMode } from '@/domain/trade-order-states-display-contract';

export type { MarginMode };

export type OrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit';

export interface OrderTicketFormState {
  marginMode: MarginMode;
  orderType: OrderType;
  side: 'long' | 'short';
  marginCurrency: 'USDT' | 'PHON';
  leverage: string;
  marginAmount: string;
  limitPrice?: string;
  stopPrice?: string;
  tpEnabled: boolean;
  tpPrice?: string;
  slEnabled: boolean;
  slPrice?: string;
}

export const DEFAULT_ORDER_TICKET_STATE: OrderTicketFormState = {
  marginMode: 'isolated',
  orderType: 'market',
  side: 'long',
  marginCurrency: 'USDT',
  leverage: '10',
  marginAmount: '',
  tpEnabled: false,
  slEnabled: false,
};
