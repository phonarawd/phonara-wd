import { ConfirmDialog } from '@phonara/ui';
import { PresentationRoot } from '../presentation-root';
import { ImportedWalletPage } from '../pages/wallet-page';
import { useWalletPageController } from '../../features/wallet/use-wallet-page-controller';
import { WalletActivityList } from '../../features/wallet/wallet-activity-list';

export function WalletLovableSurface() {
  const c = useWalletPageController();

  if (c.authLoading) {
    return (
      <PresentationRoot>
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true" data-testid="wallet-loading">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      <ImportedWalletPage
        walletLoading={c.walletLoading}
        tab={c.tab}
        onTabChange={c.onTabChange}
        heroBalanceDisplay={c.heroBalanceDisplay}
        phonAvailableDisplay={c.phonAvailableDisplay}
        phonLockedDisplay={c.phonLockedDisplay}
        usdtAvailableDisplay={c.usdtAvailableDisplay}
        krwAvailableDisplay={c.krwAvailableDisplay}
        depositReferenceDisplay={c.depositReferenceDisplay}
        depositExpectedPhonDisplay={c.depositExpectedPhonDisplay}
        showKycGate={c.showKycGate}
        kycVerified={c.kycVerified}
        withdrawalPaused={c.withdrawalPaused}
        withdrawAvailableDisplay={c.withdrawAvailableDisplay}
        copyDepositReference={c.copyDepositReference}
        depositAmount={c.depositAmount}
        onDepositAmountChange={c.onDepositAmountChange}
        depositPreviewDisplay={c.depositPreviewDisplay}
        showDepositRateFallback={c.showDepositRateFallback}
        canRequestDeposit={c.canRequestDeposit}
        busy={c.busy}
        onDepositSubmit={c.openDepositConfirm}
        withdrawAmount={c.withdrawAmount}
        onWithdrawAmountChange={c.onWithdrawAmountChange}
        withdrawAddress={c.withdrawAddress}
        onWithdrawAddressChange={c.setWithdrawAddress}
        onWithdrawSubmit={c.openWithdrawConfirm}
        showKycForm={c.showKycForm}
        onOpenKycForm={() => c.setShowKycForm(true)}
        kycLegalName={c.kycLegalName}
        onKycLegalNameChange={c.setKycLegalName}
        kycDocumentLast4={c.kycDocumentLast4}
        onKycDocumentLast4Change={c.setKycDocumentLast4}
        kycCountry={c.kycCountry}
        onKycCountryChange={c.setKycCountry}
        onKycSubmit={c.handleSubmitKyc}
        profileKycTier={c.profile?.kyc_tier ?? null}
      />
      <WalletActivityList />
      <ConfirmDialog
        open={c.depositConfirmOpen}
        title={c.t('wallet.deposit.confirmTitle')}
        description={c.t('wallet.deposit.confirmDesc')}
        rows={[
          {
            label: c.t('wallet.deposit.confirmAmount'),
            value: `${c.depositAmount || '0'} KRW`,
          },
          {
            label: c.t('wallet.deposit.confirmExpectedPhon'),
            value: c.depositPreviewDisplay ?? c.t('wallet.deposit.rateFallback'),
            wrap: true,
          },
        ]}
        confirmLabel={c.t('wallet.deposit.confirmProceed')}
        cancelLabel={c.t('common.cancel')}
        processingLabel={c.t('common.processing')}
        busy={c.busy}
        testId="wallet-deposit"
        onConfirm={() => void c.handleDeposit()}
        onCancel={c.closeDepositConfirm}
      />
      <ConfirmDialog
        open={c.withdrawConfirmOpen}
        title={c.t('wallet.withdraw.confirmTitle')}
        description={c.t('wallet.withdraw.confirmDesc')}
        rows={[
          { label: c.t('wallet.withdraw.confirmCurrency'), value: 'PHON' },
          { label: c.t('wallet.withdraw.confirmAmount'), value: c.withdrawAmountSummary, wrap: true },
          {
            label: c.t('wallet.withdraw.confirmFee'),
            value: c.t('wallet.withdraw.confirmFeeAtProcessing'),
            wrap: true,
          },
          {
            label: c.t('wallet.withdraw.confirmNet'),
            value: c.t('wallet.withdraw.confirmNetAtProcessing'),
            wrap: true,
          },
          {
            label: c.t('wallet.withdraw.confirmAddress'),
            value: c.withdrawAddress.trim() || '—',
            wrap: true,
          },
          {
            label: c.t('wallet.withdraw.confirmWarningLabel'),
            value: c.t('wallet.withdraw.confirmIrreversibleWarning'),
            tone: 'danger',
            wrap: true,
          },
        ]}
        confirmLabel={c.t('wallet.withdraw.confirmProceed')}
        cancelLabel={c.t('common.cancel')}
        processingLabel={c.t('common.processing')}
        tone="danger"
        busy={c.busy}
        confirmDisabled={!c.canRequestWithdraw}
        testId="wallet-withdraw"
        onConfirm={() => void c.handleWithdraw()}
        onCancel={c.closeWithdrawConfirm}
      />
    </PresentationRoot>
  );
}
