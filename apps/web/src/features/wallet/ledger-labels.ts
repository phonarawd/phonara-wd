import type { MessageKey } from '@phonara/i18n';

const LEDGER_REASON_KEYS: Record<string, MessageKey> = {
  affiliate_commission_payout: 'ledger.reason.affiliateCommission',
  daily_claim: 'ledger.reason.dailyClaim',
  futures_margin_lock: 'ledger.reason.futuresMarginLock',
  futures_margin_unlock: 'ledger.reason.futuresMarginUnlock',
  futures_open_fee: 'ledger.reason.futuresOpenFee',
  futures_pnl: 'ledger.reason.futuresPnl',
  game_bet_lock: 'ledger.reason.gameBetLock',
  game_bet_refund: 'ledger.reason.gameBetRefund',
  game_payout: 'ledger.reason.gamePayout',
  insurance_capital_contribution: 'ledger.reason.insuranceCapitalContribution',
  roulette_spin: 'ledger.reason.rouletteSpin',
  spot_buy_pay: 'ledger.reason.spotBuyPay',
  spot_buy_recv: 'ledger.reason.spotBuyReceive',
  spot_sell_pay: 'ledger.reason.spotSellPay',
  spot_sell_recv: 'ledger.reason.spotSellReceive',
  staking_lock: 'ledger.reason.stakingLock',
  staking_reward: 'ledger.reason.stakingReward',
  staking_unlock: 'ledger.reason.stakingUnlock',
  welcome_bonus: 'ledger.reason.welcomeBonus',
  withdrawal_request_lock: 'ledger.reason.withdrawalRequestLock',
};

export function ledgerReasonLabelKey(reasonCode: string | null | undefined): MessageKey {
  return reasonCode
    ? (LEDGER_REASON_KEYS[reasonCode] ?? 'ledger.reason.system')
    : 'ledger.reason.system';
}
