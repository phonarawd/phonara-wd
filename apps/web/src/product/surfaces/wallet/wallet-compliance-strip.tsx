import type { MessageKey } from '@phonara/i18n';

import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

export interface WalletComplianceStripProps {
  kycStatusKey: MessageKey | null;
  withdrawalReady: boolean;
  loading: boolean;
  className?: string;
}

/** KYC / withdrawal readiness strip — rpc_get_compliance_status display only. */
export function WalletComplianceStrip({
  kycStatusKey,
  withdrawalReady,
  loading,
  className,
}: WalletComplianceStripProps) {
  const t = useT();

  if (loading) {
    return (
      <p className="text-foreground-muted m-0 text-sm" data-testid="wallet-compliance-loading">
        {t('wallet.compliance.loading')}
      </p>
    );
  }

  if (withdrawalReady && kycStatusKey === 'wallet.kyc.verified') {
    return (
      <p
        className={cn('text-accent m-0 text-sm font-medium', className)}
        data-testid="wallet-compliance-ready"
      >
        {t('wallet.compliance.ready')}
      </p>
    );
  }

  return (
    <div
      className={cn(
        'border-line bg-surface rounded-(--ds-radius-md) space-y-2 border p-4',
        className,
      )}
      data-testid="wallet-compliance-strip"
    >
      <p className="text-foreground m-0 text-sm font-semibold">{t('wallet.compliance.title')}</p>
      {kycStatusKey ? <p className="text-foreground-muted m-0 text-sm">{t(kycStatusKey)}</p> : null}
      {!withdrawalReady ? (
        <>
          <p className="text-foreground-muted m-0 text-sm">{t('wallet.compliance.intro')}</p>
          <a
            href="/account/kyc"
            className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'inline-flex')}
            data-testid="wallet-compliance-kyc-cta"
          >
            {t('wallet.withdraw.kycCta')}
          </a>
        </>
      ) : null}
    </div>
  );
}
