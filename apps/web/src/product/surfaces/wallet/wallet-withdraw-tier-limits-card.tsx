import type { WithdrawTierLimitsView } from '@/domain/wallet-money-policy-display';
import { useT } from '@/product/i18n';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';

export type WalletWithdrawTierLimitsCardProps = {
  tierLimits: WithdrawTierLimitsView;
};

/** §31.3 — current tier daily withdraw limit + next tier upgrade path. */
export function WalletWithdrawTierLimitsCard({ tierLimits }: WalletWithdrawTierLimitsCardProps) {
  const t = useT();

  return (
    <Card data-testid="wallet-withdraw-tier-limits">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('wallet.withdraw.tierLimits.title')}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-2 pt-0">
        <p
          className="text-foreground m-0 text-sm"
          data-testid="wallet-withdraw-tier-limits-current"
        >
          {t('wallet.withdraw.tierLimits.current', {
            tier: t(tierLimits.currentTierLabelKey),
            limit: t(tierLimits.currentLimitLabelKey),
          })}
        </p>
        {tierLimits.nextTier && tierLimits.nextTierLabelKey && tierLimits.nextLimitLabelKey ? (
          <p
            className="text-foreground-muted m-0 text-sm"
            data-testid="wallet-withdraw-tier-limits-next"
          >
            {t('wallet.withdraw.tierLimits.next', {
              tier: t(tierLimits.nextTierLabelKey),
              limit: t(tierLimits.nextLimitLabelKey),
            })}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
