import type { SubnavItem } from './earn-subnav';

/** Wallet money-rails chrome — §12.19. */
export const WALLET_SUBNAV: readonly SubnavItem[] = [
  { labelKey: 'wallet.subnav.overview', to: '/wallet', end: true },
  { labelKey: 'wallet.subnav.deposit', to: '/wallet/deposit' },
  { labelKey: 'wallet.subnav.withdraw', to: '/wallet/withdraw' },
  { labelKey: 'wallet.subnav.transfer', to: '/wallet/transfer' },
  { labelKey: 'wallet.subnav.redeem', to: '/wallet/redeem' },
  { labelKey: 'wallet.subnav.ledger', to: '/ledger', end: true },
] as const;
