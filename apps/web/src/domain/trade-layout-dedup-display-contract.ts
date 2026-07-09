/**
 * Trade layout dedup gate — P9 WORLD step 25 surface owner list.
 * Registry + assert: trade-exchange-parity-display-contract.ts
 */

export {
  assertTradeLayoutDedupContractSync,
  P9_TRADE_LAYOUT_DEDUP_GATE_TODO,
} from './trade-exchange-parity-display-contract';

export const TRADE_LAYOUT_DEDUP_SURFACE_OWNERS = [
  'futures-desk-page.tsx',
  'spot-desk-page.tsx',
  'trade-desk-bottom-dock.tsx',
  'trade-desk-mobile-tabs.tsx',
  'futures-positions-page.tsx',
  'futures-orders-page.tsx',
] as const;
